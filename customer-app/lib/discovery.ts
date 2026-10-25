import type { Merchant, Product, Vertical } from './types';

export type Sort = 'recommended' | 'fastest' | 'rating' | 'distance';

export interface Filter { vertical?: Vertical; q?: string; cat?: string | null; offersOnly?: boolean; sort?: Sort }

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

/** Category ids map onto cuisine labels so the rail and the filter share one vocabulary. */
const CAT_TO_CUISINE: Record<string, string[]> = {
  healthy: ['healthy', 'salad'], asian: ['asian'], italian: ['italian', 'pizza'], burger: ['burger'], pizza: ['pizza'],
  chicken: ['chicken'], swallows: ['local swallows'], grills: ['grills'],
};

export function filterMerchants(all: Merchant[], f: Filter): Merchant[] {
  const q = norm(f.q ?? '');
  let r = all.filter((m) => (!f.vertical || m.vertical === f.vertical));
  if (f.offersOnly || f.cat === 'offers') r = r.filter((m) => (m.discountPct ?? 0) > 0);
  else if (f.cat && f.cat.startsWith('x:')) { const want = f.cat!.slice(2); r = r.filter((m) => m.cuisine.some((c) => norm(c) === want)); }
  else if (f.cat && CAT_TO_CUISINE[f.cat]) r = r.filter((m) => m.cuisine.some((c) => CAT_TO_CUISINE[f.cat!].includes(norm(c))));
  if (q) r = r.filter((m) => norm(m.name + ' ' + m.cuisine.join(' ') + ' ' + m.area).includes(q));
  const by: Record<Sort, (a: Merchant, b: Merchant) => number> = {
    recommended: (a, b) => b.rating * Math.log(b.ratingCount + 2) - a.rating * Math.log(a.ratingCount + 2),
    fastest: (a, b) => a.etaMin - b.etaMin,
    rating: (a, b) => b.rating - a.rating,
    distance: (a, b) => a.distanceKm - b.distanceKm,
  };
  return [...r].sort(by[f.sort ?? 'recommended']);
}

/** Dish search: Home search also surfaces stores that sell a matching item ("jollof", "amala"). */
export function merchantsWithDish(merchants: Merchant[], products: Product[], q: string): Merchant[] {
  const n = norm(q);
  if (!n) return [];
  const ids = new Set(products.filter((p) => norm(p.name + ' ' + p.desc).includes(n)).map((p) => p.merchantId));
  return merchants.filter((m) => ids.has(m.id));
}

export const LAGOS_AREAS = ['Victoria Island', 'Ikoyi', 'Lekki Phase 1', 'Lekki Phase 2', 'Oniru', 'Ajah', 'Maryland', 'Ikeja GRA', 'Surulere', 'Yaba', 'Gbagada', 'Magodo', 'Banana Island', 'Festac', 'Apapa'];

/** Typo-tolerant neighbourhood suggestions (prefix, substring, then edit distance <= 2). */
export function suggestAreas(input: string, limit = 5, areas: string[] = LAGOS_AREAS): string[] {
  const q = norm(input);
  if (!q) return areas.slice(0, limit);
  const scored = areas.map((a) => {
    const n = norm(a);
    const s = n.startsWith(q) ? 0 : n.includes(q) ? 1 : 2 + Math.min(...n.split(' ').map((w) => lev(w.slice(0, q.length + 1), q)));
    return { a, s };
  }).filter((x) => x.s <= 3).sort((x, y) => x.s - y.s);
  return scored.slice(0, limit).map((x) => x.a);
}

function lev(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
