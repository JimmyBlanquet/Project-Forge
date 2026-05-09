/**
 * Outlook/Microsoft Graph OAuth and API integration
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { OAuthSignInOptions, SendEmailOptions, ListOutlookMessagesOptions, ApiResponse, EmailMessage } from './types'

/**
 * Sign in with Outlook OAuth (Microsoft Azure)
 *
 * @param supabase - Supabase client
 * @param options - OAuth options
 * @returns OAuth response
 *
 * @example
 * ```typescript
 * await signInWithOutlook(supabase, {
 *   redirectTo: 'http://localhost:3000/auth/callback',
 *   scopes: ['Mail.Send', 'Mail.Read'],
 * })
 * ```
 */
export async function signInWithOutlook(
  supabase: SupabaseClient,
  options: OAuthSignInOptions
): Promise<ApiResponse> {
  try {
    const scopeString = options.scopes
      .map(s => `https://graph.microsoft.com/${s}`)
      .join(' ')

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: options.redirectTo,
        scopes: scopeString,
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
 * Send email via Microsoft Graph API
 *
 * @param options - Send email options
 * @returns API response
 */
export async function sendOutlookEmail(
  options: SendEmailOptions
): Promise<ApiResponse> {
  try {
    const { accessToken, to, subject, body, html, cc, bcc } = options

    const toRecipients = (Array.isArray(to) ? to : [to]).map(email => ({
      emailAddress: { address: email },
    }))

    const ccRecipients = cc
      ? (Array.isArray(cc) ? cc : [cc]).map(email => ({
          emailAddress: { address: email },
        }))
      : []

    const bccRecipients = bcc
      ? (Array.isArray(bcc) ? bcc : [bcc]).map(email => ({
          emailAddress: { address: email },
        }))
      : []

    const message = {
      message: {
        subject,
        body: {
          contentType: html ? 'HTML' : 'Text',
          content: html || body,
        },
        toRecipients,
        ...(ccRecipients.length > 0 && { ccRecipients }),
        ...(bccRecipients.length > 0 && { bccRecipients }),
      },
    }

    const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      const errorData = await response.json() as { error?: { message?: string } }
      throw new Error(errorData.error?.message || 'Failed to send email')
    }

    return { data: { success: true }, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

/**
 * List Outlook messages
 *
 * @param options - List options
 * @returns Messages list
 */
export async function listOutlookMessages(
  options: ListOutlookMessagesOptions
): Promise<ApiResponse<EmailMessage[]>> {
  try {
    const { accessToken, top = 10, filter, skip } = options

    const params = new URLSearchParams({
      $top: top.toString(),
      ...(filter && { $filter: filter }),
      ...(skip && { $skip: skip.toString() }),
    })

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/messages?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to list messages')
    }

    interface GraphMessage {
      id: string
      subject: string
      from?: { emailAddress?: { address?: string } }
      toRecipients?: Array<{ emailAddress: { address: string } }>
      receivedDateTime: string
      bodyPreview: string
      body?: { content?: string }
    }

    const data = await response.json() as { value: GraphMessage[] }

    const messages: EmailMessage[] = data.value.map((msg) => ({
      id: msg.id,
      subject: msg.subject,
      from: msg.from?.emailAddress?.address || '',
      to: msg.toRecipients?.map((r) => r.emailAddress.address) || [],
      date: new Date(msg.receivedDateTime),
      snippet: msg.bodyPreview,
      body: msg.body?.content,
    }))

    return { data: messages, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}
