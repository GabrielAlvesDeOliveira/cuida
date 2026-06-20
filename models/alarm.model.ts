import { eq } from 'drizzle-orm';
import { db } from '@/models/database';
import { alarm } from '@/models/database/schema';
import type { Alarm, NewAlarm } from '@/models/database';

export const WEEK_DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const WEEK_DAY_FULL = [
  'domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado',
];

// "Todo domingo", "Toda segunda", etc.
const PREFIX = ['Todo', 'Toda', 'Toda', 'Toda', 'Toda', 'Toda', 'Todo'];

export function alarmRepeatLabel(startAt: Date | string | number): string {
  const d = new Date(startAt);
  const day = d.getDay(); // 0=Sun … 6=Sat
  return `${PREFIX[day]} ${WEEK_DAY_FULL[day]}`;
}

type AlarmInsert = Omit<NewAlarm, 'id'>;

class AlarmModel {
  async listByMedicine(medicineId: number): Promise<Alarm[]> {
    return db.select().from(alarm).where(eq(alarm.medicineId, medicineId));
  }

  async getById(id: number): Promise<Alarm | undefined> {
    const rows = await db.select().from(alarm).where(eq(alarm.id, id));
    return rows[0];
  }

  async add(data: AlarmInsert): Promise<Alarm> {
    const rows = await db.insert(alarm).values(data).returning();
    return rows[0];
  }

  async setEnabled(id: number, isEnabled: boolean): Promise<Alarm | undefined> {
    const rows = await db
      .update(alarm)
      .set({ isEnabled })
      .where(eq(alarm.id, id))
      .returning();
    return rows[0];
  }

  async remove(id: number): Promise<void> {
    await db.delete(alarm).where(eq(alarm.id, id));
  }
}

export const alarmModel = new AlarmModel();
