/**
 * Middleware logger utility
 * Provides structured JSON logging for middleware operations
 */

export interface MiddlewareLogContext {
  pathname: string
  userId?: string
  userEmail?: string
  duration?: number
  error?: unknown
}

type LogLevel = 'info' | 'warn' | 'error'

/**
 * Log middleware events with structured JSON format
 * In production: only logs errors
 * In development: logs all events
 *
 * @param level - Log level (info, warn, error)
 * @param message - Log message
 * @param context - Structured context data
 */
export function logMiddlewareEvent(
  level: LogLevel,
  message: string,
  context: MiddlewareLogContext
): void {
  // Sanitize error objects for JSON serialization
  const sanitizedContext = { ...context }
  if (sanitizedContext.error) {
    const errorObj = sanitizedContext.error
    sanitizedContext.error = {
      message: errorObj instanceof Error ? errorObj.message : String(errorObj),
      stack: errorObj instanceof Error ? errorObj.stack : undefined,
    } as unknown
  }

  const logEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...sanitizedContext,
  }

  // ✅ Production: Log all levels as JSON (info, warn, error)
  // ✅ Info logs are critical for monitoring authentication flows
  const jsonOutput = JSON.stringify(logEntry)

  // Use console methods based on log level
  switch (level) {
    case 'error':
      console.error(jsonOutput)
      break
    case 'warn':
      console.warn(jsonOutput)
      break
    case 'info':
    default:
      console.log(jsonOutput)
      break
  }
}
