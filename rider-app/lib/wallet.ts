/** Rider wallet and earnings for PARTNER riders. Fleet riders have no fare or earnings numbers at all. */
export interface Txn { id: string; kind: 'ride' | 'tip' | 'payout' | 'cod_collected' | 'cod_remit' | 'bonus'; title: string; amount: number; at: number }

export const summarise = (txns: Txn[], since: number) => {
  const mine = txns.filter((t) => t.at >= since);
  const earned = mine.filter((t) => t.kind === 'ride' || t.kind === 'tip' || t.kind === 'bonus').reduce((s, t) => s + t.amount, 0);
  const tips = mine.filter((t) => t.kind === 'tip').reduce((s, t) => s + t.amount, 0);
  const rides = mine.filter((t) => t.kind === 'ride').length;
  return { earned, tips, rides };
};

export const MIN_PAYOUT = 1000;
export type PayoutCheck = { ok: true } | { ok: false; reason: string };
export function canPayout(o: { amount: number; balance: number; unremitted: number; nuban: string }): PayoutCheck {
  if (!/^\d{10}$/.test(o.nuban)) return { ok: false, reason: 'Enter a 10-digit NUBAN account number.' };
  if (!Number.isInteger(o.amount) || o.amount < MIN_PAYOUT) return { ok: false, reason: `The minimum payout is ₦${MIN_PAYOUT.toLocaleString('en-NG')}.` };
  if (o.amount > o.balance) return { ok: false, reason: 'That is more than your wallet balance.' };
  if (o.unremitted > 0 && o.balance - o.amount < o.unremitted) return { ok: false, reason: 'Keep enough in your wallet to cover the cash you are holding.' };
  return { ok: true };
}

export const NG_BANKS = ['Access Bank', 'GTBank', 'First Bank', 'UBA', 'Zenith Bank', 'Opay', 'Kuda', 'Moniepoint', 'PalmPay', 'Wema Bank', 'Fidelity Bank', 'Sterling Bank', 'Union Bank', 'Stanbic IBTC', 'FCMB', 'Polaris Bank'];
