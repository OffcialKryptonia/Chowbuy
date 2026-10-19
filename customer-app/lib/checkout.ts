import type { CartLine, Merchant, Order, PayMethod, SavedAddress } from './types';
import { totals } from './smart-cart';

export const newOtp = () => String(1000 + Math.floor(Math.random() * 9000));
export const newOrderId = () => 'CB-' + String(84000 + Math.floor(Math.random() * 999));

export function buildOrder(opts: { merchant: Merchant; lines: CartLine[]; pay: PayMethod; paid: boolean; address: SavedAddress; promoPct: number }): Order {
  const t = totals(opts.lines, opts.merchant.deliveryFee, opts.promoPct);
  const now = Date.now();
  const eta = Math.round((opts.merchant.etaMin + opts.merchant.etaMax) / 2);
  return {
    id: newOrderId(), merchant: opts.merchant, lines: opts.lines,
    subtotal: t.subtotal, deliveryFee: t.deliveryFee, total: t.total,
    pay: opts.pay, paid: opts.paid, address: opts.address, otp: newOtp(),
    placedAt: now, stage: 'received', stageTimes: { received: now },
    etaMinutes: eta, latestBy: now + (eta + 12) * 60000,
  };
}
