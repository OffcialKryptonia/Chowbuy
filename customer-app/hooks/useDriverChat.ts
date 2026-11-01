import { useCallback, useEffect } from 'react';
import { useOrders } from '@/stores/orders';
import { DEMO } from '@/lib/config';
import { simulatorReply } from '@/lib/simulator';
import { sendChat } from '@/lib/backend';
import { tap } from '@/lib/sound-effects';

const MAX = 500;
/** Masks off-platform contact attempts before sending. The server enforces the same rules and Admin can review flagged chats. */
export const screenText = (t: string): string | null => {
  const s = t.trim();
  if (!s) return null;
  if (s.length > MAX) return `Keep messages under ${MAX} characters.`;
  if (/(\+?234|0)[789][01]\d{8}/.test(s.replace(/[\s-]/g, ''))) return 'For your privacy, share phone numbers by calling through ChowBuy instead.';
  if (/\b(bank transfer|send money|account number|pay me)\b/i.test(s)) return 'Please pay only through ChowBuy so your order stays protected.';
  return null;
};

const EMPTY: never[] = [];
/** Messages from the rider/support you have not opened yet. Counting only: it never marks anything read. */
export const useChatUnread = (orderId: string): number =>
  useOrders((s) => (s.chats[orderId] ?? EMPTY).filter((m) => !m.read && m.from !== 'customer').length);
/** Unread across every order still in progress (drives the Orders tab badge). */
export const useTotalUnread = (): number =>
  useOrders((s) => s.orders.reduce((n, o) => (o.stage === 'delivered' || o.stage === 'cancelled' ? n : n + (s.chats[o.id] ?? EMPTY).filter((m) => !m.read && m.from !== 'customer').length), 0));

export function useDriverChat(orderId: string, opts: { markRead?: boolean } = {}) {
  const messages = useOrders((s) => s.chats[orderId]) ?? EMPTY;
  const say = useOrders((s) => s.say);
  const readAll = useOrders((s) => s.readAll);
  const markRead = opts.markRead ?? false;
  useEffect(() => { if (markRead) readAll(orderId); }, [markRead, orderId, messages.length, readAll]);
  const send = useCallback(async (text: string): Promise<string | null> => {
    const err = screenText(text);
    if (err) return err;
    tap();
    if (DEMO) { say(orderId, 'customer', text.trim()); simulatorReply(orderId, text); return null; }
    // Live: the server screens the text again (masking, blocking, flagging for admin review) and the saved message comes back through Realtime.
    try { await sendChat(orderId, text.trim()); return null; } catch (e) { return e instanceof Error ? e.message : 'Message not sent.'; }
  }, [orderId, say]);
  return { messages, send, unread: messages.filter((m) => !m.read && m.from !== 'customer').length };
}
