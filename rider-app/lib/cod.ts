import type { RiderType } from './validation';

/** Cash-on-delivery safety rules. All amounts are whole naira. */
export const COD_PAUSE_LIMIT = 30000;

export type CodCheck = { ok: true } | { ok: false; reason: string };

export function canAcceptCod(o: { type: RiderType | null; amount: number; walletBalance: number; unremitted: number }): CodCheck {
  if (o.amount <= 0) return { ok: true };
  if (o.unremitted > COD_PAUSE_LIMIT) return { ok: false, reason: `Cash orders are paused until you pay in the ₦${o.unremitted.toLocaleString('en-NG')} you are holding.` };
  if (o.unremitted + o.amount > COD_PAUSE_LIMIT * 2) return { ok: false, reason: 'This order would put too much cash in your hands. Pay in what you hold first.' };
  if (o.type === 'partner' && o.walletBalance < o.amount) return { ok: false, reason: `Your wallet needs at least ₦${o.amount.toLocaleString('en-NG')} to take this cash order.` };
  return { ok: true };
}

/** When cash is collected the order amount moves from the rider's wallet float to cash in hand (partners), or just to cash in hand (fleet). */
export function collectCash(o: { type: RiderType | null; amount: number; walletBalance: number; unremitted: number }) {
  return { walletBalance: o.type === 'partner' ? o.walletBalance - o.amount : o.walletBalance, unremitted: o.unremitted + o.amount };
}

export const remit = (unremitted: number, paid: number) => Math.max(0, unremitted - Math.max(0, paid));
export const codPaused = (unremitted: number) => unremitted > COD_PAUSE_LIMIT;
