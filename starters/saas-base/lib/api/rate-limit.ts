const store = new Map<string, { count: number; resetAt: number }>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
        if (entry.resetAt < now) store.delete(key);
    }
}, 5 * 60 * 1000);

export function rateLimit(
    identifier: string,
    { maxRequests = 10, windowMs = 60_000 } = {}
): { success: boolean; retryAfter?: number } {
    const now = Date.now();
    const entry = store.get(identifier);

    if (!entry || entry.resetAt < now) {
        store.set(identifier, { count: 1, resetAt: now + windowMs });
        return { success: true };
    }

    if (entry.count >= maxRequests) {
        return {
            success: false,
            retryAfter: Math.ceil((entry.resetAt - now) / 1000),
        };
    }

    entry.count++;
    return { success: true };
}

export function getClientIp(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    const real = request.headers.get('x-real-ip');
    if (real) return real;
    return '127.0.0.1';
}
