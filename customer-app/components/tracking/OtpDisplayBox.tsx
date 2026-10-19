import React from 'react';
import { View } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { Txt } from '@/components/ui';
import { useTheme, radius } from '@/lib/theme';
import { useSession } from '@/stores/session';

/** The 4-digit handover code. The rider app cannot complete the delivery without entering exactly this code. */
export function OtpDisplayBox({ code, readyInMin }: { code: string; readyInMin?: number }) {
  const p = useTheme();
  const name = useSession((s) => s.name.split(' ')[0]);
  const digits = code.split('');
  return (
    <View style={{ backgroundColor: p.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: p.line, padding: 20, gap: 14 }}>
      <Txt size={17} weight="display">Hi {name},{readyInMin != null ? ` your order will be ready in ${readyInMin} mins` : ' your order is on its way'}</Txt>
      <View accessible accessibilityLabel={`Delivery code ${digits.join(' ')}`} style={{ flexDirection: 'row', gap: 10, justifyContent: 'center' }}>
        {digits.map((d, i) => (
          <View key={i} style={{ width: 62, height: 76, borderRadius: radius.md, backgroundColor: p.brandSoft, borderWidth: 2, borderColor: p.brand, alignItems: 'center', justifyContent: 'center' }}>
            <Txt size={38} weight="displayX" color={p.brandInk}>{d}</Txt>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
        <ShieldCheck size={16} color={p.ok} />
        <Txt size={13} color={p.mute} align="center">Show this code to your rider to receive your delivery</Txt>
      </View>
    </View>
  );
}
