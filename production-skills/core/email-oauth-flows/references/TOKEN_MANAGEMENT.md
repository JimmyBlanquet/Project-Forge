# Token Management Guide

Complete guide to managing OAuth tokens, refresh patterns, and security best practices.

## Token Lifecycle

### 1. Token Types

**Access Token**
- Short-lived (typically 1 hour)
- Used for API requests
- Stored in Supabase session as `provider_token`
- Automatically refreshed by Supabase

**Refresh Token**
- Long-lived (weeks to months)
- Used to get new access tokens
- Stored in Supabase session as `provider_refresh_token`
- Managed automatically by Supabase

**Session Token**
- Supabase's own session token
- Separate from provider tokens
- Used for Supabase authentication

### 2. Token Flow

```
User Signs In
    ↓
OAuth Provider (Google/Microsoft)
    ↓
Authorization Code
    ↓
Supabase exchanges for tokens
    ↓
Access Token + Refresh Token stored in session
    ↓
Access Token expires (1 hour)
    ↓
Supabase auto-refreshes on getSession()
    ↓
New Access Token available
```

## Automatic Token Refresh

### 1. Built-in Refresh (Recommended)

Supabase automatically refreshes tokens:

```typescript
import { getEmailAccessToken } from '@project-forge/email-oauth-flows'

// Supabase handles refresh automatically
const { accessToken, error } = await getEmailAccessToken(supabase, 'google')

if (!error && accessToken) {
  // Token is fresh, use it
  await sendGmailEmail({ accessToken, ... })
}
```

How it works:
1. `getSession()` called internally
2. Supabase checks if access token expired
3. If expired, uses refresh token to get new one
4. Returns fresh access token

### 2. Manual Refresh

Force a refresh when needed:

```typescript
// Force session refresh
const { data: { session }, error } = await supabase.auth.refreshSession()

if (error) {
  console.error('Failed to refresh:', error)
  // User needs to re-authenticate
  return
}

const accessToken = session?.provider_token
```

### 3. Refresh on 401 Errors

Retry pattern for expired tokens:

```typescript
async function sendEmailWithRetry() {
  let { accessToken } = await getEmailAccessToken(supabase, 'google')

  // First attempt
  let { error } = await sendGmailEmail({ accessToken, ... })

  // If 401, token might be expired
  if (error && error.message.includes('401')) {
    // Force refresh
    const { data: { session } } = await supabase.auth.refreshSession()
    accessToken = session?.provider_token || null

    if (!accessToken) {
      throw new Error('Token refresh failed')
    }

    // Retry with fresh token
    const result = await sendGmailEmail({ accessToken, ... })
    error = result.error
  }

  if (error) {
    throw error
  }
}
```

## Token Storage

### 1. Session Storage (Default)

Supabase stores tokens in session:

```typescript
const { data: { session } } = await supabase.auth.getSession()

// Provider tokens available in session
const accessToken = session?.provider_token
const refreshToken = session?.provider_refresh_token
const expiresAt = session?.expires_at
```

**Pros:**
- Automatic refresh
- No custom storage needed
- Secure (httpOnly cookies in browser)

**Cons:**
- Lost when session ends
- Requires re-authentication after logout

### 2. Database Storage

Store tokens for long-term access:

```typescript
import { storeEmailConnection } from '@project-forge/email-oauth-flows'

// After OAuth sign-in
const { accessToken, refreshToken } = await getEmailAccessToken(supabase, 'google')

await storeEmailConnection(supabase, {
  provider: 'google',
  email: 'user@gmail.com',
  accessToken,
  refreshToken: refreshToken || undefined,
  scopes: ['gmail.send', 'gmail.readonly'],
})
```

**IMPORTANT:** Encrypt tokens in database:

```sql
-- Use pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Store encrypted tokens
CREATE TABLE email_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  provider TEXT NOT NULL,
  email TEXT NOT NULL,
  -- Encrypt tokens at rest
  access_token TEXT, -- Should use: pgp_sym_encrypt(access_token, encryption_key)
  refresh_token TEXT, -- Should use: pgp_sym_encrypt(refresh_token, encryption_key)
  scopes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider, email)
);

-- Enable RLS
ALTER TABLE email_connections ENABLE ROW LEVEL SECURITY;

-- Users can only access their own connections
CREATE POLICY "Users can manage own connections"
  ON email_connections
  FOR ALL
  USING (auth.uid() = user_id);
```

### 3. Never Store Client-Side

```typescript
// ❌ NEVER DO THIS
localStorage.setItem('accessToken', token)
sessionStorage.setItem('accessToken', token)

// ✅ Always keep server-side
// Tokens only in server-side code or Supabase session
```

## Token Expiration

### 1. Check Expiration

```typescript
import { isTokenExpired } from '@project-forge/email-oauth-flows'

const { data: { session } } = await supabase.auth.getSession()

if (session?.expires_at) {
  const expiresAt = new Date(session.expires_at * 1000)

  if (isTokenExpired(expiresAt)) {
    console.log('Token expired, refreshing...')
    await supabase.auth.refreshSession()
  }
}
```

### 2. Proactive Refresh

Refresh before expiration:

