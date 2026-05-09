# Rate Limiting Persistent Skill

Persistent rate limiting with PostgreSQL atomic counters. Survives serverless cold starts.

## Quick Install

```bash
cd skills/core/rate-limiting-persistent
bash install.sh
supabase db push  # Apply migration
```

## What You Get

- ✅ PostgreSQL-backed persistent rate limits
- ✅ Atomic counters (no race conditions)
- ✅ Automatic in-memory fallback
- ✅ Serverless-ready (Vercel, Railway)
- ✅ Production-tested (internal production SaaS)

## Quick Start

```typescript
import { checkRateLimit } from '@/lib/rate-limit/persistent-limiter'

const result = await checkRateLimit(userId, {
  action: 'api',
  maxRequests: 60,
  windowSeconds: 60
})

if (!result.allowed) {
  return new Response('Rate limited', {
    status: 429,
    headers: {
      'X-RateLimit-Reset': new Date(result.resetAt).toISOString()
    }
  })
}
```

## Rate Limit Strategies

| Operation | Req/Min | Rationale |
|-----------|---------|-----------|
| AI Gen | 10 | Expensive |
| DB Writes | 30 | Moderate |
| API Reads | 60 | Standard |
| Static | 100+ | Cheap |

## Files Installed

```
src/lib/rate-limit/
└── persistent-limiter.ts

supabase/migrations/
└── 20251223100001_create_rate_limits.sql
```

## Documentation

See [SKILL.md](./SKILL.md) for complete documentation.

---

**Version:** 1.0.0
**Extracted from:** internal production SaaS
**License:** MIT
