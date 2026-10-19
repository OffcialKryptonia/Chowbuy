import { admin } from './util.ts';

/**
 * Marks a gateway payment as paid exactly once and applies its effect: pays the order or credits the wallet.
 * Safe to call from the webhook, the verify endpoint and retries: money is only moved on the first success.
 */
export async function settle(reference: string, paidAmount: number, providerRef?: string, by?: string): Promise<'paid' | 'mismatch' | 'unknown'> {
  const db = admin();
  const { data: p } = await db.from('payments').select('*').eq('reference', reference).maybeSingle();
  if (!p) return 'unknown';
  if (p.status === 'paid') return 'paid';
  if (Number(paidAmount) < p.amount) { await db.from('payments').update({ status: 'failed', meta: { reason: 'amount_mismatch', paidAmount } }).eq('reference', reference); return 'mismatch'; }
  // Claim the payment first, so two simultaneous callbacks cannot both apply it.
  const { data: claimed } = await db.from('payments').update({ status: 'paid', provider_ref: providerRef ?? null }).eq('reference', reference).eq('status', 'pending').select('reference');
  if (!claimed?.length) return 'paid';
  if (p.purpose === 'topup') await db.rpc('credit_wallet', { p_user: p.user_id, p_amount: p.amount, p_ref: reference });
  else if (p.order_id) await db.rpc('mark_order_paid', { p_order: p.order_id, p_by: by ?? null });
  return 'paid';
}
