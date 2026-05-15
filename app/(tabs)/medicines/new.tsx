import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { medicineModel } from '@/models/medicine.model';
import { MedicineForm } from '@/components/medicines/medicine-form';
import type { NewMedicine } from '@/models/database';

export default function NewMedicineScreen() {
  const router = useRouter();

  const handleSubmit = async (data: Omit<NewMedicine, 'id'>) => {
    try {
      await medicineModel.add(data);
      router.back();
    } catch (e) {
      console.error('[NewMedicine] save failed:', e);
      Alert.alert('Erro', String(e instanceof Error ? e.message : e));
    }
  };

  return <MedicineForm submitLabel="Salvar medicamento" onSubmit={handleSubmit} />;
}
