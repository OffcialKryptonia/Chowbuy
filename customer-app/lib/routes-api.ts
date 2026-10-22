/** Turns a Routes API computeRoutes response into the shape getDirections reads (legacy Directions layout). */
export function fromRoutesApi(j: any): { routes: any[] } {
  const r = j?.routes?.[0];
  if (!r?.polyline?.encodedPolyline) return { routes: [] };
  return { routes: [{ overview_polyline: { points: r.polyline.encodedPolyline }, legs: [{ distance: { value: r.distanceMeters ?? 0 }, duration: { value: parseInt(String(r.duration ?? '0'), 10) || 0 } }] }] };
}

