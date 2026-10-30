import { admin, handle, hmacHex, HttpError, json, publicSettings, safeEq, secret } from '../_shared/util.ts';
import { pocketfiConfirm } from '../_shared/pocketfi.ts';
import { settle } from '../_shared/settle.ts';

/**
 * Pocketfi webhook (https://developer.pocketfi.ng/docs/webhooks). The signature is HMAC-SHA512 of the raw body signed with the Pocketfi secret key,
 * sent in the Pocketfi-Signature header. The webhook body is never trusted for money: a matching pending payment is re-confirmed with Pocketfi
 * before it is settled. Deploy with --no-verify-jwt.
 */
Deno.serve(handle(async (req) => {
  if (req.method !== 'POST') throw new HttpError(405, 'POST only');
  const key = await secret('pocketfi_secret_key'); if (!key) throw new HttpError(503, 'Not configured');
  const raw = await req.text();
  const sig = (req.headers.get('pocketfi-signature') ?? req.headers.get('http_pocketfi_signature') ?? req.headers.get('http-pocketfi-signature') ?? '').trim().toLowerCase();
  if (!sig || !safeEq(await hmacHex(key, raw, 'SHA-512'), sig)) throw new HttpError(401, 'Bad signature');
  const e = JSON.parse(raw);
  const ref = String(e?.transaction?.reference ?? '');
  if (ref) {
    const { data: p } = await admin().from('payments').select('reference,status').eq('method', 'pocketfi').eq('provider_ref', ref).maybeSingle();
    if (p && p.status === 'pending') {
      const c = await pocketfiConfirm(!!(await publicSettings()).gateways?.pocketfi?.live, key, ref);
      if (c.state === 'paid') await settle(p.reference, c.amount, ref);
    }
  }
  return json({ received: true });
}));
