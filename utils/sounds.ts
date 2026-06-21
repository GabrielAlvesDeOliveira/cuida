import type { MutableRefObject } from 'react';
import { Audio } from 'expo-av';

export type AlarmSound = {
  id: string;
  label: string;
  source: ReturnType<typeof require>;
};

export const ALARM_SOUNDS: AlarmSound[] = [
  {
    id: 'ai_butterfly',
    label: 'AI Butterfly',
    source: require('../audios/ai_butterfly.mp3'),
  },
  {
    id: 'alarme_classico',
    label: 'Clássico',
    source: require('../audios/soundreality-alarm-471496.mp3'),
  },
  {
    id: 'incendio',
    label: 'Incêndio',
    source: require('../audios/49656682-fire-alarm-test-inside-an-apartment-438459.mp3'),
  },
  {
    id: 'evacuacao',
    label: 'Evacuação',
    source: require('../audios/liecio-evacuation-alarm-189740.mp3'),
  },
  {
    id: 'emergencia',
    label: 'Emergência',
    source: require('../audios/matthewvakaliuk73627-mayotte-eas-alarm-298725.mp3'),
  },
  {
    id: 'incidente',
    label: 'Incidente',
    source: require('../audios/soundreality-space-incident-147580.mp3'),
  },
  {
    id: 'foguete',
    label: 'Foguete',
    source: require('../audios/soundreality-space-rocket-lifter-138760.mp3'),
  },
  {
    id: 'sistema_critico',
    label: 'Sist. Crítico',
    source: require('../audios/u_whvpuvkdwz-automatic-depressurization-system-nuclear-reactor-497640.mp3'),
  },
  {
    id: 'nuclear',
    label: 'Nuclear',
    source: require('../audios/u_whvpuvkdwz-nuclear-emergency-alarm-meltdown-497643.mp3'),
  },
];

export const DEFAULT_SOUND_ID = 'ai_butterfly';

export function getSoundById(id: string): AlarmSound {
  return ALARM_SOUNDS.find(s => s.id === id) ?? ALARM_SOUNDS[0];
}

/** Play a 4-second preview of the selected sound. Stops any previous preview. */
export async function previewSound(
  soundId: string,
  currentRef: MutableRefObject<Audio.Sound | null>
): Promise<void> {
  try {
    await currentRef.current?.stopAsync();
    await currentRef.current?.unloadAsync();
    currentRef.current = null;
  } catch {}

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: false,
  });

  const { sound } = await Audio.Sound.createAsync(
    getSoundById(soundId).source,
    { shouldPlay: true, volume: 1.0 }
  );
  currentRef.current = sound;

  setTimeout(async () => {
    try {
      await sound.stopAsync();
      await sound.unloadAsync();
      if (currentRef.current === sound) currentRef.current = null;
    } catch {}
  }, 4000);
}
