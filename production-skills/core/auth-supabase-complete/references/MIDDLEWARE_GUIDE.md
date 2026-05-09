# Next.js Middleware Guide for Session Management

This guide covers production-ready patterns for implementing Next.js middleware with Supabase authentication using the `auth-supabase-complete` skill.

## Table of Contents

1. [Overview](#overview)
2. [Basic Setup](#basic-setup)
3. [Session Refresh](#session-refresh)
4. [Protected Routes](#protected-routes)
5. [Role-Based Access](#role-based-access)
6. [Performance Optimization](#performance-optimization)
7. [Error Handling](#error-handling)
8. [Production Patterns](#production-patterns)

---

## Overview

### What is Next.js Middleware?

Next.js middleware runs before each request is completed, allowing you to:
- Refresh authentication tokens
- Redirect unauthenticated users
- Enforce role-based access control
- Add headers or cookies
- Monitor performance

### Why Use Middleware for Auth?

- **Automatic token refresh**: Keep sessions alive without client-side code
- **Server-side protection**: Routes are protected before the page renders
- **Performance**: Faster than checking auth in each Server Component
- **Centralized logic**: One place to manage all auth rules

---

## Basic Setup

### 1. Create Middleware File

Create `middleware.ts` in your project root (same level as `app/` directory):

```typescript
// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@project-forge/auth-supabase-complete/server'

const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Create Supabase client for middleware
  const supabase = createRouteHandlerClient(config, request, response)

  // Refresh session (updates cookies automatically)
  await supabase.auth.getUser()

  return response
}

// Configure which routes middleware runs on
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 2. Environment Variables

Ensure these are set in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Session Refresh

### Why Refresh Sessions?

Supabase access tokens expire after 1 hour by default. Middleware automatically refreshes them using the refresh token.

### Implementation

```typescript
export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createRouteHandlerClient(config, request, response)

  // This refreshes the session if needed
  // - Checks if access token is expired
  // - Uses refresh token to get new access token
  // - Updates cookies with new tokens
  const { data: { user } } = await supabase.auth.getUser()

  // Session is now refreshed (if it was expiring)
  return response
}
```

### Session Refresh Flow

```
1. User makes request
2. Middleware checks cookies for auth tokens
3. If access token expired (>1 hour old):
   - Uses refresh token to request new access token
   - Updates cookies with new tokens
   - Continue to route
4. If refresh token expired (>60 days old):
   - User needs to sign in again
   - Redirect to login
```

---

## Protected Routes

### Using Default Public Routes

```typescript
import {
  isPublicRoute,
  isProtectedRoute,
  DEFAULT_PUBLIC_ROUTES,
} from '@project-forge/auth-supabase-complete/route-matcher'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  const response = NextResponse.next()
  const supabase = createRouteHandlerClient(config, request, response)

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users to login
  if (!user && isProtectedRoute(pathname)) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}
```

### Custom Public Routes

```typescript
const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/pricing',
  '/blog',
  '/blog/:slug',
  '/auth/login',
  '/auth/signup',
  '/auth/callback',
  '/auth/reset-password',
] as const

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicRoute(pathname, PUBLIC_ROUTES)) {
    return NextResponse.next()
  }

  // ... rest of middleware
}
```

### Pattern Matching

The `isPublicRoute` function supports dynamic segments:

```typescript
const routes = [
  '/blog',       // Exact match
  '/blog/:slug', // Single param
  '/blog/:category/:slug', // Multiple params
  '/api/*',      // Wildcard
]

// These will match:
isPublicRoute('/blog', routes) // true
isPublicRoute('/blog/my-post', routes) // true (:slug)
isPublicRoute('/blog/tech/my-post', routes) // true (:category/:slug)
isPublicRoute('/api/posts', routes) // true (*)
isPublicRoute('/api/posts/123', routes) // true (*)

// These won't match:
isPublicRoute('/dashboard', routes) // false
```

---

## Role-Based Access

### Admin-Only Routes

```typescript
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  const response = NextResponse.next()
  const supabase = createRouteHandlerClient(config, request, response)

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check admin routes
  if (pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      // Redirect non-admins to home page
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}
```

### Role-Based Access Control (RBAC)

```typescript
// Define role requirements for different routes
const ROLE_ROUTES: Record<string, ('user' | 'moderator' | 'admin')[]> = {
  '/dashboard': ['user', 'moderator', 'admin'],
  '/moderator': ['moderator', 'admin'],
  '/admin': ['admin'],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  const response = NextResponse.next()
  const supabase = createRouteHandlerClient(config, request, response)

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Find required roles for current route
  const requiredRoles = Object.entries(ROLE_ROUTES).find(([route]) =>
    pathname.startsWith(route)
  )?.[1]

  if (requiredRoles) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role || 'user'

    if (!requiredRoles.includes(userRole)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}
```

### Onboarding Check

Redirect users who haven't completed onboarding:

```typescript
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip for public routes, onboarding, and API
  if (
    isPublicRoute(pathname) ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next()
  }

  const response = NextResponse.next()
  const supabase = createRouteHandlerClient(config, request, response)

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check onboarding status
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarding_completed) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  return response
}
```

---

## Performance Optimization

### 1. Skip Unnecessary Routes

```typescript
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static assets and health checks
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/api/health' ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // ... rest of middleware
}
```

### 2. Minimize Database Queries

Cache frequently accessed data:

```typescript
// Bad: Database query on every request
const { data: profile } = await supabase
  .from('profiles')
  .select('is_admin')
  .eq('id', user.id)
  .single()

// Better: Add is_admin to JWT claims
// Set this up in Supabase Dashboard → Authentication → Hooks → Create a custom claim
const isAdmin = user.app_metadata?.is_admin === true
```

### 3. Set Proper Matcher

Only run middleware where needed:

```typescript
export const config = {
  matcher: [
    // Match all routes except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',

    // Or be more specific
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/:path*',
  ],
}
```

### 4. Timeout Handling

Handle slow Supabase responses:

```typescript
export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createRouteHandlerClient(config, request, response)

  try {
    // Set a timeout for auth check
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Auth timeout')), 5000)
    )

    const authPromise = supabase.auth.getUser()

    const { data: { user } } = await Promise.race([
      authPromise,
      timeoutPromise,
    ]) as any

    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    return response
  } catch (error) {
    console.error('[Middleware] Auth error:', error)
    // On timeout or error, allow request to proceed
    // (Server Components will handle auth separately)
    return response
  }
}
```

---

## Error Handling

### Graceful Degradation

```typescript
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  const response = NextResponse.next()

  try {
    const supabase = createRouteHandlerClient(config, request, response)

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.error('[Middleware] Supabase error:', error)

      // If Supabase is down, decide how to handle:
      // Option 1: Redirect to login
      return NextResponse.redirect(new URL('/auth/login', request.url))

      // Option 2: Allow through and let Server Components handle it
      // return response
    }

    if (!user && isProtectedRoute(pathname)) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }

    return response
  } catch (error) {
    console.error('[Middleware] Unexpected error:', error)

    // On unexpected error, allow request (fail open)
    return response
  }
}
```

### Logging

```typescript
export async function middleware(request: NextRequest) {
  const startTime = Date.now()
  const { pathname } = request.nextUrl

  try {
    // ... middleware logic

    const duration = Date.now() - startTime
    console.log(`[Middleware] ${pathname} - ${duration}ms`)

    if (duration > 1000) {
      console.warn(`[Middleware] Slow request: ${pathname} took ${duration}ms`)
    }

    return response
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[Middleware] Error on ${pathname} after ${duration}ms:`, error)
    throw error
  }
}
```

---

## Production Patterns

### Complete Production Middleware

```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@project-forge/auth-supabase-complete/server'
import { isPublicRoute } from '@project-forge/auth-supabase-complete/route-matcher'

const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
}

export async function middleware(request: NextRequest) {
  const startTime = Date.now()
  const { pathname } = request.nextUrl

  // 1. Skip static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/api/health' ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // 2. Skip public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // 3. Create response and Supabase client
  const response = NextResponse.next()

  try {
    const supabase = createRouteHandlerClient(config, request, response)

    // 4. Refresh session with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Auth timeout')), 5000)
    )

    const authPromise = supabase.auth.getUser()

    const { data: { user }, error } = await Promise.race([
      authPromise,
      timeoutPromise,
    ]) as any

    // 5. Handle auth errors
    if (error) {
      console.error('[Middleware] Auth error:', error)
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('error', 'auth_error')
      return NextResponse.redirect(loginUrl)
    }

    // 6. Redirect unauthenticated users
    if (!user) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // 7. Check admin routes
    if (pathname.startsWith('/admin')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!profile?.is_admin) {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }

    // 8. Check onboarding (skip for onboarding routes)
    if (!pathname.startsWith('/onboarding')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single()

      if (!profile?.onboarding_completed) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
    }

    // 9. Log performance
    const duration = Date.now() - startTime
    if (duration > 1000) {
      console.warn(`[Middleware] Slow: ${pathname} - ${duration}ms`)
    }

    return response
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[Middleware] Error on ${pathname} after ${duration}ms:`, error)

    // Fail open - allow request to proceed
    return response
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

## Best Practices

### 1. Always Use Response Object

```typescript
// ✅ CORRECT: Pass response to client
const response = NextResponse.next()
const supabase = createRouteHandlerClient(config, request, response)

// ❌ WRONG: No response passed
const supabase = createRouteHandlerClient(config, request)
// Cookies won't be updated!
```

### 2. Handle Timeouts

```typescript
// Always set timeouts for external calls
const timeout = 5000 // 5 seconds
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Timeout')), timeout)
)

const result = await Promise.race([
  supabase.auth.getUser(),
  timeoutPromise,
])
```

### 3. Log Performance

```typescript
const startTime = Date.now()
// ... middleware logic
const duration = Date.now() - startTime

if (duration > 1000) {
  console.warn(`Slow middleware: ${request.nextUrl.pathname} - ${duration}ms`)
}
```

### 4. Fail Open on Errors

```typescript
try {
  // ... auth logic
} catch (error) {
  console.error('Middleware error:', error)
  // Let request through - Server Components will handle auth
  return NextResponse.next()
}
```

### 5. Test Middleware

```bash
# Test protected routes
curl -v http://localhost:3000/dashboard
# Should redirect to /auth/login

# Test with auth
curl -v -b "cookies.txt" http://localhost:3000/dashboard
# Should succeed
```

---

## Troubleshooting

### Issue: Infinite Redirect Loop

**Cause:** Login page is not in public routes

**Solution:**
```typescript
const PUBLIC_ROUTES = [
  '/auth/login', // ← Add this!
  '/auth/signup',
  '/auth/callback',
]
```

### Issue: Session Not Refreshing

**Cause:** Not passing response object to client

**Solution:**
```typescript
const response = NextResponse.next()
const supabase = createRouteHandlerClient(config, request, response)
// ↑ Must pass response
```

### Issue: Middleware Times Out

**Cause:** Supabase request taking too long

**Solution:** Add timeout handling (see Performance Optimization section)

### Issue: Cookies Not Set

**Cause:** Response object not returned

**Solution:**
```typescript
const response = NextResponse.next()
const supabase = createRouteHandlerClient(config, request, response)
await supabase.auth.getUser()
return response // ← Must return this response!
```

---

## Additional Resources

- [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [auth-supabase-complete README](./README.md)

---

**Last Updated:** 2026-01-16
**Compatible with:** auth-supabase-complete v1.0.0
