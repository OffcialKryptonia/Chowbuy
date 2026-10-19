import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatMessage, LatLng, Order, OrderStage, PaymentLink, Review, Rider } from '@/lib/types';

interface OrdersState {
  orders: Order[];
  chats: Record<string, ChatMessage[]>;
  reviews: Record<string, Review>;
  place: (o: Order) => void;
  setStage: (id: string, stage: OrderStage, at?: number) => void;
  setRider: (id: string, rider: Rider, route: LatLng[]) => void;
  moveRider: (id: string, pos: LatLng, heading: number, etaMinutes: number) => void;
  setLink: (id: string, link: PaymentLink) => void;
  markPaid: (id: string, by?: string) => void;
  setTip: (id: string, tip: number) => void;
  say: (orderId: string, from: ChatMessage['from'], text: string) => ChatMessage;
  readAll: (orderId: string) => void;
  review: (r: Review) => void;
  cancelRoutes: () => void;
  patch: (o: Order) => void;
  receive: (m: ChatMessage) => void;
  setRoute: (id: string, route: LatLng[]) => void;
  clearAll: () => void;
  /** Replaces the list with the server's copy, keeping the locally computed route for orders already on screen. */
  hydrate: (orders: Order[], chats: Record<string, ChatMessage[]>) => void;
}

const stageOrder: OrderStage[] = ['received', 'preparing', 'rider_accepted', 'rider_at_store', 'in_transit', 'arrived', 'delivered'];
export const stageIndex = (s: OrderStage) => stageOrder.indexOf(s);

export const useOrders = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: [],
      chats: {},
      reviews: {},
      place: (o) => set({ orders: [o, ...get().orders] }),
      setStage: (id, stage, at = Date.now()) =>
        set({ orders: get().orders.map((o) => (o.id === id && stageIndex(stage) >= stageIndex(o.stage) ? { ...o, stage, stageTimes: { ...o.stageTimes, [stage]: at } } : o)) }),
      setRider: (id, rider, route) => set({ orders: get().orders.map((o) => (o.id === id ? { ...o, rider, route, riderPos: route[0] } : o)) }),
      moveRider: (id, pos, heading, etaMinutes) => set({ orders: get().orders.map((o) => (o.id === id ? { ...o, riderPos: pos, riderBearing: heading, etaMinutes } : o)) }),
      setLink: (id, link) => set({ orders: get().orders.map((o) => (o.id === id ? { ...o, paymentLink: link } : o)) }),
      markPaid: (id, by) =>
        set({ orders: get().orders.map((o) => (o.id === id ? { ...o, paid: true, paymentLink: o.paymentLink ? { ...o.paymentLink, status: 'paid', paidBy: by } : o.paymentLink } : o)) }),
      setTip: (id, tip) => set({ orders: get().orders.map((o) => (o.id === id ? { ...o, tip: (o.tip ?? 0) + tip } : o)) }),
      say: (orderId, from, text) => {
        const m: ChatMessage = { id: 'M' + Date.now() + Math.floor(Math.random() * 999), orderId, from, text, at: Date.now(), read: from === 'customer' };
        set({ chats: { ...get().chats, [orderId]: [...(get().chats[orderId] ?? []), m] } });
        return m;
      },
      readAll: (orderId) => set({ chats: { ...get().chats, [orderId]: (get().chats[orderId] ?? []).map((m) => ({ ...m, read: true })) } }),
      review: (r) => set({ reviews: { ...get().reviews, [r.orderId]: r }, orders: get().orders.map((o) => (o.id === r.orderId ? { ...o, reviewed: true } : o)) }),
      cancelRoutes: () => {},
      patch: (o) => set({ orders: get().orders.map((x) => (x.id === o.id ? { ...o, route: o.route ?? x.route } : x)) }),
      receive: (m) => {
        const list = get().chats[m.orderId] ?? [];
        if (list.some((x) => x.id === m.id)) return;
        set({ chats: { ...get().chats, [m.orderId]: [...list, m] } });
      },
      setRoute: (id, route) => set({ orders: get().orders.map((o) => (o.id === id ? { ...o, route, riderPos: o.riderPos ?? route[0] } : o)) }),
      clearAll: () => set({ orders: [], chats: {}, reviews: {} }),
      hydrate: (orders, chats) => {
        const old = new Map(get().orders.map((o) => [o.id, o]));
        set({ orders: orders.map((o) => ({ ...o, route: o.route ?? old.get(o.id)?.route })), chats });
      },
    }),
    { name: 'cb-orders', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

export const isActive = (o: Order) => o.stage !== 'delivered' && o.stage !== 'cancelled';
