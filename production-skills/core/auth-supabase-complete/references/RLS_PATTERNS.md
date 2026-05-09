# Row Level Security (RLS) Patterns for Supabase Auth

This guide covers common RLS patterns and SQL setup for Supabase authentication with the `auth-supabase-complete` skill.

## Table of Contents

1. [Database Schema Setup](#database-schema-setup)
2. [Basic RLS Policies](#basic-rls-policies)
3. [Admin Patterns](#admin-patterns)
4. [Multi-Tenant Patterns](#multi-tenant-patterns)
5. [Performance Optimization](#performance-optimization)
6. [Common Pitfalls](#common-pitfalls)

---

## Database Schema Setup

### 1. Profiles Table

The `profiles` table stores user profile information and is referenced by the skill's auth functions.

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_admin BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  email_notifications BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

### 2. Automatic Profile Creation Trigger

Automatically create a profile when a new user signs up:

```sql
-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (NEW.id, NEW.email, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3. Updated_at Trigger

Automatically update `updated_at` timestamp:

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on profiles update
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

---

## Basic RLS Policies

### 1. Read Own Profile

Allow users to read their own profile:

```sql
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);
```

### 2. Update Own Profile

Allow users to update their own profile (but not admin flags):

```sql
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  -- Prevent users from setting their own admin status
  AND (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = is_admin
    OR (SELECT is_admin FROM profiles WHERE id = auth.uid()) IS NULL
  )
);
```

### 3. Public Read for Verified Users

Allow reading profiles of verified users (for public profiles):

```sql
CREATE POLICY "Anyone can read verified profiles"
ON profiles FOR SELECT
USING (is_verified = true);
```

### 4. Insert Own Profile

Allow users to create their own profile (usually handled by trigger):

```sql
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);
```

---

## Admin Patterns

### 1. Admin Read All

Admins can read all profiles:

```sql
CREATE POLICY "Admins can read all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  )
);
```

### 2. Admin Update All

Admins can update any profile:

```sql
CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  )
);
```

### 3. Admin Delete Users

Admins can delete user profiles:

```sql
CREATE POLICY "Admins can delete profiles"
ON profiles FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  )
);
```

### 4. Role-Based Access Control (RBAC)

For more complex role systems:

```sql
-- Create roles table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  permissions JSONB DEFAULT '[]'::jsonb
);

-- Create user_roles junction table
CREATE TABLE user_roles (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own roles
CREATE POLICY "Users can read own roles"
ON user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Admins can manage all roles
CREATE POLICY "Admins can manage all roles"
ON user_roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  )
);

-- Helper function to check permissions
CREATE OR REPLACE FUNCTION has_permission(required_permission TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.permissions ? required_permission
  );
$$ LANGUAGE SQL SECURITY DEFINER;
```

---

## Multi-Tenant Patterns

### 1. Organizations Table

For multi-tenant SaaS applications:

```sql
-- Create organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create organization members table
CREATE TABLE organization_members (
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (organization_id, user_id)
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Policy: Members can read their organizations
CREATE POLICY "Members can read their organizations"
ON organizations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = organizations.id
    AND user_id = auth.uid()
  )
);

-- Policy: Only owners can delete organizations
CREATE POLICY "Owners can delete organizations"
ON organizations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = organizations.id
    AND user_id = auth.uid()
    AND role = 'owner'
  )
);

-- Policy: Users can read their own memberships
CREATE POLICY "Users can read own memberships"
ON organization_members FOR SELECT
USING (user_id = auth.uid());

-- Policy: Admins can manage members
CREATE POLICY "Admins can manage members"
ON organization_members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
);
```

### 2. Scoped Data Access

For data that belongs to organizations:

```sql
-- Create posts table (example)
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy: Organization members can read posts
CREATE POLICY "Organization members can read posts"
ON posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = posts.organization_id
    AND user_id = auth.uid()
  )
);

-- Policy: Organization members can create posts
CREATE POLICY "Organization members can create posts"
ON posts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = posts.organization_id
    AND user_id = auth.uid()
  )
  AND auth.uid() = author_id
);

-- Policy: Authors can update their own posts
CREATE POLICY "Authors can update own posts"
ON posts FOR UPDATE
USING (auth.uid() = author_id);

-- Policy: Authors and org admins can delete posts
CREATE POLICY "Authors and admins can delete posts"
ON posts FOR DELETE
USING (
  auth.uid() = author_id
  OR EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = posts.organization_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);
```

---

## Performance Optimization

### 1. Indexes for RLS Queries

Create indexes for columns used in RLS policies:

```sql
-- Index for admin checks
CREATE INDEX idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;

-- Index for organization membership lookups
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);

-- Composite index for role checks
CREATE INDEX idx_org_members_user_org_role
ON organization_members(user_id, organization_id, role);

