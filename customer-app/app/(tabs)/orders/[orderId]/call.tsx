import React, { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from 'lucide-react-native';
import { Avatar, Button, Txt } from '@/components/ui';
import { Pressable } from 'react-native';
import { useVoipCall } from '@/hooks/useVoipCall';
import { useOrder } from '@/hooks/useOrderTracking';
import { useTheme } from '@/lib/theme';
import { thud, tap } from '@/lib/sound-effects';

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const LABEL = { idle: 'Starting…', connecting: 'Connecting…', ringing: 'Ringing…', connected: '', ended: 'Call ended', failed: 'Call failed' } as const;

export default function Call() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const p = useTheme();
  const order = useOrder(orderId);
  const c = useVoipCall(orderId ?? '');
  useEffect(() => { void c.begin(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const ctl = (on: boolean, Icon: typeof Mic, label: string, onPress: () => void) => (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: on }} onPress={() => { tap(); onPress(); }}
        style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: on ? p.brand : p.surface, borderWidth: 1, borderColor: on ? p.brand : p.line, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={28} color={on ? '#fff' : p.ink} />
      </Pressable>
      <Txt size={12} color={p.mute}>{label}</Txt>
    </View>
  );
  const done = c.state === 'ended' || c.state === 'failed';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.bg, padding: 24, justifyContent: 'space-between' }}>
      <View style={{ alignItems: 'center', gap: 10, marginTop: 40 }}>
        <Avatar name={order?.rider?.name ?? 'Rider'} size={110} />
        <Txt size={26} weight="display">{order?.rider?.name ?? 'Your rider'}</Txt>
        <Txt size={15} color={p.mute}>{c.state === 'connected' ? mmss(c.seconds) : LABEL[c.state]}</Txt>
        {c.error ? <Txt size={13} color={p.bad} align="center">{c.error}</Txt> : null}
        <Txt size={12} color={p.mute} align="center" style={{ marginTop: 6 }}>In-app call. Neither of you sees the other&apos;s phone number.</Txt>
      </View>
      {done ? (
        <View style={{ gap: 10 }}>
          {c.state === 'failed' ? <Button label="Try again" onPress={() => void c.begin()} /> : null}
          <Button variant="ghost" label="Back to tracking" onPress={() => router.back()} />
        </View>
      ) : (
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', marginBottom: 24 }}>
          {ctl(c.muted, c.muted ? MicOff : Mic, c.muted ? 'Unmute' : 'Mute', () => void c.toggleMute())}
          <View style={{ alignItems: 'center', gap: 8 }}>
            <Pressable accessibilityRole="button" accessibilityLabel="End call" onPress={async () => { thud(); await c.end(); router.back(); }}
              style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: p.bad, alignItems: 'center', justifyContent: 'center' }}><PhoneOff size={32} color="#fff" /></Pressable>
            <Txt size={12} color={p.mute}>End</Txt>
          </View>
          {ctl(c.speaker, c.speaker ? Volume2 : VolumeX, 'Speaker', () => void c.toggleSpeaker())}
        </View>
      )}
    </SafeAreaView>
  );
}
