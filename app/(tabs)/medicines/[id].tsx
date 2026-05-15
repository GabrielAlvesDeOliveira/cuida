import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { medicineModel } from '@/models/medicine.model';
import { MedicineForm } from '@/components/medicines/medicine-form';
import { pickImage, photoToDataUri } from '@/utils/image';
import type { Medicine, NewMedicine } from '@/models/database';

export default function MedicineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const numericId = parseInt(id, 10);

  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await medicineModel.getById(numericId);
    setMedicine(data ?? null);
    setLoading(false);
  }, [numericId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    navigation.setOptions({
      title: medicine?.brandName ?? 'Medicamento',
      headerRight: () => (
        <TouchableOpacity onPress={() => setIsEditing(v => !v)} style={{ marginRight: 4 }}>
          <Text style={styles.headerBtn}>{isEditing ? 'Cancelar' : 'Editar'}</Text>
        </TouchableOpacity>
      ),
    });
  }, [medicine, isEditing, navigation]);

  const handleUpdate = async (data: Omit<NewMedicine, 'id'>) => {
    try {
      await medicineModel.update(numericId, data);
      await load();
      setIsEditing(false);
    } catch (e) {
      console.error('[MedicineDetail] update failed:', e);
      Alert.alert('Erro', String(e instanceof Error ? e.message : e));
    }
  };

  const handleUpdatePhoto = async () => {
    const result = await pickImage();
    if (!result) return;
    try {
      await medicineModel.updatePhoto(numericId, result.base64);
      await load();
    } catch (e) {
      console.error('[MedicineDetail] photo update failed:', e);
      Alert.alert('Erro', String(e instanceof Error ? e.message : e));
    }
  };

  const handleToggleActive = async (value: boolean) => {
    await (value ? medicineModel.activate(numericId) : medicineModel.deactivate(numericId));
    await load();
  };

  const handleDelete = () => {
    Alert.alert(
      'Remover medicamento',
      `Deseja remover "${medicine?.brandName}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            await medicineModel.remove(numericId);
            router.back();
          },
        },
      ]
    );
  };

  if (loading) {
    return <ActivityIndicator style={styles.loading} size="large" color="#0a7ea4" />;
  }

  if (!medicine) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Medicamento não encontrado.</Text>
      </View>
    );
  }

  if (isEditing) {
    return <MedicineForm initial={medicine} submitLabel="Salvar alterações" onSubmit={handleUpdate} />;
  }

  const photoUri = photoToDataUri(medicine.photo);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.photoContainer} onPress={handleUpdatePhoto} activeOpacity={0.8}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoIcon}>💊</Text>
          </View>
        )}
        <View style={styles.photoBadge}>
          <Text style={styles.photoBadgeText}>📷 Trocar foto</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.card}>
        <InfoRow label="Nome comercial" value={medicine.brandName} />
        <Divider />
        <InfoRow label="Princípio ativo" value={medicine.ingredient} />
        <Divider />
        <InfoRow label="Dosagem" value={medicine.dosage} highlight />
      </View>

      <View style={styles.card}>
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Medicamento ativo</Text>
            <Text style={styles.switchHint}>
              {medicine.isActive ? 'Aparece nos alarmes' : 'Não aparece nos alarmes'}
            </Text>
          </View>
          <Switch
            value={medicine.isActive}
            onValueChange={handleToggleActive}
            trackColor={{ false: '#D1D5DB', true: '#0a7ea4' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.8}>
        <Text style={styles.deleteButtonText}>Remover medicamento</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && styles.infoValueHighlight]}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  content: { padding: 20, paddingBottom: 48, gap: 16 },
  loading: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontSize: 16, color: '#687076' },
  headerBtn: { color: '#fff', fontSize: 16, fontWeight: '600' },

  photoContainer: { alignSelf: 'center', marginBottom: 8 },
  photo: { width: 120, height: 120, borderRadius: 60 },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIcon: { fontSize: 48 },
  photoBadge: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  photoBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: { paddingVertical: 14 },
  infoLabel: { fontSize: 12, fontWeight: '600', color: '#9BA1A6', marginBottom: 4, textTransform: 'uppercase' },
  infoValue: { fontSize: 17, color: '#11181C', fontWeight: '500' },
  infoValueHighlight: { color: '#0a7ea4', fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#F0F2F4' },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  switchLabel: { fontSize: 16, fontWeight: '600', color: '#11181C' },
  switchHint: { fontSize: 12, color: '#9BA1A6', marginTop: 2 },

  deleteButton: {
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  deleteButtonText: { color: '#EF4444', fontSize: 16, fontWeight: '700' },
});
