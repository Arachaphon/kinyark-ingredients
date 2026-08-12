/**
 * Lightweight in-memory TTL cache.
 * Lives in the Node.js process — instant reads, no network.
 * Each entry expires automatically after `ttlMs` milliseconds.
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

class TTLCache {
  private store = new Map<string, CacheEntry<unknown>>()

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

  /** Write a value with the given TTL in milliseconds. */
  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs })
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
export const TTL_RECIPES_LIST      = 30_000  // public recipe list: 30s
export const TTL_RECIPES_MINE      = 15_000  // my recipes list: 15s
export const TTL_RECOMMENDED = 120_000       // recommended: 2 min
export const TTL_RATINGS     = 30_000        // recipe ratings: 30s
export const TTL_INGREDIENTS = 300_000       // ingredients: 5 min
