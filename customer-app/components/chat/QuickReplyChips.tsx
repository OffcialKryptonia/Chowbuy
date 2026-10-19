import React from 'react';
import { ScrollView } from 'react-native';
import { Chip } from '@/components/ui';
import { CUSTOMER_CHIPS } from '@/lib/mock';

export function QuickReplyChips({ onPick, landmark, chips = CUSTOMER_CHIPS }: { onPick: (t: string) => void; landmark?: string; chips?: string[] }) {
  const all = landmark ? [...chips, `Nearest landmark is ${landmark}.`] : chips;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 8 }} keyboardShouldPersistTaps="handled">
      {all.map((c) => <Chip key={c} label={c} onPress={() => onPick(c)} />)}
    </ScrollView>
  );
}
