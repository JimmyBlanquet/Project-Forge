# Outlook OAuth Setup Guide

Complete guide to configuring Outlook OAuth with Microsoft Azure Portal and Supabase.

## Prerequisites

- Microsoft Azure account
- Microsoft 365 subscription (for production)
- Exchange Online mailbox (for Mail.Send/Mail.Read)
- Supabase project with auth enabled

## Step 1: Azure Portal Setup

### 1.1 Register Application

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to "Azure Active Directory" > "App registrations"
3. Click "New registration"
4. Fill in details:
   - Name: Your app name
   - Supported account types:
     - **Single tenant**: Your organization only
     - **Multitenant**: Any organization
     - **Multitenant + personal**: Any organization + personal accounts
   - Redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`

### 1.2 Configure Authentication

1. Go to "Authentication" in your app registration
2. Add platform > Web
3. Redirect URIs:
   ```
   https://<project-ref>.supabase.co/auth/v1/callback
   ```
4. Implicit grant and hybrid flows:
   - ✅ ID tokens (for sign-in)
   - ❌ Access tokens (not needed with auth code flow)
5. Supported account types: Keep your selection from registration

### 1.3 Add API Permissions

1. Go to "API permissions"
2. Click "Add a permission" > "Microsoft Graph"
3. Select "Delegated permissions"
4. Add scopes:
   ```
   Mail.Send       - Send email as user
   Mail.Read       - Read user's email
   Mail.ReadWrite  - Read and write user's email
   Mail.ReadBasic  - Read basic email properties
   ```
5. Click "Grant admin consent" (if you're admin)

### 1.4 Create Client Secret

1. Go to "Certificates & secrets"
2. Click "New client secret"
3. Add description and expiration
4. **Copy the secret value** (shown only once)
5. Save Client ID (from Overview) and Client Secret

## Step 2: Supabase Configuration

### 2.1 Enable Azure Provider

1. Go to Supabase Dashboard > Authentication > Providers
2. Enable **Azure** provider
3. Enter credentials:
   - **Client ID**: Application (client) ID from Azure
   - **Client Secret**: From "Certificates & secrets"
   - **Azure Tenant**: Directory (tenant) ID from Azure Overview
4. Authorized redirect URLs:
   ```
   https://<project-ref>.supabase.co/auth/v1/callback
   ```

### 2.2 Configure Scopes

In your application code:

```typescript
import { signInWithOutlook } from '@project-forge/email-oauth-flows'

await signInWithOutlook(supabase, {
  redirectTo: 'http://localhost:3000/auth/callback',
  scopes: [
    'Mail.Send',      // Send emails
    'Mail.Read',      // Read emails
    'Mail.ReadWrite', // Read and write emails
  ],
})
```

## Step 3: Microsoft 365 Requirements

### 3.1 License Requirements

Outlook/Exchange scopes require:
- **Microsoft 365 subscription** (Business, Enterprise, Education)
- **Exchange Online mailbox** for the user
- Personal Microsoft accounts have limited support

### 3.2 Mailbox Setup

Users must have:
1. Active Microsoft 365 license
2. Exchange Online mailbox provisioned
3. Mailbox accessible via Outlook Web App

### 3.3 Tenant Configuration

Admins may need to:
1. Allow app in Azure AD
2. Grant admin consent for organization-wide permissions
3. Configure mail flow rules if needed

## Step 4: Testing

### 4.1 Development Testing

```typescript
// Test OAuth flow
const { data, error } = await signInWithOutlook(supabase, {
  redirectTo: 'http://localhost:3000/auth/callback',
  scopes: ['Mail.Send'],
})

// Test token retrieval
const { accessToken } = await getEmailAccessToken(supabase, 'azure')

