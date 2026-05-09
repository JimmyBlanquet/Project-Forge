import { createClient } from '@/utils/supabase/server';
import { db } from '@/utils/db/db';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Add this table to your schema if you want API key support:
//
// export const apiKeysTable = pgTable('api_keys', {
//     id: uuid('id').primaryKey().defaultRandom(),
//     user_id: text('user_id').notNull().references(() => usersTable.id),
//     key_hash: text('key_hash').notNull(),
//     name: text('name').notNull(),
//     last_used_at: timestamp('last_used_at', { withTimezone: true }),
//     revoked_at: timestamp('revoked_at', { withTimezone: true }),
//     created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
// });

export type AuthResult = {
    userId: string;
    authMethod: 'session' | 'api_key';
};

function hashApiKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
}

export async function authenticateRequest(
    request: Request
): Promise<AuthResult | null> {
    // 1. Try API key from X-API-Key header
    const apiKey = request.headers.get('x-api-key');
    if (apiKey) {
        const keyHash = hashApiKey(apiKey);
        // Uncomment when api_keys table is created:
        // const [row] = await db
        //     .select({ user_id: apiKeysTable.user_id })
        //     .from(apiKeysTable)
        //     .where(eq(apiKeysTable.key_hash, keyHash))
        //     .where(isNull(apiKeysTable.revoked_at))
        //     .limit(1);
        // if (row) {
        //     await db.update(apiKeysTable)
        //         .set({ last_used_at: new Date() })
        //         .where(eq(apiKeysTable.key_hash, keyHash));
        //     return { userId: row.user_id, authMethod: 'api_key' };
        // }
        return null;
    }

    // 2. Fallback to Supabase session
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (user) {
        return { userId: user.id, authMethod: 'session' };
    }

    return null;
}
