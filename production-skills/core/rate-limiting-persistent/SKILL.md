---
name: rate-limiting-persistent
description: Production-ready persistent rate limiting for Next.js APIs using PostgreSQL/Supabase with atomic counters, automatic fallback, and zero cold-start issues. Survives serverless deployments.
effort: medium
license: MIT
---

# Rate Limiting Persistent

Database-backed rate limiting system for Next.js API routes with atomic PostgreSQL functions, in-memory fallback, and serverless-friendly design.

## When to Use

Use this skill when building Next.js APIs that need:
- Persistent rate limiting across serverless cold starts
- Per-user or per-action rate limiting
- Atomic counter increments (no race conditions)
- Automatic fallback when database is unavailable
- Standard HTTP rate limit headers (X-RateLimit-*)
- Protection against abuse and DoS

**Don't use this skill if:**
- You need distributed rate limiting across multiple data centers (use Redis/Upstash instead)
- Your app isn't using PostgreSQL/Supabase
- You only need in-memory rate limiting (single instance)

## Stack

- Next.js 14+ (App Router Route Handlers)
- PostgreSQL 12+ (or Supabase)
- TypeScript (strict mode)
- @supabase/supabase-js (peer dependency)

## Quick Start

### 1. Install Skill

```bash
npm install -D @project-forge/rate-limiting-persistent
npm install @supabase/supabase-js
```

### 2. Run Database Migration

```sql
-- See migrations/create_rate_limits.sql
CREATE TABLE rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    window_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE FUNCTION increment_rate_limit(...)
-- Full migration in migrations/ folder
```

### 3. Create Configuration

```typescript
// lib/config.ts
export const rateLimitConfig = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
}
```

### 4. Use in API Routes

```typescript
// app/api/generate/route.ts
import { checkRateLimit } from '@project-forge/rate-limiting-persistent'
import { apiError } from '@project-forge/error-handling-api'
import { rateLimitConfig } from '@/lib/config'

export async function POST(request: NextRequest) {
  const userId = await getUserId(request)

  const result = await checkRateLimit(rateLimitConfig, userId, {
    action: 'ai_generation',
    maxRequests: 10,
    windowSeconds: 60,
  })

  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000).toString()
        }
      }
    )
  }

  // Process request
  const data = await generateContent()
  return NextResponse.json({ data })
}
```

### 5. Use Middleware Helper

```typescript
import { withRateLimit } from '@project-forge/rate-limiting-persistent/middleware'

export async function POST(request: NextRequest) {
  const userId = await getUserId(request)

  const rateLimitResponse = await withRateLimit(config, userId, {
    action: 'api_call',
    maxRequests: 60,
    windowSeconds: 60,
  })

  if (rateLimitResponse) {
    return rateLimitResponse // 429 with proper headers
  }

  // Continue processing
}
```

## Key Features

### Atomic PostgreSQL Function

Uses PostgreSQL's `ON CONFLICT` for atomic counter increments:

```sql
INSERT INTO rate_limits (key, count, window_start, window_end)
VALUES ($1, 1, NOW(), NOW() + interval '$2 seconds')
ON CONFLICT (key) DO UPDATE
SET count = CASE
    WHEN rate_limits.window_end < NOW() THEN 1
    ELSE rate_limits.count + 1
END
```

**Benefits:**
- No race conditions
- True atomic operations
- Handles concurrent requests safely

### Automatic Fallback

If PostgreSQL is unavailable, automatically falls back to in-memory:

```typescript
try {
  // Try PostgreSQL
  const result = await supabase.rpc('increment_rate_limit', ...)
  return result
} catch (error) {
  console.warn('Falling back to in-memory rate limiting')
  return checkFallbackRateLimit(key, config)
}
```

**Benefits:**
- Never fails hard
- Degrades gracefully
- In-memory is better than no limiting

### Serverless-Friendly

Survives cold starts and deployments:
- State persisted in PostgreSQL
- No Redis/external dependencies
- Works in Vercel, Netlify, AWS Lambda

### Standard Headers

Returns proper HTTP rate limit headers:

```typescript
{
  'X-RateLimit-Limit': '60',
  'X-RateLimit-Remaining': '42',
  'X-RateLimit-Reset': '2024-01-17T10:15:00Z',
  'Retry-After': '45' // seconds
}
```

### Pre-configured Limiters

Common rate limit configurations:

```typescript
import {
  checkGenerationRateLimit,    // 10/min for AI
  checkClassificationRateLimit, // 30/min for read-only AI
  checkCrudRateLimit,          // 60/min for CRUD
} from '@project-forge/rate-limiting-persistent'

const result = await checkGenerationRateLimit(config, userId)
```

## Core API

### `checkRateLimit(config, userId, options)`

Check rate limit for a user/action.

**Parameters:**
- `config` - Database configuration `{ supabaseUrl, supabaseAnonKey }`
- `userId` - User or identifier to rate limit
- `options` - Rate limit config: `{ action, maxRequests, windowSeconds }`

**Returns:** `Promise<RateLimitResult>`
```typescript
{
  allowed: boolean
  remaining: number
  resetAt: number // Unix timestamp in ms
}
```

**Example:**
```typescript
const result = await checkRateLimit(config, user.id, {
  action: 'api_call',
  maxRequests: 100,
  windowSeconds: 60,
})

if (!result.allowed) {
  return rateLimitExceededResponse(result)
}
```

### `withRateLimit(config, userId, options)`

Middleware helper that returns 429 response if limit exceeded.

**Parameters:** Same as `checkRateLimit`

**Returns:** `Promise<NextResponse | null>`
- `null` if allowed
- `NextResponse` (429) if rate limited

