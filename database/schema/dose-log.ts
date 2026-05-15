import { integer, sqliteTable } from 'drizzle-orm/sqlite-core';
import { alarm } from './alarm';

export const doseLog = sqliteTable('dose_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  alarmId: integer('alarm_id')
    .notNull()
    .references(() => alarm.id, { onDelete: 'cascade' }),
  scheduledAt: integer('scheduled_at', { mode: 'timestamp' }).notNull(),
  takenAt: integer('taken_at', { mode: 'timestamp' }),
});

export type DoseLog = typeof doseLog.$inferSelect;
export type NewDoseLog = typeof doseLog.$inferInsert;
