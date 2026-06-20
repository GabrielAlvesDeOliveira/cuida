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
  SafeAreaView,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { File, Paths } from 'expo-file-system';
import { medicineModel } from '@/models/medicine.model';
import { scheduleSnoozeNotification } from '@/utils/notifications';
import { photoToDataUri } from '@/utils/image';
import type { Medicine } from '@/models/database';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = Math.min(width * 0.6, 260);

// ---------------------------------------------------------------------------
// WAV generator — produces a 1-second "di-dah" alarm tone (no external file)
// ---------------------------------------------------------------------------
function buildAlarmWav(): Uint8Array {
  const sampleRate = 22050;
  const duration = 1.0;
  const numSamples = Math.floor(sampleRate * duration);
  const dataBytes = numSamples * 2;
  const buf = new ArrayBuffer(44 + dataBytes);
  const v = new DataView(buf);
  const ws = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i));
  };
  ws(0, 'RIFF');
  v.setUint32(4, 36 + dataBytes, true);
  ws(8, 'WAVE');
  ws(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);          // PCM
  v.setUint16(22, 1, true);          // mono
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  ws(36, 'data');
  v.setUint32(40, dataBytes, true);

  // Two-tone pulse: 880 Hz for 0.3 s, 1100 Hz for 0.3 s, silence 0.4 s
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;
    if (t < 0.3) {
      sample = Math.sin(2 * Math.PI * 880 * t) * 28000;
    } else if (t < 0.6) {
      sample = Math.sin(2 * Math.PI * 1100 * t) * 28000;
    }
    v.setInt16(44 + i * 2, Math.round(sample), true);
  }
  return new Uint8Array(buf);
}

async function createAlarmSound(): Promise<Audio.Sound | null> {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
    });
    // Write WAV bytes to cache — new expo-file-system SDK 54 API
    const wavBytes = buildAlarmWav();
    const file = new File(Paths.cache, 'alarm_tone.wav');
    file.write(wavBytes);
    const { sound } = await Audio.Sound.createAsync(
      { uri: file.uri },
      { isLooping: true, shouldPlay: true, volume: 1.0 }
    );
    return sound;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------

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

  // Load medicine
  useEffect(() => {
    medicineModel.getById(parseInt(medicineId, 10)).then(m => {
      setMedicine(m ?? null);
      setLoading(false);
    });
  }, [medicineId]);

  // Start alarm: sound + vibration + pulse animation
  useEffect(() => {
    let vibInterval: ReturnType<typeof setInterval> | null = null;

    (async () => {
      // Sound
      soundRef.current = await createAlarmSound();

      // Vibration
      if (Platform.OS === 'android') {
        Vibration.vibrate([0, 600, 400, 600], true);
      } else {
        vibInterval = setInterval(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }, 1800);
      }
    })();

    // Pulse animation loop
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
      {/* Dismiss */}
      <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss} activeOpacity={0.7}>
        <Text style={styles.dismissBtnText}>✕</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.bellIcon}>🔔</Text>
        <Text style={styles.headerTitle}>Hora do medicamento!</Text>
      </View>

      {/* Photo with pulse */}
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

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.medicineName}>{medicine?.brandName ?? '—'}</Text>
        <Text style={styles.ingredient}>{medicine?.ingredient}</Text>
        <View style={styles.dosageBadge}>
          <Text style={styles.dosageText}>{medicine?.dosage}</Text>
        </View>
      </View>

      {/* Actions */}
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
    backgroundColor: '#0a7ea4',
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#0a7ea4',
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
