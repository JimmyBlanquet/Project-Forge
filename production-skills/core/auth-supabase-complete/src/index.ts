/**
 * Auth Supabase Complete
 * Production-ready Supabase authentication for Next.js
 *
 * @packageDocumentation
 */

// Client-side
export { createClient } from './client'
export type { ClientConfig } from './client'

// Server-side clients
export {
  createClient as createServerClient,
  createRouteHandlerClient,
  createServiceClient,
} from './server'
export type { ServerConfig, ServiceConfig } from './server'

// Auth utilities
export { signOut, getUser, getProfile, getUserWithProfile, getSupabaseClient } from './auth'

// API route auth
export { requireAuth, requireAdminAuth } from './require-auth'
export type { RequireAdminOptions } from './require-auth'

// Route matching
export {
  isPublicRoute,
  isProtectedRoute,
  createRouteMatcher,
  DEFAULT_PUBLIC_ROUTES,
} from './route-matcher'
