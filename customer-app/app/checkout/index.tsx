import React, { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Clipboard from 'expo-clipboard';
import { Banknote, Check, CreditCard, Landmark, Link2, MapPin, Minus, Plus, ShoppingBag, Tag, Wallet, type LucideIcon } from 'lucide-react-native';
import { Button, Card, Empty, Field, Header, Row, Screen, SectionTitle, Sheet, Txt, useToast } from '@/components/ui';
import { AddressPicker } from '@/components/discovery/AddressPicker';
import { useCart } from '@/stores/cart';
import { useSession } from '@/stores/session';
import { useOrders } from '@/stores/orders';
import { usePublicConfig } from '@/hooks/usePublicConfig';
import { useTheme, radius } from '@/lib/theme';
import { totals } from '@/lib/smart-cart';
import { buildOrder } from '@/lib/checkout';
import { COD_RULES, createPaymentLink, initiatePayment, verifyPayment, type PayInit } from '@/lib/payments';
import { ngn, clock } from '@/lib/format';
import { DEMO } from '@/lib/config';
import { checkPromo, placeOrder } from '@/lib/backend';
import { success, tap, warn } from '@/lib/sound-effects';
import type { Order, PayMethod } from '@/lib/types';

const METHODS: { id: PayMethod; label: string; sub: string; icon: LucideIcon }[] = [
  { id: 'korapay', label: 'Card via Korapay', sub: 'Debit card, bank or USSD', icon: CreditCard },
  { id: 'pocketfi', label: 'Bank transfer via Pocketfi', sub: 'Pay to a one-time account number', icon: Landmark },
  { id: 'wallet', label: 'ChowBuy wallet', sub: 'Instant, no fees', icon: Wallet },
  { id: 'cod', label: 'Cash on delivery', sub: 'Pay your rider on arrival', icon: Banknote },
];

export default function Checkout() {
  const p = useTheme();
  const toast = useToast();
  const cfg = usePublicConfig().data.gateways;
  const { merchant, lines, promo, qty, applyPromo, clear } = useCart();
  const { addresses, activeAddressId, wallet, email } = useSession();
  const address = addresses.find((a) => a.id === activeAddressId) ?? addresses[0];
  const [pay, setPay] = useState<PayMethod>('korapay');
  const [code, setCode] = useState('');
  const [codeErr, setCodeErr] = useState<string | null>(null);
  const [pickAddr, setPickAddr] = useState(false);
  const [busy, setBusy] = useState(false);
  const [transfer, setTransfer] = useState<PayInit | null>(null);
  const draft = useRef<Order | null>(null);
  const live = useRef<Order | null>(null);   // live mode: the unpaid order already created on the server, reused on retry

  if (merchant && lines.length && !address) {
    return <Screen><Header title="Checkout" /><Empty icon={MapPin} title="Where should we deliver?" body="Add a delivery address to continue." action={<Button full={false} label="Add address" onPress={() => setPickAddr(true)} />} /><AddressPicker visible={pickAddr} onClose={() => setPickAddr(false)} /></Screen>;
  }
  if (!merchant || !lines.length || !address) {
    return <Screen><Header title="Basket" /><Empty icon={ShoppingBag} title="Your basket is empty" body="Add something delicious and it will show up here." action={<Button full={false} label="Browse" onPress={() => router.replace('/')} />} /></Screen>;
  }

  const t = totals(lines, merchant.deliveryFee, promo?.pct ?? 0);
  const enabled = METHODS.filter((m) => cfg[m.id].enabled);
  const codMsg = pay === 'cod' ? COD_RULES(cfg.cod.maxAmount, t.total) : null;
  const walletMsg = pay === 'wallet' && wallet < t.total ? `Wallet balance ${ngn(wallet)} is not enough. Top up in Profile or choose another method.` : null;
  const blocked = codMsg ?? walletMsg;

  const order = (): Order => (draft.current ??= buildOrder({ merchant, lines, pay, paid: false, address, promoPct: promo?.pct ?? 0 }));

  const finish = (o: Order, paid: boolean) => {
    useOrders.getState().place({ ...o, pay, paid });
    clear(); draft.current = null; success();
    router.replace(`/orders/${o.id}/track`);
  };

  /** Live mode: the server prices the order from its own catalogue and creates it; card and transfer orders start unpaid until the gateway confirms. */
  const liveOrder = async (method: PayMethod) => {
    if (live.current && live.current.pay === method) return live.current;
    live.current = await placeOrder({ merchantId: merchant.id, lines, pay: method, addressId: address.id, promo: promo?.code });
    return live.current;
  };
  const finishLive = (o: Order, paid: boolean) => {
    if (paid) useOrders.getState().markPaid(o.id);
    live.current = null; clear(); success();
    router.replace(`/orders/${o.id}/track`);
  };
  /** Polls the gateway a few times after the hosted page closes, because the webhook can arrive a moment later. */
  const settled = async (reference: string) => {
    for (let i = 0; i < 6; i++) {
      const s = await verifyPayment(reference);
      if (s !== 'pending') return s;
      await new Promise((r) => setTimeout(r, 2000));
    }
    return 'pending' as const;
  };
  const placeLive = async () => {
    if (pay === 'wallet' || pay === 'cod') { finishLive(await liveOrder(pay), pay === 'wallet'); return; }
    const o = await liveOrder(pay);
    const init = await initiatePayment(pay, o.total, o.id, '');
    if (pay === 'korapay') {
      if (init.checkoutUrl) await WebBrowser.openBrowserAsync(init.checkoutUrl);
      const s = await settled(init.reference);
      if (s === 'paid') finishLive(o, true);
      else { warn(); toast(s === 'failed' ? 'The payment did not go through. Nothing was charged.' : 'We have not received your payment yet. Open this order from Orders once it completes.', 'bad'); }
      return;
    }
    setTransfer(init);
  };

  const place = async () => {
    if (blocked) { warn(); toast(blocked, 'bad'); return; }
    setBusy(true);
    try {
      if (!DEMO) { await placeLive(); return; }
      draft.current = null;
      const o = order();
      if (pay === 'wallet') {
        const err = useSession.getState().spend(o.total, `Order ${o.id}`);
        if (err) { warn(); toast(err, 'bad'); return; }
        finish(o, true); return;
      }
      const init = await initiatePayment(pay, o.total, o.id, useSession.getState().email);
      if (init.status === 'cod') { finish(o, false); return; }
      if (pay === 'korapay') {
        if (!DEMO && init.checkoutUrl) await WebBrowser.openBrowserAsync(init.checkoutUrl);
        const s = await verifyPayment(init.reference);
        if (s === 'paid') finish(o, true);
        else { warn(); toast(s === 'failed' ? 'The payment did not go through. Nothing was charged.' : 'We have not received your payment yet. Try again once it completes.', 'bad'); }
        return;
      }
      setTransfer({ ...init, reference: init.reference });
    } catch (e) {
      warn(); toast(e instanceof Error ? e.message : 'Could not start payment. Please try again.', 'bad');
    } finally { setBusy(false); }
  };

  const confirmTransfer = async () => {
    if (!transfer) return;
    setBusy(true);
    try {
      const s = await verifyPayment(transfer.reference);
      if (s === 'paid') { setTransfer(null); if (!DEMO && live.current) finishLive(live.current, true); else finish(order(), true); }
      else { warn(); toast('We have not received the transfer yet. It can take a minute.', 'bad'); }
    } catch (e) { toast(e instanceof Error ? e.message : 'Could not check the transfer.', 'bad'); }
    finally { setBusy(false); }
  };

  /** Places the order and hands a 24-hour pay link to someone else. The kitchen starts once the sponsor pays. */
  const askToPay = async () => {
    setBusy(true);
    try {
      if (!DEMO) {
        const o = await liveOrder('korapay');
        const link = await createPaymentLink(o.id, o.total);
        useOrders.getState().setLink(o.id, link);
        live.current = null; clear(); success();
        router.replace({ pathname: '/checkout/share-link', params: { orderId: o.id } });
        return;
      }
      draft.current = null;
      const o = order();
      const link = await createPaymentLink(o.id, o.total);
      useOrders.getState().place({ ...o, pay: 'korapay', paid: false, paymentLink: link });
      clear(); draft.current = null; success();
      router.replace({ pathname: '/checkout/share-link', params: { orderId: o.id } });
    } catch (e) { warn(); toast(e instanceof Error ? e.message : 'Could not create the link.', 'bad'); }
    finally { setBusy(false); }
  };

  const tryPromo = async () => {
    if (!DEMO) {
      const pct = await checkPromo(code).catch(() => null);
      if (pct == null) { setCodeErr('That code is not valid or has expired.'); warn(); return; }
      useCart.getState().setPromo({ code: code.trim().toUpperCase(), pct }); setCodeErr(null); success(); setCode(''); live.current = null; return;
    }
    const e = applyPromo(code); setCodeErr(e); if (!e) { success(); setCode(''); } else warn(); };

  return (
    <Screen footer={
      <View style={{ padding: 16, gap: 8, backgroundColor: p.surface, borderTopWidth: 1, borderTopColor: p.line }}>
        {blocked ? <Txt size={13} color={p.bad}>{blocked}</Txt> : null}
        <Button loading={busy} disabled={!!blocked} label={pay === 'cod' ? `Place order · ${ngn(t.total)}` : `Pay ${ngn(t.total)}`} onPress={place} />
        <Button variant="ghost" small icon={Link2} label="Share your payment link" onPress={askToPay} disabled={busy} />
      </View>
    }>
      <Header title="Checkout" subtitle={merchant.name} />

      <Card onPress={() => setPickAddr(true)}>
        <Row gap={12}><MapPin size={20} color={p.brand} /><View style={{ flex: 1 }}><Txt size={15} weight="bold">Deliver to {address.label}</Txt><Txt size={13} color={p.mute}>{address.line}, {address.area}</Txt></View><Txt size={13} weight="bold" color={p.brand}>Change</Txt></Row>
      </Card>

      <SectionTitle title="Your order" />
      <Card>
        {lines.map((l, i) => (
          <View key={l.key} style={{ paddingTop: i ? 12 : 0, gap: 6 }}>
            <Row gap={10}>
              <View style={{ flex: 1 }}>
                <Txt size={15} weight="semi">{l.name}</Txt>
                {l.mods.length ? <Txt size={12} color={p.mute}>{l.mods.map((m) => m.name).join(', ')}</Txt> : null}
                {l.note ? <Txt size={12} color={p.mute}>Note: {l.note}</Txt> : null}
              </View>
              <Row gap={8}>
                <Pressable accessibilityLabel={`Decrease ${l.name}`} hitSlop={8} onPress={() => { tap(); live.current = null; qty(l.key, l.qty - 1); }} style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: p.line, alignItems: 'center', justifyContent: 'center' }}><Minus size={16} color={p.ink} /></Pressable>
                <Txt size={15} weight="bold" style={{ minWidth: 18 }} align="center">{l.qty}</Txt>
                <Pressable accessibilityLabel={`Increase ${l.name}`} hitSlop={8} onPress={() => { tap(); live.current = null; qty(l.key, l.qty + 1); }} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: p.brand, alignItems: 'center', justifyContent: 'center' }}><Plus size={16} color="#fff" /></Pressable>
              </Row>
              <Txt size={15} weight="bold" style={{ minWidth: 70 }} align="right">{ngn(l.unitPrice * l.qty)}</Txt>
            </Row>
          </View>
        ))}
      </Card>

      <Row gap={8} style={{ alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}><Field label="Promo code" value={code} onChangeText={(v) => { setCode(v); setCodeErr(null); }} autoCapitalize="characters" placeholder="e.g. LUNCH15" error={codeErr} /></View>
        <View style={{ marginBottom: codeErr ? 20 : 0 }}><Button full={false} variant="soft" icon={Tag} label="Apply" onPress={tryPromo} /></View>
      </Row>
      {promo ? <Row gap={6}><Check size={16} color={p.ok} /><Txt size={13} color={p.ok}>{promo.code} applied: {promo.pct}% off</Txt></Row> : null}

      <SectionTitle title="Pay with" />
      {enabled.map((m) => {
        const on = pay === m.id;
        return (
          <Pressable key={m.id} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => { tap(); setPay(m.id); draft.current = null; live.current = null; }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, borderWidth: on ? 2 : 1, borderColor: on ? p.brand : p.line, backgroundColor: on ? p.brandSoft : p.surface }}>
            <m.icon size={22} color={on ? p.brand : p.mute} />
            <View style={{ flex: 1 }}><Txt size={15} weight="bold">{m.label}</Txt><Txt size={12} color={p.mute}>{m.id === 'wallet' ? `Balance ${ngn(wallet)}` : m.id === 'cod' ? `Up to ${ngn(cfg.cod.maxAmount)}` : m.sub}</Txt></View>
            {on ? <Check size={20} color={p.brand} /> : null}
          </Pressable>
        );
      })}

      <Card>
        <Row style={{ justifyContent: 'space-between' }}><Txt color={p.mute}>Subtotal</Txt><Txt>{ngn(t.subtotal)}</Txt></Row>
        {t.discount ? <Row style={{ justifyContent: 'space-between' }}><Txt color={p.ok}>Promo</Txt><Txt color={p.ok}>-{ngn(t.discount)}</Txt></Row> : null}
        <Row style={{ justifyContent: 'space-between' }}><Txt color={p.mute}>Delivery</Txt><Txt>{t.deliveryFee ? ngn(t.deliveryFee) : 'Free'}</Txt></Row>
        <Row style={{ justifyContent: 'space-between' }}><Txt color={p.mute}>Service charge</Txt><Txt>{ngn(t.service)}</Txt></Row>
        {t.freeDeliveryAway ? <Txt size={12} color={p.brandInk} style={{ marginTop: 4 }}>Add {ngn(t.freeDeliveryAway)} more for free delivery</Txt> : null}
        <View style={{ height: 1, backgroundColor: p.line, marginVertical: 10 }} />
        <Row style={{ justifyContent: 'space-between' }}><Txt size={17} weight="display">Total</Txt><Txt size={17} weight="display">{ngn(t.total)}</Txt></Row>
      </Card>

      <AddressPicker visible={pickAddr} onClose={() => setPickAddr(false)} />

      <Sheet visible={!!transfer} onClose={() => setTransfer(null)} title="Transfer to complete">
        {transfer?.virtualAccount ? (
          <>
            <Txt size={14} color={p.mute}>Send exactly {ngn(t.total)} to this one-time account before {clock(transfer.virtualAccount.expiresAt)}.</Txt>
            <Card pad={16}>
              <Txt size={13} color={p.mute}>{transfer.virtualAccount.bank}</Txt>
              <Txt size={28} weight="displayX" style={{ letterSpacing: 2 }}>{transfer.virtualAccount.number}</Txt>
              <Txt size={13} color={p.mute}>{transfer.virtualAccount.name}</Txt>
            </Card>
            <Button variant="ghost" label="Copy account number" onPress={async () => { await Clipboard.setStringAsync(transfer.virtualAccount!.number); toast('Account number copied', 'ok'); }} />
            <Button loading={busy} label="I have made the transfer" onPress={confirmTransfer} />
          </>
        ) : null}
      </Sheet>
    </Screen>
  );
}
