---
name: rate-limiting-persistent
description: Persistent rate limiting using PostgreSQL for atomic counters. Survives serverless cold starts and deployments with automatic in-memory fallback.
effort: medium
---

# Rate Limiting Persistent Skill

**Version:** 1.0.0
**Category:** Core
**Extracted from:** Production-tested in a real-world SaaS
**Production-ready:** ✅ Yes

## Description

Persistent rate limiting using PostgreSQL for atomic counters. Survives serverless cold starts and deployments with automatic in-memory fallback.

**Key Features:**
- 🗄️ **Persistent Storage**: Uses PostgreSQL for atomic rate limit tracking
- ⚡ **Serverless-Ready**: Survives Vercel/Railway cold starts
- 🛡️ **Automatic Fallback**: In-memory limiter if database unavailable
- ⚙️ **Flexible Configuration**: Per-action rate limits
- 🔒 **Thread-Safe**: Atomic PostgreSQL function prevents race conditions
- 🧹 **Auto-Cleanup**: Periodic cleanup of expired entries

## What This Skill Provides

### Core Components

1. **checkRateLimit()** - Main rate limiting function
   - Uses PostgreSQL `increment_rate_limit()` function
   - Automatic fallback to in-memory limiter
   - Returns: `{ allowed, remaining, resetAt }`

2. **PostgreSQL Function** - Atomic counter increment
   - UPSERT with ON CONFLICT
   - Automatic window reset when expired
   - Returns allowed status + remaining count

3. **In-Memory Fallback** - Resilience when DB unavailable
   - Map-based storage
   - Automatic cleanup every 5 minutes
   - Same interface as persistent limiter

## Installation

### 1. Run Installation Script

```bash
cd skills/core/rate-limiting-persistent
bash install.sh
```

### 2. Apply Supabase Migration

In your Supabase dashboard or CLI:

```bash
supabase migration new create_rate_limits
# Copy contents from supabase/migrations/20251223100001_create_rate_limits.sql
supabase db push
```

Or manually:

```sql
-- See supabase/migrations/20251223100001_create_rate_limits.sql
CREATE TABLE rate_limits (...);
CREATE FUNCTION increment_rate_limit(...);
```

### 3. Install Dependencies

Already included if you have Supabase:

```bash
npm install @supabase/supabase-js
```

## Usage

### Basic Usage

```typescript
import { checkRateLimit } from '@/lib/rate-limit/persistent-limiter'

// In your API route
export async function POST(request: Request) {
  const { userId } = await getUser()

  const rateLimit = await checkRateLimit(userId, {
    action: 'api_call',
    maxRequests: 60,
    windowSeconds: 60
  })

  if (!rateLimit.allowed) {
    return new Response('Rate limit exceeded', {
      status: 429,
      headers: {
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString()
      }
    })
  }

  // Process request...
  return Response.json({ success: true })
}
```

### With Rate Limit Headers

```typescript
async function handleRateLimitedRequest(userId: string) {
  const rateLimit = await checkRateLimit(userId, {
    action: 'api',
    maxRequests: 100,
    windowSeconds: 60
  })

  const headers = new Headers({
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Remaining': String(rateLimit.remaining),
    'X-RateLimit-Reset': String(rateLimit.resetAt)
  })

  if (!rateLimit.allowed) {
    return new Response('Too many requests', {
      status: 429,
      headers
    })
  }

  // Process request...
  const response = await fetch(...)

  // Add rate limit headers to successful response
  headers.forEach((value, key) => {
    response.headers.set(key, value)
  })

  return response
}
```

### Pre-Configured Rate Limiters

Create helper functions for common use cases:

```typescript
// In your project
export async function checkApiRateLimit(userId: string) {
  return checkRateLimit(userId, {
    action: 'api',
    maxRequests: 60,
    windowSeconds: 60
  })
}

export async function checkAIRateLimit(userId: string) {
  return checkRateLimit(userId, {
    action: 'ai_generation',
    maxRequests: 10,   // Expensive operation
    windowSeconds: 60
  })
}

export async function checkReadRateLimit(userId: string) {
  return checkRateLimit(userId, {
    action: 'read',
    maxRequests: 100,  // Higher for reads
    windowSeconds: 60
  })
}
```

### Per-IP Rate Limiting

