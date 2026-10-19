import { test } from 'node:test';
import assert from 'node:assert/strict';
import { totals, addLine, setQty, mixesStores, validateMods, lineKey } from '../lib/smart-cart.ts';
import { parcelFare, validateParcel } from '../lib/courier.ts';
import { ngn, normalizeNgPhone, etaWindow } from '../lib/format.ts';
import { suggestAreas, filterMerchants } from '../lib/discovery.ts';

const prod = { id: 'p1', merchantId: 'm1', name: 'Jollof', desc: '', price: 3000, image: '', category: 'Rice', modifiers: [], inStock: true };
const opt = (id: string, price: number) => ({ id, name: id, price });

test('totals: fees, free delivery, service cap, promo', () => {
  const small = addLine([], prod, [], 1);
  assert.equal(totals(small, 800).deliveryFee, 800);
  const tiny = addLine([], { ...prod, price: 1500 }, [], 1);
  assert.equal(totals(tiny, 800).deliveryFee, 1100, 'small order fee');
  const big = addLine([], prod, [], 4);
  const t = totals(big, 800);
  assert.equal(t.deliveryFee, 0, 'free over 10k');
  assert.equal(t.service, 300, 'service capped at 300');
  assert.equal(totals(big, 800, 15).discount, 1800);
  assert.equal(totals([], 800).total, 0);
});

test('cart: merging, quantity and mixed stores', () => {
  let l = addLine([], prod, [opt('a', 200)], 1);
  l = addLine(l, prod, [opt('a', 200)], 2);
  assert.equal(l.length, 1); assert.equal(l[0].qty, 3); assert.equal(l[0].unitPrice, 3200);
  assert.equal(setQty(l, l[0].key, 0).length, 0);
  assert.equal(mixesStores(l, 'm2'), true); assert.equal(mixesStores(l, 'm1'), false);
  assert.equal(lineKey('p', [opt('b', 1), opt('a', 1)]), lineKey('p', [opt('a', 1), opt('b', 1)]));
});

test('modifier validation', () => {
  const g = { id: 'g', name: 'Protein', required: true, multi: false, max: 1, options: [opt('x', 0), opt('y', 0)] };
  assert.ok(validateMods([g], []));
  assert.equal(validateMods([g], [opt('x', 0)]), null);
  assert.ok(validateMods([g], [opt('x', 0), opt('y', 0)]));
});

test('courier fare matches merchant console model', () => {
  assert.equal(parcelFare({ km: 5, kg: 2, express: false, fragile: false }), 1700);
  assert.equal(parcelFare({ km: 5, kg: 2, express: true, fragile: true }), 2500);
  assert.ok(validateParcel({ from: 'x', to: 'y', recipient: '', phone: '', km: '1', kg: '1' }));
  assert.equal(validateParcel({ from: '12 Marina Rd', to: '4 Ozumba Mbadiwe', recipient: 'Ada', phone: '08035550142', km: '5', kg: '2' }), null);
});

test('formatting', () => {
  assert.equal(ngn(1234567), '₦1,234,567');
  assert.equal(normalizeNgPhone('08035550142'), '+234 803 555 0142');
  assert.equal(normalizeNgPhone('+2348035550142'), '+234 803 555 0142');
  assert.equal(normalizeNgPhone('12345'), null);
  assert.match(etaWindow(20, 0), /–/);
});

test('discovery: typo-tolerant areas and filters', () => {
  assert.ok(suggestAreas('lekky').some((a) => a.startsWith('Lekki')));
  assert.deepEqual(filterMerchants([], { q: 'pizza' }), []);
});
