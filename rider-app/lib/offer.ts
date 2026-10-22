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

export interface DemoOrder {
  id: string; merchant: string; customer: string; pickup: string; drop: string; city: string;
  pickupLL: { lat: number; lng: number }; dropLL: { lat: number; lng: number };
  km: number; items: { id: string; name: string; qty: number }[]; cod: number; fare: Offer['fare']; pin: string;
}

/** A realistic Lagos order for the built-in demo. The real ones come from the backend (stage C). */
export function demoDelivery(seed = Date.now()): DemoOrder {
  const n = 48000 + (seed % 900);
  const o = demoOffer();
  return {
    id: `CHB-${n}`, merchant: o.merchant, customer: 'Ada', pickup: 'Mama Put Kitchen, Admiralty Way, Lekki Phase 1', drop: '14 Adeola Odeku Street, Victoria Island', city: 'Lagos',
    pickupLL: { lat: 6.4474, lng: 3.4723 }, dropLL: { lat: 6.4281, lng: 3.4219 },
    km: o.km, items: [{ id: 'i1', name: 'Jollof rice and chicken', qty: 2 }, { id: 'i2', name: 'Fried plantain', qty: 1 }, { id: 'i3', name: 'Chapman', qty: 2 }],
    cod: o.cod, fare: o.fare, pin: String(1000 + (seed % 9000)),
  };
}
