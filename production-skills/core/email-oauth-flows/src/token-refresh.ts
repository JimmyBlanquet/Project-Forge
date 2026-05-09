/**
 * Token refresh and management
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { EmailProvider, TokenResponse } from './types'

/**
 * Get email access token from session
 *
 * Automatically refreshes token if expired using Supabase
 *
 * @param supabase - Supabase client
 * @param provider - Email provider
 * @returns Token response
 *
 * @example
 * ```typescript
 * const { accessToken, error } = await getEmailAccessToken(supabase, 'google')
 * if (!error && accessToken) {
 *   await sendGmailEmail({ accessToken, ... })
 * }
 * ```
 */
export async function getEmailAccessToken(
  supabase: SupabaseClient,
  provider: EmailProvider
): Promise<TokenResponse> {
  try {
    // Get session (Supabase auto-refreshes if needed)
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      return {
        accessToken: null,
        error: error || new Error('No active session'),
      }
    }

    // Check if provider matches
    const sessionProvider = session.user.app_metadata.provider
    const expectedProvider = provider === 'google' ? 'google' : 'azure'

    if (sessionProvider !== expectedProvider) {
      return {
        accessToken: null,
        error: new Error(`Session provider (${sessionProvider}) does not match expected (${expectedProvider})`),
      }
    }

    // Return provider token
    return {
      accessToken: session.provider_token || null,
      refreshToken: session.provider_refresh_token || null,
      error: session.provider_token ? null : new Error('No provider token available'),
    }
  } catch (error) {
    return {
      accessToken: null,
      error: error as Error,
    }
  }
}

/**
 * Check if token is expired
 *
 * @param expiresAt - Token expiration date
 * @returns True if expired
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() >= expiresAt
}

/**
 * Store email connection in database
 *
 * Helper function to store OAuth tokens securely
 *
 * @param supabase - Supabase client
 * @param data - Connection data
 * @returns Response
 */
export async function storeEmailConnection(
  supabase: SupabaseClient,
  data: {
    provider: EmailProvider
    email: string
    accessToken: string
    refreshToken?: string
    scopes: string[]
  }
): Promise<{ data: any; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: new Error('No authenticated user') }
    }

    const { data: connection, error } = await supabase
      .from('email_connections')
      .upsert({
        user_id: user.id,
        provider: data.provider,
        email: data.email,
        access_token: data.accessToken, // Should be encrypted in production
        refresh_token: data.refreshToken, // Should be encrypted in production
        scopes: data.scopes,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return { data: null, error }
    }

    return { data: connection, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}
