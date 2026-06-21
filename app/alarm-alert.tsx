import { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  Vibration,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { medicineModel } from '@/models/medicine.model';
import { doseLogModel } from '@/models/dose-log.model';
import { scheduleSnoozeNotification } from '@/utils/notifications';
import { photoToDataUri } from '@/utils/image';
import { getSoundById } from '@/utils/sounds';
import { loadPreferences } from '@/utils/preferences';
import type { Medicine } from '@/models/database';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = Math.min(width * 0.6, 260);

async function createAlarmSound(): Promise<Audio.Sound | null> {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
    });

    const prefs = await loadPreferences();
    const alarmSound = getSoundById(prefs.alarmSoundId);

    const { sound } = await Audio.Sound.createAsync(
      alarmSound.source,
      { isLooping: true, shouldPlay: true, volume: 1.0 }
    );
    return sound;
  } catch {
    return null;
  }
}

export default function AlarmAlertScreen() {
  const { medicineId, alarmId } = useLocalSearchParams<{
    medicineId: string;
    alarmId: string;
  }>();
  const router = useRouter();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);

  const soundRef = useRef<Audio.Sound | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const doseLogIdRef = useRef<number | null>(null);

  useEffect(() => {
    medicineModel.getById(parseInt(medicineId, 10)).then(m => {
      setMedicine(m ?? null);
      setLoading(false);
    });

    const numericAlarmId = parseInt(alarmId ?? '0', 10);
    if (numericAlarmId > 0) {
      doseLogModel.logScheduled(numericAlarmId)
        .then(id => { doseLogIdRef.current = id; })
        .catch(() => {});
    }
  }, [medicineId, alarmId]);

  useEffect(() => {
    let vibInterval: ReturnType<typeof setInterval> | null = null;

    (async () => {
      soundRef.current = await createAlarmSound();

      if (Platform.OS === 'android') {
        Vibration.vibrate([0, 600, 400, 600], true);
      } else {
        vibInterval = setInterval(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }, 1800);
      }
    })();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();

    return () => {
      soundRef.current?.stopAsync().catch(() => {});
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
      pulse.stop();
      if (Platform.OS === 'android') Vibration.cancel();
      if (vibInterval) clearInterval(vibInterval);
    };
  }, [pulseAnim]);

  const stopAlarm = useCallback(async () => {
    await soundRef.current?.stopAsync().catch(() => {});
    await soundRef.current?.unloadAsync().catch(() => {});
    soundRef.current = null;
    if (Platform.OS === 'android') Vibration.cancel();
  }, []);

  const handleTaken = useCallback(async () => {
    await stopAlarm();
    if (doseLogIdRef.current !== null) {
      await doseLogModel.markTaken(doseLogIdRef.current).catch(() => {});
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }, [router, stopAlarm]);

  const handleSnooze = useCallback(async () => {
    await stopAlarm();
    if (medicine) {
      await scheduleSnoozeNotification(
        parseInt(medicineId, 10),
        parseInt(alarmId ?? '0', 10),
        medicine
      ).catch(() => {});
    }
    router.back();
  }, [medicine, alarmId, medicineId, router, stopAlarm]);

  const handleDismiss = useCallback(async () => {
    await stopAlarm();
    router.back();
  }, [router, stopAlarm]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  const photoUri = photoToDataUri(medicine?.photo ?? null);

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss} activeOpacity={0.7}>
        <Text style={styles.dismissBtnText}>✕</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.bellIcon}>🔔</Text>
        <Text style={styles.headerTitle}>Hora do medicamento!</Text>
      </View>

      <View style={styles.photoWrapper}>
        <Animated.View style={[styles.glowRing, { transform: [{ scale: pulseAnim }] }]} />
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
        ) : (
          <View style={[styles.photo, styles.photoFallback]}>
            <Text style={styles.photoEmoji}>💊</Text>
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.medicineName}>{medicine?.brandName ?? '—'}</Text>
        <Text style={styles.ingredient}>{medicine?.ingredient}</Text>
        <View style={styles.dosageBadge}>
          <Text style={styles.dosageText}>{medicine?.dosage}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.takenBtn} onPress={handleTaken} activeOpacity={0.85}>
          <Text style={styles.takenBtnText}>✓  Tomar agora</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.snoozeBtn} onPress={handleSnooze} activeOpacity={0.85}>
          <Text style={styles.snoozeBtnText}>⏰  Adiar 10 minutos</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a2540',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 24,
  },
  dismissBtn: {
    position: 'absolute',
    top: 52,
    right: 24,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  dismissBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  header: { alignItems: 'center', marginTop: 52, gap: 8 },
  bellIcon: { fontSize: 36 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  photoWrapper: { alignItems: 'center', justifyContent: 'center' },
  glowRing: {
    position: 'absolute',
    width: PHOTO_SIZE + 48,
    height: PHOTO_SIZE + 48,
    borderRadius: (PHOTO_SIZE + 48) / 2,
    backgroundColor: 'rgba(10, 126, 164, 0.3)',
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  photoFallback: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoEmoji: { fontSize: 80 },
  infoContainer: { alignItems: 'center', gap: 8, paddingHorizontal: 32 },
  medicineName: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center' },
  ingredient: { fontSize: 16, color: 'rgba(255,255,255,0.65)', textAlign: 'center' },
  dosageBadge: {
    backgroundColor: 'rgba(10,126,164,0.5)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 6,
    marginTop: 4,
  },
  dosageText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  actions: { width: '100%', paddingHorizontal: 24, gap: 12, marginBottom: 12 },
  takenBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  takenBtnText: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 0.3 },
  snoozeBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  snoozeBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
