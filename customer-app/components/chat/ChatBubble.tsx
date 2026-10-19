import React from 'react';
import { View } from 'react-native';
import { CheckCheck, Info } from 'lucide-react-native';
import { Txt } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { clock } from '@/lib/format';
import type { ChatMessage } from '@/lib/types';

export function ChatBubble({ m }: { m: ChatMessage }) {
  const p = useTheme();
  if (m.from === 'system') {
    return <View style={{ alignSelf: 'center', flexDirection: 'row', gap: 6, backgroundColor: p.fill, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}><Info size={13} color={p.mute} /><Txt size={12} color={p.mute}>{m.text}</Txt></View>;
  }
  const me = m.from === 'customer';
  return (
    <View style={{ alignSelf: me ? 'flex-end' : 'flex-start', maxWidth: '82%' }} accessible accessibilityLabel={`${me ? 'You' : 'Rider'}: ${m.text}, ${clock(m.at)}`}>
      <View style={{ backgroundColor: me ? p.brand : p.surface, borderWidth: me ? 0 : 1, borderColor: p.line, borderRadius: 18, borderBottomRightRadius: me ? 4 : 18, borderBottomLeftRadius: me ? 18 : 4, paddingHorizontal: 14, paddingVertical: 10 }}>
        <Txt size={15} color={me ? '#fff' : p.ink}>{m.text}</Txt>
      </View>
      <View style={{ flexDirection: 'row', gap: 4, alignSelf: me ? 'flex-end' : 'flex-start', marginTop: 3, alignItems: 'center' }}>
        <Txt size={11} color={p.mute}>{clock(m.at)}</Txt>
        {me ? <CheckCheck size={13} color={p.ok} /> : null}
      </View>
    </View>
  );
}
