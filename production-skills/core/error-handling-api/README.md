# error-handling-api

Centralized API error handling with user-friendly messages and consistent responses

## Overview

**Category:** core
**Tier:** 1
**LOC:** 183
**Exports:** 6 symbols
**Dependencies:** 2 packages

## Installation

```bash
npm install @project-forge/skills
```

Or copy to your project:

```bash
cp -r production-skills/core/error-handling-api your-project/lib/
```

## Usage

```typescript
import { apiError } from '@project-forge/skills/error-handling-api'

// Use the apiError function
const result = await apiError(...)
```

## API Reference

### Functions

#### `apiError()`

Create a standardized error response

#### `apiSuccess()`

Create success response with consistent format

#### `withErrorHandler()`

Wrap async route handler with error catching

### Types

- `ApiErrorCode`
- `ApiErrorResponse`

## Dependencies

- `next` - Used 1 time(s)
- `@/lib` - Used 1 time(s)

## Examples

See `examples/basic-usage.ts` for complete examples.

## Testing

```bash
npm test
```

## License

MIT
