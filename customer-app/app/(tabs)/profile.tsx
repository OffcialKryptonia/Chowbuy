import React, { useState } from 'react';
import { Linking, Pressable, Switch, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { ArrowDownLeft, ArrowUpRight, Award, HeadphonesIcon, MapPin, Monitor, Moon, Plus, Send, Sun, type LucideIcon } from 'lucide-react-native';
import { Avatar, Button, Card, Field, Header, Row, Screen, SectionTitle, Sheet, Txt, useToast } from '@/components/ui';
import { AccountPrefs } from '@/components/profile/AccountPrefs';
import { SoundPicker } from '@/components/profile/SoundPicker';
import { AddressPicker } from '@/components/discovery/AddressPicker';
import { useSession } from '@/stores/session';
import { useSettings } from '@/stores/settings';
import { useTheme, radius } from '@/lib/theme';
import { dateTime, ngn, normalizeNgPhone } from '@/lib/format';
import { initiateTopup, initiatePayment, verifyPayment } from '@/lib/payments';
import { loadAccount, walletSend } from '@/lib/backend';
import { useAuth } from '@/stores/auth';
import { DEMO } from '@/lib/config';
import { success, tap, warn } from '@/lib/sound-effects';
import type { ThemeMode } from '@/lib/types';

const MODES: { id: ThemeMode; label: string; icon: LucideIcon }[] = [{ id: 'light', label: 'Light', icon: Sun }, { id: 'dark', label: 'Dark', icon: Moon }, { id: 'system', label: 'System', icon: Monitor }];
const AMOUNTS = [1000, 2000, 5000, 10000];

export default function Profile() {
  const p = useTheme();
  const toast = useToast();
  const s = useSession();
  const st = useSettings();
  const [sheet, setSheet] = useState<null | 'topup' | 'send'>(null);
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [addr, setAddr] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const uid = useAuth((a) => a.session?.user.id);
  const close = () => { setSheet(null); setAmount(''); setPhone(''); setErr(null); };

  const topUp = async () => {
    const n = Number(amount);
    const bad = n >= 500 && n <= 500000 ? null : 'Enter an amount between ₦500 and ₦500,000.';
    if (bad) { setErr(bad); warn(); return; }
    setBusy(true);
    try {
      if (!DEMO) {
        const init = await initiateTopup('korapay', n);
        if (init.checkoutUrl) await WebBrowser.openBrowserAsync(init.checkoutUrl);
        let st = await verifyPayment(init.reference);
        for (let i = 0; i < 5 && st === 'pending'; i++) { await new Promise((r) => setTimeout(r, 2000)); st = await verifyPayment(init.reference); }
        if (st !== 'paid') { setErr('We have not received the payment yet. Your balance updates as soon as it arrives.'); warn(); return; }
        if (uid) await loadAccount(uid);   // the server credits the wallet; the app only refreshes
        success(); toast(`${ngn(n)} added to your wallet`, 'ok'); close(); return;
      }
      const init = await initiatePayment('korapay', n, 'TOPUP', s.email);
      const e = s.topUp(n);
      if (e) { setErr(e); return; }
      success(); toast(`${ngn(n)} added to your wallet`, 'ok'); close();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not start the top-up.'); warn(); }
    finally { setBusy(false); }
  };

  const send = async () => {
    const to = normalizeNgPhone(phone);
    if (!to) { setErr('Enter a valid Nigerian mobile number.'); warn(); return; }
    if (to.replace(/\D/g, '') === s.phone.replace(/\D/g, '')) { setErr('You cannot send money to yourself.'); warn(); return; }
    if (!DEMO) {
      setBusy(true);
      try { await walletSend(to, Number(amount)); if (uid) await loadAccount(uid); }
      catch (e) { setErr(e instanceof Error ? e.message : 'Could not send the money.'); warn(); return; }
      finally { setBusy(false); }
    } else {
      const e = s.send(Number(amount), to);
      if (e) { setErr(e); warn(); return; }
    }
    success(); toast(`${ngn(Number(amount))} sent to ${to}`, 'ok'); close();
  };

  return (
    <Screen>
      <Header title="Profile" back={false} />
      <Card><Row gap={14}>
        <Avatar name={s.name} size={60} />
        <View style={{ flex: 1 }}><Txt size={19} weight="display">{s.name}</Txt><Txt size={13} color={p.mute}>{s.phone}</Txt><Txt size={13} color={p.mute}>{s.email}</Txt></View>
      </Row>
      <Row gap={8} style={{ marginTop: 12, backgroundColor: p.brandSoft, borderRadius: radius.md, padding: 10 }}><Award size={18} color={p.brand} /><Txt size={14} weight="semi" color={p.brandInk}>{s.points} loyalty points</Txt></Row></Card>

      <View style={{ backgroundColor: p.brand, borderRadius: radius.xl, padding: 20, gap: 14 }}>
        <Txt size={13} color="#fff">Wallet balance</Txt>
        <Txt size={34} weight="displayX" color="#fff">{ngn(s.wallet)}</Txt>
        <Row gap={10}>
          <View style={{ flex: 1 }}><Button small variant="ghost" icon={Plus} label="Top up" onPress={() => setSheet('topup')} /></View>
          <View style={{ flex: 1 }}><Button small variant="ghost" icon={Send} label="Send" onPress={() => setSheet('send')} /></View>
        </Row>
      </View>

      <SectionTitle title="Transactions" />
      <Card pad={4}>
        {s.txs.slice(0, 8).map((t, i) => (
          <Row key={t.id} gap={12} style={{ padding: 12, borderTopWidth: i ? 1 : 0, borderTopColor: p.line }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.dir > 0 ? p.okSoft : p.fill, alignItems: 'center', justifyContent: 'center' }}>{t.dir > 0 ? <ArrowDownLeft size={18} color={p.ok} /> : <ArrowUpRight size={18} color={p.mute} />}</View>
            <View style={{ flex: 1 }}><Txt size={14} weight="semi" numberOfLines={1}>{t.title}</Txt><Txt size={12} color={p.mute}>{dateTime(t.at)}</Txt></View>
            <Txt size={14} weight="bold" color={t.dir > 0 ? p.ok : p.ink}>{t.dir > 0 ? '+' : '-'}{ngn(t.amount)}</Txt>
          </Row>
        ))}
      </Card>

      <SectionTitle title="Saved addresses" action="Manage" onAction={() => setAddr(true)} />
      <Card pad={4}>
        {s.addresses.map((a, i) => (
          <Row key={a.id} gap={12} style={{ padding: 12, borderTopWidth: i ? 1 : 0, borderTopColor: p.line }}>
            <MapPin size={18} color={p.brand} /><View style={{ flex: 1 }}><Txt size={14} weight="bold">{a.label}</Txt><Txt size={13} color={p.mute} numberOfLines={1}>{a.line}, {a.area}</Txt></View>
          </Row>
        ))}
      </Card>

      <SectionTitle title="Appearance" />
      <Row gap={8}>
        {MODES.map((m) => {
          const on = st.theme === m.id;
          return (
            <Pressable key={m.id} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => { tap(); st.set({ theme: m.id }); }}
              style={{ flex: 1, alignItems: 'center', gap: 6, paddingVertical: 14, borderRadius: radius.lg, borderWidth: on ? 2 : 1, borderColor: on ? p.brand : p.line, backgroundColor: on ? p.brandSoft : p.surface }}>
              <m.icon size={22} color={on ? p.brand : p.mute} /><Txt size={13} weight="bold" color={on ? p.brandInk : p.ink}>{m.label}</Txt>
            </Pressable>
          );
        })}
      </Row>
      <Card pad={4}>
        {([['sounds', 'Sounds'], ['haptics', 'Haptic feedback']] as const).map(([k, label], i) => (
          <Row key={k} style={{ padding: 14, justifyContent: 'space-between', borderTopWidth: i ? 1 : 0, borderTopColor: p.line }}>
            <Txt size={15}>{label}</Txt>
            <Switch value={st[k]} onValueChange={(v) => st.set({ [k]: v })} trackColor={{ true: p.brand, false: p.line }} accessibilityLabel={label} />
          </Row>
        ))}
        <SoundPicker />
      </Card>

      {!DEMO ? <AccountPrefs /> : null}

      <SectionTitle title="Support" />
      <Card onPress={() => void Linking.openURL('mailto:support@chowbuy.ng?subject=ChowBuy%20app%20support')}>
        <Row gap={12}><HeadphonesIcon size={22} color={p.brand} /><View style={{ flex: 1 }}><Txt size={15} weight="bold">Contact support</Txt><Txt size={13} color={p.mute}>support@chowbuy.ng · replies within a few hours</Txt></View></Row>
      </Card>

      {!DEMO ? (
        <>
          <SectionTitle title="Account" />
          <Button variant="ghost" label="Sign out" onPress={() => { void useAuth.getState().signOut(); }} />
          <Button variant="danger" small label="Delete my account" onPress={() => setConfirmDel(true)} />
        </>
      ) : null}

      <AddressPicker visible={addr} onClose={() => setAddr(false)} />

      <Sheet visible={confirmDel} onClose={() => setConfirmDel(false)} title="Delete your account?">
        <Txt size={14} color={p.mute}>This removes your profile, saved addresses and sign-in. Spend or send your wallet balance first, and wait for any active order to be delivered. Past orders are kept for our financial records without your name.</Txt>
        <Button variant="danger" loading={busy} label="Delete permanently" onPress={async () => {
          setBusy(true);
          try { await useAuth.getState().deleteAccount(); } catch (e) { toast(e instanceof Error ? e.message : 'Could not delete the account.', 'bad'); setConfirmDel(false); }
          finally { setBusy(false); }
        }} />
        <Button variant="ghost" label="Keep my account" onPress={() => setConfirmDel(false)} />
      </Sheet>
      <Sheet visible={sheet === 'topup'} onClose={close} title="Top up wallet">
        <Row gap={8} style={{ flexWrap: 'wrap' }}>{AMOUNTS.map((a) => <Pressable key={a} onPress={() => { tap(); setAmount(String(a)); setErr(null); }} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill, borderWidth: 1, borderColor: amount === String(a) ? p.brand : p.line, backgroundColor: amount === String(a) ? p.brandSoft : p.surface }}><Txt weight="bold">{ngn(a)}</Txt></Pressable>)}</Row>
        <Field label="Amount (₦)" keyboardType="number-pad" value={amount} onChangeText={(v) => { setAmount(v.replace(/\D/g, '').slice(0, 6)); setErr(null); }} error={err} />
        <Txt size={12} color={p.mute}>Paid securely through Korapay. Your card details never touch ChowBuy.</Txt>
        <Button loading={busy} label="Continue to payment" onPress={topUp} />
      </Sheet>
      <Sheet visible={sheet === 'send'} onClose={close} title="Send money">
        <Field label="Recipient phone" keyboardType="phone-pad" value={phone} onChangeText={(v) => { setPhone(v); setErr(null); }} placeholder="0803 000 0000" />
        <Field label="Amount (₦)" keyboardType="number-pad" value={amount} onChangeText={(v) => { setAmount(v.replace(/\D/g, '').slice(0, 6)); setErr(null); }} error={err} />
        <Txt size={12} color={p.mute}>Available: {ngn(s.wallet)}</Txt>
        <Button loading={busy} label="Send" onPress={send} />
      </Sheet>
    </Screen>
  );
}
