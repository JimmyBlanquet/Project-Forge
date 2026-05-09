/**
 * Example: Multi-Provider Email Dashboard
 *
 * React component showing connected email accounts and recent messages
 */

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  getEmailAccessToken,
  listGmailMessages,
  listOutlookMessages,
  type EmailMessage,
  type EmailProvider,
} from '@project-forge/email-oauth-flows'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function EmailDashboard() {
  const [provider, setProvider] = useState<EmailProvider | null>(null)
  const [messages, setMessages] = useState<EmailMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    detectProvider()
  }, [])

  const detectProvider = async () => {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      setError('Not authenticated')
      return
    }

    const sessionProvider = session.user.app_metadata.provider
    if (sessionProvider === 'google') {
      setProvider('google')
      loadGmailMessages()
    } else if (sessionProvider === 'azure') {
      setProvider('azure')
      loadOutlookMessages()
    }
  }

  const loadGmailMessages = async () => {
    setLoading(true)
    setError(null)

    try {
      const { accessToken } = await getEmailAccessToken(supabase, 'google')

      if (!accessToken) {
        setError('No access token available')
        return
      }

      const { data, error } = await listGmailMessages({
        accessToken,
        maxResults: 10,
        query: 'is:unread', // Only unread messages
      })

      if (error) {
        setError(error.message)
      } else if (data) {
        setMessages(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const loadOutlookMessages = async () => {
    setLoading(true)
    setError(null)

    try {
      const { accessToken } = await getEmailAccessToken(supabase, 'azure')

      if (!accessToken) {
        setError('No access token available')
        return
      }

      const { data, error } = await listOutlookMessages({
        accessToken,
        top: 10,
        filter: 'isRead eq false', // Only unread messages
      })

      if (error) {
        setError(error.message)
      } else if (data) {
        setMessages(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const refresh = () => {
    if (provider === 'google') {
      loadGmailMessages()
    } else if (provider === 'azure') {
      loadOutlookMessages()
    }
  }

  if (!provider) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">No email provider connected</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {provider === 'google' ? 'Gmail' : 'Outlook'} Inbox
        </h1>
        <button
          onClick={refresh}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {messages.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            No unread messages
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg">{message.subject}</h3>
              <span className="text-sm text-gray-500">
                {message.date.toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              From: {message.from}
            </p>
            <p className="text-gray-700 line-clamp-2">{message.snippet}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="font-semibold mb-2">Connected Account</h2>
        <p className="text-sm text-gray-600">
          Provider: {provider === 'google' ? 'Gmail (Google)' : 'Outlook (Microsoft)'}
        </p>
        <p className="text-sm text-gray-600">
          Messages shown: {messages.length}
        </p>
      </div>
    </div>
  )
}
