import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'
import 'server-only'

// Service role client for admin operations (bypasses RLS)
// Use this ONLY for server-side operations that require elevated privileges
// such as webhook handlers, admin actions, etc.
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables for service role client')
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
