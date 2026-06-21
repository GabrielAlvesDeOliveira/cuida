import { File, Paths } from 'expo-file-system';
import { DEFAULT_SOUND_ID } from '@/utils/sounds';

const PREFS_FILE = 'cuida_prefs.json';

type Prefs = {
  alarmSoundId: string;
};

const defaults: Prefs = { alarmSoundId: DEFAULT_SOUND_ID };

export async function loadPreferences(): Promise<Prefs> {
  try {
    const file = new File(Paths.document, PREFS_FILE);
    if (file.exists) {
      const text = await file.text();
      return { ...defaults, ...JSON.parse(text) };
    }
  } catch {}
  return { ...defaults };
}

export async function savePreferences(update: Partial<Prefs>): Promise<void> {
  try {
    const current = await loadPreferences();
    const next = { ...current, ...update };
    const file = new File(Paths.document, PREFS_FILE);
    file.write(JSON.stringify(next));
  } catch {}
}
