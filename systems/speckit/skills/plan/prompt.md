# SpecKit - Technical Plan Generator

You are a **solutions architect**. Your role is to define HOW to build the system based on the constitution and specification.

## Mission

Generate a comprehensive technical architecture plan that defines the tech stack, components, database schema, API design, and implementation approach.

## Prerequisites

This skill requires:
- `.speckit/constitution.yml` (principles, standards)
- `.speckit/specification.md` (requirements, user stories)

**Step 1**: Read both files
```bash
cat .speckit/constitution.yml
cat .speckit/specification.md
```

## Technical Plan Structure

A plan defines:
1. **Architecture Overview** - High-level system design
2. **Tech Stack** - Specific technologies chosen
3. **Components** - System components and their responsibilities
4. **Database Schema** - Data model
5. **API Design** - Endpoints and contracts
6. **Security** - Authentication, authorization, data protection
7. **File Structure** - Code organization
8. **Implementation Approach** - How to build incrementally

## Output Format

Create file: `.speckit/plan.md`

```markdown
# Technical Plan: [Project Name]

**Version:** 1.0.0
**Date:** [ISO date]
**Based on:**
- Constitution: `.speckit/constitution.yml`
- Specification: `.speckit/specification.md`

---

## 1. Architecture Overview

### System Architecture
[Diagram or description of high-level architecture]

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend  │ ───> │   Backend    │ ───> │  Database   │
│  (Next.js)  │      │  (Supabase)  │      │ (Postgres)  │
└─────────────┘      └──────────────┘      └─────────────┘
       │                     │
       │                     ▼
       │             ┌──────────────┐
       └────────────>│  Auth System │
                     └──────────────┘
```

### Key Design Decisions
- **[Decision 1]:** [Rationale - based on constitution principles]
- **[Decision 2]:** [Rationale - based on requirements]
- **[Decision 3]:** [Rationale - based on constraints]

---

## 2. Tech Stack

### Frontend
- **Framework:** [e.g., Next.js 14]
- **Language:** [e.g., TypeScript]
- **Styling:** [e.g., Tailwind CSS]
- **State Management:** [e.g., React Context]
- **Forms:** [e.g., React Hook Form + Zod]
- **Testing:** [e.g., Vitest + Testing Library]

### Backend
- **Platform:** [e.g., Supabase]
- **Runtime:** [e.g., Edge Functions]
- **Database:** [e.g., PostgreSQL]
- **ORM:** [e.g., Drizzle or Supabase SDK]
- **Caching:** [e.g., Redis or built-in]

### Infrastructure
- **Hosting:** [e.g., Vercel]
- **Database Hosting:** [e.g., Supabase Cloud]
- **CDN:** [e.g., Vercel Edge Network]
- **Monitoring:** [e.g., Sentry]
- **Analytics:** [e.g., Vercel Analytics]

### Development Tools
- **Package Manager:** [e.g., pnpm]
- **Linting:** [e.g., ESLint]
- **Formatting:** [e.g., Prettier]
- **Type Checking:** [e.g., TypeScript strict]
- **Git Hooks:** [e.g., Husky]
- **CI/CD:** [e.g., GitHub Actions]

---

## 3. Components

### Frontend Components

#### 3.1 Pages
- **`/` (Home):** [Description]
- **`/auth/login`:** [Description]
- **`/auth/signup`:** [Description]
- **`/auth/reset-password`:** [Description]
- **`/dashboard`:** [Description] (protected)

#### 3.2 Shared Components
- **`AuthProvider`:** Global auth context
- **`ProtectedRoute`:** HOC for auth guard
- **`LoginForm`:** Login form with validation
- **`SignupForm`:** Signup form with validation
- **`PasswordResetForm`:** Password reset form

#### 3.3 Hooks
- **`useAuth()`:** Access auth state
- **`useUser()`:** Access current user
- **`useSession()`:** Manage session

### Backend Components

#### 3.4 API Routes (Next.js)
- **`/api/auth/signup`:** User registration
- **`/api/auth/login`:** User login
- **`/api/auth/logout`:** User logout
- **`/api/auth/session`:** Get session info
- **`/api/auth/reset-password`:** Password reset

#### 3.5 Edge Functions (Supabase)
- **`handle-oauth-callback`:** Process OAuth callbacks
- **`send-verification-email`:** Email verification
- **`validate-token`:** Token validation

#### 3.6 Database Functions
- **`create_user_profile`:** Trigger on user creation
- **`update_last_login`:** Update login timestamp

---

## 4. Database Schema

### Tables

#### 4.1 `auth.users` (Supabase managed)
```sql
-- Managed by Supabase Auth
-- Contains: id, email, encrypted_password, etc.
```

#### 4.2 `profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

#### 4.3 `sessions` (if custom session management)
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
```

### Triggers

```sql
-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_user();
```

---

## 5. API Design

### Authentication Endpoints

#### POST `/api/auth/signup`
**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123",
  "full_name": "John Doe"
}
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "message": "Verification email sent"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Email already registered"
}
```

