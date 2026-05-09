# Technical Plan: Auth System

**Version:** 1.0.0
**Date:** 2026-01-18
**Based on:**
- Constitution: `.speckit/constitution.yml`
- Specification: `.speckit/specification.md`

---

## 1. Architecture Overview

### System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐   │
│  │  Browser   │  │   Mobile   │  │   Desktop (PWA)     │   │
│  └────────────┘  └────────────┘  └─────────────────────┘   │
└─────────────────────────┬────────────────────────────────────┘
                          │ HTTPS
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                    Vercel Edge Network (CDN)                 │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                     Next.js 14 Application                   │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │  App Router    │  │  API Routes    │  │  Middleware  │  │
│  │  (Pages)       │  │                │  │  (Auth Guard)│  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Client-Side Auth Context (React)               │ │
│  │  useAuth(), useUser(), useSession()                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────┬────────────────────────────────────┘
                          │ Supabase Client SDK
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                      Supabase Backend                        │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Auth Service │  │  Database    │  │  Edge Functions  │  │
│  │ (JWT tokens) │  │  (Postgres)  │  │  (Custom logic)  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Row Level Security (RLS) Engine              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                    External OAuth Providers                  │
│  ┌─────────────┐                ┌──────────────┐            │
│  │   Google    │                │    GitHub    │            │
│  │   OAuth 2.0 │                │    OAuth 2.0 │            │
│  └─────────────┘                └──────────────┘            │
└──────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

- **Stateless Authentication (JWT):** Following constitution principle "Stateless authentication (JWT tokens)", we use Supabase Auth which provides JWT-based authentication. Tokens are stored in HTTP-only cookies for security. This enables horizontal scaling and edge deployment.

