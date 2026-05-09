/**
 * Rate limit middleware helpers for Next.js routes
 */

import { NextResponse } from 'next/server'
import { checkRateLimit } from './rate-limiter'
import type { DatabaseConfig, RateLimitConfig, RateLimitResult } from './types'

/**
 * Create a 429 Too Many Requests response with proper headers
 *
 * @param result - Rate limit result from checkRateLimit
 * @returns NextResponse with 429 status and rate limit headers
 */
export function rateLimitExceededResponse(result: RateLimitResult): NextResponse {
  const resetDate = new Date(result.resetAt)
  const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000)

  return NextResponse.json(
    {
      error: {
        code: 'RATE_LIMITED',
        message: `Too many requests. Try again in ${retryAfter} seconds.`,
      },
      retryAfter,
      resetAt: resetDate.toISOString(),
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': '0',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': resetDate.toISOString(),
        'Retry-After': retryAfter.toString(),
      },
    }
  )
}

/**
 * Middleware helper that checks rate limit and returns 429 if exceeded
 *
 * @param config - Database configuration
 * @param userId - User ID to rate limit
 * @param rateLimitConfig - Rate limit configuration
 * @returns null if allowed, NextResponse (429) if rate limited
 *
 * @example
 * ```typescript
 * const rateLimitResponse = await withRateLimit(dbConfig, user.id, {
 *   action: 'api_call',
 *   maxRequests: 60,
 *   windowSeconds: 60
 * })
 *
 * if (rateLimitResponse) {
 *   return rateLimitResponse // 429 Too Many Requests
 * }
 *
 * // Continue with normal processing
 * ```
 */
export async function withRateLimit(
  config: DatabaseConfig,
  userId: string,
  rateLimitConfig: RateLimitConfig
): Promise<NextResponse | null> {
  const result = await checkRateLimit(config, userId, rateLimitConfig)

  if (!result.allowed) {
    return rateLimitExceededResponse(result)
  }

  return null
}

/**
 * Get rate limit headers to add to successful responses
 *
 * @param result - Rate limit result from checkRateLimit
 * @returns Headers object with X-RateLimit-* headers
 *
 * @example
 * ```typescript
 * const result = await checkRateLimit(...)
 * if (result.allowed) {
 *   return NextResponse.json(
 *     { data },
 *     { headers: getRateLimitHeaders(result) }
 *   )
 * }
 * ```
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const resetDate = new Date(result.resetAt)

  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': resetDate.toISOString(),
  }
}
