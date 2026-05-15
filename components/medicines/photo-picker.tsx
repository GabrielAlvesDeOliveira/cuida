import { StyleSheet, TouchableOpacity, View, Text, Alert } from 'react-native';
import { Image } from 'expo-image';
import { pickImage } from '@/utils/image';

type Props = {
  uri: string | null;
  onPick: (base64: string, uri: string) => void;
};

export function PhotoPicker({ uri, onPick }: Props) {
  const handlePress = async () => {
    const result = await pickImage();
    if (!result) return;
    onPick(result.base64, result.uri);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.8}>
      {uri ? (
        <Image source={{ uri }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.icon}>📷</Text>
          <Text style={styles.label}>Adicionar foto</Text>
        </View>
      )}
      {uri && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Trocar</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  image: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  placeholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#E8F4F8',
    borderWidth: 2,
    borderColor: '#0a7ea4',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  icon: { fontSize: 28 },
  label: { fontSize: 12, color: '#0a7ea4', fontWeight: '600' },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0a7ea4',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
