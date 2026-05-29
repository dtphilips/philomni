/**
 * Simple in-memory TTL cache for expensive Supabase queries.
 * Prevents refetching unchanged data on every page visit.
 *
 * Usage:
 *   import { fetchWithCache } from '@/lib/queryCache'
 *   const data = await fetchWithCache('music-tracks', () =>
 *     supabase.from('music_tracks').select('id, title, artist').limit(20).then(r => r.data)
 *   )
 */

const _cache = Object.create(null)

/**
 * Fetch with cache.
 * @param {string} key   - Cache key (must be unique per query + params)
 * @param {() => Promise<any>} fetchFn - Async function that returns data
 * @param {number} ttlMs - Time-to-live in ms (default 60s)
 */
export async function fetchWithCache(key, fetchFn, ttlMs = 60_000) {
  const entry = _cache[key]
  if (entry && Date.now() - entry.ts < ttlMs) {
    return entry.data
  }
  const data = await fetchFn()
  _cache[key] = { data, ts: Date.now() }
  return data
}

/** Remove a specific cache entry (e.g. after mutation). */
export function invalidateCache(key) {
  delete _cache[key]
}

/** Remove all cache entries whose key starts with the given prefix. */
export function invalidateCachePrefix(prefix) {
  Object.keys(_cache).forEach(k => { if (k.startsWith(prefix)) delete _cache[k] })
}

/** Nuke the entire cache. */
export function clearCache() {
  Object.keys(_cache).forEach(k => delete _cache[k])
}
