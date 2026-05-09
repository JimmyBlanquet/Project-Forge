---
name: logging-structured
description: Structured logging with typed contexts for Next.js applications. JSON output for production, pretty-print for development.
effort: medium
---

# Logging Structured Skill

**Version:** 1.0.0 | **Category:** Core | **Production-ready:** ✅

## Description

Structured logging with typed contexts for Next.js applications. JSON output for production, pretty-print for development.

## Features

- 📝 Structured JSON logging
- 🎨 Pretty-print in development
- 🏷️ Typed log contexts
- ⚡ Performance tracking
- 🔍 Request tracing
- 📊 Log levels (debug, info, warn, error)

## Installation

```bash
cd skills/core/logging-structured && bash install.sh
```

## Usage

```typescript
import { createLogger } from '@/lib/logger'

const logger = createLogger({ module: 'api' })

logger.info('Processing request', { userId, action: 'login' })
logger.error('Failed to authenticate', { error })
logger.debug('Cache hit', { key, ttl: 300 })
```

## Files

- `lib/logger/index.ts` - Main logger factory
- `lib/logger/types.ts` - TypeScript types
- `lib/logger/middleware.ts` - Next.js middleware (optional)
- `lib/logger/classification.ts` - Log classification helpers

**Extracted from:** internal production SaaS
