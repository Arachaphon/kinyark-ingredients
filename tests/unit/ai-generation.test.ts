/**
 * AI Recipe Generation Module (SRS: ระบบสร้างสูตรด้วย AI)
 * Covers: per-user daily rate limit (same in-memory pattern as
 * rate-limit.test.ts) and timeout handling with a clear retry message.
 *
 * Implementation: src/lib/services/ai-generation.service.ts (no network).
 */

import {
  AI_QUOTA_EXCEEDED_MESSAGE,
  AI_TIMEOUT_MESSAGE,
  checkAiDailyQuota,
  requestAiGeneration,
  resetAiDailyQuota,
} from "@/lib/services/ai-generation.service";

const USER = "user-1";

beforeEach(() => {
  resetAiDailyQuota();
  jest.useRealTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("AI Generation — daily rate limit", () => {
  test("ใช้งานภายใต้โควต้า → อนุญาต (remaining ลดลง)", async () => {
    const first = checkAiDailyQuota(USER, 2);
    expect(first).toMatchObject({ allowed: true, remaining: 2 });

    const ok = await requestAiGeneration({
      userId: USER,
      maxPerDay: 2,
      task: () => Promise.resolve("menu"),
    });
    expect(ok).toEqual({ ok: true, data: "menu" });
    expect(checkAiDailyQuota(USER, 2).remaining).toBe(1);
  });

  test("เกินโควต้าวัน → บล็อกพร้อม retryAfterMs และข้อความชัดเจน", async () => {
    await requestAiGeneration({ userId: USER, maxPerDay: 1, task: () => Promise.resolve("x") });
    const blocked = await requestAiGeneration({
      userId: USER,
      maxPerDay: 1,
      task: () => Promise.resolve("x"),
    });

    expect(blocked).toEqual({
      ok: false,
      error: AI_QUOTA_EXCEEDED_MESSAGE,
      retryable: false,
    });
    if (!blocked.ok) {
      expect(typeof blocked.error).toBe("string");
    }
    const check = checkAiDailyQuota(USER, 1);
    expect(check.allowed).toBe(false);
    expect(check.retryAfterMs).toBeGreaterThan(0);
  });

  test("ขึ้นวันใหม่ → โควต้ารีเซ็ต", async () => {
    jest.useFakeTimers();
    await requestAiGeneration({ userId: USER, maxPerDay: 1, task: () => Promise.resolve("x") });
    expect(checkAiDailyQuota(USER, 1).allowed).toBe(false);

    jest.setSystemTime(Date.now() + 24 * 60 * 60 * 1000 + 1000);
    expect(checkAiDailyQuota(USER, 1)).toMatchObject({ allowed: true, remaining: 1 });
  });
});

describe("AI Generation — timeout handling", () => {
  test("AI ตอบช้าเกิน timeout → ข้อความชัดเจน + retryable (ไม่ crash)", async () => {
    const hanging = new Promise<string>(() => {});
    const result = await requestAiGeneration({
      userId: USER,
      task: () => hanging,
      timeoutMs: 30,
    });

    expect(result).toEqual({
      ok: false,
      error: AI_TIMEOUT_MESSAGE,
      retryable: true,
    });
  });

  test("AI throw error ทั่วไป → ข้อความกลาง + retryable", async () => {
    const result = await requestAiGeneration({
      userId: USER,
      task: () => Promise.reject(new Error("fetch failed")),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.retryable).toBe(true);
      expect(result.error).toMatch(/ลองใหม่/);
    }
  });
});
