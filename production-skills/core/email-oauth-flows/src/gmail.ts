/**
 * Gmail OAuth and API integration
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { OAuthSignInOptions, SendEmailOptions, ListGmailMessagesOptions, ApiResponse, EmailMessage } from './types'

/**
 * Sign in with Gmail OAuth
 *
 * @param supabase - Supabase client
 * @param options - OAuth options
 * @returns OAuth response
 *
 * @example
 * ```typescript
 * await signInWithGmail(supabase, {
 *   redirectTo: 'http://localhost:3000/auth/callback',
 *   scopes: ['gmail.send', 'gmail.readonly'],
 * })
 * ```
 */
export async function signInWithGmail(
  supabase: SupabaseClient,
  options: OAuthSignInOptions
): Promise<ApiResponse> {
  try {
    const scopeString = options.scopes
      .map(s => `https://www.googleapis.com/auth/${s}`)
      .join(' ')

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: options.redirectTo,
        scopes: scopeString,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

/**
 * Send email via Gmail API
 *
 * @param options - Send email options
 * @returns API response
 */
export async function sendGmailEmail(
  options: SendEmailOptions
): Promise<ApiResponse> {
  try {
    const { accessToken, to, subject, body, html, from, cc, bcc } = options

    // Create RFC 2822 formatted email
    const toHeader = Array.isArray(to) ? to.join(', ') : to
    const ccHeader = cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : ''
    const bccHeader = bcc ? (Array.isArray(bcc) ? bcc.join(', ') : bcc) : ''

    const messageParts = [
      `To: ${toHeader}`,
      from ? `From: ${from}` : '',
      ccHeader ? `Cc: ${ccHeader}` : '',
      bccHeader ? `Bcc: ${bccHeader}` : '',
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
    ]

    if (html) {
      messageParts.push('Content-Type: text/html; charset=utf-8')
      messageParts.push('')
      messageParts.push(html)
    } else {
      messageParts.push('Content-Type: text/plain; charset=utf-8')
      messageParts.push('')
      messageParts.push(body)
    }

    const message = messageParts.filter(Boolean).join('\r\n')
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedMessage }),
    })

    if (!response.ok) {
      const errorData = await response.json() as { error?: { message?: string } }
      throw new Error(errorData.error?.message || 'Failed to send email')
    }

    const data = await response.json() as { id: string; threadId: string }
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

/**
 * List Gmail messages
 *
 * @param options - List options
 * @returns Messages list
 */
export async function listGmailMessages(
  options: ListGmailMessagesOptions
): Promise<ApiResponse<EmailMessage[]>> {
  try {
    const { accessToken, maxResults = 10, query = '', pageToken } = options

    const params = new URLSearchParams({
      maxResults: maxResults.toString(),
      ...(query && { q: query }),
      ...(pageToken && { pageToken }),
    })

    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to list messages')
    }

    const data = await response.json() as { messages?: Array<{ id: string }> }

    // Fetch message details
    const messages: EmailMessage[] = []
    if (data.messages) {
      for (const msg of data.messages) {
        const detailResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
          {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          }
        )

        if (detailResponse.ok) {
          const detail = await detailResponse.json() as {
            id: string
            internalDate: string
            snippet: string
            payload: {
              headers: Array<{ name: string; value: string }>
            }
          }
          const headers = detail.payload.headers

          messages.push({
            id: detail.id,
            subject: headers.find((h) => h.name === 'Subject')?.value || '',
            from: headers.find((h) => h.name === 'From')?.value || '',
            to: [headers.find((h) => h.name === 'To')?.value || ''],
            date: new Date(parseInt(detail.internalDate)),
            snippet: detail.snippet,
          })
        }
      }
    }

    return { data: messages, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}
