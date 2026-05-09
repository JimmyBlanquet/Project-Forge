# Authentication Migration: NextAuth v5 to Supabase Auth

## Overview

This project has been migrated from NextAuth v5 to Supabase Auth for authentication. This document outlines the changes made and how to set up and use the new authentication system.

## What Changed

### Removed Files
- `auth.ts` - NextAuth configuration
- `auth.config.ts` - NextAuth providers config
- `app/api/auth/[...nextauth]/route.ts` - NextAuth API route
- `types/next-auth.d.ts` - NextAuth type definitions

### New Files Created
- `lib/auth.ts` - Supabase auth helper functions
- `app/(auth)/actions.ts` - Server actions for authentication
- `app/auth/callback/route.ts` - OAuth and magic link callback handler
- `hooks/use-user.ts` - Client-side user session hook

### Updated Files
- `middleware.ts` - Now uses Supabase session refresh
- `lib/session.ts` - Uses Supabase auth instead of NextAuth
- `components/forms/user-auth-form.tsx` - Uses Supabase auth actions
- `components/layout/user-account-nav.tsx` - Uses Supabase session
- `components/layout/navbar.tsx` - Uses Supabase session
- `components/layout/mobile-nav.tsx` - Uses Supabase session
- `components/modals/sign-in-modal.tsx` - Uses Supabase OAuth
- `components/dashboard/project-switcher.tsx` - Uses Supabase session
- `app/layout.tsx` - Removed NextAuth SessionProvider

## Environment Variables

### Required Variables

You need to set up the following environment variables in your `.env.local` file:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Email (Resend)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@yourdomain.com

# OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Variables to Remove

The following NextAuth-specific variables are no longer needed:
- `NEXTAUTH_URL`
- `AUTH_SECRET`
- `GITHUB_OAUTH_TOKEN` (unless you're using GitHub OAuth)

## Supabase Setup

### 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Get your project URL and anon key from Settings > API

### 2. Set Up Authentication Providers

#### Email (Magic Link)

1. In Supabase Dashboard, go to Authentication > Providers
2. Enable Email provider
3. Configure email templates (optional)

#### Google OAuth

1. Go to Authentication > Providers
2. Enable Google provider
3. Add your Google OAuth credentials
4. Add authorized redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### 3. Database Setup

You'll need to create a `profiles` table to store user metadata including roles:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'USER',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'USER');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

### 4. Configure Email Templates (Optional)

Supabase provides default email templates for magic links, but you can customize them:

1. Go to Authentication > Email Templates
2. Customize the "Magic Link" template
3. Use variables like `{{ .ConfirmationURL }}` for the magic link

## Usage Guide

### Server-Side Authentication

Use the helper functions from `lib/auth.ts`:

```typescript
import { getUser, requireAuth, getUserProfile } from '@/lib/auth'

// Get current user (returns null if not authenticated)
const user = await getUser()

// Require authentication (redirects to login if not authenticated)
const user = await requireAuth()

// Get user with profile data (includes role)
const profile = await getUserProfile()
```

### Client-Side Authentication

Use the `useUser` hook:

```typescript
'use client'

import { useUser } from '@/hooks/use-user'

export function MyComponent() {
  const { user, loading } = useUser()

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Not authenticated</div>

  return <div>Hello {user.email}</div>
}
```

### Server Actions

Use the authentication actions from `app/(auth)/actions.ts`:

```typescript
import { signInWithEmail, signInWithOAuth, signOut } from '@/app/(auth)/actions'

// Sign in with magic link
await signInWithEmail('user@example.com', '/dashboard')

// Sign in with OAuth
await signInWithOAuth('google')

// Sign out
await signOut()
```

## Migration Checklist

- [x] Remove NextAuth dependencies
- [x] Update middleware to use Supabase
- [x] Create Supabase auth helpers
- [x] Update all components using NextAuth
- [x] Create profiles table in Supabase
- [ ] Update env.mjs to remove NextAuth variables
- [ ] Test magic link authentication
- [ ] Test Google OAuth authentication
- [ ] Test protected routes
- [ ] Test sign out functionality
- [ ] Update user role management

## Key Differences

### User Object Structure

**NextAuth:**
```typescript
{
  id: string
  email: string
  name: string
  image: string
  role: 'USER' | 'ADMIN'
}
```

**Supabase:**
```typescript
{
  id: string
  email: string
  user_metadata: {
    name?: string
    avatar_url?: string
    role?: 'USER' | 'ADMIN'
  }
}
```

Note: User roles should be stored in the `profiles` table, not in `user_metadata`.

### Authentication Flow

**NextAuth:**
- Email provider sends magic link
- User clicks link, NextAuth validates and creates session
- Session stored in database

**Supabase:**
- Email provider sends magic link (OTP)
- User clicks link, redirected to `/auth/callback`
- Callback route exchanges code for session
- Session stored in cookies via middleware

## Troubleshooting

### Magic Link Not Working

1. Check that `NEXT_PUBLIC_APP_URL` is correct
2. Verify callback URL in Supabase matches your app
3. Check email provider is enabled in Supabase

### OAuth Redirect Issues

1. Add redirect URL to OAuth provider settings
2. Verify OAuth credentials in Supabase
3. Check that callback route is accessible

### Role Not Showing

1. Verify `profiles` table exists
2. Check that trigger creates profile on signup
3. Ensure `getUserProfile()` is being called

## Next Steps

1. Update `env.mjs` to remove NextAuth-specific variables
2. Remove NextAuth dependencies from `package.json`
3. Test all authentication flows
4. Update any custom authentication logic
5. Consider implementing refresh token rotation
6. Set up proper RLS policies for your data tables
