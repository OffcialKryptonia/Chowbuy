import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { OneSignal } from 'react-native-onesignal';
import { supabase } from './supabase';
import { DEMO } from './config';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
});

/**
 * Two interchangeable providers. Expo/FCM is the default; when the Admin turns on OneSignal and supplies the App ID in the
 * public config, the app registers there instead. Server-side keys (FCM service account, OneSignal REST key) stay on the server.
 */
export async function registerPush(opts: { oneSignalAppId?: string; useOneSignal: boolean; userId: string }) {
  if (DEMO) return { provider: 'demo' as const };
  if (opts.useOneSignal && opts.oneSignalAppId) {
    OneSignal.initialize(opts.oneSignalAppId);
    await OneSignal.Notifications.requestPermission(true);
    OneSignal.login(opts.userId);
    await supabase.from('profiles').update({ push_token: { provider: 'onesignal', platform: Platform.OS, token: opts.userId } }).eq('id', opts.userId);   // lets Admin count and target this device
    return { provider: 'onesignal' as const };
  }
  const perm = await Notifications.requestPermissionsAsync();
  if (!perm.granted) return { provider: 'none' as const };
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('orders', { name: 'Order updates', importance: Notifications.AndroidImportance.HIGH, lightColor: '#FF5A1F' });
  }
  // Expo push token: the server (admin-broadcast) sends through the Expo push service, which delivers via FCM on Android and APNs on iOS.
  const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ?? Constants.easConfig?.projectId;
  const t = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  await supabase.from('profiles').update({ push_token: { provider: 'expo', platform: Platform.OS, token: t.data } }).eq('id', opts.userId);
  return { provider: 'expo' as const };
}
