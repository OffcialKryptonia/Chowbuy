import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Briefcase, Check, Crosshair, Home as HomeIcon, MapPin, Trash2 } from 'lucide-react-native';
import * as Location from 'expo-location';
import { Button, Chip, Field, Row, Sheet, Txt, useToast } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { suggestAreas } from '@/lib/discovery';
import { useSession } from '@/stores/session';
import { tap } from '@/lib/sound-effects';
import { DEMO } from '@/lib/config';
import { useAuth } from '@/stores/auth';
import { addAddressRemote, removeAddressRemote } from '@/lib/backend';
import type { SavedAddress } from '@/lib/types';

const AREA_COORDS: Record<string, [number, number]> = {
  'Victoria Island': [6.4281, 3.4219], Ikoyi: [6.4549, 3.4346], 'Lekki Phase 1': [6.4474, 3.4723], 'Lekki Phase 2': [6.4698, 3.5852], Oniru: [6.4334, 3.4527],
  Ajah: [6.4698, 3.5852], Maryland: [6.5667, 3.3667], 'Ikeja GRA': [6.5833, 3.3500], Surulere: [6.5000, 3.3500], Yaba: [6.5095, 3.3711], Gbagada: [6.5527, 3.3866],
  Magodo: [6.6120, 3.3970], 'Banana Island': [6.4600, 3.4400], Festac: [6.4667, 3.2833], Apapa: [6.4500, 3.3600],
};

export function AddressPicker({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const p = useTheme();
  const toast = useToast();
  const { addresses, activeAddressId, setActiveAddress, addAddress, removeAddress } = useSession();
  const [adding, setAdding] = useState(false);
  const [line, setLine] = useState('');
  const [area, setArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [label, setLabel] = useState<SavedAddress['label']>('Home');
  const [err, setErr] = useState<string | null>(null);
  const sugg = adding && area.length > 0 && !AREA_COORDS[area] ? suggestAreas(area) : [];

  const gps = async () => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) { toast('Allow location access to use your current position.', 'bad'); return; }
    const pos = await Location.getCurrentPositionAsync({});
    const [rev] = await Location.reverseGeocodeAsync(pos.coords).catch(() => []);
    setLine([rev?.streetNumber, rev?.street].filter(Boolean).join(' ') || line);
    setArea(rev?.district ?? rev?.city ?? area);
    (pending.current = { latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    toast('Location pinned.', 'ok');
  };
  const pending = React.useRef<{ latitude: number; longitude: number } | null>(null);

  const uid = useAuth((s) => s.session?.user.id);
  const save = async () => {
    if (line.trim().length < 5) { setErr('Enter a street address.'); return; }
    const c = AREA_COORDS[area.trim()];
    if (!pending.current && !c) { setErr('Pick a neighbourhood from the suggestions or use your current location.'); return; }
    const loc = pending.current ?? { latitude: c![0], longitude: c![1] };
    const a = { label, line: line.trim(), area: area.trim() + ', Lagos', landmark: landmark.trim() || undefined, location: loc };
    if (!DEMO) {
      if (!uid) return;
      try {
        const saved = await addAddressRemote(uid, a);
        useSession.setState((s) => ({ addresses: [...s.addresses, saved], activeAddressId: saved.id }));
      } catch (e) { setErr(e instanceof Error ? e.message : 'Could not save the address.'); return; }
    } else addAddress(a);
    pending.current = null; setAdding(false); setLine(''); setArea(''); setLandmark(''); setErr(null); toast('Address saved.', 'ok'); onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={adding ? 'New address' : 'Deliver to'} tall>
      {!adding ? (
        <>
          {addresses.map((a) => (
            <Pressable key={a.id} accessibilityRole="button" accessibilityState={{ selected: a.id === activeAddressId }} onPress={() => { tap(); setActiveAddress(a.id); onClose(); }}
              style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: a.id === activeAddressId ? p.brand : p.line, backgroundColor: a.id === activeAddressId ? p.brandSoft : p.surface }}>
              {a.label === 'Home' ? <HomeIcon size={20} color={p.brand} /> : a.label === 'Office' ? <Briefcase size={20} color={p.brand} /> : <MapPin size={20} color={p.brand} />}
              <View style={{ flex: 1 }}><Txt size={15} weight="bold">{a.label}</Txt><Txt size={13} color={p.mute} numberOfLines={2}>{a.line}, {a.area}</Txt></View>
              {a.id === activeAddressId ? <Check size={18} color={p.brand} /> : null}
              {addresses.length > 1 ? <Pressable accessibilityLabel={`Remove ${a.label}`} hitSlop={8} onPress={async () => { if (!DEMO) { try { await removeAddressRemote(a.id); } catch { toast('Could not remove the address.', 'bad'); return; } } removeAddress(a.id); toast('Address removed.', 'info'); }}><Trash2 size={18} color={p.mute} /></Pressable> : null}
            </Pressable>
          ))}
          <Button label="Add new address" onPress={() => setAdding(true)} variant="soft" />
        </>
      ) : (
        <>
          <Row gap={8}>{(['Home', 'Office', 'Other'] as const).map((l) => <Chip key={l} label={l} selected={label === l} onPress={() => setLabel(l)} />)}</Row>
          <Button label="Use my current location" icon={Crosshair} variant="ghost" onPress={gps} />
          <Field label="Street address" value={line} onChangeText={setLine} placeholder="14 Adeola Odeku Street" autoCapitalize="words" />
          <Field label="Neighbourhood" value={area} onChangeText={(t) => { setArea(t); pending.current = null; }} placeholder="Start typing, e.g. Lekki" autoCapitalize="words" />
          {sugg.length ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{sugg.map((s) => <Chip key={s} label={s} onPress={() => setArea(s)} />)}</View> : null}
          <Field label="Landmark (helps your rider)" value={landmark} onChangeText={setLandmark} placeholder="Opposite Eko Hotel gate" />
          {err ? <Txt size={13} color={p.bad}>{err}</Txt> : null}
          <Button label="Save address" onPress={save} />
          <Button label="Back" variant="ghost" onPress={() => { setAdding(false); setErr(null); }} />
        </>
      )}
    </Sheet>
  );
}
