/**
 * API Error Handler - Centralized error responses
 *
 * Provides consistent error messages across all API routes.
 *
 * Principles:
 * 1. Never expose internal details (DB errors, stack traces)
 * 2. Use user-friendly French messages
 * 3. Log detailed errors server-side only
 * 4. Return appropriate HTTP status codes
 */

import { NextResponse } from 'next/server'

/**
 * Logger function type for error logging
 */
export type LoggerFunction = (
  message: string,
  context: Record<string, unknown>,
  error?: Error
) => void

/**
 * Default logger implementation using console.error
 */
const defaultLogger: LoggerFunction = (message, context, error) => {
  console.error(`[Error] ${message}`, context, error)
}

/**
 * Global logger instance (can be configured)
 */
let logger: LoggerFunction = defaultLogger

/**
 * Configure custom logger for error handling
 *
 * @param customLogger - Custom logging function
 *
 * @example
 * ```typescript
 * import { configureLogger } from '@/lib/error-handling-api'
 *
 * // Use your own logger
 * configureLogger((message, context, error) => {
 *   myLogger.error(message, { ...context, error })
 * })
 * ```
 */
export function configureLogger(customLogger: LoggerFunction): void {
  logger = customLogger
}

/**
 * Standard API error codes with user-friendly messages
 */
export const API_ERROR = {
  // Authentication (401)
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: 'Authentification requise',
    status: 401,
  },
  SESSION_EXPIRED: {
    code: 'SESSION_EXPIRED',
    message: 'Session expirée, veuillez vous reconnecter',
    status: 401,
  },

  // Authorization (403)
  FORBIDDEN: {
    code: 'FORBIDDEN',
    message: 'Accès non autorisé',
    status: 403,
  },
  RESOURCE_FORBIDDEN: {
    code: 'RESOURCE_FORBIDDEN',
    message: "Vous n'avez pas accès à cette ressource",
    status: 403,
  },

  // Not Found (404)
  NOT_FOUND: {
    code: 'NOT_FOUND',
    message: 'Ressource non trouvée',
    status: 404,
  },
  PROFILE_NOT_FOUND: {
    code: 'PROFILE_NOT_FOUND',
    message: 'Profil non trouvé',
    status: 404,
  },
  EMAIL_NOT_FOUND: {
    code: 'EMAIL_NOT_FOUND',
    message: 'Email non trouvé',
    status: 404,
  },
  LEAD_NOT_FOUND: {
    code: 'LEAD_NOT_FOUND',
    message: 'Lead non trouvé',
    status: 404,
  },
  TEMPLATE_NOT_FOUND: {
    code: 'TEMPLATE_NOT_FOUND',
    message: 'Template non trouvé',
    status: 404,
  },
  CONNECTION_NOT_FOUND: {
    code: 'CONNECTION_NOT_FOUND',
    message: 'Connexion email non trouvée',
    status: 404,
  },

  // Validation (400)
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    message: 'Données invalides',
    status: 400,
  },
  INVALID_PARAMS: {
    code: 'INVALID_PARAMS',
    message: 'Paramètres invalides',
    status: 400,
  },
  MISSING_PARAMS: {
    code: 'MISSING_PARAMS',
    message: 'Paramètres requis manquants',
    status: 400,
  },

  // Rate Limiting (429)
  RATE_LIMITED: {
    code: 'RATE_LIMITED',
    message: 'Trop de requêtes, veuillez réessayer dans quelques instants',
    status: 429,
  },

  // Server Errors (500)
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    message: 'Une erreur est survenue, veuillez réessayer',
    status: 500,
  },
  DATABASE_ERROR: {
    code: 'DATABASE_ERROR',
    message: 'Erreur de traitement, veuillez réessayer',
    status: 500,
  },
  AI_ERROR: {
    code: 'AI_ERROR',
    message: 'Erreur lors de la génération, veuillez réessayer',
    status: 500,
  },
  EMAIL_SYNC_ERROR: {
    code: 'EMAIL_SYNC_ERROR',
    message: 'Erreur de synchronisation email',
    status: 500,
  },

  // Service Unavailable (503)
  SERVICE_UNAVAILABLE: {
    code: 'SERVICE_UNAVAILABLE',
    message: 'Service temporairement indisponible',
    status: 503,
  },
} as const

export type ApiErrorCode = keyof typeof API_ERROR

/**
 * API Error Response type
 */
export interface ApiErrorResponse {
  error: {
    code: string
    message: string
  }
  requestId?: string
}

/**
 * Generate a unique request ID for error tracking
 */
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Create a standardized error response
 *
 * @param errorType - Predefined error type from API_ERROR
 * @param details - Optional technical details (logged server-side only)
 * @param context - Optional context for logging
 * @returns NextResponse with consistent error format
 *
 * @example
 * ```typescript
 * // Simple error
 * return apiError('NOT_FOUND')
 *
 * // With logging context
 * return apiError('DATABASE_ERROR', dbError, { route: '/api/leads', userId })
 *
 * // With custom message override (use sparingly)
 * return apiError('VALIDATION_ERROR', null, { customMessage: 'Email invalide' })
 * ```
 */
export function apiError(
  errorType: ApiErrorCode,
  details?: unknown,
  context?: {
    route?: string
    userId?: string
    customMessage?: string
  }
): NextResponse<ApiErrorResponse> {
  const errorDef = API_ERROR[errorType]
  const requestId = generateRequestId()

  // Log detailed error server-side
  if (details) {
    logger(
      `API Error [${errorType}] - ${requestId}`,
      {
        operation: errorDef.code,
        endpoint: context?.route,
        userId: context?.userId,
      },
      details instanceof Error ? details : undefined
    )
  }

  // Return sanitized response to client
  return NextResponse.json(
    {
      error: {
        code: errorDef.code,
        message: context?.customMessage || errorDef.message,
      },
      requestId,
    },
    { status: errorDef.status }
  )
}

/**
 * Create success response with consistent format
 */
export function apiSuccess<T>(data: T, status = 200): NextResponse<{ data: T }> {
  return NextResponse.json({ data }, { status })
}

/**
 * Wrap async route handler with error catching
 *
 * @example
 * ```typescript
 * export const GET = withErrorHandler(async (req) => {
 *   const data = await fetchData()
 *   return apiSuccess(data)
 * })
 * ```
 */
export function withErrorHandler(
  handler: (_req: Request, _context?: { params: Record<string, string> }) => Promise<NextResponse>
) {
  return async (req: Request, context?: { params: Record<string, string> }) => {
    try {
      return await handler(req, context)
    } catch (error) {
      logger(
        'Unhandled API error',
        {
          endpoint: req.url,
          operation: req.method,
        },
        error instanceof Error ? error : undefined
      )

      return apiError('INTERNAL_ERROR', error, {
        route: new URL(req.url).pathname,
      })
    }
  }
}
