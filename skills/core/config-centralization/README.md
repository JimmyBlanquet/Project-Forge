# Config Centralization Skill

Type-safe, environment-aware configuration management for TypeScript/Next.js applications with runtime validation and zero dependencies.

## Quick Start

```bash
# 1. Install the skill
bash install.sh

# 2. Set up environment variables
cat > .env.local <<EOF
DATABASE_URL=postgresql://localhost:5432/myapp
API_URL=https://api.example.com
API_KEY=your_api_key_here
PORT=3000
EOF

# 3. Use in your project
```

```typescript
import { ConfigManager } from '@/lib/config'
import type { AppConfig } from '@/lib/config'

// Initialize with validation and defaults
const config = ConfigManager.getInstance<AppConfig>({
  required: ['DATABASE_URL', 'API_URL'],
  defaults: {
    PORT: 3000,
    LOG_LEVEL: 'info'
  }
})

// Type-safe access
const dbUrl = config.get('DATABASE_URL')
const apiUrl = config.get('API_URL')
const port = config.get('PORT')
```

## What This Skill Provides

- **Type-Safe Configuration**: Full TypeScript generics support with compile-time checking
- **Runtime Validation**: Required field validation at startup with clear error messages
- **Environment Management**: Development, staging, production, test environment support
- **Singleton Pattern**: Consistent configuration access across your entire application
- **Default Values**: Sensible defaults with environment variable override support
- **Zero Dependencies**: Portable implementation, works in any TypeScript project

## Key Features

### Singleton Pattern
```typescript
const config = ConfigManager.getInstance()
// Same instance everywhere in your app
```

### Required Field Validation
```typescript
const config = ConfigManager.getInstance({
  required: ['DATABASE_URL', 'API_KEY']
})
// Throws error at startup if missing - fail fast!
```

### Environment-Aware
```typescript
const config = ConfigManager.getInstance({
  env: 'production',
  defaults: { PORT: 3000 }
})
console.log(config.getEnv()) // 'production'
```

### Type Safety
```typescript
interface MyConfig {
  API_URL: string
  PORT: number
}

const config = ConfigManager.getInstance<MyConfig>()
const url: string = config.get('API_URL')! // Fully typed
```

## Installation

```bash
# From the skill directory
bash install.sh
```

The install script copies three files to your project:
- `config-manager.ts` - Core ConfigManager class
- `types.ts` - TypeScript type definitions
- `index.ts` - Public API exports

## Testing

Comprehensive test suite included (26 tests, >70% coverage):

```bash
npm test
```

## Documentation

See `SKILL.md` for complete documentation including:
- Detailed usage examples
- API reference
- TypeScript types
- Troubleshooting guide
- Integration patterns
- Best practices

## Example Use Cases

- ✅ Validate required environment variables at app startup
- ✅ Provide type-safe access to configuration across your app
- ✅ Manage different configurations per environment (dev/staging/prod)
- ✅ Set sensible defaults with environment override support
- ✅ Centralize configuration logic in one place

## License

MIT
