---
name: config-centralization
description: Type-safe, environment-aware configuration management for Next.js/TypeScript applications using a singleton pattern with runtime validation.
effort: low
---

# Config Centralization - Complete Documentation

## Overview

The Config Centralization skill provides type-safe, environment-aware configuration management for Next.js/TypeScript applications using a singleton pattern with runtime validation.

## Features

- **Type-Safe Configuration**: Full TypeScript generics support for compile-time safety
- **Environment Management**: Development, staging, production, test environments
- **Runtime Validation**: Required field validation with clear error messages at startup
- **Singleton Pattern**: Consistent configuration access across your application
- **Default Values**: Sensible defaults with environment variable override support
- **Zero Dependencies**: Portable implementation with no external dependencies

## Installation

### Prerequisites

- TypeScript 5+
- Node.js 18+
- (Optional) Next.js 14+ or any TypeScript project

### Install Steps

1. Run the install script from the skill directory:
   ```bash
   bash install.sh
   ```

2. The script will copy files to your project:
   - `config-manager.ts` - Core ConfigManager class
   - `types.ts` - TypeScript type definitions
   - `index.ts` - Public API exports

## Usage

### Basic Usage

```typescript
import { ConfigManager } from '@/lib/config'

// Get singleton instance
const config = ConfigManager.getInstance()

// Access configuration values
const apiUrl = config.get('API_URL')
const dbUrl = config.get('DATABASE_URL')
const port = config.get('PORT')

// Check if key exists
if (config.has('API_KEY')) {
  const apiKey = config.get('API_KEY')
}

// Get current environment
const env = config.getEnv() // 'development' | 'production' | 'staging' | 'test'

// Get all configuration
const allConfig = config.getAll()
```

### Type-Safe Configuration

```typescript
import { ConfigManager, createConfigManager } from '@/lib/config'
import type { AppConfig } from '@/lib/config'

// Option 1: Use generic type parameter
const config = ConfigManager.getInstance<AppConfig>()
const apiUrl: string = config.get('API_URL')! // Type-safe access

// Option 2: Use createConfigManager helper
interface MyConfig {
  API_URL: string
  PORT: number
  DATABASE_URL: string
}

const schema: MyConfig = {
  API_URL: '',
  PORT: 0,
  DATABASE_URL: ''
}

const config = createConfigManager(schema)
const url = config.get('API_URL') // Fully typed
```

### Environment-Aware Configuration

```typescript
// Configuration loads from process.env automatically
// and detects environment from NODE_ENV

const config = ConfigManager.getInstance({
  env: 'production', // Override environment
  defaults: {
    PORT: 3000,
    LOG_LEVEL: 'info',
    API_TIMEOUT: 5000
  }
})

// Environment variables take precedence over defaults
// If PORT is set in process.env, it overrides the default
```

### Required Field Validation

```typescript
// Validate required fields at application startup
try {
  const config = ConfigManager.getInstance({
    required: ['DATABASE_URL', 'API_URL', 'API_KEY'],
    defaults: {
      PORT: 3000,
      LOG_LEVEL: 'info'
    }
  })

  // Application starts successfully - all required fields present
} catch (error) {
  // Throws: "Missing required configuration: DATABASE_URL, API_URL
  //         Environment: production"
  console.error(error.message)
  process.exit(1)
}
```

### Runtime Configuration Updates

```typescript
const config = ConfigManager.getInstance()

// Set configuration value (use sparingly - prefer environment variables)
config.set('FEATURE_FLAG_NEW_UI', true)

// Get updated value
const isNewUI = config.get('FEATURE_FLAG_NEW_UI')
```

### Integration Example

```typescript
// lib/config/index.ts
import { ConfigManager } from './config-manager'
import type { AppConfig } from './types'

// Initialize configuration at app startup
export function initializeConfig() {
  return ConfigManager.getInstance<AppConfig>({
    env: process.env.NODE_ENV as any || 'development',
    required: [
      'DATABASE_URL',
      'API_URL'
    ],
    defaults: {
      PORT: 3000,
      HOST: '0.0.0.0',
      LOG_LEVEL: 'info',
      DB_POOL_MIN: 2,
      DB_POOL_MAX: 10,
      API_TIMEOUT: 5000
    }
  })
}

// app/page.tsx or pages/_app.tsx
import { initializeConfig } from '@/lib/config'

const config = initializeConfig()

export default function App() {
  // Use configuration throughout your app
  const apiUrl = config.get('API_URL')
  // ...
}
```

## Configuration Types

The skill provides predefined TypeScript interfaces:

