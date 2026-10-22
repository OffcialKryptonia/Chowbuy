import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Txt, tap } from '@/components/ui';
import { useTheme } from '@/lib/theme';

export function Card({ children, style, onPress, label }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; label?: string }) {
  const p = useTheme();
  const base: ViewStyle = { backgroundColor: p.surface, borderRadius: 18, borderWidth: 1.5, borderColor: p.line, padding: 16, gap: 10 };
  if (!onPress) return <View style={[base, style]}>{children}</View>;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => { tap(); onPress(); }} style={[base, style]}>{children}</Pressable>;
}

export function Pill({ label, color, soft }: { label: string; color: string; soft?: boolean }) {
  return (
    <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: soft ? color + '26' : color }}>
      <Txt size={12} weight="bold" color={soft ? color : '#fff'}>{label}</Txt>
    </View>
  );
}

export function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  const p = useTheme();
  return (
    <View style={{ flex: 1, minWidth: 100, backgroundColor: p.fill, borderRadius: 14, padding: 12, gap: 2 }}>
      <Txt size={12} color={p.mute} weight="semi">{label}</Txt>
      <Txt size={20} weight="display">{value}</Txt>
      {note ? <Txt size={11} color={p.mute}>{note}</Txt> : null}
    </View>
  );
}

export function IconRow({ icon: Icon, title, note, right, onPress, color }: { icon: LucideIcon; title: string; note?: string; right?: React.ReactNode; onPress?: () => void; color?: string }) {
  const p = useTheme();
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: p.fill, alignItems: 'center', justifyContent: 'center' }}><Icon size={20} color={color ?? p.ink} /></View>
      <View style={{ flex: 1 }}><Txt size={15} weight="bold">{title}</Txt>{note ? <Txt size={13} color={p.mute}>{note}</Txt> : null}</View>
      {right}
    </View>
  );
  return onPress ? <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={() => { tap(); onPress(); }}>{body}</Pressable> : body;
}

export function Heading({ children, note }: { children: string; note?: string }) {
  const p = useTheme();
  return <View style={{ gap: 2, marginTop: 6 }}><Txt size={18} weight="display">{children}</Txt>{note ? <Txt size={13} color={p.mute}>{note}</Txt> : null}</View>;
}

/** Scrolling screen for tab pages (no back arrow, no footer). */
export { Page } from '@/components/ui';
