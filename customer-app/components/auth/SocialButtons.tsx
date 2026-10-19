import React, { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { fonts, radius, useResolvedScheme, useTheme } from '@/lib/theme';
import { Txt } from '@/components/ui';
import { usePublicConfig } from '@/hooks/usePublicConfig';
import { useAuth } from '@/stores/auth';
import { tap, warn } from '@/lib/sound-effects';

export function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
      <Path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <Path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z" />
      <Path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
    </Svg>
  );
}

export function AppleLogo({ size = 20, color = '#000' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path fill={color} d="M16.4 12.6c0-2.4 2-3.5 2.1-3.6-1.2-1.7-3-1.9-3.6-1.9-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.1 2.5-1.8 3.1-.5 7.6 1.3 10.1.8 1.2 1.8 2.6 3.1 2.5 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.4-.9-2.4-3.8zM14 5.4c.7-.8 1.1-1.9 1-3-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.5z" />
    </Svg>
  );
}

/**
 * "Continue with Google" (Android and iOS) and "Continue with Apple" (iOS only).
 * Each shows only when the Admin has switched it on. Used on both the sign-in and the create-account screens.
 */
export function SocialButtons({ onError }: { onError: (m: string) => void }) {
  const p = useTheme();
  const dark = useResolvedScheme() === 'dark';
  const cfg = usePublicConfig().data;
  const auth = useAuth();
  const [busy, setBusy] = useState<null | 'google' | 'apple'>(null);
  const google = !!cfg.auth?.google?.enabled;
  const apple = !!cfg.auth?.apple?.enabled && Platform.OS === 'ios';
  if (!google && !apple) return null;

  const run = async (which: 'google' | 'apple') => {
    tap(); setBusy(which); onError('');
    try { await (which === 'google' ? auth.signInGoogle() : auth.signInApple()); }
    catch (e) { warn(); onError(e instanceof Error ? e.message : 'Something went wrong. Please try again.'); }
    finally { setBusy(null); }
  };
  const base = { minHeight: 52, borderRadius: radius.pill, borderWidth: 1, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 10, paddingHorizontal: 20 };

  return (
    <View style={{ gap: 10 }}>
      {apple ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Continue with Apple" disabled={!!busy} onPress={() => void run('apple')}
          style={({ pressed }) => [base, { backgroundColor: dark ? '#fff' : '#000', borderColor: dark ? '#fff' : '#000', opacity: busy ? 0.6 : pressed ? 0.88 : 1 }]}>
          {busy === 'apple' ? <ActivityIndicator color={dark ? '#000' : '#fff'} /> : <AppleLogo size={20} color={dark ? '#000' : '#fff'} />}
          <Text style={{ color: dark ? '#000' : '#fff', fontFamily: fonts.bold, fontSize: 16 }}>Continue with Apple</Text>
        </Pressable>
      ) : null}
      {google ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Continue with Google" disabled={!!busy} onPress={() => void run('google')}
          style={({ pressed }) => [base, { backgroundColor: '#fff', borderColor: p.line, opacity: busy ? 0.6 : pressed ? 0.88 : 1 }]}>
          {busy === 'google' ? <ActivityIndicator color="#444" /> : <GoogleLogo size={20} />}
          <Text style={{ color: '#1F1F1F', fontFamily: fonts.bold, fontSize: 16 }}>Continue with Google</Text>
        </Pressable>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: p.line }} /><Txt size={12} color={p.mute}>or use your email</Txt><View style={{ flex: 1, height: 1, backgroundColor: p.line }} />
      </View>
    </View>
  );
}
