/**
 * Server-side Supabase clients for Next.js
 * Provides three types of clients for different server contexts
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { NextRequest, NextResponse } from 'next/server'

export interface ServerConfig {
  supabaseUrl: string
  supabaseAnonKey: string
}

export interface ServiceConfig extends ServerConfig {
  supabaseServiceRoleKey: string
}

type CookieToSet = { name: string; value: string; options?: CookieOptions }

/**
 * Create a Supabase client for Server Components
 * Uses Next.js cookies() for session management
 *
 * @param config - Configuration with Supabase URL and anon key
 * @returns Supabase server client with cookie support
 *
 * @example
 * ```typescript
 * import { createClient } from '@project-forge/auth-supabase-complete/server'
 *
 * export async function ServerComponent() {
 *   const supabase = await createClient({
 *     supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
 *     supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 *   })
 *
 *   const { data: { user } } = await supabase.auth.getUser()
 *   return <div>Hello {user?.email}</div>
 * }
 * ```
 */
export async function createClient<Database = any>(config: ServerConfig) {
  try {
    const cookieStore = await cookies()

    return createServerClient<Database>(config.supabaseUrl, config.supabaseAnonKey, {
      cookies: {
        getAll() {
          try {
            return cookieStore.getAll()
          } catch {
            // Failed to get cookies, return empty array
            return []
          }
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }: CookieToSet) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    })
  } catch (error) {
    // If cookies() fails, create a client without cookie support
    console.error('[createClient] Failed to access cookies:', error)
    return createServerClient<Database>(config.supabaseUrl, config.supabaseAnonKey, {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // No-op when cookies are not available
        },
      },
    })
  }
}

/**
 * Create a Supabase client for API Route Handlers
 * Uses request/response cookies instead of next/headers cookies()
 *
 * @param config - Configuration with Supabase URL and anon key
 * @param request - NextRequest object
 * @param response - Optional NextResponse object for setting cookies
 * @returns Supabase server client for route handlers
 *
 * @example
 * ```typescript
 * import { NextRequest, NextResponse } from 'next/server'
 * import { createRouteHandlerClient } from '@project-forge/auth-supabase-complete/server'
 *
 * export async function GET(request: NextRequest) {
 *   const supabase = createRouteHandlerClient(
 *     {
 *       supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
 *       supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 *     },
 *     request
 *   )
 *
 *   const { data: { user } } = await supabase.auth.getUser()
 *   return NextResponse.json({ user })
 * }
 * ```
 */
export function createRouteHandlerClient<Database = any>(
  config: ServerConfig,
  request: NextRequest,
  response?: NextResponse
) {
  return createServerClient<Database>(config.supabaseUrl, config.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: CookieToSet[]) {
        // Set cookies on response if provided
        if (response) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        }
      },
    },
  })
}

/**
 * Create a Supabase client with service role key
 * Bypasses Row Level Security (RLS) policies
 * Use only for admin/backend operations
 *
 * @param config - Configuration with Supabase URL, anon key, and service role key
 * @returns Supabase client with service role privileges
 *
 * @example
 * ```typescript
 * import { createServiceClient } from '@project-forge/auth-supabase-complete/server'
 *
 * const supabase = createServiceClient({
 *   supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
 *   supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
 *   supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
 * })
 *
 * // Can access all data, bypassing RLS
 * const { data } = await supabase.from('users').select('*')
 * ```
 */
export function createServiceClient<Database = any>(config: ServiceConfig) {
  return createSupabaseClient<Database>(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
