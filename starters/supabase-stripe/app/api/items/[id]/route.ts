import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/utils/db/db';
import { itemsTable } from '@/utils/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// --- Validation ---

const updateItemSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    status: z.enum(['draft', 'active', 'archived']).optional(),
    metadata: z.record(z.unknown()).optional(),
});

// --- Auth helper ---

async function getAuthUser() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return user;
}

// --- GET /api/items/[id] ---

export async function GET(
    _request: Request,
    { params }: { params: { id: string } }
) {
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [item] = await db
        .select()
        .from(itemsTable)
        .where(
            and(eq(itemsTable.id, params.id), eq(itemsTable.user_id, user.id))
        )
        .limit(1);

    if (!item) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(item);
}

// --- PATCH /api/items/[id] ---

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateItemSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { error: 'Validation failed', issues: parsed.error.issues },
            { status: 400 }
        );
    }

    const [updated] = await db
        .update(itemsTable)
        .set({ ...parsed.data, updated_at: new Date() })
        .where(
            and(eq(itemsTable.id, params.id), eq(itemsTable.user_id, user.id))
        )
        .returning();

    if (!updated) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
}

// --- DELETE /api/items/[id] ---

export async function DELETE(
    _request: Request,
    { params }: { params: { id: string } }
) {
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [deleted] = await db
        .delete(itemsTable)
        .where(
            and(eq(itemsTable.id, params.id), eq(itemsTable.user_id, user.id))
        )
        .returning();

    if (!deleted) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
}
