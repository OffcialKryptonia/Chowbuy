import type { RiderType } from './validation';

export interface Offer {
  id: string; merchant: string; pickup: string; drop: string; km: number; items: number; cod: number;
  fare: { base: number; distance: number; surge: number; waiting: number };
}

/** Partner pay for one ride, in whole naira. Tips are added on delivery and are 100% the rider's. */
export const partnerPayout = (f: Offer['fare']): number => Math.round(f.base + f.distance + f.surge + f.waiting);

/**
 * What an offer card may show. ChowBuy Fleet riders are salaried, so they never see per-ride fares or earnings;
 * Partner riders see the full breakdown before they accept.
 */
export function offerView(type: RiderType | null, o: Offer): { showEarnings: boolean; total: number | null; lines: [string, number][] } {
  if (type === 'fleet') return { showEarnings: false, total: null, lines: [] };
  const lines: [string, number][] = [['Base fare', o.fare.base], ['Distance', o.fare.distance]];
  if (o.fare.surge > 0) lines.push(['Surge', o.fare.surge]);
  if (o.fare.waiting > 0) lines.push(['Waiting', o.fare.waiting]);
  return { showEarnings: true, total: partnerPayout(o.fare), lines };
}

export function demoOffer(): Offer {
  const km = 4.2;
  return { id: 'CHB-48210', merchant: 'Mama Put Kitchen', pickup: 'Lekki Phase 1', drop: 'Victoria Island', km, items: 3, cod: 12500,
    fare: { base: 600, distance: Math.round(km * 100), surge: 130, waiting: 0 } };
}
export const OFFER_SECONDS = 30;
