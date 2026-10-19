import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, X, ThumbsUp, type LucideIcon } from 'lucide-react-native';
import { router } from 'expo-router';
import { radius, fonts, useTheme } from '@/lib/theme';
import { tap } from '@/lib/sound-effects';

type Tone = 'brand' | 'ok' | 'warn' | 'bad' | 'neutral';
export function toneColors(p: ReturnType<typeof useTheme>, t: Tone) {
  switch (t) {
    case 'brand': return { bg: p.brandSoft, fg: p.brandInk };
    case 'ok': return { bg: p.okSoft, fg: p.ok };
    case 'warn': return { bg: p.warnSoft, fg: p.warn };
    case 'bad': return { bg: p.badSoft, fg: p.bad };
    default: return { bg: p.fill, fg: p.mute };
  }
}

export function Txt({ children, size = 15, weight = 'body', color, style, numberOfLines, align }: { children: React.ReactNode; size?: number; weight?: 'body' | 'semi' | 'bold' | 'display' | 'displayX'; color?: string; style?: StyleProp<TextStyle>; numberOfLines?: number; align?: 'left' | 'center' | 'right' }) {
  const p = useTheme();
  return <Text numberOfLines={numberOfLines} allowFontScaling style={[{ color: color ?? p.ink, fontSize: size, fontFamily: fonts[weight], textAlign: align, lineHeight: Math.round(size * 1.35) }, style]}>{children}</Text>;
}

export function Screen({ children, scroll = true, pad = true, edges = ['top'], footer, refreshing }: { children: React.ReactNode; scroll?: boolean; pad?: boolean; edges?: ('top' | 'bottom' | 'left' | 'right')[]; footer?: React.ReactNode; refreshing?: boolean }) {
  const p = useTheme();
  const body = scroll ? (
    <ScrollView contentContainerStyle={{ padding: pad ? 16 : 0, paddingBottom: 32, gap: 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView>
  ) : <View style={{ flex: 1, padding: pad ? 16 : 0 }}>{children}</View>;
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: p.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {body}
        {footer}
      </KeyboardAvoidingView>
      {refreshing ? <ActivityIndicator style={StyleSheet.absoluteFill} color={p.brand} /> : null}
    </SafeAreaView>
  );
}

export function Card({ children, style, onPress, pad = 16 }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; pad?: number }) {
  const p = useTheme();
  const base: ViewStyle = { backgroundColor: p.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: p.line, padding: pad };
  if (onPress) return <Pressable accessibilityRole="button" onPress={() => { tap(); onPress(); }} style={({ pressed }) => [base, { opacity: pressed ? 0.85 : 1 }, style]}>{children}</Pressable>;
  return <View style={[base, style]}>{children}</View>;
}

export function Button({ label, onPress, icon: Icon, variant = 'primary', disabled, loading, small, full = true, tone }: { label: string; onPress: () => void; icon?: LucideIcon; variant?: 'primary' | 'ghost' | 'soft' | 'danger' | 'ok'; disabled?: boolean; loading?: boolean; small?: boolean; full?: boolean; tone?: string }) {
  const p = useTheme();
  const v = {
    primary: { bg: p.brand, fg: '#fff', bd: p.brand },
    ok: { bg: p.ok, fg: '#fff', bd: p.ok },
    soft: { bg: p.brandSoft, fg: p.brandInk, bd: p.brandSoft },
    ghost: { bg: 'transparent', fg: p.ink, bd: p.line },
    danger: { bg: p.badSoft, fg: p.bad, bd: p.badSoft },
  }[variant];
  const off = disabled || loading;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!off, busy: !!loading }} disabled={off}
      onPress={() => { tap(); onPress(); }}
      style={({ pressed }) => [{ backgroundColor: v.bg, borderColor: v.bd, borderWidth: 1, borderRadius: radius.pill, minHeight: small ? 38 : 52, paddingHorizontal: small ? 14 : 20, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, opacity: off ? 0.5 : pressed ? 0.88 : 1, alignSelf: full ? 'stretch' : 'flex-start' }]}>
      {loading ? <ActivityIndicator color={v.fg} /> : Icon ? <Icon size={small ? 16 : 18} color={tone ?? v.fg} /> : null}
      <Text style={{ color: tone ?? v.fg, fontFamily: fonts.bold, fontSize: small ? 13 : 16 }}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({ icon: Icon, onPress, label, size = 44, tint, bg }: { icon: LucideIcon; onPress: () => void; label: string; size?: number; tint?: string; bg?: string }) {
  const p = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={8} onPress={() => { tap(); onPress(); }}
      style={({ pressed }) => ({ width: size, height: size, borderRadius: size / 2, backgroundColor: bg ?? p.surface, borderWidth: 1, borderColor: p.line, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}>
      <Icon size={size * 0.46} color={tint ?? p.ink} />
    </Pressable>
  );
}

export function Pill({ label, tone = 'neutral', icon: Icon }: { label: string; tone?: Tone; icon?: LucideIcon }) {
  const p = useTheme();
  const c = toneColors(p, tone);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' }}>
      {Icon ? <Icon size={12} color={c.fg} /> : null}
      <Text style={{ color: c.fg, fontFamily: fonts.bold, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

export function Chip({ label, selected, onPress, icon: Icon }: { label: string; selected?: boolean; onPress: () => void; icon?: LucideIcon }) {
  const p = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!selected }} onPress={() => { tap(); onPress(); }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1, borderColor: selected ? p.brand : p.line, backgroundColor: selected ? p.brandSoft : p.surface }}>
      {Icon ? <Icon size={14} color={selected ? p.brandInk : p.mute} /> : null}
      <Text style={{ color: selected ? p.brandInk : p.ink, fontFamily: fonts.semi, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export function Avatar({ name, size = 44, tint }: { name: string; size?: number; tint?: string }) {
  const p = useTheme();
  const t = name.replace(/[^A-Za-z0-9 ]/g, '').split(/\s+/).filter(Boolean);
  const text = ((t[0]?.[0] ?? '?') + (t[1]?.[0] ?? '')).toUpperCase();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: tint ?? p.brand, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontFamily: fonts.display, fontSize: size * 0.36 }}>{text}</Text>
    </View>
  );
}

export function Header({ title, subtitle, back = true, right }: { title: string; subtitle?: string; back?: boolean; right?: React.ReactNode }) {
  const p = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      {back ? <IconButton icon={ChevronLeft} label="Go back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} /> : null}
      <View style={{ flex: 1 }}>
        <Txt size={22} weight="display" numberOfLines={1}>{title}</Txt>
        {subtitle ? <Txt size={13} color={p.mute} numberOfLines={1}>{subtitle}</Txt> : null}
      </View>
      {right}
    </View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const p = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Txt size={18} weight="display">{title}</Txt>
      {action ? <Pressable hitSlop={8} onPress={onAction}><Txt size={14} weight="bold" color={p.brand}>{action}</Txt></Pressable> : null}
    </View>
  );
}

export function Field({ label, error, ...rest }: TextInputProps & { label: string; error?: string | null }) {
  const p = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Txt size={13} weight="bold" color={p.mute}>{label}</Txt>
      <TextInput accessibilityLabel={label} placeholderTextColor={p.mute} {...rest}
        style={[{ borderWidth: 1, borderColor: error ? p.bad : p.line, backgroundColor: p.surface, color: p.ink, borderRadius: radius.md, paddingHorizontal: 14, minHeight: 50, fontFamily: fonts.body, fontSize: 16 }, rest.multiline ? { minHeight: 90, paddingTop: 12, textAlignVertical: 'top' } : null, rest.style]} />
      {error ? <Txt size={12} color={p.bad}>{error}</Txt> : null}
    </View>
  );
}

