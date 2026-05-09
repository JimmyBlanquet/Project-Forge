import { createClient } from '@/utils/supabase/server';
import { db } from '@/utils/db/db';
import { itemsTable } from '@/utils/db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { withErrorHandler, apiSuccess, apiError } from '@/utils/api/error-handler';
import { rateLimit, getClientIp } from '@/utils/api/rate-limit';

// --- Validation ---

const createItemSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    status: z.enum(['draft', 'active', 'archived']).optional(),
    metadata: z.record(z.unknown()).optional(),
});

// --- GET /api/items ---

export const GET = withErrorHandler(async () => {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return apiError('UNAUTHORIZED');
    }

    const items = await db
        .select()
        .from(itemsTable)
        .where(eq(itemsTable.user_id, user.id))
        .orderBy(desc(itemsTable.created_at));

    return apiSuccess(items);
});

// --- POST /api/items ---

export const POST = withErrorHandler(async (request) => {
    const ip = getClientIp(request);
    const limit = rateLimit(`items:post:${ip}`, { maxRequests: 20, windowMs: 60_000 });
    if (!limit.success) {
        return apiError('RATE_LIMITED', undefined, { 'Retry-After': String(limit.retryAfter) });
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return apiError('UNAUTHORIZED');
    }

    const body = await request.json();
    const parsed = createItemSchema.safeParse(body);

    if (!parsed.success) {
        return apiError('VALIDATION_ERROR');
    }

    const [item] = await db
        .insert(itemsTable)
        .values({
            user_id: user.id,
            ...parsed.data,
        })
        .returning();

    return apiSuccess(item, 201);
});
