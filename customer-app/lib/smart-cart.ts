import type { CartLine, ModifierGroup, ModifierOption, Product } from './types';

/** Stable key so the same dish with the same add-ons merges into one line. */
export const lineKey = (productId: string, mods: ModifierOption[], note?: string) =>
  [productId, ...mods.map((m) => m.id).sort(), (note ?? '').trim().toLowerCase()].join('|');

export const unitPrice = (base: number, mods: ModifierOption[]) => base + mods.reduce((a, m) => a + m.price, 0);

/** Returns an error message for the first modifier group that breaks its rules, or null when the selection is valid. */
export function validateMods(groups: ModifierGroup[], picked: ModifierOption[]): string | null {
  for (const g of groups) {
    const n = picked.filter((p) => g.options.some((o) => o.id === p.id)).length;
    if (g.required && n < 1) return `Choose an option for ${g.name}.`;
    if (!g.multi && n > 1) return `${g.name}: pick only one.`;
    if (g.multi && g.max > 0 && n > g.max) return `${g.name}: pick at most ${g.max}.`;
  }
  return null;
}

export function addLine(lines: CartLine[], product: Product, mods: ModifierOption[], qty: number, note?: string): CartLine[] {
  const key = lineKey(product.id, mods, note);
  const hit = lines.find((l) => l.key === key);
  if (hit) return lines.map((l) => (l.key === key ? { ...l, qty: Math.min(50, l.qty + qty) } : l));
  return [...lines, { key, productId: product.id, merchantId: product.merchantId, name: product.name, unitPrice: unitPrice(product.price, mods), qty, mods, note }];
}

export const setQty = (lines: CartLine[], key: string, qty: number) =>
  qty <= 0 ? lines.filter((l) => l.key !== key) : lines.map((l) => (l.key === key ? { ...l, qty: Math.min(50, qty) } : l));

export const subtotal = (lines: CartLine[]) => lines.reduce((a, l) => a + l.unitPrice * l.qty, 0);
export const itemCount = (lines: CartLine[]) => lines.reduce((a, l) => a + l.qty, 0);

export interface Totals { subtotal: number; deliveryFee: number; service: number; discount: number; total: number; freeDeliveryAway: number }

/**
 * Fees: free delivery from FREE_FROM, small-order fee under MIN_BASKET, 3% service charge capped at 300.
 * `promoPct` applies to the subtotal only.
 */
export function totals(lines: CartLine[], baseFee: number, promoPct = 0, FREE_FROM = 10000, MIN_BASKET = 2000): Totals {
  const sub = subtotal(lines);
  const discount = Math.round((sub * promoPct) / 100);
  const delivery = sub === 0 ? 0 : sub >= FREE_FROM ? 0 : baseFee + (sub < MIN_BASKET ? 300 : 0);
  const service = sub === 0 ? 0 : Math.min(300, Math.round(sub * 0.03));
  return { subtotal: sub, deliveryFee: delivery, service, discount, total: Math.max(0, sub - discount + delivery + service), freeDeliveryAway: sub >= FREE_FROM || sub === 0 ? 0 : FREE_FROM - sub };
}

/** A basket belongs to one store. Returns true when adding from `merchantId` would mix stores. */
export const mixesStores = (lines: CartLine[], merchantId: string) => lines.length > 0 && lines[0].merchantId !== merchantId;
