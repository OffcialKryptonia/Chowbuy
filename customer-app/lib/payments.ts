import { API_URL, DEMO, PAY_URL } from './config';
import type { PayMethod, PaymentLink } from './types';
import { fn, ok, supabase } from './supabase';

/**
 * Payment adapters. Secret keys (Korapay secret, Pocketfi key, webhook secrets) live only on the ChowBuy server and are
 * managed in Admin > Payment gateways. The app only ever receives a checkout URL, a virtual account or a status.
 */
export interface PayInit {
  method: PayMethod;
  status: 'pending' | 'paid' | 'cod';
  reference: string;
  checkoutUrl?: string;                       // Korapay hosted checkout
  virtualAccount?: { bank: string; number: string; name: string; expiresAt: number };  // Pocketfi one-time account
}

const ref = () => 'CB' + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 1e4).toString(36).toUpperCase();

export async function initiatePayment(method: PayMethod, amount: number, orderId: string, email: string): Promise<PayInit> {
  if (DEMO) {
    await new Promise((r) => setTimeout(r, 600));
    if (method === 'cod') return { method, status: 'cod', reference: ref() };
    if (method === 'wallet') return { method, status: 'paid', reference: ref() };
    if (method === 'korapay') return { method, status: 'pending', reference: ref(), checkoutUrl: 'https://checkout.korapay.com/demo' };
    return { method, status: 'pending', reference: ref(), virtualAccount: { bank: 'Wema Bank', number: '9' + String(Math.floor(Math.random() * 1e9)).padStart(9, '0'), name: 'CHOWBUY / ' + orderId, expiresAt: Date.now() + 30 * 60000 } };
  }
  if (method === 'cod' || method === 'wallet') return { method, status: method === 'wallet' ? 'paid' : 'cod', reference: '' };   // settled by place_order
  return fn<PayInit>('payments-initiate', { body: { method, purpose: 'order', orderId } });   // the amount comes from the order row, never the client
}

/** Wallet top-up through Korapay or Pocketfi. The wallet is credited by the server when the gateway confirms. */
export async function initiateTopup(method: 'korapay' | 'pocketfi', amount: number): Promise<PayInit> {
  return fn<PayInit>('payments-initiate', { body: { method, purpose: 'topup', amount } });
}

export async function verifyPayment(reference: string): Promise<'pending' | 'paid' | 'failed'> {
  if (DEMO) return 'paid';
  const r = await fn<{ status: 'pending' | 'paid' | 'failed' }>('payments-verify', { query: { reference } });
  return r.status;
}

/** Creates a 24-hour link a sponsor can open to pay the order by card, Pocketfi transfer or their ChowBuy wallet. */
export async function createPaymentLink(orderId: string, amount: number): Promise<PaymentLink> {
  if (DEMO) {
    const token = Math.random().toString(36).slice(2, 10);
    return { url: `https://pay.chowbuy.ng/p/${token}`, token, expiresAt: Date.now() + 24 * 3600000, status: 'open' };
  }
  const l = ok(await supabase.rpc('create_payment_link', { p_order: orderId })) as { token: string; expires_at: string; status: PaymentLink['status'] };
  return { url: `${PAY_URL}/p/${l.token}`, token: l.token, expiresAt: new Date(l.expires_at).getTime(), status: l.status };
}

export const COD_RULES = (maxAmount: number, amount: number): string | null =>
  amount > maxAmount ? `Cash on delivery is available up to ₦${maxAmount.toLocaleString('en-NG')}. Pay by card, transfer or wallet.` : null;

export const API_BASE = API_URL;
