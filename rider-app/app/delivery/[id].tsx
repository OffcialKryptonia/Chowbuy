import React, { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Banknote, Camera, Check, MessageCircle, Navigation, Phone, ShieldAlert, Square } from 'lucide-react-native';
import { Button, Txt, tap } from '@/components/ui';
import { Card, Pill } from '@/components/kit';
import { RiderMap } from '@/components/RiderMap';
import { SosButton } from '@/components/Sos';
import { useTheme } from '@/lib/theme';
import { naira } from '@/lib/format';
import { STAGES, STEPS, stageIndex, unreachableReady, UNREACHABLE_WAIT_SECONDS } from '@/lib/delivery';
import { useTracking } from '@/lib/tracking';
import { useRider } from '@/stores/rider';
import { useApply } from '@/stores/apply';
import { LIVE } from '@/lib/config';
import { UnreadBadge } from '@/components/UnreadBadge';
import { useChatUnread } from '@/lib/chat-unread';

const navUrl = (app: 'google' | 'apple' | 'waze', lat: number, lng: number) =>
  app === 'waze' ? `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
  : app === 'apple' ? `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`
  : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

/** The 8-stage delivery. Each step only moves forward once its rule is met (items checked, correct PIN). */
export default function Delivery() {
  const p = useTheme();
  const r = useRouter();
  const type = useApply((s) => s.type);
  const a = useRider((s) => s.active);
  const unread = useChatUnread();
  const { toggleItem, step, startUnreachable, setPhoto, supervisorApprove } = useRider.getState();
  const lastPos = useRider((s) => s.lastPos);
  const navApp = useRider((s) => s.settings.navApp);
  const [pin, setPin] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  useTracking(a?.stage === 'at_restaurant');
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  if (!a) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: p.bg, padding: 24, justifyContent: 'center', gap: 14 }}>
        <Txt size={22} weight="display" align="center">No active delivery</Txt>
        <Button label="Back to home" onPress={() => r.replace('/home')} />
      </SafeAreaView>
    );
  }
  const o = a.order, st = STEPS[a.stage], idx = stageIndex(a.stage);
  const toStore = idx <= stageIndex('at_restaurant');
  const target = toStore ? o.pickupLL : o.dropLL;
  const cashHere = o.cod > 0;
  const waited = a.unreachableSince ? Math.floor((now - a.unreachableSince) / 1000) : 0;
  const unreach = unreachableReady({ waitedSeconds: waited, hasPhoto: !!a.photo });
  const rider = lastPos ? { lat: lastPos.lat, lng: lastPos.lng } : null;

  const go = async () => {
    tap();
    if (busy) return;
    const arg = a.stage === 'at_customer' ? pin : undefined;
    let res: { ok: boolean; reason?: string };
    if (LIVE) { setBusy(true); res = await useRider.getState().liveStep(arg, type); setBusy(false); } else res = step(arg, type);
    if (!res.ok) { setErr(res.reason ?? 'Cannot continue.'); return; }
    setErr(null); setPin('');
    if (a.stage === 'at_customer') r.replace('/home');
  };
  const openNav = () => { Linking.openURL(navUrl(navApp, target.lat, target.lng)).catch(() => setErr('No navigation app could be opened.')); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140, gap: 12, maxWidth: 640, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt size={22} weight="display">{o.id}</Txt>
          <Pill label={st.label} color={p.brand} soft />
        </View>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {STAGES.slice(1).map((s, i) => <View key={s} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i + 1 <= idx ? p.brand : p.fill }} />)}
        </View>
        <RiderMap pickup={o.pickupLL} drop={o.dropLL} rider={rider} height={220} />
        <Card>
          <Txt size={13} color={p.mute} weight="semi">{toStore ? 'PICK UP' : 'DROP OFF'}</Txt>
          <Txt size={16} weight="bold">{toStore ? o.pickup : o.drop}</Txt>
          <Txt size={13} color={p.mute}>{st.hint}</Txt>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}><Button label="Navigate" variant="soft" onPress={openNav} /></View>
            <View style={{ flex: 1 }}>
              <Button label={unread ? `Chat · ${unread}` : 'Chat'} variant="soft" onPress={() => r.push(`/chat/${o.id}`)} />
              {unread > 0 ? <View pointerEvents="none" style={{ position: 'absolute', top: -8, right: -4 }}><UnreadBadge count={unread} /></View> : null}
            </View>
            <View style={{ flex: 1 }}><Button label="Call" variant="soft" onPress={() => r.push(`/call/${o.id}`)} /></View>
          </View>
        </Card>

        {a.stage === 'at_restaurant' ? (
          <Card>
            <Txt size={15} weight="bold">Check every item</Txt>
            {o.items.map((i) => {
              const on = !!a.checklist[i.id];
              return (
                <Pressable key={i.id} accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => { tap(); toggleItem(i.id); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
                  {on ? <Check size={22} color={p.ok} /> : <Square size={22} color={p.mute} />}
                  <Txt size={15}>{i.qty} × {i.name}</Txt>
                </Pressable>
              );
            })}
          </Card>
        ) : null}

        {cashHere && idx >= stageIndex('picked_up') ? (
          <Card style={{ borderColor: p.warn }}>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}><Banknote size={22} color={p.warn} /><Txt size={16} weight="bold">Collect {naira(o.cod)} cash</Txt></View>
            <Txt size={13} color={p.mute}>{type === 'fleet' ? 'Pay this cash in to your hub at the end of your shift.' : 'Cash you collect is added to “cash in hand” and must be paid in.'}</Txt>
          </Card>
        ) : null}

        {a.stage === 'at_customer' ? (
          <Card>
            <Txt size={15} weight="bold">Customer’s 4-digit PIN</Txt>
            <TextInput value={pin} onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" maxLength={4} placeholder="••••" placeholderTextColor={p.mute} accessibilityLabel="Delivery PIN"
              style={{ height: 64, borderRadius: 14, borderWidth: 1.5, borderColor: p.line, color: p.ink, fontSize: 30, letterSpacing: 12, textAlign: 'center', backgroundColor: p.surface }} />
            {LIVE ? <Txt size={12} color={p.mute}>Only the customer can see the PIN. Five wrong tries lock the order for ChowBuy support.</Txt> : <Txt size={12} color={p.mute}>Demo PIN for this order: {o.pin}. In the live app only the customer sees it.</Txt>}
          </Card>
        ) : null}

        {a.stage === 'at_customer' ? (
          <Card>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}><ShieldAlert size={20} color={p.warn} /><Txt size={15} weight="bold">Customer not answering?</Txt></View>
            {!a.unreachableSince ? (
              <Button label="Start 5-minute wait" variant="soft" onPress={startUnreachable} />
            ) : (
              <>
                <Txt size={13} color={p.mute}>{waited < UNREACHABLE_WAIT_SECONDS ? `Waiting ${Math.floor(waited / 60)}:${String(waited % 60).padStart(2, '0')} of 5:00. Keep calling and messaging.` : 'Wait complete.'}</Txt>
                <Button label={a.photo ? 'Photo added' : 'Take a photo of the spot'} variant="soft" onPress={() => setPhoto('demo-photo')} />
                {LIVE ? <Txt size={13} color={p.mute}>Call ChowBuy support now. A supervisor can complete or cancel this order for you.</Txt> : <Button label={a.supervisorApproved ? 'Supervisor approved' : 'Ask a supervisor to approve'} variant="soft" disabled={!unreach.ok || a.supervisorApproved}
                  onPress={() => supervisorApprove()} />}
                {!unreach.ok ? <Txt size={12} color={p.bad}>{unreach.reason}</Txt> : null}
                {a.supervisorApproved ? <Txt size={12} color={p.ok}>Approved. You can complete the delivery without the PIN. (Demo: approval is simulated.)</Txt> : null}
              </>
            )}
          </Card>
        ) : null}
        {err ? <Txt size={14} color={p.bad} weight="bold">{err}</Txt> : null}
      </ScrollView>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: p.bg, borderTopWidth: 1, borderTopColor: p.line }}>
        {st.action ? <Button label={busy ? 'Please wait…' : a.stage === 'at_customer' && a.supervisorApproved ? 'Complete delivery' : st.action} variant="brand" disabled={busy} onPress={go} /> : null}
      </View>
      <SosButton bottom={100} />
    </SafeAreaView>
  );
}
