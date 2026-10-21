import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View, type StyleProp, type TextInputProps, type TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { fonts, useTheme } from '@/lib/theme';

export const tap = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); };

export function Txt({ children, size = 15, weight = 'body', color, style, align }: { children: React.ReactNode; size?: number; weight?: keyof typeof fonts; color?: string; style?: StyleProp<TextStyle>; align?: 'left' | 'center' | 'right' }) {
  const p = useTheme();
  return <Text style={[{ color: color ?? p.ink, fontSize: size, fontFamily: fonts[weight], lineHeight: Math.round(size * 1.35), textAlign: align }, style]}>{children}</Text>;
}

export function Button({ label, onPress, variant = 'primary', disabled, loading }: { label: string; onPress: () => void; variant?: 'primary' | 'soft' | 'brand'; disabled?: boolean; loading?: boolean }) {
  const p = useTheme();
  const v = { primary: { bg: p.btn, fg: p.btnInk }, soft: { bg: p.fill, fg: p.ink }, brand: { bg: p.brand, fg: '#FFFFFF' } }[variant];
  const off = disabled || loading;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!off }} disabled={off} onPress={() => { tap(); onPress(); }}
      style={({ pressed }) => ({ height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: off ? p.fill : v.bg, opacity: pressed ? 0.85 : 1 })}>
      {loading ? <ActivityIndicator color={v.fg} /> : <Txt size={16} weight="bold" color={off ? p.mute : v.fg}>{label}</Txt>}
    </Pressable>
  );
}

export function BackHeader() {
  const p = useTheme();
  const r = useRouter();
  return (
    <View style={{ height: 52, justifyContent: 'center', paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: p.line }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={10} onPress={() => (r.canGoBack() ? r.back() : r.replace('/'))} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <ArrowLeft color={p.ink} size={24} />
      </Pressable>
    </View>
  );
}

/** Outlined input. The label sits inside as a placeholder, like the reference; `secure` adds a show/hide eye. */
export function Field({ label, error, secure, right, ...rest }: TextInputProps & { label: string; error?: string | null; secure?: boolean; right?: React.ReactNode }) {
  const p = useTheme();
  const [focus, setFocus] = useState(false);
  const [shown, setShown] = useState(false);
  const border = error ? p.bad : focus ? p.ok : p.line;
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 14, borderWidth: focus || error ? 2 : 1.5, borderColor: border, backgroundColor: p.surface, paddingHorizontal: 14 }}>
        <TextInput
          {...rest}
          accessibilityLabel={label}
          placeholder={label}
          placeholderTextColor={p.mute}
          secureTextEntry={secure && !shown}
          onFocus={(e) => { setFocus(true); rest.onFocus?.(e); }}
          onBlur={(e) => { setFocus(false); rest.onBlur?.(e); }}
          style={{ flex: 1, color: p.ink, fontSize: 16, fontFamily: fonts.body, height: '100%' }}
        />
        {secure ? (
          <Pressable accessibilityRole="button" accessibilityLabel={shown ? 'Hide password' : 'Show password'} hitSlop={10} onPress={() => setShown((s) => !s)}>
            {shown ? <EyeOff color={p.ink} size={22} /> : <Eye color={p.ink} size={22} />}
          </Pressable>
        ) : right}
      </View>
      {error ? <Txt size={12} color={p.bad} style={{ marginTop: 6 }}>{error}</Txt> : null}
    </View>
  );
}

/** Page frame: back header, scrolling body, and a footer pinned above the keyboard. */
export function Page({ children, footer, back = true }: { children: React.ReactNode; footer?: React.ReactNode; back?: boolean }) {
  const p = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }}>
      {back ? <BackHeader /> : null}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }} keyboardShouldPersistTaps="handled">
          <View style={{ width: '100%', maxWidth: 560, padding: 20, paddingTop: 24, gap: 16, flexGrow: 1 }}>{children}</View>
        </ScrollView>
        {footer ? <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center', padding: 20, gap: 14 }}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
