-- Rate Limiting Table for Persistent Rate Limiting
-- Stores request counts per user/action with automatic expiry

CREATE TABLE rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL,           -- Format: "action:userId" (e.g., "generation:uuid-123")
    count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    window_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_rate_limit_key UNIQUE (key)
);

-- Indexes for fast lookups
CREATE INDEX idx_rate_limits_key ON rate_limits (key);
CREATE INDEX idx_rate_limits_window_end ON rate_limits (window_end);

-- Function to increment rate limit counter atomically
CREATE OR REPLACE FUNCTION increment_rate_limit(
    p_key TEXT,
    p_max_requests INTEGER,
    p_window_seconds INTEGER
)
RETURNS TABLE (
    allowed BOOLEAN,
    remaining INTEGER,
    reset_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_now TIMESTAMPTZ := NOW();
    v_window_end TIMESTAMPTZ := v_now + (p_window_seconds || ' seconds')::INTERVAL;
    v_count INTEGER;
    v_reset_at TIMESTAMPTZ;
BEGIN
    -- Try to insert or update atomically
    INSERT INTO rate_limits (key, count, window_start, window_end, updated_at)
    VALUES (p_key, 1, v_now, v_window_end, v_now)
    ON CONFLICT (key) DO UPDATE
    SET
        -- Reset window if expired, otherwise increment
        count = CASE
            WHEN rate_limits.window_end < v_now THEN 1
            ELSE rate_limits.count + 1
        END,
        window_start = CASE
            WHEN rate_limits.window_end < v_now THEN v_now
            ELSE rate_limits.window_start
        END,
        window_end = CASE
            WHEN rate_limits.window_end < v_now THEN v_window_end
            ELSE rate_limits.window_end
        END,
        updated_at = v_now
    RETURNING rate_limits.count, rate_limits.window_end
    INTO v_count, v_reset_at;

    -- Return result
    RETURN QUERY SELECT
        v_count <= p_max_requests AS allowed,
        GREATEST(0, p_max_requests - v_count) AS remaining,
        v_reset_at AS reset_at;
END;
$$;

-- Function to cleanup expired rate limits (run periodically via CRON)
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM rate_limits
    WHERE window_end < NOW() - INTERVAL '5 minutes';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- RLS: No RLS needed as this is system-level data
-- Access controlled via service role key in CRON/API

COMMENT ON TABLE rate_limits IS 'Persistent rate limiting for API endpoints';
COMMENT ON FUNCTION increment_rate_limit IS 'Atomically check and increment rate limit counter';
COMMENT ON FUNCTION cleanup_expired_rate_limits IS 'Remove expired rate limit entries';
