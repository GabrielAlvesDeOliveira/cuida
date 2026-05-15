import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export async function pickImage(): Promise<{ uri: string; base64: string } | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permissão necessária',
      'Permita o acesso à galeria nas configurações do dispositivo.'
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });

  if (result.canceled || !result.assets[0]) return null;

  const ctx = await ImageManipulator.manipulate(result.assets[0].uri)
    .resize({ width: 1080, height: 1080 })
    .renderAsync();
  const manipulated = await ctx.saveAsync({ compress: 0.8, format: SaveFormat.JPEG, base64: true });

  if (!manipulated.base64) return null;

  return { uri: manipulated.uri, base64: manipulated.base64 };
}

export function photoToDataUri(photo: string | null | undefined): string | null {
  if (!photo) return null;
  return `data:image/jpeg;base64,${photo}`;
}
