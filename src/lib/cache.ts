/**
 * Lightweight in-memory TTL cache.
 * Lives in the Node.js process — instant reads, no network.
 * Each entry expires automatically after `ttlMs` milliseconds.
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
  staleAt: number
}

class TTLCache {
  private store = new Map<string, CacheEntry<unknown>>()
  private inflight = new Map<string, Promise<unknown>>()

  /** Read a cached value. Returns undefined if missing or expired. */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return undefined
    }
    return entry.value as T
  }

  /** Write a value with the given TTL in milliseconds.
   * `staleMs` extends serving past expiry (stale-while-revalidate). */
  set<T>(key: string, value: T, ttlMs: number, staleMs = 0): void {
    const now = Date.now()
    this.store.set(key, { value, expiresAt: now + ttlMs, staleAt: now + ttlMs + staleMs })
  }

  /**
   * Stale-while-revalidate read.
   * Fresh hit → return immediately. Stale hit → return stale now and refresh
   * in the background (failures keep the stale value). Miss → await loader
   * once even when concurrent requests race (single-flight).
   */
  async getOrSet<T>(key: string, ttlMs: number, staleMs: number, loader: () => Promise<T>): Promise<T> {
    const now = Date.now()
    const entry = this.store.get(key) as CacheEntry<T> | undefined
    if (entry && now <= entry.expiresAt) return entry.value
    const running = this.inflight.get(key) as Promise<T> | undefined
    if (entry && now <= entry.staleAt) {
      if (!running) {
        const refresh = loader().then(
          (fresh) => {
            this.set(key, fresh, ttlMs, staleMs)
            this.inflight.delete(key)
          },
          () => {
            this.inflight.delete(key)
          },
        )
        this.inflight.set(key, refresh)
      }
      return entry.value
    }
    if (running) return running
    const pending = loader()
    this.inflight.set(key, pending)
    try {
      const fresh = await pending
      this.set(key, fresh, ttlMs, staleMs)
      return fresh
    } finally {
      if (this.inflight.get(key) === pending) this.inflight.delete(key)
    }
  }

  /** Immediately remove one key. Call on mutations (PATCH, DELETE). */
  del(key: string): void {
    this.store.delete(key)
  }

  /** Remove all keys matching a prefix. */
  delPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key)
    }
  }
}

// Singleton — shared across all requests in the same Node.js process.
export const cache = new TTLCache()

// TTL constants
export const TTL_RECIPE      = 60_000        // recipe detail: 60s
export const TTL_FEATURED    = 300_000       // featured (anon): 5 min
export const TTL_RECIPES_LIST      = 90_000  // public recipe list: 90s (เดิม 30s — ลด DB hits ช่วงโหลดสูง; POST/PATCH/DELETE ล้าง cache เองอยู่แล้วเลยยังเห็นของใหม่ทันที)
export const TTL_RECIPES_MINE      = 15_000  // my recipes list: 15s
export const TTL_RECOMMENDED = 120_000       // recommended: 2 min
export const TTL_RATINGS     = 30_000        // recipe ratings: 30s
export const TTL_INGREDIENTS = 300_000       // ingredients: 5 min
export const TTL_SEARCH_ANON = 30_000       // anonymous search results: 30s

// Persistent markers stored inside SearchHistory.searchQuery.
export const REC_CACHE_PREFIX = "__rec_cache__:"   // per-user sticky recommendation payload
export const FEATURED_SEARCH_MARKER = "__featured__" // internal flag row