// Test sending email
await sendOutlookEmail({
  accessToken,
  to: 'test@example.com',
  subject: 'Test',
  body: 'Testing Microsoft Graph API',
})
```

### 4.2 Common Issues

**"AADSTS50011: The reply URL specified does not match"**
- Check redirect URI in Azure exactly matches Supabase
- Include https:// prefix
- No trailing slash

**"AADSTS65001: The user or administrator has not consented"**
- User hasn't granted permissions
- Admin consent required but not given
- Re-authenticate with correct scopes

**"ErrorAccessDenied: Access is denied"**
- User doesn't have Exchange Online mailbox
- Microsoft 365 license not assigned
- Insufficient permissions for scope

**"InvalidAuthenticationToken: Access token is empty"**
- Token expired
- User revoked consent
- Refresh session with `supabase.auth.refreshSession()`

**"MailboxNotEnabledForRESTAPI"**
- User doesn't have Exchange Online license
- Mailbox not provisioned yet
- Use Microsoft 365 admin center to assign license

## Step 5: Admin Consent

### 5.1 When Required

Admin consent needed when:
- App requires organization-wide permissions
- Delegated permissions marked "Admin consent required"
- Users can't consent themselves (tenant policy)

### 5.2 Grant Admin Consent

**Option 1: Azure Portal**
1. Go to app registration > API permissions
2. Click "Grant admin consent for [Organization]"
3. Confirm consent

**Option 2: Admin Consent URL**
```
https://login.microsoftonline.com/{tenant-id}/adminconsent
  ?client_id={client-id}
  &redirect_uri={redirect-uri}
```

**Option 3: User Consent Prompt**
- Add `&prompt=admin_consent` to OAuth URL
- Only works if signed-in user is admin

### 5.3 Verify Consent

Check "Enterprise applications" in Azure AD:
1. Find your app
2. Go to "Permissions"
3. Verify all scopes show "Granted for [Organization]"

## Step 6: Security Best Practices

### 6.1 Scope Minimization

Request only necessary scopes:

```typescript
// ❌ Don't request all scopes
scopes: ['Mail.Send', 'Mail.ReadWrite', 'Mail.ReadBasic']

// ✅ Request minimum needed
scopes: ['Mail.Send'] // Only if sending emails
```

### 6.2 Token Storage

Keep tokens server-side:

```typescript
// ❌ Don't expose tokens
const response = { accessToken } // Sent to client

// ✅ Keep server-side only
const { accessToken } = await getEmailAccessToken(supabase, 'azure')
// Use in server-side API routes only
```

### 6.3 Client Secret Security

- **Never commit** client secrets to Git
- Use environment variables
- Rotate secrets regularly (before expiration)
- Use Azure Key Vault for production

### 6.4 Multi-Tenant Apps

For multi-tenant apps:
- Implement tenant isolation
- Validate tenant ID in tokens
- Handle consent per tenant
- Document permissions clearly

## Step 7: Production Deployment

### 7.1 Pre-Deployment Checklist

- [ ] Client secret won't expire soon (rotate proactively)
- [ ] All redirect URIs added for production domains
- [ ] Admin consent granted (if required)
- [ ] Permissions minimized to necessary scopes
- [ ] Error handling for expired tokens
- [ ] Monitoring for authentication failures

### 7.2 Monitoring

Track in application logs:
- OAuth failures
- Token refresh failures
- API permission errors
- User consent denials

Monitor in Azure Portal:
- Sign-in logs (Azure AD > Sign-in logs)
- App usage (Enterprise applications > Usage)
- Consent requests

## Troubleshooting

### Debug Azure Configuration

```bash
# Check app registration
az ad app show --id <client-id>

# List permissions
az ad app permission list --id <client-id>

# Check redirect URIs
az ad app show --id <client-id> --query "web.redirectUris"
```

### Debug Token Issues

```typescript
// Check session provider
const { data: { session } } = await supabase.auth.getSession()
console.log('Provider:', session?.user.app_metadata.provider) // Should be 'azure'
console.log('Tenant ID:', session?.user.user_metadata.iss)

// Decode token to check scopes
const token = session?.provider_token
if (token) {
  const decoded = JSON.parse(atob(token.split('.')[1]))
  console.log('Scopes:', decoded.scp)
}
```

### Test Graph API

```bash
# Test with access token
curl -H "Authorization: Bearer <access-token>" \
  https://graph.microsoft.com/v1.0/me

# Test sending mail
curl -X POST \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{"message":{"subject":"Test","body":{"content":"Test"},"toRecipients":[{"emailAddress":{"address":"test@example.com"}}]}}' \
  https://graph.microsoft.com/v1.0/me/sendMail
```

## Additional Resources

- [Microsoft Identity Platform](https://learn.microsoft.com/en-us/azure/active-directory/develop/)
- [Microsoft Graph API](https://learn.microsoft.com/en-us/graph/overview)
- [Mail API Reference](https://learn.microsoft.com/en-us/graph/api/resources/mail-api-overview)
- [Supabase Azure Auth](https://supabase.com/docs/guides/auth/social-login/auth-azure)
