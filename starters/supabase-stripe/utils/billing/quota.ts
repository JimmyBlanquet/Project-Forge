import { db } from '@/utils/db/db';
import { usersTable } from '@/utils/db/schema';
import { eq } from 'drizzle-orm';

// Plan limits — adapt units to your domain (minutes, API calls, tokens, etc.)
const PLAN_LIMITS: Record<string, number> = {
    free: 100,
    pro: 5000,
    enterprise: 50000,
};

// TODO: Add this table to your schema:
//
// export const usagePeriodsTable = pgTable('usage_periods', {
//     id: uuid('id').primaryKey().defaultRandom(),
//     user_id: text('user_id').notNull().references(() => usersTable.id),
//     period_start: timestamp('period_start', { withTimezone: true }).notNull(),
//     period_end: timestamp('period_end', { withTimezone: true }).notNull(),
//     units_used: integer('units_used').notNull().default(0),
//     created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
// });

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
    const [user] = await db
        .select({ plan_name: usersTable.plan_name })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

    const planName = user?.plan_name ?? 'free';
    const unitsLimit = PLAN_LIMITS[planName] ?? PLAN_LIMITS.free;
    const { start, end } = getCurrentMonthPeriod();

    // TODO: Replace with actual DB query when usage_periods table exists:
    // const [period] = await db
    //     .select({ units_used: usagePeriodsTable.units_used })
    //     .from(usagePeriodsTable)
    //     .where(and(
    //         eq(usagePeriodsTable.user_id, userId),
    //         eq(usagePeriodsTable.period_start, start),
    //     ))
    //     .limit(1);
    // const unitsUsed = period?.units_used ?? 0;

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
    // TODO: Implement when usage_periods table exists:
    // const { start } = getCurrentMonthPeriod();
    // await db
    //     .insert(usagePeriodsTable)
    //     .values({ user_id: userId, period_start: start, period_end: end, units_used: units })
    //     .onConflictDoUpdate({
    //         target: [usagePeriodsTable.user_id, usagePeriodsTable.period_start],
    //         set: { units_used: sql`${usagePeriodsTable.units_used} + ${units}` },
    //     });
}
