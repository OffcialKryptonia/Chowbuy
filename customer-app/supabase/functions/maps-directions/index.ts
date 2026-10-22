import { handle, HttpError, json, requireUser, secret } from '../_shared/util.ts';

/** GET ?origin=lat,lng&destination=lat,lng : proxies the Google Routes API so the Directions key never ships in the app. */
Deno.serve(handle(async (req) => {
  await requireUser(req);
  const u = new URL(req.url); const ll = /^-?\d{1,3}(\.\d+)?,-?\d{1,3}(\.\d+)?$/;
  const origin = u.searchParams.get('origin') ?? '', destination = u.searchParams.get('destination') ?? '';
  if (!ll.test(origin) || !ll.test(destination)) throw new HttpError(400, 'Invalid coordinates.');
  const key = await secret('google_directions_key'); if (!key) throw new HttpError(503, 'Directions are not configured.');
  const [la, ln] = origin.split(',').map(Number), [ta, tn] = destination.split(',').map(Number);
  // Routes API (the successor to the legacy Directions API). The field mask keeps the response, and the bill, small.
  const r = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline' },
    body: JSON.stringify({ origin: { location: { latLng: { latitude: la, longitude: ln } } }, destination: { location: { latLng: { latitude: ta, longitude: tn } } }, travelMode: 'DRIVE', routingPreference: 'TRAFFIC_AWARE' }),
  });
  const j = await r.json();
  const route = j.routes?.[0];
  if (!r.ok || !route?.polyline?.encodedPolyline) throw new HttpError(502, 'No route found.');
  const secs = parseInt(String(route.duration ?? '0'), 10) || 0;
  // same shape the app already parses
  return json({ status: 'OK', routes: [{ overview_polyline: { points: route.polyline.encodedPolyline }, legs: [{ distance: { value: route.distanceMeters ?? 0 }, duration: { value: secs } }] }] });
}));
