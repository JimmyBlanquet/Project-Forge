/**
 * @project-forge/email-oauth-flows
 *
 * Production-ready email OAuth integration for Gmail and Outlook
 */

// Gmail
export { signInWithGmail, sendGmailEmail, listGmailMessages } from './gmail'

// Outlook
export { signInWithOutlook, sendOutlookEmail, listOutlookMessages } from './outlook'

// Token management
export {
  getEmailAccessToken,
  isTokenExpired,
  storeEmailConnection,
} from './token-refresh'

// Types
export type {
  EmailProvider,
  GmailScope,
  OutlookScope,
  OAuthSignInOptions,
  SendEmailOptions,
  ListGmailMessagesOptions,
  ListOutlookMessagesOptions,
  EmailMessage,
  TokenResponse,
  ApiResponse,
} from './types'
