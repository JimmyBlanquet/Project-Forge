/**
 * Pre-configured rate limiters for common use cases
 */

import { checkRateLimit } from './rate-limiter'
import type { DatabaseConfig, RateLimitResult } from './types'

/**
 * Rate limit for AI content generation (expensive operation)
 * 10 requests per minute
 */
export async function checkGenerationRateLimit(
  config: DatabaseConfig,
  userId: string
): Promise<RateLimitResult> {
  return checkRateLimit(config, userId, {
    action: 'generation',
    maxRequests: 10,
    windowSeconds: 60,
  })
}

/**
 * Rate limit for AI classification (read-only, less expensive)
 * 30 requests per minute
 */
export async function checkClassificationRateLimit(
  config: DatabaseConfig,
  userId: string
): Promise<RateLimitResult> {
  return checkRateLimit(config, userId, {
    action: 'classification',
    maxRequests: 30,
    windowSeconds: 60,
  })
}

/**
 * Rate limit for suggestion generation
 * 20 requests per minute
 */
export async function checkSuggestionRateLimit(
  config: DatabaseConfig,
  userId: string
): Promise<RateLimitResult> {
  return checkRateLimit(config, userId, {
    action: 'suggestion',
    maxRequests: 20,
    windowSeconds: 60,
  })
}

/**
 * Rate limit for CRUD operations
 * 60 requests per minute
 */
export async function checkCrudRateLimit(
  config: DatabaseConfig,
  userId: string
): Promise<RateLimitResult> {
  return checkRateLimit(config, userId, {
    action: 'crud',
    maxRequests: 60,
    windowSeconds: 60,
  })
}
