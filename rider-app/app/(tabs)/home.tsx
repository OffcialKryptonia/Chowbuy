import React, { useEffect, useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Coffee, Flame, Play, Square } from 'lucide-react-native';
import { Button, Txt } from '@/components/ui';
import { Card, Heading, Pill, Stat } from '@/components/kit';
import { RiderMap } from '@/components/RiderMap';
import { SosButton } from '@/components/Sos';
import { useTheme } from '@/lib/theme';
import { naira } from '@/lib/format';
import { demoDelivery } from '@/lib/offer';
import { SHIFTS, shiftHours, shiftLabel, fmtHours, minutesBetween } from '@/lib/shift';
import { codPaused } from '@/lib/cod';
import { useTracking } from '@/lib/tracking';
import { useRider } from '@/stores/rider';
import { useApply } from '@/stores/apply';
import { LIVE } from '@/lib/config';

const ZONES = [
  { label: 'Victoria Island', mult: 1.5, at: { lat: 6.4281, lng: 3.4219 } },
  { label: 'Lekki Phase 1', mult: 1.3, at: { lat: 6.4474, lng: 3.4723 } },
  { label: 'Ikeja GRA', mult: 1.2, at: { lat: 6.5833, lng: 3.3481 } },
  { label: 'Yaba', mult: 1.1, at: { lat: 6.5095, lng: 3.3711 } },
];

export default function Home() {
  const p = useTheme();
  const r = useRouter();
  const type = useApply((s) => s.type);
  const verified = useApply((s) => s.verified);
  const fleet = type === 'fleet';
  const s = useRider();
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);
  useTracking(s.active?.stage === 'at_restaurant');

  const shift = SHIFTS.find((x) => x.id === s.shiftId) ?? null;
  const worked = s.shiftStart ? minutesBetween(s.shiftStart, now) - s.breakMinutes : 0;
  const paused = codPaused(s.unremitted);
  const a = s.active;
  const rider = s.lastPos ?? (a ? (a.stage === 'to_restaurant' || a.stage === 'accepted' ? { lat: a.order.pickupLL.lat - 0.004, lng: a.order.pickupLL.lng - 0.006 } : a.order.pickupLL) : null);

  const simulate = () => { s.setOffer(demoDelivery()); r.push('/offer'); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 110, gap: 16, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Txt size={24} weight="display">{fleet ? 'ChowBuy Fleet' : 'ChowBuy Partner'}</Txt>
            <Txt size={13} color={p.mute}>{fleet ? s.hub : s.city}{verified ? (LIVE ? ' · Verified' : ' · Verified demo rider') : ''}</Txt>
          </View>
          <Pill label={!s.online ? 'Offline' : s.onBreak ? 'On break' : a ? 'On delivery' : 'Online'} color={!s.online ? p.mute : s.onBreak ? p.warn : a ? p.info : p.ok} />
        </View>

        {LIVE && !verified ? (
          <Card style={{ borderColor: p.warn }}>
            <Txt size={16} weight="bold">Waiting for approval</Txt>
            <Txt size={13} color={p.mute}>ChowBuy is reviewing your application. Add your documents in Profile, Documents and verification. You can go online as soon as you are approved.</Txt>
          </Card>
        ) : null}

        {fleet ? (
          <Card>
            <Txt size={16} weight="bold">{shift ? `${shift.label} shift · ${shiftLabel(shift)}` : 'Start your shift'}</Txt>
            {shift ? (
              <>
                <View style={{ height: 10, borderRadius: 5, backgroundColor: p.fill, overflow: 'hidden' }}>
                  <View style={{ height: 10, width: `${Math.min(100, (worked / (shiftHours(shift) * 60)) * 100)}%`, backgroundColor: p.ok }} />
                </View>
                <Txt size={13} color={p.mute}>{fmtHours(Math.max(0, worked))} logged of {shiftHours(shift)}h · {s.breakMinutes} min break taken</Txt>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}><Button label={s.onBreak ? 'End break' : 'Take a break'} variant="soft" onPress={s.toggleBreak} /></View>
                  <View style={{ flex: 1 }}><Button label="End shift" variant="soft" onPress={s.endShift} /></View>
                </View>
              </>
            ) : (
              <View style={{ gap: 8 }}>
                {SHIFTS.map((x) => <Button key={x.id} label={`${x.label} · ${shiftLabel(x)}`} variant="soft" onPress={() => s.startShift(x.id)} />)}
              </View>
            )}
          </Card>
        ) : (
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Txt size={16} weight="bold">{s.online ? 'You are online' : 'You are offline'}</Txt>
                <Txt size={13} color={p.mute}>{s.online ? 'New orders can ring you now.' : 'Go online to receive orders.'}</Txt>
              </View>
              <Switch value={s.online} disabled={LIVE && !verified} onValueChange={s.setOnline} trackColor={{ true: p.ok, false: p.line }} accessibilityLabel="Go online" />
            </View>
            {s.online ? <Button label={s.onBreak ? 'End break' : 'Take a break (stops tracking)'} variant="soft" onPress={s.toggleBreak} /> : null}
          </Card>
        )}

        {paused ? <Card style={{ borderColor: p.bad }}><Txt size={14} weight="bold" color={p.bad}>Cash orders paused</Txt><Txt size={13} color={p.mute}>You are holding {naira(s.unremitted)} in cash. Pay it in from {fleet ? 'Deliveries' : 'Wallet'} to get cash orders again.</Txt></Card> : null}

        {a ? (
          <Card onPress={() => r.push(`/delivery/${a.order.id}`)} label="Continue delivery" style={{ borderColor: p.brand }}>
            <Txt size={13} weight="bold" color={p.brand}>ACTIVE DELIVERY</Txt>
            <Txt size={16} weight="bold">{a.order.merchant}</Txt>
            <Txt size={13} color={p.mute}>{a.order.id} · tap to continue</Txt>
          </Card>
        ) : null}

        <RiderMap pickup={a?.order.pickupLL ?? null} drop={a?.order.dropLL ?? null} rider={rider} height={250} zoneRings={fleet ? [] : ZONES.map((z) => ({ at: z.at, label: z.label }))} />

        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          <Stat label="Deliveries today" value={String(s.deliveriesToday)} />
          <Stat label="Rating" value={`${s.rating.toFixed(2)} ★`} />
          <Stat label="On-time" value={`${s.onTimePct}%`} />
        </View>

        {!fleet ? (
          <>
            <Heading note="Busy areas right now. Higher multipliers pay more per ride.">Surge zones</Heading>
            <Card>
              {ZONES.map((z) => (
                <View key={z.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Flame size={18} color={z.mult >= 1.3 ? p.brand : p.mute} />
                  <Txt size={15} style={{ flex: 1 }}>{z.label}</Txt>
                  <Txt size={15} weight="bold" color={z.mult >= 1.3 ? p.brand : p.ink}>{z.mult.toFixed(1)}x</Txt>
                </View>
              ))}
            </Card>
          </>
        ) : null}

        {LIVE ? null : <Button label="Simulate an incoming order" variant="brand" onPress={simulate} />}
        {LIVE ? null : <Txt size={12} color={p.mute} align="center">Preview build: orders are simulated until the rider backend is connected.</Txt>}
      </ScrollView>
      <SosButton bottom={20} />
    </SafeAreaView>
  );
}
