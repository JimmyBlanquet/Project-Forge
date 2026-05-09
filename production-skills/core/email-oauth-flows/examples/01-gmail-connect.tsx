/**
 * Example: Gmail OAuth Connect Button
 *
 * React component for initiating Gmail OAuth flow
 */

'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { signInWithGmail } from '@project-forge/email-oauth-flows'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function GmailConnectButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await signInWithGmail(supabase, {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: ['gmail.send', 'gmail.readonly'],
      })

      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect Gmail')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleConnect}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Connecting...' : 'Connect Gmail'}
      </button>

      {error && (
        <div className="p-4 bg-red-50 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      <div className="text-sm text-gray-600">
        <p>Scopes requested:</p>
        <ul className="list-disc list-inside mt-2">
          <li>gmail.send - Send emails on your behalf</li>
          <li>gmail.readonly - Read your email messages</li>
        </ul>
      </div>
    </div>
  )
}
