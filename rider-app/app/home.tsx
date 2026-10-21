import React from 'react';
import { Pressable, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, Play } from 'lucide-react-native';
import { Button, Page, Txt, tap } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { RINGS, DEFAULT_RING, isRingId, previewRing, type RingId } from '@/lib/rings';
import { usePrefs } from '@/stores/prefs';
import { useApply } from '@/stores/apply';

/** Landing after sign-in. Live map, shifts and deliveries arrive in the next build; ring tones and the offer screen work now. */
export default function Home() {
  const p = useTheme();
  const r = useRouter();
  const saved = usePrefs((s) => s.ring);
  const vibrate = usePrefs((s) => s.vibrate);
  const set = usePrefs((s) => s.set);
  const type = useApply((s) => s.type);
  const verified = useApply((s) => s.verified);
  const current: RingId = isRingId(saved) ? saved : DEFAULT_RING;

  return (
    <Page back={false} footer={<><Button label="Simulate an incoming order" variant="brand" onPress={() => r.push('/offer')} /><Button label="Sign out" variant="soft" onPress={() => r.replace('/')} /></>}>
      <Txt size={26} weight="display">You’re signed in</Txt>
      {verified ? <Txt size={14} weight="bold" color={p.ok}>{'✓ Verified demo rider · ' + (type === 'fleet' ? 'Fleet (salaried)' : 'Partner (per ride)')}</Txt> : null}
      <Txt size={14} color={p.mute}>Preview build: onboarding, ring tones and the order offer screen. Shifts and deliveries are not connected to the backend yet.</Txt>

      <Txt size={18} weight="display" style={{ marginTop: 8 }}>New order ring</Txt>
      <Txt size={13} color={p.mute}>The ring plays until you accept or decline an order. Tap one to hear it.</Txt>
      <View style={{ gap: 10 }}>
        {RINGS.map((rg) => {
          const on = rg.id === current;
          return (
            <Pressable key={rg.id} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={`${rg.label}. ${rg.note}`}
              onPress={() => { tap(); set({ ring: rg.id }); void previewRing(rg.id); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: on ? 2 : 1.5, borderColor: on ? p.brand : p.line, backgroundColor: on ? p.brandSoft : p.surface }}>
              <View style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? p.brand : p.fill }}><Play size={16} color={on ? '#fff' : p.ink} /></View>
              <View style={{ flex: 1 }}><Txt size={15} weight="bold">{rg.label}</Txt><Txt size={12} color={p.mute}>{rg.note}</Txt></View>
              {on ? <Check size={20} color={p.brand} /> : null}
            </Pressable>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
        <View style={{ flex: 1, paddingRight: 12 }}><Txt size={15}>Vibrate with the ring</Txt><Txt size={12} color={p.mute}>Helps when the phone is in your pocket</Txt></View>
        <Switch value={vibrate} onValueChange={(v) => set({ vibrate: v })} trackColor={{ true: p.brand, false: p.line }} accessibilityLabel="Vibrate with the ring" />
      </View>
    </Page>
  );
}
