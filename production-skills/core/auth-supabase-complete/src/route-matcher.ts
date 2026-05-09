/**
 * Route matcher utility for middleware
 * Helps define public and protected routes for session management
 */

/**
 * Default public routes that don't require authentication
 * Customize this based on your application's needs
 */
export const DEFAULT_PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/callback',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/logout',
] as const

/**
 * Check if a pathname is a public route
 *
 * @param pathname - The pathname to check (e.g., '/auth/login')
 * @param publicRoutes - Array of public route patterns (default: DEFAULT_PUBLIC_ROUTES)
 * @returns true if the route is public, false otherwise
 *
 * @example
 * ```typescript
 * import { isPublicRoute } from '@project-forge/auth-supabase-complete'
 *
 * const pathname = '/auth/login'
 * if (isPublicRoute(pathname)) {
 *   // Allow access without authentication
 * }
 * ```
 */
export function isPublicRoute(
  pathname: string,
  publicRoutes: readonly string[] = DEFAULT_PUBLIC_ROUTES
): boolean {
  // Exact match for root route to avoid matching everything
  if (pathname === '/') {
    return publicRoutes.includes('/')
  }

  return publicRoutes.some(route => {
    // Skip root route in startsWith check
    if (route === '/') {
      return false
    }
    return pathname.startsWith(route)
  })
}

/**
 * Check if a pathname is a protected route
 * A protected route is one that is NOT in the public routes list
 *
 * @param pathname - The pathname to check (e.g., '/dashboard')
 * @param publicRoutes - Array of public route patterns (default: DEFAULT_PUBLIC_ROUTES)
 * @returns true if the route is protected (not public), false otherwise
 *
 * @example
 * ```typescript
 * import { isProtectedRoute } from '@project-forge/auth-supabase-complete'
 *
 * const pathname = '/dashboard'
 * if (isProtectedRoute(pathname)) {
 *   // Require authentication
 * }
 * ```
 */
export function isProtectedRoute(
  pathname: string,
  publicRoutes: readonly string[] = DEFAULT_PUBLIC_ROUTES
): boolean {
  return !isPublicRoute(pathname, publicRoutes)
}

/**
 * Create custom route matchers with your own public routes
 *
 * @param publicRoutes - Array of routes that should be public
 * @returns Object with isPublic and isProtected functions
 *
 * @example
 * ```typescript
 * import { createRouteMatcher } from '@project-forge/auth-supabase-complete'
 *
 * const customPublicRoutes = ['/', '/auth/login', '/blog', '/about']
 * const { isPublic, isProtected } = createRouteMatcher(customPublicRoutes)
 *
 * if (isProtected('/dashboard')) {
 *   // Require auth
 * }
 * ```
 */
export function createRouteMatcher(publicRoutes: readonly string[]) {
  return {
    isPublic: (pathname: string) => isPublicRoute(pathname, publicRoutes),
    isProtected: (pathname: string) => isProtectedRoute(pathname, publicRoutes),
  }
}
