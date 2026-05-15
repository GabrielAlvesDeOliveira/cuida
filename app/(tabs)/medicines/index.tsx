import { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useMedicineModel } from '@/controllers/medicine.service';
import { MedicineCard } from '@/components/medicines/medicine-card';

export default function MedicinesScreen() {
  const { medicines, loading, error, refresh } = useMedicineModel();
  const router = useRouter();

  useFocusEffect(useCallback(() => { refresh(); }, []));

  if (loading && medicines.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={medicines}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) =>
          <MedicineCard
            medicine={item}
            onPress={() => router.push({ pathname: '/(tabs)/medicines/[id]', params: { id: item.id } })}
          />
        }
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={refresh}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💊</Text>
            <Text style={styles.emptyTitle}>Nenhum medicamento</Text>
            <Text style={styles.emptySubtitle}>Toque em + para cadastrar o primeiro.</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/medicines/new')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 96 },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorBannerText: { color: '#DC2626', fontSize: 14 },
  empty: { alignItems: 'center', marginTop: 80, gap: 8 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#11181C' },
  emptySubtitle: { fontSize: 15, color: '#687076' },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0a7ea4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0a7ea4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 32, lineHeight: 36 },
});
