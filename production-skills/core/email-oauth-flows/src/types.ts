/**
 * Type definitions for email OAuth flows
 */

/**
 * Email provider types
 */
export type EmailProvider = 'google' | 'azure'

/**
 * Gmail OAuth scopes
 */
export type GmailScope = 
  | 'gmail.send'
  | 'gmail.modify'
  | 'gmail.readonly'
  | 'gmail.compose'
  | 'gmail.insert'
  | 'gmail.labels'

/**
 * Outlook/Microsoft Graph scopes
 */
export type OutlookScope =
  | 'Mail.Send'
  | 'Mail.Read'
  | 'Mail.ReadWrite'
  | 'Mail.ReadBasic'

/**
 * OAuth sign-in options
 */
export interface OAuthSignInOptions {
  redirectTo: string
  scopes: string[]
}

/**
 * Send email options
 */
export interface SendEmailOptions {
  accessToken: string
  to: string | string[]
  subject: string
  body: string
  html?: string
  from?: string
  cc?: string | string[]
  bcc?: string | string[]
}

/**
 * List messages options (Gmail)
 */
export interface ListGmailMessagesOptions {
  accessToken: string
  maxResults?: number
  query?: string
  pageToken?: string
}

/**
 * List messages options (Outlook)
 */
export interface ListOutlookMessagesOptions {
  accessToken: string
  top?: number
  filter?: string
  skip?: number
}

/**
 * Email message (generic)
 */
export interface EmailMessage {
  id: string
  subject: string
  from: string
  to: string[]
  date: Date
  snippet: string
  body?: string
}

/**
 * Token response
 */
export interface TokenResponse {
  accessToken: string | null
  refreshToken?: string | null
  expiresAt?: Date | null
  error: Error | null
}

/**
 * API Response
 */
export interface ApiResponse<T = any> {
  data: T | null
  error: Error | null
}
