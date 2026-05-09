/**
 * Standard API error codes with user-friendly messages
 *
 * Principles:
 * 1. Never expose internal details (DB errors, stack traces)
 * 2. Use user-friendly messages
 * 3. Return appropriate HTTP status codes
 */

import type { ErrorDefinition } from './types'

/**
 * Predefined API error codes
 */
export const API_ERROR = {
  // Authentication (401)
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: 'Authentication required',
    status: 401,
  },
  SESSION_EXPIRED: {
    code: 'SESSION_EXPIRED',
    message: 'Session expired, please reconnect',
    status: 401,
  },

  // Authorization (403)
  FORBIDDEN: {
    code: 'FORBIDDEN',
    message: 'Access denied',
    status: 403,
  },
  RESOURCE_FORBIDDEN: {
    code: 'RESOURCE_FORBIDDEN',
    message: 'You do not have access to this resource',
    status: 403,
  },

  // Not Found (404)
  NOT_FOUND: {
    code: 'NOT_FOUND',
    message: 'Resource not found',
    status: 404,
  },
  PROFILE_NOT_FOUND: {
    code: 'PROFILE_NOT_FOUND',
    message: 'Profile not found',
    status: 404,
  },
  EMAIL_NOT_FOUND: {
    code: 'EMAIL_NOT_FOUND',
    message: 'Email not found',
    status: 404,
  },

  // Validation (400)
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid data',
    status: 400,
  },
  INVALID_PARAMS: {
    code: 'INVALID_PARAMS',
    message: 'Invalid parameters',
    status: 400,
  },
  MISSING_PARAMS: {
    code: 'MISSING_PARAMS',
    message: 'Required parameters missing',
    status: 400,
  },

  // Rate Limiting (429)
  RATE_LIMITED: {
    code: 'RATE_LIMITED',
    message: 'Too many requests, please try again later',
    status: 429,
  },

  // Server Errors (500)
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    message: 'An error occurred, please try again',
    status: 500,
  },
  DATABASE_ERROR: {
    code: 'DATABASE_ERROR',
    message: 'Processing error, please try again',
    status: 500,
  },

  // Service Unavailable (503)
  SERVICE_UNAVAILABLE: {
    code: 'SERVICE_UNAVAILABLE',
    message: 'Service temporarily unavailable',
    status: 503,
  },
} as const satisfies Record<string, ErrorDefinition>

export type ApiErrorCode = keyof typeof API_ERROR
