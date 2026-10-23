import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { advance, type AdvanceContext, type Stage } from '@/lib/delivery';
import { canAcceptCod, collectCash, remit as remitCash } from '@/lib/cod';
import { flagMessage, greeting, type FlagKind, type Receipt } from '@/lib/chat';
import { partnerPayout, type DemoOrder } from '@/lib/offer';
import type { DocId, DocStatus } from '@/lib/kyc';
import type { EmergencyContact } from '@/lib/sos';
import type { Txn } from '@/lib/wallet';
import type { RiderType } from '@/lib/validation';
import { LIVE } from '@/lib/config';
import * as live from '@/lib/live';
import { activeToOrder, backendStageFor, docStatuses, offerToOrder, stageFromBackend, type LiveMe, type LiveOffer, type LiveOrder } from '@/lib/live-map';
import { msg } from '@/lib/supabase';

export interface ChatMsg { id: string; from: 'rider' | 'customer'; text: string; at: number; receipt: Receipt; voice?: number; flags?: FlagKind[] }
export interface Active {
  order: DemoOrder; stage: Stage; checklist: Record<string, boolean>; acceptedAt: number; greetingSent: boolean; messages: ChatMsg[];
  unreachableSince: number | null; photo: string | null; supervisorApproved: boolean; progress: number;
}
export interface Done { id: string; merchant: string; drop: string; at: number; km: number; net: number; cod: number; tip: number; minutes: number }
export interface Settings { autoGreeting: boolean; navApp: 'google' | 'apple' | 'waze' }
export interface SosEvent { at: number; lat: number; lng: number; orderId: string | null; sent: string[] }

const id = () => Math.random().toString(36).slice(2, 10);
const DAY = 86400000;

interface RiderState {
  online: boolean; onBreak: boolean; shiftId: 'morning' | 'evening' | 'night' | null; shiftStart: number | null; breakStart: number | null; breakMinutes: number;
  hub: string; city: string;
  rating: number; onTimePct: number; deliveriesToday: number;
  balance: number; unremitted: number; txns: Txn[]; payoutBank: string; payoutNuban: string;
  active: Active | null; history: Done[]; offer: DemoOrder | null;
  kyc: Partial<Record<DocId, DocStatus>>; contacts: EmergencyContact[]; settings: Settings; sos: SosEvent[];
  lastPos: { lat: number; lng: number; at: number } | null;
  /** Live mode only: the signed-in rider's backend profile. */
  me: LiveMe | null;

  hydrateMe: (m: LiveMe) => void;
  hydrateActive: (o: LiveOrder | null) => void;
  showOffer: (o: LiveOffer) => void;
  liveAccept: () => Promise<{ ok: boolean; reason?: string }>;
  liveStep: (pin: string | undefined, type: RiderType | null) => Promise<{ ok: boolean; reason?: string }>;
  liveSend: (text: string) => Promise<{ ok: boolean; reason?: string }>;
  liveMessages: (rows: live.ChatRow[]) => void;
  setOnline: (v: boolean) => void;
  startShift: (s: 'morning' | 'evening' | 'night') => void;
  endShift: () => void;
  toggleBreak: () => void;
  setOffer: (o: DemoOrder | null) => void;
  accept: (type: RiderType | null) => { ok: boolean; reason?: string };
  toggleItem: (itemId: string) => void;
  step: (pin: string | undefined, type: RiderType | null) => { ok: boolean; reason?: string };
  setProgress: (p: number) => void;
  send: (text: string, from?: 'rider' | 'customer', voice?: number) => void;
  sendGreeting: () => void;
  markReceipts: () => void;
  startUnreachable: () => void;
  setPhoto: (uri: string | null) => void;
  supervisorApprove: () => void;
  setKyc: (d: DocId, s: DocStatus) => void;
  setContacts: (c: EmergencyContact[]) => void;
  setSettings: (s: Partial<Settings>) => void;
  remit: (amount: number) => void;
  payout: (amount: number) => void;
  logSos: (e: SosEvent) => void;
  setPos: (lat: number, lng: number) => void;
  reset: () => void;
}

const initial = {
  online: false, onBreak: false, shiftId: null, shiftStart: null, breakStart: null, breakMinutes: 0,
  hub: 'Lekki Admiralty Hub', city: 'Lagos', rating: 4.92, onTimePct: 97.4, deliveriesToday: 0,
  balance: 18500, unremitted: 0,
  txns: [
    { id: 't1', kind: 'ride' as const, title: 'Delivery CHB-47982', amount: 1010, at: Date.now() - 2 * DAY },
    { id: 't2', kind: 'tip' as const, title: 'Tip from Chidi', amount: 300, at: Date.now() - 2 * DAY },
    { id: 't3', kind: 'ride' as const, title: 'Delivery CHB-47951', amount: 880, at: Date.now() - 4 * DAY },
  ] as Txn[],
  payoutBank: '', payoutNuban: '', active: null, history: [] as Done[], offer: null,
  kyc: {} as Partial<Record<DocId, DocStatus>>, contacts: [{ name: '', phone: '' }, { name: '', phone: '' }] as EmergencyContact[],
  settings: { autoGreeting: true, navApp: 'google' } as Settings, sos: [] as SosEvent[], lastPos: null, me: null as LiveMe | null,
};

