/**
 * Browser client for Supabase
 * Use this in Client Components and client-side code
 */

import { createBrowserClient } from '@supabase/ssr'

export interface ClientConfig {
  supabaseUrl: string
  supabaseAnonKey: string
}

/**
 * Create a Supabase client for browser/client-side usage
 *
 * @param config - Configuration with Supabase URL and anon key
 * @returns Supabase browser client
 *
 * @example
 * ```typescript
 * import { createClient } from '@project-forge/auth-supabase-complete'
 *
 * const supabase = createClient({
 *   supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
 *   supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 * })
 *
 * const { data, error } = await supabase.auth.signInWithPassword({
 *   email: 'user@example.com',
 *   password: 'password'
 * })
 * ```
 */
export function createClient<Database = any>(config: ClientConfig) {
  return createBrowserClient<Database>(config.supabaseUrl, config.supabaseAnonKey)
}
