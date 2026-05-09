import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- Users -------------------------------------------------------------------

export const usersTable = pgTable('users_table', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    plan: text('plan').notNull(),
    plan_name: text('plan_name').default('free'),
    stripe_id: text('stripe_id').notNull(),
    metadata: jsonb('metadata').default({}),
});

export const usersRelations = relations(usersTable, ({ many }) => ({
    items: many(itemsTable),
}));

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;

// --- Items (example CRUD entity - rename/replace for your domain) ------------

export const itemsTable = pgTable('items', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: text('user_id')
        .notNull()
        .references(() => usersTable.id),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status').default('draft'),
    metadata: jsonb('metadata').default({}),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const itemsRelations = relations(itemsTable, ({ one }) => ({
    user: one(usersTable, {
        fields: [itemsTable.user_id],
        references: [usersTable.id],
    }),
}));

export type InsertItem = typeof itemsTable.$inferInsert;
export type SelectItem = typeof itemsTable.$inferSelect;
