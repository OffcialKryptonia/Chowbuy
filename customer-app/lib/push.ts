import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';
import { DEMO } from './config';
import { applyNotificationSound, channelFor, DEFAULT_SOUND, isSoundId } from './sounds';
import { useSettings } from '@/stores/settings';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
});

/**
 * Two interchangeable providers. Expo/FCM is the default; when the Admin turns on OneSignal and supplies the App ID in the
 * public config, the app registers there instead. Server-side keys (FCM service account, OneSignal REST key) stay on the server.
 */
export async function registerPush(opts: { oneSignalAppId?: string; useOneSignal: boolean; userId: string }) {
  if (DEMO) return { provider: 'demo' as const };
  if (opts.oneSignalAppId) {   // OneSignal is used whenever Admin has saved its App ID; Expo remains only as a fallback for builds without it
    // Lazy-load: the native module may be absent in some builds, and importing it eagerly would crash the app at launch.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { OneSignal } = require('react-native-onesignal') as typeof import('react-native-onesignal');
    OneSignal.initialize(opts.oneSignalAppId);
    await OneSignal.Notifications.requestPermission(true);
    OneSignal.login(opts.userId);
    await supabase.from('profiles').update({ push_token: { provider: 'onesignal', platform: Platform.OS, token: opts.userId } }).eq('id', opts.userId);   // lets Admin count and target this device
    return { provider: 'onesignal' as const };
  }
  const perm = await Notifications.requestPermissionsAsync();
  if (!perm.granted) return { provider: 'none' as const };
  const chosen = useSettings.getState().notifSound;
  const sound = isSoundId(chosen) ? chosen : DEFAULT_SOUND;
  await applyNotificationSound(sound);
  // Expo push token: the server (admin-broadcast) sends through the Expo push service, which delivers via FCM on Android and APNs on iOS.
  const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ?? Constants.easConfig?.projectId;
  const t = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  await supabase.from('profiles').update({ push_token: { provider: 'expo', platform: Platform.OS, token: t.data, sound, channel: channelFor(sound) } }).eq('id', opts.userId);
  return { provider: 'expo' as const };
}
