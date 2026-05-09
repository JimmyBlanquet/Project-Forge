# Implementation Tasks: Auth System

**Version:** 1.0.0
**Date:** 2026-01-18
**Based on:**
- Constitution: `.speckit/constitution.yml`
- Specification: `.speckit/specification.md`
- Plan: `.speckit/plan.md`

**Total Stories:** 18
**Estimated Duration:** 7 weeks

---

## Overview

### Story Categories
- **Foundation:** 3 stories - Project setup, database, infrastructure
- **Core Features:** 8 stories - Authentication, sessions, protected routes
- **Enhanced Features:** 4 stories - OAuth, password reset, profile
- **Testing & Polish:** 3 stories - Security, testing, documentation

### Implementation Order
Stories are ordered by dependencies. Complete in sequence for optimal flow.

---

## Story 1: Initialize Project with Next.js and Supabase

**Category:** Foundation
**Priority:** HIGH
**Complexity:** LOW
**Estimated Time:** 2-3 hours
**Dependencies:** None

### Description
Set up the Next.js 14 project with TypeScript, Tailwind CSS, and Supabase integration. Configure all development tools including ESLint, Prettier, and Husky git hooks.

### Acceptance Criteria
- [ ] Next.js 14+ project initialized with App Router
- [ ] TypeScript 5+ configured in strict mode
- [ ] Tailwind CSS 3.4+ installed and configured
- [ ] ESLint and Prettier configured
- [ ] Husky git hooks set up (pre-commit: lint + format)
- [ ] Supabase project created
- [ ] Supabase client libraries installed
- [ ] Environment variables configured (.env.local.example created)
- [ ] Development server starts without errors
- [ ] Build succeeds

### Files to Create/Modify
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration (strict mode)
- `next.config.js` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `.eslintrc.json` - ESLint configuration
- `.prettierrc` - Prettier configuration
- `.env.local.example` - Environment variables template
- `.gitignore` - Ignore node_modules, .env.local, etc.
- `app/layout.tsx` - Root layout
- `app/page.tsx` - Home page
- `app/globals.css` - Global styles with Tailwind directives
- `.husky/pre-commit` - Git pre-commit hook

### Technical Details
- **Package Manager:** pnpm 8.14+
- **Node Version:** 20 LTS
- **Next.js:** 14.0.4 (App Router)
- **TypeScript:** 5.3.3 (strict: true)
- **Tailwind:** 3.4.0
- **Supabase:** @supabase/supabase-js ^2.39.0

### Testing Requirements
- [ ] Dev server runs on http://localhost:3000
- [ ] Build command succeeds
- [ ] Type checking passes (tsc --noEmit)
- [ ] Linting passes
- [ ] Formatting is correct

### Definition of Done
- [ ] All acceptance criteria met
- [ ] Development environment working
- [ ] Documentation in README.md
- [ ] Git repository initialized
- [ ] Initial commit made

---

## Story 2: Create Database Schema and RLS Policies

**Category:** Foundation
**Priority:** HIGH
**Complexity:** MEDIUM
**Estimated Time:** 3-4 hours
**Dependencies:** Story 1

### Description
Create PostgreSQL database schema for user profiles and audit logs. Set up Row Level Security policies to protect user data. Create database triggers for automatic profile creation.

### Acceptance Criteria
- [ ] `profiles` table created with proper schema
- [ ] `audit_logs` table created for security logging
- [ ] RLS enabled on all public tables
- [ ] RLS policies created (users can view/update own profile)
- [ ] Trigger function `create_profile_for_user()` created
- [ ] Trigger attached to `auth.users` table
- [ ] Indexes created on foreign keys
- [ ] Migration files created
- [ ] Migrations applied to Supabase database
- [ ] Database types generated for TypeScript

### Files to Create/Modify
- `supabase/migrations/20260118000001_initial_schema.sql` - profiles table
- `supabase/migrations/20260118000002_audit_logs.sql` - audit_logs table
- `supabase/migrations/20260118000003_rls_policies.sql` - RLS policies
- `supabase/migrations/20260118000004_triggers.sql` - Trigger functions
- `supabase/migrations/20260118000005_indexes.sql` - Performance indexes
- `lib/supabase/types.ts` - Generated database types

### Technical Details
- **Database:** PostgreSQL 15.1 (Supabase)
- **Schema:**
  - profiles: id (UUID PK, FK to auth.users), email, full_name, avatar_url, bio, timestamps
  - audit_logs: id (UUID PK), user_id (FK), action, ip_address, user_agent, metadata (JSONB), created_at
- **RLS:** Enabled on all tables, users can only access their own data
- **Triggers:** Auto-create profile on user signup

