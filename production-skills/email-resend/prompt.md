# Resend Email Service Skill

## Objective

Implement Resend email service with React Email templates for:
- Transactional emails
- Magic link authentication
- Welcome emails
- Newsletter subscriptions

## Prerequisites

1. ✅ Resend account created
2. ✅ Sending domain verified
3. ✅ API key generated

## Implementation Steps

### Step 1: Install Dependencies

```bash
pnpm add resend react-email @react-email/components
```

### Step 2: Create Resend Client

**File: `lib/email.ts`**

```typescript
import { MagicLinkEmail } from "@/emails/magic-link-email";
import { EmailConfig } from "next-auth/providers/email";
import { Resend } from "resend";

import { env } from "@/env.mjs";
import { siteConfig } from "@/config/site";
import { getUserByEmail } from "./user";

export const resend = new Resend(env.RESEND_API_KEY);

export const sendVerificationRequest: EmailConfig["sendVerificationRequest"] =
  async ({ identifier, url, provider }) => {
    const user = await getUserByEmail(identifier);
    if (!user || !user.name) return;

    const userVerified = user?.emailVerified ? true : false;
    const authSubject = userVerified
      ? `Sign-in link for ${siteConfig.name}`
      : "Activate your account";

    try {
      const { data, error } = await resend.emails.send({
        from: provider.from,
        to:
          process.env.NODE_ENV === "development"
            ? "delivered@resend.dev"
            : identifier,
        subject: authSubject,
        react: MagicLinkEmail({
          firstName: user?.name as string,
          actionUrl: url,
          mailType: userVerified ? "login" : "register",
          siteName: siteConfig.name,
        }),
        headers: {
          "X-Entity-Ref-ID": new Date().getTime() + "",
        },
      });

      if (error || !data) {
        throw new Error(error?.message);
      }
    } catch (error) {
      throw new Error("Failed to send verification email.");
    }
  };
```

### Step 3: Create React Email Templates

**File: `emails/magic-link-email.tsx`**

```typescript
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface MagicLinkEmailProps {
  actionUrl: string;
  firstName: string;
  mailType: "login" | "register";
  siteName: string;
}

export const MagicLinkEmail = ({
  actionUrl,
  firstName,
  mailType,
  siteName,
}: MagicLinkEmailProps) => (
  <Html>
    <Head />
    <Preview>
      {mailType === "login"
        ? `Sign in to ${siteName}`
        : `Activate your ${siteName} account`}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={title}>
          <strong>{siteName}</strong>
        </Text>
        <Text style={text}>Hi {firstName},</Text>
        <Text style={text}>
          {mailType === "login"
            ? `Click the button below to sign in to your ${siteName} account.`
            : `Click the button below to activate your ${siteName} account.`}
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href={actionUrl}>
            {mailType === "login" ? "Sign in" : "Activate Account"}
          </Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          If you didn't request this email, you can safely ignore it.
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: "#f6f9fc",
  padding: "10px 0",
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #f0f0f0",
  padding: "45px",
};

const text = {
  fontSize: "16px",
  fontFamily:
    "'Open Sans', 'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, 'Lucida Grande', sans-serif",
  fontWeight: "300",
  color: "#404040",
  lineHeight: "26px",
};

const title = {
  ...text,
  fontSize: "22px",
  fontWeight: "700",
  lineHeight: "32px",
};

const button = {
  backgroundColor: "#007ee6",
  borderRadius: "4px",
  color: "#fff",
  fontFamily: "'Open Sans', 'Helvetica Neue', Arial",
  fontSize: "15px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  width: "210px",
  padding: "14px 7px",
};

const buttonContainer = {
  padding: "27px 0 27px",
};

const hr = {
  borderColor: "#e8eaed",
  margin: "20px 0",
};

const footer = {
  ...text,
  fontSize: "12px",
  lineHeight: "22px",
  color: "#9ca299",
};
```

### Step 4: Environment Variables

Add to `.env.local`:

```env
# Resend
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@yourdomain.com"
```

### Step 5: Preview Emails Locally

Add to `package.json`:

```json
{
  "scripts": {
    "email": "email dev --dir emails --port 3333"
  }
}
```

Run email preview server:

```bash
pnpm email
# Open http://localhost:3333
```

## Usage Patterns

### Send Custom Email

```typescript
import { resend } from "@/lib/email";

const { data, error } = await resend.emails.send({
  from: "noreply@yourdomain.com",
  to: "user@example.com",
  subject: "Welcome!",
  react: WelcomeEmail({ name: "John" }),
});
```

### Integration with Auth.js

Update `auth.config.ts`:

```typescript
import { sendVerificationRequest } from "@/lib/email";

Resend({
  apiKey: env.RESEND_API_KEY,
  from: env.EMAIL_FROM,
  sendVerificationRequest, // Custom template
}),
```

## Resend Setup Guide

1. Go to https://resend.com/
2. Create account
3. Verify sending domain
4. Generate API key
5. Add API key to `.env.local`

## Quality Gates

- ✅ Email preview server works (`pnpm email`)
- ✅ React Email templates render correctly
- ✅ Development emails send to `delivered@resend.dev`
- ✅ Magic link authentication works

## References

- Resend Docs: https://resend.com/docs
- React Email: https://react.email
- Auth.js Email Provider: https://authjs.dev/getting-started/providers/resend
