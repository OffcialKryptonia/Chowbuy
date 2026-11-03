import 'react-native-gesture-handler';
import '../global.css';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Sora_700Bold, Sora_800ExtraBold } from '@expo-google-fonts/sora';
import { Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { registerGlobals } from '@livekit/react-native';
import { ToastProvider } from '@/components/ui';
import { useResolvedScheme, light, dark } from '@/lib/theme';
import { useOrderTransport } from '@/hooks/useOrderTracking';
import { registerPush } from '@/lib/push';
import { usePublicConfig } from '@/hooks/usePublicConfig';
import { useSettings, useSettingsHydrated } from '@/stores/settings';
import { Intro } from '@/components/intro/Intro';
import { useAuth } from '@/stores/auth';
import { useBackendSync } from '@/hooks/useBackendSync';
import { SignIn } from '@/components/auth/SignIn';
import { DEMO } from '@/lib/config';

SplashScreen.preventAutoHideAsync().catch(() => {});
try { registerGlobals(); } catch { /* web or test runtime */ }
const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });

function Boot() {
  const scheme = useResolvedScheme();
  const pal = scheme === 'dark' ? dark : light;
  const cfg = usePublicConfig().data;
  const onboarded = useSettings((s) => s.onboarded);
  const auth = useAuth();
  const uid = auth.session?.user.id ?? 'demo';
  useOrderTransport();
  useBackendSync();
  useEffect(() => auth.init(), []);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!DEMO && !auth.session) return; registerPush({ oneSignalAppId: cfg.push.onesignalAppId, useOneSignal: !!cfg.push.onesignalAppId, userId: uid }).catch(() => {}); }, [cfg.push.onesignalAppId, uid]);   // eslint-disable-line react-hooks/exhaustive-deps
  if (!onboarded) return <><StatusBar style={scheme === 'dark' ? 'light' : 'dark'} /><Intro onDone={() => useSettings.getState().set({ onboarded: true })} /></>;
  if (!DEMO && !auth.ready) return null;
  if (!DEMO && !auth.session) return <><StatusBar style={scheme === 'dark' ? 'light' : 'dark'} /><SignIn /></>;
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: pal.bg }, animation: 'slide_from_right' }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="checkout/index" options={{ presentation: 'modal' }} />
        <Stack.Screen name="checkout/share-link" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function Root() {
  const hydrated = useSettingsHydrated();
  const [loaded] = useFonts({ Sora_700Bold, Sora_800ExtraBold, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  useEffect(() => { if (loaded && hydrated) SplashScreen.hideAsync().catch(() => {}); }, [loaded, hydrated]);
  if (!loaded || !hydrated) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={qc}>
          <ToastProvider><Boot /></ToastProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
