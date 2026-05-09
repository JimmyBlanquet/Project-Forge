/**
 * Next.js API Route Integration Example
 *
 * This example shows how to integrate rate limiting into Next.js API routes.
 * Works with both App Router (app/) and Pages Router (pages/api/).
 *
 * Setup (in your app initialization):
 * ```typescript
 * import { createClient } from '@supabase/supabase-js'
 * import { configureRateLimitStorage, SupabaseRateLimitProvider } from '@project-forge/rate-limiting-persistent'
 *
 * const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
 * configureRateLimitStorage(new SupabaseRateLimitProvider(supabase))
 * ```
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  checkRateLimit,
  checkGenerationRateLimit,
  checkCrudRateLimit,
  checkReadRateLimit,
} from '../src'

// ============================================================================
// Example 1: Basic API Route with Rate Limiting
// ============================================================================

export async function POST_basicExample(request: NextRequest) {
  // Extract user ID from session/token
  const userId = request.headers.get('x-user-id') || 'anonymous'

  // Check rate limit before processing
  const rateLimit = await checkCrudRateLimit(userId)

  if (!rateLimit.allowed) {
    const retryAfter = Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
    return NextResponse.json(
      {
        error: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': '60',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString(),
        },
      }
    )
  }

  // Process the request
  const data = await request.json()
  // ... your business logic here ...

  return NextResponse.json(
    { success: true, data },
    {
      headers: {
        'X-RateLimit-Limit': '60',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString(),
      },
    }
  )
}

// ============================================================================
// Example 2: AI Generation Endpoint with Stricter Limits
// ============================================================================

export async function POST_aiGeneration(request: NextRequest) {
  const userId = request.headers.get('x-user-id') || 'anonymous'

  // Use pre-configured AI generation limiter (10 req/min)
  const rateLimit = await checkGenerationRateLimit(userId)

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'RATE_LIMITED',
        message: 'AI generation rate limit exceeded. You have 10 requests per minute.',
      },
      { status: 429 }
    )
  }

  // Heavy AI operation
  const { prompt } = await request.json()
  // const result = await generateWithAI(prompt)

  return NextResponse.json({
    success: true,
    // result,
    rateLimit: {
      remaining: rateLimit.remaining,
      resetAt: rateLimit.resetAt,
    },
  })
}

// ============================================================================
// Example 3: Read-Only Endpoint with Higher Limits
// ============================================================================

export async function GET_listItems(request: NextRequest) {
  const userId = request.headers.get('x-user-id') || 'anonymous'

  // Read operations can have higher limits (100 req/min)
  const rateLimit = await checkReadRateLimit(userId)

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'RATE_LIMITED', message: 'Too many read requests.' },
      { status: 429 }
    )
  }

  // Fetch data
  // const items = await db.query(...)

  return NextResponse.json({
    // items,
    _meta: {
      rateLimit: {
        limit: 100,
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
      },
    },
  })
}

// ============================================================================
// Example 4: Custom Rate Limit for Specific Endpoint
// ============================================================================

export async function POST_customLimit(request: NextRequest) {
  const userId = request.headers.get('x-user-id') || 'anonymous'

  // Custom limit: 5 requests per 10 minutes
  const rateLimit = await checkRateLimit(userId, {
    action: 'email_send',
    maxRequests: 5,
    windowSeconds: 600, // 10 minutes
  })

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'RATE_LIMITED',
        message: 'Email sending limit: 5 emails per 10 minutes',
        retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
      },
      { status: 429 }
    )
  }

  // Send email
  // await sendEmail(...)

  return NextResponse.json({ success: true })
}

// ============================================================================
// Example 5: Middleware Pattern (Reusable Rate Limit Handler)
// ============================================================================

type RateLimitType = 'generation' | 'crud' | 'read' | 'custom'

interface RateLimitOptions {
  type: RateLimitType
  customConfig?: {
    action: string
    maxRequests: number
    windowSeconds: number
  }
  getUserId?: (request: NextRequest) => string | Promise<string>
}

async function withRateLimit(
  request: NextRequest,
  options: RateLimitOptions,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // Get user ID
  const userId = options.getUserId
    ? await options.getUserId(request)
    : request.headers.get('x-user-id') || 'anonymous'

  // Check rate limit based on type
  let rateLimit
  switch (options.type) {
    case 'generation':
      rateLimit = await checkGenerationRateLimit(userId)
      break
    case 'crud':
      rateLimit = await checkCrudRateLimit(userId)
      break
    case 'read':
      rateLimit = await checkReadRateLimit(userId)
      break
    case 'custom':
      if (!options.customConfig) {
        throw new Error('customConfig required for custom rate limit type')
      }
      rateLimit = await checkRateLimit(userId, options.customConfig)
      break
  }

  // Check if rate limited
  if (!rateLimit.allowed) {
    const retryAfter = Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
    return NextResponse.json(
      {
        error: 'RATE_LIMITED',
        message: 'Rate limit exceeded',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString(),
        },
      }
    )
  }

  // Call the actual handler
  const response = await handler(request)

  // Add rate limit headers
  response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
  response.headers.set('X-RateLimit-Reset', new Date(rateLimit.resetAt).toISOString())

  return response
}

// Usage of the middleware:
export async function POST_withMiddleware(request: NextRequest) {
  return withRateLimit(
    request,
    { type: 'crud' },
    async (req) => {
      const data = await req.json()
      // ... process request ...
      return NextResponse.json({ success: true, data })
    }
  )
}
