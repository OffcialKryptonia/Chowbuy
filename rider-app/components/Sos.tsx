import React, { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Modal, Pressable, View } from 'react-native';
import { Siren } from 'lucide-react-native';
import { Button, Txt, tap } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { emergencyNumbers, smsUrl, sosSms, validContacts } from '@/lib/sos';
import { useRider } from '@/stores/rider';
import { useApply } from '@/stores/apply';

/** Floating SOS button. One tap opens a 5 second countdown (cancel any time), then sends the alert. */
export function SosButton({ bottom = 24 }: { bottom?: number }) {
  const p = useTheme();
  const [open, setOpen] = useState(false);
  const [left, setLeft] = useState(5);
  const [sent, setSent] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const { contacts, city, active, lastPos, logSos } = useRider();
  const email = useApply((s) => s.email);

  const clear = () => { if (timer.current) clearInterval(timer.current); timer.current = null; };
  useEffect(() => clear, []);

  const fire = async () => {
    clear();
    let lat = lastPos?.lat ?? 6.4474, lng = lastPos?.lng ?? 3.4723, battery: number | null = null;
    try {
      const Location = require('expo-location') as typeof import('expo-location');
      const perm = await Location.getForegroundPermissionsAsync();
      if (perm.granted) { const l = await Location.getCurrentPositionAsync({}); lat = l.coords.latitude; lng = l.coords.longitude; }
    } catch { /* use the last known position */ }
    const name = email ? email.split('@')[0] : 'A ChowBuy rider';
    const body = sosSms({ riderName: name, lat, lng, battery, orderId: active?.order.id ?? null, at: new Date() });
    const phones = validContacts(contacts).map((c) => c.phone);
    logSos({ at: Date.now(), lat, lng, orderId: active?.order.id ?? null, sent: phones });
    setSent(true);
    if (phones.length) Linking.openURL(smsUrl(phones, body)).catch(() => {});
  };

  const begin = () => {
    tap(); setSent(false); setLeft(5); setOpen(true);
    clear();
    timer.current = setInterval(() => setLeft((n) => { if (n <= 1) { void fire(); return 0; } return n - 1; }), 1000);
  };
  const cancel = () => { clear(); setOpen(false); setSent(false); };
  const nums = emergencyNumbers(city);
  const noContacts = validContacts(contacts).length === 0;

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel="Emergency SOS" onPress={begin}
        style={{ position: 'absolute', right: 16, bottom, width: 56, height: 56, borderRadius: 28, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }}>
        <Siren color="#fff" size={26} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={cancel}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,.6)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: p.surface, borderRadius: 24, padding: 22, gap: 14 }}>
            <Txt size={22} weight="display" color="#EF4444">{sent ? 'Alert sent' : 'Sending emergency alert'}</Txt>
            {!sent ? (
              <>
                <Txt size={44} weight="displayX" align="center">{left}</Txt>
                <Txt size={14} color={p.mute} align="center">Your live location and order details go to the ChowBuy Safety Command Centre and your emergency contacts. Tap Cancel if this was a mistake.</Txt>
                <Button label="Cancel" variant="soft" onPress={cancel} />
              </>
            ) : (
              <>
                <Txt size={14} color={p.mute}>{noContacts ? 'You have not added emergency contacts yet. Add two in Profile, Emergency contacts.' : 'A message with your location is ready to send to your emergency contacts. Press Send in your messages app.'}</Txt>
                <Txt size={14} weight="bold">Call for help now</Txt>
                {nums.map((n) => <Button key={n.number} label={`Call ${n.label} · ${n.number}`} variant="brand" onPress={() => Linking.openURL(`tel:${n.number}`).catch(() => Alert.alert('Cannot place call', `Dial ${n.number} from your phone.`))} />)}
                <Button label="Close" variant="soft" onPress={cancel} />
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
