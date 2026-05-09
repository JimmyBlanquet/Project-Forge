/**
 * @project-forge/rate-limiting-persistent
 *
 * Production-ready persistent rate limiting for Next.js
 */

// Main rate limiter
export { checkRateLimit } from './rate-limiter'

// Middleware helpers
export {
  withRateLimit,
  rateLimitExceededResponse,
  getRateLimitHeaders,
} from './middleware'

// Pre-configured limiters
export {
  checkGenerationRateLimit,
  checkClassificationRateLimit,
  checkSuggestionRateLimit,
  checkCrudRateLimit,
} from './pre-configured'

// Fallback utilities
export { cleanupFallbackStore } from './fallback'

// Types
export type { RateLimitResult, RateLimitConfig, DatabaseConfig } from './types'
