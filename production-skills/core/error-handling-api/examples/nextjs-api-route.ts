/**
 * Example: Using error-handling-api in Next.js API routes
 *
 * This example shows how to use the error handling skill
 * in a typical Next.js API route with proper error handling.
 */

import { NextRequest } from 'next/server'
import { apiError, apiSuccess, withErrorHandler } from '../src'

// Example 1: Simple API route with manual error handling
export async function GET(req: NextRequest) {
  try {
    // Validate authentication
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return apiError('UNAUTHORIZED')
    }

    // Get user ID from query
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return apiError('MISSING_PARAMS', null, {
        customMessage: 'userId parameter is required',
      })
    }

    // Fetch data (simulated)
    const userData = await fetchUser(userId)
    if (!userData) {
      return apiError('NOT_FOUND')
    }

    // Return success
    return apiSuccess(userData)
  } catch (error) {
    // Log and return database error
    return apiError('DATABASE_ERROR', error, {
      route: '/api/users',
      userId: 'unknown',
    })
  }
}

// Example 2: Using withErrorHandler wrapper
export const POST = withErrorHandler(async (req: NextRequest) => {
  // Authentication check
  const session = await getSession(req)
  if (!session) {
    return apiError('SESSION_EXPIRED')
  }

  // Parse and validate request body
  const body = await req.json()
  if (!body.email || !body.name) {
    return apiError('VALIDATION_ERROR', null, {
      customMessage: 'Email and name are required',
    })
  }

  // Create user (might throw)
  const user = await createUser(body)

  // Return success with 201 status
  return apiSuccess(user, 201)
})

// Example 3: Rate limiting integration
export const PUT = withErrorHandler(async (req: NextRequest) => {
  const userId = await getUserId(req)

  // Check rate limit
  const { allowed, remaining } = await checkRateLimit(userId)
  if (!allowed) {
    return apiError('RATE_LIMITED')
  }

  // Process update
  const body = await req.json()
  const updated = await updateUser(userId, body)

  return apiSuccess({ ...updated, rateLimit: { remaining } })
})

// Helper functions (simulated for example)
async function fetchUser(id: string) {
  // Simulated database call
  return { id, name: 'John Doe', email: 'john@example.com' }
}

async function getSession(req: NextRequest) {
  // Simulated session check
  return req.headers.get('authorization') ? { userId: '123' } : null
}

async function getUserId(req: NextRequest) {
  return '123' // Simulated
}

async function createUser(data: { email: string; name: string }) {
  // Simulated user creation
  return { id: '456', ...data }
}

async function updateUser(id: string, data: Record<string, unknown>) {
  // Simulated user update
  return { id, ...data }
}

async function checkRateLimit(_userId: string) {
  // Simulated rate limit check
  return { allowed: true, remaining: 10 }
}
