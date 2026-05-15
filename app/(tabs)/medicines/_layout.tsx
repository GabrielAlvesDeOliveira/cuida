import { Stack } from 'expo-router';

export default function MedicinesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0a7ea4' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Medicamentos' }} />
      <Stack.Screen name="new" options={{ title: 'Novo Medicamento', presentation: 'modal' }} />
      <Stack.Screen name="[id]" options={{ title: 'Medicamento' }} />
    </Stack>
  );
}
