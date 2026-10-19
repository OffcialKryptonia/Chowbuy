import { admin, handle, HttpError, json, newRef, publicSettings, requireUser, secret } from '../_shared/util.ts';

/**
 * POST { method: 'korapay' | 'pocketfi', purpose: 'order' | 'topup', orderId?, amount? }
 * The amount for an order always comes from the database, never from the client.
 */
Deno.serve(handle(async (req) => {
  const { db, user } = await requireUser(req);
  const b = await req.json().catch(() => ({}));
  const method = b.method as 'korapay' | 'pocketfi';
  if (!['korapay', 'pocketfi'].includes(method)) throw new HttpError(400, 'Choose card or bank transfer.');
  const cfg = (await publicSettings()).gateways?.[method];
  if (!cfg?.enabled) throw new HttpError(400, 'That payment method is not available right now.');

  let amount: number; let orderId: string | null = null; const purpose = b.purpose === 'topup' ? 'topup' : 'order';
  if (purpose === 'order') {
    const { data: o } = await db.from('orders').select('id,total,paid,customer_id').eq('id', b.orderId).maybeSingle();   // RLS: only the customer's own order
    if (!o) throw new HttpError(404, 'Order not found.');
    if (o.paid) throw new HttpError(409, 'This order is already paid.');
    amount = o.total; orderId = o.id;
  } else {
    amount = Math.round(Number(b.amount));
    if (!(amount >= 500 && amount <= 500000)) throw new HttpError(400, 'Enter an amount between ₦500 and ₦500,000.');
  }
  const reference = newRef('CB');
  const { data: prof } = await db.from('profiles').select('full_name,email').eq('id', user.id).single();
  await admin().from('payments').insert({ reference, user_id: user.id, order_id: orderId, purpose, method, amount });
  const origin = Deno.env.get('SUPABASE_URL')!;

  if (method === 'korapay') {
    const key = await secret('korapay_secret_key'); if (!key) throw new HttpError(503, 'Card payments are not configured yet.');
    const r = await fetch('https://api.korapay.com/merchant/api/v1/charges/initialize', {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference, amount, currency: 'NGN', narration: purpose === 'topup' ? 'ChowBuy wallet top-up' : `ChowBuy order ${orderId}`,
        notification_url: `${origin}/functions/v1/webhook-korapay`, redirect_url: Deno.env.get('PAYMENT_REDIRECT_URL') ?? 'https://chowbuy.ng/pay/done',
        customer: { name: prof?.full_name || 'ChowBuy customer', email: prof?.email ?? user.email } }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j?.data?.checkout_url) { console.error('korapay init failed', r.status, j?.message); throw new HttpError(502, 'The payment provider did not respond. Please try again.'); }
    return json({ method, status: 'pending', reference, checkoutUrl: j.data.checkout_url });
  }

  // Pocketfi one-time virtual account. The request shape below must be confirmed against your Pocketfi merchant docs; set pocketfi_base_url and
  // pocketfi_secret_key in Admin > Settings > Payment gateways. Until then the endpoint answers 503 and the app shows a clear message.
  const base = await secret('pocketfi_base_url'), pkey = await secret('pocketfi_secret_key');
  if (!base || !pkey) throw new HttpError(503, 'Bank transfer is not configured yet.');
  const r = await fetch(`${base.replace(/\/$/, '')}/virtual-accounts`, {
    method: 'POST', headers: { Authorization: `Bearer ${pkey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ reference, amount, currency: 'NGN', expires_in_minutes: 30, customer_name: prof?.full_name, customer_email: prof?.email ?? user.email }),
  });
  const j = await r.json().catch(() => ({}));
  const acct = j?.data ?? j;
  if (!r.ok || !acct?.account_number) { console.error('pocketfi init failed', r.status); throw new HttpError(502, 'The payment provider did not respond. Please try again.'); }
  return json({ method, status: 'pending', reference, virtualAccount: { bank: acct.bank_name ?? 'Bank', number: String(acct.account_number), name: acct.account_name ?? 'CHOWBUY', expiresAt: Date.now() + 30 * 60000 } });
}));
