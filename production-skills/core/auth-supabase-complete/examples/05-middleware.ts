/**
 * Example 5: Next.js Middleware for Session Management
 *
 * Production-ready middleware with:
 * - Automatic session refresh
 * - Protected route handling
 * - Public route bypass
 * - Redirect logic for unauthenticated users
 * - Cookie management
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@project-forge/auth-supabase-complete/server'
import {
  isPublicRoute,
  isProtectedRoute,
  DEFAULT_PUBLIC_ROUTES,
} from '@project-forge/auth-supabase-complete/route-matcher'

// Configuration
const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
}

// Example 1: Basic middleware with session refresh
export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Create Supabase client for route handler
  const supabase = createRouteHandlerClient(config, request, response)

  // Refresh session if exists
  // This automatically updates cookies with new session tokens
  await supabase.auth.getUser()

  return response
}

// Example 2: Middleware with protected routes
export async function middlewareWithProtection(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  const response = NextResponse.next()
  const supabase = createRouteHandlerClient(config, request, response)

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated and accessing protected route
  if (!user && isProtectedRoute(pathname)) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

// Example 3: Middleware with custom public routes
const CUSTOM_PUBLIC_ROUTES = [
  '/',
  '/about',
  '/contact',
  '/auth/login',
  '/auth/signup',
  '/auth/callback',
  '/auth/reset-password',
  '/blog',
  '/blog/:slug',
] as const

export async function middlewareWithCustomRoutes(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if route is public using custom routes
  if (isPublicRoute(pathname, CUSTOM_PUBLIC_ROUTES)) {
    return NextResponse.next()
  }

  const response = NextResponse.next()
  const supabase = createRouteHandlerClient(config, request, response)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

// Example 4: Middleware with admin route protection
export async function middlewareWithAdminProtection(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip for public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  const response = NextResponse.next()
  const supabase = createRouteHandlerClient(config, request, response)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check if user is authenticated
  if (!user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check for admin routes
  if (pathname.startsWith('/admin')) {
    // Fetch user profile to check admin status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      // Redirect non-admin users to home
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

// Example 5: Middleware with role-based access control
interface UserProfile {
  id: string
  role: 'user' | 'moderator' | 'admin'
}

const ROLE_ROUTES: Record<string, ('user' | 'moderator' | 'admin')[]> = {
  '/dashboard': ['user', 'moderator', 'admin'],
  '/moderator': ['moderator', 'admin'],
  '/admin': ['admin'],
}

export async function middlewareWithRBAC(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  const response = NextResponse.next()
  const supabase = createRouteHandlerClient(config, request, response)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check if route requires specific role
  const requiredRoles = Object.entries(ROLE_ROUTES).find(([route]) =>
    pathname.startsWith(route)
  )?.[1]

  if (requiredRoles) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = (profile as UserProfile | null)?.role || 'user'

    if (!requiredRoles.includes(userRole)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

// Example 6: Middleware with onboarding check
export async function middlewareWithOnboarding(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip for auth routes and onboarding
  if (
    isPublicRoute(pathname) ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next()
  }

  const response = NextResponse.next()
  const supabase = createRouteHandlerClient(config, request, response)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check if user has completed onboarding
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarding_completed) {
    // Redirect to onboarding if not completed
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  return response
}

// Example 7: Middleware with rate limiting for authenticated users
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export async function middlewareWithRateLimit(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  const response = NextResponse.next()
  const supabase = createRouteHandlerClient(config, request, response)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check rate limit for API routes
  if (pathname.startsWith('/api')) {
    const now = Date.now()
    const userLimit = rateLimitMap.get(user.id)

    if (userLimit) {
      if (now < userLimit.resetAt) {
        if (userLimit.count >= 100) {
          // 100 requests per minute
          return NextResponse.json(
            { error: 'Rate limit exceeded' },
            { status: 429 }
          )
        }
        userLimit.count++
      } else {
        // Reset counter
        rateLimitMap.set(user.id, { count: 1, resetAt: now + 60000 })
      }
    } else {
      // Initialize counter
      rateLimitMap.set(user.id, { count: 1, resetAt: now + 60000 })
    }
  }

  return response
}

// Example 8: Complete production middleware
export async function productionMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and API health check
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/api/health'
  ) {
    return NextResponse.next()
  }

  // Skip for public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  const response = NextResponse.next()
  const supabase = createRouteHandlerClient(config, request, response)

  // Refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user && isProtectedRoute(pathname)) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check admin routes
  if (user && pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Check onboarding status
  if (user && !pathname.startsWith('/onboarding')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    if (!profile?.onboarding_completed) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  return response
}

// Matcher configuration - tells Next.js which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
