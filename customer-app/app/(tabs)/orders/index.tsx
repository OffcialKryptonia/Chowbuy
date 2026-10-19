import React from 'react';
import { Image, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, Clock, Receipt, RotateCcw, Star } from 'lucide-react-native';
import { Button, Card, Empty, Header, Pill, Row, SectionTitle, Screen, Txt, useToast } from '@/components/ui';
import { useOrders, isActive } from '@/stores/orders';
import { useCart } from '@/stores/cart';
import { useTheme } from '@/lib/theme';
import { stageLabel } from '@/lib/mock';
import { dateTime, ngn } from '@/lib/format';
import { addLine } from '@/lib/smart-cart';
import type { Order } from '@/lib/types';

function OrderCard({ o }: { o: Order }) {
  const p = useTheme();
  const toast = useToast();
  const active = isActive(o);
  const label = stageLabel(o.stage);
  const reorder = () => {
    const cart = useCart.getState();
    useCart.setState({ merchant: o.merchant, promo: null, lines: o.lines.reduce((acc, l) => addLine(acc, { id: l.productId, merchantId: l.merchantId, name: l.name, desc: '', price: l.unitPrice - l.mods.reduce((a, m) => a + m.price, 0), image: '', category: '', modifiers: [], inStock: true }, l.mods, l.qty, l.note), [] as typeof cart.lines) });
    toast('Items added to your basket');
    router.push('/checkout');
  };
  return (
    <Card onPress={() => router.push(`/orders/${o.id}/track`)} pad={14}>
      <Row gap={12}>
        <Image source={{ uri: o.merchant.image }} accessibilityIgnoresInvertColors style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: p.fill }} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt size={16} weight="bold" numberOfLines={1}>{o.merchant.name}</Txt>
          <Txt size={12} color={p.mute}>{o.id} · {dateTime(o.placedAt)}</Txt>
          <Txt size={13} color={p.mute} numberOfLines={1}>{o.lines.map((l) => `${l.qty}× ${l.name}`).join(', ')}</Txt>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <Txt size={15} weight="bold">{ngn(o.total)}</Txt>
          <Pill label={label} tone={active ? 'brand' : o.stage === 'cancelled' ? 'bad' : 'ok'} />
        </View>
      </Row>
      {active ? (
        <Row gap={6} style={{ marginTop: 12 }}><Clock size={14} color={p.brand} /><Txt size={13} weight="semi" color={p.brandInk}>{o.etaMinutes} min away · Tap to track</Txt><View style={{ flex: 1 }} /><ChevronRight size={16} color={p.mute} /></Row>
      ) : (
        <Row gap={8} style={{ marginTop: 12 }}>
          <View style={{ flex: 1 }}><Button small variant="soft" icon={RotateCcw} label="Reorder" onPress={reorder} /></View>
          {!o.reviewed && o.stage === 'delivered' ? <View style={{ flex: 1 }}><Button small icon={Star} label="Rate order" onPress={() => router.push(`/orders/${o.id}/review`)} /></View> : null}
        </Row>
      )}
    </Card>
  );
}

export default function Orders() {
  const orders = useOrders((s) => s.orders);
  const live = orders.filter(isActive);
  const past = orders.filter((o) => !isActive(o));
  return (
    <Screen>
      <Header title="Orders" back={false} />
      {!orders.length ? <Empty icon={Receipt} title="No orders yet" body="Your active deliveries and past orders will show up here." action={<Button full={false} label="Browse restaurants" onPress={() => router.push('/')} />} /> : null}
      {live.length ? <><SectionTitle title="Active" />{live.map((o) => <OrderCard key={o.id} o={o} />)}</> : null}
      {past.length ? <><SectionTitle title="Past orders" />{past.map((o) => <OrderCard key={o.id} o={o} />)}</> : null}
    </Screen>
  );
}
