/**
 * Example: Send Email via Gmail API
 *
 * Demonstrates sending emails through Gmail with proper error handling
 */

import { createClient } from '@supabase/supabase-js'
import { getEmailAccessToken, sendGmailEmail } from '@project-forge/email-oauth-flows'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

/**
 * Send a simple text email
 */
async function sendTextEmail() {
  // Get access token (auto-refreshed by Supabase)
  const { accessToken, error: tokenError } = await getEmailAccessToken(supabase, 'google')

  if (tokenError || !accessToken) {
    console.error('Failed to get access token:', tokenError)
    return
  }

  // Send email
  const { data, error } = await sendGmailEmail({
    accessToken,
    to: 'recipient@example.com',
    subject: 'Hello from Gmail API',
    body: 'This is a test email sent via the Gmail API.',
  })

  if (error) {
    console.error('Failed to send email:', error)
    return
  }

  console.log('Email sent successfully:', data)
}

/**
 * Send an HTML email with CC and BCC
 */
async function sendHtmlEmail() {
  const { accessToken } = await getEmailAccessToken(supabase, 'google')

  if (!accessToken) {
    throw new Error('No access token available')
  }

  const { data, error } = await sendGmailEmail({
    accessToken,
    to: 'recipient@example.com',
    cc: ['cc1@example.com', 'cc2@example.com'],
    bcc: 'bcc@example.com',
    subject: 'HTML Email Example',
    html: `
      <html>
        <body>
          <h1>Welcome!</h1>
          <p>This is an <strong>HTML email</strong> sent via Gmail API.</p>
          <a href="https://example.com">Visit our website</a>
        </body>
      </html>
    `,
    body: 'Fallback text for non-HTML clients',
  })

  if (error) {
    console.error('Failed to send HTML email:', error)
    return
  }

  console.log('HTML email sent:', data)
}

/**
 * Send bulk emails (with rate limiting consideration)
 */
async function sendBulkEmails(recipients: string[]) {
  const { accessToken } = await getEmailAccessToken(supabase, 'google')

  if (!accessToken) {
    throw new Error('No access token available')
  }

  const results = []

  for (const recipient of recipients) {
    const { data, error } = await sendGmailEmail({
      accessToken,
      to: recipient,
      subject: 'Bulk Email',
      body: `Hello ${recipient}`,
    })

    results.push({ recipient, success: !error, error })

    // Respect Gmail rate limits (avoid sending too fast)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('Bulk send results:', results)
  return results
}

// Usage examples
sendTextEmail()
sendHtmlEmail()
sendBulkEmails(['user1@example.com', 'user2@example.com'])
