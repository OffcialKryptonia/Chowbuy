import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Award } from 'lucide-react-native';
import { Button, Card, Chip, Field, Header, Row, Screen, SectionTitle, ThumbPair, Txt, useToast } from '@/components/ui';
import { useOrder } from '@/hooks/useOrderTracking';
import { useOrders } from '@/stores/orders';
import { useSession } from '@/stores/session';
import { usePublicConfig } from '@/hooks/usePublicConfig';
import { MERCHANT_TAGS, RIDER_TAGS } from '@/lib/mock';
import { useTheme } from '@/lib/theme';
import { success, warn } from '@/lib/sound-effects';
import { DEMO } from '@/lib/config';
import { useAuth } from '@/stores/auth';
import { loadAccount, submitReview } from '@/lib/backend';

export default function Review() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const p = useTheme();
  const toast = useToast();
  const order = useOrder(orderId);
  const points = usePublicConfig().data.loyalty.reviewPoints;
  const [mUp, setMUp] = useState<boolean | null>(null);
  const [rUp, setRUp] = useState<boolean | null>(null);
  const [mTags, setMTags] = useState<string[]>([]);
  const [rTags, setRTags] = useState<string[]>([]);
  const [text, setText] = useState('');
  const flip = (list: string[], set: (v: string[]) => void, t: string) => set(list.includes(t) ? list.filter((x) => x !== t) : [...list, t]);

  if (!order) return <Screen><Header title="Review" /><Txt color={p.mute}>Order not found.</Txt></Screen>;
  if (order.reviewed) return <Screen><Header title="Review" /><Txt color={p.mute}>You have already reviewed this order. Thank you!</Txt><Button label="Back to orders" onPress={() => router.replace('/orders')} /></Screen>;

  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (mUp === null && rUp === null) { warn(); toast('Tap a thumb for the restaurant or your rider first.', 'bad'); return; }
    const r = { orderId: order.id, merchantUp: mUp, merchantTags: mTags, riderUp: rUp, riderTags: rTags, text: text.trim() };
    if (!DEMO) {
      setBusy(true);
      try {
        const awarded = await submitReview(r);   // the server decides the points and refuses a second review
        useOrders.getState().review(r);
        const u = useAuth.getState().session?.user.id; if (u) void loadAccount(u);
        success(); toast(`Thanks! You earned ${awarded} loyalty points.`, 'ok'); router.replace('/orders');
      } catch (e) { warn(); toast(e instanceof Error ? e.message : 'Could not send your review.', 'bad'); }
      finally { setBusy(false); }
      return;
    }
    useOrders.getState().review({ orderId: order.id, merchantUp: mUp, merchantTags: mTags, riderUp: rUp, riderTags: rTags, text: text.trim() });
    useSession.getState().award(points);
    success();
    toast(`Thanks! You earned ${points} loyalty points.`, 'ok');
    router.replace('/orders');
  };

  return (
    <Screen>
      <Header title="Rate your order" subtitle={`${order.merchant.name} · ${order.id}`} />
      <SectionTitle title={`How was ${order.merchant.name}?`} />
      <Card><ThumbPair label="Merchant" value={mUp} onChange={setMUp} />
        {mUp !== null ? <Row gap={8} style={{ flexWrap: 'wrap', marginTop: 14 }}>{MERCHANT_TAGS.map((t) => <Chip key={t} label={t} selected={mTags.includes(t)} onPress={() => flip(mTags, setMTags, t)} />)}</Row> : null}
      </Card>
      {order.rider ? (
        <>
          <SectionTitle title={`How was ${order.rider.name}?`} />
          <Card><ThumbPair label="Rider" value={rUp} onChange={setRUp} />
            {rUp !== null ? <Row gap={8} style={{ flexWrap: 'wrap', marginTop: 14 }}>{RIDER_TAGS.map((t) => <Chip key={t} label={t} selected={rTags.includes(t)} onPress={() => flip(rTags, setRTags, t)} />)}</Row> : null}
          </Card>
        </>
      ) : null}
      <Field label="Anything else? (optional)" multiline value={text} onChangeText={(t) => setText(t.slice(0, 400))} placeholder="Tell us what went well or what we can improve" />
      <Row gap={8} style={{ alignItems: 'center' }}><Award size={18} color={p.brand} /><Txt size={13} color={p.mute}>Submitting earns you {points} loyalty points.</Txt></Row>
      <View><Button loading={busy} label="Submit Review" onPress={submit} /></View>
    </Screen>
  );
}
