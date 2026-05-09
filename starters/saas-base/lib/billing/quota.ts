import { prisma } from '@/lib/db';

// Plan limits — adapt units to your domain (minutes, API calls, tokens, etc.)
const PLAN_LIMITS: Record<string, number> = {
    free: 100,
    pro: 5000,
    enterprise: 50000,
};

// TODO: Add this model to your Prisma schema:
//
// model UsagePeriod {
//     id          String   @id @default(uuid())
//     userId      String
//     periodStart DateTime
//     periodEnd   DateTime
//     unitsUsed   Int      @default(0)
//     createdAt   DateTime @default(now())
//     user        User     @relation(fields: [userId], references: [id])
//     @@unique([userId, periodStart])
// }

export type QuotaInfo = {
    unitsUsed: number;
    unitsLimit: number;
    planName: string;
    periodStart: Date;
    periodEnd: Date;
    remaining: number;
    isExceeded: boolean;
};

function getCurrentMonthPeriod(): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
}

export async function checkQuota(userId: string): Promise<QuotaInfo> {
    // Get user plan
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { stripePriceId: true },
    });

    // Map Stripe price to plan name — adapt to your pricing
    const planName = user?.stripePriceId ? 'pro' : 'free';
    const unitsLimit = PLAN_LIMITS[planName] ?? PLAN_LIMITS.free;
    const { start, end } = getCurrentMonthPeriod();

    // TODO: Replace with actual DB query when UsagePeriod model exists:
    // const period = await prisma.usagePeriod.findUnique({
    //     where: { userId_periodStart: { userId, periodStart: start } },
    // });
    // const unitsUsed = period?.unitsUsed ?? 0;

    const unitsUsed = 0; // Placeholder

    return {
        unitsUsed,
        unitsLimit,
        planName,
        periodStart: start,
        periodEnd: end,
        remaining: Math.max(0, unitsLimit - unitsUsed),
        isExceeded: unitsUsed >= unitsLimit,
    };
}

// Call this after each billable action to increment usage.
export async function incrementUsage(
    _userId: string,
    _units: number = 1
): Promise<void> {
    // TODO: Implement when UsagePeriod model exists:
    // await prisma.usagePeriod.upsert({
    //     where: { userId_periodStart: { userId, periodStart: start } },
    //     create: { userId, periodStart: start, periodEnd: end, unitsUsed: units },
    //     update: { unitsUsed: { increment: units } },
    // });
}
