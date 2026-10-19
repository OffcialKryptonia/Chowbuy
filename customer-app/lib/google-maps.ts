import { API_URL, DEMO, DEV_DIRECTIONS_KEY } from './config';
import { fn } from './supabase';
import type { LatLng } from './types';

/** Decode a Google encoded polyline (precision 5). */
export function decodePolyline(encoded: string): LatLng[] {
  const pts: LatLng[] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    for (const axis of ['lat', 'lng'] as const) {
      let shift = 0, result = 0, b: number;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const d = result & 1 ? ~(result >> 1) : result >> 1;
      if (axis === 'lat') lat += d; else lng += d;
    }
    pts.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return pts;
}

export function encodePolyline(points: LatLng[]): string {
  let out = '', pLat = 0, pLng = 0;
  const enc = (v: number) => {
    let s = '';
    v = v < 0 ? ~(v << 1) : v << 1;
    while (v >= 0x20) { s += String.fromCharCode((0x20 | (v & 0x1f)) + 63); v >>= 5; }
    return s + String.fromCharCode(v + 63);
  };
  for (const p of points) {
    const la = Math.round(p.latitude * 1e5), ln = Math.round(p.longitude * 1e5);
    out += enc(la - pLat) + enc(ln - pLng);
    pLat = la; pLng = ln;
  }
  return out;
}

const rad = (d: number) => (d * Math.PI) / 180;
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = rad(b.latitude - a.latitude), dLng = rad(b.longitude - a.longitude);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/** Compass bearing in degrees (0 = north) from a to b, used to rotate the rider marker. */
export function bearing(a: LatLng, b: LatLng): number {
  const y = Math.sin(rad(b.longitude - a.longitude)) * Math.cos(rad(b.latitude));
  const x = Math.cos(rad(a.latitude)) * Math.sin(rad(b.latitude)) - Math.sin(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.cos(rad(b.longitude - a.longitude));
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

/** Shortest-way interpolation between two bearings so the marker never spins the long way round. */
export function lerpBearing(from: number, to: number, t: number): number {
  const diff = ((to - from + 540) % 360) - 180;
  return (from + diff * t + 360) % 360;
}

export function lerpPoint(a: LatLng, b: LatLng, t: number): LatLng {
  return { latitude: a.latitude + (b.latitude - a.latitude) * t, longitude: a.longitude + (b.longitude - a.longitude) * t };
}

/** Total length of a polyline in km. */
export function routeLengthKm(r: LatLng[]): number {
  let t = 0;
  for (let i = 1; i < r.length; i++) t += haversineKm(r[i - 1], r[i]);
  return t;
}

/** Walk `fraction` (0..1) along a route and return the position plus the heading at that point. */
export function pointAlong(route: LatLng[], fraction: number): { pos: LatLng; heading: number } {
  if (route.length < 2) return { pos: route[0] ?? { latitude: 0, longitude: 0 }, heading: 0 };
  const total = routeLengthKm(route);
  let target = Math.min(1, Math.max(0, fraction)) * total, acc = 0;
  for (let i = 1; i < route.length; i++) {
    const seg = haversineKm(route[i - 1], route[i]);
    if (acc + seg >= target || i === route.length - 1) {
      const t = seg === 0 ? 0 : Math.min(1, (target - acc) / seg);
      return { pos: lerpPoint(route[i - 1], route[i], t), heading: bearing(route[i - 1], route[i]) };
    }
    acc += seg;
  }
  return { pos: route[route.length - 1], heading: 0 };
}

export interface Directions { points: LatLng[]; distanceKm: number; durationMin: number }

/** Route between two points. Production goes through our backend so the Google key never ships in the app. */
export async function getDirections(from: LatLng, to: LatLng, signal?: AbortSignal): Promise<Directions> {
  const o = `${from.latitude},${from.longitude}`, d = `${to.latitude},${to.longitude}`;
  try {
    const j = DEV_DIRECTIONS_KEY
      ? await (await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${o}&destination=${d}&mode=driving&key=${DEV_DIRECTIONS_KEY}`, { signal })).json()
      : DEMO ? await (await fetch(`${API_URL}/maps/directions?origin=${o}&destination=${d}`, { signal })).json()
      : await fn<any>('maps-directions', { query: { origin: o, destination: d } });
    const r = j.routes?.[0];
    if (!r) throw new Error('no route');
    const leg = r.legs[0];
    return { points: decodePolyline(r.overview_polyline.points), distanceKm: leg.distance.value / 1000, durationMin: Math.ceil(leg.duration.value / 60) };
  } catch {
    // Offline or quota: a gently curved straight line keeps the map useful instead of blank.
    const mid = { latitude: (from.latitude + to.latitude) / 2 + 0.002, longitude: (from.longitude + to.longitude) / 2 - 0.002 };
    const pts = [from, lerpPoint(from, mid, 0.5), mid, lerpPoint(mid, to, 0.5), to];
    const km = routeLengthKm(pts);
    return { points: pts, distanceKm: km, durationMin: Math.max(3, Math.round((km / 24) * 60)) };
  }
}
