/**
 * Minimal-interval throttle (anti-spam) for mutating endpoints.
 * In-memory per-process store — good enough as an MVP backstop;
 * resets on serverless cold start / new instance.
 */

const FAVORITE_TOGGLE_COOLDOWN_MS = 2000
const AI_GENERATE_COOLDOWN_MS = 5000

const lastHit = new Map<string, number>()

export type ThrottleResult =
  | { allowed: true }
  | { allowed: false; retryAfterMs: number }

/**
 * Allow at most one hit per `minIntervalMs` for the given key.
 * Keys are typically `resource:userId` or `resource:userId:recipeId`.
 */
export function throttle(key: string, minIntervalMs: number): ThrottleResult {
  const now = Date.now()
  const last = lastHit.get(key) ?? 0
  const elapsed = now - last

  if (last !== 0 && elapsed < minIntervalMs) {
    return { allowed: false, retryAfterMs: minIntervalMs - elapsed }
  }

  lastHit.set(key, now)
  return { allowed: true }
}

/** Clear all tracked timestamps (used in tests). */
export function resetRateLimits(): void {
  lastHit.clear()
}

export { FAVORITE_TOGGLE_COOLDOWN_MS, AI_GENERATE_COOLDOWN_MS }