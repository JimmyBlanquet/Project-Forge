# Rate Limiting Persistent

Production-ready persistent rate limiting for Next.js APIs using PostgreSQL/Supabase.

## Features

- ✅ Persistent storage (survives serverless cold starts)
- ✅ Atomic counter increments (no race conditions)
- ✅ Automatic fallback to in-memory if database unavailable
- ✅ Standard HTTP rate limit headers
- ✅ Zero path aliases or dependencies
- ✅ Full TypeScript support

## Installation

```bash
npm install @project-forge/rate-limiting-persistent @supabase/supabase-js
```

## Quick Start

See `SKILL.md` for full documentation.

```typescript
import { checkRateLimit } from '@project-forge/rate-limiting-persistent'

const result = await checkRateLimit(dbConfig, userId, {
  action: 'api_call',
  maxRequests: 60,
  windowSeconds: 60,
})

if (!result.allowed) {
  return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
}
```

## License

MIT
