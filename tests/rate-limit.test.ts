import { throttle, resetRateLimits, FAVORITE_TOGGLE_COOLDOWN_MS } from "@/lib/rate-limit"

describe("throttle — min-interval rate limiter", () => {
  beforeEach(() => {
    resetRateLimits()
  })

  test("allows the first call for a key", () => {
    expect(throttle("key", 1000)).toEqual({ allowed: true })
  })

  test("blocks a second call within the interval", () => {
    throttle("key", 1000)
    const res = throttle("key", 1000)

    expect(res.allowed).toBe(false)
    if (!res.allowed) {
      expect(res.retryAfterMs).toBeGreaterThan(0)
      expect(res.retryAfterMs).toBeLessThanOrEqual(1000)
    }
  })

  test("allows again after the interval elapses", () => {
    jest.useFakeTimers()
    try {
      throttle("key", 1000)
      jest.advanceTimersByTime(1001)
      expect(throttle("key", 1000)).toEqual({ allowed: true })
    } finally {
      jest.useRealTimers()
    }
  })

  test("tracks each key separately", () => {
    throttle("a", 1000)
    expect(throttle("b", 1000)).toEqual({ allowed: true })
  })

  test("favorite toggle cooldown is 2 seconds", () => {
    expect(FAVORITE_TOGGLE_COOLDOWN_MS).toBe(2000)
  })
})