export function Empty({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body: string; action?: React.ReactNode }) {
  const p = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: 10, paddingVertical: 40, paddingHorizontal: 24 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: p.brandSoft, alignItems: 'center', justifyContent: 'center' }}><Icon size={28} color={p.brand} /></View>
      <Txt size={18} weight="display" align="center">{title}</Txt>
      <Txt size={14} color={p.mute} align="center">{body}</Txt>
      {action}
    </View>
  );
}

export function Sheet({ visible, onClose, title, children, tall }: { visible: boolean; onClose: () => void; title?: string; children: React.ReactNode; tall?: boolean }) {
  const p = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={{ flex: 1, backgroundColor: p.overlay }} onPress={onClose} accessibilityLabel="Close sheet" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView edges={['bottom']} style={{ backgroundColor: p.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: tall ? '92%' : '80%' }}>
          <View style={{ alignItems: 'center', paddingTop: 8 }}><View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: p.line }} /></View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 }}>
            <Txt size={20} weight="display" style={{ flex: 1 }}>{title ?? ''}</Txt>
            <IconButton icon={X} label="Close" size={36} onPress={onClose} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }} keyboardShouldPersistTaps="handled">{children}</ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function Row({ children, gap = 10, style }: { children: React.ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function ThumbPair({ value, onChange, label }: { value: boolean | null; onChange: (v: boolean) => void; label: string }) {
  const p = useTheme();
  const btn = (up: boolean) => {
    const on = value === up;
    const color = up ? p.ok : p.bad;
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${up ? 'thumbs up' : 'thumbs down'}`} accessibilityState={{ selected: on }}
        onPress={() => { tap(); onChange(up); }}
        style={{ flex: 1, height: 64, borderRadius: radius.lg, borderWidth: 2, borderColor: on ? color : p.line, backgroundColor: on ? (up ? p.okSoft : p.badSoft) : p.surface, alignItems: 'center', justifyContent: 'center' }}>
        <View style={up ? undefined : { transform: [{ rotate: '180deg' }] }}><ThumbsUp size={28} color={on ? color : p.mute} fill={on ? color : 'transparent'} /></View>
      </Pressable>
    );
  };
  return <Row gap={12}>{btn(true)}{btn(false)}</Row>;
}

/* ---- toast ---- */
const ToastCtx = createContext<(m: string, kind?: 'ok' | 'bad' | 'info') => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const p = useTheme();
  const [msg, setMsg] = useState<{ m: string; k: string } | null>(null);
  const y = useRef(new Animated.Value(-80)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((m: string, k: 'ok' | 'bad' | 'info' = 'info') => {
    setMsg({ m, k });
    Animated.spring(y, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => Animated.timing(y, { toValue: -120, duration: 220, useNativeDriver: true }).start(() => setMsg(null)), 2800);
  }, [y]);
  const val = useMemo(() => show, [show]);
  return (
    <ToastCtx.Provider value={val}>
      {children}
      {msg ? (
        <SafeAreaView edges={['top']} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0 }}>
          <Animated.View accessibilityLiveRegion="polite" style={{ transform: [{ translateY: y }], marginHorizontal: 16, marginTop: 8, padding: 14, borderRadius: radius.md, backgroundColor: msg.k === 'bad' ? p.bad : msg.k === 'ok' ? p.ok : p.ink }}>
            <Text style={{ color: msg.k === 'info' ? p.bg : '#fff', fontFamily: fonts.semi, fontSize: 14 }}>{msg.m}</Text>
          </Animated.View>
        </SafeAreaView>
      ) : null}
    </ToastCtx.Provider>
  );
}
