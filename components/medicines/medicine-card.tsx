import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import type { Medicine } from '@/models/database';
import { photoToDataUri } from '@/utils/image';

type Props = {
  medicine: Medicine;
  onPress: () => void;
};

export function MedicineCard({ medicine, onPress }: Props) {
  const photoUri = photoToDataUri(medicine.photo);

  return (
    <TouchableOpacity
      style={[styles.card, !medicine.isActive && styles.cardInactive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
      ) : (
        <View style={styles.photoPlaceholder}>
          <Text style={styles.photoIcon}>💊</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.brandName} numberOfLines={1}>{medicine.brandName}</Text>
        <Text style={styles.ingredient} numberOfLines={1}>{medicine.ingredient}</Text>
        <Text style={styles.dosage}>{medicine.dosage}</Text>
      </View>

      {!medicine.isActive && (
        <View style={styles.inactiveBadge}>
          <Text style={styles.inactiveBadgeText}>Inativo</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardInactive: {
    opacity: 0.55,
  },
  photo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  photoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EEF2F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIcon: { fontSize: 26 },
  info: {
    flex: 1,
    marginLeft: 14,
    gap: 3,
  },
  brandName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#11181C',
  },
  ingredient: {
    fontSize: 13,
    color: '#687076',
  },
  dosage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a7ea4',
  },
  inactiveBadge: {
    backgroundColor: '#9BA1A6',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  inactiveBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
