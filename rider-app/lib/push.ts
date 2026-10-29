import { Platform } from 'react-native';
import { supabase } from './supabase';
import { LIVE } from './config';

const ONESIGNAL_APP_ID = '1220ba48-ec1a-4deb-9cf2-0a0e223b3ee8';

/** Register the signed-in rider as a OneSignal subscriber. */
export async function registerRiderPush(userId: string) {
  if (!LIVE || !userId) return { provider: 'none' as const };
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { OneSignal } = require('react-native-onesignal') as typeof import('react-native-onesignal');
  OneSignal.initialize(ONESIGNAL_APP_ID);
  await OneSignal.Notifications.requestPermission(true);
  OneSignal.login(userId);
  const { error } = await supabase.from('profiles').update({
    push_token: { provider: 'onesignal', platform: Platform.OS, token: userId },
  }).eq('id', userId);
  if (error) throw error;
  return { provider: 'onesignal' as const };
}
