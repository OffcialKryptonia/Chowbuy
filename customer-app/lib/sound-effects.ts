import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useSettings } from '@/stores/settings';

const hapticsOn = () => useSettings.getState().haptics;
const soundOn = () => useSettings.getState().sounds;

let sound: Audio.Sound | null = null;

/** Light tap for buttons, counter steps and OTP digits. */
export const tap = () => { if (hapticsOn()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); };
export const tick = () => { if (hapticsOn()) Haptics.selectionAsync().catch(() => {}); };
export const success = () => { if (hapticsOn()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); };
export const warn = () => { if (hapticsOn()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}); };
export const thud = () => { if (hapticsOn()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}); };

/** Delivery chime. The asset is optional so the app still runs if it is missing from the bundle. */
export async function chime() {
  success();
  if (!soundOn()) return;
  try {
    if (!sound) {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: false, staysActiveInBackground: false });
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { sound: s } = await Audio.Sound.createAsync(require('../assets/chime.wav'));
      sound = s;
    }
    await sound.replayAsync();
  } catch { /* no chime asset or audio unavailable: haptic already fired */ }
}
