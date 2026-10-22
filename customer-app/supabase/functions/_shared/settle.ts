import { admin } from './util.ts';
import { sendTemplateEmail } from './mail.ts';

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
  let businessEffectSucceeded = true;
  if (p.purpose === 'topup') {
    const { error } = await db.rpc('credit_wallet', { p_user: p.user_id, p_amount: p.amount, p_ref: reference });
    if (error) {
      console.error('wallet credit RPC failed after payment claim', error.message);
      businessEffectSucceeded = false;
    }
  } else if (p.order_id) {
    const { error } = await db.rpc('mark_order_paid', { p_order: p.order_id, p_by: by ?? null });
    if (error) { console.error('order payment RPC failed after payment claim', error.message); businessEffectSucceeded = false; }
  }

  // Notification is best-effort and runs only after this invocation claimed the payment.
  // It must never reverse or fail the confirmed payment if an email provider is unavailable.
  try {
    if (!businessEffectSucceeded) return 'paid';
    const { data: profile } = await db.from('profiles').select('full_name,email').eq('id', p.user_id).maybeSingle();
    const { data: wallet } = p.purpose === 'topup'
      ? await db.from('wallets').select('balance').eq('user_id', p.user_id).maybeSingle()
      : { data: null };
    const vars = {
      recipient_name: profile?.full_name || 'ChowBuy customer',
      currency: 'NGN',
      amount: Number(p.amount).toLocaleString('en-NG'),
      transaction_reference: reference,
      available_balance: wallet?.balance == null ? '' : Number(wallet.balance).toLocaleString('en-NG'),
      order_reference: p.order_id ?? reference,
      merchant_name: 'your selected merchant',
    };
    const templateId = p.purpose === 'topup' ? 'wallet_funded' : 'order_confirmed';
    await sendTemplateEmail(templateId, profile?.email, vars);
  } catch (e) {
    console.error('transaction notification failed', e instanceof Error ? e.message : 'unknown error');
  }
  return 'paid';
}
