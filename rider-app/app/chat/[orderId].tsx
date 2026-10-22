import React, { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, CheckCheck, Mic, Send } from 'lucide-react-native';
import { Txt } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { GREETING_DELAY_SECONDS, VOICE_NOTE_MAX_SECONDS, greeting, isUrgent, quickReplies } from '@/lib/chat';
import { useRider } from '@/stores/rider';

export default function Chat() {
  const p = useTheme();
  const r = useRouter();
  const a = useRider((s) => s.active);
  const { send, markReceipts, sendGreeting } = useRider.getState();
  const [text, setText] = useState('');
  const [rec, setRec] = useState<number | null>(null);
  const list = useRef<FlatList>(null);

  useEffect(() => { // demo receipts: sent → delivered → read
    const t1 = setTimeout(markReceipts, 1200), t2 = setTimeout(markReceipts, 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [a?.messages.length, markReceipts]);
  useEffect(() => { // greeting is sent for the rider once they are on their way, unless already sent
    if (!a || a.greetingSent || a.stage !== 'to_customer') return;
    const t = setTimeout(sendGreeting, GREETING_DELAY_SECONDS * 1000);
    return () => clearTimeout(t);
  }, [a?.stage, a?.greetingSent, sendGreeting]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (rec == null) return; const t = setInterval(() => setRec((s) => (s == null ? s : s + 1)), 1000); return () => clearInterval(t); }, [rec == null]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (rec != null && rec >= VOICE_NOTE_MAX_SECONDS) { send('Voice note', 'rider', rec); setRec(null); } }, [rec, send]);

  if (!a) return <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }}><Txt size={16} align="center" style={{ marginTop: 80 }}>No active delivery.</Txt></SafeAreaView>;
  const msgs = a.messages;
  const doSend = () => { const t = text.trim(); if (!t) return; send(t); setText(''); setTimeout(() => list.current?.scrollToEnd(), 50); };
  const urgent = msgs.some((m) => m.flags && isUrgent(m.flags));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderBottomWidth: 1, borderBottomColor: p.line }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => r.back()}><ArrowLeft size={24} color={p.ink} /></Pressable>
        <View style={{ flex: 1 }}><Txt size={17} weight="bold">{a.order.customer}</Txt><Txt size={12} color={p.mute}>{a.order.id} · chats are kept for safety</Txt></View>
      </View>
      {urgent ? <View style={{ backgroundColor: p.bad, padding: 10 }}><Txt size={13} weight="bold" color="#fff">A supervisor has been alerted about this conversation.</Txt></View> : null}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList ref={list} data={msgs} keyExtractor={(m) => m.id} contentContainerStyle={{ padding: 14, gap: 8 }}
          ListEmptyComponent={<View style={{ padding: 16, gap: 8 }}><Txt size={14} color={p.mute}>No messages yet. This greeting is ready for you:</Txt><Pressable onPress={() => send(greeting(a.order.customer, a.order.merchant))} style={{ padding: 12, borderRadius: 14, backgroundColor: p.fill }}><Txt size={14}>{greeting(a.order.customer, a.order.merchant)}</Txt></Pressable></View>}
          renderItem={({ item: m }) => {
            const mine = m.from === 'rider';
            return (
              <View style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '82%', padding: 10, borderRadius: 16, backgroundColor: mine ? p.brand : p.fill }}>
                <Txt size={14} color={mine ? '#fff' : p.ink}>{m.voice ? `🎤 Voice note · ${m.voice}s` : m.text}</Txt>
                {mine ? <View style={{ alignSelf: 'flex-end', marginTop: 2 }}>{m.receipt === 'sent' ? <Check size={14} color="#fff" /> : <CheckCheck size={14} color={m.receipt === 'read' ? '#BFE9FF' : '#fff'} />}</View> : null}
              </View>
            );
          }} />
        <FlatList horizontal data={quickReplies(8)} keyExtractor={(q) => q.id} showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 12, gap: 8, paddingVertical: 8 }}
          renderItem={({ item }) => <Pressable accessibilityRole="button" onPress={() => send(item.text)} style={{ maxWidth: 260, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1.5, borderColor: p.brand }}><Txt size={12} color={p.brandInk}>{item.text}</Txt></Pressable>} />
        <View style={{ flexDirection: 'row', gap: 8, padding: 12, alignItems: 'center' }}>
          {rec != null ? (
            <Pressable accessibilityRole="button" onPress={() => { send('Voice note', 'rider', Math.max(1, rec)); setRec(null); }} style={{ flex: 1, height: 48, borderRadius: 24, backgroundColor: p.bad, alignItems: 'center', justifyContent: 'center' }}><Txt size={14} weight="bold" color="#fff">Recording {rec}s / {VOICE_NOTE_MAX_SECONDS}s. Tap to send</Txt></Pressable>
          ) : (
            <>
              <TextInput value={text} onChangeText={setText} placeholder="Message" placeholderTextColor={p.mute} accessibilityLabel="Message" style={{ flex: 1, height: 48, borderRadius: 24, paddingHorizontal: 16, backgroundColor: p.fill, color: p.ink }} />
              <Pressable accessibilityRole="button" accessibilityLabel="Record voice note" onPress={() => setRec(0)} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: p.fill, alignItems: 'center', justifyContent: 'center' }}><Mic size={20} color={p.ink} /></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Send" onPress={doSend} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: p.brand, alignItems: 'center', justifyContent: 'center' }}><Send size={20} color="#fff" /></Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
