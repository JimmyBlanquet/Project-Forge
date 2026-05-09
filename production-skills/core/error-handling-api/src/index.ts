/**
 * Main entry point
 * Re-exports all public APIs
 */

export {
  apiError,
  apiSuccess,
  withErrorHandler,
  configureLogger,
  API_ERROR,
  type LoggerFunction,
} from './error-handler'

// Types
export * from './types'
