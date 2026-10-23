import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Field, Page, Txt } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { validContacts } from '@/lib/sos';
import { useRider } from '@/stores/rider';
import { LIVE } from '@/lib/config';
import * as live from '@/lib/live';
import { msg } from '@/lib/supabase';

export default function EmergencyContacts() {
  const p = useTheme();
  const r = useRouter();
  const saved = useRider((s) => s.contacts);
  const setContacts = useRider((s) => s.setContacts);
  const [c, setC] = useState(saved.length >= 2 ? saved : [{ name: '', phone: '' }, { name: '', phone: '' }]);
  const upd = (i: number, k: 'name' | 'phone', v: string) => setC((x) => x.map((e, j) => (j === i ? { ...e, [k]: v } : e)));
  const [busy, setBusy] = useState(false);
  const ok = validContacts(c).length >= 2 && !busy;
  const save = async () => {
    if (LIVE) { setBusy(true); try { await live.saveContacts(c); } catch (e) { Alert.alert('Could not save contacts', msg(e)); setBusy(false); return; } setBusy(false); }
    setContacts(c); r.back();
  };
  return (
    <Page footer={<Button label={busy ? 'Saving…' : 'Save contacts'} disabled={!ok} onPress={save} />}>
      <Txt size={26} weight="display">Emergency contacts</Txt>
      <Txt size={14} color={p.mute}>If you press SOS we send these two people your live location. Choose people who will pick up.</Txt>
      {c.map((e, i) => (
        <View key={i} style={{ gap: 10 }}>
          <Txt size={15} weight="bold">Contact {i + 1}</Txt>
          <View style={{ flexDirection: 'row' }}><Field label="Full name" value={e.name} onChangeText={(v) => upd(i, 'name', v)} /></View>
          <View style={{ flexDirection: 'row' }}><Field label="Phone number" value={e.phone} onChangeText={(v) => upd(i, 'phone', v)} keyboardType="phone-pad" /></View>
        </View>
      ))}
    </Page>
  );
}
