# Auth.js v5 Integration Skill

## Objective

Implement complete Auth.js v5 authentication with:
- OAuth providers (Google, Resend magic link)
- Prisma database adapter
- Role-based access control (RBAC)
- JWT session strategy
- Protected routes via middleware

## Prerequisites

Before using this skill, ensure:
1. ✅ Prisma is configured with PostgreSQL database
2. ✅ User model exists in Prisma schema (will be extended)
3. ✅ Next.js 14+ with App Router

## Implementation Steps

### Step 1: Install Dependencies

```bash
pnpm add next-auth@5.0.0-beta.19 @auth/prisma-adapter
```

### Step 2: Extend Prisma Schema

Add to `prisma/schema.prisma`:

```prisma
enum UserRole {
  ADMIN
  USER
}

model Account {
  id                String   @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?  @db.Text
  access_token      String?  @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?  @db.Text
  session_state     String?
  createdAt         DateTime @default(now()) @map(name: "created_at")
  updatedAt         DateTime @default(now()) @map(name: "updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
  @@map(name: "accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map(name: "sessions")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now()) @map(name: "created_at")
  updatedAt     DateTime  @default(now()) @map(name: "updated_at")
  role          UserRole  @default(USER)

  accounts Account[]
  sessions Session[]

  @@map(name: "users")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map(name: "verification_tokens")
}
```

**Important notes:**
- If User model already exists, merge fields (don't replace)
- Add `role` field and `accounts`/`sessions` relations
- Keep existing User fields

Run migration:
```bash
pnpm prisma db push
# or
pnpm prisma migrate dev --name add_auth_models
```

### Step 3: Create Auth Configuration Files

**File: `auth.config.ts`** (root directory)

```typescript
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";

import { env } from "@/env.mjs";
import { sendVerificationRequest } from "@/lib/email";

export default {
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    Resend({
      apiKey: env.RESEND_API_KEY,
      from: env.EMAIL_FROM,
      // Uncomment if using custom email template:
      // sendVerificationRequest,
    }),
  ],
} satisfies NextAuthConfig;
```

**File: `auth.ts`** (root directory)

```typescript
import authConfig from "@/auth.config";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { UserRole } from "@prisma/client";
import NextAuth, { type DefaultSession } from "next-auth";

import { prisma } from "@/lib/db";
import { getUserById } from "@/lib/user";

// TypeScript module augmentation for session
declare module "next-auth" {
  interface Session {
    user: {
      role: UserRole;
    } & DefaultSession["user"];
  }
}

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ token, session }) {
      if (session.user) {
        if (token.sub) {
          session.user.id = token.sub;
        }

        if (token.email) {
          session.user.email = token.email;
        }

        if (token.role) {
          session.user.role = token.role;
        }

        session.user.name = token.name;
        session.user.image = token.picture;
      }

      return session;
    },

    async jwt({ token }) {
      if (!token.sub) return token;

      const dbUser = await getUserById(token.sub);

      if (!dbUser) return token;

      token.name = dbUser.name;
      token.email = dbUser.email;
      token.picture = dbUser.image;
      token.role = dbUser.role;

      return token;
    },
  },
  ...authConfig,
});
```

### Step 4: Create Helper Functions

**File: `lib/user.ts`**

```typescript
import { prisma } from "@/lib/db";

export async function getUserById(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return user;
  } catch {
    return null;
  }
}

export async function getUserByEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user;
  } catch {
    return null;
  }
}
```

**File: `lib/session.ts`**

```typescript
import { auth } from "@/auth";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}
```

### Step 5: Setup Middleware for Protected Routes

**File: `middleware.ts`** (root directory)

```typescript
export { auth as middleware } from "@/auth";
```

**Optional: Configure matcher** (add to middleware.ts):

```typescript
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/protected/:path*",
  ],
};
```

### Step 6: Create API Route Handlers

**File: `app/api/auth/[...nextauth]/route.ts`**

```typescript
export { GET, POST } from "@/auth";
```

### Step 7: Environment Variables

Add to `.env.local`:

```env
# Auth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# OAuth Providers
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Resend (for magic links)
RESEND_API_KEY=""
EMAIL_FROM="noreply@yourdomain.com"
```

Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### Step 8: Create Login Page (Example)

**File: `app/(auth)/login/page.tsx`**

```typescript
import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <div>
      <h1>Sign In</h1>
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/dashboard" });
        }}
      >
        <button type="submit">Sign in with Google</button>
      </form>
    </div>
  );
}
```

## Usage Patterns

### Server Component (Check Auth)

```typescript
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Access user role
  const isAdmin = session.user.role === "ADMIN";

  return <div>Welcome {session.user.name}</div>;
}
```

### Server Action (Require Role)

```typescript
"use server";

import { auth } from "@/auth";

export async function adminAction() {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  // Admin-only logic
}
```

### Client Component (Session Provider)

```typescript
"use client";

import { SessionProvider } from "next-auth/react";

export default function Providers({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

## Quality Gates

Before marking this skill as complete, verify:

1. ✅ **TypeScript Check**: `pnpm tsc --noEmit` passes
2. ✅ **Build**: `pnpm build` succeeds without auth errors
3. ✅ **Database**: Prisma schema includes Account, Session, User, VerificationToken
4. ✅ **Session Type**: TypeScript recognizes `session.user.role`
5. ✅ **OAuth Config**: Google OAuth app created with correct redirect URI
6. ✅ **Environment**: All required env vars set in `.env.local`

## Common Issues

### Issue: "Module not found: @/auth"

**Solution**: Ensure `auth.ts` is in root directory and `tsconfig.json` has path alias configured.

### Issue: "Provider 'google' is not configured"

**Solution**: Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env.local`.

### Issue: Middleware redirecting all routes

**Solution**: Add matcher config to limit middleware scope.

## OAuth Setup Guides

### Google OAuth

1. Go to https://console.cloud.google.com/
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. For production: `https://yourdomain.com/api/auth/callback/google`

## Testing Checklist

- [ ] User can sign in with Google OAuth
- [ ] User can sign in with magic link (if Resend configured)
- [ ] Session persists across page refreshes
- [ ] Protected routes redirect to login when not authenticated
- [ ] Admin-only routes check user role correctly
- [ ] Sign out works and clears session

## References

- Auth.js v5 Docs: https://authjs.dev
- Prisma Adapter: https://authjs.dev/reference/adapter/prisma
- Next.js Middleware: https://nextjs.org/docs/app/building-your-application/routing/middleware