**Example:**
```typescript
const response = await withRateLimit(config, userId, {
  action: 'expensive_operation',
  maxRequests: 5,
  windowSeconds: 60,
})

if (response) return response // 429
```

### `rateLimitExceededResponse(result)`

Create a 429 response with proper headers.

**Parameters:**
- `result` - Result from `checkRateLimit()`

**Returns:** `NextResponse` with status 429

**Example:**
```typescript
if (!result.allowed) {
  return rateLimitExceededResponse(result)
}
```

### `getRateLimitHeaders(result)`

Get headers to add to successful responses.

**Parameters:**
- `result` - Result from `checkRateLimit()`

**Returns:** `Record<string, string>` with X-RateLimit-* headers

**Example:**
```typescript
return NextResponse.json(
  { data },
  { headers: getRateLimitHeaders(result) }
)
```

## Pre-configured Limiters

The skill includes common rate limit configurations:

```typescript
// AI Generation (expensive)
checkGenerationRateLimit(config, userId)
// 10 requests / 60 seconds

// AI Classification (read-only)
checkClassificationRateLimit(config, userId)
// 30 requests / 60 seconds

// CRUD Operations
checkCrudRateLimit(config, userId)
// 60 requests / 60 seconds

// Suggestions
checkSuggestionRateLimit(config, userId)
// 20 requests / 60 seconds
```

## Database Schema

Required PostgreSQL schema (see `migrations/create_rate_limits.sql`):

```sql
CREATE TABLE rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,           -- "action:userId"
    count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE FUNCTION increment_rate_limit(
    p_key TEXT,
    p_max_requests INTEGER,
    p_window_seconds INTEGER
) RETURNS TABLE (allowed BOOLEAN, remaining INTEGER, reset_at TIMESTAMPTZ);

CREATE FUNCTION cleanup_expired_rate_limits() RETURNS INTEGER;
```

## Advanced Patterns

### Per-IP Rate Limiting

```typescript
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  const headersList = headers()
  const ip = headersList.get('x-forwarded-for') || 'unknown'

  const result = await checkRateLimit(config, ip, {
    action: 'public_api',
    maxRequests: 100,
    windowSeconds: 60,
  })

  if (!result.allowed) {
    return rateLimitExceededResponse(result)
  }
}
```

### Multiple Rate Limits

```typescript
// Check both per-user and per-IP
const userResult = await checkRateLimit(config, userId, {
  action: 'user_generation',
  maxRequests: 10,
  windowSeconds: 60,
})

const ipResult = await checkRateLimit(config, ip, {
  action: 'ip_generation',
  maxRequests: 50,
  windowSeconds: 60,
})

if (!userResult.allowed || !ipResult.allowed) {
  return rateLimitExceededResponse(userResult.allowed ? ipResult : userResult)
}
```

### Tiered Rate Limits

```typescript
const tier = await getUserTier(userId)

const limits = {
  free: { maxRequests: 10, windowSeconds: 60 },
  pro: { maxRequests: 100, windowSeconds: 60 },
  enterprise: { maxRequests: 1000, windowSeconds: 60 },
}

const result = await checkRateLimit(config, userId, {
  action: 'api_call',
  ...limits[tier],
})
```

## Testing

The skill includes comprehensive tests:

```bash
npm test
npm test -- --coverage
```

Test coverage:
- Atomic increment behavior
- Window expiry and reset
- Concurrent request handling
- Fallback mechanism
- Headers generation

## Examples

The skill includes 4 production examples:

1. **Basic API Route** (`examples/01-basic-usage.ts`)
   - Simple rate limiting
   - Error responses

2. **Middleware Integration** (`examples/02-middleware.ts`)
   - withRateLimit helper
   - Multiple rate limits

3. **Tiered Limits** (`examples/03-tiered-limits.ts`)
   - User tier detection
   - Dynamic limits

4. **Per-IP Limiting** (`examples/04-ip-limiting.ts`)
   - IP-based rate limiting
   - Public API protection

## Integration with Other Skills

Works seamlessly with error-handling-api:

```typescript
import { apiError } from '@project-forge/error-handling-api'
import { checkRateLimit } from '@project-forge/rate-limiting-persistent'

const result = await checkRateLimit(config, userId, ...)

if (!result.allowed) {
  return apiError('RATE_LIMITED', null, {
    customMessage: `Rate limit exceeded. Try again in ${Math.ceil((result.resetAt - Date.now()) / 1000)}s`
  })
}
```

## Troubleshooting

**Rate limits not working?**
- Verify PostgreSQL migration was applied
- Check `increment_rate_limit` function exists
- Ensure Supabase credentials are correct

**Fallback always triggering?**
- Check database connection
- Verify function has correct parameters
- Check Supabase logs for errors

**Limits resetting unexpectedly?**
- Verify window_seconds configuration
- Check server time vs database time
- Ensure cleanup function isn't too aggressive

## Performance

- Atomic increment: ~2-5ms (PostgreSQL)
- Fallback check: ~0.1ms (in-memory)
- Concurrent requests: Handled safely by PostgreSQL UPSERT
- Memory footprint: ~100 bytes per rate limit entry

## Best Practices

1. **Use action namespaces** - `"ai_generation"`, `"api_crud"`, `"email_send"`
2. **Set realistic limits** - Start conservative, adjust based on metrics
3. **Add headers** - Always include X-RateLimit-* headers
4. **Monitor fallbacks** - Alert if fallback triggers frequently
5. **Cleanup regularly** - Run `cleanup_expired_rate_limits()` via CRON
6. **Test concurrent requests** - Verify no race conditions

## License

MIT - See LICENSE file for details

---

**Documentation Version:** 1.0.0
**Last Updated:** 2026-01-17
**Skill Compatibility:** Claude Code 2.1+, Claude Desktop, Claude.ai Pro/Max
