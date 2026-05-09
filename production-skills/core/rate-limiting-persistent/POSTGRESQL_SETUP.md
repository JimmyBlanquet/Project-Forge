# PostgreSQL Setup for Persistent Rate Limiting

This guide shows how to set up the PostgreSQL function required for persistent rate limiting with Supabase.

## Overview

The rate limiting system uses a PostgreSQL function `increment_rate_limit` to atomically check and increment rate limit counters. This ensures:

- **Race-condition free**: Multiple concurrent requests are handled correctly
- **Persistence**: Limits survive server restarts and cold starts
- **Multi-instance safe**: Works across multiple server instances
- **Automatic cleanup**: Expired entries are automatically removed

## Prerequisites

- PostgreSQL 12+ or Supabase project
- Access to run SQL migrations
- Basic understanding of PostgreSQL functions

## Database Schema

### 1. Create the Rate Limits Table

First, create a table to store rate limit data:

```sql
-- Create rate_limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on reset_at for efficient cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON rate_limits(reset_at);

-- Enable Row Level Security (RLS) if using Supabase
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to access
CREATE POLICY "Service role can manage rate limits"
  ON rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### 2. Create the Increment Function

Create the atomic increment function:

```sql
-- Drop existing function if it exists
DROP FUNCTION IF EXISTS increment_rate_limit(TEXT, INTEGER, INTEGER);

-- Create the increment_rate_limit function
CREATE OR REPLACE FUNCTION increment_rate_limit(
  p_key TEXT,
  p_max_requests INTEGER,
  p_window_seconds INTEGER
)
RETURNS TABLE(
  allowed BOOLEAN,
  remaining INTEGER,
  reset_at TIMESTAMPTZ
) AS $$
DECLARE
  v_count INTEGER;
  v_reset_at TIMESTAMPTZ;
  v_now TIMESTAMPTZ := NOW();
  v_window_end TIMESTAMPTZ := v_now + (p_window_seconds || ' seconds')::INTERVAL;
BEGIN
  -- Try to get existing entry
  SELECT count, rate_limits.reset_at
  INTO v_count, v_reset_at
  FROM rate_limits
  WHERE key = p_key
  FOR UPDATE; -- Lock the row

  -- Check if entry exists and window is still active
  IF v_count IS NOT NULL AND v_reset_at > v_now THEN
    -- Window still active, increment counter
    UPDATE rate_limits
    SET count = count + 1,
        updated_at = v_now
    WHERE key = p_key;

    v_count := v_count + 1;

    -- Check if limit exceeded
    IF v_count > p_max_requests THEN
      RETURN QUERY SELECT FALSE, 0, v_reset_at;
    ELSE
      RETURN QUERY SELECT TRUE, p_max_requests - v_count, v_reset_at;
    END IF;
  ELSE
    -- No entry or window expired, create/reset entry
    INSERT INTO rate_limits (key, count, reset_at, updated_at)
    VALUES (p_key, 1, v_window_end, v_now)
    ON CONFLICT (key)
    DO UPDATE SET
      count = 1,
      reset_at = v_window_end,
      updated_at = v_now;

    RETURN QUERY SELECT TRUE, p_max_requests - 1, v_window_end;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

### 3. Create Cleanup Function (Optional)

Add a function to clean up expired entries:

```sql
-- Create cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM rate_limits
  WHERE reset_at < NOW() - INTERVAL '1 hour';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup (if using pg_cron)
-- SELECT cron.schedule('cleanup-rate-limits', '0 * * * *', 'SELECT cleanup_expired_rate_limits()');
```

## Supabase Setup

If you're using Supabase, follow these steps:

### 1. Run SQL in Supabase Dashboard

1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the table creation, function creation, and cleanup function SQL
5. Click **Run**

### 2. Verify Installation

Run this test query to verify the function works:

```sql
-- Test the function
SELECT * FROM increment_rate_limit('test:user123', 10, 60);

-- Should return something like:
-- allowed | remaining | reset_at
-- --------|-----------|-------------------------
-- true    | 9         | 2026-01-16 21:30:00+00
```

### 3. Configure RLS (Row Level Security)

If you need user-level access (not recommended for rate limiting):