### Testing Requirements
- [ ] Can create profile row
- [ ] Can read own profile (not others')
- [ ] Can update own profile (not others')
- [ ] Trigger creates profile when auth.users row inserted
- [ ] Audit log entries created successfully

### Definition of Done
- [ ] All migrations applied
- [ ] RLS policies tested
- [ ] Triggers working
- [ ] Types generated
- [ ] Git committed

---

## Story 3: Set Up Authentication Infrastructure

**Category:** Foundation
**Priority:** HIGH
**Complexity:** MEDIUM
**Estimated Time:** 4-5 hours
**Dependencies:** Story 2

### Description
Create Supabase client instances for different environments (browser, server, middleware). Set up AuthProvider React Context, authentication hooks, and middleware for protecting routes.

### Acceptance Criteria
- [ ] Supabase browser client created
- [ ] Supabase server client created (for RSC)
- [ ] Supabase middleware client created
- [ ] AuthProvider context implemented
- [ ] useAuth hook implemented (user, session, loading, signIn, signUp, signOut)
- [ ] useUser hook implemented
- [ ] useSession hook implemented
- [ ] useSupabase hook implemented
- [ ] Middleware created for auth guard
- [ ] Protected route redirects to login
- [ ] Types defined for auth context

### Files to Create/Modify
- `lib/supabase/client.ts` - Browser Supabase client
- `lib/supabase/server.ts` - Server Supabase client (RSC)
- `lib/supabase/middleware.ts` - Middleware Supabase client
- `lib/supabase/types.ts` - Auth types
- `components/auth/AuthProvider.tsx` - Auth context provider
- `hooks/useAuth.ts` - Auth hook
- `hooks/useUser.ts` - User hook
- `hooks/useSession.ts` - Session hook
- `hooks/useSupabase.ts` - Supabase client hook
- `middleware.ts` - Route protection middleware
- `lib/constants/routes.ts` - Route constants
- `app/layout.tsx` - Wrap with AuthProvider

### Technical Details
- **Auth Context State:** user (User | null), session (Session | null), loading (boolean)
- **Auth Methods:** signIn, signUp, signOut, resetPassword, updatePassword
- **Middleware:** Check session, redirect if unauthenticated on protected routes
- **Protected Routes:** /dashboard/*, /settings/*

### Testing Requirements
- [ ] Unit tests for hooks
- [ ] AuthProvider renders children
- [ ] useAuth returns correct shape
- [ ] Middleware redirects unauthenticated users

### Definition of Done
- [ ] All files created
- [ ] Unit tests passing
- [ ] No TypeScript errors
- [ ] Git committed

---

## Story 4: Build Signup Form and API

**Category:** Core
**Priority:** HIGH
**Complexity:** MEDIUM
**Estimated Time:** 4-5 hours
**Dependencies:** Story 3

### Description
Create signup page with form validation using React Hook Form and Zod. Implement API route for user registration. Add real-time password strength indicator.

### Acceptance Criteria
- [ ] Signup page UI created at /auth/signup
- [ ] SignupForm component with email, password, full_name fields
- [ ] Real-time validation with Zod schema
- [ ] Password strength indicator (weak/medium/strong)
- [ ] "Continue with Google/GitHub" buttons (non-functional placeholder)
- [ ] POST /api/auth/signup endpoint implemented
- [ ] Email uniqueness checked
- [ ] Password hashed by Supabase Auth
- [ ] User profile auto-created via trigger
- [ ] Session created on successful signup
- [ ] HTTP-only cookie set with tokens
- [ ] Error handling (duplicate email, weak password, etc.)
- [ ] Success redirects to dashboard
- [ ] Link to login page

### Files to Create/Modify
- `app/auth/signup/page.tsx` - Signup page
- `components/auth/SignupForm.tsx` - Signup form component
- `components/ui/Input.tsx` - Reusable input component
- `components/ui/Button.tsx` - Reusable button component
- `components/ui/Label.tsx` - Form label component
- `lib/validations/auth.ts` - Zod schemas (signupSchema)
- `lib/utils/password.ts` - Password strength checker
- `lib/constants/messages.ts` - Error/success messages
- `app/api/auth/signup/route.ts` - POST handler for signup
- `lib/utils/errors.ts` - Error handling utilities

### Technical Details
- **Validation:** Zod schema with email format, password strength (min 8 chars, mixed case, number, special char)
- **Password Strength:** zxcvbn algorithm or similar
- **Form Library:** React Hook Form
- **API:** Supabase Auth signUp() method
- **Session:** JWT tokens in HTTP-only, Secure, SameSite=Lax cookies

### Testing Requirements
- [ ] Unit tests for validation schema
- [ ] Unit tests for password strength function
- [ ] Component tests for SignupForm
- [ ] Integration test for POST /api/auth/signup
- [ ] E2E test for complete signup flow

### Definition of Done
- [ ] All acceptance criteria met
- [ ] Tests passing (unit, integration, E2E)
- [ ] No console errors
- [ ] TypeScript strict mode passing
- [ ] Git committed

---

## Story 5: Build Login Form and API

**Category:** Core
**Priority:** HIGH
**Complexity:** MEDIUM
**Estimated Time:** 3-4 hours
**Dependencies:** Story 4

### Description
Create login page with email/password authentication. Implement rate limiting to prevent brute force attacks. Add "remember me" functionality.

### Acceptance Criteria
- [ ] Login page UI created at /auth/login
- [ ] LoginForm component with email and password fields
- [ ] Real-time validation
- [ ] Password visibility toggle
- [ ] "Remember me" checkbox
- [ ] "Forgot password?" link
- [ ] POST /api/auth/login endpoint implemented
- [ ] Credentials validated via Supabase Auth
- [ ] Rate limiting (5 attempts per 15 min per IP) using Upstash Redis
- [ ] Generic error message (don't reveal if email exists)
- [ ] Session created on successful login
- [ ] HTTP-only cookie set
- [ ] Remember me extends session duration
- [ ] Failed attempts logged to audit_logs
- [ ] Success redirects to dashboard or original destination
- [ ] Link to signup page

### Files to Create/Modify
- `app/auth/login/page.tsx` - Login page
- `components/auth/LoginForm.tsx` - Login form component
- `lib/validations/auth.ts` - loginSchema (Zod)
- `app/api/auth/login/route.ts` - POST handler
- `lib/utils/rate-limit.ts` - Rate limiting with Upstash
- `lib/utils/audit.ts` - Audit logging utility

### Technical Details
- **Rate Limiting:** Upstash Redis + @upstash/ratelimit (5 attempts / 15 min / IP)
- **Remember Me:** Extend session from 1 hour to 30 days
- **Generic Error:** "Invalid email or password" (don't say which is wrong)
- **Audit Log:** Log failed login attempts with IP, user agent, timestamp

### Testing Requirements
- [ ] Unit tests for loginSchema
- [ ] Component tests for LoginForm
- [ ] Integration test for POST /api/auth/login (success, failure, rate limit)
- [ ] E2E test for login flow

### Definition of Done
- [ ] All acceptance criteria met
- [ ] Tests passing
- [ ] Rate limiting working
- [ ] Audit logging working
- [ ] Git committed

---

## Story 6: Implement Session Management and Logout

**Category:** Core
**Priority:** HIGH
**Complexity:** LOW
**Estimated Time:** 2-3 hours
**Dependencies:** Story 5

### Description
Implement session validation, token refresh, and logout functionality. Ensure sessions persist across page reloads and refresh automatically before expiration.

### Acceptance Criteria
- [ ] Session persists across page reloads
- [ ] Session validates on app mount (useEffect in AuthProvider)
- [ ] Expired sessions automatically refresh using refresh token
- [ ] GET /api/auth/session endpoint returns current session
- [ ] POST /api/auth/logout endpoint invalidates session
- [ ] Logout clears HTTP-only cookies
- [ ] Logout redirects to home or login page
- [ ] Loading states shown during auth checks
- [ ] useSession hook returns session status

### Files to Create/Modify
- `app/api/auth/session/route.ts` - GET handler for session
- `app/api/auth/logout/route.ts` - POST handler for logout
- `components/auth/AuthProvider.tsx` - Add session refresh logic
- `hooks/useSession.ts` - Session status hook

### Technical Details
- **Token Refresh:** Automatic via Supabase client (before 1 hour expiry)
- **Session Storage:** HTTP-only cookies
- **Session Validation:** On app mount, check if session exists and is valid
- **Logout:** Call Supabase signOut(), clear cookies

### Testing Requirements
- [ ] Session persists after page reload
- [ ] Expired session refreshes automatically
- [ ] Logout clears session
- [ ] Integration tests for session/logout endpoints

### Definition of Done
- [ ] Sessions working correctly
- [ ] Tests passing
- [ ] No memory leaks
- [ ] Git committed

---

## Story 7: Create Protected Routes and Dashboard

**Category:** Core
**Priority:** HIGH
**Complexity:** LOW
**Estimated Time:** 2-3 hours
**Dependencies:** Story 6

### Description
Create dashboard page (protected) and implement route protection via middleware. Unauthenticated users should be redirected to login with return URL saved.

### Acceptance Criteria
- [ ] Dashboard page created at /dashboard
- [ ] Dashboard shows welcome message with user's name
- [ ] Dashboard shows user avatar
- [ ] Dashboard has navigation to settings
- [ ] Middleware checks auth on /dashboard/* routes
- [ ] Unauthenticated users redirected to /auth/login?redirect=/dashboard
- [ ] After login, user redirected back to original destination
- [ ] Authenticated users can access dashboard
- [ ] Loading state shown during auth check

### Files to Create/Modify
- `app/dashboard/page.tsx` - Dashboard page
- `app/dashboard/layout.tsx` - Dashboard layout
- `components/layout/Header.tsx` - Header with user menu
- `components/ui/Avatar.tsx` - User avatar component
- `middleware.ts` - Update with dashboard protection
- `lib/constants/routes.ts` - Add dashboard routes

### Technical Details
- **Protection:** Middleware checks session, redirects if null
- **Return URL:** Save in query param: /auth/login?redirect=/dashboard
- **After Login:** Read redirect param, navigate there
- **Layout:** Dashboard layout with sidebar navigation

### Testing Requirements
- [ ] Unauthenticated user redirected to login
- [ ] Authenticated user can access dashboard
- [ ] Return URL works correctly
- [ ] E2E test for protected route access

### Definition of Done
- [ ] Dashboard accessible only to authenticated users
- [ ] Tests passing
- [ ] Git committed

---

## Story 8: Implement Google OAuth Login

**Category:** Enhanced
**Priority:** HIGH
**Complexity:** HIGH
**Estimated Time:** 4-5 hours
**Dependencies:** Story 7

### Description
Integrate Google OAuth 2.0 for social login. Handle OAuth callback, create or link user accounts, and extract user profile information from Google.

### Acceptance Criteria
- [ ] Google OAuth app configured in Google Cloud Console
- [ ] Google Client ID and Secret added to environment variables
- [ ] "Continue with Google" button functional on login/signup pages
- [ ] Clicking button redirects to Google OAuth consent screen
- [ ] User authorizes, Google redirects to /api/auth/callback
- [ ] GET /api/auth/callback handles OAuth callback
- [ ] Exchange authorization code for access token
- [ ] Fetch user profile from Google (email, name, avatar)
- [ ] If email exists, link Google identity to existing user
- [ ] If email new, create new user with Google identity
- [ ] Session created, cookies set
- [ ] User redirected to dashboard
- [ ] OAuth errors handled gracefully (show user-friendly message)
- [ ] OAuthButtons component created

### Files to Create/Modify
- `components/auth/OAuthButtons.tsx` - Google/GitHub buttons
- `app/api/auth/callback/route.ts` - OAuth callback handler
- `lib/utils/oauth.ts` - OAuth helper functions
- `.env.local.example` - Add Google OAuth vars
- Update `components/auth/LoginForm.tsx` - Add OAuthButtons
- Update `components/auth/SignupForm.tsx` - Add OAuthButtons

### Technical Details
- **OAuth Provider:** Supabase Auth with Google provider
- **Scopes:** email, profile
- **Redirect URI:** https://your-app.vercel.app/api/auth/callback
- **Account Linking:** If email exists, link identity; else create new user
- **Error Handling:** Display toast/alert on OAuth errors

### Testing Requirements
- [ ] Integration test for OAuth callback
- [ ] Test account linking (existing email)
- [ ] Test new account creation
- [ ] E2E test for Google OAuth flow (may require manual testing)

### Definition of Done
- [ ] Google OAuth working end-to-end
- [ ] Account linking working
- [ ] Errors handled gracefully
- [ ] Tests passing
- [ ] Git committed

---

## Story 9: Implement GitHub OAuth Login

**Category:** Enhanced
**Priority:** MEDIUM
**Complexity:** MEDIUM
**Estimated Time:** 3-4 hours
**Dependencies:** Story 8

### Description
Integrate GitHub OAuth 2.0 for social login. Similar to Google OAuth but with GitHub-specific implementation.

### Acceptance Criteria
- [ ] GitHub OAuth app configured in GitHub settings
- [ ] GitHub Client ID and Secret added to environment variables
- [ ] "Continue with GitHub" button functional
- [ ] OAuth flow works (authorize, callback, profile fetch)
- [ ] Account linking works
- [ ] New account creation works
- [ ] User redirected to dashboard
- [ ] Errors handled

### Files to Create/Modify
- Update `components/auth/OAuthButtons.tsx` - Add GitHub button
- Update `app/api/auth/callback/route.ts` - Handle GitHub provider
- `.env.local.example` - Add GitHub OAuth vars

### Technical Details
- **OAuth Provider:** Supabase Auth with GitHub provider
- **Scopes:** user:email
- **Implementation:** Similar to Google OAuth (Story 8)

### Testing Requirements
- [ ] Integration test for GitHub OAuth callback
- [ ] E2E test for GitHub OAuth flow

### Definition of Done
- [ ] GitHub OAuth working
- [ ] Tests passing
- [ ] Git committed

---

## Story 10: Build Password Reset Flow

**Category:** Enhanced
**Priority:** HIGH
**Complexity:** MEDIUM
**Estimated Time:** 4-5 hours
**Dependencies:** Story 5

### Description
Implement password reset functionality via email. Users can request a reset link, receive email, and set a new password using a time-limited token.

### Acceptance Criteria
- [ ] Password reset request page at /auth/reset-password
- [ ] PasswordResetForm component (email input)
- [ ] POST /api/auth/reset-password endpoint
- [ ] Always return success (prevent email enumeration)
- [ ] Email sent with reset link (if email exists)
- [ ] Reset link contains time-limited token (1 hour expiry)
- [ ] Update password page at /auth/update-password
- [ ] UpdatePasswordForm component (new password input)
- [ ] POST /api/auth/update-password validates token
- [ ] Token must not be expired or already used
- [ ] New password validated (strength check)
- [ ] Password updated in database
- [ ] All other sessions invalidated
- [ ] Confirmation email sent
- [ ] User can log in with new password
- [ ] Error handling (expired token, invalid token)

### Files to Create/Modify
- `app/auth/reset-password/page.tsx` - Request reset page
- `components/auth/PasswordResetForm.tsx` - Reset request form
- `app/auth/update-password/page.tsx` - Set new password page
- `components/auth/UpdatePasswordForm.tsx` - Update password form
- `app/api/auth/reset-password/route.ts` - POST handler for request
- `app/api/auth/update-password/route.ts` - POST handler for update
- `supabase/functions/send-reset-email/index.ts` - Edge function to send email
- Update `components/auth/LoginForm.tsx` - Add "Forgot password?" link

### Technical Details
- **Email:** Supabase Auth resetPasswordForEmail() method
- **Token:** Generated by Supabase, single-use, 1 hour expiry
- **Security:** Always return success to prevent email enumeration
- **Session Invalidation:** After password change, invalidate all sessions

### Testing Requirements
- [ ] Integration test for reset request
- [ ] Integration test for password update
- [ ] Test token expiry
- [ ] Test invalid token
- [ ] E2E test for complete password reset flow

### Definition of Done
- [ ] Password reset working end-to-end
- [ ] Email sent and received
- [ ] Token validation working
- [ ] Tests passing
- [ ] Git committed

---

## Story 11: Build User Profile Page

**Category:** Enhanced
**Priority:** MEDIUM
**Complexity:** MEDIUM
**Estimated Time:** 4-5 hours
**Dependencies:** Story 7

### Description
Create user profile page where users can view and edit their profile information (name, bio), upload avatar, and view connected social accounts.

### Acceptance Criteria
- [ ] Profile page created at /settings/profile
- [ ] Shows current profile (full_name, email, bio, avatar)
- [ ] Form to edit full_name and bio
- [ ] Avatar upload functionality
- [ ] Shows connected accounts (Google, GitHub)
- [ ] Option to disconnect social accounts
- [ ] GET /api/user/profile endpoint returns profile + identities
- [ ] PATCH /api/user/profile updates profile
- [ ] POST /api/user/avatar uploads avatar to Supabase Storage
- [ ] Avatar URL saved to profiles.avatar_url
- [ ] Success message shown after update
- [ ] Changes reflected immediately in UI
- [ ] Validation (name length, bio length, image size/type)

### Files to Create/Modify
- `app/settings/profile/page.tsx` - Profile settings page
- `app/api/user/profile/route.ts` - GET, PATCH handlers
- `app/api/user/avatar/route.ts` - POST handler for avatar upload
- `lib/validations/profile.ts` - Zod schema for profile update
- `components/ui/Avatar.tsx` - Update to handle upload

### Technical Details
- **Avatar Storage:** Supabase Storage (public bucket)
- **Avatar Validation:** Max 5MB, types: image/jpeg, image/png, image/webp
- **Avatar Resize:** Optional (use sharp or browser-side canvas)
- **Connected Accounts:** Query auth.identities table

### Testing Requirements
- [ ] Integration test for GET /api/user/profile
- [ ] Integration test for PATCH /api/user/profile
- [ ] Integration test for POST /api/user/avatar
- [ ] E2E test for profile update flow

### Definition of Done
- [ ] Profile page working
- [ ] Avatar upload working
- [ ] Tests passing
- [ ] Git committed

---

## Story 12: Implement Password Change in Settings

**Category:** Core
**Priority:** MEDIUM
**Complexity:** LOW
**Estimated Time:** 2-3 hours
**Dependencies:** Story 11

### Description
Add password change functionality in user settings. User must provide current password for verification before setting a new password.

### Acceptance Criteria
- [ ] Security settings page at /settings/security
- [ ] Form to change password (current, new, confirm)
- [ ] Current password verified before allowing change
- [ ] New password strength validated
- [ ] Passwords must match (new === confirm)
- [ ] POST /api/auth/update-password handles password change
- [ ] Password updated in database
- [ ] Optional: Logout all other sessions checkbox
- [ ] Confirmation email sent
- [ ] Success message shown

### Files to Create/Modify
- `app/settings/security/page.tsx` - Security settings page
- Update `app/api/auth/update-password/route.ts` - Handle authenticated password change
- `lib/validations/auth.ts` - changePasswordSchema (Zod)

### Technical Details
- **Current Password Verification:** Re-authenticate with Supabase
- **New Password:** Same strength requirements as signup
- **Session Invalidation:** Optional, controlled by checkbox

### Testing Requirements
- [ ] Integration test for password change
- [ ] Test current password verification
- [ ] E2E test for password change flow

### Definition of Done
- [ ] Password change working
- [ ] Tests passing
- [ ] Git committed

---

## Story 13: Add Security Features (Rate Limiting, CSRF, Headers)

**Category:** Testing & Security
**Priority:** HIGH
**Complexity:** MEDIUM
**Estimated Time:** 4-5 hours
**Dependencies:** Story 12

### Description
Implement comprehensive security measures: rate limiting, CSRF protection, security headers, and audit logging for all authentication events.

### Acceptance Criteria
- [ ] Rate limiting implemented with Upstash Redis
  - Login: 5 attempts / 15 min / IP
  - Signup: 3 attempts / hour / IP
  - Password reset: 3 attempts / hour / email
  - API calls: 100 / min / user
  - Avatar upload: 5 / hour / user
- [ ] CSRF protection implemented (double submit cookie pattern)
- [ ] Security headers set in middleware:
  - Strict-Transport-Security (HSTS)
  - Content-Security-Policy (CSP)
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy
- [ ] Audit logging for auth events (login, logout, password change, etc.)
- [ ] IP address and user agent captured in logs
- [ ] All API routes protected by rate limiting
- [ ] CSRF tokens validated on state-changing requests

### Files to Create/Modify
- `lib/utils/rate-limit.ts` - Rate limiting utilities
- `lib/utils/csrf.ts` - CSRF token generation and validation
- `lib/utils/audit.ts` - Audit logging utilities
- `middleware.ts` - Add security headers and CSRF check
- Update all state-changing API routes - Add rate limiting

### Technical Details
- **Rate Limiting:** @upstash/ratelimit with Redis
- **CSRF:** Double submit cookie (cookie + header must match)
- **Headers:** Set via Next.js middleware
- **Audit Logs:** Insert to audit_logs table on auth events

### Testing Requirements
- [ ] Test rate limiting (exceed limit, get 429)
- [ ] Test CSRF protection (invalid token rejected)
- [ ] Test security headers present in responses
- [ ] Test audit logs created

### Definition of Done
- [ ] All security measures implemented
- [ ] Tests passing
- [ ] Security audit passed
- [ ] Git committed

---

## Story 14: Create Comprehensive Test Suite

**Category:** Testing & Security
**Priority:** HIGH
**Complexity:** HIGH
**Estimated Time:** 6-8 hours
**Dependencies:** Story 13

### Description
Write comprehensive test suite covering unit tests, integration tests, and E2E tests for all authentication flows and features.

### Acceptance Criteria
- [ ] Unit test coverage > 80%
  - Utilities (password, email, errors)
  - Hooks (useAuth, useUser, useSession)
  - Validations (Zod schemas)
- [ ] Integration test coverage > 70%
  - All API routes tested
  - Database operations tested
- [ ] E2E tests for critical paths:
  - Complete signup flow
  - Complete login flow
  - Google OAuth flow
  - GitHub OAuth flow
  - Password reset flow
  - Protected route access
  - Session persistence
  - Profile update flow
- [ ] Test configuration files set up (vitest.config.ts, playwright.config.ts)
- [ ] All tests passing
- [ ] CI configured to run tests on PR

### Files to Create/Modify
- `vitest.config.ts` - Vitest configuration
- `playwright.config.ts` - Playwright configuration
- `tests/unit/utils/password.test.ts`
- `tests/unit/utils/email.test.ts`
- `tests/unit/hooks/useAuth.test.tsx`
- `tests/unit/validations/auth.test.ts`
- `tests/integration/api/auth/signup.test.ts`
- `tests/integration/api/auth/login.test.ts`
- `tests/integration/api/auth/logout.test.ts`
- `tests/integration/api/auth/reset-password.test.ts`
- `tests/integration/api/user/profile.test.ts`
- `tests/e2e/signup.spec.ts`
- `tests/e2e/login.spec.ts`
- `tests/e2e/oauth.spec.ts`
- `tests/e2e/password-reset.spec.ts`
- `tests/e2e/protected-routes.spec.ts`
- `.github/workflows/ci.yml` - GitHub Actions CI

### Technical Details
- **Unit Tests:** Vitest + Testing Library
- **Integration Tests:** Vitest with Supabase test instance
- **E2E Tests:** Playwright
- **Coverage:** c8 (built into Vitest)
- **CI:** GitHub Actions runs tests on every PR

### Testing Requirements
- [ ] All tests pass locally
- [ ] All tests pass in CI
- [ ] Coverage reports generated
- [ ] Coverage meets requirements (80% unit, 70% integration)

### Definition of Done
- [ ] Comprehensive test suite implemented
- [ ] All tests passing
- [ ] Coverage requirements met
- [ ] CI configured and working
- [ ] Git committed

---

## Story 15: Accessibility Audit and WCAG 2.1 AA Compliance

**Category:** Testing & Security
**Priority:** MEDIUM
**Complexity:** MEDIUM
**Estimated Time:** 3-4 hours
**Dependencies:** Story 14

### Description
Conduct accessibility audit and ensure WCAG 2.1 AA compliance. Fix any accessibility issues found.

### Acceptance Criteria
- [ ] All forms have proper labels
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible on all interactive elements
- [ ] Color contrast ratio >= 4.5:1 for text
- [ ] Semantic HTML used throughout
- [ ] ARIA labels added where needed
- [ ] Images have alt text
- [ ] Form errors announced to screen readers
- [ ] Skip to content link added
- [ ] Landmark regions defined (header, nav, main, footer)
- [ ] Screen reader tested (NVDA or JAWS)
- [ ] axe DevTools audit passed (0 violations)
- [ ] WAVE tool audit passed
- [ ] Lighthouse accessibility score > 95

### Files to Modify
- All component files (add ARIA labels, semantic HTML)
- `app/globals.css` - Add focus styles, ensure contrast
- `components/layout/Header.tsx` - Add skip link

### Technical Details
- **Tools:** axe DevTools, WAVE, Lighthouse
- **Screen Reader:** NVDA (Windows) or VoiceOver (Mac)
- **Focus Management:** Visible focus indicators, focus trapping in modals

### Testing Requirements
- [ ] Manual keyboard navigation test
- [ ] Manual screen reader test
- [ ] Automated axe audit
- [ ] Automated Lighthouse audit

### Definition of Done
- [ ] WCAG 2.1 AA compliance achieved
- [ ] axe audit 0 violations
- [ ] Lighthouse accessibility score > 95
- [ ] Git committed

---

## Story 16: Performance Optimization and Lighthouse Score

**Category:** Testing & Security
**Priority:** MEDIUM
**Complexity:** MEDIUM
**Estimated Time:** 3-4 hours
**Dependencies:** Story 15

### Description
Optimize application performance to meet constitution requirements: page load < 2s, API response < 300ms, Lighthouse score > 90, bundle size < 150kb.

### Acceptance Criteria
- [ ] Lighthouse performance score > 90
- [ ] Page load time < 2s (LCP < 2s)
- [ ] Time to Interactive < 3s
- [ ] First Input Delay < 100ms
- [ ] Cumulative Layout Shift < 0.1
- [ ] API response time < 300ms (p95)
- [ ] Initial JS bundle < 150kb
- [ ] Images optimized (next/image)
- [ ] Fonts optimized (next/font)
- [ ] Code splitting implemented
- [ ] Bundle analysis shows no unnecessary large dependencies
- [ ] Edge deployment configured
- [ ] Vercel Analytics integrated

### Files to Create/Modify
- `next.config.js` - Enable bundle analyzer
- `app/layout.tsx` - Optimize font loading
- All image components - Use next/image
- Large components - Add lazy loading with React.lazy
- `.env.local.example` - Add Vercel Analytics env vars

### Technical Details
- **Bundle Analysis:** @next/bundle-analyzer
- **Image Optimization:** next/image with automatic optimization
- **Font Optimization:** next/font with variable fonts
- **Code Splitting:** Automatic with App Router + manual React.lazy
- **Edge Deployment:** Vercel Edge Functions for API routes

### Testing Requirements
- [ ] Lighthouse audit in production mode
- [ ] Performance testing with real users (optional)
- [ ] Bundle size checked with analyzer

### Definition of Done
- [ ] Lighthouse score > 90
- [ ] Performance requirements met
- [ ] Bundle size < 150kb
- [ ] Git committed

---

## Story 17: Documentation (README, API Docs, User Guide)

**Category:** Documentation
**Priority:** MEDIUM
**Complexity:** LOW
**Estimated Time:** 3-4 hours
**Dependencies:** Story 16

### Description
Create comprehensive documentation including README, API documentation, user guide, and developer guide.

### Acceptance Criteria
- [ ] README.md updated with:
  - Project description
  - Features list
  - Tech stack
  - Prerequisites
  - Installation instructions
  - Environment variables setup
  - Development commands
  - Deployment instructions
  - License
- [ ] API documentation created (OpenAPI/Swagger or similar)
- [ ] User guide created (how to use the app)
- [ ] Developer guide created (how to contribute, architecture overview)
- [ ] Code comments added where necessary (complex logic)
- [ ] TSDoc comments for public functions/hooks

### Files to Create/Modify
- `README.md` - Project documentation
- `docs/api.md` - API documentation
- `docs/user-guide.md` - User guide
- `docs/developer-guide.md` - Developer guide
- `docs/architecture.md` - Architecture overview
- Add TSDoc comments to hooks and utilities

### Technical Details
- **API Docs:** Markdown format or OpenAPI spec
- **TSDoc:** Use for all exported functions

### Testing Requirements
- [ ] Documentation reviewed for accuracy
- [ ] All links working
- [ ] Code examples tested

### Definition of Done
- [ ] All documentation complete
- [ ] Documentation reviewed
- [ ] Git committed

---

## Story 18: Production Deployment and Monitoring

**Category:** Documentation
**Priority:** HIGH
**Complexity:** MEDIUM
**Estimated Time:** 4-5 hours
**Dependencies:** Story 17

### Description
Deploy application to production on Vercel. Set up monitoring, error tracking, and alerting. Configure production environment variables.

### Acceptance Criteria
- [ ] Vercel project created
- [ ] Production environment variables configured in Vercel
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Supabase production project created
- [ ] Database migrated to production
- [ ] Google OAuth production app configured
- [ ] GitHub OAuth production app configured
- [ ] Sentry project created for error tracking
- [ ] Sentry integrated in app
- [ ] Vercel Analytics enabled
- [ ] Uptime monitoring configured (BetterUptime or similar)
- [ ] Alerts configured (errors, downtime)
- [ ] Production deployment successful
- [ ] Smoke tests passed on production
- [ ] Performance tested on production

### Files to Create/Modify
- `next.config.js` - Add Sentry configuration
- `.env.production` - Production environment variables (in Vercel dashboard)
- Update `app/layout.tsx` - Add Sentry initialization

### Technical Details
- **Hosting:** Vercel (Pro plan recommended for production)
- **Database:** Supabase (production tier)
- **Domain:** Configure in Vercel dashboard
- **Monitoring:** Sentry (errors), Vercel Analytics (performance), BetterUptime (uptime)
- **Environment:** Production environment in Vercel

### Testing Requirements
- [ ] Smoke tests on production (signup, login, logout)
- [ ] Performance tested (Lighthouse on production URL)
- [ ] Monitoring verified (trigger test error, check Sentry)

### Definition of Done
- [ ] Application live in production
- [ ] Monitoring active
- [ ] No critical errors
- [ ] Performance meets requirements
- [ ] Launch announcement ready 🚀
- [ ] Git tagged with v1.0.0

---

## Story Dependency Graph

```
Story 1 (Initialize Project)
    ↓
Story 2 (Database Schema)
    ↓
Story 3 (Auth Infrastructure)
    ↓
Story 4 (Signup) ────────────┐
    ↓                        │
Story 5 (Login) ─────────────┤
    ↓                        │
Story 6 (Session/Logout)     │
    ↓                        │
Story 7 (Dashboard) ─────────┤
    ↓                        │
Story 8 (Google OAuth) ──────┤
    ↓                        │
Story 9 (GitHub OAuth)       │
    │                        │
Story 10 (Password Reset) ───┤
    │                        │
Story 11 (Profile) ──────────┤
    ↓                        │
Story 12 (Change Password) ──┘
    ↓
Story 13 (Security Features)
    ↓
Story 14 (Test Suite)
    ↓
Story 15 (Accessibility)
    ↓
Story 16 (Performance)
    ↓
Story 17 (Documentation)
    ↓
Story 18 (Production Deploy)
```

---

## Implementation Notes

### Best Practices
- Follow constitution principles (security-first, type-safe, tested)
- Use tech stack from plan (Next.js 14, TypeScript, Supabase, Tailwind)
- Write tests before marking story complete (TDD approach)
- Commit after each story with conventional commit message
- Run linter and type checker before committing
- Test in multiple browsers (Chrome, Firefox, Safari)

### Common Patterns

**Error Handling:**
```typescript
try {
  const result = await supabase.auth.signUp({ email, password });
  if (result.error) throw result.error;
  return result;
} catch (error) {
  console.error('Signup error:', error);
  throw new Error('Failed to sign up');
}
```

**Validation:**
```typescript
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/),
  full_name: z.string().optional(),
});
```

**State Management:**
```typescript
// Use React Context for global auth state
const AuthContext = createContext<AuthContextType>(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ... auth methods

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### Resources
- Constitution: `.speckit/constitution.yml`
- Specification: `.speckit/specification.md`
- Plan: `.speckit/plan.md`
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- Tailwind Docs: https://tailwindcss.com/docs

---

**Next Step:** Run `/speckit-convert` to generate prd.json for Ralph++
