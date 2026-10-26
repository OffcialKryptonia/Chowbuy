import { admin, handle, HttpError, json, requireAdmin } from '../_shared/util.ts';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const tempPassword = () => {
  const a = crypto.getRandomValues(new Uint8Array(12));
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  return Array.from(a, (b) => chars[b % chars.length]).join('') + '!7';
};

/**
 * Admin only. Account tools for customers, using the Supabase Admin API.
 * POST { action: 'create', email, name, phone?, password? }  : creates a verified customer. Without a password one is generated and returned once.
 * POST { action: 'verify', id }                              : marks the email as verified.
 * POST { action: 'delete', id }                              : permanently deletes a customer account (never staff). Blocked while the wallet has money or an order is in progress.
 */
Deno.serve(handle(async (req) => {
  if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed.');
  const { db } = await requireAdmin(req);
  const b = await req.json().catch(() => { throw new HttpError(400, 'Request body must be valid JSON.'); });
  const svc = admin();
  const audit = (action: string, meta: Record<string, unknown>) => db.rpc('log_audit', { p_action: action, p_meta: meta });

  if (b.action === 'create') {
    const email = String(b.email ?? '').trim().toLowerCase();
    const name = String(b.name ?? '').trim();
    if (!EMAIL.test(email)) throw new HttpError(400, 'Enter a valid email address.');
    if (name.length < 2 || name.length > 80) throw new HttpError(400, 'Enter the customer’s name.');
    let password = String(b.password ?? '');
    const generated = !password;
    if (generated) password = tempPassword();
    else if (password.length < 8) throw new HttpError(400, 'The password needs at least 8 characters.');
    const { data, error } = await svc.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name, phone: String(b.phone ?? '').trim() } });
    if (error || !data.user) {
      if (/already|registered|exists/i.test(error?.message ?? '')) throw new HttpError(409, 'An account with this email already exists.');
      throw new HttpError(400, 'Could not create the account. Check the details and try again.');
    }
    await audit('customer.create', { id: data.user.id, email });
    return json({ ok: true, id: data.user.id, email, password: generated ? password : undefined });
  }

  const id = String(b.id ?? '');
  if (!UUID.test(id)) throw new HttpError(400, 'Choose a customer.');
  const { data: prof } = await svc.from('profiles').select('id,role,email').eq('id', id).maybeSingle();
  if (!prof || prof.role !== 'customer') throw new HttpError(404, 'Customer not found. Staff accounts cannot be changed here.');

  if (b.action === 'verify') {
    const { error } = await svc.auth.admin.updateUserById(id, { email_confirm: true });
    if (error) throw new HttpError(500, 'Could not verify the email. Please try again.');
    await audit('customer.verify_email', { id, email: prof.email });
    return json({ ok: true });
  }

  if (b.action === 'delete') {
    const { data: w } = await svc.from('wallets').select('balance').eq('user_id', id).maybeSingle();
    if ((w?.balance ?? 0) > 0) throw new HttpError(409, `This customer still has ₦${Number(w!.balance).toLocaleString('en-NG')} in their wallet. Deduct or refund it first, then delete.`);
    const { count } = await svc.from('orders').select('id', { count: 'exact', head: true }).eq('customer_id', id).not('stage', 'in', '(delivered,cancelled)');
    if (count) throw new HttpError(409, 'This customer has an order in progress. Delete after it is delivered or cancelled.');
    const { error } = await svc.auth.admin.deleteUser(id);
    if (error) throw new HttpError(500, 'Could not delete the account. Please try again.');
    await audit('customer.delete', { id, email: prof.email });
    return json({ ok: true });
  }
  throw new HttpError(400, 'Unknown action.');
}));
