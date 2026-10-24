import React, { useState } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field, Txt } from '@/components/ui';
import { Card, Heading, Stat } from '@/components/kit';
import { SosButton } from '@/components/Sos';
import { useTheme } from '@/lib/theme';
import { naira } from '@/lib/format';
import { NG_BANKS, canPayout, summarise } from '@/lib/wallet';
import { COD_PAUSE_LIMIT } from '@/lib/cod';
import { SHIFTS, fmtHours, minutesBetween, shiftLabel } from '@/lib/shift';
import { useRider } from '@/stores/rider';
import { useApply } from '@/stores/apply';
import { LIVE } from '@/lib/config';

const DAY = 86400000;

export default function WalletTab() {
  const type = useApply((s) => s.type);
  return type === 'fleet' ? <FleetShifts /> : <PartnerWallet />;
}

function PartnerWallet() {
  const p = useTheme();
  const { balance, unremitted, txns, payoutBank, payoutNuban, remit } = useRider();
  const payout = useRider((s) => s.payout);
  const set = useRider.setState;
  const [amount, setAmount] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pickBank, setPickBank] = useState(false);
  const now = Date.now();
  const today = summarise(txns, new Date().setHours(0, 0, 0, 0));
  const week = summarise(txns, now - 7 * DAY);
  const streak = Math.min(10, week.rides);

  const requestPayout = () => {
    const n = Number(amount.replace(/\D/g, ''));
    const c = canPayout({ amount: n, balance, unremitted, nuban: payoutNuban });
    if (!c.ok) { setMsg({ ok: false, text: c.reason }); return; }
    if (!payoutBank) { setMsg({ ok: false, text: 'Choose your bank first.' }); return; }
    payout(n); setAmount(''); setMsg({ ok: true, text: `${naira(n)} is on its way to ${payoutBank}. (Demo: no real transfer yet.)` });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 110, gap: 14, maxWidth: 640, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
        <Txt size={24} weight="display">Wallet</Txt>
        <Card style={{ backgroundColor: p.brand, borderColor: p.brand }}>
          <Txt size={13} color="#fff" weight="semi">{LIVE ? 'Earned with ChowBuy' : 'Available balance'}</Txt>
          <Txt size={34} weight="displayX" color="#fff">{naira(balance)}</Txt>
          <Txt size={12} color="#fff">{LIVE ? 'Your ride earnings plus tips. Tips are 100% yours.' : 'Keep a float to take cash orders. Tips are 100% yours.'}</Txt>
        </Card>
        {LIVE ? null : <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          <Stat label="Today" value={naira(today.earned)} note={`${today.rides} rides`} />
          <Stat label="This week" value={naira(week.earned)} note={`${week.rides} rides`} />
          <Stat label="Tips (week)" value={naira(week.tips)} />
        </View>}
        {LIVE ? null : <Card>
          <Txt size={15} weight="bold">Bonus streak</Txt>
          <View style={{ height: 10, borderRadius: 5, backgroundColor: p.fill, overflow: 'hidden' }}><View style={{ height: 10, width: `${streak * 10}%`, backgroundColor: p.brand }} /></View>
          <Txt size={13} color={p.mute}>{streak} of 10 rides this week. Reach 10 for a bonus (amount set by ChowBuy).</Txt>
        </Card>}
        {!LIVE && unremitted > 0 ? (
          <Card style={{ borderColor: unremitted > COD_PAUSE_LIMIT ? p.bad : p.line }}>
            <Txt size={15} weight="bold">Cash in hand: {naira(unremitted)}</Txt>
            <Txt size={13} color={p.mute}>Cash orders pause above {naira(COD_PAUSE_LIMIT)}.</Txt>
            <Button label={`Pay in ${naira(unremitted)}`} variant="soft" onPress={() => remit(unremitted)} />
          </Card>
        ) : null}

        {LIVE ? <Card><Txt size={15} weight="bold">Payouts</Txt><Txt size={13} color={p.mute}>ChowBuy pays out your earnings. Instant bank withdrawal in the app arrives with the payments provider, and we will tell you when it is ready.</Txt></Card> : <>
        <Heading note="Instant transfer to any Nigerian bank account (NUBAN).">Cash out</Heading>
        <Card>
          <Pressable accessibilityRole="button" onPress={() => setPickBank((v) => !v)} style={{ height: 56, borderRadius: 14, borderWidth: 1.5, borderColor: p.line, justifyContent: 'center', paddingHorizontal: 14 }}>
            <Txt size={16} color={payoutBank ? p.ink : p.mute}>{payoutBank || 'Choose bank'}</Txt>
          </Pressable>
          {pickBank ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{NG_BANKS.map((b) => (
            <Pressable key={b} accessibilityRole="button" onPress={() => { set({ payoutBank: b }); setPickBank(false); }} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: b === payoutBank ? p.brand : p.fill }}>
              <Txt size={13} weight="bold" color={b === payoutBank ? '#fff' : p.ink}>{b}</Txt>
            </Pressable>))}</View> : null}
          <View style={{ flexDirection: 'row' }}><Field label="Account number (10 digits)" value={payoutNuban} onChangeText={(t) => set({ payoutNuban: t.replace(/\D/g, '').slice(0, 10) })} keyboardType="number-pad" /></View>
          <View style={{ flexDirection: 'row' }}><Field label="Amount (₦)" value={amount} onChangeText={(t) => setAmount(t.replace(/\D/g, ''))} keyboardType="number-pad" /></View>
          {msg ? <Txt size={13} color={msg.ok ? p.ok : p.bad}>{msg.text}</Txt> : null}
          <Button label="Withdraw" variant="brand" onPress={requestPayout} />
        </Card></>}

        <Heading>Activity</Heading>
        <Card>
          {txns.length === 0 ? <Txt size={14} color={p.mute}>Your deliveries and tips will appear here.</Txt> : null}
          {txns.slice(0, 15).map((t) => (
            <View key={t.id} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
              <View style={{ flex: 1 }}><Txt size={14} weight="bold">{t.title}</Txt><Txt size={12} color={p.mute}>{new Date(t.at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</Txt></View>
              <Txt size={14} weight="bold" color={t.amount >= 0 ? p.ok : p.ink}>{t.amount >= 0 ? '+' : '−'}{naira(Math.abs(t.amount))}</Txt>
            </View>))}
        </Card>
      </ScrollView>
      <SosButton bottom={20} />
    </SafeAreaView>
  );
}

