import * as Haptics from 'expo-haptics';
import { useSettings } from '@/stores/settings';
import { DEFAULT_SOUND, isSoundId, playSound } from '@/lib/sounds';

const soundOn = () => useSettings.getState().sounds;
const hapticsOn = () => useSettings.getState().haptics;

/** Light tap for buttons, counter steps and OTP digits. */
export const tap = () => { if (hapticsOn()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); };
export const tick = () => { if (hapticsOn()) Haptics.selectionAsync().catch(() => {}); };
export const success = () => { if (hapticsOn()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); };
export const warn = () => { if (hapticsOn()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}); };
export const thud = () => { if (hapticsOn()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}); };

/** Delivery chime: a haptic, plus the customer's chosen notification sound when sounds are on. */
export async function chime() {
  success();
  if (!soundOn()) return;
  const id = useSettings.getState().notifSound;
  await playSound(isSoundId(id) ? id : DEFAULT_SOUND);
}
