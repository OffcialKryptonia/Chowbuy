import { handle, hmacHex, HttpError, json, safeEq, secret } from '../_shared/util.ts';
import { settle } from '../_shared/settle.ts';

/**
 * Pocketfi transfer webhook. The signature header name and payload fields below are the common HMAC-SHA256 pattern and MUST be checked
 * against your Pocketfi merchant documentation before going live. Deploy with --no-verify-jwt.
 */
Deno.serve(handle(async (req) => {
  if (req.method !== 'POST') throw new HttpError(405, 'POST only');
  const key = await secret('pocketfi_webhook_secret'); if (!key) throw new HttpError(503, 'Not configured');
  const raw = await req.text();
  const sig = req.headers.get('x-pocketfi-signature') ?? '';
  if (!safeEq(await hmacHex(key, raw), sig)) throw new HttpError(401, 'Bad signature');
  const e = JSON.parse(raw);
  const d = e.data ?? e;
  if ((e.event ?? d.status) && /success|paid|completed/i.test(String(e.event ?? d.status))) await settle(String(d.reference), Number(d.amount), String(d.transaction_id ?? ''));
  return json({ received: true });
}));
