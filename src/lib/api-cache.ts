/**
 * Simple in-memory cache with stale-while-revalidate semantics.
 *
 * - `maxAge`: how long a response is considered fresh (seconds).
 * - `staleWhileRevalidate`: how long a stale response is still served while
 *   a background revalidation happens (seconds).
 *
 * Each entry stores { data, timestamp }. On lookup:
 *   - if fresh → hit (no revalidation needed)
 *   - if stale but within SWR window → return stale data + mark as needing revalidation
 *   - if expired → miss
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface CacheLookupResult<T> {
  data: T | null;
  isStale: boolean;
  needsRevalidation: boolean;
}

export class ApiCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private maxAge: number;
  private staleWhileRevalidate: number;

  constructor(maxAgeSec = 30, staleWhileRevalidateSec = 300) {
    this.maxAge = maxAgeSec * 1000;
    this.staleWhileRevalidate = staleWhileRevalidateSec * 1000;
  }

  /** Generate a deterministic cache key from the request URL (without protocol/host). */
  static keyFromUrl(url: string): string {
    const parsed = new URL(url);
    return parsed.pathname + parsed.search;
  }

  get<T>(key: string): CacheLookupResult<T> {
    const entry = this.store.get(key);
    if (!entry) {
      return { data: null, isStale: false, needsRevalidation: true };
    }

    const age = Date.now() - entry.timestamp;

    if (age <= this.maxAge) {
      // Fresh
      return { data: entry.data as T, isStale: false, needsRevalidation: false };
    }

    if (age <= this.maxAge + this.staleWhileRevalidate) {
      // Stale but within SWR window — serve stale, trigger background revalidation
      return { data: entry.data as T, isStale: true, needsRevalidation: true };
    }

    // Expired
    this.store.delete(key);
    return { data: null, isStale: false, needsRevalidation: true };
  }

  set<T>(key: string, data: T): void {
    this.store.set(key, { data, timestamp: Date.now() });
  }

  /** Purge entries older than maxAge + staleWhileRevalidate */
  cleanup(): void {
    const cutoff = Date.now() - this.maxAge - this.staleWhileRevalidate;
    for (const [key, entry] of this.store.entries()) {
      if (entry.timestamp < cutoff) {
        this.store.delete(key);
      }
    }
  }
}

// Singleton — shared across requests in the same process
export const servicesCache = new ApiCache(
  30,   // fresh for 30 seconds
  300,  // serve stale for up to 5 minutes while revalidating
);

// Cleanup every 5 minutes
setInterval(() => servicesCache.cleanup(), 300_000);
