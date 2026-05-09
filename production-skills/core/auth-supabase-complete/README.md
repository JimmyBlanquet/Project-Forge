# Auth Supabase Complete

Production-ready Supabase authentication for Next.js with TypeScript. Provides client and server-side auth helpers, session management, and route protection.

## Features

- ✅ **Multiple Clients**: Browser, Server Component, Route Handler, and Service Role clients
- ✅ **Session Management**: Automatic token refresh with Next.js middleware
- ✅ **Route Protection**: Built-in helpers for public/protected routes
- ✅ **API Middleware**: `requireAuth` and `requireAdminAuth` for API routes
- ✅ **TypeScript**: Full type safety with generic Database types
- ✅ **Zero Hard Dependencies**: Configurable, no path aliases
- ✅ **Production Tested**: Used in production SaaS with 1000+ users

## Installation

```bash
npm install @supabase/ssr @supabase/supabase-js
```

## Quick Start

### 1. Client-Side Auth (Browser)

```typescript
import { createClient } from '@project-forge/auth-supabase-complete'

const supabase = createClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})
```

### 2. Server Component Auth

```typescript
import { createServerClient, getUser } from '@project-forge/auth-supabase-complete'

export async function ServerComponent() {
  const config = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  }

  const user = await getUser(config)

  if (!user) {
    return <div>Please sign in</div>
  }

  return <div>Hello {user.email}</div>
}
```

### 3. API Route with Auth

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@project-forge/auth-supabase-complete'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    },
    request
  )

  if (auth.error) return auth.error

  // User is authenticated
  const { data } = await auth.supabase.from('posts').select('*')
  return NextResponse.json({ data, user: auth.user })
}
```

### 4. Admin-Only API Route

```typescript
import { requireAdminAuth } from '@project-forge/auth-supabase-complete'

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminAuth(
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    },
    request
  )

  if (auth.error) return auth.error

  // User is admin, can perform admin actions
  return NextResponse.json({ success: true })
}
```

## API Reference

### Client Functions

#### `createClient(config)`

Creates a browser client for client-side auth.

**Parameters**:
- `config.supabaseUrl` - Supabase project URL
- `config.supabaseAnonKey` - Supabase anon key

### Server Functions

#### `createServerClient(config)`

Creates a server client for Server Components with Next.js cookies support.

#### `createRouteHandlerClient(config, request, response?)`

Creates a server client for API Route Handlers with request/response cookies.

**Parameters**:
- `config` - Supabase configuration
- `request` - NextRequest object
- `response` - Optional NextResponse object

#### `createServiceClient(config)`

Creates a service role client that bypasses RLS policies.

**Parameters**:
- `config.supabaseServiceRoleKey` - Service role key (in addition to URL and anon key)

### Auth Utilities

#### `getUser(config)`

Get currently authenticated user.

**Returns**: `User | null`

#### `getProfile(config, tableName?)`

Get user profile from profiles table.

**Returns**: `Profile | null`

#### `getUserWithProfile(config, tableName?)`

Get user and profile together.

**Returns**: `{ user: User, profile: Profile } | null`

#### `signOut(config, redirectUrl?)`

Sign out current user and redirect.

### API Middleware

#### `requireAuth(config, request?)`

Require authentication for an API route.

**Returns**: `AuthResult` with user, supabase client, or error response

#### `requireAdminAuth(config, request?, options?)`

Require admin authentication for an API route.

**Options**:
- `profilesTable` - Name of profiles table (default: 'profiles')
- `adminField` - Name of admin flag field (default: 'is_admin')

### Route Matching

#### `isPublicRoute(pathname, publicRoutes?)`

Check if a pathname is a public route.

#### `isProtectedRoute(pathname, publicRoutes?)`

Check if a pathname is a protected route.

#### `createRouteMatcher(publicRoutes)`

Create custom route matchers with your own public routes.

## Examples

See `/examples` directory for:
- Client-side authentication
- Server-side authentication
- API routes with auth
- Middleware implementation
- Admin-only routes
- Social auth (OAuth)
- RLS patterns

## Database Setup

This skill assumes you have a `profiles` table:

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
```

## Middleware Example

```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { isPublicRoute } from '@project-forge/auth-supabase-complete'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          request.cookies.delete(name)
          response.cookies.delete(name)
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  if (!user && !isPublicRoute(pathname)) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return response
}
```

## TypeScript Support

All functions support generic Database types:

```typescript
import type { Database } from './types/database'

const supabase = createClient<Database>({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
})

// Fully typed
const { data } = await supabase.from('profiles').select('*')
```

## License

MIT

## Related Skills

- `rate-limiting-persistent` - Rate limiting for API routes
- `error-handling-api` - Standardized error handling
- `payments-stripe-full` - Stripe payment integration
