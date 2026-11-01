import React, { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Send, ShieldAlert } from 'lucide-react-native';
import { Header, IconButton, Row, Txt, useToast } from '@/components/ui';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { QuickReplyChips } from '@/components/chat/QuickReplyChips';
import { useDriverChat } from '@/hooks/useDriverChat';
import { useOrder } from '@/hooks/useOrderTracking';
import { useTheme, fonts, radius } from '@/lib/theme';
import { warn } from '@/lib/sound-effects';

export default function Chat() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const p = useTheme();
  const toast = useToast();
  const order = useOrder(orderId);
  const { messages, send } = useDriverChat(orderId ?? '', { markRead: true });
  const [text, setText] = useState('');
  const list = useRef<FlatList>(null);
  useEffect(() => { const t = setTimeout(() => list.current?.scrollToEnd({ animated: true }), 80); return () => clearTimeout(t); }, [messages.length]);

  const submit = async (t: string) => {
    const err = await send(t);
    if (err) { warn(); toast(err, 'bad'); return; }
    setText('');
  };
  const closed = order?.stage === 'delivered' || order?.stage === 'cancelled';

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: p.bg }}>
      <View style={{ padding: 16 }}><Header title={order?.rider?.name ?? 'Rider chat'} subtitle={order ? `Order ${order.id}` : undefined} /></View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Row gap={8} style={{ marginHorizontal: 16, padding: 10, backgroundColor: p.fill, borderRadius: radius.md, alignItems: 'flex-start' }}>
          <ShieldAlert size={16} color={p.mute} />
          <Txt size={12} color={p.mute} style={{ flex: 1 }}>Chats are monitored for safety. Never share phone numbers or pay a rider outside ChowBuy.</Txt>
        </Row>
        <FlatList ref={list} data={messages} keyExtractor={(m) => m.id} renderItem={({ item }) => <ChatBubble m={item} />}
          contentContainerStyle={{ padding: 16, gap: 12 }} ListEmptyComponent={<Txt size={14} color={p.mute} align="center">Say hello, or tap a quick reply below.</Txt>} />
        {closed ? <Txt size={13} color={p.mute} align="center" style={{ padding: 16 }}>This order is complete, so the chat is closed.</Txt> : (
          <>
            <QuickReplyChips onPick={submit} landmark={order?.address.landmark} />
            <Row gap={8} style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
              <TextInput value={text} onChangeText={setText} placeholder="Message your rider" placeholderTextColor={p.mute} accessibilityLabel="Message" maxLength={500}
                onSubmitEditing={() => submit(text)} returnKeyType="send"
                style={{ flex: 1, minHeight: 48, borderRadius: 24, borderWidth: 1, borderColor: p.line, backgroundColor: p.surface, color: p.ink, paddingHorizontal: 16, fontFamily: fonts.body, fontSize: 16 }} />
              <IconButton icon={Send} label="Send message" onPress={() => submit(text)} bg={p.brand} tint="#fff" size={48} />
            </Row>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
