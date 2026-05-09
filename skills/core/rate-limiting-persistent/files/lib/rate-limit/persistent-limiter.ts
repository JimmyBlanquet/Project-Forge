/**
 * Persistent Rate Limiter using Supabase
 *
 * Uses PostgreSQL function for atomic rate limit checks.
 * Survives serverless cold starts and deployments.
 *
 * Fallback: In-memory limiter if Supabase call fails
 */

import { createClient } from '@/lib/supabase/server'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number // Unix timestamp in ms
}

export interface RateLimitConfig {
  /** Action identifier (e.g., "generation", "classification") */
  action: string
  /** Maximum requests allowed in window */
  maxRequests: number
  /** Window duration in seconds */
  windowSeconds: number
}

// In-memory fallback for when Supabase is unavailable
const fallbackStore = new Map<string, { count: number; resetAt: number }>()

/**
 * Check rate limit using Supabase persistent storage
 *
 * @param userId - User ID to rate limit
 * @param config - Rate limit configuration
 * @returns Rate limit status
 *
 * @example
 * ```typescript
 * const result = await checkRateLimit(userId, {
 *   action: 'generation',
 *   maxRequests: 10,
 *   windowSeconds: 60
 * })
 *
 * if (!result.allowed) {
 *   return apiError('RATE_LIMITED')
 * }
 * ```
 */
export async function checkRateLimit(
  userId: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `${config.action}:${userId}`

  try {
    const supabase = await createClient()

    // Call atomic PostgreSQL function
    const { data, error } = await (supabase as any).rpc('increment_rate_limit', {
      p_key: key,
      p_max_requests: config.maxRequests,
      p_window_seconds: config.windowSeconds,
    })

    if (error) {
      console.error('[RateLimit] Supabase error, using fallback:', error.message)
      return checkFallbackRateLimit(key, config)
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      console.error('[RateLimit] No data returned, using fallback')
      return checkFallbackRateLimit(key, config)
    }

    const result = data[0] as { allowed: boolean; remaining: number; reset_at: string }
    return {
      allowed: result.allowed,
      remaining: result.remaining,
      resetAt: new Date(result.reset_at).getTime(),
    }
  } catch (err) {
    console.error('[RateLimit] Exception, using fallback:', err)
    return checkFallbackRateLimit(key, config)
  }
}

/**
 * Fallback in-memory rate limiter
 * Used when Supabase is unavailable
 */
function checkFallbackRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const windowMs = config.windowSeconds * 1000
  const entry = fallbackStore.get(key)

  // No entry or window expired
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

// Pre-configured rate limiters for common use cases
// Add your project-specific rate limiters here following these examples:

/**
 * Example: Rate limit for API endpoints
 * 60 requests per minute (standard API rate limit)
 *
 * Usage:
 * export async function checkApiRateLimit(userId: string): Promise<RateLimitResult> {
 *   return checkRateLimit(userId, {
 *     action: 'api',
 *     maxRequests: 60,
 *     windowSeconds: 60,
 *   })
 * }
 */

/**
 * Example: Rate limit for expensive AI operations
 * 10 requests per minute
 *
 * Usage:
 * export async function checkAIRateLimit(userId: string): Promise<RateLimitResult> {
 *   return checkRateLimit(userId, {
 *     action: 'ai_generation',
 *     maxRequests: 10,
 *     windowSeconds: 60,
 *   })
 * }
 */

/**
 * Example: Rate limit for read operations
 * 100 requests per minute (higher for reads)
 *
 * Usage:
 * export async function checkReadRateLimit(userId: string): Promise<RateLimitResult> {
 *   return checkRateLimit(userId, {
 *     action: 'read',
 *     maxRequests: 100,
 *     windowSeconds: 60,
 *   })
 * }
 */

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
