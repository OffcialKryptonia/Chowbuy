import { admin, handle, hmacHex, HttpError, json, safeEq, secret } from '../_shared/util.ts';
import { settle } from '../_shared/settle.ts';

/**
 * Korapay webhook. Korapay signs the `data` object with your secret key (HMAC SHA-256, header x-korapay-signature).
 * We verify the signature, then confirm with Korapay directly before moving any money.
 * Deploy with --no-verify-jwt: Korapay does not send a Supabase JWT. Signature verification is the authentication.
 */
Deno.serve(handle(async (req) => {
  if (req.method !== 'POST') throw new HttpError(405, 'POST only');
  const key = await secret('korapay_secret_key'); if (!key) throw new HttpError(503, 'Not configured');
  const body = await req.json().catch(() => null);
  const sig = req.headers.get('x-korapay-signature') ?? '';
  if (!body?.data || !safeEq(await hmacHex(key, JSON.stringify(body.data)), sig)) throw new HttpError(401, 'Bad signature');
  const ref = String(body.data.reference ?? '');
  if (body.event === 'charge.success') {
    const r = await fetch(`https://api.korapay.com/merchant/api/v1/charges/${encodeURIComponent(ref)}`, { headers: { Authorization: `Bearer ${key}` } });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j?.data?.status === 'success') await settle(ref, Number(j.data.amount), j.data.reference);
  } else if (body.event === 'charge.failed') {
    await admin().from('payments').update({ status: 'failed' }).eq('reference', ref).eq('status', 'pending');
  }
  return json({ received: true });
}));
