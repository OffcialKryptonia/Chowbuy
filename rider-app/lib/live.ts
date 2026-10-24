/** Every call the rider app makes to the ChowBuy backend. Demo mode never reaches this file. */
import { supabase, ok, BackendError } from './supabase';
import type { LiveMe, LiveOffer, LiveOrder } from './live-map';

const rpc = async <T,>(name: string, args?: Record<string, unknown>): Promise<T> => ok(await supabase.rpc(name, args) as { data: T | null; error: { message: string } | null });

export async function signIn(email: string, password: string) {
  const r = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (r.error) throw new BackendError(r.error.message);
  return r.data.session;
}
export async function signUp(v: { email: string; password: string; name: string; phone: string }) {
  const r = await supabase.auth.signUp({ email: v.email.trim(), password: v.password, options: { data: { full_name: v.name.trim(), phone: v.phone } } });
  if (r.error) throw new BackendError(r.error.message);
  return r.data.session;   // null when the project asks the new rider to confirm their email first
}
export const signOut = () => supabase.auth.signOut();
export const session = async () => (await supabase.auth.getSession()).data.session;
export const userId = async () => (await session())?.user.id ?? null;

export const apply = (v: { name: string; plate: string; vehicle: 'Bike' | 'Car'; phone: string }) =>
  rpc<void>('rider_apply', { p_name: v.name, p_plate: v.plate, p_vehicle: v.vehicle, p_phone: v.phone });
export const me = () => rpc<LiveMe | null>('rider_me');
export const setOnline = (v: boolean) => rpc<void>('rider_set_online', { p_online: v });
export const ping = (lat: number, lng: number) => rpc<void>('rider_ping', { p_lat: lat, p_lng: lng });
export const openOrders = () => rpc<LiveOffer[]>('rider_open_orders');
export const activeOrder = () => rpc<LiveOrder | null>('rider_active_order');
export const accept = (id: string) => rpc<void>('rider_accept', { p_order: id });
export const setStage = (id: string, stage: 'rider_at_store' | 'in_transit' | 'arrived') => rpc<void>('rider_set_stage', { p_order: id, p_stage: stage });
export const complete = (id: string, pin: string) => rpc<void>('complete_delivery', { p_order: id, p_otp: pin });
export const move = (id: string, lat: number, lng: number, heading: number, eta: number) => rpc<void>('rider_move', { p_order: id, p_lat: lat, p_lng: lng, p_heading: Math.round(heading), p_eta: eta });
export const sos = (order: string | null, lat: number, lng: number) => rpc<string>('rider_sos', { p_order: order ?? '', p_lat: lat, p_lng: lng });
export const saveContacts = (c: { name: string; phone: string }[]) => rpc<void>('rider_set_contacts', { p_name1: c[0].name.trim(), p_phone1: c[0].phone.trim(), p_name2: c[1].name.trim(), p_phone2: c[1].phone.trim() });

export interface ChatRow { id: string; sender_role: 'customer' | 'rider' | 'support' | 'system'; body: string; created_at: string; flags?: string[] }
export const sendChat = (id: string, text: string) => rpc<ChatRow>('send_chat', { p_order: id, p_text: text });
export async function chatMessages(id: string): Promise<ChatRow[]> {
  return ok(await supabase.from('chat_messages').select('id,sender_role,body,created_at,flags').eq('order_id', id).order('created_at', { ascending: true }).limit(200)) ?? [];
}

/** Uploads a document photo to the private kyc bucket (folder = rider id) and files it for review. */
export async function submitDoc(riderId: string, doc: string, uri: string) {
  const res = await fetch(uri);
  const bytes = await res.arrayBuffer();
  const path = `${riderId}/${doc}-${Date.now()}.jpg`;
  const up = await supabase.storage.from('kyc').upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
  if (up.error) throw new BackendError(up.error.message);
  await rpc<void>('kyc_submit', { p_kind: 'rider', p_subject: riderId, p_doc: doc, p_path: path });
}
