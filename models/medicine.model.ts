import { eq } from 'drizzle-orm';
import { db, medicine } from '@/models/database';
import type { Medicine, NewMedicine } from '@/models/database';

type MedicineUpdate = Partial<Omit<NewMedicine, 'id'>>;

class MedicineModel {
  async list(): Promise<Medicine[]> {
    return db.select().from(medicine);
  }

  async listActive(): Promise<Medicine[]> {
    return db.select().from(medicine).where(eq(medicine.isActive, true));
  }

  async getById(id: number): Promise<Medicine | undefined> {
    const rows = await db.select().from(medicine).where(eq(medicine.id, id));
    return rows[0];
  }

  async add(data: Omit<NewMedicine, 'id'>): Promise<Medicine> {
    const rows = await db.insert(medicine).values(data).returning();
    return rows[0];
  }

  async update(id: number, data: MedicineUpdate): Promise<Medicine | undefined> {
    const rows = await db.update(medicine).set(data).where(eq(medicine.id, id)).returning();
    return rows[0];
  }

  async updatePhoto(id: number, photo: string): Promise<Medicine | undefined> {
    return this.update(id, { photo });
  }

  async activate(id: number): Promise<Medicine | undefined> {
    return this.update(id, { isActive: true });
  }

  async deactivate(id: number): Promise<Medicine | undefined> {
    return this.update(id, { isActive: false });
  }

  async remove(id: number): Promise<void> {
    await db.delete(medicine).where(eq(medicine.id, id));
  }
}

export const medicineModel = new MedicineModel();