/** Fleet riders are salaried: no fares, no earnings. Only shifts, counts, rating, on-time and their own tips. */
function FleetShifts() {
  const p = useTheme();
  const { shiftId, shiftStart, breakMinutes, deliveriesToday, rating, onTimePct, txns, hub } = useRider();
  const shift = SHIFTS.find((x) => x.id === shiftId);
  const worked = shiftStart ? minutesBetween(shiftStart, Date.now()) - breakMinutes : 0;
  const tips = txns.filter((t) => t.kind === 'tip');
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 110, gap: 14, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
        <Txt size={24} weight="display">My shifts</Txt>
        <Card>
          <Txt size={15} weight="bold">{shift ? `${shift.label} shift · ${shiftLabel(shift)}` : 'No shift running'}</Txt>
          <Txt size={13} color={p.mute}>{hub} · {fmtHours(Math.max(0, worked))} logged · {breakMinutes} min break</Txt>
        </Card>
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          <Stat label="Deliveries today" value={String(deliveriesToday)} />
          <Stat label="Rating" value={`${rating.toFixed(2)} ★`} />
          <Stat label="On-time" value={`${onTimePct}%`} />
        </View>
        <Heading note="Customers can tip you. You keep 100% of tips.">My tips</Heading>
        <Card>
          {tips.length === 0 ? <Txt size={14} color={p.mute}>No tips yet.</Txt> : tips.map((t) => (
            <View key={t.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Txt size={14}>{t.title}</Txt><Txt size={14} weight="bold" color={p.ok}>{naira(t.amount)}</Txt></View>))}
        </Card>
        <Card><Txt size={13} color={p.mute}>You are a ChowBuy Fleet rider, so your pay is your monthly salary. Per-ride fares are not shown to Fleet riders.</Txt></Card>
      </ScrollView>
      <SosButton bottom={20} />
    </SafeAreaView>
  );
}
