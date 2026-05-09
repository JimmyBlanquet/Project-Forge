import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// Add an api_keys table to your DB if you want API key support.
// Store keys hashed (SHA-256), track last_used_at, support revocation.

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
        // Uncomment when api_keys table is created:
        // const keyHash = hashApiKey(apiKey);
        // const row = await prisma.apiKey.findFirst({
        //     where: { keyHash, revokedAt: null },
        //     select: { userId: true },
        // });
        // if (row) {
        //     await prisma.apiKey.update({ where: { keyHash }, data: { lastUsedAt: new Date() } });
        //     return { userId: row.userId, authMethod: 'api_key' };
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