export const useRider = create<RiderState>()(
  persist(
    (set, get) => ({
      ...initial,
      setOnline: (v) => set({ online: v, onBreak: false, breakStart: null }),
      startShift: (s) => set({ shiftId: s, shiftStart: Date.now(), online: true, onBreak: false, breakStart: null, breakMinutes: 0 }),
      endShift: () => set({ shiftId: null, shiftStart: null, online: false, onBreak: false, breakStart: null }),
      toggleBreak: () => {
        const s = get();
        if (s.onBreak) set({ onBreak: false, breakStart: null, breakMinutes: s.breakMinutes + Math.round((Date.now() - (s.breakStart ?? Date.now())) / 60000) });
        else set({ onBreak: true, breakStart: Date.now() });
      },
      setOffer: (o) => set({ offer: o }),
      accept: (type) => {
        const s = get();
        if (!s.offer) return { ok: false, reason: 'This order is no longer available.' };
        if (s.active) return { ok: false, reason: 'Finish your current delivery first.' };
        const c = canAcceptCod({ type, amount: s.offer.cod, walletBalance: s.balance, unremitted: s.unremitted });
        if (!c.ok) return c;
        set({ active: { order: s.offer, stage: 'accepted', checklist: {}, acceptedAt: Date.now(), greetingSent: false, messages: [], unreachableSince: null, photo: null, supervisorApproved: false, progress: 0 }, offer: null });
        return { ok: true };
      },
      toggleItem: (itemId) => set((s) => (s.active ? { active: { ...s.active, checklist: { ...s.active.checklist, [itemId]: !s.active.checklist[itemId] } } } : s)),
      step: (pin, type) => {
        const s = get(); const a = s.active;
        if (!a) return { ok: false, reason: 'No active delivery.' };
        const ctx: AdvanceContext = { checklist: a.checklist, items: a.order.items, pin, expectedPin: a.order.pin || pin, supervisorApproved: a.supervisorApproved };
        const r = advance(a.stage, ctx);
        if (!r.ok) return r;
        let next: Active = { ...a, stage: r.stage, progress: r.stage === 'to_restaurant' || r.stage === 'to_customer' ? 0 : a.progress };
        if (r.stage === 'picked_up' && s.settings.autoGreeting && !a.greetingSent) {
          next = { ...next, greetingSent: true, messages: [...a.messages, { id: id(), from: 'rider', text: greeting(a.order.customer, a.order.merchant), at: Date.now(), receipt: 'sent' }] };
        }
        if (r.stage !== 'completed') { set({ active: next }); return { ok: true }; }
        const o = a.order, now = Date.now(), net = type === 'fleet' ? 0 : partnerPayout(o.fare);
        const cash = o.cod > 0 ? collectCash({ type, amount: o.cod, walletBalance: s.balance, unremitted: s.unremitted }) : { walletBalance: s.balance, unremitted: s.unremitted };
        const txns: Txn[] = [...s.txns];
        if (!LIVE && o.cod > 0 && type !== 'fleet') txns.unshift({ id: id(), kind: 'cod_collected', title: `Cash collected ${o.id}`, amount: -o.cod, at: now });
        if (!LIVE && net > 0) txns.unshift({ id: id(), kind: 'ride', title: `Delivery ${o.id}`, amount: net, at: now });
        set({
          active: null, deliveriesToday: s.deliveriesToday + 1, unremitted: LIVE ? s.unremitted : cash.unremitted, balance: LIVE ? s.balance : cash.walletBalance + net, txns,
          history: [{ id: o.id, merchant: o.merchant, drop: o.drop, at: now, km: o.km, net, cod: o.cod, tip: 0, minutes: Math.max(1, Math.round((now - a.acceptedAt) / 60000)) }, ...s.history].slice(0, 50),
        });
        return { ok: true };
      },
      setProgress: (p) => set((s) => (s.active ? { active: { ...s.active, progress: Math.max(0, Math.min(1, p)) } } : s)),
      send: (text, from = 'rider', voice) => set((s) => {
        if (!s.active) return s;
        const flags = flagMessage(text);
        return { active: { ...s.active, messages: [...s.active.messages, { id: id(), from, text, at: Date.now(), receipt: 'sent', voice, flags: flags.length ? flags : undefined }] } };
      }),
      sendGreeting: () => set((s) => (s.active && !s.active.greetingSent ? { active: { ...s.active, greetingSent: true, messages: [...s.active.messages, { id: id(), from: 'rider', text: greeting(s.active.order.customer, s.active.order.merchant), at: Date.now(), receipt: 'sent' }] } } : s)),
      markReceipts: () => set((s) => (s.active ? { active: { ...s.active, messages: s.active.messages.map((m) => (m.from === 'rider' && m.receipt !== 'read' ? { ...m, receipt: m.receipt === 'sent' ? 'delivered' : 'read' } : m)) } } : s)),
      startUnreachable: () => set((s) => (s.active && !s.active.unreachableSince ? { active: { ...s.active, unreachableSince: Date.now() } } : s)),
      setPhoto: (uri) => set((s) => (s.active ? { active: { ...s.active, photo: uri } } : s)),
      supervisorApprove: () => set((s) => (s.active ? { active: { ...s.active, supervisorApproved: true } } : s)),
      setKyc: (d, st) => set((s) => ({ kyc: { ...s.kyc, [d]: st } })),
      setContacts: (c) => set({ contacts: c }),
      setSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
      remit: (amount) => set((s) => ({ unremitted: remitCash(s.unremitted, amount), balance: s.balance, txns: [{ id: id(), kind: 'cod_remit', title: 'Cash paid in', amount: -Math.min(amount, s.unremitted), at: Date.now() }, ...s.txns] })),
      payout: (amount) => set((s) => ({ balance: s.balance - amount, txns: [{ id: id(), kind: 'payout', title: `Payout to ${s.payoutBank || 'bank'}`, amount: -amount, at: Date.now() }, ...s.txns] })),
      logSos: (e) => set((s) => ({ sos: [e, ...s.sos].slice(0, 20) })),
      setPos: (lat, lng) => set({ lastPos: { lat, lng, at: Date.now() } }),
      hydrateMe: (m) => set((s) => ({
        me: m, online: m.online, hub: s.hub, rating: (m.rating ?? 95) / 20, onTimePct: s.onTimePct, deliveriesToday: m.deliveriesToday,
        balance: m.wallet + (m.earnings ?? 0), kyc: docStatuses(m) as RiderState['kyc'], contacts: m.contacts.length >= 2 ? m.contacts : s.contacts,
        // sample demo history and balances must never show in a real account
        txns: s.me ? s.txns : [], history: s.me ? s.history : [], unremitted: s.me ? s.unremitted : 0,
      })),
      hydrateActive: (o) => set((s) => {
        if (!o) return s.active && s.active.order.id && LIVE ? { active: null } : s;
        if (s.active && s.active.order.id === o.id) return s;
        return { active: { order: activeToOrder(o), stage: stageFromBackend(o.stage), checklist: {}, acceptedAt: Date.now(), greetingSent: false, messages: [], unreachableSince: null, photo: null, supervisorApproved: false, progress: 0 }, offer: null };
      }),
      showOffer: (o) => set({ offer: offerToOrder(o) }),
      liveAccept: async () => {
        const s = get();
        if (!s.offer) return { ok: false, reason: 'This order is no longer available.' };
        if (s.active) return { ok: false, reason: 'Finish your current delivery first.' };
        try {
          await live.accept(s.offer.id);
          get().hydrateActive(await live.activeOrder());
          set({ offer: null });
          return { ok: true };
        } catch (e) { set({ offer: null }); return { ok: false, reason: msg(e) }; }
      },
      liveStep: async (pin, type) => {
        const a = get().active;
        if (!a) return { ok: false, reason: 'No active delivery.' };
        // local rules first (items checked, 4-digit PIN format); the server checks the code itself
        const pre = advance(a.stage, { checklist: a.checklist, items: a.order.items, pin, expectedPin: pin ?? '', supervisorApproved: false });
        if (!pre.ok) return pre;
        try {
          const sb = backendStageFor(pre.stage);
          if (sb) await live.setStage(a.order.id, sb);
          if (pre.stage === 'completed') await live.complete(a.order.id, pin ?? '');
        } catch (e) { return { ok: false, reason: msg(e) }; }
        const r = get().step(pin, type);
        if (pre.stage === 'completed') void live.me().then((m) => m && get().hydrateMe(m)).catch(() => {});
        return r;
      },
      liveSend: async (text) => {
        const a = get().active;
        if (!a) return { ok: false, reason: 'No active delivery.' };
        try { await live.sendChat(a.order.id, text); return { ok: true }; } catch (e) { return { ok: false, reason: msg(e) }; }
      },
      liveMessages: (rows) => set((s) => (s.active ? { active: { ...s.active, messages: rows.map((m) => ({ id: m.id, from: m.sender_role === 'rider' ? 'rider' as const : 'customer' as const, text: m.body, at: Date.parse(m.created_at), receipt: 'read' as const })) } } : s)),
      reset: () => set({ ...initial }),
    }),
    { name: 'cb-rider-state', storage: createJSONStorage(() => AsyncStorage), version: 1 },
  ),
);
