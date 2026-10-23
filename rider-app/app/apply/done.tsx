import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import { Button, Page, Txt } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { VEHICLES } from '@/lib/validation';
import { useApply } from '@/stores/apply';

export default function ApplyDone() {
  const p = useTheme();
  const r = useRouter();
  const a = useApply();
  const { confirm } = useLocalSearchParams<{ confirm?: string }>();
  const vehicle = a.type && a.vehicle ? VEHICLES[a.type].find((v) => v.id === a.vehicle)?.label : '';
  return (
    <Page back={false} footer={<Button label="Back to start" onPress={() => { a.reset(); r.replace('/'); }} />}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 }}>
        <CheckCircle2 color={p.ok} size={72} />
        <Txt size={26} weight="display" align="center">Application received</Txt>
        <Txt size={16} color={p.mute} align="center">{a.type === 'fleet' ? 'ChowBuy Fleet' : 'ChowBuy Partner'} · {vehicle}</Txt>
        <Txt size={15} color={p.mute} align="center">{confirm ? `Confirm your email first: we sent a link to ${a.email}. Then sign in to add your documents. ` : 'Sign in to add your identity and vehicle documents (KYC). '}ChowBuy reviews every application and you will be able to go online once your account is approved.</Txt>
      </View>
    </Page>
  );
}
