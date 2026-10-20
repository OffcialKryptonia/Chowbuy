import * as Haptics from 'expo-haptics';
import { useSettings } from '@/stores/settings';

const hapticsOn = () => useSettings.getState().haptics;

/** Light tap for buttons, counter steps and OTP digits. */
export const tap = () => { if (hapticsOn()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); };
export const tick = () => { if (hapticsOn()) Haptics.selectionAsync().catch(() => {}); };
export const success = () => { if (hapticsOn()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); };
export const warn = () => { if (hapticsOn()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}); };
export const thud = () => { if (hapticsOn()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}); };

/**
 * Delivery chime. Haptic only for now: expo-av was removed because its native module crashed some Android launches
 * (NullPointerException in AVManager.installJSIBindings). Re-add an audio chime with expo-audio when upgrading past SDK 51.
 */
export async function chime() {
  success();
}
