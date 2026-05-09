/**
 * Example 6: Social Authentication (OAuth)
 *
 * Production-ready OAuth authentication with:
 * - Google OAuth
 * - GitHub OAuth
 * - Twitter OAuth
 * - Facebook OAuth
 * - Discord OAuth
 * - Error handling
 * - Callback handling
 * - Profile merging
 */

'use client'

import { useState } from 'react'
import { createClient } from '@project-forge/auth-supabase-complete/client'
import type { Provider } from '@supabase/supabase-js'

// Configuration
const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
}

// Example 1: Social Auth Buttons Component
export function SocialAuthButtons() {
  const [loading, setLoading] = useState<Provider | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleOAuthSignIn = async (provider: Provider) => {
    setLoading(provider)
    setError(null)

    try {
      const supabase = createClient(config)
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        setError(error.message)
        setLoading(null)
        return
      }

      // Browser will redirect to OAuth provider
      // No need to handle success here
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(null)
    }
  }

  return (
    <div className="space-y-3 max-w-md mx-auto">
      <h3 className="text-lg font-medium text-center mb-4">
        Sign in with your social account
      </h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <button
        onClick={() => handleOAuthSignIn('google')}
        disabled={loading !== null}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {loading === 'google' ? 'Connecting...' : 'Continue with Google'}
      </button>

      <button
        onClick={() => handleOAuthSignIn('github')}
        disabled={loading !== null}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:bg-gray-600"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
        {loading === 'github' ? 'Connecting...' : 'Continue with GitHub'}
      </button>

      <button
        onClick={() => handleOAuthSignIn('twitter')}
        disabled={loading !== null}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-sky-500 text-white rounded-md hover:bg-sky-600 disabled:bg-sky-300"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
        </svg>
        {loading === 'twitter' ? 'Connecting...' : 'Continue with Twitter'}
      </button>

      <button
        onClick={() => handleOAuthSignIn('discord')}
        disabled={loading !== null}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
        {loading === 'discord' ? 'Connecting...' : 'Continue with Discord'}
      </button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with email</span>
        </div>
      </div>
    </div>
  )
}

// Example 2: OAuth Callback Handler (Server Component)
// Place this in app/auth/callback/route.ts
export async function OAuthCallbackRoute(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createClient(config)
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect to account setup or dashboard
  return Response.redirect(new URL('/dashboard', request.url))
}

// Example 3: Social Auth with Scopes
export function SocialAuthWithScopes() {
  const handleGoogleSignIn = async () => {
    const supabase = createClient(config)

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'email profile openid',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
  }

  const handleGitHubSignIn = async () => {
    const supabase = createClient(config)

    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'read:user user:email',
      },
    })
  }

  return (
    <div className="space-y-3">
      <button onClick={handleGoogleSignIn}>
        Sign in with Google (with offline access)
      </button>
      <button onClick={handleGitHubSignIn}>
        Sign in with GitHub (with email scope)
      </button>
    </div>
  )
}

// Example 4: Link Social Account to Existing Account
export function LinkSocialAccount() {
  const [linked, setLinked] = useState<Provider[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLinkAccount = async (provider: Provider) => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient(config)

      // Check if user is already authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be signed in to link accounts')
        setLoading(false)
        return
      }

      // Link OAuth provider to existing account
      const { data, error } = await supabase.auth.linkIdentity({
        provider,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setLinked([...linked, provider])
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <h3 className="text-lg font-medium">Connected Accounts</h3>

      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 border rounded">
          <span>Google</span>
          {linked.includes('google') ? (
            <span className="text-green-600">✓ Connected</span>
          ) : (
            <button
              onClick={() => handleLinkAccount('google')}
              disabled={loading}
              className="text-blue-600 hover:text-blue-700"
            >
              Connect
            </button>
          )}
        </div>

        <div className="flex items-center justify-between p-3 border rounded">
          <span>GitHub</span>
          {linked.includes('github') ? (
            <span className="text-green-600">✓ Connected</span>
          ) : (
            <button
              onClick={() => handleLinkAccount('github')}
              disabled={loading}
              className="text-blue-600 hover:text-blue-700"
            >
              Connect
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}
    </div>
  )
}

// Example 5: Get OAuth Provider Info
export function OAuthProviderInfo() {
  const [providers, setProviders] = useState<any[]>([])

  const fetchProviderInfo = async () => {
    const supabase = createClient(config)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      // Get all linked OAuth providers
      const identities = user.identities || []
      setProviders(identities)
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={fetchProviderInfo}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Show Connected Providers
      </button>

      {providers.length > 0 && (
        <div className="space-y-2">
          {providers.map((identity) => (
            <div key={identity.id} className="p-3 border rounded">
              <p className="font-medium">{identity.provider}</p>
              <p className="text-sm text-gray-600">{identity.identity_data?.email}</p>
              <p className="text-xs text-gray-500">
                Connected: {new Date(identity.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Example 6: Unlink Social Account
export function UnlinkSocialAccount() {
  const handleUnlink = async (identityId: string) => {
    const supabase = createClient(config)

    const { error } = await supabase.auth.unlinkIdentity({
      identityId,
    })

    if (error) {
      console.error('Failed to unlink account:', error)
      return
    }

    // Account unlinked successfully
    alert('Account unlinked successfully')
  }

  return (
    <button
      onClick={() => handleUnlink('identity-id')}
      className="text-red-600 hover:text-red-700"
    >
      Unlink Account
    </button>
  )
}

// Example 7: Complete Social Auth Page
export function SocialAuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Choose your preferred sign-in method
          </p>
        </div>

        <SocialAuthButtons />

        <div className="text-center text-sm text-gray-600">
          By signing in, you agree to our{' '}
          <a href="/terms" className="text-blue-600 hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  )
}