#### POST `/api/auth/login`
**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "jwt...",
    "expires_at": 1234567890
  }
}
```

[... continue for all endpoints ...]

---

## 6. Security

### Authentication
- **Method:** JWT tokens in httpOnly cookies
- **Password Hashing:** bcrypt (Supabase default)
- **Session Duration:** 7 days
- **Token Refresh:** Automatic via Supabase SDK

### Authorization
- **Row Level Security (RLS):** All tables
- **API Validation:** Zod schemas
- **CSRF Protection:** Next.js built-in

### Data Protection
- **Encryption at Rest:** PostgreSQL encryption
- **Encryption in Transit:** HTTPS only
- **Secrets Management:** Environment variables
- **No secrets in code:** Enforced via pre-commit hooks

---

## 7. File Structure

```
project-root/
├── app/                      # Next.js App Router
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── reset-password/
│   │       └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── api/
│   │   └── auth/
│   │       ├── signup/
│   │       │   └── route.ts
│   │       ├── login/
│   │       │   └── route.ts
│   │       └── session/
│   │           └── route.ts
│   └── layout.tsx
│
├── components/               # Shared components
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   └── PasswordResetForm.tsx
│   └── ui/                  # UI primitives
│
├── lib/                     # Shared utilities
│   ├── supabase/
│   │   ├── client.ts        # Client-side Supabase
│   │   ├── server.ts        # Server-side Supabase
│   │   └── middleware.ts    # Auth middleware
│   ├── validations/
│   │   └── auth.ts          # Zod schemas
│   └── utils/
│
├── hooks/                   # React hooks
│   ├── useAuth.ts
│   ├── useUser.ts
│   └── useSession.ts
│
├── contexts/                # React contexts
│   └── AuthContext.tsx
│
├── types/                   # TypeScript types
│   ├── auth.ts
│   └── database.ts
│
└── tests/                   # Test files
    ├── unit/
    ├── integration/
    └── e2e/
```

---

## 8. Implementation Approach

### Phase 1: Foundation (Week 1)
**Goal:** Basic project setup and authentication infrastructure

1. **Setup Project**
   - Initialize Next.js with TypeScript
   - Configure Tailwind CSS
   - Setup ESLint + Prettier

2. **Setup Supabase**
   - Create Supabase project
   - Configure auth providers
   - Setup database schema

3. **Auth Context**
   - Create AuthProvider
   - Implement useAuth hook
   - Setup session management

### Phase 2: Core Auth Features (Week 2)
**Goal:** Implement signup, login, logout

4. **Signup Flow**
   - Build signup form
   - Implement validation
   - Email verification

5. **Login Flow**
   - Build login form
   - Implement validation
   - Session creation

6. **Logout**
   - Implement logout
   - Clear session

### Phase 3: Enhanced Features (Week 3)
**Goal:** OAuth, password reset, protected routes

7. **OAuth Providers**
   - Google OAuth
   - GitHub OAuth
   - Callback handling

8. **Password Reset**
   - Reset request flow
   - Email with reset link
   - Password update

9. **Protected Routes**
   - withAuth HOC
   - Redirect logic
   - Loading states

### Phase 4: Testing & Polish (Week 4)
**Goal:** Tests, error handling, edge cases

10. **Testing**
    - Unit tests (hooks, utilities)
    - Component tests (forms)
    - E2E tests (full flows)

11. **Error Handling**
    - Error boundaries
    - Toast notifications
    - Retry logic

12. **Polish**
    - Loading states
    - Skeleton screens
    - Accessibility

---

## 9. Performance Considerations

### Frontend
- **Code Splitting:** Next.js automatic
- **Image Optimization:** next/image
- **Font Optimization:** next/font
- **Bundle Size:** Monitor with bundle analyzer

### Backend
- **Database Indexing:** Indexes on frequently queried columns
- **Connection Pooling:** Supabase built-in
- **Caching:** Cache user sessions
- **Rate Limiting:** Protect API endpoints

---

## 10. Monitoring & Observability

### Metrics
- **Auth Success Rate:** % of successful logins
- **Signup Conversion:** % completing signup
- **Error Rate:** % of failed requests
- **Performance:** P95 response times

### Logging
- **Auth Events:** Login, logout, signup
- **Errors:** All errors logged
- **Security Events:** Failed login attempts

### Tools
- **Application:** Sentry for errors
- **Performance:** Vercel Analytics
- **Database:** Supabase logs

---

## Appendix

### Technology Rationale

**Why Next.js?**
- From constitution: "Next.js 14 App Router" standard
- Server-side rendering
- Built-in API routes
- Excellent DX

**Why Supabase?**
- From constitution: "Supabase for backend" standard
- Auth out of the box
- PostgreSQL + RLS
- Real-time capabilities

**Why Tailwind?**
- From constitution: "Tailwind CSS" standard
- Utility-first approach
- Rapid prototyping
- Consistent design

---

**Next Step:** Run `/speckit-tasks` to generate implementation tasks
```

## Instructions

1. **Read Constitution & Specification**
   ```bash
   cat .speckit/constitution.yml
   cat .speckit/specification.md
   ```

2. **Choose Tech Stack**
   - Use standards from constitution
   - Match to requirements from specification
   - Consider constraints (cost, performance, etc.)

3. **Design Architecture**
   - High-level system design
   - Component breakdown
   - Data flow

4. **Design Database Schema**
   - Tables and relationships
   - Indexes for performance
   - RLS policies for security

5. **Design API**
   - RESTful endpoints
   - Request/response formats
   - Error handling

6. **Plan Implementation**
   - Break into phases
   - Define milestones
   - Estimate timelines

7. **Create the File**
   ```bash
   # File: .speckit/plan.md
   ```

8. **Output Summary**
   ```
   ✅ Technical Plan created: .speckit/plan.md

   Tech Stack:
   - Frontend: [technologies]
   - Backend: [technologies]
   - Database: [technologies]

   Components: X defined
   API Endpoints: Y designed
   Database Tables: Z planned

   Implementation: [X weeks], [Y phases]

   Next Step: Run /speckit-tasks to generate user stories
   ```

## Important Notes

- **Follow Constitution**: Use tech standards from constitution
- **Technology-specific**: Unlike specification, this IS about HOW
- **Implementable**: Everything here should be directly actionable
- **Realistic**: Timelines and complexity should be achievable

---

**NOW**: Generate the technical plan.

Read `.speckit/constitution.yml` and `.speckit/specification.md`, then create `.speckit/plan.md`.
