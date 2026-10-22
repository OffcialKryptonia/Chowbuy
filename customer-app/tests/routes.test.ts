import test from 'node:test';
import assert from 'node:assert/strict';
import { fromRoutesApi } from '../lib/routes-api.ts';

test('Routes API response maps to the shape the app parses', () => {
  const r = fromRoutesApi({ routes: [{ duration: '754s', distanceMeters: 5210, polyline: { encodedPolyline: '_p~iF~ps|U' } }] }).routes[0];
  assert.equal(r.overview_polyline.points, '_p~iF~ps|U');
  assert.equal(r.legs[0].distance.value, 5210);
  assert.equal(r.legs[0].duration.value, 754);
});
test('empty Routes API response means no route', () => {
  assert.deepEqual(fromRoutesApi({}).routes, []);
});
