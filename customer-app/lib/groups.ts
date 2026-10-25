import { ok, supabase } from './supabase';
import { splitEqual } from './groups-split';
export { splitEqual };

export type GroupStatus = 'open' | 'locked' | 'placed' | 'cancelled';
export interface Group {
  id: string; code: string; title: string; merchantId: string; merchantName: string;
  status: GroupStatus; hostPays: boolean; orderId: string | null; total: number | null; isHost: boolean;
  members: { userId: string; amount: number; paid: boolean; host: boolean; you: boolean }[];
}

const statusLabel: Record<GroupStatus, string> = { open: 'Open for friends', locked: 'Locked, ready to order', placed: 'Ordered', cancelled: 'Cancelled' };
export const groupStatusLabel = (s: GroupStatus) => statusLabel[s];

interface GroupRow { id: string; code: string; title: string; merchant_id: string; host_id: string; host_pays: boolean; status: GroupStatus; order_id: string | null; total: number | null; merchants?: { name: string } | null }
interface MemberRow { group_id: string; user_id: string; amount: number; paid: boolean }

/** Groups the signed-in user hosts or belongs to, newest first. Row-level security limits this to the user's own groups. */
export async function myGroups(): Promise<Group[]> {
  const { data: u } = await supabase.auth.getUser();
  const me = u.user?.id;
  if (!me) return [];
  const rows = ok(await supabase.from('group_orders').select('id,code,title,merchant_id,host_id,host_pays,status,order_id,total,merchants(name)').order('created_at', { ascending: false }).limit(30)) as unknown as GroupRow[];
  if (!rows.length) return [];
  const mem = ok(await supabase.from('group_members').select('group_id,user_id,amount,paid').in('group_id', rows.map((r) => r.id)).is('left_at', null)) as unknown as MemberRow[];
  return rows.map((r) => ({
    id: r.id, code: r.code, title: r.title, merchantId: r.merchant_id, merchantName: r.merchants?.name ?? 'Store', status: r.status, hostPays: r.host_pays,
    orderId: r.order_id, total: r.total, isHost: r.host_id === me,
    members: mem.filter((m) => m.group_id === r.id).map((m) => ({ userId: m.user_id, amount: m.amount, paid: m.paid, host: m.user_id === r.host_id, you: m.user_id === me })),
  })).filter((g) => g.isHost || g.members.some((m) => m.you));
}

export async function createGroup(merchantId: string, title: string, hostPays: boolean) {
  return ok(await supabase.rpc('group_create', { p_merchant: merchantId, p_title: title, p_host_pays: hostPays })) as { id: string; code: string };
}
export async function joinGroup(code: string) { return ok(await supabase.rpc('group_join', { p_code: code })) as string; }
export async function leaveGroup(id: string) { ok(await supabase.rpc('group_leave', { p_group: id })); }
export async function setGroupStatus(id: string, status: 'open' | 'locked') { ok(await supabase.rpc('group_set_status', { p_group: id, p_status: status })); }
export async function cancelGroup(id: string) { ok(await supabase.rpc('group_cancel', { p_group: id })); }

/** After the host places the order: record who owes what, then link the order to the group. */
export async function attachOrderToGroup(g: Group, orderId: string, total: number) {
  const host = g.members.find((m) => m.host)?.userId ?? '';
  const shares = g.hostPays ? [{ user_id: host, amount: total }, ...g.members.filter((m) => !m.host).map((m) => ({ user_id: m.userId, amount: 0 }))]
    : splitEqual(total, g.members.map((m) => m.userId), host);
  ok(await supabase.rpc('group_set_shares', { p_group: g.id, p_shares: shares }));
  ok(await supabase.rpc('group_attach_order', { p_group: g.id, p_order: orderId }));
}
