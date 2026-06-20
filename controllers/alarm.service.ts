import { useState, useCallback, useEffect } from 'react';
import { alarmModel } from '@/models/alarm.model';
import { medicineModel } from '@/models/medicine.model';
import {
  scheduleAlarmNotification,
  cancelAlarmNotification,
  requestNotificationPermissions,
} from '@/utils/notifications';
import type { Alarm } from '@/models/database';

export function useAlarmService(medicineId: number) {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await alarmModel.listByMedicine(medicineId);
      setAlarms(data);
    } finally {
      setLoading(false);
    }
  }, [medicineId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * days = 'all'  → 1 alarm with DAILY trigger (interval = 1440)
   * days = [1,3,5] → N alarms with WEEKLY trigger (interval = 7*1440), one per day
   *
   * For WEEKLY alarms, startAt is set to the next occurrence of each weekday at the chosen time.
   * For DAILY alarms, startAt is set to today (or tomorrow) at the chosen time.
   */
  const add = useCallback(
    async (time: Date, days: 'all' | number[]): Promise<Alarm[]> => {
      const granted = await requestNotificationPermissions();
      if (!granted) throw new Error('Permissão de notificações negada. Ative nas configurações.');

      const medicine = await medicineModel.getById(medicineId);
      const created: Alarm[] = [];

      if (days === 'all') {
        // Single DAILY alarm
        const startAt = nextDailyOccurrence(time);
        const newAlarm = await alarmModel.add({
          medicineId,
          startAt,
          interval: 1440, // daily in minutes
          isEnabled: true,
        });
        if (medicine) await scheduleAlarmNotification(newAlarm, medicine);
        created.push(newAlarm);
      } else {
        // One WEEKLY alarm per selected day
        for (const day of days) {
          const startAt = nextWeekdayOccurrence(day, time);
          const newAlarm = await alarmModel.add({
            medicineId,
            startAt,
            interval: 7 * 1440, // weekly in minutes
            isEnabled: true,
          });
          if (medicine) await scheduleAlarmNotification(newAlarm, medicine);
          created.push(newAlarm);
        }
      }

      setAlarms(prev => [...prev, ...created]);
      return created;
    },
    [medicineId]
  );

  const toggleEnabled = useCallback(
    async (alarmId: number, isEnabled: boolean): Promise<void> => {
      const updated = await alarmModel.setEnabled(alarmId, isEnabled);
      if (!updated) return;

      if (isEnabled) {
        const medicine = await medicineModel.getById(medicineId);
        if (medicine) await scheduleAlarmNotification(updated, medicine);
      } else {
        await cancelAlarmNotification(alarmId);
      }

      setAlarms(prev => prev.map(a => (a.id === alarmId ? updated : a)));
    },
    [medicineId]
  );

  const remove = useCallback(async (alarmId: number): Promise<void> => {
    await alarmModel.remove(alarmId);
    await cancelAlarmNotification(alarmId);
    setAlarms(prev => prev.filter(a => a.id !== alarmId));
  }, []);

  return { alarms, loading, refresh, add, toggleEnabled, remove };
}

/** Next daily occurrence at the given hour:minute (today if still in future, else tomorrow). */
function nextDailyOccurrence(time: Date): Date {
  const now = new Date();
  const next = new Date(now);
  next.setHours(time.getHours(), time.getMinutes(), 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next;
}

/** Next occurrence of a given weekday (0=Sun…6=Sat) at the given hour:minute. */
function nextWeekdayOccurrence(weekday: number, time: Date): Date {
  const now = new Date();
  const next = new Date(now);
  next.setHours(time.getHours(), time.getMinutes(), 0, 0);
  let daysAhead = weekday - now.getDay();
  if (daysAhead < 0 || (daysAhead === 0 && next <= now)) daysAhead += 7;
  next.setDate(next.getDate() + daysAhead);
  return next;
}
