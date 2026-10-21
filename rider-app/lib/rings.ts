import { Platform, Vibration } from 'react-native';
import { createRingController, type RingHandle, type RingPlayer } from './ring-controller';

/** Ring tones a rider can choose for new-order offers. Made by tools/make-sounds.py; each is a 3 second loop. */
export const RINGS = [
  { id: 'classic', label: 'Classic ring', note: 'Like a phone call', source: require('../assets/sounds/ring_classic.wav') },
  { id: 'horn', label: 'Bike horn', note: 'Beep, beep, beeeep', source: require('../assets/sounds/ring_horn.wav') },
  { id: 'siren', label: 'Dispatch siren', note: 'Rising and falling', source: require('../assets/sounds/ring_siren.wav') },
  { id: 'bell', label: 'Order bell', note: 'Rapid bell strikes', source: require('../assets/sounds/ring_bell.wav') },
  { id: 'pulse', label: 'Digital pulse', note: 'Sharp beeps in two bursts', source: require('../assets/sounds/ring_pulse.wav') },
  { id: 'gong', label: 'Deep gong', note: 'Low and hard to miss', source: require('../assets/sounds/ring_gong.wav') },
  { id: 'afrobeat', label: 'Afro marimba', note: 'A bouncy marimba loop', source: require('../assets/sounds/ring_afrobeat.wav') },
] as const;

export type RingId = (typeof RINGS)[number]['id'];
export const DEFAULT_RING: RingId = 'classic';
export const isRingId = (v: unknown): v is RingId => RINGS.some((r) => r.id === v);
export const ringLabel = (id: string) => RINGS.find((r) => r.id === id)?.label ?? 'Classic ring';

const VIBRATION_PATTERN = [0, 700, 500];   // wait, buzz, pause; repeated until cancelled

const player: RingPlayer = {
  async loop(ringId) {
    const entry = RINGS.find((r) => r.id === ringId) ?? RINGS[0];
    // Lazy so a native audio problem can never stop the app from starting.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Audio } = require('expo-av') as typeof import('expo-av');
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true, shouldDuckAndroid: false });
    const { sound } = await Audio.Sound.createAsync(entry.source, { shouldPlay: true, isLooping: true, volume: 1 });
    const handle: RingHandle = { stop: async () => { try { await sound.stopAsync(); } catch { /* already stopped */ } try { await sound.unloadAsync(); } catch { /* already unloaded */ } } };
    return handle;
  },
  vibrate() {
    Vibration.vibrate(VIBRATION_PATTERN, true);
    return () => Vibration.cancel();
  },
};

/** The one ring controller for the app. */
export const ring = createRingController(player);

/** Plays a ring for about three seconds so a rider can hear it in the picker. */
let previewTimer: ReturnType<typeof setTimeout> | null = null;
export async function previewRing(id: RingId): Promise<void> {
  if (previewTimer) clearTimeout(previewTimer);
  await ring.start(id, { vibrate: Platform.OS === 'android' ? false : false });
  previewTimer = setTimeout(() => { void ring.stop('left'); }, 3000);
}
