/**
 * Persistent rate limiter using Supabase/PostgreSQL
 *
 * Uses atomic PostgreSQL function for rate limit checks.
 * Falls back to in-memory if database unavailable.
 */

import { createClient } from '@supabase/supabase-js'
import type { DatabaseConfig, RateLimitConfig, RateLimitResult } from './types'
import { checkFallbackRateLimit } from './fallback'

/**
 * Check rate limit using database persistent storage
 *
 * @param config - Database configuration
 * @param userId - User ID to rate limit
 * @param rateLimitConfig - Rate limit configuration
 * @returns Rate limit status
 *
 * @example
 * ```typescript
 * const result = await checkRateLimit(dbConfig, userId, {
 *   action: 'generation',
 *   maxRequests: 10,
 *   windowSeconds: 60
 * })
 *
 * if (!result.allowed) {
 *   return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
 * }
 * ```
 */
export async function checkRateLimit(
  config: DatabaseConfig,
  userId: string,
  rateLimitConfig: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `${rateLimitConfig.action}:${userId}`

  try {
    const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey)

    // Call atomic PostgreSQL function
    const { data, error } = await supabase.rpc('increment_rate_limit', {
      p_key: key,
      p_max_requests: rateLimitConfig.maxRequests,
      p_window_seconds: rateLimitConfig.windowSeconds,
    })

    if (error) {
      console.warn('[RateLimit] Database error, using fallback:', error.message)
      return checkFallbackRateLimit(key, rateLimitConfig)
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn('[RateLimit] No data returned, using fallback')
      return checkFallbackRateLimit(key, rateLimitConfig)
    }

    const result = data[0] as { allowed: boolean; remaining: number; reset_at: string }
    return {
      allowed: result.allowed,
      remaining: result.remaining,
      resetAt: new Date(result.reset_at).getTime(),
    }
  } catch (err) {
    console.error('[RateLimit] Exception, using fallback:', err)
    return checkFallbackRateLimit(key, rateLimitConfig)
  }
}
