/**
 * Server-side auth utility functions
 * Provides common auth operations with proper error handling
 */

'use server'

import { redirect } from 'next/navigation'
import { createClient, type ServerConfig } from './server'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Sign out the current user and redirect to login
 *
 * @param config - Supabase configuration
 * @param redirectUrl - URL to redirect after sign out (default: '/auth/login')
 *
 * @example
 * ```typescript
 * import { signOut } from '@project-forge/auth-supabase-complete'
 *
 * export async function handleSignOut() {
 *   await signOut({
 *     supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
 *     supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 *   })
 * }
 * ```
 */
export async function signOut(config: ServerConfig, redirectUrl: string = '/auth/login') {
  const supabase = await createClient(config)
  await supabase.auth.signOut()
  redirect(redirectUrl)
}

/**
 * Get the currently authenticated user
 *
 * @param config - Supabase configuration
 * @returns User object or null if not authenticated
 *
 * @example
 * ```typescript
 * const user = await getUser({
 *   supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
 *   supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 * })
 *
 * if (!user) {
 *   return <div>Please sign in</div>
 * }
 * ```
 */
export async function getUser(config: ServerConfig) {
  const supabase = await createClient(config)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/**
 * Get the user's profile from a 'profiles' table
 * Assumes you have a profiles table with id matching user.id
 *
 * @param config - Supabase configuration
 * @param tableName - Name of the profiles table (default: 'profiles')
 * @returns Profile object or null if not found
 *
 * @example
 * ```typescript
 * const profile = await getProfile({
 *   supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
 *   supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 * })
 *
 * console.log(profile?.display_name)
 * ```
 */
export async function getProfile<ProfileType = any>(
  config: ServerConfig,
  tableName: string = 'profiles'
): Promise<ProfileType | null> {
  const supabase = await createClient(config)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from(tableName).select('*').eq('id', user.id).single()

  return profile as ProfileType | null
}

/**
 * Get user and profile together
 *
 * @param config - Supabase configuration
 * @param tableName - Name of the profiles table (default: 'profiles')
 * @returns Object with user and profile, or null if not authenticated
 *
 * @example
 * ```typescript
 * const data = await getUserWithProfile({
 *   supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
 *   supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 * })
 *
 * if (data) {
 *   console.log(data.user.email, data.profile.display_name)
 * }
 * ```
 */
export async function getUserWithProfile<ProfileType = any>(
  config: ServerConfig,
  tableName: string = 'profiles'
) {
  const supabase = await createClient(config)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from(tableName).select('*').eq('id', user.id).single()

  return { user, profile: profile as ProfileType }
}

/**
 * Get a Supabase client instance
 * Useful when you need direct access to the client
 *
 * @param config - Supabase configuration
 * @returns Supabase client instance
 *
 * @example
 * ```typescript
 * const supabase = await getSupabaseClient({
 *   supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
 *   supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 * })
 *
 * const { data } = await supabase.from('posts').select('*')
 * ```
 */
export async function getSupabaseClient<Database = any>(
  config: ServerConfig
): Promise<SupabaseClient<Database>> {
  return (await createClient<Database>(config)) as unknown as SupabaseClient<Database>
}
