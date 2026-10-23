import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Check, ChevronDown } from 'lucide-react-native';
import { RiderClip } from '@/components/art/RiderClip';
import { Button, Txt, tap } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { LIVE } from '@/lib/config';
import * as live from '@/lib/live';
import { startSession } from '@/lib/live-session';

/** Welcome screen: the animated rider, a country picker, Sign in and Apply now. */
export default function Welcome() {
  const p = useTheme();
  const r = useRouter();
  const { width, height } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  useEffect(() => { // live mode: a rider who is still signed in goes straight to Home
    if (!LIVE) return;
    let off = false;
    void live.session().then((sess) => (sess ? startSession().then(() => { if (!off) r.replace('/home'); }) : null)).catch(() => {});
    return () => { off = true; };
  }, [r]);
  // Tablets, unfolded foldables and landscape phones get two columns; phones in portrait stack the scene above the actions.
  const wide = width >= 720;
  const sceneW = wide ? Math.min(width * 0.46, ((height - 48) * 836) / 768, 560) : Math.min(width - 32, 560);

  const actions = (
    <View style={{ width: '100%', maxWidth: 460, gap: 16, paddingHorizontal: 20, paddingVertical: 22 }}>
      <View>
        <Txt size={28} weight="display">Welcome to</Txt>
        <Txt size={28} weight="display"><Txt size={28} weight="displayX" color={p.brand}>ChowBuy</Txt> rider app</Txt>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Country: Nigeria" onPress={() => { tap(); setOpen(true); }}
        style={{ height: 54, borderRadius: 14, borderWidth: 1.5, borderColor: p.line, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 }}>
        <Txt size={20}>🇳🇬</Txt>
        <Txt size={16} style={{ flex: 1 }}>Nigeria</Txt>
        <ChevronDown color={p.ink} size={22} />
      </Pressable>
      <View style={{ gap: 12 }}>
        <Button label="Sign in" onPress={() => r.push('/sign-in')} />
        <Button label="Apply now" variant="soft" onPress={() => r.push('/apply')} />
      </View>
      <Txt size={12} color={p.mute} align="center">v{Constants.expoConfig?.version ?? '1.0.0'}</Txt>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <SafeAreaView style={{ flex: 1 }}>
        {wide ? (
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, paddingHorizontal: 24 }}>
            <RiderClip width={sceneW} dark={p.scheme === 'dark'} />
            <ScrollView style={{ flexGrow: 0, maxWidth: 480 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>{actions}</ScrollView>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }}>
            <RiderClip width={sceneW} dark={p.scheme === 'dark'} />
            {actions}
          </ScrollView>
        )}
      </SafeAreaView>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,.5)', justifyContent: 'flex-end' }} onPress={() => setOpen(false)}>
          <View style={{ backgroundColor: p.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14 }}>
            <Txt size={18} weight="display">Choose your country</Txt>
            <Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
              <Txt size={22}>🇳🇬</Txt><Txt size={16} style={{ flex: 1 }}>Nigeria</Txt><Check color={p.ok} size={22} />
            </Pressable>
            <Txt size={13} color={p.mute}>ChowBuy riders deliver in Lagos, Abuja, Port Harcourt and Ibadan. More cities soon.</Txt>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
