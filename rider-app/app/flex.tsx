import React, { useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, Circle } from 'lucide-react-native';
import { Button, Field, Page, Txt, tap } from '@/components/ui';
import { Card, Pill } from '@/components/kit';
import * as live from '@/lib/live';
import { msg } from '@/lib/supabase';
import { cleanAccount, FLEX_STATUS_LABEL, flexChecklist, flexEditable, NAIRA_ACCOUNT } from '@/lib/models';
import { useTheme } from '@/lib/theme';
import { useRider } from '@/stores/rider';

/**
 * ChowBuy Flex application: service area, settlement details, rider agreement, review and status.
 * Account, personal details, identity documents and vehicle reuse the normal sign-up and Documents screens.
 * The server decides everything that matters: settlement is stored as "pending verification" and registration alone never grants deliveries.
 */
export default function FlexApplication() {
  const p = useTheme();
  const r = useRouter();
  const me = useRider((s) => s.me);
  const hydrate = useRider((s) => s.hydrateMe);
  const f = me?.flex;
  const [city, setCity] = useState(f?.city ?? '');
  const [bank, setBank] = useState(f?.settlement?.bank ?? '');
  const [holder, setHolder] = useState(f?.settlement?.accountName ?? '');
  const [acct, setAcct] = useState('');
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { void live.me().then((m) => m && hydrate(m)).catch(() => {}); }, [hydrate]);

  if (!me || me.model !== 'flex' || !f) {
    return <Page><Txt size={22} weight="display">ChowBuy Flex</Txt><Txt size={15} color={p.mute}>This page is for riders who applied for ChowBuy Flex.</Txt></Page>;
  }
  const editable = flexEditable(f);
  const items = flexChecklist(me);
  const wantsSettlement = bank.trim() || holder.trim() || acct;
  const settlementOk = !wantsSettlement || (bank.trim().length >= 2 && holder.trim().length >= 2 && NAIRA_ACCOUNT.test(acct));
  const agreementReady = !!f.currentAgreementVersion;
  const canSubmit = editable && !!city && settlementOk && (agreementReady ? agree : false) && !busy;

  const refresh = async () => { const m = await live.me(); if (m) hydrate(m); };
  const submit = async () => {
    setBusy(true);
    try {
      await live.flexSave({ city, bank, accountName: holder, accountNo: acct });
      await live.flexSubmit(f.currentAgreementVersion ?? '');
      await refresh();
      Alert.alert('Application submitted', 'ChowBuy will review it. Approval does not guarantee deliveries.');
    } catch (e) { Alert.alert('Could not submit', msg(e)); } finally { setBusy(false); }
  };

  return (
    <Page footer={editable ? <Button label={busy ? 'Submitting…' : 'Submit application'} disabled={!canSubmit} onPress={submit} /> : <Button label="Back to profile" variant="soft" onPress={() => r.back()} />}>
      <Txt size={26} weight="display">ChowBuy Flex</Txt>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Pill label={f.status ? FLEX_STATUS_LABEL[f.status] : 'Draft'} color={f.status === 'approved' ? p.ok : f.status === 'rejected' || f.status === 'suspended' ? p.bad : f.status === 'action_required' ? p.warn : p.info} soft />
      </View>
      {f.note ? <Card style={{ borderColor: p.warn }}><Txt size={14} weight="bold">Message from ChowBuy</Txt><Txt size={14} color={p.mute}>{f.note}</Txt></Card> : null}
      {!f.registrationOpen && editable ? <Card><Txt size={14} color={p.mute}>Flex registration is not open right now. You can come back later.</Txt></Card> : null}

      <Card>
        <Txt size={16} weight="bold">Your checklist</Txt>
        {items.map((i) => (
          <View key={i.id} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 4 }} accessible accessibilityLabel={`${i.label}: ${i.done ? 'done' : 'not done'}`}>
            {i.done ? <Check size={18} color={p.ok} /> : <Circle size={18} color={p.mute} />}
            <View style={{ flex: 1 }}><Txt size={14} weight="semi">{i.label}</Txt>{i.note ? <Txt size={12} color={p.mute}>{i.note}</Txt> : null}</View>
          </View>
        ))}
        <Pressable accessibilityRole="button" onPress={() => { tap(); r.push('/kyc'); }}><Txt size={14} weight="bold" color={p.brand}>Open documents and verification</Txt></Pressable>
      </Card>

      {editable ? (
        <>
          <Txt size={18} weight="display">Service area</Txt>
          {f.regions.length === 0 ? <Txt size={14} color={p.mute}>No areas are open for Flex yet.</Txt> : (
            <View style={{ gap: 8 }}>
              {f.regions.map((c) => (
                <Pressable key={c} accessibilityRole="radio" accessibilityState={{ selected: city === c }} onPress={() => { tap(); setCity(c); }}
                  style={{ padding: 14, borderRadius: 14, borderWidth: city === c ? 2 : 1.5, borderColor: city === c ? p.brand : p.line, backgroundColor: city === c ? p.brandSoft : p.surface }}>
                  <Txt size={15} weight="semi">{c}</Txt>
                </Pressable>
              ))}
            </View>
          )}
          <Txt size={18} weight="display">Settlement details</Txt>
          <Txt size={13} color={p.mute}>Where your earnings will be paid. These stay marked pending verification until ChowBuy confirms them with its payout provider.</Txt>
          <View style={{ flexDirection: 'row' }}><Field label="Bank" value={bank} onChangeText={setBank} /></View>
          <View style={{ flexDirection: 'row' }}><Field label="Account name" value={holder} onChangeText={setHolder} /></View>
          <View style={{ flexDirection: 'row' }}><Field label={f.settlement ? `Account number (saved ••••${f.settlement.last4})` : 'Account number'} value={acct} onChangeText={(v) => setAcct(cleanAccount(v))} keyboardType="number-pad" error={acct && !NAIRA_ACCOUNT.test(acct) ? 'Enter 10 digits' : null} /></View>
          <Txt size={18} weight="display">Rider agreement</Txt>
          {agreementReady ? (
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: agree }} onPress={() => { tap(); setAgree(!agree); }} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: agree ? p.brand : p.line, backgroundColor: agree ? p.brand : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{agree ? <Check size={16} color="#fff" /> : null}</View>
              <View style={{ flex: 1 }}><Txt size={14}>I have read and accept the ChowBuy Flex rider agreement, version {f.currentAgreementVersion}.</Txt></View>
            </Pressable>
          ) : <Txt size={14} color={p.mute}>The rider agreement has not been published yet, so applications cannot be submitted.</Txt>}
        </>
      ) : null}

      {f.status === 'submitted' || f.status === 'under_review' ? <Card><Txt size={14} color={p.mute}>ChowBuy is reviewing your application. We will not assume approval: you can go online only once it is approved and Flex is open in your area.</Txt></Card> : null}
      {f.status === 'approved' && f.availability === 'unavailable' ? <Card><Txt size={14} color={p.mute}>{f.blockedReason}</Txt></Card> : null}
    </Page>
  );
}