```typescript
import { checkRateLimit } from '@/lib/rate-limit/persistent-limiter'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'

  const rateLimit = await checkRateLimit(ip, {
    action: 'login_attempt',
    maxRequests: 5,
    windowSeconds: 300  // 5 minutes
  })

  if (!rateLimit.allowed) {
    return new Response('Too many login attempts', { status: 429 })
  }

  // Process login...
}
```

## Configuration

### Rate Limit Strategies

**Choose limits based on operation cost:**

| Operation Type | Requests/Min | Rationale |
|---------------|--------------|-----------|
| AI Generation | 10 | Very expensive ($0.01-$0.10 per request) |
| Database Writes | 30 | Moderate cost, prevent abuse |
| API Reads | 60 | Standard API rate limit |
| Static Assets | 100+ | Cheap, allow high throughput |

### Window Strategies

```typescript
// Short window (burst protection)
{
  maxRequests: 10,
  windowSeconds: 10  // 10 requests per 10 seconds
}

// Standard window (minute-based)
{
  maxRequests: 60,
  windowSeconds: 60  // 60 requests per minute
}

// Long window (hourly quotas)
{
  maxRequests: 1000,
  windowSeconds: 3600  // 1000 requests per hour
}
```

## Architecture

### How It Works

1. **Client calls `checkRateLimit()`**
   ```
   checkRateLimit(userId, { action, maxRequests, windowSeconds })
   ```

2. **PostgreSQL atomic function**
   ```sql
   INSERT INTO rate_limits (key, count, window_end)
   VALUES (...)
   ON CONFLICT (key) DO UPDATE
   SET count = CASE WHEN expired THEN 1 ELSE count + 1 END
   RETURNING allowed, remaining, reset_at
   ```

3. **Response with headers**
   ```typescript
   {
     allowed: true,
     remaining: 58,
     resetAt: 1705500000000
   }
   ```

### Fallback Mechanism

```
┌─────────────────────────────────┐
│  checkRateLimit(userId, config) │
└────────────┬────────────────────┘
             │
             ▼
    ┌────────────────┐
    │ Try PostgreSQL │
    └────────┬───────┘
             │
      ┌──────┴──────┐
      │             │
   Success      Failure
      │             │
      ▼             ▼
  Return     In-Memory
  Result     Fallback
```

## Testing

```bash
cd skills/core/rate-limiting-persistent
npm test
```

## Database Schema

```sql
CREATE TABLE rate_limits (
    id UUID PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,  -- "action:userId"
    count INTEGER NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL
);

CREATE FUNCTION increment_rate_limit(
    p_key TEXT,
    p_max_requests INTEGER,
    p_window_seconds INTEGER
) RETURNS TABLE (allowed BOOLEAN, remaining INTEGER, reset_at TIMESTAMPTZ);
```

## Maintenance

### Cleanup Expired Entries

Run periodically via Supabase CRON or GitHub Actions:

```sql
SELECT cleanup_expired_rate_limits();
-- Returns count of deleted rows
```

### Monitoring

```sql
-- Active rate limits
SELECT key, count, window_end
FROM rate_limits
WHERE window_end > NOW()
ORDER BY count DESC
LIMIT 20;

-- Users hitting limits
SELECT key, count
FROM rate_limits
WHERE count >= (/* your max */)
AND window_end > NOW();
```

## Performance

**Benchmarks** (from internal SaaS production):
- Latency: ~5-10ms per check (PostgreSQL)
- Fallback latency: <1ms (in-memory)
- Throughput: 10,000+ checks/sec
- Database: Minimal storage (~100 bytes per active limit)

## Troubleshooting

### "No data returned from increment_rate_limit"

Ensure the PostgreSQL function is created:

```bash
supabase db push
# Or manually create function
```

### High latency

Enable connection pooling in Supabase:

```typescript
const supabase = createClient(url, key, {
  db: { schema: 'public' },
  auth: { persistSession: false }
})
```

### Fallback always triggered

Check Supabase connection:

```typescript
const { data, error } = await supabase.from('rate_limits').select('count()').limit(1)
if (error) console.error('Supabase connection issue:', error)
```

## License

MIT

---

**Extracted from:** a previous internal SaaS (production-grade, 67K lines)
**Last updated:** 2026-01-17
