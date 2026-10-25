import type { CartLine, Product } from './types';
import type { SuggestionKind } from './catalog-config';

export interface Suggestion {
  id: string;
  kind: SuggestionKind;
  title: string;
  detail: string;
  /** Add this product to the basket. */
  add?: Product;
  /** Replace this basket line with the product. */
  swap?: { lineKey: string; to: Product; qty: number };
}

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const plain = (p: Product) => p.inStock && !p.rx && !p.controlled && !p.modifiers.some((g) => g.required);
const ngn = (n: number) => '₦' + Math.round(n).toLocaleString('en-NG');

export interface SuggestInput {
  lines: CartLine[];
  products: Product[];
  merchantId: string;
  subtotal: number;
  deliveryFee: number;
  freeFrom: number;
  /** Earlier orders at any store, newest first. */
  past: CartLine[][];
  on: (k: SuggestionKind) => boolean;
  max?: number;
}

/** Up to `max` (default 3) suggestions for the current basket. Only plain products (no required options, no prescriptions) are ever suggested. */
export function suggest(a: SuggestInput): Suggestion[] {
  const out: Suggestion[] = [];
  if (!a.lines.length) return out;
  const mine = a.products.filter((p) => p.merchantId === a.merchantId && plain(p));
  const inBasket = new Set(a.lines.map((l) => l.productId));

  if (a.on('free_delivery') && a.deliveryFee > 0 && a.subtotal < a.freeFrom) {
    const need = a.freeFrom - a.subtotal;
    const pick = mine.filter((p) => !inBasket.has(p.id) && p.price >= need).sort((x, y) => x.price - y.price)[0];
    if (pick) out.push({ id: 'fd:' + pick.id, kind: 'free_delivery', title: `Add ${pick.name} for free delivery`, detail: `${ngn(pick.price)} gets you past ${ngn(a.freeFrom)}, so you save ${ngn(a.deliveryFee)} on delivery.`, add: pick });
  }

  if (a.on('cheaper')) {
    for (const l of a.lines) {
      if (l.mods.length) continue;
      const cur = a.products.find((p) => p.id === l.productId);
      if (!cur) continue;
      const first = norm(l.name).split(' ')[0];
      const alt = mine.filter((p) => p.id !== l.productId && !inBasket.has(p.id) && p.category === cur.category && norm(p.name).split(' ')[0] === first && p.price <= l.unitPrice * 0.9)
        .sort((x, y) => x.price - y.price)[0];
      if (alt) out.push({ id: 'ch:' + l.key + ':' + alt.id, kind: 'cheaper', title: `Swap ${l.name} for ${alt.name}`, detail: `${ngn(alt.price)} instead of ${ngn(l.unitPrice)} each. Saves ${ngn((l.unitPrice - alt.price) * l.qty)}.`, swap: { lineKey: l.key, to: alt, qty: l.qty } });
    }
  }

  if (a.on('repeat')) {
    const last = a.past.find((ls) => ls.length && ls[0].merchantId === a.merchantId);
    const again = last?.map((l) => mine.find((p) => p.id === l.productId)).find((p): p is Product => !!p && !inBasket.has(p.id));
    if (again) out.push({ id: 'rp:' + again.id, kind: 'repeat', title: `Add ${again.name} again`, detail: `You ordered it last time from this store. ${ngn(again.price)}.`, add: again });
  }
  return out.slice(0, a.max ?? 3);
}
