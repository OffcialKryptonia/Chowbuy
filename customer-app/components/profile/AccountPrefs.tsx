import React, { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';
import { Button, Card, Field, Row, SectionTitle, Txt, useToast } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/stores/auth';
import { useSession } from '@/stores/session';
import { loadAccount } from '@/lib/backend';
import { normalizeNgPhone } from '@/lib/format';
import { useTheme } from '@/lib/theme';
import { success, warn } from '@/lib/sound-effects';

/** Live mode only: promotional message opt-outs, and a mobile-number prompt for accounts made with Google or Apple. */
export function AccountPrefs() {
  const p = useTheme();
  const toast = useToast();
  const uid = useAuth((s) => s.session?.user.id);
  const phone = useSession((s) => s.phone);
  const [prefs, setPrefs] = useState<{ marketing_email: boolean; marketing_push: boolean } | null>(null);
  const [num, setNum] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!uid) return;
    void supabase.from('profiles').select('marketing_email,marketing_push').eq('id', uid).maybeSingle().then(({ data }) => { if (data) setPrefs(data); });
  }, [uid]);

  const flip = async (k: 'marketing_email' | 'marketing_push', v: boolean) => {
    if (!uid || !prefs) return;
    const prev = prefs; setPrefs({ ...prefs, [k]: v });
    const { error } = await supabase.from('profiles').update({ [k]: v }).eq('id', uid);
    if (error) { setPrefs(prev); toast('Could not save that. Try again.', 'bad'); }
  };

  const savePhone = async () => {
    const n = normalizeNgPhone(num);
    if (!n) { setErr('Enter a valid Nigerian mobile number.'); warn(); return; }
    if (!uid) return;
    setBusy(true); setErr(null);
    const { error } = await supabase.from('profiles').update({ phone: n }).eq('id', uid);
    setBusy(false);
    if (error) { setErr(/duplicate|unique/i.test(error.message) ? 'That number is already on another account.' : 'Could not save your number. Try again.'); warn(); return; }
    success(); toast('Mobile number saved.'); await loadAccount(uid);
  };

  return (
    <>
      {!phone ? (
        <>
          <SectionTitle title="Add your mobile number" />
          <Card>
            <View style={{ gap: 10 }}>
              <Txt size={13} color={p.mute}>Friends use your number to send you money from their wallet. It is never shown to riders.</Txt>
              <Field label="Mobile number" value={num} onChangeText={(v) => { setNum(v); setErr(null); }} keyboardType="phone-pad" placeholder="0803 000 0000" error={err} />
              <Button label="Save number" loading={busy} onPress={() => void savePhone()} />
            </View>
          </Card>
        </>
      ) : null}
      <SectionTitle title="Notifications" />
      <Card pad={4}>
        {([['marketing_email', 'Promotional emails', 'Offers and news from ChowBuy'], ['marketing_push', 'Promotional push notifications', 'Deals sent to this device']] as const).map(([k, label, sub], i) => (
          <Row key={k} style={{ padding: 14, justifyContent: 'space-between', borderTopWidth: i ? 1 : 0, borderTopColor: p.line }}>
            <View style={{ flex: 1, paddingRight: 12 }}><Txt size={15}>{label}</Txt><Txt size={12} color={p.mute}>{sub}</Txt></View>
            <Switch value={prefs ? prefs[k] : true} disabled={!prefs} onValueChange={(v) => void flip(k, v)} trackColor={{ true: p.brand, false: p.line }} accessibilityLabel={label} />
          </Row>
        ))}
        <Txt size={12} color={p.mute} style={{ padding: 14, paddingTop: 4 }}>Order updates and receipts are always sent.</Txt>
      </Card>
    </>
  );
}
