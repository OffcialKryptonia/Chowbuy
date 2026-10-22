import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Txt, Button } from '@/components/ui';
import { Card, Heading, Pill } from '@/components/kit';
import { SosButton } from '@/components/Sos';
import { useTheme } from '@/lib/theme';
import { naira } from '@/lib/format';
import { STEPS } from '@/lib/delivery';
import { COD_PAUSE_LIMIT } from '@/lib/cod';
import { useRider } from '@/stores/rider';
import { useApply } from '@/stores/apply';

export default function Deliveries() {
  const p = useTheme();
  const r = useRouter();
  const fleet = useApply((s) => s.type) === 'fleet';
  const { active, history, unremitted, remit } = useRider();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 110, gap: 14, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
        <Txt size={24} weight="display">Deliveries</Txt>
        <Heading>Active</Heading>
        {active ? (
          <Card onPress={() => r.push(`/delivery/${active.order.id}`)} label="Open active delivery" style={{ borderColor: p.brand }}>
            <Pill label={STEPS[active.stage].label} color={p.info} />
            <Txt size={16} weight="bold">{active.order.merchant}</Txt>
            <Txt size={13} color={p.mute}>{active.order.id} · {active.order.drop}</Txt>
          </Card>
        ) : <Card><Txt size={14} color={p.mute}>No active delivery. Go online and wait for an order.</Txt></Card>}

        {unremitted > 0 ? (
          <Card style={{ borderColor: unremitted > COD_PAUSE_LIMIT ? p.bad : p.line }}>
            <Txt size={15} weight="bold">Cash in hand: {naira(unremitted)}</Txt>
            <Txt size={13} color={p.mute}>Cash orders pause when you hold more than {naira(COD_PAUSE_LIMIT)}. Pay in to your ChowBuy hub or by transfer.</Txt>
            <Button label={`Pay in ${naira(unremitted)}`} variant="soft" onPress={() => remit(unremitted)} />
          </Card>
        ) : null}

        <Heading>History</Heading>
        {history.length === 0 ? <Card><Txt size={14} color={p.mute}>Completed deliveries will show here.</Txt></Card> : history.map((h) => (
          <Card key={h.id}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Txt size={15} weight="bold">{h.merchant}</Txt>
              {fleet ? null : <Txt size={15} weight="bold" color={p.ok}>{naira(h.net)}</Txt>}
            </View>
            <Txt size={13} color={p.mute}>{h.id} · {h.km.toFixed(1)} km · {h.minutes} min · {new Date(h.at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</Txt>
            {h.cod > 0 ? <Txt size={12} color={p.mute}>Cash collected: {naira(h.cod)}</Txt> : null}
          </Card>
        ))}
      </ScrollView>
      <SosButton bottom={20} />
    </SafeAreaView>
  );
}
