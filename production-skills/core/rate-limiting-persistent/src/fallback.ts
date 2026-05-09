/**
 * In-memory fallback rate limiter
 * Used when database is unavailable
 */

import type { RateLimitConfig, RateLimitResult } from './types'

// In-memory store for fallback
const fallbackStore = new Map<string, { count: number; resetAt: number }>()

/**
 * Check rate limit using in-memory fallback
 *
 * @param key - Rate limit key (e.g., "generation:user-123")
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkFallbackRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const windowMs = config.windowSeconds * 1000
  const entry = fallbackStore.get(key)

  // No entry or window expired - start new window
  if (!entry || entry.resetAt < now) {
    const resetAt = now + windowMs
    fallbackStore.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: config.maxRequests - 1, resetAt }
  }

  // Within window - check limit
  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  // Increment and allow
  entry.count++
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Cleanup expired entries in fallback store
 */
export function cleanupFallbackStore(): void {
  const now = Date.now()
  for (const [key, entry] of fallbackStore.entries()) {
    if (entry.resetAt < now) {
      fallbackStore.delete(key)
    }
  }
}

// Cleanup fallback store every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupFallbackStore, 5 * 60 * 1000)
}
