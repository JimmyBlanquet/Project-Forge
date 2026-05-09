/**
 * Example: Outlook OAuth Connect Button
 *
 * React component for initiating Microsoft OAuth flow
 */

'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { signInWithOutlook } from '@project-forge/email-oauth-flows'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function OutlookConnectButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await signInWithOutlook(supabase, {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: ['Mail.Send', 'Mail.Read'],
      })

      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect Outlook')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleConnect}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
      >
        <MicrosoftIcon />
        {loading ? 'Connecting...' : 'Connect Outlook'}
      </button>

      {error && (
        <div className="p-4 bg-red-50 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      <div className="text-sm text-gray-600">
        <p>Microsoft Graph scopes requested:</p>
        <ul className="list-disc list-inside mt-2">
          <li>Mail.Send - Send emails from your mailbox</li>
          <li>Mail.Read - Read your email messages</li>
        </ul>
        <p className="mt-2 text-xs text-gray-500">
          Note: Requires Microsoft 365 license and Exchange Online mailbox
        </p>
      </div>
    </div>
  )
}

function MicrosoftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 23 23" fill="none">
      <path d="M0 0h11v11H0z" fill="#f25022" />
      <path d="M12 0h11v11H12z" fill="#00a4ef" />
      <path d="M0 12h11v11H0z" fill="#7fba00" />
      <path d="M12 12h11v11H12z" fill="#ffb900" />
    </svg>
  )
}
