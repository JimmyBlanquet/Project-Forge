# Email OAuth Flows

Production-ready email OAuth integration for Gmail and Outlook with Supabase authentication.

## Features

- **Gmail OAuth** - Sign in with Google and access Gmail API
- **Outlook OAuth** - Sign in with Microsoft and access Microsoft Graph API
- **Token Management** - Automatic token refresh via Supabase
- **Type-Safe** - Full TypeScript support
- **Production-Ready** - Error handling, security best practices

## Quick Start

### 1. Install

```bash
npm install @project-forge/email-oauth-flows @supabase/supabase-js
```

### 2. Configure Supabase

Enable Google and Azure providers in your Supabase project:

```typescript
// Supabase Dashboard > Authentication > Providers
// - Enable Google (for Gmail)
// - Enable Azure (for Outlook)
```

### 3. Gmail Integration

```typescript
import { createClient } from '@supabase/supabase-js'
import { signInWithGmail, getEmailAccessToken, sendGmailEmail } from '@project-forge/email-oauth-flows'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Sign in with Gmail
await signInWithGmail(supabase, {
  redirectTo: 'http://localhost:3000/auth/callback',
  scopes: ['gmail.send', 'gmail.readonly'],
})

// Get access token
const { accessToken } = await getEmailAccessToken(supabase, 'google')

// Send email
await sendGmailEmail({
  accessToken,
  to: 'user@example.com',
  subject: 'Hello',
  body: 'Email sent via Gmail API',
})
```

### 4. Outlook Integration

```typescript
import { signInWithOutlook, sendOutlookEmail } from '@project-forge/email-oauth-flows'

// Sign in with Outlook
await signInWithOutlook(supabase, {
  redirectTo: 'http://localhost:3000/auth/callback',
  scopes: ['Mail.Send', 'Mail.Read'],
})

// Send email
await sendOutlookEmail({
  accessToken,
  to: 'user@example.com',
  subject: 'Hello',
  body: 'Email sent via Microsoft Graph API',
})
```

## Documentation

- [Gmail OAuth Setup](references/GMAIL_OAUTH.md) - Google Cloud Console configuration
- [Outlook OAuth Setup](references/OUTLOOK_OAUTH.md) - Azure Portal configuration
- [Token Management](references/TOKEN_MANAGEMENT.md) - Token refresh and security

## API Reference

See [SKILL.md](SKILL.md) for complete API documentation.

## Examples

- [Gmail Connect](examples/01-gmail-connect.tsx) - Gmail OAuth button component
- [Send Gmail](examples/02-send-gmail.ts) - Send email via Gmail API
- [Outlook Connect](examples/03-outlook-connect.tsx) - Outlook OAuth integration
- [Token Refresh](examples/04-token-refresh.ts) - Automatic token refresh
- [Email Dashboard](examples/05-email-dashboard.tsx) - Multi-provider email dashboard

## Testing

```bash
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Security Notes

- **Gmail**: Requires app verification for production use of sensitive scopes
- **Outlook**: Requires M365 license and Exchange Online mailbox
- **Tokens**: Should be encrypted when stored in database
- **Scopes**: Request only the minimum scopes needed

## License

MIT
