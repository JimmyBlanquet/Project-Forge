import { PrismaClient } from '@prisma/client';

// Pool tuning for Prisma + Neon PostgreSQL:
// | Environment       | connection_limit | pool_timeout |
// |-------------------|-----------------|--------------|
// | Development       | 10              | 10s          |
// | Vercel serverless | 3               | 10s          |
// | Shared VPS        | 5               | 15s          |
// | Dedicated VPS     | 20              | 30s          |
//
// Set via DATABASE_URL query params: ?connection_limit=5&pool_timeout=15
// Or configure in prisma/schema.prisma datasource block.

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
