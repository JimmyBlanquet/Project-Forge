# Neon PostgreSQL + Prisma ORM Skill

## Objective

Set up Neon serverless PostgreSQL with Prisma ORM for type-safe database access with:
- Neon database connection
- Prisma schema definition
- Database migrations
- Type-safe queries
- Prisma Studio for database management

## Prerequisites

1. ✅ Neon account created (https://neon.tech)
2. ✅ Database project created
3. ✅ Connection string obtained

## Implementation Steps

### Step 1: Install Dependencies

```bash
pnpm add @prisma/client
pnpm add -D prisma
```

### Step 2: Initialize Prisma

```bash
pnpm prisma init
```

This creates:
- `prisma/schema.prisma`
- `.env` with DATABASE_URL

### Step 3: Configure Prisma Schema

**File: `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider     = "postgresql"
  url          = env("DATABASE_URL")
}

// Example: User model
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now()) @map(name: "created_at")
  updatedAt DateTime @default(now()) @map(name: "updated_at")

  @@map(name: "users")
}
```

**Key Prisma features:**
- `@id @default(cuid())` - Auto-generated ID
- `@unique` - Unique constraint
- `@map(name: "...")` - Custom column name
- `@@map(name: "...")` - Custom table name
- Relations: `@relation`, `@default(now())`

### Step 4: Create Prisma Client Singleton

**File: `lib/db.ts`**

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Why singleton pattern?**
- Prevents multiple Prisma instances in development
- Hot reload in Next.js doesn't create new connections
- Production: single instance

### Step 5: Environment Variables

Add to `.env.local`:

```env
# Neon PostgreSQL
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/database?sslmode=require"
```

Get connection string from:
1. Neon Dashboard → Your project → Connection Details
2. Copy "Pooled connection" string

### Step 6: Generate Prisma Client

```bash
pnpm prisma generate
```

This creates TypeScript types in `node_modules/.prisma/client`.

### Step 7: Run Database Migration

**Option A: Push schema (development)**

```bash
pnpm prisma db push
```

Good for rapid prototyping.

**Option B: Create migration (production)**

```bash
pnpm prisma migrate dev --name init
```

Creates migration file in `prisma/migrations/`.

### Step 8: Add Postinstall Script

Add to `package.json`:

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

Ensures Prisma client is generated after `pnpm install`.

## Usage Patterns

### Query Examples

```typescript
import { prisma } from "@/lib/db";

// Find unique
const user = await prisma.user.findUnique({
  where: { id: "123" },
});

// Find many with filter
const users = await prisma.user.findMany({
  where: { email: { contains: "@gmail.com" } },
  orderBy: { createdAt: "desc" },
  take: 10,
});

// Create
const newUser = await prisma.user.create({
  data: {
    email: "user@example.com",
    name: "John Doe",
  },
});

// Update
const updatedUser = await prisma.user.update({
  where: { id: "123" },
  data: { name: "Jane Doe" },
});

// Delete
await prisma.user.delete({
  where: { id: "123" },
});

// Count
const count = await prisma.user.count();
```

### Relations Example

```prisma
model User {
  id    String @id @default(cuid())
  posts Post[]
}

model Post {
  id       String @id @default(cuid())
  title    String
  authorId String
  author   User   @relation(fields: [authorId], references: [id])

  @@index([authorId])
}
```

Query with relations:

```typescript
const userWithPosts = await prisma.user.findUnique({
  where: { id: "123" },
  include: { posts: true },
});
```

## Neon Setup Guide

### 1. Create Neon Account

1. Go to https://neon.tech
2. Sign up (free tier available)
3. Create new project

### 2. Get Connection String

1. Dashboard → Your project
2. Connection Details tab
3. Copy "Pooled connection" string
4. Add to `.env.local`

### 3. Neon Features

**Scale to zero:**
- Database auto-pauses when inactive
- Resumes in <500ms on query
- Huge cost savings

**Instant branching:**
```bash
# Create branch for feature dev
neon branches create --name feature-xyz

# Each branch has own connection string
# Perfect for testing migrations
```

**Automatic backups:**
- Point-in-time restore
- 7-day retention on free tier

## Prisma Studio

Visual database editor:

```bash
pnpm prisma studio
```

Opens http://localhost:5555

Features:
- Browse all tables
- Edit data visually
- Filter and search
- No SQL required

## Common Prisma Commands

```bash
# Generate client (after schema changes)
pnpm prisma generate

# Push schema to DB (dev)
pnpm prisma db push

# Create migration (prod)
pnpm prisma migrate dev --name add_user_role

# Apply migrations (prod)
pnpm prisma migrate deploy

# Reset database (WARNING: deletes all data)
pnpm prisma migrate reset

# Open Prisma Studio
pnpm prisma studio

# Pull schema from existing DB
pnpm prisma db pull

# Format schema file
pnpm prisma format
```

## Quality Gates

Before marking this skill as complete, verify:

1. ✅ **Schema Valid**: `pnpm prisma validate` passes
2. ✅ **Client Generated**: `pnpm prisma generate` succeeds
3. ✅ **Migration Applied**: `pnpm prisma db push` or `migrate dev` succeeds
4. ✅ **Connection Works**: Can query database from code
5. ✅ **TypeScript Types**: Autocomplete works for `prisma.user.findUnique()`

## Common Issues

### Issue: "Can't reach database server"

**Solution**:
- Check DATABASE_URL in `.env.local`
- Ensure `?sslmode=require` is in connection string
- Verify Neon project is active (not paused)

### Issue: "Environment variable not found: DATABASE_URL"

**Solution**:
- Restart Next.js dev server
- Ensure `.env.local` exists in project root

### Issue: "Type 'PrismaClient' is not assignable"

**Solution**:
- Run `pnpm prisma generate`
- Restart TypeScript server

## Migration Best Practices

**Development:**
```bash
# Iterate quickly with push
pnpm prisma db push
```

**Production:**
```bash
# Create named migrations
pnpm prisma migrate dev --name add_user_email_verified

# Deploy to production
pnpm prisma migrate deploy
```

**Team workflow:**
1. Create migration locally
2. Commit migration files to git
3. Team members run `pnpm prisma migrate dev`
4. Production runs `pnpm prisma migrate deploy`

## Testing Checklist

- [ ] Prisma schema validates
- [ ] Prisma client generates
- [ ] Database connection works
- [ ] Can create records
- [ ] Can query records
- [ ] Migrations apply successfully
- [ ] Prisma Studio opens

## References

- Prisma Docs: https://www.prisma.io/docs
- Neon Docs: https://neon.tech/docs
- Prisma Schema Reference: https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference
- Prisma Client API: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference
