import { useRider } from '@/stores/rider';

/** Customer messages the rider has not opened yet for the current delivery. Live: it updates as messages arrive. */
export const useChatUnread = (): number =>
  useRider((s) => {
    const a = s.active; if (!a) return 0;
    const seen = s.chatSeen[a.order.id] ?? 0;
    return a.messages.filter((m) => m.from === 'customer' && m.at > seen).length;
  });
