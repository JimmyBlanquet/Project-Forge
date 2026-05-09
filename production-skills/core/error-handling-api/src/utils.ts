/**
 * Utility functions for error handling
 */

/**
 * Generate a unique request ID for error tracking
 *
 * Format: req_{timestamp}_{random}
 * Example: req_abc123_xyz789
 */
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Log error details server-side
 *
 * By default logs to console.error
 * Override this function to integrate with your logging library (Pino, Winston, etc.)
 *
 * @param message - Error message
 * @param context - Contextual information
 * @param error - Original error object (if available)
 */
export function logError(
  message: string,
  context: Record<string, unknown>,
  error?: Error
): void {
  console.error('[API Error]', message, {
    ...context,
    error: error
      ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        }
      : undefined,
    timestamp: new Date().toISOString(),
  })
}
