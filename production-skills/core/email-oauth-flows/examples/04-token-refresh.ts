/**
 * Example: Automatic Token Refresh
 *
 * Demonstrates token management and automatic refresh with Supabase
 */

import { createClient } from '@supabase/supabase-js'
import {
  getEmailAccessToken,
  isTokenExpired,
  storeEmailConnection,
  sendGmailEmail,
} from '@project-forge/email-oauth-flows'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

/**
 * Get token with automatic refresh
 *
 * Supabase automatically refreshes expired tokens when calling getSession()
 */
async function getTokenWithAutoRefresh() {
  const { accessToken, error } = await getEmailAccessToken(supabase, 'google')

  if (error) {
    console.error('Token error:', error)
    return null
  }

  console.log('Access token retrieved:', accessToken ? 'Success' : 'No token')
  return accessToken
}

/**
 * Check if token is expired manually
 */
function checkTokenExpiration() {
  const expiresAt = new Date(Date.now() + 3600000) // 1 hour from now

  if (isTokenExpired(expiresAt)) {
    console.log('Token is expired, need to refresh')
  } else {
    console.log('Token is still valid')
  }
}

/**
 * Store email connection in database
 *
 * Useful for managing multiple email accounts per user
 */
async function storeConnection() {
  const { accessToken, refreshToken } = await getEmailAccessToken(supabase, 'google')

  if (!accessToken) {
    throw new Error('No access token available')
  }

  const { data, error } = await storeEmailConnection(supabase, {
    provider: 'google',
    email: 'user@gmail.com',
    accessToken,
    refreshToken: refreshToken || undefined,
    scopes: ['gmail.send', 'gmail.readonly'],
  })

  if (error) {
    console.error('Failed to store connection:', error)
    return
  }

  console.log('Connection stored:', data)
}

/**
 * Retry pattern with token refresh
 *
 * If API call fails with 401, refresh token and retry
 */
async function sendEmailWithRetry() {
  let { accessToken } = await getEmailAccessToken(supabase, 'google')

  if (!accessToken) {
    throw new Error('No access token available')
  }

  // First attempt
  let { data, error } = await sendGmailEmail({
    accessToken,
    to: 'recipient@example.com',
    subject: 'Test',
    body: 'Test email',
  })

  // If 401 Unauthorized, token might be expired
  if (error && error.message.includes('401')) {
    console.log('Token expired, refreshing...')

    // Force session refresh
    const { data: { session } } = await supabase.auth.refreshSession()
    accessToken = session?.provider_token || null

    if (!accessToken) {
      throw new Error('Failed to refresh token')
    }

    // Retry with fresh token
    const retry = await sendGmailEmail({
      accessToken,
      to: 'recipient@example.com',
      subject: 'Test',
      body: 'Test email',
    })

    data = retry.data
    error = retry.error
  }

  if (error) {
    console.error('Failed to send email:', error)
    return
  }

  console.log('Email sent successfully:', data)
}

/**
 * Monitor token expiration
 *
 * Set up periodic checks for token expiration
 */
function monitorTokenExpiration() {
  setInterval(async () => {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      console.log('No active session')
      return
    }

    // Check if provider token exists
    if (!session.provider_token) {
      console.log('No provider token, user needs to re-authenticate')
      return
    }

    console.log('Token is valid')
  }, 60000) // Check every minute
}

// Usage examples
getTokenWithAutoRefresh()
checkTokenExpiration()
storeConnection()
sendEmailWithRetry()
monitorTokenExpiration()
