import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { Medicine, NewMedicine } from '@/models/database';
import { PhotoPicker } from './photo-picker';
import { photoToDataUri } from '@/utils/image';

type FormData = Omit<NewMedicine, 'id'>;

type Props = {
  initial?: Medicine;
  submitLabel: string;
  onSubmit: (data: FormData) => Promise<void>;
};

export function MedicineForm({ initial, submitLabel, onSubmit }: Props) {
  const [brandName, setBrandName] = useState(initial?.brandName ?? '');
  const [ingredient, setIngredient] = useState(initial?.ingredient ?? '');
  const [dosage, setDosage] = useState(initial?.dosage ?? '');
  const [photo, setPhoto] = useState<string | null>(initial?.photo ?? null);
  const [previewUri, setPreviewUri] = useState<string | null>(
    initial?.photo ? photoToDataUri(initial.photo) : null
  );
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!brandName.trim()) next.brandName = 'Campo obrigatório';
    if (!ingredient.trim()) next.ingredient = 'Campo obrigatório';
    if (!dosage.trim()) next.dosage = 'Campo obrigatório';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit({
        brandName: brandName.trim(),
        ingredient: ingredient.trim(),
        dosage: dosage.trim(),
        photo,
        isActive,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePickPhoto = (base64: string, uri: string) => {
    setPhoto(base64);
    setPreviewUri(uri);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <PhotoPicker uri={previewUri} onPick={handlePickPhoto} />

        <Field label="Nome comercial" error={errors.brandName}>
          <TextInput
            style={[styles.input, errors.brandName && styles.inputError]}
            value={brandName}
            onChangeText={setBrandName}
            placeholder="Ex: Aspirina"
            placeholderTextColor="#B0B7BC"
            returnKeyType="next"
          />
        </Field>

        <Field label="Princípio ativo" error={errors.ingredient}>
          <TextInput
            style={[styles.input, errors.ingredient && styles.inputError]}
            value={ingredient}
            onChangeText={setIngredient}
            placeholder="Ex: Ácido acetilsalicílico"
            placeholderTextColor="#B0B7BC"
            returnKeyType="next"
          />
        </Field>

        <Field label="Dosagem" error={errors.dosage}>
          <TextInput
            style={[styles.input, errors.dosage && styles.inputError]}
            value={dosage}
            onChangeText={setDosage}
            placeholder="Ex: 100mg"
            placeholderTextColor="#B0B7BC"
            returnKeyType="done"
          />
        </Field>

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Medicamento ativo</Text>
            <Text style={styles.switchHint}>Aparece nos lembretes de alarme</Text>
          </View>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ false: '#D1D5DB', true: '#0a7ea4' }}
            thumbColor="#fff"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{submitLabel}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  content: { padding: 20, paddingBottom: 48 },
  field: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#687076',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#11181C',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  inputError: { borderColor: '#EF4444' },
  errorText: { fontSize: 12, color: '#EF4444', marginTop: 4 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  switchLabel: { fontSize: 16, fontWeight: '600', color: '#11181C' },
  switchHint: { fontSize: 12, color: '#9BA1A6', marginTop: 2 },
  button: {
    backgroundColor: '#0a7ea4',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