```sql
-- Allow authenticated users to check their own rate limits
CREATE POLICY "Users can check their own rate limits"
  ON rate_limits
  FOR SELECT
  TO authenticated
  USING (key LIKE auth.uid()::text || ':%');
```

**Note**: Typically, rate limiting should only be accessible by your API backend (service role), not directly by users.

## Using with TypeScript/JavaScript

After setting up PostgreSQL, configure your application:

```typescript
import { createClient } from '@supabase/supabase-js'
import { configureRateLimitStorage, SupabaseRateLimitProvider } from '@project-forge/rate-limiting-persistent'

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY! // Or SERVICE_ROLE_KEY for backend
)

// Configure rate limiting
const provider = new SupabaseRateLimitProvider(supabase)
configureRateLimitStorage(provider)

// Now you can use rate limiting
import { checkRateLimit } from '@project-forge/rate-limiting-persistent'

const result = await checkRateLimit('user123', {
  action: 'api_call',
  maxRequests: 100,
  windowSeconds: 3600
})

if (!result.allowed) {
  // Rate limit exceeded
  console.log('Rate limited! Try again in', Math.ceil((result.resetAt - Date.now()) / 1000), 'seconds')
}
```

## Monitoring and Debugging

### Check Current Rate Limits

```sql
-- View all active rate limits
SELECT
  key,
  count,
  reset_at,
  EXTRACT(EPOCH FROM (reset_at - NOW())) AS seconds_until_reset
FROM rate_limits
WHERE reset_at > NOW()
ORDER BY reset_at DESC;
```

### Check Specific User

```sql
-- Check rate limits for a specific user
SELECT * FROM rate_limits
WHERE key LIKE 'user123:%'
  AND reset_at > NOW();
```

### Manual Cleanup

```sql
-- Manually remove expired entries
DELETE FROM rate_limits
WHERE reset_at < NOW();
```

### Reset Specific User Rate Limit

```sql
-- Reset rate limit for a specific user/action
DELETE FROM rate_limits
WHERE key = 'api_call:user123';
```

## Performance Considerations

### Indexes

The `reset_at` index is critical for cleanup performance:

```sql
-- Verify index exists
SELECT * FROM pg_indexes
WHERE tablename = 'rate_limits';
```

### Connection Pooling

For high-traffic applications, use connection pooling:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for backend
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: false, // Disable session for backend
    },
  }
)
```

### Monitoring Query Performance

```sql
-- Enable query logging
ALTER DATABASE your_database SET log_min_duration_statement = 100;

-- Check slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
WHERE query LIKE '%increment_rate_limit%'
ORDER BY mean_time DESC;
```

## Troubleshooting

### Function Not Found

```
ERROR: function increment_rate_limit(text, integer, integer) does not exist
```

**Solution**: Run the CREATE FUNCTION SQL again.

### Permission Denied

```
ERROR: permission denied for table rate_limits
```

**Solution**: Check RLS policies or use service role key instead of anon key.

### Deadlocks

```
ERROR: deadlock detected
```

**Solution**: This is rare with proper FOR UPDATE locking, but if it occurs:
- Review concurrent access patterns
- Consider using advisory locks
- Check for long-running transactions

## Migration from In-Memory

If you're currently using in-memory rate limiting:

1. Install the PostgreSQL function (above)
2. Configure the provider in your app startup:
   ```typescript
   configureRateLimitStorage(new SupabaseRateLimitProvider(supabase))
   ```
3. Deploy your application
4. The system will automatically use PostgreSQL with in-memory fallback

No code changes needed in your API routes!

## Security Best Practices

1. **Use Service Role Key**: For backend rate limiting, use `SUPABASE_SERVICE_ROLE_KEY`, not anon key
2. **Enable RLS**: Always enable Row Level Security on the rate_limits table
3. **Limit Direct Access**: Don't expose the rate_limits table directly to users
4. **Monitor Unusual Patterns**: Set up alerts for abnormal rate limit hits
5. **Regular Cleanup**: Schedule cleanup to prevent table bloat

## Further Reading

- [Supabase Functions Documentation](https://supabase.com/docs/guides/database/functions)
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)
