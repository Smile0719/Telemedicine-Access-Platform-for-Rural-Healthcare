import Dexie from 'dexie';
import api from './api';

const db = new Dexie('rural-healthcare-db');
db.version(1).stores({
  patients: '++id, phoneNumber, syncStatus, createdAt',
});

export const saveLocalPatient = async (patient) => {
  const payload = {
    ...patient,
    syncStatus: 'pending',
    createdAt: new Date().toISOString(),
  };

  await db.patients.add(payload);
};

export const getPendingPatients = async () => {
  return db.patients.where('syncStatus').equals('pending').toArray();
};

export const syncQueuedPatients = async () => {
  if (!navigator.onLine) return false;

  const pending = await getPendingPatients();

  for (const item of pending) {
    try {
      await api.post('/patients', {
        first_name: item.first_name,
        last_name: item.last_name,
        phone_number: item.phone_number,
        village: item.village,
        gender: item.gender,
        symptoms: item.symptoms,
      });

      await db.patients.update(item.id, {
        syncStatus: 'synced',
        syncedAt: new Date().toISOString(),
      });
    } catch (error) {
      return false;
    }
  }

  return true;
};

export default db;
