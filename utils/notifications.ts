import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type { Alarm, Medicine } from '@/models/database';

const isExpoGo = Constants.appOwnership === 'expo';

export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function setupNotificationChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('medicine-alarms', {
    name: 'Alarmes de medicamentos',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 500, 500],
    lightColor: '#0a7ea4',
    sound: 'default',
    enableVibrate: true,
    bypassDnd: true,
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return isExpoGo;
  }
}

export async function cancelAlarmNotification(alarmId: number): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(`alarm-${alarmId}`).catch(() => {});
}

export async function scheduleAlarmNotification(
  alarmRecord: Alarm,
  medicine: Medicine
): Promise<void> {
  await cancelAlarmNotification(alarmRecord.id);
  if (!alarmRecord.isEnabled) return;

  const startAt = new Date(alarmRecord.startAt);
  const hour = startAt.getHours();
  const minute = startAt.getMinutes();

  const content: Notifications.NotificationContentInput = {
    title: '💊 Hora do medicamento',
    body: `${medicine.brandName} — ${medicine.dosage}`,
    sound: 'default',
    data: { medicineId: medicine.id, alarmId: alarmRecord.id, screen: 'alarm-alert' },
  };

  const isDaily = alarmRecord.interval <= 1440;

  if (isDaily) {
    // Todos os dias → DAILY trigger
    await Notifications.scheduleNotificationAsync({
      identifier: `alarm-${alarmRecord.id}`,
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: 'medicine-alarms',
      } as Notifications.DailyTriggerInput & { channelId?: string },
    });
  } else {
    // Dia específico → WEEKLY trigger  (getDay() 0=Sun, expo weekday 1=Sun)
    const weekday = startAt.getDay() + 1;
    await Notifications.scheduleNotificationAsync({
      identifier: `alarm-${alarmRecord.id}`,
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour,
        minute,
        channelId: 'medicine-alarms',
      } as Notifications.WeeklyTriggerInput & { channelId?: string },
    });
  }
}

export async function scheduleSnoozeNotification(
  medicineId: number,
  alarmId: number,
  medicine: Medicine
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: `snooze-${alarmId}-${Date.now()}`,
    content: {
      title: '💊 Hora do medicamento (repetição)',
      body: `${medicine.brandName} — ${medicine.dosage}`,
      sound: 'default',
      data: { medicineId, alarmId, screen: 'alarm-alert' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 10 * 60,
      channelId: 'medicine-alarms',
    } as Notifications.TimeIntervalTriggerInput & { channelId?: string },
  });
}
