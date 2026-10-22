/** How often to send the rider's GPS position, to save battery and data. Pure, tested in tests/telemetry.test.ts. */
export type RiderMotion = 'offline' | 'break' | 'waiting' | 'moving';

export function gpsIntervalMs(o: { online: boolean; onBreak: boolean; atStore: boolean; speedKmh: number }): number | null {
  if (!o.online || o.onBreak) return null;              // offline or on break: stop polling completely
  if (o.atStore) return 15000;                          // waiting at the store
  if (o.speedKmh > 15) return 2000;                     // moving
  if (o.speedKmh <= 3) return 6000;                     // stopped at a red light
  return 4000;                                          // crawling in traffic (between the two rules)
}

/** Great-circle distance in km, good enough for trip length and arrival checks. */
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371, rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export const speedKmh = (mps: number | null | undefined): number => Math.max(0, (mps ?? 0) * 3.6);
