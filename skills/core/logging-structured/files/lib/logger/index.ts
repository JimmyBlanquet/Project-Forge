import type { LogLevel, LogContext, LogEntry, Logger } from './types'

export function log(level: LogLevel, message: string, context: LogContext = {}): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  }

  const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'

  if (isDevelopment) {
    // Development: Human-readable with emoji prefix
    const prefix = {
      error: '❌',
      warn: '⚠️',
      info: '✓',
      debug: '🔍',
    }[level]

    if (level === 'error') {
      // eslint-disable-next-line no-console
      console.error(`${prefix} [${level.toUpperCase()}]`, entry)
    } else if (level === 'warn') {
      // eslint-disable-next-line no-console
      console.warn(`${prefix} [${level.toUpperCase()}]`, entry)
    } else if (level === 'info') {
      // eslint-disable-next-line no-console
      console.log(`${prefix} [${level.toUpperCase()}]`, entry)
    } else if (level === 'debug') {
      // eslint-disable-next-line no-console
      console.debug(`${prefix} [${level.toUpperCase()}]`, entry)
    }
  } else {
    // Production: Pure JSON for log aggregators (Vercel, Datadog, etc.)
    const output = JSON.stringify(entry)

    if (level === 'error') {
      // eslint-disable-next-line no-console
      console.error(output)
    } else if (level === 'warn') {
      // eslint-disable-next-line no-console
      console.warn(output)
    } else if (level === 'info') {
      // eslint-disable-next-line no-console
      console.log(output)
    }
    // Debug is development-only (not logged in production)
  }
}

export function createLogger(defaultContext?: LogContext): Logger {
  return {
    debug: (message, ctx) => log('debug', message, { ...defaultContext, ...ctx }),
    info: (message, ctx) => log('info', message, { ...defaultContext, ...ctx }),
    warn: (message, ctx) => log('warn', message, { ...defaultContext, ...ctx }),
    error: (message, ctx) => log('error', message, { ...defaultContext, ...ctx }),
  }
}

export * from './types'
