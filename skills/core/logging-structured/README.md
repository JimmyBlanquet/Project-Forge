# Logging Structured

Structured logging for Next.js with typed contexts.

## Install
```bash
bash install.sh
```

## Usage
```typescript
import { createLogger } from '@/lib/logger'
const logger = createLogger({ module: 'api' })
logger.info('Request', { userId, action })
```

**Extracted from:** internal production SaaS
