import { handle, HttpError, json, requireUser, secret } from '../_shared/util.ts';

/** GET ?origin=lat,lng&destination=lat,lng : proxies Google Directions so the Directions key never ships in the app. */
Deno.serve(handle(async (req) => {
  await requireUser(req);
  const u = new URL(req.url); const ll = /^-?\d{1,3}(\.\d+)?,-?\d{1,3}(\.\d+)?$/;
  const origin = u.searchParams.get('origin') ?? '', destination = u.searchParams.get('destination') ?? '';
  if (!ll.test(origin) || !ll.test(destination)) throw new HttpError(400, 'Invalid coordinates.');
  const key = await secret('google_directions_key'); if (!key) throw new HttpError(503, 'Directions are not configured.');
  const r = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=driving&key=${key}`);
  const j = await r.json();
  if (j.status !== 'OK') throw new HttpError(502, 'No route found.');
  return json({ status: 'OK', routes: [{ overview_polyline: j.routes[0].overview_polyline, legs: [{ distance: j.routes[0].legs[0].distance, duration: j.routes[0].legs[0].duration }] }] });   // same shape the app already parses
}));
