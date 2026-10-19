import type { RealtimeChannel } from '@supabase/supabase-js';
import { useCatalog } from '@/stores/catalog';
import { useOrders } from '@/stores/orders';
import { useSession } from '@/stores/session';
import { useRx, type Rx } from '@/stores/rx';
import { getDirections } from './google-maps';
import { ok, supabase } from './supabase';
import type { CartLine, ChatMessage, Merchant, Order, OrderStage, PaymentLink, Product, SavedAddress, WalletTx } from './types';
import { PAY_URL } from './config';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;
const ms = (t: string | null | undefined) => (t ? new Date(t).getTime() : 0);

/* ---------------- row -> app shape ---------------- */
export const toMerchant = (r: Row): Merchant => ({
  id: r.id, name: r.name, vertical: r.vertical, cuisine: r.cuisine ?? [], image: r.image ?? '',
  rating: r.rating_pct ?? 0, ratingCount: r.rating_count ?? 0, etaMin: r.eta_min, etaMax: r.eta_max, distanceKm: Number(r.distance_km ?? 0),
  deliveryFee: r.delivery_fee, discountPct: r.discount_pct ?? undefined, open: !!r.open, hours: r.hours ?? '',
  location: { latitude: r.lat, longitude: r.lng }, area: r.area ?? '',
});

export const toProduct = (r: Row): Product => ({
  id: r.id, merchantId: r.merchant_id, name: r.name, desc: r.descr ?? '', price: r.price, image: r.image ?? '', category: r.category ?? '',
  modifiers: r.modifiers ?? [], rx: r.rx || undefined, controlled: r.controlled || undefined, inStock: !!r.in_stock,
});

export const toAddress = (r: Row): SavedAddress => ({
  id: r.id, label: r.label, line: r.line, area: r.area, landmark: r.landmark ?? undefined, location: { latitude: r.lat, longitude: r.lng },
});

const toLink = (r: Row): PaymentLink => ({ url: `${PAY_URL}/p/${r.token}`, token: r.token, expiresAt: ms(r.expires_at), paidBy: r.paid_by ?? undefined, status: r.status });

const FALLBACK_MERCHANT = (id: string): Merchant => ({ id, name: 'ChowBuy store', vertical: 'restaurant', cuisine: [], image: '', rating: 0, ratingCount: 0, etaMin: 20, etaMax: 35, distanceKm: 0, deliveryFee: 0, open: true, hours: '', location: { latitude: 6.45, longitude: 3.42 }, area: '' });

/** Maps an orders row. `prev` supplies fields a realtime payload leaves out (large unchanged JSON columns arrive missing). */
export function toOrder(r: Row, merchants: Merchant[], extra: { otp?: string; link?: PaymentLink }, prev?: Order): Order {
  const pick = <T,>(k: string, mapped: T, fallback: T): T => (r[k] === undefined ? fallback : mapped);
  return {
    id: r.id,
    merchant: merchants.find((m) => m.id === r.merchant_id) ?? prev?.merchant ?? FALLBACK_MERCHANT(r.merchant_id),
    lines: pick<CartLine[]>('lines', r.lines, prev?.lines ?? []),
    subtotal: r.subtotal ?? prev?.subtotal ?? 0,
    deliveryFee: r.delivery_fee ?? prev?.deliveryFee ?? 0,
    total: r.total ?? prev?.total ?? 0,
    pay: r.pay ?? prev?.pay,
    paid: r.paid ?? prev?.paid ?? false,
    address: pick<SavedAddress>('address', r.address, prev?.address as SavedAddress),
    otp: extra.otp ?? prev?.otp ?? '',
    placedAt: r.created_at ? ms(r.created_at) : prev?.placedAt ?? Date.now(),
    stage: (r.stage ?? prev?.stage ?? 'received') as OrderStage,
    stageTimes: pick('stage_times', r.stage_times ?? {}, prev?.stageTimes ?? {}),
    rider: pick('rider', r.rider ?? undefined, prev?.rider),
    riderPos: pick('rider_pos', r.rider_pos ?? undefined, prev?.riderPos),
    riderBearing: r.rider_heading ?? prev?.riderBearing,
    route: pick('route', r.route ?? undefined, prev?.route),
    etaMinutes: r.eta_minutes ?? prev?.etaMinutes ?? 25,
    latestBy: r.latest_by ? ms(r.latest_by) : prev?.latestBy ?? Date.now() + 40 * 60000,
    reviewed: r.reviewed ?? prev?.reviewed,
    tip: r.tip ?? prev?.tip,
    paymentLink: extra.link ?? prev?.paymentLink,
  };
}

