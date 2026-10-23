/** Pure mapping between the backend's rows and the app's models. Covered by tests/live.test.ts. */
import type { Stage } from './delivery';
import type { Vehicle } from './validation';

export interface LatLng { lat: number; lng: number }
export interface LiveOffer { id: string; merchant: string; pickupArea: string; dropArea: string; pickup: LatLng; km: number; items: number; cod: number; net: number | null }
export interface LiveOrder {
  id: string; stage: string; merchant: string; customer: string;
  pickup: LatLng & { label: string }; drop: LatLng & { label: string }; km: number;
  items: { id: string; name: string; qty: number }[]; cod: number; fee: number; tip: number;
}
export interface LiveMe {
  id: string; name: string; plate: string; vehicle: 'Bike' | 'Car'; verified: boolean; online: boolean; rating: number; ratingCount: number;
  model: 'fleet' | 'partner'; tier: string; docs: Record<string, { status: 'pending' | 'approved' | 'declined'; note: string }>;
  contacts: { name: string; phone: string }[]; deliveriesToday: number; wallet: number; earnings?: number;
}

export const toBackendVehicle = (v: Vehicle | null): 'Bike' | 'Car' => (v === 'car' || v === 'van' || v === 'truck' ? 'Car' : 'Bike');
export const fromBackendVehicle = (v: string): Vehicle => (v === 'Car' ? 'car' : 'motorcycle');

/** Where a backend order stage lands in the rider's 8-stage flow after a restart. */
export function stageFromBackend(s: string): Stage {
  switch (s) {
    case 'rider_at_store': return 'at_restaurant';
    case 'in_transit': return 'to_customer';
    case 'arrived': return 'at_customer';
    case 'delivered': return 'completed';
    default: return 'accepted';
  }
}

/** The order status to send when the rider moves into `to`, or null when nothing needs telling the backend. */
export function backendStageFor(to: Stage): 'rider_at_store' | 'in_transit' | 'arrived' | null {
  switch (to) {
    case 'at_restaurant': return 'rider_at_store';
    case 'picked_up': return 'in_transit';
    case 'at_customer': return 'arrived';
    default: return null;
  }
}

/** Offer shaped like the demo order so the offer screen and the accept flow stay the same. Fleet riders get no fare. */
export function offerToOrder(o: LiveOffer) {
  const net = o.net ?? 0;
  return {
    id: o.id, merchant: o.merchant, customer: '', pickup: o.pickupArea || o.merchant, drop: o.dropArea || 'Customer area', city: '',
    pickupLL: o.pickup, dropLL: o.pickup, km: Number(o.km) || 0, items: [] as { id: string; name: string; qty: number }[], itemCount: o.items,
    cod: o.cod, fare: { base: net, distance: 0, surge: 0, waiting: 0 }, pin: '',
  };
}

export function activeToOrder(a: LiveOrder) {
  return {
    id: a.id, merchant: a.merchant, customer: a.customer, pickup: a.pickup.label, drop: a.drop.label, city: '',
    pickupLL: { lat: a.pickup.lat, lng: a.pickup.lng }, dropLL: { lat: a.drop.lat, lng: a.drop.lng }, km: Number(a.km) || 0,
    items: a.items.map((i, n) => ({ id: `i${n}`, name: i.name, qty: i.qty })), itemCount: a.items.reduce((s, i) => s + i.qty, 0),
    cod: a.cod, fare: { base: a.fee, distance: 0, surge: 0, waiting: 0 }, pin: '',
  };
}

/** Rough minutes to go at city speed, for the customer's live ETA. */
export function etaMinutes(from: LatLng, to: LatLng, kmh = 22): number {
  const R = 6371, rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(to.lat - from.lat), dLng = rad(to.lng - from.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(from.lat)) * Math.cos(rad(to.lat)) * Math.sin(dLng / 2) ** 2;
  const km = 2 * R * Math.asin(Math.sqrt(h));
  return Math.max(1, Math.round((km / kmh) * 60));
}

export type DocState = 'missing' | 'pending' | 'approved' | 'declined';
export const docStatuses = (me: Pick<LiveMe, 'docs'>): Record<string, DocState> => Object.fromEntries(Object.entries(me.docs).map(([k, v]) => [k, v.status]));
