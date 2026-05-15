import { useState, useCallback, useEffect } from 'react';
import { medicineModel } from '@/models/medicine.model';
import type { Medicine, NewMedicine } from '@/models/database';

type MedicineUpdate = Partial<Omit<NewMedicine, 'id'>>;

export function useMedicineModel() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await medicineModel.list();
      setMedicines(data);
    } catch (e) {
      console.error('[useMedicineModel] refresh failed:', e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback(async (data: Omit<NewMedicine, 'id'>): Promise<Medicine> => {
    const med = await medicineModel.add(data);
    setMedicines(prev => [med, ...prev]);
    return med;
  }, []);

  const update = useCallback(async (id: number, data: MedicineUpdate): Promise<Medicine | undefined> => {
    const med = await medicineModel.update(id, data);
    if (med) setMedicines(prev => prev.map(m => m.id === id ? med : m));
    return med;
  }, []);

  const updatePhoto = useCallback(async (id: number, photo: ArrayBuffer): Promise<Medicine | undefined> => {
    const med = await medicineModel.updatePhoto(id, photo);
    if (med) setMedicines(prev => prev.map(m => m.id === id ? med : m));
    return med;
  }, []);

  const remove = useCallback(async (id: number): Promise<void> => {
    await medicineModel.remove(id);
    setMedicines(prev => prev.filter(m => m.id !== id));
  }, []);

  const getById = useCallback((id: number): Medicine | undefined => {
    return medicines.find(m => m.id === id);
  }, [medicines]);

  return { medicines, loading, error, refresh, add, update, updatePhoto, remove, getById };
}