const toChat = (r: Row, was?: ChatMessage): ChatMessage => ({
  id: r.id, orderId: r.order_id, from: r.sender_role === 'customer' ? 'customer' : r.sender_role === 'rider' ? 'rider' : 'system',
  text: r.body, at: ms(r.created_at), read: was?.read ?? r.sender_role === 'customer',
});

/* ---------------- loading ---------------- */
export async function loadCatalog() {
  const [m, p] = await Promise.all([
    supabase.from('merchants').select('*').eq('active', true).order('rating_pct', { ascending: false }),
    supabase.from('products').select('*'),
  ]);
  useCatalog.getState().set(ok(m).map(toMerchant), ok(p).map(toProduct));
}

export async function loadAccount(uid: string) {
  const [prof, wal, txs, addrs] = await Promise.all([
    supabase.from('profiles').select('full_name,email,phone,points').eq('id', uid).maybeSingle(),
    supabase.from('wallets').select('balance').eq('user_id', uid).maybeSingle(),
    supabase.from('wallet_txs').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(30),
    supabase.from('addresses').select('*').eq('user_id', uid).order('created_at'),
  ]);
  const p = ok(prof);
  useSession.getState().setAccount({
    name: p?.full_name ?? '', email: p?.email ?? '', phone: p?.phone ?? '', points: p?.points ?? 0, wallet: ok(wal)?.balance ?? 0,
    txs: ok(txs).map((t: Row): WalletTx => ({ id: t.id, title: t.title, amount: t.amount, dir: t.dir, at: ms(t.created_at) })),
    addresses: ok(addrs).map(toAddress),
  });
  await loadOrders(uid);
  await loadRx(uid);
}

export async function loadOrders(uid: string) {
  const rows: Row[] = ok(await supabase.from('orders').select('*').eq('customer_id', uid).order('created_at', { ascending: false }).limit(50));
  if (!rows.length) { useOrders.getState().hydrate([], {}); return; }
  const ids = rows.map((o) => o.id);
  const [sec, links, chat, mer] = await Promise.all([
    supabase.from('order_secrets').select('order_id,otp').in('order_id', ids),
    supabase.from('payment_links').select('*').in('order_id', ids).order('created_at', { ascending: false }),
    supabase.from('chat_messages').select('*').in('order_id', ids).order('created_at'),
    supabase.from('merchants').select('*').in('id', [...new Set(rows.map((o) => o.merchant_id))]),
  ]);
  const otp = new Map<string, string>(ok(sec).map((s: Row) => [s.order_id, s.otp]));
  const link = new Map<string, PaymentLink>();
  for (const l of ok(links) as Row[]) if (!link.has(l.order_id)) link.set(l.order_id, toLink(l));
  const merchants = ok(mer).map(toMerchant);
  const known = new Map(useOrders.getState().orders.map((o) => [o.id, o]));
  const old = useOrders.getState().chats;
  const chats: Record<string, ChatMessage[]> = {};
  for (const m of ok(chat) as Row[]) (chats[m.order_id] ??= []).push(toChat(m, old[m.order_id]?.find((x) => x.id === m.id)));
  useOrders.getState().hydrate(rows.map((r) => toOrder(r, merchants, { otp: otp.get(r.id), link: link.get(r.id) }, known.get(r.id))), chats);
  void ensureRoutes();
}

/** Riders do not send a polyline, so the app draws the road from the store to the customer once a rider is assigned. */
async function ensureRoutes() {
  for (const o of useOrders.getState().orders) {
    if (!o.rider || o.route || o.stage === 'delivered' || o.stage === 'cancelled' || !o.address?.location) continue;
    try {
      const d = await getDirections(o.merchant.location, o.address.location);
      useOrders.getState().setRoute(o.id, d.points);
    } catch { /* the map falls back to a straight line */ }
  }
}

async function loadRx(uid: string) {
  const rows: Row[] = ok(await supabase.from('rx_uploads').select('*').eq('user_id', uid).order('created_at', { ascending: false }));
  const local = new Map(useRx.getState().list.map((r) => [r.id, r]));
  const signed = rows.length ? await supabase.storage.from('rx').createSignedUrls(rows.map((r) => r.path), 3600) : { data: [] as { signedUrl: string }[] };
  const list: Rx[] = rows.map((r, i) => ({ id: r.id, uri: local.get(r.id)?.uri || signed.data?.[i]?.signedUrl || '', patient: local.get(r.id)?.patient ?? '', status: r.status, note: r.note ?? undefined, at: ms(r.created_at) }));
  useRx.getState().replace(list);
}

