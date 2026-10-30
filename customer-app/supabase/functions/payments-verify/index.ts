import { admin, handle, HttpError, json, requireUser, secret } from '../_shared/util.ts';
import { pocketfiConfirm } from '../_shared/pocketfi.ts';
import { publicSettings } from '../_shared/util.ts';
import { settle } from '../_shared/settle.ts';

/** GET ?reference= : returns the payment status. For card payments it asks Korapay directly, so a missed webhook still resolves. */
Deno.serve(handle(async (req) => {
  const { user } = await requireUser(req);
  const reference = new URL(req.url).searchParams.get('reference') ?? '';
  const { data: p } = await admin().from('payments').select('*').eq('reference', reference).eq('user_id', user.id).maybeSingle();
  if (!p) throw new HttpError(404, 'Payment not found.');
  if (p.status === 'pending' && p.method === 'korapay') {
    const key = await secret('korapay_secret_key');
    if (key) {
      const r = await fetch(`https://api.korapay.com/merchant/api/v1/charges/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${key}` } });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j?.data?.status === 'success') await settle(reference, Number(j.data.amount), j.data.reference);
      else if (r.ok && j?.data?.status === 'failed') await admin().from('payments').update({ status: 'failed' }).eq('reference', reference).eq('status', 'pending');
    }
  }
  if (p.status === 'pending' && p.method === 'pocketfi' && p.provider_ref) {
    const key = await secret('pocketfi_secret_key');
    if (key) {
      const live = !!(await publicSettings()).gateways?.pocketfi?.live;
      const c = await pocketfiConfirm(live, key, p.provider_ref);
      if (c.state === 'paid') await settle(reference, c.amount, p.provider_ref);
      else if (c.state === 'failed') await admin().from('payments').update({ status: 'failed' }).eq('reference', reference).eq('status', 'pending');
    }
  }
  const { data: now } = await admin().from('payments').select('status').eq('reference', reference).single();
  return json({ status: now?.status ?? 'pending' });
}));
