import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Banknote, MapPin, Navigation, Package, type LucideIcon } from 'lucide-react-native';
import { Button, Page, Txt } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { naira } from '@/lib/format';
import { demoOffer, offerView, OFFER_SECONDS } from '@/lib/offer';
import { isRingId, DEFAULT_RING, ring } from '@/lib/rings';
import { type StopReason } from '@/lib/ring-controller';
import { usePrefs } from '@/stores/prefs';
import { useApply } from '@/stores/apply';
import { useRider } from '@/stores/rider';
import { demoDelivery } from '@/lib/offer';

type Phase = 'ringing' | 'accepted' | 'declined' | 'expired';

/** Incoming order. The chosen ring plays until the rider accepts or declines (or the 30 seconds run out). */
export default function Offer() {
  const p = useTheme();
  const r = useRouter();
  const ringId = usePrefs((s) => s.ring);
  const vibrate = usePrefs((s) => s.vibrate);
  const type = useApply((s) => s.type);
  const offer = useMemo(() => demoOffer(), []);
  const view = offerView(type, offer);
  const [phase, setPhase] = useState<Phase>('ringing');
  const [blocked, setBlocked] = useState<string | null>(null);
  useEffect(() => { if (!useRider.getState().offer) useRider.getState().setOffer(demoDelivery()); }, []);
  const [left, setLeft] = useState(OFFER_SECONDS);
  const phaseRef = useRef<Phase>('ringing');

  const finish = useCallback((next: Exclude<Phase, 'ringing'>, reason: StopReason) => {
    if (phaseRef.current !== 'ringing') return;
    if (next === 'accepted') {
      const res = useRider.getState().accept(useApply.getState().type);
      if (!res.ok) { void ring.stop('declined'); phaseRef.current = 'declined'; setBlocked(res.reason ?? 'This order cannot be accepted.'); setPhase('declined'); return; }
    } else useRider.getState().setOffer(null);
    phaseRef.current = next;
    void ring.stop(reason);               // silence first, then update the screen
    setPhase(next);
  }, []);

  useEffect(() => {
    void ring.start(isRingId(ringId) ? ringId : DEFAULT_RING, { vibrate });
    const tick = setInterval(() => setLeft((s) => s - 1), 1000);
    const sub = AppState.addEventListener('change', (st) => { if (st === 'background') void ring.stop('left'); });
    return () => { clearInterval(tick); sub.remove(); void ring.stop('left'); };
  }, [ringId, vibrate]);

  useEffect(() => { if (left <= 0) finish('expired', 'timeout'); }, [left, finish]);

  const done = phase !== 'ringing';
  const title = phase === 'accepted' ? 'Order accepted' : phase === 'declined' ? 'Order declined' : phase === 'expired' ? 'Offer expired' : 'New order';
  const sub = phase === 'accepted' ? `Head to ${offer.merchant} to pick up.` : phase === 'declined' ? (blocked ?? 'It will go to another rider.') : phase === 'expired' ? 'You did not respond in time, so it went to another rider.' : `${left}s to respond`;

  return (
    <Page back={false} footer={done
      ? <Button label={phase === 'accepted' ? 'Start the delivery' : 'Back'} onPress={() => (phase === 'accepted' ? r.replace('/delivery/active') : r.back())} />
      : <><Button label="Accept order" variant="brand" onPress={() => finish('accepted', 'accepted')} /><Button label="Decline" variant="soft" onPress={() => finish('declined', 'declined')} /></>}>
      <View style={{ alignItems: 'center', gap: 6, paddingVertical: 8 }}>
        <View style={{ width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: phase === 'accepted' ? p.ok : phase === 'ringing' ? p.brand : p.fill }}>
          <Txt size={phase === 'ringing' ? 34 : 18} weight="displayX" color={phase === 'ringing' || phase === 'accepted' ? '#fff' : p.mute}>{phase === 'ringing' ? String(Math.max(left, 0)) : phase === 'accepted' ? '✓' : '–'}</Txt>
        </View>
        <Txt size={26} weight="display" align="center">{title}</Txt>
        <Txt size={15} color={p.mute} align="center">{sub}</Txt>
      </View>

      <View style={{ borderRadius: 18, borderWidth: 1.5, borderColor: p.line, padding: 16, gap: 14 }}>
        <Row2 icon={Package} title={offer.merchant} note={`${offer.items} items · Order ${offer.id}`} />
        <Row2 icon={Navigation} title={`Pick up: ${offer.pickup}`} note={`${offer.km.toFixed(1)} km trip`} />
        <Row2 icon={MapPin} title={`Drop off: ${offer.drop}`} note="Customer details appear after you accept" />
        {offer.cod > 0 ? <Row2 icon={Banknote} title={`Collect ${naira(offer.cod)} cash`} note="Cash on delivery" /> : null}
      </View>

      {view.showEarnings ? (
        <View style={{ borderRadius: 18, backgroundColor: p.brandSoft, padding: 16, gap: 8 }}>
          <Txt size={13} weight="bold" color={p.brandInk}>YOUR EARNINGS FOR THIS RIDE</Txt>
          {view.lines.map(([label, amount]) => (
            <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Txt size={15}>{label}</Txt><Txt size={15}>{naira(amount)}</Txt></View>
          ))}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: p.line, paddingTop: 8 }}>
            <Txt size={17} weight="bold">Total</Txt><Txt size={17} weight="bold">{naira(view.total ?? 0)}</Txt>
          </View>
          <Txt size={12} color={p.mute}>Tips are added on delivery and are all yours.</Txt>
        </View>
      ) : (
        <View style={{ borderRadius: 18, backgroundColor: p.fill, padding: 16 }}>
          <Txt size={14} color={p.mute}>You are on ChowBuy Fleet: your pay is your monthly salary, so rides do not show a fare. Tips from customers are all yours.</Txt>
        </View>
      )}
    </Page>
  );
}

function Row2({ icon: Icon, title, note }: { icon: LucideIcon; title: string; note: string }) {
  const p = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: p.fill, alignItems: 'center', justifyContent: 'center' }}><Icon size={20} color={p.ink} /></View>
      <View style={{ flex: 1 }}><Txt size={15} weight="bold">{title}</Txt><Txt size={13} color={p.mute}>{note}</Txt></View>
    </View>
  );
}