/* ---------------- realtime ---------------- */
export function subscribe(uid: string): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const refetch = (what: 'account' | 'orders') => { clearTimeout(timer); timer = setTimeout(() => { void (what === 'orders' ? loadOrders(uid) : loadAccount(uid)).catch(() => {}); }, 300); };
  const ch: RealtimeChannel = supabase.channel('user-' + uid)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `customer_id=eq.${uid}` }, (e) => {
      const r = e.new as Row;
      if (!r?.id) return;
      const prev = useOrders.getState().orders.find((o) => o.id === r.id);
      if (!prev || !('lines' in r)) { refetch('orders'); return; }   // new order (or a partial row we cannot trust): reload
      const merchants = useCatalog.getState().merchants;
      useOrders.getState().patch(toOrder(r, merchants, {}, prev));
      if (r.rider && !prev.route) void ensureRoutes();
      if (r.paid !== undefined && r.paid !== prev.paid) refetch('orders');   // pulls the payment-link status too
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (e) => {
      const m = e.new as Row;
      useOrders.getState().receive(toChat(m));
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_links' }, () => refetch('orders'))
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'wallets', filter: `user_id=eq.${uid}` }, () => refetch('account'))
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${uid}` }, () => refetch('account'))
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rx_uploads', filter: `user_id=eq.${uid}` }, () => refetch('account'))
    .subscribe();
  return () => { clearTimeout(timer); void supabase.removeChannel(ch); };
}

/* ---------------- actions ---------------- */
export async function placeOrder(a: { merchantId: string; lines: CartLine[]; pay: 'korapay' | 'pocketfi' | 'cod' | 'wallet'; addressId: string; promo?: string }) {
  const r = ok(await supabase.rpc('place_order', {
    p_merchant: a.merchantId,
    p_lines: a.lines.map((l) => ({ product_id: l.productId, qty: l.qty, mod_ids: l.mods.map((m) => m.id), note: l.note ?? '' })),
    p_pay: a.pay, p_address: a.addressId, p_promo: a.promo ?? null,
  })) as { order: Row; otp: string };
  const merchants = useCatalog.getState().merchants;
  const order = toOrder(r.order, merchants, { otp: r.otp });
  useOrders.getState().place(order);
  void loadAccount(r.order.customer_id).catch(() => {});   // wallet balance + history after a wallet payment
  return order;
}

export async function checkPromo(code: string): Promise<number | null> {
  const r = ok(await supabase.from('promos').select('pct,active,expires_at').eq('code', code.trim().toUpperCase()).maybeSingle()) as unknown as Row | null;
  if (!r || !r.active || (r.expires_at && new Date(r.expires_at) < new Date())) return null;
  return r.pct;
}

export async function sendChat(orderId: string, text: string) {
  const m = ok(await supabase.rpc('send_chat', { p_order: orderId, p_text: text })) as Row;
  if (m?.id) useOrders.getState().receive(toChat(m));   // show it at once; Realtime delivering the same id is ignored
}
export const tipRider = async (orderId: string, amount: number) => { ok(await supabase.rpc('tip_rider', { p_order: orderId, p_amount: amount })); };
export const walletSend = async (phone: string, amount: number) => { ok(await supabase.rpc('wallet_send', { p_phone: phone, p_amount: amount })); };
export async function submitReview(r: { orderId: string; merchantUp: boolean | null; merchantTags: string[]; riderUp: boolean | null; riderTags: string[]; text: string }): Promise<number> {
  return ok(await supabase.rpc('submit_review', { p_order: r.orderId, p_merchant_up: r.merchantUp, p_merchant_tags: r.merchantTags, p_rider_up: r.riderUp, p_rider_tags: r.riderTags, p_body: r.text })) as number;
}

export async function addAddressRemote(uid: string, a: Omit<SavedAddress, 'id'>): Promise<SavedAddress> {
  const r: Row = ok(await supabase.from('addresses').insert({ user_id: uid, label: a.label, line: a.line, area: a.area, landmark: a.landmark ?? null, lat: a.location.latitude, lng: a.location.longitude }).select().single());
  return toAddress(r);
}
export const removeAddressRemote = async (id: string) => { ok(await supabase.from('addresses').delete().eq('id', id)); };

export async function uploadRx(uid: string, uri: string, patient: string): Promise<Rx> {
  const buf = await (await fetch(uri)).arrayBuffer();
  const path = `${uid}/${Date.now()}.jpg`;
  const up = await supabase.storage.from('rx').upload(path, buf, { contentType: 'image/jpeg' });
  if (up.error) throw new Error('Could not upload the photo. Please try again.');
  const r: Row = ok(await supabase.from('rx_uploads').insert({ user_id: uid, path }).select().single());
  return { id: r.id, uri, patient, status: 'pending', at: ms(r.created_at) };
}
