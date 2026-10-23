import test from 'node:test';
import assert from 'node:assert/strict';
import { toBackendVehicle, fromBackendVehicle, stageFromBackend, backendStageFor, offerToOrder, activeToOrder, etaMinutes, docStatuses } from '../lib/live-map.ts';
import { advance } from '../lib/delivery.ts';

test('vehicles map to what the backend accepts', () => {
  assert.equal(toBackendVehicle('motorcycle'), 'Bike');
  assert.equal(toBackendVehicle('bicycle'), 'Bike');
  assert.equal(toBackendVehicle('car'), 'Car');
  assert.equal(toBackendVehicle('van'), 'Car');
  assert.equal(toBackendVehicle(null), 'Bike');
  assert.equal(fromBackendVehicle('Car'), 'car');
  assert.equal(fromBackendVehicle('Bike'), 'motorcycle');
});

test('backend stages resume the right app stage after a restart', () => {
  assert.equal(stageFromBackend('rider_accepted'), 'accepted');
  assert.equal(stageFromBackend('rider_at_store'), 'at_restaurant');
  assert.equal(stageFromBackend('in_transit'), 'to_customer');
  assert.equal(stageFromBackend('arrived'), 'at_customer');
});

test('only the stage changes the backend cares about are sent', () => {
  assert.equal(backendStageFor('at_restaurant'), 'rider_at_store');
  assert.equal(backendStageFor('picked_up'), 'in_transit');
  assert.equal(backendStageFor('at_customer'), 'arrived');
  assert.equal(backendStageFor('to_restaurant'), null);
  assert.equal(backendStageFor('to_customer'), null);
  assert.equal(backendStageFor('completed'), null);
});

test('an offer never carries street, customer or items', () => {
  const o = offerToOrder({ id: 'CB-1', merchant: 'Mama Put', pickupArea: 'Lekki', dropArea: 'VI', pickup: { lat: 6.4, lng: 3.4 }, km: 4.2, items: 3, cod: 5000, net: 850 });
  assert.equal(o.customer, '');
  assert.equal(o.items.length, 0);
  assert.equal(o.itemCount, 3);
  assert.equal(o.pin, '');
  assert.equal(o.fare.base, 850);
});

test('fleet offers show no fare', () => {
  const o = offerToOrder({ id: 'CB-2', merchant: 'M', pickupArea: '', dropArea: '', pickup: { lat: 1, lng: 1 }, km: 1, items: 1, cod: 0, net: null });
  assert.equal(o.fare.base, 0);
});

test('active order gets unique item ids even when the same product repeats', () => {
  const o = activeToOrder({ id: 'CB-3', stage: 'rider_accepted', merchant: 'M', customer: 'Ada', pickup: { lat: 1, lng: 2, label: 'M, Lekki' }, drop: { lat: 3, lng: 4, label: '14 Adeola Odeku, VI' }, km: 3,
    items: [{ id: 'p1', name: 'Jollof', qty: 2 }, { id: 'p1', name: 'Jollof', qty: 1 }], cod: 0, fee: 700, tip: 0 });
  assert.deepEqual(o.items.map((i) => i.id), ['i0', 'i1']);
  assert.equal(o.itemCount, 3);
  assert.deepEqual(o.dropLL, { lat: 3, lng: 4 });
});

test('live orders have no local PIN: the server checks the code', () => {
  const o = activeToOrder({ id: 'CB-4', stage: 'arrived', merchant: 'M', customer: 'Ada', pickup: { lat: 1, lng: 2, label: 'x' }, drop: { lat: 3, lng: 4, label: 'y' }, km: 1, items: [], cod: 0, fee: 0, tip: 0 });
  assert.equal(o.pin, '');
  // the store passes the typed PIN as the expected one for live orders, so only the 4-digit format is checked locally
  assert.equal(advance('at_customer', { pin: '1234', expectedPin: o.pin || '1234' }).ok, true);
  assert.equal(advance('at_customer', { pin: '12', expectedPin: '12' }).ok, false);
});

test('eta is at least one minute and grows with distance', () => {
  const a = { lat: 6.4474, lng: 3.4723 }, b = { lat: 6.4281, lng: 3.4219 };
  assert.ok(etaMinutes(a, a) === 1);
  assert.ok(etaMinutes(a, b) > 5);
});

test('document statuses are flattened for the checklist', () => {
  assert.deepEqual(docStatuses({ docs: { photo_id: { status: 'approved', note: '' }, police: { status: 'declined', note: 'blurry' } } }), { photo_id: 'approved', police: 'declined' });
});
