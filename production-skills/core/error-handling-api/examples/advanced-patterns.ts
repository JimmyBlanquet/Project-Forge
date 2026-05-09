/**
 * Example: Advanced patterns with error-handling-api
 *
 * Shows advanced use cases including custom error codes,
 * error transformation, and integration patterns.
 */

import { NextRequest } from 'next/server'
import {
  apiError,
  apiSuccess,
  withErrorHandler,
  API_ERROR,
  type ApiErrorCode,
} from '../src'

// Pattern 1: Custom domain-specific error mapping
function mapDatabaseError(dbError: {code: string; message: string}): ApiErrorCode {
  switch (dbError.code) {
    case '23505': // Unique violation
      return 'VALIDATION_ERROR'
    case '23503': // Foreign key violation
      return 'VALIDATION_ERROR'
    case '42P01': // Undefined table
      return 'INTERNAL_ERROR'
    default:
      return 'DATABASE_ERROR'
  }
}

export const createResource = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json()

  try {
    const resource = await db.insert(body)
    return apiSuccess(resource, 201)
  } catch (error: unknown) {
    if (isDatabaseError(error)) {
      const errorCode = mapDatabaseError(error)
      return apiError(errorCode, error, {
        route: '/api/resources',
        customMessage:
          errorCode === 'VALIDATION_ERROR'
            ? 'Resource already exists or violates constraints'
            : undefined,
      })
    }
    throw error // Let withErrorHandler catch it
  }
})

// Pattern 2: Conditional error responses based on user role
export const getAdminData = withErrorHandler(async (req: NextRequest) => {
  const user = await getUser(req)

  if (!user) {
    return apiError('UNAUTHORIZED')
  }

  if (user.role !== 'admin') {
    // Don't expose that the resource exists
    return apiError('NOT_FOUND') // Instead of FORBIDDEN
  }

  const data = await fetchAdminData()
  return apiSuccess(data)
})

// Pattern 3: Enriching error context with request metadata
export const loggedOperation = withErrorHandler(async (req: NextRequest) => {
  const startTime = Date.now()
  const userId = await getUserId(req)
  const ip = req.headers.get('x-forwarded-for') || 'unknown'

  try {
    const result = await performOperation()
    return apiSuccess({
      ...result,
      metadata: {
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    return apiError('INTERNAL_ERROR', error, {
      route: req.nextUrl.pathname,
      userId,
      // Note: context is logged but not returned to client
      // @ts-expect-error - adding extra context
      ip,
      duration: Date.now() - startTime,
    })
  }
})

// Pattern 4: Cascading error handling with multiple validation layers
async function validateRequest(data: unknown): Promise<
  | { valid: true; data: ValidatedData }
  | { valid: false; error: ReturnType<typeof apiError> }
> {
  // Layer 1: Schema validation
  const schemaResult = validateSchema(data)
  if (!schemaResult.success) {
    return {
      valid: false,
      error: apiError('VALIDATION_ERROR', null, {
        customMessage: `Invalid schema: ${schemaResult.error}`,
      }),
    }
  }

  // Layer 2: Business rules validation
  const businessResult = await validateBusinessRules(schemaResult.data)
  if (!businessResult.success) {
    return {
      valid: false,
      error: apiError('VALIDATION_ERROR', null, {
        customMessage: businessResult.error,
      }),
    }
  }

  // Layer 3: Permission validation
  const permissionResult = await validatePermissions(schemaResult.data)
  if (!permissionResult.success) {
    return {
      valid: false,
      error: apiError('FORBIDDEN', null, {
        customMessage: 'Insufficient permissions for this operation',
      }),
    }
  }

  return { valid: true, data: schemaResult.data }
}

export const validateAndProcess = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json()

  const validation = await validateRequest(body)
  if (!validation.valid) {
    return validation.error
  }

  const result = await process(validation.data)
  return apiSuccess(result)
})

// Pattern 5: Error recovery and retry logic
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      if (attempt < maxRetries) {
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 100))
      }
    }
  }

  throw lastError
}

export const resilientOperation = withErrorHandler(async (req: NextRequest) => {
  try {
    const result = await withRetry(async () => {
      return await performUnreliableOperation()
    }, 3)

    return apiSuccess(result)
  } catch (error) {
    return apiError('SERVICE_UNAVAILABLE', error, {
      route: req.nextUrl.pathname,
      customMessage: 'Service temporarily unavailable, please try again later',
    })
  }
})

// Pattern 6: Typed error responses for type-safe error handling
type ErrorResult<T> =
  | { success: true; data: T }
  | { success: false; error: ReturnType<typeof apiError> }

async function safeOperation<T>(
  operation: () => Promise<T>
): Promise<ErrorResult<T>> {
  try {
    const data = await operation()
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: apiError('INTERNAL_ERROR', error),
    }
  }
}

export const typeSafeRoute = withErrorHandler(async (_req: NextRequest) => {
  const result = await safeOperation(async () => {
    return await fetchData()
  })

  if (!result.success) {
    return result.error
  }

  return apiSuccess(result.data)
})

// Helper functions (simulated)
const db = {
  insert: async (data: unknown) => ({ id: '1', ...data }),
}

function isDatabaseError(error: unknown): error is { code: string; message: string } {
  return typeof error === 'object' && error !== null && 'code' in error
}

async function getUser(_req: NextRequest) {
  return { id: '1', role: 'user' }
}

async function getUserId(_req: NextRequest) {
  return '1'
}

async function fetchAdminData() {
  return { sensitive: 'data' }
}

async function performOperation() {
  return { result: 'success' }
}

interface ValidatedData {
  id: string
  value: string
}

function validateSchema(_data: unknown): { success: boolean; data?: ValidatedData; error?: string } {
  return { success: true, data: { id: '1', value: 'test' } }
}

async function validateBusinessRules(_data: ValidatedData) {
  return { success: true }
}

async function validatePermissions(_data: ValidatedData) {
  return { success: true }
}

async function process(_data: ValidatedData) {
  return { processed: true }
}

async function performUnreliableOperation() {
  return { data: 'success' }
}

async function fetchData() {
  return { id: '1', name: 'Test' }
}