```typescript
// BaseConfig - Common configuration
interface BaseConfig {
  NODE_ENV: 'development' | 'production' | 'staging' | 'test'
  PORT?: number
  HOST?: string
  LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error'
}

// DatabaseConfig - Database settings
interface DatabaseConfig extends BaseConfig {
  DATABASE_URL: string
  DB_POOL_MIN?: number
  DB_POOL_MAX?: number
  DB_SSL?: boolean
}

// APIConfig - API settings
interface APIConfig extends BaseConfig {
  API_URL: string
  API_KEY?: string
  API_TIMEOUT?: number
  API_RETRY_ATTEMPTS?: number
}

// AppConfig - Full application configuration
interface AppConfig extends BaseConfig, DatabaseConfig, APIConfig {
  // Extend with your custom fields
}
```

## Environment Variables

This skill loads configuration from `process.env`. Set environment variables in:

- `.env.local` - Local development (not committed)
- `.env.development` - Development defaults
- `.env.production` - Production defaults
- `.env.test` - Test environment

Example `.env.local`:
```bash
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/myapp
API_URL=https://api.example.com
API_KEY=your_api_key_here
PORT=3000
LOG_LEVEL=debug
```

**Note**: `process.env` values are always strings. The ConfigManager preserves types from defaults but returns strings for environment variables.

## Best Practices

1. **Initialize Early**: Create ConfigManager instance at app startup to catch validation errors early
2. **Use Required Fields**: Validate critical configuration with `required` option to fail fast
3. **Provide Defaults**: Supply sensible defaults for optional configuration
4. **Type Your Config**: Define TypeScript interfaces for full type safety
5. **Never Commit Secrets**: Use `.env.local` for sensitive data (add to `.gitignore`)
6. **Prefer Environment Variables**: Use `config.set()` sparingly - environment variables are more maintainable
7. **Singleton Reset**: Use `ConfigManager.reset()` in tests to ensure clean state between test runs

## Troubleshooting

### Error: "Missing required configuration"

**Cause**: Required environment variables are not set.

**Solution**:
1. Check `.env.local` file exists and contains required variables
2. Verify variable names match exactly (case-sensitive)
3. Check the error message for specific missing fields
4. Ensure `.env.local` is loaded (Next.js loads it automatically)

### Type Errors with get()

**Cause**: TypeScript cannot infer the return type.

**Solution**:
```typescript
// Add type parameter to getInstance
const config = ConfigManager.getInstance<AppConfig>()

// Or use non-null assertion if you know it exists
const url: string = config.get('API_URL')!
```

### Configuration Values are Strings

**Cause**: `process.env` always returns strings, even for numbers.

**Solution**: Use defaults to set proper types, or parse values:
```typescript
const config = ConfigManager.getInstance({
  defaults: {
    PORT: 3000 // Number type from default
  }
})

// Or parse manually
const port = parseInt(config.get('PORT') || '3000', 10)
```

### Singleton State in Tests

**Cause**: Singleton instance persists between tests.

**Solution**: Reset instance in test setup:
```typescript
import { beforeEach } from 'vitest'
import { ConfigManager } from '@/lib/config'

beforeEach(() => {
  ConfigManager.reset()
  // Clear test environment variables
  delete process.env.TEST_VAR
})
```

## API Reference

### ConfigManager Class

```typescript
class ConfigManager<T extends ConfigSchema = ConfigSchema> {
  /**
   * Get singleton instance with optional configuration
   */
  static getInstance<T extends ConfigSchema = ConfigSchema>(
    options?: ConfigOptions
  ): ConfigManager<T>

  /**
   * Reset singleton instance (useful for testing)
   */
  static reset(): void

  /**
   * Get configuration value by key
   */
  get<K extends keyof T>(key: K): T[K]

  /**
   * Get all configuration as immutable copy
   */
  getAll(): Readonly<T>

  /**
   * Set configuration value (use sparingly)
   */
  set<K extends keyof T>(key: K, value: T[K]): void

  /**
   * Check if configuration key exists and is defined
   */
  has(key: keyof T): boolean

  /**
   * Get current environment
   */
  getEnv(): string
}
```

### ConfigOptions Interface

```typescript
interface ConfigOptions {
  // Environment name (default: process.env.NODE_ENV || 'development')
  env?: 'development' | 'production' | 'staging' | 'test'

  // Required configuration fields (validates at startup)
  required?: string[]

  // Default values (applied if not in process.env)
  defaults?: ConfigSchema
}
```

### createConfigManager Helper

```typescript
function createConfigManager<T extends ConfigSchema>(
  schema: T,
  options?: ConfigOptions
): ConfigManager<T>
```

## Testing

The skill includes comprehensive tests (26 tests, >70% coverage). Run tests:

```bash
npm test
```

Example test patterns:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { ConfigManager } from './config-manager'

describe('My App Config', () => {
  beforeEach(() => {
    ConfigManager.reset()
    delete process.env.TEST_VAR
  })

  it('should load configuration with required fields', () => {
    process.env.DATABASE_URL = 'postgresql://localhost/test'

    const config = ConfigManager.getInstance({
      required: ['DATABASE_URL']
    })

    expect(config.get('DATABASE_URL')).toBe('postgresql://localhost/test')
  })
})
```

## License

MIT
