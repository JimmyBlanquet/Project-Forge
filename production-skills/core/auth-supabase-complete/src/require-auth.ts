/**
 * Authentication middleware for API routes
 * Provides requireAuth and requireAdminAuth helpers
 */

import { NextResponse, NextRequest } from 'next/server'
import { createClient, createRouteHandlerClient, type ServerConfig } from './server'
import type { SupabaseClient, User } from '@supabase/supabase-js'

type AuthResult =
  | { user: User; error: null; supabase: SupabaseClient }
  | { user: null; error: NextResponse; supabase: null }

/**
 * Require authentication for an API route
 * Returns user and supabase client if authenticated, or error response
 *
 * @param config - Supabase configuration
 * @param request - Optional NextRequest for better cookie handling
 * @returns AuthResult with user and supabase client, or error response
 *
 * @example
 * ```typescript
 * import { NextRequest, NextResponse } from 'next/server'
 * import { requireAuth } from '@project-forge/auth-supabase-complete'
 *
 * export async function GET(request: NextRequest) {
 *   const auth = await requireAuth(
 *     {
 *       supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
 *       supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 *     },
 *     request
 *   )
 *
 *   if (auth.error) return auth.error
 *
 *   // User is authenticated
 *   const { data } = await auth.supabase.from('posts').select('*')
 *   return NextResponse.json({ data, user: auth.user })
 * }
 * ```
 */
export async function requireAuth(
  config: ServerConfig,
  request?: NextRequest
): Promise<AuthResult> {
  try {
    // If request is provided, use route handler client (better cookie handling)
    const supabase = request ? createRouteHandlerClient(config, request) : await createClient(config)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    // Log auth errors for debugging
    if (authError) {
      console.error('[requireAuth] Supabase auth error:', {
        message: authError.message,
        status: authError.status,
      })
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Authentication service unavailable' },
          { status: 503 }
        ),
        supabase: null,
      }
    }

    if (!user) {
      return {
        user: null,
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        supabase: null,
      }
    }

    return { user, error: null, supabase: supabase as unknown as SupabaseClient }
  } catch (err) {
    // Catch unexpected errors (network timeouts, etc.)
    console.error('[requireAuth] Unexpected error:', err)
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Error verifying authentication' },
        { status: 500 }
      ),
      supabase: null,
    }
  }
}

export interface RequireAdminOptions {
  /** Name of the profiles table (default: 'profiles') */
  profilesTable?: string
  /** Name of the admin flag field (default: 'is_admin') */
  adminField?: string
}

/**
 * Require admin authentication for an API route
 * Checks both authentication and admin status
 *
 * @param config - Supabase configuration
 * @param request - Optional NextRequest for better cookie handling
 * @param options - Options for admin checking (table name, field name)
 * @returns AuthResult with user and supabase client, or error response
 *
 * @example
 * ```typescript
 * import { NextRequest, NextResponse } from 'next/server'
 * import { requireAdminAuth } from '@project-forge/auth-supabase-complete'
 *
 * export async function DELETE(request: NextRequest) {
 *   const auth = await requireAdminAuth(
 *     {
 *       supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
 *       supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 *     },
 *     request
 *   )
 *
 *   if (auth.error) return auth.error
 *
 *   // User is admin, can perform admin actions
 *   await auth.supabase.from('users').delete().eq('id', userId)
 *   return NextResponse.json({ success: true })
 * }
 * ```
 */
export async function requireAdminAuth(
  config: ServerConfig,
  request?: NextRequest,
  options: RequireAdminOptions = {}
): Promise<AuthResult> {
  const { profilesTable = 'profiles', adminField = 'is_admin' } = options

  const result = await requireAuth(config, request)
  if (result.error) return result

  try {
    const { data: profile, error: profileError } = await result.supabase
      .from(profilesTable)
      .select(adminField)
      .eq('id', result.user.id)
      .single()

    if (profileError) {
      console.error('[requireAdminAuth] Profile fetch error:', profileError)
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Error verifying permissions' },
          { status: 500 }
        ),
        supabase: null,
      }
    }

    const profileData = profile as Record<string, any> | null
    if (!profileData || !profileData[adminField]) {
      return {
        user: null,
        error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
        supabase: null,
      }
    }

    return result
  } catch (err) {
    console.error('[requireAdminAuth] Unexpected error:', err)
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Error verifying permissions' },
        { status: 500 }
      ),
      supabase: null,
    }
  }
}
