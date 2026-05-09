# Gmail OAuth Setup Guide

Complete guide to configuring Gmail OAuth with Google Cloud Console and Supabase.

## Prerequisites

- Google Cloud Platform account
- Supabase project with auth enabled
- Domain for production (localhost works for development)

## Step 1: Google Cloud Console Setup

### 1.1 Create Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable **Gmail API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

### 1.2 Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose user type:
   - **Internal**: For Google Workspace only (no verification needed)
   - **External**: For public apps (requires verification for sensitive scopes)
3. Fill in app information:
   - App name
   - User support email
   - Developer contact email
4. Add scopes:
   ```
   https://www.googleapis.com/auth/gmail.send
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/gmail.modify
   ```
5. Add test users (for development):
   - Add email addresses that can test the app
   - Maximum 100 test users during development

### 1.3 Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Application type: **Web application**
4. Add authorized redirect URIs:
   ```
   https://<project-ref>.supabase.co/auth/v1/callback
   ```
5. Save Client ID and Client Secret

## Step 2: Supabase Configuration

### 2.1 Enable Google Provider

1. Go to Supabase Dashboard > Authentication > Providers
2. Enable **Google** provider
3. Enter credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
4. Add authorized redirect URLs (if not already):
   ```
   https://<project-ref>.supabase.co/auth/v1/callback
   ```

### 2.2 Configure Scopes

In your application code, request Gmail scopes:

```typescript
import { signInWithGmail } from '@project-forge/email-oauth-flows'

await signInWithGmail(supabase, {
  redirectTo: 'http://localhost:3000/auth/callback',
  scopes: [
    'gmail.send',      // Send emails
    'gmail.readonly',  // Read emails
    'gmail.modify',    // Modify emails (labels, etc)
  ],
})
```

## Step 3: App Verification (Production)

### 3.1 When Verification is Required

Google requires verification for apps that:
- Use **sensitive scopes** (gmail.send, gmail.readonly, etc.)
- Are **External** user type
- Have more than 100 users

### 3.2 Verification Process

1. Complete OAuth consent screen with:
   - App logo (120x120px)
   - Privacy policy URL
   - Terms of service URL
   - App homepage URL
2. Submit for verification:
   - Go to OAuth consent screen
   - Click "Submit for Verification"
   - Provide demo video showing OAuth flow
   - Explain why each scope is needed
3. Wait for approval (1-6 weeks)

### 3.3 Alternatives to Verification

For small-scale apps:
- Use **Internal** app type (Google Workspace only)
- Stay under 100 test users during development
- Request only non-sensitive scopes (limited functionality)

## Step 4: Testing

### 4.1 Development Testing

```typescript
// Test OAuth flow
const { data, error } = await signInWithGmail(supabase, {
  redirectTo: 'http://localhost:3000/auth/callback',
  scopes: ['gmail.send'],
})

// Test token retrieval
const { accessToken } = await getEmailAccessToken(supabase, 'google')

// Test sending email
await sendGmailEmail({
  accessToken,
  to: 'test@example.com',
  subject: 'Test',
  body: 'Testing Gmail API',
})
```

### 4.2 Common Issues

**"Access blocked: This app's request is invalid"**
- Check redirect URI matches exactly (trailing slash matters)
- Verify client ID/secret are correct
- Ensure Gmail API is enabled

**"This app isn't verified"**
- Expected during development
- Add test users to OAuth consent screen
- Click "Advanced" > "Go to [App Name] (unsafe)" during testing

**"Invalid grant"**
- Token expired or revoked
- User revoked access in Google Account settings
- Refresh token with `supabase.auth.refreshSession()`

**"insufficient permission"**
- Scope not requested during sign-in
- User didn't grant all requested scopes
- Re-authenticate with correct scopes

## Step 5: Security Best Practices

### 5.1 Scope Minimization

Only request scopes you actually need:

```typescript
// ❌ Don't request all scopes
scopes: ['gmail.send', 'gmail.modify', 'gmail.readonly', 'gmail.compose']

// ✅ Request minimum needed
scopes: ['gmail.send'] // Only if sending emails
```

### 5.2 Token Storage

Never expose tokens to client:

```typescript
// ❌ Don't send token to client
return { accessToken } // Exposed in API response

// ✅ Keep tokens server-side
const { accessToken } = await getEmailAccessToken(supabase, 'google')
await sendGmailEmail({ accessToken, ... }) // Server-side only
```

### 5.3 User Consent

Always show users what permissions they're granting:

```tsx
<div>
  <p>This app will be able to:</p>
  <ul>
    <li>Send emails on your behalf</li>
    <li>Read your email messages</li>
  </ul>
  <button onClick={handleConnect}>Connect Gmail</button>
</div>
```

## Troubleshooting

### Check OAuth Configuration

```bash
# Verify redirect URI
curl https://<project-ref>.supabase.co/auth/v1/callback

# Check if Gmail API is enabled
gcloud services list --enabled --project=<project-id>
```

### Debug Token Issues

```typescript
// Check session
const { data: { session } } = await supabase.auth.getSession()
console.log('Provider:', session?.user.app_metadata.provider)
console.log('Provider token:', session?.provider_token)

// Force refresh
const { data: { session: newSession } } = await supabase.auth.refreshSession()
console.log('New token:', newSession?.provider_token)
```

## Additional Resources

- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [OAuth Verification FAQ](https://support.google.com/cloud/answer/9110914)
