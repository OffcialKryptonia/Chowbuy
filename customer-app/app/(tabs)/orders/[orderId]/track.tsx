import React, { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { BadgeCheck, ChevronLeft, Link2, MessageCircle, Phone, PhoneCall, ThumbsUp, Wallet, Bike, Car } from 'lucide-react-native';
import { Avatar, Button, Card, Empty, Field, IconButton, Pill, Row, SectionTitle, Sheet, Txt, useToast } from '@/components/ui';
import { DeliveryMapView } from '@/components/map/DeliveryMapView';
import { MilestoneTimeline } from '@/components/tracking/MilestoneTimeline';
import { OtpDisplayBox } from '@/components/tracking/OtpDisplayBox';
import { useOrder } from '@/hooks/useOrderTracking';
import { useDriverChat } from '@/hooks/useDriverChat';
import { stageIndex, useOrders } from '@/stores/orders';
import { useSession } from '@/stores/session';
import { useAuth } from '@/stores/auth';
import { tipRider, loadAccount } from '@/lib/backend';
import { DEMO } from '@/lib/config';
import { useTheme, radius } from '@/lib/theme';
import { clock, etaWindow, ngn } from '@/lib/format';
import { stageLabel } from '@/lib/mock';
import { success, tap, warn } from '@/lib/sound-effects';
import type { LatLng } from '@/lib/types';

const TIPS = [200, 500, 1000];

export default function Track() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const p = useTheme();
  const toast = useToast();
  const order = useOrder(orderId);
  const chat = useDriverChat(orderId ?? '');
  const [tipOpen, setTipOpen] = useState(false);
  const [custom, setCustom] = useState('');

  const progress = useMemo(() => {
    if (!order?.route?.length || !order.riderPos) return 0;
    const rp = order.riderPos;
    let best = 0; let bd = Infinity;
    order.route.forEach((pt: LatLng, i: number) => { const d = (pt.latitude - rp.latitude) ** 2 + (pt.longitude - rp.longitude) ** 2; if (d < bd) { bd = d; best = i; } });
    return best / Math.max(1, order.route.length - 1);
  }, [order?.route, order?.riderPos]);

  if (!order) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }}><View style={{ padding: 16 }}><Empty icon={ChevronLeft} title="Order not found" body="It may have been removed from this device." action={<Button full={false} label="Back to orders" onPress={() => router.replace('/orders')} />} /></View></SafeAreaView>;
  }

  const cancelled = order.stage === 'cancelled';
  const delivered = order.stage === 'delivered' || cancelled;   // both end the live controls
  const idx = stageIndex(order.stage);
  const stage = stageLabel(order.stage);
  const onTime = Date.now() + order.etaMinutes * 60000 <= order.latestBy;
  const rider = order.rider;
  const beforePickup = idx < 3;
  const readyIn = idx <= 1 ? Math.max(1, order.etaMinutes - 12) : undefined;

  const callMasked = async () => {
    if (!rider) return;
    tap();
    // The number is a ChowBuy proxy line, so neither side sees the other's real phone number.
    const url = `tel:${rider.proxyPhone.replace(/\s/g, '')}`;
    if (await Linking.canOpenURL(url)) Linking.openURL(url); else toast('This device cannot place phone calls.', 'bad');
  };

  const sendTip = async (amount: number) => {
    if (!(amount >= 100)) { warn(); toast('Tips start from ₦100.', 'bad'); return; }
    if (!DEMO) {
      try { await tipRider(order.id, amount); const u = useAuth.getState().session?.user.id; if (u) await loadAccount(u); /* server owns tip + wallet: reload, never add locally */ }
      catch (e) { warn(); toast(e instanceof Error ? e.message : 'Could not send the tip.', 'bad'); return; }
      success(); setTipOpen(false); setCustom(''); toast(`${ngn(amount)} tip sent. Thank you!`, 'ok'); return;
    }
    const err = useSession.getState().spend(amount, `Tip for ${rider?.name ?? 'rider'}`);
    if (err) { warn(); toast(err, 'bad'); return; }
    useOrders.getState().setTip(order.id, amount);
    success(); setTipOpen(false); setCustom('');
    toast(`${ngn(amount)} tip sent. Thank you!`, 'ok');
  };

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <View>
        <DeliveryMapView
          merchant={order.merchant.location} customer={order.address.location} route={order.route}
          rider={order.riderPos && rider ? { pos: order.riderPos, heading: order.riderBearing ?? 0, vehicle: rider.vehicle } : null}
          progress={progress} height={340}
          onSearchArea={() => toast('Map refreshed for this area')} />
        <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 12 }}>
          <IconButton icon={ChevronLeft} label="Back to orders" onPress={() => (router.canGoBack() ? router.back() : router.replace('/orders'))} bg={p.surface} />
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Card>
          <Row gap={8} style={{ justifyContent: 'space-between' }}>
            <Pill label={stage} tone={delivered || idx >= 5 ? 'ok' : 'brand'} />
            {!delivered ? <Pill label={onTime ? 'On time' : 'Running late'} tone={onTime ? 'ok' : 'warn'} /> : null}
          </Row>
          {delivered ? (
            <Txt size={22} weight="display" style={{ marginTop: 10 }}>{cancelled ? 'This order was cancelled' : `Delivered${order.stageTimes.delivered ? ` at ${clock(order.stageTimes.delivered)}` : ''}`}</Txt>
          ) : (
            <>
              <Txt size={22} weight="display" style={{ marginTop: 10 }}>{idx >= 4 ? `${order.etaMinutes} min away` : `Arrives between ${etaWindow(order.etaMinutes)}`}</Txt>
              <Txt size={13} color={p.mute}>Latest arrival by {clock(order.latestBy)}</Txt>
            </>
          )}
        </Card>

        {!delivered ? <OtpDisplayBox code={order.otp} readyInMin={readyIn} /> : null}

        {rider ? (
          <Card>
            <Row gap={12}>
              <Avatar name={rider.name} size={52} />
              <View style={{ flex: 1, gap: 2 }}>
                <Row gap={6}><Txt size={17} weight="bold">{rider.name}</Txt>{rider.verified ? <BadgeCheck size={18} color={p.ok} accessibilityLabel="Verified rider" /> : null}</Row>
                <Row gap={6}>{rider.vehicle === 'Bike' ? <Bike size={14} color={p.mute} /> : <Car size={14} color={p.mute} />}<Txt size={13} color={p.mute}>{rider.vehicle} · {rider.plate}</Txt></Row>
              </View>
              <Row gap={4}><ThumbsUp size={15} color={p.ok} fill={p.ok} /><Txt size={14} weight="bold">{rider.rating}%</Txt></Row>
            </Row>
            {!delivered ? (
              <>
                <Row gap={8} style={{ marginTop: 14 }}>
                  <View style={{ flex: 1 }}><Button small variant="ghost" icon={Phone} label="Call Rider" onPress={callMasked} /></View>
                  <View style={{ flex: 1 }}><Button small variant="ghost" icon={PhoneCall} label="In-app call" onPress={() => router.push(`/orders/${order.id}/call`)} /></View>
                </Row>
                <View style={{ marginTop: 8 }}>
                  <Button small icon={MessageCircle} label={chat.unread ? `Chat with rider (${chat.unread} new)` : 'Chat with rider'} onPress={() => router.push(`/orders/${order.id}/chat`)} />
                </View>
                <Txt size={12} color={p.mute} style={{ marginTop: 8 }}>Calls use a private ChowBuy number. Your phone number stays hidden.</Txt>
                {!beforePickup ? <View style={{ marginTop: 10 }}><Button small variant="soft" icon={Wallet} label={order.tip ? `Tip sent ${ngn(order.tip)} · Add more` : 'Tip your rider'} onPress={() => setTipOpen(true)} /></View> : null}
              </>
            ) : null}
          </Card>
        ) : !delivered ? (
          <Card><Txt size={14} color={p.mute}>We are finding the nearest verified rider. You can chat and call as soon as one accepts.</Txt></Card>
        ) : null}

        {!order.paid && !delivered ? (
          <Card>
            <Row gap={10}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: p.brandSoft, alignItems: 'center', justifyContent: 'center' }}><Link2 size={20} color={p.brand} /></View>
              <View style={{ flex: 1 }}>
                <Txt size={15} weight="bold">{order.pay === 'cod' ? 'Pay on delivery' : 'Payment pending'}</Txt>
                <Txt size={13} color={p.mute}>Let a friend or family member pay for this order.</Txt>
              </View>
            </Row>
            <View style={{ marginTop: 12 }}><Button small variant="soft" label={order.paymentLink?.status === 'open' ? 'View payment link' : 'Share your payment link'} onPress={() => router.push({ pathname: '/checkout/share-link', params: { orderId: order.id } })} /></View>
          </Card>
        ) : null}

        <SectionTitle title="Order progress" />
        <Card><MilestoneTimeline order={order} /></Card>

        <SectionTitle title="Order summary" />
        <Card>
          <Txt size={15} weight="bold">{order.merchant.name}</Txt>
          {order.lines.map((l) => <Row key={l.key} style={{ justifyContent: 'space-between', marginTop: 6 }}><Txt size={14} color={p.mute} style={{ flex: 1 }}>{l.qty}× {l.name}</Txt><Txt size={14}>{ngn(l.unitPrice * l.qty)}</Txt></Row>)}
          <View style={{ height: 1, backgroundColor: p.line, marginVertical: 10 }} />
          <Row style={{ justifyContent: 'space-between' }}><Txt size={15} weight="bold">Total</Txt><Txt size={15} weight="bold">{ngn(order.total)}</Txt></Row>
          <Txt size={12} color={p.mute} style={{ marginTop: 4 }}>{order.pay === 'cod' ? 'Cash on delivery' : order.pay === 'wallet' ? 'Paid with wallet' : order.pay === 'korapay' ? 'Card via Korapay' : 'Bank transfer via Pocketfi'} · {order.paid ? 'Paid' : 'Unpaid'}</Txt>
          <Txt size={12} color={p.mute}>Delivering to {order.address.line}, {order.address.area}</Txt>
        </Card>

        {order.stage === 'delivered' && !order.reviewed ? <Button label="Rate your order and earn 50 points" onPress={() => router.push(`/orders/${order.id}/review`)} /> : null}
      </ScrollView>

      <Sheet visible={tipOpen} onClose={() => setTipOpen(false)} title="Tip your rider">
        <Txt size={14} color={p.mute}>100% of your tip goes to {rider?.name ?? 'your rider'}. Paid from your wallet ({ngn(useSession.getState().wallet)}).</Txt>
        <Row gap={8}>{TIPS.map((t) => <Pressable key={t} accessibilityRole="button" onPress={() => sendTip(t)} style={{ flex: 1, height: 52, borderRadius: radius.md, borderWidth: 1, borderColor: p.line, backgroundColor: p.surface, alignItems: 'center', justifyContent: 'center' }}><Txt weight="bold">{ngn(t)}</Txt></Pressable>)}</Row>
        <Field label="Custom amount (₦)" keyboardType="number-pad" value={custom} onChangeText={(t) => setCustom(t.replace(/\D/g, '').slice(0, 6))} placeholder="e.g. 750" />
        <Button label="Send custom tip" disabled={!custom} onPress={() => sendTip(Number(custom))} />
      </Sheet>
    </View>
  );
}
