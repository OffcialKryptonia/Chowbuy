import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bike, Building2, Car, Check, Truck, UserRound, type LucideIcon } from 'lucide-react-native';
import { Alert } from 'react-native';
import { Button, Field, Page, Txt, tap } from '@/components/ui';
import { LIVE } from '@/lib/config';
import * as live from '@/lib/live';
import { msg } from '@/lib/supabase';
import { toBackendVehicle } from '@/lib/live-map';
import { useTheme } from '@/lib/theme';
import { VEHICLES, type RiderType, type Vehicle } from '@/lib/validation';
import { useApply } from '@/stores/apply';

const TYPES: { id: RiderType; title: string; body: string; icon: LucideIcon }[] = [
  { id: 'fleet', title: 'ChowBuy Fleet', body: 'Salaried staff rider on a company bike, with set shifts at a ChowBuy hub.', icon: Building2 },
  { id: 'partner', title: 'ChowBuy Partner', body: 'Ride on your own schedule with your own vehicle and keep your earnings.', icon: UserRound },
];
const VEHICLE_ICON: Record<Vehicle, LucideIcon> = { motorcycle: Bike, bicycle: Bike, car: Car, truck: Truck, van: Truck };

function Choice({ selected, onPress, icon: Icon, title, note }: { selected: boolean; onPress: () => void; icon: LucideIcon; title: string; note?: string }) {
  const p = useTheme();
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => { tap(); onPress(); }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, borderWidth: selected ? 2 : 1.5, borderColor: selected ? p.brand : p.line, backgroundColor: selected ? p.brandSoft : p.surface }}>
      <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? p.brand : p.fill }}><Icon color={selected ? '#FFFFFF' : p.ink} size={22} /></View>
      <View style={{ flex: 1 }}>
        <Txt size={16} weight="bold">{title}</Txt>
        {note ? <Txt size={13} color={p.mute}>{note}</Txt> : null}
      </View>
      {selected ? <Check color={p.brand} size={22} strokeWidth={3} /> : null}
    </Pressable>
  );
}

/** Apply, step 3: Fleet or Partner, then the vehicle that rider type is allowed to use. */
export default function ApplyType() {
  const p = useTheme();
  const r = useRouter();
  const a = useApply();
  const vehicles = a.type ? VEHICLES[a.type] : [];
  const [busy, setBusy] = useState(false);
  const plateOk = !LIVE || a.vehicle === 'bicycle' || a.plate.trim().length >= 3;
  const ok = !!a.type && !!a.vehicle && vehicles.some((v) => v.id === a.vehicle) && plateOk && !busy;
  const submit = async () => {
    if (!LIVE) { a.set({ submitted: true }); r.replace('/apply/done'); return; }
    setBusy(true);
    try {
      const session = await live.signUp({ email: a.email, password: a.password, name: a.name, phone: a.phone });
      if (session) await live.apply({ name: a.name, plate: a.vehicle === 'bicycle' ? 'BICYCLE' : a.plate, vehicle: toBackendVehicle(a.vehicle), phone: a.phone });
      a.set({ submitted: true, password: '' });
      r.replace(session ? '/apply/done' : { pathname: '/apply/done', params: { confirm: '1' } });
    } catch (e) { Alert.alert('Could not create your account', msg(e)); } finally { setBusy(false); }
  };
  return (
    <Page footer={<Button label={busy ? 'Submitting…' : 'Submit application'} disabled={!ok} onPress={submit} />}>
      <Txt size={26} weight="display">How will you ride with ChowBuy?</Txt>
      <View style={{ gap: 12 }}>
        {TYPES.map((t) => <Choice key={t.id} selected={a.type === t.id} icon={t.icon} title={t.title} note={t.body} onPress={() => a.set({ type: t.id, vehicle: a.vehicle && VEHICLES[t.id].some((v) => v.id === a.vehicle) ? a.vehicle : null })} />)}
      </View>
      {a.type ? (
        <>
          <Txt size={18} weight="display" style={{ marginTop: 8 }}>Your vehicle</Txt>
          <View style={{ gap: 12 }}>
            {vehicles.map((v) => <Choice key={v.id} selected={a.vehicle === v.id} icon={VEHICLE_ICON[v.id]} title={v.label} note={v.note} onPress={() => a.set({ vehicle: v.id })} />)}
          </View>
        </>
      ) : <Txt size={14} color={p.mute}>Pick a rider type to see the vehicles you can use.</Txt>}
      {LIVE && a.type && a.vehicle && a.vehicle !== 'bicycle' ? <Field label="Plate number" value={a.plate} onChangeText={(v) => a.set({ plate: v })} autoCapitalize="characters" autoCorrect={false} /> : null}
    </Page>
  );
}
