/**
 * AI Recipe Generation guard (SRS: AI Recipe Generation Module).
 * Same in-memory throttle pattern as src/lib/rate-limit.ts, but with a
 * per-user DAILY quota plus timeout handling that returns a clear,
 * retryable message instead of crashing the UI.
 */

export const AI_DAILY_GENERATION_LIMIT = 20;
export const AI_GENERATION_TIMEOUT_MS = 60_000;

export const AI_QUOTA_EXCEEDED_MESSAGE =
  "คุณใช้งาน AI ครบโควต้าวันนี้แล้ว กรุณาลองใหม่พรุ่งนี้";
export const AI_TIMEOUT_MESSAGE =
  "AI หมดเวลาตอบสนอง กรุณากดลองใหม่อีกครั้ง";
export const AI_GENERIC_FAILURE_MESSAGE =
  "สร้างสูตรไม่สำเร็จ กรุณากดลองใหม่อีกครั้ง";

export class AiTimeoutError extends Error {
  readonly code = "AI_TIMEOUT" as const;
  readonly retryable = true as const;
  constructor(message: string = AI_TIMEOUT_MESSAGE) {
    super(message);
    this.name = "AiTimeoutError";
  }
}

interface DailyUsage {
  day: string;
  count: number;
}

const dailyUsage = new Map<string, DailyUsage>();

function todayKey(now: number = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10); // UTC day: YYYY-MM-DD
}

function msUntilMidnightUtc(now: number = Date.now()): number {
  const d = new Date(now);
  const midnight = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate() + 1,
  );
  return midnight - now;
}

export interface QuotaCheck {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/** Check (but do not consume) the user's daily AI quota. */
export function checkAiDailyQuota(
  userId: string,
  maxPerDay: number = AI_DAILY_GENERATION_LIMIT,
): QuotaCheck {
  const day = todayKey();
  const entry = dailyUsage.get(userId);
  const count = entry && entry.day === day ? entry.count : 0;
  if (count >= maxPerDay) {
    return { allowed: false, remaining: 0, retryAfterMs: msUntilMidnightUtc() };
  }
  return { allowed: true, remaining: maxPerDay - count, retryAfterMs: 0 };
}

/** Consume one unit of the user's daily AI quota. */
export function consumeAiDailyQuota(userId: string): void {
  const day = todayKey();
  const entry = dailyUsage.get(userId);
  if (entry && entry.day === day) entry.count += 1;
  else dailyUsage.set(userId, { day, count: 1 });
}

/** Clear all tracked quotas (used in tests). */
export function resetAiDailyQuota(): void {
  dailyUsage.clear();
}

/** Race a task against a timeout — timeouts become AiTimeoutError. */
export function runWithTimeout<T>(
  task: Promise<T>,
  ms: number = AI_GENERATION_TIMEOUT_MS,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new AiTimeoutError()), ms);
    if (typeof (timer as unknown as { unref?: unknown }).unref === "function") {
      (timer as unknown as { unref: () => void }).unref();
    }
  });
  return Promise.race([task, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

export type AiGenerationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; retryable: boolean };

/**
 * Full guard: quota → consume → run with timeout → friendly result union.
 * Never throws for quota/timeout/provider failures — the UI gets a
 * message it can show with a retry button.
 */
export async function requestAiGeneration<T>(options: {
  userId: string;
  task: () => Promise<T>;
  timeoutMs?: number;
  maxPerDay?: number;
}): Promise<AiGenerationResult<T>> {
  const maxPerDay = options.maxPerDay ?? AI_DAILY_GENERATION_LIMIT;
  const quota = checkAiDailyQuota(options.userId, maxPerDay);
  if (!quota.allowed) {
    return { ok: false, error: AI_QUOTA_EXCEEDED_MESSAGE, retryable: false };
  }
  consumeAiDailyQuota(options.userId);
  try {
    const data = await runWithTimeout(
      options.task(),
      options.timeoutMs ?? AI_GENERATION_TIMEOUT_MS,
    );
    return { ok: true, data };
  } catch (error) {
    if (error instanceof AiTimeoutError) {
      return { ok: false, error: error.message, retryable: true };
    }
    return { ok: false, error: AI_GENERIC_FAILURE_MESSAGE, retryable: true };
  }
}
