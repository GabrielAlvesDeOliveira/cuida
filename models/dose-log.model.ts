import { desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/models/database';
import { doseLog, alarm } from '@/models/database/schema';
import type { DoseLog } from '@/models/database';

class DoseLogModel {
  async logScheduled(alarmId: number): Promise<number> {
    const rows = await db
      .insert(doseLog)
      .values({ alarmId, scheduledAt: new Date() })
      .returning({ id: doseLog.id });
    return rows[0].id;
  }

  async markTaken(id: number): Promise<void> {
    await db.update(doseLog).set({ takenAt: new Date() }).where(eq(doseLog.id, id));
  }

  async getForAlarm(alarmId: number, limit = 30): Promise<DoseLog[]> {
    return db
      .select()
      .from(doseLog)
      .where(eq(doseLog.alarmId, alarmId))
      .orderBy(desc(doseLog.scheduledAt))
      .limit(limit);
  }

  async getForMedicine(medicineId: number, limit = 60): Promise<DoseLog[]> {
    const alarms = await db
      .select({ id: alarm.id })
      .from(alarm)
      .where(eq(alarm.medicineId, medicineId));

    if (alarms.length === 0) return [];

    const alarmIds = alarms.map(a => a.id);
    return db
      .select()
      .from(doseLog)
      .where(inArray(doseLog.alarmId, alarmIds))
      .orderBy(desc(doseLog.scheduledAt))
      .limit(limit);
  }
}

export const doseLogModel = new DoseLogModel();
