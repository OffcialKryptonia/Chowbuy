import React, { useEffect, useState } from 'react';
import { Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { CheckCircle2, Clock, Copy, Share2 } from 'lucide-react-native';
import { Button, Card, Empty, Header, Pill, Row, Screen, Txt, useToast } from '@/components/ui';
import { useOrder } from '@/hooks/useOrderTracking';
import { useOrders } from '@/stores/orders';
import { createPaymentLink } from '@/lib/payments';
import { useTheme } from '@/lib/theme';
import { DEMO } from '@/lib/config';
import { ngn } from '@/lib/format';
import { success, tap } from '@/lib/sound-effects';

const left = (ms: number) => { const m = Math.max(0, Math.floor(ms / 60000)); return `${Math.floor(m / 60)}h ${m % 60}m`; };

/** "Share Your Payment Link": a 24-hour URL a sponsor can open to pay by card, Pocketfi transfer or wallet. The webhook flips this screen to Paid. */
export default function ShareLink() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const p = useTheme();
  const toast = useToast();
  const order = useOrder(orderId);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);

  useEffect(() => {
    if (order && !order.paymentLink && !order.paid) {
      void createPaymentLink(order.id, order.total).then((l) => useOrders.getState().setLink(order.id, l)).catch(() => toast('Could not create a payment link.', 'bad'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id]);

  if (!order) return <Screen><Header title="Payment link" /><Empty icon={Clock} title="Order not found" body="Open the order from your Orders tab." /></Screen>;
  const link = order.paymentLink;
  const expired = !!link && link.status !== 'paid' && link.expiresAt <= now;
  const paid = order.paid || link?.status === 'paid';
  const url = link?.url ?? '';
  const message = `Hi! Please help pay ${ngn(order.total)} for my ${order.merchant.name} order on ChowBuy. The link works for 24 hours: ${url}`;

  const renew = async () => {
    setBusy(true);
    try { useOrders.getState().setLink(order.id, await createPaymentLink(order.id, order.total)); toast('New link created for 24 hours', 'ok'); }
    catch { toast('Could not create a new link.', 'bad'); }
    finally { setBusy(false); }
  };

  return (
    <Screen>
      <Header title="Share your payment link" subtitle={`Order ${order.id} · ${ngn(order.total)}`} />
      {paid ? (
        <Card><Row gap={12}><CheckCircle2 size={30} color={p.ok} /><View style={{ flex: 1 }}><Txt size={17} weight="bold">Payment received</Txt><Txt size={13} color={p.mute}>{link?.paidBy ? `Paid by ${link.paidBy}. ` : ''}Your order is confirmed and the kitchen has been notified.</Txt></View></Row></Card>
      ) : (
        <Card>
          <Row style={{ justifyContent: 'space-between' }}><Pill label={expired ? 'Expired' : 'Waiting for payment'} tone={expired ? 'bad' : 'warn'} />{link && !expired ? <Txt size={12} color={p.mute}>Expires in {left(link.expiresAt - now)}</Txt> : null}</Row>
          <Txt size={13} color={p.mute} style={{ marginTop: 10 }}>Whoever opens this link can pay by card, Pocketfi bank transfer or their ChowBuy wallet. This screen updates the moment they pay.</Txt>
          <View style={{ marginTop: 12, padding: 14, borderRadius: 14, backgroundColor: p.fill }}><Txt size={14} weight="semi" numberOfLines={2} style={{ textDecorationLine: expired ? 'line-through' : 'none' }}>{url || 'Creating link…'}</Txt></View>
        </Card>
      )}
      {!paid && !expired && link ? (
        <>
          <Button icon={Share2} label="Share link" onPress={() => { tap(); void Share.share({ message }); }} />
          <Button variant="ghost" icon={Copy} label="Copy link" onPress={async () => { await Clipboard.setStringAsync(url); success(); toast('Link copied', 'ok'); }} />
        </>
      ) : null}
      {expired ? <Button loading={busy} label="Create a new link" onPress={renew} /> : null}
      {DEMO && !paid && !expired && link ? <Button variant="soft" label="Demo: simulate a sponsor paying" onPress={() => { useOrders.getState().markPaid(order.id, 'Tunde A.'); success(); }} /> : null}
      <Button variant={paid ? 'primary' : 'ghost'} label="Track order" onPress={() => router.replace(`/orders/${order.id}/track`)} />
    </Screen>
  );
}
