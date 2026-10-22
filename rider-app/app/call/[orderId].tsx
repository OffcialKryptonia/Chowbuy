import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Phone, PhoneOff } from 'lucide-react-native';
import { Button, Page, Txt } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { useRider } from '@/stores/rider';

/** Call screen. In-app (VoIP) and masked phone calls need the calling service, which is not connected yet, so nothing is dialled. */
export default function Call() {
  const p = useTheme();
  const r = useRouter();
  const a = useRider((s) => s.active);
  const [secs, setSecs] = useState(0);
  const [live, setLive] = useState(false);
  useEffect(() => { if (!live) return; const t = setInterval(() => setSecs((s) => s + 1), 1000); return () => clearInterval(t); }, [live]);
  return (
    <Page footer={live ? <Button label="End call" variant="primary" onPress={() => r.back()} /> : <Button label="Back" variant="soft" onPress={() => r.back()} />}>
      <View style={{ alignItems: 'center', gap: 10, paddingTop: 30 }}>
        <View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: live ? p.ok : p.fill, alignItems: 'center', justifyContent: 'center' }}>{live ? <PhoneOff size={40} color="#fff" /> : <Phone size={40} color={p.ink} />}</View>
        <Txt size={24} weight="display">{a?.order.customer ?? 'Customer'}</Txt>
        <Txt size={14} color={p.mute}>{live ? `Demo call ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}` : 'Your number stays hidden from the customer'}</Txt>
      </View>
      {!live ? <Button label="Call in the app (demo)" variant="brand" onPress={() => setLive(true)} /> : null}
      <View style={{ borderRadius: 14, backgroundColor: p.fill, padding: 14, gap: 4 }}>
        <Txt size={14} weight="bold">Not connected yet</Txt>
        <Txt size={13} color={p.mute}>Real in-app calls and masked phone calls (when data is poor) start once ChowBuy’s calling service is switched on. This screen shows the flow only; no call is placed.</Txt>
      </View>
    </Page>
  );
}
