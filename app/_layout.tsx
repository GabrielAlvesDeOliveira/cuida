import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';
import * as Notifications from 'expo-notifications';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDbMigrations } from '@/models/database/migrate';
import {
  setupNotificationHandler,
  setupNotificationChannel,
} from '@/utils/notifications';

setupNotificationHandler();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { success, error } = useDbMigrations();
  const router = useRouter();

  useEffect(() => {
    setupNotificationChannel();
  }, []);

  // Navigate to alarm-alert when a notification is tapped
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      if (data?.screen === 'alarm-alert' && data?.medicineId) {
        router.push({
          pathname: '/alarm-alert' as any,
          params: {
            medicineId: String(data.medicineId),
            alarmId: String(data.alarmId ?? ''),
          },
        });
      }
    });
    return () => sub.remove();
  }, [router]);

  // Navigate to alarm-alert when notification received in foreground
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data as Record<string, unknown>;
      if (data?.screen === 'alarm-alert' && data?.medicineId) {
        router.push({
          pathname: '/alarm-alert' as any,
          params: {
            medicineId: String(data.medicineId),
            alarmId: String(data.alarmId ?? ''),
          },
        });
      }
    });
    return () => sub.remove();
  }, [router]);

  // Handle notification that cold-launched the app
  useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (!response) return;
      const data = response.notification.request.content.data as Record<string, unknown>;
      if (data?.screen === 'alarm-alert' && data?.medicineId) {
        router.push({
          pathname: '/alarm-alert' as any,
          params: {
            medicineId: String(data.medicineId),
            alarmId: String(data.alarmId ?? ''),
          },
        });
      }
    });
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: '#DC2626', fontSize: 16, fontWeight: '700', marginBottom: 8 }}>
          Erro ao inicializar banco de dados
        </Text>
        <Text style={{ color: '#374151', fontSize: 13 }}>{error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen
          name="alarm-alert"
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
