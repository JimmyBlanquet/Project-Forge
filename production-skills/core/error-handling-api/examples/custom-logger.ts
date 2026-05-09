/**
 * Example: Configuring custom logger
 *
 * Shows how to integrate error-handling-api with your own
 * logging solution (e.g., Winston, Pino, Sentry, etc.)
 */

import { configureLogger, apiError } from '../src'

// Example 1: Using Winston logger
import winston from 'winston'

const winstonLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console(),
  ],
})

configureLogger((message, context, error) => {
  winstonLogger.error(message, {
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
})

// Example 2: Using Sentry for error tracking
import * as Sentry from '@sentry/nextjs'

configureLogger((message, context, error) => {
  if (error) {
    Sentry.captureException(error, {
      tags: {
        endpoint: context.endpoint as string,
        operation: context.operation as string,
      },
      contexts: {
        error: context,
      },
    })
  }

  // Also log to console for development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error] ${message}`, context, error)
  }
})

// Example 3: Using Pino for structured logging
import pino from 'pino'

const pinoLogger = pino({
  level: 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        }
      : undefined,
})

configureLogger((message, context, error) => {
  pinoLogger.error(
    {
      ...context,
      err: error,
    },
    message
  )
})

// Example 4: Multiple logging destinations
configureLogger((message, context, error) => {
  // Log to console
  console.error(`[Error] ${message}`, context)

  // Send to external service
  if (process.env.NODE_ENV === 'production') {
    fetch('https://logs.example.com/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        context,
        error: error
          ? {
              message: error.message,
              stack: error.stack,
            }
          : null,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      }),
    }).catch((err) => {
      // Fallback if logging service is down
      console.error('Failed to send error to logging service:', err)
    })
  }

  // Track metrics
  if (error) {
    // Increment error counter in metrics system
    // metrics.increment('api.errors', { endpoint: context.endpoint })
  }
})

// Example 5: Conditional logging based on error type
configureLogger((message, context, error) => {
  const errorOperation = context.operation as string

  // Different handling based on error type
  if (errorOperation === 'DATABASE_ERROR') {
    // Critical - send alert
    console.error('[CRITICAL] Database error:', message, context)
    // sendAlert(message, context)
  } else if (errorOperation === 'VALIDATION_ERROR') {
    // Low priority - just log
    console.log('[INFO] Validation error:', message)
  } else {
    // Standard error logging
    console.error('[ERROR]', message, context, error)
  }
})

// Now use the configured logger
export async function exampleApiRoute() {
  try {
    // Your API logic
    throw new Error('Database connection failed')
  } catch (error) {
    // This will use your custom logger
    return apiError('DATABASE_ERROR', error, {
      route: '/api/example',
      userId: '123',
    })
  }
}
