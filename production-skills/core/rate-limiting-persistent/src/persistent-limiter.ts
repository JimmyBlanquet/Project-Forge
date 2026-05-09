/**
 * Persistent Rate Limiter with configurable storage backend
 *
 * Uses PostgreSQL function for atomic rate limit checks.
 * Survives serverless cold starts and deployments.
 *
 * Fallback: In-memory limiter if persistent storage fails
 */

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

/**
 * Storage provider interface for rate limiting
 * Implement this for different backends (Supabase, Redis, etc.)
 */
export interface RateLimitStorageProvider {
  /**
   * Check and increment rate limit atomically
   * @param key - Rate limit key (e.g., "action:userId")
   * @param maxRequests - Maximum requests allowed
   * @param windowSeconds - Time window in seconds
   * @returns Rate limit result or null if storage unavailable
   */
  checkAndIncrement(
    key: string,
    maxRequests: number,
    windowSeconds: number
  ): Promise<RateLimitResult | null>
}

/**
 * Supabase storage provider using increment_rate_limit PostgreSQL function
 */
export class SupabaseRateLimitProvider implements RateLimitStorageProvider {
  constructor(private supabaseClient: any) {}

  async checkAndIncrement(
    key: string,
    maxRequests: number,
    windowSeconds: number
  ): Promise<RateLimitResult | null> {
    try {
      const { data, error } = await this.supabaseClient.rpc('increment_rate_limit', {
        p_key: key,
        p_max_requests: maxRequests,
        p_window_seconds: windowSeconds,
      })

      if (error) {
        console.error('[RateLimit] Supabase error:', error.message)
        return null
      }

      if (!data || !Array.isArray(data) || data.length === 0) {
        console.error('[RateLimit] No data returned from Supabase')
        return null
      }

      const result = data[0] as { allowed: boolean; remaining: number; reset_at: string }
      return {
        allowed: result.allowed,
        remaining: result.remaining,
        resetAt: new Date(result.reset_at).getTime(),
      }
    } catch (err) {
      console.error('[RateLimit] Supabase exception:', err)
      return null
    }
  }
}

// In-memory fallback for when persistent storage is unavailable
const fallbackStore = new Map<string, { count: number; resetAt: number }>()

/**
 * Fallback in-memory rate limiter
 * Used when persistent storage is unavailable
 */
function checkFallbackRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const windowMs = config.windowSeconds * 1000

  // Handle zero or negative maxRequests - always reject
  if (config.maxRequests <= 0) {
    const resetAt = now + windowMs
    return { allowed: false, remaining: 0, resetAt }
  }

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

// Global storage provider (can be configured)
let storageProvider: RateLimitStorageProvider | null = null

/**
 * Configure storage provider for rate limiting
 *
 * @param provider - Storage provider implementation
 *
 * @example
 * ```typescript
 * import { createClient } from '@supabase/supabase-js'
 * import { configureRateLimitStorage, SupabaseRateLimitProvider } from './rate-limiting'
 *
 * const supabase = createClient(url, key)
 * configureRateLimitStorage(new SupabaseRateLimitProvider(supabase))
 * ```
 */
export function configureRateLimitStorage(provider: RateLimitStorageProvider): void {
  storageProvider = provider
}

/**
 * Check rate limit with persistent storage and automatic fallback
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

  // Try persistent storage if configured
  if (storageProvider) {
    const result = await storageProvider.checkAndIncrement(
      key,
      config.maxRequests,
      config.windowSeconds
    )

    if (result !== null) {
      return result
    }

    // Storage failed, fall back to in-memory
    console.warn('[RateLimit] Persistent storage failed, using in-memory fallback')
  }

  // Use in-memory fallback
  return checkFallbackRateLimit(key, config)
}

// Pre-configured rate limiters for common use cases

/**
 * Rate limit for content generation (AI)
 * 10 requests per minute
 */
export async function checkGenerationRateLimit(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(userId, {
    action: 'generation',
    maxRequests: 10,
    windowSeconds: 60,
  })
}

/**
 * Rate limit for classification operations
 * 30 requests per minute (higher as it's typically read-only)
 */
export async function checkClassificationRateLimit(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(userId, {
    action: 'classification',
    maxRequests: 30,
    windowSeconds: 60,
  })
}

/**
 * Rate limit for suggestion generation
 * 20 requests per minute
 */
export async function checkSuggestionRateLimit(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(userId, {
    action: 'suggestion',
    maxRequests: 20,
    windowSeconds: 60,
  })
}

/**
 * Rate limit for expensive AI operations (extraction, scoring)
 * 5 requests per minute
 */
export async function checkExpensiveAIRateLimit(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(userId, {
    action: 'expensive_ai',
    maxRequests: 5,
    windowSeconds: 60,
  })
}

/**
 * Rate limit for CRUD operations
 * 60 requests per minute
 */
export async function checkCrudRateLimit(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(userId, {
    action: 'crud',
    maxRequests: 60,
    windowSeconds: 60,
  })
}

/**
 * Rate limit for high-frequency read operations
 * 100 requests per minute
 */
export async function checkReadRateLimit(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(userId, {
    action: 'read',
    maxRequests: 100,
    windowSeconds: 60,
  })
}

/**
 * Cleanup expired entries in fallback store
 * Call periodically to prevent memory leaks
 */
export function cleanupFallbackStore(): void {
  const now = Date.now()
  for (const [key, entry] of fallbackStore.entries()) {
    if (entry.resetAt < now) {
      fallbackStore.delete(key)
    }
  }
}

// Auto-cleanup fallback store every 5 minutes in long-running processes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupFallbackStore, 5 * 60 * 1000)
}

/**
 * Get current fallback store statistics (for monitoring/debugging)
 */
export function getFallbackStoreStats() {
  return {
    size: fallbackStore.size,
    keys: Array.from(fallbackStore.keys()),
  }
}

/**
 * Reset fallback store (for testing purposes)
 * WARNING: Only use in tests, not in production code
 */
export function resetFallbackStore(): void {
  fallbackStore.clear()
}