```typescript
// Refresh 5 minutes before expiration
const BUFFER_MS = 5 * 60 * 1000

async function getTokenWithBuffer() {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('No session')
  }

  const expiresAt = new Date(session.expires_at * 1000)
  const now = new Date()
  const timeUntilExpiry = expiresAt.getTime() - now.getTime()

  if (timeUntilExpiry < BUFFER_MS) {
    // Refresh proactively
    const { data: { session: newSession } } = await supabase.auth.refreshSession()
    return newSession?.provider_token
  }

  return session.provider_token
}
```

### 3. Background Refresh

Set up periodic refresh:

```typescript
// Refresh every 50 minutes (tokens usually expire after 60)
setInterval(async () => {
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    await supabase.auth.refreshSession()
    console.log('Token refreshed in background')
  }
}, 50 * 60 * 1000)
```

## Token Revocation

### 1. User Revokes Access

Handle revoked tokens gracefully:

```typescript
async function sendEmail() {
  const { accessToken, error } = await getEmailAccessToken(supabase, 'google')

  if (error) {
    // Token might be revoked
    if (error.message.includes('invalid_grant')) {
      // User revoked access, need to re-authenticate
      console.log('Access revoked, please sign in again')
      await supabase.auth.signOut()
      // Redirect to sign-in
      return
    }
  }

  // Continue with valid token
}
```

### 2. Programmatic Revocation

Revoke tokens when user disconnects:

```typescript
async function disconnectEmail(provider: 'google' | 'azure') {
  const { accessToken } = await getEmailAccessToken(supabase, provider)

  // Revoke with provider (optional)
  if (provider === 'google' && accessToken) {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
      method: 'POST',
    })
  }

  // Remove from database
  await supabase
    .from('email_connections')
    .delete()
    .eq('provider', provider)

  // Sign out of Supabase session
  await supabase.auth.signOut()
}
```

## Security Best Practices

### 1. Token Transmission

```typescript
// ❌ Never send tokens to client
export async function GET() {
  const token = await getAccessToken()
  return { token } // Exposed in response!
}

// ✅ Use tokens only server-side
export async function POST(request: Request) {
  const { to, subject, body } = await request.json()
  const { accessToken } = await getEmailAccessToken(supabase, 'google')

  // Token never leaves server
  const result = await sendGmailEmail({ accessToken, to, subject, body })
  return { success: !result.error }
}
```

### 2. Token Logging

```typescript
// ❌ Don't log tokens
console.log('Access token:', accessToken)
console.error('Failed with token:', accessToken)

// ✅ Log without sensitive data
console.log('Access token:', accessToken ? 'present' : 'missing')
console.error('Failed to send email:', error.message)
```

### 3. Token Scope

Request minimum scopes:

```typescript
// ❌ Over-privileged
scopes: ['gmail.send', 'gmail.modify', 'gmail.readonly', 'gmail.compose']

// ✅ Minimal
scopes: ['gmail.send'] // Only what you need
```

### 4. Token Encryption

Encrypt tokens at rest:

```typescript
// In production, use encryption
import crypto from 'crypto'

function encryptToken(token: string, key: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv)

  let encrypted = cipher.update(token, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`
}

function decryptToken(encrypted: string, key: string): string {
  const [ivHex, encryptedHex, authTagHex] = encrypted.split(':')

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(key, 'hex'),
    Buffer.from(ivHex, 'hex')
  )

  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
```

## Monitoring and Debugging

### 1. Token Health Check

```typescript
async function checkTokenHealth() {
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session) {
    return { status: 'no_session', error }
  }

  const hasProviderToken = !!session.provider_token
  const hasRefreshToken = !!session.provider_refresh_token
  const expiresAt = new Date(session.expires_at * 1000)
  const isExpired = isTokenExpired(expiresAt)

  return {
    status: 'ok',
    hasProviderToken,
    hasRefreshToken,
    expiresAt,
    isExpired,
    provider: session.user.app_metadata.provider,
  }
}
```

### 2. Refresh Metrics

Track refresh success/failure:

```typescript
async function refreshWithMetrics() {
  const startTime = Date.now()

  const { data: { session }, error } = await supabase.auth.refreshSession()

  const duration = Date.now() - startTime

  if (error) {
    console.error('Refresh failed', {
      duration,
      error: error.message,
      timestamp: new Date().toISOString(),
    })
    return null
  }

  console.log('Refresh succeeded', {
    duration,
    timestamp: new Date().toISOString(),
  })

  return session?.provider_token
}
```

### 3. Error Handling

```typescript
async function handleTokenError(error: Error) {
  const errorMap = {
    invalid_grant: 'User revoked access, re-authentication required',
    invalid_token: 'Token expired or invalid, refreshing',
    insufficient_permission: 'Missing required scopes, re-authenticate with correct scopes',
  }

  for (const [key, message] of Object.entries(errorMap)) {
    if (error.message.includes(key)) {
      console.error(message, error)
      return message
    }
  }

  return 'Unknown token error'
}
```

## Additional Resources

- [OAuth 2.0 RFC](https://datatracker.ietf.org/doc/html/rfc6749)
- [Token Best Practices](https://datatracker.ietf.org/doc/html/rfc8252)
- [Supabase Session Management](https://supabase.com/docs/guides/auth/sessions)
