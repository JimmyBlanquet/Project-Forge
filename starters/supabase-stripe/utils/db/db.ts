import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Pool tuning per environment:
// | Environment       | max | idle_timeout | prepare |
// |-------------------|-----|--------------|---------|
// | Development       | 10  | 30s          | true    |
// | Vercel serverless | 3   | 10s          | false   |
// | Shared VPS        | 5   | 20s          | false   |
// | Dedicated VPS     | 20  | 60s          | true    |
//
// prepare: false is required for Supabase Transaction Pool mode (port 6543).
// Adjust max/idle_timeout based on your infra to avoid connection exhaustion.
const client = postgres(process.env.DATABASE_URL!, {
    prepare: false,
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    idle_timeout: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '20', 10),
    connect_timeout: 10,
});
export const db = drizzle(client);
