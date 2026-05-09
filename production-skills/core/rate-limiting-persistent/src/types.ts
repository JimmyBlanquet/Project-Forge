/**
 * Type definitions for rate limiting
 */

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number // Unix timestamp in ms
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Action identifier (e.g., "generation", "api_call") */
  action: string
  /** Maximum requests allowed in window */
  maxRequests: number
  /** Window duration in seconds */
  windowSeconds: number
}

/**
 * Database configuration
 */
export interface DatabaseConfig {
  supabaseUrl: string
  supabaseAnonKey: string
}
