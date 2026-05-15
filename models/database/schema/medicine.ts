import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const medicine = sqliteTable('medicine', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  brandName: text('brand_name').notNull(),
  ingredient: text('ingredient').notNull(),
  dosage: text('dosage').notNull(),
  notes: text('dosage').notNull(),
  photo: text('photo'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
});

export type Medicine = typeof medicine.$inferSelect;
export type NewMedicine = typeof medicine.$inferInsert;
