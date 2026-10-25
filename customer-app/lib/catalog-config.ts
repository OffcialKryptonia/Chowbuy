import type { Vertical } from './types';

/** What the Admin Console controls, as served by the public `get_public_catalog` function (no secrets). */
export interface CatalogConfig {
  categories: { vertical: Vertical; name: string; icon: string; visible: boolean }[];
  brands: { name: string; vertical: Vertical }[];
  cities: { name: string; state: string; status: 'live' | 'paused' | 'pipeline' }[];
  hoods: { city: string; name: string; status: 'active' | 'disabled' | 'coming_soon' }[];
  smartCart: { flags?: Record<string, boolean>; threshold?: number; maxBundle?: number } | null;
  brand: unknown;
}

export const EMPTY_CATALOG: CatalogConfig = { categories: [], brands: [], cities: [], hoods: [], smartCart: null, brand: null };
export const DEFAULT_FREE_FROM = 10000;

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const arr = <T,>(v: unknown, ok: (x: any) => boolean): T[] => (Array.isArray(v) ? (v.filter((x) => x && typeof x === 'object' && ok(x)) as T[]) : []); // eslint-disable-line @typescript-eslint/no-explicit-any
const str = (x: unknown) => typeof x === 'string' && x.trim() !== '';

/** Accepts anything the server sends and returns a safe config; a missing or odd section simply means "no admin changes". */
export function parseCatalog(v: unknown): CatalogConfig {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  const sc = o.smartCart && typeof o.smartCart === 'object' ? (o.smartCart as Record<string, unknown>) : null;
  return {
    categories: arr(o.categories, (x) => str(x.name) && str(x.vertical)),
    brands: arr(o.brands, (x) => str(x.name)),
    cities: arr(o.cities, (x) => str(x.name)),
    hoods: arr(o.hoods, (x) => str(x.name) && str(x.city)),
    smartCart: sc ? {
      flags: sc.flags && typeof sc.flags === 'object' ? (sc.flags as Record<string, boolean>) : undefined,
      threshold: Number.isFinite(Number(sc.threshold)) && sc.threshold !== null && sc.threshold !== '' ? Number(sc.threshold) : undefined,
      maxBundle: Number.isFinite(Number(sc.maxBundle)) && sc.maxBundle !== null && sc.maxBundle !== '' ? Number(sc.maxBundle) : undefined,
    } : null,
    brand: o.brand ?? null,
  };
}

export const extraCatId = (name: string) => 'x:' + norm(name);
export const isExtraCat = (id?: string | null) => !!id && id.startsWith('x:');

/**
 * Applies the Admin's category list to a built-in rail: a category switched off in Admin disappears (matched by name, ignoring case),
 * and visible Admin categories that the app does not already have are added at the end. Offers is never hidden.
 */
export function shapeCats<C extends { id: string; label: string }>(base: C[], cfg: CatalogConfig, vertical: Vertical, make: (name: string, icon: string) => C): C[] {
  const mine = cfg.categories.filter((c) => c.vertical === vertical);
  if (!mine.length) return base;
  const hidden = new Set(mine.filter((c) => !c.visible).map((c) => norm(c.name)));
  const kept = base.filter((c) => c.id === 'offers' || !hidden.has(norm(c.label)));
  const have = new Set(base.map((c) => norm(c.label)));
  const extras = mine.filter((c) => c.visible && !have.has(norm(c.name))).map((c) => make(c.name, c.icon));
  return [...kept, ...extras];
}

export const brandNames = (cfg: CatalogConfig, vertical?: Vertical) => cfg.brands.filter((b) => !vertical || b.vertical === vertical).map((b) => b.name);

/** Neighbourhoods customers can pick: active ones in live cities, or the built-in list until the Admin adds any. */
export function activeAreas(cfg: CatalogConfig, fallback: string[]): string[] {
  if (!cfg.hoods.length) return fallback;
  const live = new Set(cfg.cities.filter((c) => c.status === 'live').map((c) => c.name));
  const names = cfg.hoods.filter((h) => h.status === 'active' && (!cfg.cities.length || live.has(h.city))).map((h) => h.name);
  return names.length ? names : fallback;
}

export function areaCity(cfg: CatalogConfig, area: string): string | null {
  const h = cfg.hoods.find((x) => norm(x.name) === norm(area));
  return h ? h.city : null;
}

/** Returns a message when ChowBuy does not deliver to this area right now, otherwise null. */
export function areaBlock(cfg: CatalogConfig, area: string): string | null {
  const h = cfg.hoods.find((x) => norm(x.name) === norm(area));
  if (!h) return null;
  if (h.status === 'coming_soon') return `${h.name} is coming soon. We do not deliver there yet.`;
  if (h.status === 'disabled') return `We are not delivering to ${h.name} right now.`;
  const c = cfg.cities.find((x) => x.name === h.city);
  if (c && c.status !== 'live') return `We are not delivering in ${c.name} right now.`;
  return null;
}

export const freeFrom = (cfg: CatalogConfig) => (cfg.smartCart?.threshold != null && cfg.smartCart.threshold >= 0 ? Math.round(cfg.smartCart.threshold) : DEFAULT_FREE_FROM);

/** Suggestion types the app can produce. Admin switches them on or off; unset means on. */
export const SUGGESTION_KINDS = ['free_delivery', 'cheaper', 'repeat'] as const;
export type SuggestionKind = (typeof SUGGESTION_KINDS)[number];
export const flagOn = (cfg: CatalogConfig, kind: SuggestionKind) => cfg.smartCart?.flags?.[kind] !== false;
