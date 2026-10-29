import React from 'react';
import { ScrollView, Switch, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Check, FileCheck2, HeartHandshake, LogOut, Play, Zap } from 'lucide-react-native';
import { Button, Txt, tap } from '@/components/ui';
import { Card, Heading, IconRow, Pill } from '@/components/kit';
import { SosButton } from '@/components/Sos';
import { useTheme } from '@/lib/theme';
import { RINGS, DEFAULT_RING, isRingId, previewRing, type RingId } from '@/lib/rings';
import { requiredDocs, kycSummary } from '@/lib/kyc';
import { validContacts } from '@/lib/sos';
import { usePrefs } from '@/stores/prefs';
import { useApply } from '@/stores/apply';
import { useRider } from '@/stores/rider';
import { LIVE } from '@/lib/config';
import { FLEX_STATUS_LABEL } from '@/lib/models';
import { endSession } from '@/lib/live-session';

export default function Profile() {
  const p = useTheme();
  const r = useRouter();
  const { email, type, vehicle, verified } = useApply();
  const apply = useApply();
  const { ring, vibrate, set } = usePrefs();
  const { hub, kyc, contacts, settings, setSettings, reset } = useRider();
  const docs = requiredDocs(type, vehicle ?? 'motorcycle');
  const k = kycSummary(docs, verified ? Object.fromEntries(docs.map((d) => [d.id, 'approved'])) : kyc);
  const current: RingId = isRingId(ring) ? ring : DEFAULT_RING;
  const fleet = type === 'fleet';
  const flexInfo = useRider((x) => x.me?.flex);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 110, gap: 14, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
        <Txt size={24} weight="display">Profile</Txt>
        <Card>
          <Txt size={18} weight="bold">{(LIVE ? apply.name : '') || email || 'ChowBuy rider'}</Txt>{LIVE && email ? <Txt size={13} color={p.mute}>{email}</Txt> : null}
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Pill label={fleet ? 'Fleet · salaried' : type === 'flex' ? 'Flex' : 'Partner · per ride'} color={p.brand} soft />
            {vehicle ? <Pill label={vehicle[0].toUpperCase() + vehicle.slice(1)} color={p.info} soft /> : null}
            {fleet ? <Pill label={hub} color={p.mute} soft /> : null}
          </View>
        </Card>

        <Card>
          {LIVE && type === 'flex' && flexInfo ? <IconRow icon={Zap} title="ChowBuy Flex application" note={`${flexInfo.status ? FLEX_STATUS_LABEL[flexInfo.status] : 'Draft'}${flexInfo.city ? ' · ' + flexInfo.city : ''}${flexInfo.agreementVersion ? ' · agreement ' + flexInfo.agreementVersion : ''}`} onPress={() => r.push('/flex')} /> : null}
          <IconRow icon={FileCheck2} title="Documents and verification" note={k.state === 'verified' ? 'All documents approved' : `${k.approved} of ${k.total} approved`} onPress={() => r.push('/kyc')}
            right={<Pill label={k.state === 'verified' ? 'Verified' : k.state === 'in_review' ? 'In review' : 'Action needed'} color={k.state === 'verified' ? p.ok : k.state === 'in_review' ? p.info : p.warn} soft />} />
          <IconRow icon={HeartHandshake} title="Emergency contacts" note={validContacts(contacts).length >= 2 ? '2 contacts saved' : 'Add two people we can alert'} onPress={() => r.push('/emergency-contacts')} />
        </Card>

        <Heading note="The ring plays until you accept or decline an order. Tap one to hear it.">New order ring</Heading>
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

        <Heading>Settings</Heading>
        <Card>
          <Row label="Vibrate with the ring" note="Helps when the phone is in your pocket" value={vibrate} onChange={(v) => set({ vibrate: v })} />
          <Row label="Auto-send address greeting on pickup" note="A polite message asking for gate codes and landmarks" value={settings.autoGreeting} onChange={(v) => setSettings({ autoGreeting: v })} />
          <Txt size={14} weight="bold">Navigation app</Txt>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['google', 'apple', 'waze'] as const).map((n) => (
              <Pressable key={n} accessibilityRole="radio" accessibilityState={{ selected: settings.navApp === n }} onPress={() => setSettings({ navApp: n })}
                style={{ flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: settings.navApp === n ? p.brand : p.fill }}>
                <Txt size={14} weight="bold" color={settings.navApp === n ? '#fff' : p.ink}>{n === 'google' ? 'Google Maps' : n === 'apple' ? 'Apple Maps' : 'Waze'}</Txt>
              </Pressable>))}
          </View>
        </Card>

        <Button label="Sign out" variant="soft" onPress={() => { if (LIVE) { void endSession().then(() => r.replace('/')); return; } reset(); apply.set({ verified: false }); r.replace('/'); }} />
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}><LogOut size={14} color={p.mute} /><Txt size={12} color={p.mute}>{LIVE ? 'Signing out takes you offline.' : 'Signing out clears this phone’s demo data.'}</Txt></View>
      </ScrollView>
      <SosButton bottom={20} />
    </SafeAreaView>
  );
}

function Row({ label, note, value, onChange }: { label: string; note: string; value: boolean; onChange: (v: boolean) => void }) {
  const p = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flex: 1, paddingRight: 12 }}><Txt size={15}>{label}</Txt><Txt size={12} color={p.mute}>{note}</Txt></View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: p.brand, false: p.line }} accessibilityLabel={label} />
    </View>
  );
}