- **API-First Design:** All auth operations available as API endpoints (/api/auth/*) making the system frontend-agnostic. The Next.js frontend is one consumer, but the API can be used by mobile apps, desktop apps, or other services.

- **Security-First Architecture:** Multiple security layers following "Defense in depth" principle:
  - HTTPS only (enforced at Vercel level)
  - HTTP-only cookies (prevent XSS)
  - CSRF tokens (prevent CSRF)
  - Rate limiting (prevent brute force)
  - Input validation (prevent injection)
  - Row Level Security (database-level authorization)
  - Security headers (CSP, HSTS, etc.)

- **Separation of Concerns:** Following architecture principle, auth logic (Supabase), UI (React components), and API (Next.js routes) are cleanly separated.

- **Edge Deployment:** Leveraging Vercel Edge Functions for API routes to minimize latency (< 300ms requirement). Database connection via Supabase's connection pooler.

- **Progressive Enhancement:** Core authentication flows work without JavaScript using standard HTML forms (POST to API routes). JavaScript enhances with instant validation and better UX.

---

## 2. Tech Stack

### Frontend

- **Framework:** Next.js 14.0.4 (App Router)
  - Rationale: React framework with built-in routing, SSR, API routes, excellent DX
  - App Router for RSC (React Server Components)
  - Middleware for auth guards

- **Language:** TypeScript 5.3.3 (strict mode)
  - Rationale: Type safety prevents runtime errors, better IDE support
  - Strict mode enabled (constitution requirement)

- **Styling:** Tailwind CSS 3.4.0
  - Rationale: Utility-first CSS, rapid development, consistency
  - Custom design system via tailwind.config.js

- **UI Components:** Radix UI primitives + custom components
  - Accessible components (WCAG 2.1 AA)
  - Headless UI for flexibility

- **Forms:** React Hook Form 7.49.3 + Zod 3.22.4
  - React Hook Form: Performant, minimal re-renders
  - Zod: Runtime validation + TypeScript types

- **State Management:** React Context API (built-in)
  - AuthContext for global auth state
  - Minimal external dependencies

- **HTTP Client:** Supabase JS Client 2.39.0
  - Built-in auth methods
  - Automatic token refresh
  - Real-time subscriptions (for future features)

- **Testing:**
  - **Unit/Integration:** Vitest 1.1.0 + Testing Library
  - **E2E:** Playwright 1.40.1
  - **Coverage:** Vitest coverage (c8)

### Backend

- **Platform:** Supabase Cloud (free tier, production upgrade path)
  - Rationale: Complete backend solution, reduces complexity
  - Built-in auth (email/password, OAuth)
  - PostgreSQL database
  - Real-time capabilities
  - Edge Functions
  - Row Level Security

- **Runtime:**
  - **Next.js API Routes:** Node.js 20 LTS (Vercel)
  - **Edge Functions:** Deno (Supabase)

- **Database:** PostgreSQL 15.1 (managed by Supabase)
  - Rationale: Robust, ACID compliant, excellent JSON support
  - Extensions: pgcrypto, uuid-ossp

- **ORM/Query Builder:** Supabase JS Client (no ORM needed)
  - Direct SQL for complex queries
  - Supabase client for simple operations

- **Caching:**
  - **Client-side:** SWR 2.2.4 (React hooks for data fetching)
  - **Edge:** Vercel Edge Cache (ISR)
  - **Database:** Postgres query cache (built-in)

### Infrastructure

- **Hosting:** Vercel (Pro plan for production)
  - Edge Network (global CDN)
  - Automatic HTTPS
  - Preview deployments
  - Instant rollbacks

- **Database Hosting:** Supabase Cloud
  - Managed PostgreSQL
  - Automatic backups
  - Connection pooling (PgBouncer)

- **CDN:** Vercel Edge Network
  - 300+ global locations
  - Automatic asset optimization

- **Email:** Supabase Email (development), Resend (production)
  - Verification emails
  - Password reset emails
  - Transactional emails

- **Monitoring:**
  - **Error Tracking:** Sentry
  - **Performance:** Vercel Analytics
  - **Uptime:** BetterUptime
  - **Logs:** Supabase Logs + Vercel Logs

- **Security:**
  - **Rate Limiting:** Upstash Redis + @upstash/ratelimit
  - **DDoS Protection:** Vercel (built-in)
  - **WAF:** Cloudflare (optional, production)

### Development Tools

- **Package Manager:** pnpm 8.14.0
  - Faster than npm
  - Disk space efficient
  - Strict dependency management

- **Linting:** ESLint 8.56.0
  - @typescript-eslint/parser
  - Next.js config
  - Custom rules from constitution

- **Formatting:** Prettier 3.1.1
  - Consistent code style
  - Auto-format on save

- **Type Checking:** TypeScript (tsc --noEmit)
  - Strict mode
  - No implicit any

- **Git Hooks:** Husky 8.0.3
  - Pre-commit: lint, type-check, format
  - Pre-push: run tests

- **CI/CD:** GitHub Actions
  - Run tests on PR
  - Deploy preview on PR
  - Deploy production on merge to main

- **Documentation:**
  - **README:** Project overview
  - **API Docs:** OpenAPI/Swagger
  - **Code Docs:** TSDoc comments

---

## 3. Components

### Frontend Components

#### 3.1 Pages (App Router)

```
app/
├── page.tsx                    # Home page (marketing/landing)
├── layout.tsx                  # Root layout (AuthProvider, fonts, metadata)
│
├── auth/
│   ├── login/
│   │   └── page.tsx           # Login page (LoginForm, OAuth buttons)
│   ├── signup/
│   │   └── page.tsx           # Signup page (SignupForm, OAuth buttons)
│   ├── reset-password/
│   │   └── page.tsx           # Request password reset
│   ├── update-password/
│   │   └── page.tsx           # Set new password (from email link)
│   ├── verify-email/
│   │   └── page.tsx           # Email verification success
│   └── callback/
│       └── page.tsx           # OAuth callback handler
│
├── dashboard/
│   ├── page.tsx               # User dashboard (protected)
│   └── layout.tsx             # Dashboard layout (navigation)
│
└── settings/
    ├── profile/
    │   └── page.tsx           # Edit profile (protected)
    └── security/
        └── page.tsx           # Change password, connected accounts (protected)
```

#### 3.2 Shared Components

```
components/
├── auth/
│   ├── LoginForm.tsx          # Email/password login form
│   ├── SignupForm.tsx         # Email/password signup form
│   ├── PasswordResetForm.tsx  # Request password reset
│   ├── UpdatePasswordForm.tsx # Set new password
│   ├── OAuthButtons.tsx       # Google, GitHub login buttons
│   ├── AuthGuard.tsx          # Protected route wrapper
│   └── AuthProvider.tsx       # Global auth context provider
│
├── ui/
│   ├── Button.tsx             # Reusable button component
│   ├── Input.tsx              # Form input with validation
│   ├── Label.tsx              # Form label
│   ├── Card.tsx               # Card container
│   ├── Alert.tsx              # Error/success messages
│   ├── Spinner.tsx            # Loading spinner
│   └── Avatar.tsx             # User avatar
│
└── layout/
    ├── Header.tsx             # App header with navigation
    ├── Footer.tsx             # App footer
    └── Sidebar.tsx            # Dashboard sidebar
```

#### 3.3 Hooks

```
hooks/
├── useAuth.ts                 # Auth state (user, session, loading)
├── useUser.ts                 # Current user data
├── useSession.ts              # Session management
├── useSupabase.ts             # Supabase client access
├── useToast.ts                # Toast notifications
└── useForm.ts                 # Form state management (wrapper for RHF)
```

#### 3.4 Utilities

```
lib/
├── supabase/
│   ├── client.ts              # Browser Supabase client
│   ├── server.ts              # Server Supabase client (RSC)
│   ├── middleware.ts          # Middleware Supabase client
│   └── types.ts               # Database types (generated)
│
├── validations/
│   ├── auth.ts                # Auth validation schemas (Zod)
│   └── profile.ts             # Profile validation schemas
│
├── utils/
│   ├── password.ts            # Password strength checker
│   ├── email.ts               # Email validation
│   └── errors.ts              # Error handling utilities
│
└── constants/
    ├── routes.ts              # Route constants
    ├── messages.ts            # Error/success messages
    └── config.ts              # App configuration
```

### Backend Components

#### 3.5 API Routes (Next.js)

```
app/api/
├── auth/
│   ├── signup/
│   │   └── route.ts           # POST - Create user account
│   ├── login/
│   │   └── route.ts           # POST - Authenticate user
│   ├── logout/
│   │   └── route.ts           # POST - Sign out user
│   ├── session/
│   │   └── route.ts           # GET - Get current session
│   ├── reset-password/
│   │   └── route.ts           # POST - Request password reset
│   ├── update-password/
│   │   └── route.ts           # POST - Update password
│   └── callback/
│       └── route.ts           # GET - OAuth callback
│
└── user/
    ├── profile/
    │   └── route.ts           # GET, PATCH - User profile
    └── avatar/
        └── route.ts           # POST - Upload avatar
```

#### 3.6 Middleware

```
middleware.ts                  # Auth middleware (session validation)
                               # Redirect logic for protected routes
                               # Rate limiting
                               # Security headers
```

#### 3.7 Edge Functions (Supabase)

```
supabase/functions/
├── send-verification-email/   # Send email verification
│   └── index.ts
├── send-reset-email/          # Send password reset email
│   └── index.ts
└── handle-oauth-webhook/      # Process OAuth events
    └── index.ts
```

#### 3.8 Database Functions & Triggers

```sql
-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION create_profile_for_user()
  -- Trigger function

-- Update last_login timestamp
CREATE OR REPLACE FUNCTION update_last_login()
  -- Trigger function

-- Soft delete user data (GDPR)
CREATE OR REPLACE FUNCTION soft_delete_user()
  -- Function for data deletion
```

---

## 4. Database Schema

### Schema Overview

```
┌──────────────────────────────────────────────────┐
│              auth schema (managed by Supabase)   │
│  ┌────────────────────────────────────────────┐ │
│  │  users                                      │ │
│  │  ├── id (UUID, PK)                         │ │
│  │  ├── email (TEXT, UNIQUE)                  │ │
│  │  ├── encrypted_password (TEXT)             │ │
│  │  ├── email_confirmed_at (TIMESTAMP)        │ │
│  │  ├── created_at (TIMESTAMP)                │ │
│  │  └── last_sign_in_at (TIMESTAMP)           │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │  identities (OAuth providers)              │ │
│  │  ├── id (UUID, PK)                         │ │
│  │  ├── user_id (UUID, FK → users.id)        │ │
│  │  ├── provider (TEXT) [google, github]     │ │
│  │  ├── identity_data (JSONB)                 │ │
│  │  └── created_at (TIMESTAMP)                │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│              public schema (custom tables)       │
│  ┌────────────────────────────────────────────┐ │
│  │  profiles                                   │ │
│  │  ├── id (UUID, PK, FK → auth.users.id)    │ │
│  │  ├── email (TEXT, NOT NULL)               │ │
│  │  ├── full_name (TEXT)                     │ │
│  │  ├── avatar_url (TEXT)                    │ │
│  │  ├── bio (TEXT)                           │ │
│  │  ├── created_at (TIMESTAMP)               │ │
│  │  └── updated_at (TIMESTAMP)               │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │  audit_logs (security & compliance)        │ │
│  │  ├── id (UUID, PK)                         │ │
│  │  ├── user_id (UUID, FK → auth.users.id)  │ │
│  │  ├── action (TEXT) [login, logout, etc]   │ │
│  │  ├── ip_address (INET)                     │ │
│  │  ├── user_agent (TEXT)                     │ │
│  │  ├── metadata (JSONB)                      │ │
│  │  └── created_at (TIMESTAMP)                │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### Table Definitions

#### 4.1 profiles (public schema)

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### 4.2 audit_logs (public schema)

```sql
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- RLS Policies
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can INSERT audit logs (not users)
CREATE POLICY "Service role can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
```

### Database Functions

#### 4.3 Trigger Functions

```sql
-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_user();

-- Log authentication events
CREATE OR REPLACE FUNCTION log_auth_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, metadata)
  VALUES (
    NEW.id,
    TG_ARGV[0],
    jsonb_build_object(
      'event', TG_OP,
      'table', TG_TABLE_NAME
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Database Migrations

```
supabase/migrations/
├── 20260118000001_initial_schema.sql          # Create profiles table
├── 20260118000002_audit_logs.sql              # Create audit_logs table
├── 20260118000003_rls_policies.sql            # Set up RLS
├── 20260118000004_triggers.sql                # Create triggers
└── 20260118000005_indexes.sql                 # Performance indexes
```

---

## 5. API Design

### Authentication Endpoints

#### POST /api/auth/signup
Create new user account with email/password.

**Request:**
```typescript
{
  email: string;      // Valid email format
  password: string;   // Min 8 chars, strong password
  full_name?: string; // Optional
}
```

**Response (Success - 201):**
```typescript
{
  user: {
    id: string;
    email: string;
    full_name: string | null;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}
```

**Response (Error - 400):**
```typescript
{
  error: {
    code: "invalid_email" | "weak_password" | "email_exists";
    message: string;
  };
}
```

#### POST /api/auth/login
Authenticate with email/password.

**Request:**
```typescript
{
  email: string;
  password: string;
  remember?: boolean; // Extend session duration
}
```

**Response (Success - 200):**
```typescript
{
  user: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}
```

**Response (Error - 401):**
```typescript
{
  error: {
    code: "invalid_credentials";
    message: "Invalid email or password";
  };
}
```

**Rate Limiting:** 5 attempts per 15 minutes per IP

#### POST /api/auth/logout
Sign out current user.

**Request:**
```typescript
{} // Empty body, session from cookie
```

**Response (Success - 200):**
```typescript
{
  message: "Logged out successfully";
}
```

#### GET /api/auth/session
Get current session information.

**Response (Success - 200):**
```typescript
{
  user: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  session: {
    access_token: string;
    expires_at: number;
  } | null;
}
```

#### POST /api/auth/reset-password
Request password reset email.

**Request:**
```typescript
{
  email: string;
}
```

**Response (Success - 200):**
```typescript
{
  message: "If that email exists, we sent a reset link";
}
// Note: Always return success to prevent email enumeration
```

#### POST /api/auth/update-password
Set new password (from reset link or logged in).

**Request:**
```typescript
{
  token?: string;      // From email link (if not logged in)
  new_password: string;
}
```

**Response (Success - 200):**
```typescript
{
  message: "Password updated successfully";
}
```

#### GET /api/auth/callback
OAuth callback handler.

**Query Params:**
```
?code=<oauth_code>
&state=<state>
&provider=google|github
```

**Response:** Redirect to dashboard with session cookie set

### User Endpoints

#### GET /api/user/profile
Get current user profile (requires auth).

**Response (Success - 200):**
```typescript
{
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
  identities: Array<{
    provider: "google" | "github";
    email: string;
  }>;
}
```

#### PATCH /api/user/profile
Update user profile (requires auth).

**Request:**
```typescript
{
  full_name?: string;
  bio?: string;
  // avatar_url updated via separate endpoint
}
```

**Response (Success - 200):**
```typescript
{
  profile: {
    // Updated profile object
  };
}
```

#### POST /api/user/avatar
Upload user avatar (requires auth).

**Request:** multipart/form-data
```
avatar: File (image, max 5MB)
```

**Response (Success - 200):**
```typescript
{
  avatar_url: string; // Public URL
}
```

### Error Response Format

All errors follow consistent format:

```typescript
{
  error: {
    code: string;        // Machine-readable error code
    message: string;     // Human-readable message
    details?: any;       // Optional additional details
  };
}
```

### HTTP Status Codes

- **200:** Success
- **201:** Created (signup)
- **400:** Bad Request (validation error)
- **401:** Unauthorized (auth required)
- **403:** Forbidden (insufficient permissions)
- **404:** Not Found
- **429:** Too Many Requests (rate limited)
- **500:** Internal Server Error

---

## 6. Security Implementation

### Authentication Flow

```
┌─────────────────────────────────────────────────────┐
│                 Email/Password Signup               │
└─────────────────────────────────────────────────────┘
  1. User submits email + password
  2. Frontend validates (Zod schema)
  3. POST /api/auth/signup
  4. Backend validates
  5. Check for duplicate email
  6. Hash password (bcrypt, 10 rounds) [Supabase handles]
  7. Create auth.users record
  8. Trigger creates public.profiles record
  9. Generate JWT access token + refresh token
  10. Send verification email (Edge Function)
  11. Set HTTP-only cookie with tokens
  12. Return user + session
  13. Redirect to dashboard

┌─────────────────────────────────────────────────────┐
│                 Email/Password Login                │
└─────────────────────────────────────────────────────┘
  1. User submits email + password
  2. Frontend validates
  3. POST /api/auth/login
  4. Check rate limit (5 attempts / 15 min / IP)
  5. Verify credentials (Supabase)
  6. If invalid, log attempt, return generic error
  7. If valid, generate new JWT tokens
  8. Update last_sign_in_at
  9. Log to audit_logs
  10. Set HTTP-only cookie
  11. Return user + session
  12. Redirect to destination

┌─────────────────────────────────────────────────────┐
│                    OAuth Login (Google)             │
└─────────────────────────────────────────────────────┘
  1. User clicks "Continue with Google"
  2. Redirect to Google OAuth consent
  3. User authorizes
  4. Google redirects to /api/auth/callback?code=...
  5. Exchange code for access token
  6. Fetch user profile from Google
  7. Check if auth.identities exists
  8. If exists, get user_id, create session
  9. If not exists, create auth.users + identity
  10. Trigger creates profile
  11. Generate JWT tokens
  12. Set HTTP-only cookie
  13. Redirect to dashboard
```

### Session Management

**Token Types:**
- **Access Token (JWT):** Short-lived (1 hour), contains user_id and metadata
- **Refresh Token:** Long-lived (30 days), used to get new access token

**Storage:**
- Tokens stored in HTTP-only cookies (XSS protection)
- Secure flag (HTTPS only)
- SameSite=Lax (CSRF protection)

**Refresh Flow:**
```
1. Access token expires (1 hour)
2. Frontend detects 401 response
3. Automatically calls refresh endpoint
4. Provides refresh token from cookie
5. Backend validates refresh token
6. Issues new access token + refresh token
7. Updates cookie
8. Retries original request
```

**Logout:**
```
1. User clicks logout
2. POST /api/auth/logout
3. Invalidate session (Supabase)
4. Clear cookies
5. Redirect to home/login
```

### Password Security

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

**Password Strength Indicator:**
- Real-time feedback (weak/medium/strong)
- Zxcvbn algorithm for strength estimation

**Password Storage:**
- Bcrypt hashing (10 rounds) via Supabase Auth
- Salted automatically
- Never log or expose passwords

**Password Reset:**
```
1. User requests reset
2. Generate secure random token (Supabase)
3. Send email with time-limited link (1 hour)
4. User clicks link → /auth/update-password?token=...
5. Validate token (not expired, not used)
6. User enters new password
7. Hash and update password
8. Invalidate all sessions
9. Send confirmation email
```

### Rate Limiting

Using Upstash Redis + @upstash/ratelimit:

**Limits:**
- **Login attempts:** 5 per 15 minutes per IP
- **Signup attempts:** 3 per hour per IP
- **Password reset:** 3 per hour per email
- **API calls (general):** 100 per minute per user
- **Avatar upload:** 5 per hour per user

**Implementation:**
```typescript
// middleware.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  analytics: true,
});

export async function checkRateLimit(identifier: string) {
  const { success, limit, remaining, reset } =
    await ratelimit.limit(identifier);

  if (!success) {
    throw new Error("Too many requests");
  }

  return { remaining, reset };
}
```

### CSRF Protection

**Strategy:** Double submit cookie pattern

```typescript
// Generate CSRF token
const csrfToken = crypto.randomUUID();

// Set in cookie
response.cookies.set('csrf-token', csrfToken, {
  httpOnly: false, // Readable by JS
  secure: true,
  sameSite: 'strict'
});

// Client includes in request header
headers: {
  'X-CSRF-Token': getCookie('csrf-token')
}

// Server validates
if (request.headers['x-csrf-token'] !== request.cookies['csrf-token']) {
  throw new Error('Invalid CSRF token');
}
```

### XSS Protection

**Measures:**
- React escapes by default (JSX)
- No `dangerouslySetInnerHTML` usage
- Content Security Policy header
- HTTP-only cookies (tokens not accessible to JS)
- Input sanitization

**CSP Header:**
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://*.supabase.co;
  frame-ancestors 'none';
```

### SQL Injection Protection

**Measures:**
- Parameterized queries via Supabase client (never raw SQL with user input)
- Row Level Security (RLS) on all tables
- Principle of least privilege (limited DB permissions)

### Security Headers

```typescript
// middleware.ts
export function setSecurityHeaders(response: NextResponse) {
  // HSTS
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );

  // CSP
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; ..."
  );

  // X-Frame-Options
  response.headers.set('X-Frame-Options', 'DENY');

  // X-Content-Type-Options
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Referrer-Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  return response;
}
```

---

## 7. File Structure

```
auth-system/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Run tests on PR
│       └── deploy.yml                # Deploy to Vercel
│
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Home page
│   ├── globals.css                   # Global styles
│   │
│   ├── auth/                         # Auth pages
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── reset-password/page.tsx
│   │   ├── update-password/page.tsx
│   │   ├── verify-email/page.tsx
│   │   └── callback/page.tsx
│   │
│   ├── dashboard/                    # Protected pages
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── settings/
│   │   ├── profile/page.tsx
│   │   └── security/page.tsx
│   │
│   └── api/                          # API Routes
│       ├── auth/
│       │   ├── signup/route.ts
│       │   ├── login/route.ts
│       │   ├── logout/route.ts
│       │   ├── session/route.ts
│       │   ├── reset-password/route.ts
│       │   ├── update-password/route.ts
│       │   └── callback/route.ts
│       └── user/
│           ├── profile/route.ts
│           └── avatar/route.ts
│
├── components/                       # React components
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   ├── PasswordResetForm.tsx
│   │   ├── UpdatePasswordForm.tsx
│   │   ├── OAuthButtons.tsx
│   │   ├── AuthGuard.tsx
│   │   └── AuthProvider.tsx
│   │
│   ├── ui/                          # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Label.tsx
│   │   ├── Card.tsx
│   │   ├── Alert.tsx
│   │   ├── Spinner.tsx
│   │   └── Avatar.tsx
│   │
│   └── layout/
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── Sidebar.tsx
│
├── hooks/                           # Custom React hooks
│   ├── useAuth.ts
│   ├── useUser.ts
│   ├── useSession.ts
│   ├── useSupabase.ts
│   ├── useToast.ts
│   └── useForm.ts
│
├── lib/                             # Utilities
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server client (RSC)
│   │   ├── middleware.ts           # Middleware client
│   │   └── types.ts                # Generated DB types
│   │
│   ├── validations/
│   │   ├── auth.ts                 # Zod schemas for auth
│   │   └── profile.ts              # Zod schemas for profile
│   │
│   ├── utils/
│   │   ├── password.ts             # Password utilities
│   │   ├── email.ts                # Email utilities
│   │   ├── errors.ts               # Error handling
│   │   └── rate-limit.ts           # Rate limiting
│   │
│   └── constants/
│       ├── routes.ts
│       ├── messages.ts
│       └── config.ts
│
├── supabase/                        # Supabase config
│   ├── migrations/
│   │   ├── 20260118000001_initial_schema.sql
│   │   ├── 20260118000002_audit_logs.sql
│   │   ├── 20260118000003_rls_policies.sql
│   │   └── 20260118000004_triggers.sql
│   │
│   ├── functions/                   # Edge Functions
│   │   ├── send-verification-email/
│   │   │   └── index.ts
│   │   └── send-reset-email/
│   │       └── index.ts
│   │
│   ├── config.toml                  # Supabase config
│   └── seed.sql                     # Seed data (dev)
│
├── tests/                           # Tests
│   ├── unit/
│   │   ├── utils/
│   │   └── hooks/
│   ├── integration/
│   │   ├── api/
│   │   └── auth-flow.test.ts
│   └── e2e/
│       ├── signup.spec.ts
│       ├── login.spec.ts
│       └── password-reset.spec.ts
│
├── public/                          # Static assets
│   ├── favicon.ico
│   └── images/
│
├── .env.local.example               # Environment variables template
├── .env.local                       # Local environment (gitignored)
├── .eslintrc.json                   # ESLint config
├── .prettierrc                      # Prettier config
├── tsconfig.json                    # TypeScript config
├── tailwind.config.ts               # Tailwind config
├── next.config.js                   # Next.js config
├── package.json                     # Dependencies
├── pnpm-lock.yaml                   # Lock file
├── vitest.config.ts                 # Vitest config
├── playwright.config.ts             # Playwright config
├── middleware.ts                    # Next.js middleware
└── README.md                        # Project documentation
```

---

## 8. Environment Variables

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...        # Server-side only

# OAuth Providers
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# Email (Production - Resend)
RESEND_API_KEY=re_xxx

# Monitoring
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000   # Production: https://app.example.com
NODE_ENV=development                         # production | development | test
```

---

## 9. Implementation Phases

### Phase 1: Foundation (Week 1)

**Goal:** Set up project infrastructure

- [ ] Initialize Next.js 14 project with TypeScript
- [ ] Configure Tailwind CSS
- [ ] Set up ESLint + Prettier
- [ ] Configure Husky git hooks
- [ ] Create Supabase project
- [ ] Set up database schema (migrations)
- [ ] Configure RLS policies
- [ ] Set up GitHub repository
- [ ] Configure GitHub Actions (CI)
- [ ] Set up Vercel project
- [ ] Configure environment variables
- [ ] Create basic file structure
- [ ] Set up Sentry error tracking

**Deliverable:** Working dev environment, deployed skeleton app

### Phase 2: Core Authentication (Week 2)

**Goal:** Email/password auth working

- [ ] Supabase client setup (browser, server, middleware)
- [ ] AuthProvider context
- [ ] useAuth, useUser, useSession hooks
- [ ] Signup API route + form
- [ ] Login API route + form
- [ ] Logout functionality
- [ ] Session management
- [ ] Password validation (Zod schemas)
- [ ] Email verification flow
- [ ] Protected routes (middleware)
- [ ] Unit tests for auth logic
- [ ] Integration tests for API routes
- [ ] E2E test for signup/login flow

**Deliverable:** Working email/password authentication

### Phase 3: OAuth Integration (Week 3)

**Goal:** Google and GitHub login working

- [ ] Configure Google OAuth app
- [ ] Configure GitHub OAuth app
- [ ] OAuthButtons component
- [ ] OAuth callback handler
- [ ] Account linking logic
- [ ] Handle OAuth errors
- [ ] Update profile with OAuth data
- [ ] Tests for OAuth flows
- [ ] E2E tests for social login

**Deliverable:** Working social authentication

### Phase 4: Password Management (Week 3-4)

**Goal:** Password reset and change working

- [ ] Password reset request API
- [ ] Send password reset email (Edge Function)
- [ ] Password reset UI (update-password page)
- [ ] Password change UI (settings)
- [ ] Token validation
- [ ] Session invalidation on password change
- [ ] Tests for password flows
- [ ] E2E tests for password reset

**Deliverable:** Complete password management

### Phase 5: User Profile (Week 4)

**Goal:** Profile viewing and editing

- [ ] Profile page UI
- [ ] Get profile API
- [ ] Update profile API
- [ ] Avatar upload API (Supabase Storage)
- [ ] Avatar component
- [ ] Connected accounts display
- [ ] Account disconnection
- [ ] Tests for profile features

**Deliverable:** Working user profiles

### Phase 6: Security & Compliance (Week 5)

**Goal:** Production-ready security

- [ ] Rate limiting (Upstash Redis)
- [ ] CSRF protection
- [ ] Security headers
- [ ] Audit logging
- [ ] GDPR compliance (data export, deletion)
- [ ] Privacy policy page
- [ ] Terms of service page
- [ ] Security testing
- [ ] Penetration testing

**Deliverable:** Secure, compliant system

### Phase 7: Testing & Optimization (Week 6)

**Goal:** High quality, performant code

- [ ] Achieve 80%+ unit test coverage
- [ ] Achieve 70%+ integration test coverage
- [ ] E2E tests for all critical paths
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Performance optimization
- [ ] Lighthouse score > 90
- [ ] Bundle size optimization (< 150kb)
- [ ] Code review and refactoring

**Deliverable:** Tested, optimized codebase

### Phase 8: Documentation & Deployment (Week 7)

**Goal:** Production deployment

- [ ] README documentation
- [ ] API documentation (OpenAPI/Swagger)
- [ ] User guide
- [ ] Developer guide
- [ ] Deployment guide
- [ ] Production environment setup
- [ ] Database migration to production
- [ ] DNS configuration
- [ ] SSL certificate
- [ ] Monitoring dashboards
- [ ] Alerting configuration
- [ ] Production deployment
- [ ] Smoke tests on production
- [ ] Launch! 🚀

**Deliverable:** Live, documented application

---

## 10. Testing Strategy

### Unit Tests (Vitest)

**Coverage Target:** > 80%

**Test Files:**
```
tests/unit/
├── utils/
│   ├── password.test.ts
│   ├── email.test.ts
│   └── errors.test.ts
├── hooks/
│   ├── useAuth.test.tsx
│   ├── useUser.test.tsx
│   └── useSession.test.tsx
└── validations/
    ├── auth.test.ts
    └── profile.test.ts
```

**Example:**
```typescript
// tests/unit/utils/password.test.ts
import { describe, it, expect } from 'vitest';
import { isStrongPassword, getPasswordStrength } from '@/lib/utils/password';

describe('isStrongPassword', () => {
  it('should reject passwords shorter than 8 chars', () => {
    expect(isStrongPassword('Abc123!')).toBe(false);
  });

  it('should accept strong passwords', () => {
    expect(isStrongPassword('MyP@ssw0rd')).toBe(true);
  });

  it('should require at least one uppercase', () => {
    expect(isStrongPassword('myp@ssw0rd')).toBe(false);
  });

  // ... more tests
});
```

### Integration Tests (Vitest)

**Coverage Target:** > 70%

**Test Files:**
```
tests/integration/
├── api/
│   ├── auth/
│   │   ├── signup.test.ts
│   │   ├── login.test.ts
│   │   ├── logout.test.ts
│   │   └── reset-password.test.ts
│   └── user/
│       └── profile.test.ts
└── database/
    ├── profiles.test.ts
    └── audit-logs.test.ts
```

**Example:**
```typescript
// tests/integration/api/auth/signup.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/signup/route';

describe('POST /api/auth/signup', () => {
  beforeEach(async () => {
    // Clean up test database
    await cleanupTestUsers();
  });

  it('should create a new user', async () => {
    const request = new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'MyP@ssw0rd',
        full_name: 'Test User'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.user.email).toBe('test@example.com');
    expect(data.session).toBeDefined();
  });

  it('should reject weak passwords', async () => {
    const request = new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'weak'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('weak_password');
  });

  // ... more tests
});
```

### E2E Tests (Playwright)

**Critical Paths:**
- Complete signup flow
- Complete login flow
- OAuth flows (Google, GitHub)
- Password reset flow
- Protected route access
- Session persistence

**Test Files:**
```
tests/e2e/
├── signup.spec.ts
├── login.spec.ts
├── oauth.spec.ts
├── password-reset.spec.ts
├── protected-routes.spec.ts
└── session-persistence.spec.ts
```

**Example:**
```typescript
// tests/e2e/signup.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Signup Flow', () => {
  test('should complete full signup flow', async ({ page }) => {
    // Navigate to signup
    await page.goto('/auth/signup');

    // Fill form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'MyP@ssw0rd');
    await page.fill('input[name="full_name"]', 'Test User');

    // Submit
    await page.click('button[type="submit"]');

    // Should show "check your email" message
    await expect(page.locator('text=Check your email')).toBeVisible();

    // Should have created user in database
    const user = await getUserByEmail('test@example.com');
    expect(user).toBeDefined();
  });

  test('should show real-time validation errors', async ({ page }) => {
    await page.goto('/auth/signup');

    // Enter weak password
    await page.fill('input[name="password"]', 'weak');
    await page.blur('input[name="password"]');

    // Should show error
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
  });

  // ... more tests
});
```

### Security Tests

**Tools:** OWASP ZAP, npm audit, Snyk

**Tests:**
- SQL injection attempts
- XSS attempts
- CSRF attacks
- Brute force attacks (rate limiting)
- Session hijacking
- Dependency vulnerabilities

---

## 11. Performance Optimization

### Frontend Optimization

- **Code Splitting:** Automatic with Next.js App Router
- **Image Optimization:** next/image component
- **Font Optimization:** next/font with variable fonts
- **CSS Optimization:** Tailwind CSS purging
- **Bundle Analysis:** @next/bundle-analyzer
- **Lazy Loading:** React.lazy for non-critical components

### Backend Optimization

- **Edge Functions:** Deploy API routes to Vercel Edge
- **Database Connection Pooling:** Supabase PgBouncer
- **Query Optimization:** Indexes on frequently queried columns
- **Caching:** SWR for client-side, ISR for static pages
- **Rate Limiting:** Prevent abuse, improve performance

### Monitoring

**Metrics to Track:**
- Page load time (LCP, FID, CLS)
- API response time (p50, p95, p99)
- Error rate (4xx, 5xx)
- Database query time
- Bundle size

**Tools:**
- Vercel Analytics (performance)
- Sentry (errors, performance)
- Supabase Dashboard (database metrics)
- BetterUptime (uptime monitoring)

---

**Next Step:** Run `/speckit-tasks` to generate implementation tasks
