import { integer, sqliteTable } from 'drizzle-orm/sqlite-core';
import { medicine } from './medicine';

export const alarm = sqliteTable('alarm', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  medicineId: integer('medicine_id')
    .notNull()
    .references(() => medicine.id, { onDelete: 'cascade' }),
  interval: integer('interval').notNull(),
  startAt: integer('start_at', { mode: 'timestamp' }).notNull(),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
});

export type Alarm = typeof alarm.$inferSelect;
export type NewAlarm = typeof alarm.$inferInsert;
