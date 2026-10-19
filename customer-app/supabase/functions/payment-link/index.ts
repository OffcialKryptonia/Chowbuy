import { admin, handle, HttpError, json, newRef, secret } from '../_shared/util.ts';

/**
 * Public endpoint behind the page a sponsor opens (https://pay.chowbuy.ng/p/<token>). No sign-in needed.
 * GET  ?token=  : what to show (amount, store, expiry, status). Nothing about the customer beyond a first name.
 * POST {token, email?} : starts a Korapay checkout for the order and returns its URL. The webhook then marks the order paid.
 * Deploy with --no-verify-jwt. Tokens are 72-bit random values and expire after 24 hours.
 */
Deno.serve(handle(async (req) => {
  const db = admin();
  const token = (req.method === 'GET' ? new URL(req.url).searchParams.get('token') : (await req.clone().json().catch(() => ({}))).token) ?? '';
  if (!/^[0-9a-f]{18}$/.test(token)) throw new HttpError(404, 'This payment link is not valid.');
  const { data: l } = await db.from('payment_links').select('token,order_id,amount,expires_at,status').eq('token', token).maybeSingle();
  if (!l) throw new HttpError(404, 'This payment link is not valid.');
  const expired = l.status === 'open' && new Date(l.expires_at) <= new Date();
  if (expired) await db.from('payment_links').update({ status: 'expired' }).eq('token', token);
  const status = expired ? 'expired' : l.status;
  const { data: o } = await db.from('orders').select('merchant_id, customer_id, merchants(name)').eq('id', l.order_id).single();
  const { data: c } = await db.from('profiles').select('full_name').eq('id', o!.customer_id).single();
  const view = { amount: l.amount, status, expiresAt: l.expires_at, store: (o as any)?.merchants?.name ?? 'ChowBuy', for: (c?.full_name ?? '').split(' ')[0] || 'a friend' };
  if (req.method === 'GET') return json(view);

  if (status !== 'open') throw new HttpError(409, status === 'paid' ? 'This order has already been paid. Thank you!' : 'This payment link has expired.');
  const b = await req.json().catch(() => ({}));
  const email = typeof b.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email) ? b.email : 'sponsor@chowbuy.ng';
  const key = await secret('korapay_secret_key'); if (!key) throw new HttpError(503, 'Payments are not configured yet.');
  const reference = newRef('CBL');
  await db.from('payments').insert({ reference, user_id: o!.customer_id, order_id: l.order_id, purpose: 'order', method: 'korapay', amount: l.amount, meta: { link: token, sponsor: true } });
  const r = await fetch('https://api.korapay.com/merchant/api/v1/charges/initialize', {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ reference, amount: l.amount, currency: 'NGN', narration: `ChowBuy order ${l.order_id} (paid by a friend)`, notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook-korapay`,
      redirect_url: Deno.env.get('PAYMENT_REDIRECT_URL') ?? 'https://chowbuy.ng/pay/done', customer: { name: 'ChowBuy sponsor', email } }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j?.data?.checkout_url) throw new HttpError(502, 'The payment provider did not respond. Please try again.');
  return json({ checkoutUrl: j.data.checkout_url });
}));
