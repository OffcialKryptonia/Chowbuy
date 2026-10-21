import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';

/**
 * Notification sounds a customer can choose. The files are bundled (see assets/sounds, made by tools/make-sounds.py) and also
 * registered with expo-notifications in app.json so they can play when the app is closed.
 * Android fixes a channel's sound when the channel is created, so each sound has its own channel (orders_<id>) and only the chosen one exists.
 */
export const NOTIF_SOUNDS = [
  { id: 'chime', label: 'Chime', note: 'Two soft bell notes', source: require('../assets/sounds/notif_chime.wav') },
  { id: 'bell', label: 'Bell', note: 'A single clear bell', source: require('../assets/sounds/notif_bell.wav') },
  { id: 'ding', label: 'Ding', note: 'Short and bright', source: require('../assets/sounds/notif_ding.wav') },
  { id: 'marimba', label: 'Naija Marimba', note: 'A quick rising run', source: require('../assets/sounds/notif_marimba.wav') },
  { id: 'fanfare', label: 'Order up!', note: 'Cheerful three-note rise', source: require('../assets/sounds/notif_fanfare.wav') },
  { id: 'horn', label: 'Rider horn', note: 'Beep, beeeep', source: require('../assets/sounds/notif_horn.wav') },
  { id: 'droplet', label: 'Droplet', note: 'Soft and quiet', source: require('../assets/sounds/notif_droplet.wav') },
  { id: 'pop', label: 'Pop', note: 'Tiny bubble', source: require('../assets/sounds/notif_pop.wav') },
  { id: 'default', label: 'Phone default', note: "Your phone's own notification sound", source: null },
] as const;

export type NotifSoundId = (typeof NOTIF_SOUNDS)[number]['id'];
export const DEFAULT_SOUND: NotifSoundId = 'chime';
export const isSoundId = (v: unknown): v is NotifSoundId => NOTIF_SOUNDS.some((s) => s.id === v);
export const soundLabel = (id: string) => NOTIF_SOUNDS.find((s) => s.id === id)?.label ?? 'Chime';
export const channelFor = (id: NotifSoundId) => `orders_${id}`;
/** File name a push payload uses on iOS (and the raw resource on Android). */
export const soundFile = (id: NotifSoundId) => (id === 'default' ? 'default' : `notif_${id}.wav`);

type AvSound = { unloadAsync: () => Promise<unknown>; playAsync: () => Promise<unknown>; setOnPlaybackStatusUpdate: (cb: (s: { isLoaded: boolean; didJustFinish?: boolean }) => void) => void };
let current: AvSound | null = null;

/** Plays a sound once in the app (for the picker preview and in-app alerts). Never throws: audio is a nicety, not a requirement. */
export async function playSound(id: NotifSoundId): Promise<void> {
  const entry = NOTIF_SOUNDS.find((s) => s.id === id);
  if (!entry?.source) return;
  try {
    // Lazy so that a problem in the native audio module can never stop the app from starting.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Audio } = require('expo-av') as typeof import('expo-av');
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: false, staysActiveInBackground: false });
    if (current) { const old = current; current = null; await old.unloadAsync().catch(() => {}); }
    const { sound } = await Audio.Sound.createAsync(entry.source, { shouldPlay: true });
    current = sound as unknown as AvSound;
    sound.setOnPlaybackStatusUpdate((s) => { if (s.isLoaded && s.didJustFinish) { void sound.unloadAsync().catch(() => {}); if (current === (sound as unknown as AvSound)) current = null; } });
  } catch { /* no audio available */ }
}

/** Android: make the chosen sound the one used by order and promo notifications. No-op elsewhere. */
export async function applyNotificationSound(id: NotifSoundId): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Promise.all([
      ...NOTIF_SOUNDS.filter((s) => s.id !== id).map((s) => Notifications.deleteNotificationChannelAsync(channelFor(s.id)).catch(() => {})),
      Notifications.deleteNotificationChannelAsync('orders').catch(() => {}),
    ]);
    await Notifications.setNotificationChannelAsync(channelFor(id), {
      name: 'Order updates', importance: Notifications.AndroidImportance.HIGH, lightColor: '#FF5A1F',
      sound: soundFile(id), enableVibrate: true, vibrationPattern: [0, 250, 150, 250],
    });
  } catch { /* notifications not available (for example, permission denied) */ }
}

/** Live mode: tell the server which sound and channel to use for this customer's pushes. */
export async function syncSoundToServer(uid: string, id: NotifSoundId): Promise<void> {
  try {
    const { data } = await supabase.from('profiles').select('push_token').eq('id', uid).maybeSingle();
    const token = (data?.push_token ?? null) as Record<string, unknown> | null;
    if (!token) return;
    await supabase.from('profiles').update({ push_token: { ...token, sound: id, channel: channelFor(id) } }).eq('id', uid);
  } catch { /* offline: it will sync the next time push registers */ }
}