-- Index for posts by organization
CREATE INDEX idx_posts_org_id ON posts(organization_id);
CREATE INDEX idx_posts_author_id ON posts(author_id);
```

### 2. Security Definer Functions

Use `SECURITY DEFINER` functions for expensive RLS checks:

```sql
-- Create a function to check if user is org admin
CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Use in RLS policy
CREATE POLICY "Org admins can manage settings"
ON organization_settings FOR ALL
USING (is_org_admin(organization_id));
```

### 3. Materialized Views for Complex Queries

For expensive queries, use materialized views:

```sql
-- Create materialized view for user permissions
CREATE MATERIALIZED VIEW user_permissions AS
SELECT
  ur.user_id,
  r.name as role_name,
  r.permissions
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id;

-- Create unique index for fast lookups
CREATE UNIQUE INDEX idx_user_permissions_user_id
ON user_permissions(user_id, role_name);

-- Refresh materialized view (run periodically or on role changes)
REFRESH MATERIALIZED VIEW CONCURRENTLY user_permissions;
```

### 4. Avoid N+1 Queries in Policies

Bad (causes N+1 queries):

```sql
-- DON'T DO THIS
CREATE POLICY "bad_policy"
ON posts FOR SELECT
USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);
```

Good (single query):

```sql
-- DO THIS
CREATE POLICY "good_policy"
ON posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  )
);
```

---

## Common Pitfalls

### 1. Circular RLS Dependencies

**Problem:** RLS policies that reference each other can cause infinite loops.

```sql
-- BAD: Circular dependency
CREATE POLICY "users_read_profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    JOIN profiles p ON p.id = om.user_id  -- This references profiles!
    WHERE om.organization_id = profiles.organization_id
  )
);
```

**Solution:** Use `SECURITY DEFINER` functions or simplify policies.

### 2. Forgetting to Enable RLS

**Problem:** Table created but RLS not enabled - data is publicly accessible!

```sql
-- Always check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Enable RLS on all tables
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### 3. Service Role Bypasses RLS

**Problem:** Using service role key bypasses all RLS policies.

**Solution:** Only use `createServiceClient()` for admin operations that should bypass RLS. Use `createClient()` or `createRouteHandlerClient()` for user operations.

```typescript
// ❌ BAD: Using service role for user operations
const serviceClient = createServiceClient(config)
const { data } = await serviceClient.from('posts').select('*')

// ✅ GOOD: Using authenticated client
const { user, supabase } = await requireAuth(config, request)
const { data } = await supabase.from('posts').select('*')
```

### 4. Not Testing RLS Policies

**Problem:** RLS policies are complex and easy to get wrong.

**Solution:** Write tests for RLS policies:

```sql
-- Test as regular user
SET request.jwt.claims.sub = 'user-id-here';

-- Test queries
SELECT * FROM profiles WHERE id = 'other-user-id';  -- Should return empty

-- Test as admin
UPDATE profiles SET is_admin = true WHERE id = 'user-id-here';

-- Test admin queries
SELECT * FROM profiles;  -- Should return all profiles
```

### 5. Overly Permissive Policies

**Problem:** Policies that grant too much access.

```sql
-- ❌ BAD: Too permissive
CREATE POLICY "anyone_can_read"
ON sensitive_data FOR SELECT
USING (true);  -- Everyone can read everything!

-- ✅ GOOD: Restrictive
CREATE POLICY "owner_can_read"
ON sensitive_data FOR SELECT
USING (auth.uid() = owner_id);
```

---

## Testing RLS Policies

### Manual Testing

```sql
-- Test as specific user
SET request.jwt.claims.sub = 'user-uuid-here';

-- Run queries to verify permissions
SELECT * FROM profiles;
INSERT INTO profiles (id, email) VALUES (auth.uid(), 'test@example.com');
UPDATE profiles SET display_name = 'Test' WHERE id = auth.uid();
DELETE FROM profiles WHERE id = auth.uid();

-- Reset to superuser
RESET request.jwt.claims.sub;
```

### Automated Testing

Use Supabase's testing framework or write integration tests:

```typescript
import { createClient } from '@supabase/supabase-js'

describe('RLS Policies', () => {
  it('should allow users to read own profile', async () => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Sign in as user
    await supabase.auth.signInWithPassword({ email, password })

    // Try to read own profile
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    expect(error).toBeNull()
    expect(data).toBeDefined()
  })

  it('should not allow users to read other profiles', async () => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    await supabase.auth.signInWithPassword({ email, password })

    // Try to read other user's profile
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', otherUserId)
      .single()

    expect(data).toBeNull()
    expect(error).toBeDefined()
  })
})
```

---

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)

---

**Last Updated:** 2026-01-16
**Compatible with:** auth-supabase-complete v1.0.0
