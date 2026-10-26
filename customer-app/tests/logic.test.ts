import { test } from 'node:test';
import assert from 'node:assert/strict';
import { totals, addLine, setQty, mixesStores, validateMods, lineKey } from '../lib/smart-cart.ts';
import { parcelFare, validateParcel } from '../lib/courier.ts';
import { ngn, normalizeNgPhone, etaWindow } from '../lib/format.ts';
import { suggestAreas, filterMerchants } from '../lib/discovery.ts';
import { parseCatalog, shapeCats, activeAreas, areaBlock, areaCity, freeFrom, flagOn, extraCatId, brandNames, EMPTY_CATALOG } from '../lib/catalog-config.ts';
import { suggest } from '../lib/suggestions.ts';

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

const cat = (id: string, label: string) => ({ id, label });
const cfgOf = (o: object) => parseCatalog(o);

test('catalog config: bad input becomes an empty config', () => {
  assert.deepEqual(parseCatalog(null), EMPTY_CATALOG);
  assert.deepEqual(parseCatalog('x'), EMPTY_CATALOG);
  const c = parseCatalog({ categories: [{ name: '', vertical: 'grocery' }, { name: 'Snacks', vertical: 'grocery', visible: true }, 5], brands: 'no', smartCart: { threshold: 'abc' } });
  assert.equal(c.categories.length, 1); assert.deepEqual(c.brands, []); assert.equal(c.smartCart?.threshold, undefined);
});

test('categories: hidden ones disappear, new visible ones are added, Offers stays', () => {
  const base = [cat('offers', 'Offers'), cat('pizza', 'Pizza'), cat('burger', 'Burger')];
  const make = (name: string) => cat(extraCatId(name), name);
  assert.equal(shapeCats(base, EMPTY_CATALOG, 'restaurant', make), base, 'no admin list leaves the app untouched');
  const c = cfgOf({ categories: [{ vertical: 'restaurant', name: 'PIZZA', icon: 'x', visible: false }, { vertical: 'restaurant', name: 'Offers', icon: 'x', visible: false }, { vertical: 'restaurant', name: 'Breakfast', icon: 'tags', visible: true }, { vertical: 'restaurant', name: 'Burger', icon: 'x', visible: true }, { vertical: 'grocery', name: 'Burger', icon: 'x', visible: false }] });
  const r = shapeCats(base, c, 'restaurant', make);
  assert.deepEqual(r.map((x) => x.label), ['Offers', 'Burger', 'Breakfast']);
  assert.equal(r[2].id, 'x:breakfast');
  assert.deepEqual(shapeCats(base, c, 'pharmacy', make), base, 'other verticals unaffected');
});

test('areas: only active neighbourhoods in live cities, with blocks for the rest', () => {
  const c = cfgOf({ cities: [{ name: 'Lagos', state: 'Lagos', status: 'live' }, { name: 'Kano', state: 'Kano', status: 'paused' }], hoods: [
    { city: 'Lagos', name: 'Lekki Phase 1', status: 'active' }, { city: 'Lagos', name: 'Ikoyi', status: 'coming_soon' }, { city: 'Lagos', name: 'Yaba', status: 'disabled' }, { city: 'Kano', name: 'Nasarawa', status: 'active' }] });
  assert.deepEqual(activeAreas(c, ['Fallback']), ['Lekki Phase 1']);
  assert.deepEqual(activeAreas(EMPTY_CATALOG, ['Fallback']), ['Fallback']);
  assert.match(areaBlock(c, 'ikoyi') ?? '', /coming soon/);
  assert.match(areaBlock(c, 'Yaba') ?? '', /not delivering to Yaba/);
  assert.match(areaBlock(c, 'Nasarawa') ?? '', /not delivering in Kano/);
  assert.equal(areaBlock(c, 'Lekki Phase 1'), null); assert.equal(areaBlock(c, 'Unknown place'), null);
  assert.equal(areaCity(c, 'lekki phase 1'), 'Lagos'); assert.equal(areaCity(c, 'x'), null);
});

test('brands, free delivery threshold and suggestion switches', () => {
  const c = cfgOf({ brands: [{ name: 'Indomie', vertical: 'grocery' }, { name: 'Emzor', vertical: 'pharmacy' }], smartCart: { threshold: 15000.4, flags: { cheaper: false } } });
  assert.deepEqual(brandNames(c, 'grocery'), ['Indomie']); assert.equal(brandNames(c).length, 2);
  assert.equal(freeFrom(c), 15000); assert.equal(freeFrom(EMPTY_CATALOG), 10000);
  assert.equal(flagOn(c, 'cheaper'), false); assert.equal(flagOn(c, 'repeat'), true); assert.equal(flagOn(EMPTY_CATALOG, 'cheaper'), true);
  assert.equal(totals(addLine([], prod, [], 4), 800, 0, freeFrom(cfgOf({ smartCart: { threshold: 20000 } }))).deliveryFee, 800, 'a higher threshold charges delivery');
});

const P = (id: string, name: string, price: number, over: object = {}) => ({ id, merchantId: 'm1', name, desc: '', price, image: '', category: 'Rice', modifiers: [], inStock: true, ...over });
const L = (p: ReturnType<typeof P>, qty = 1) => addLine([], p as never, [], qty)[0];

test('suggestions: free delivery picks the cheapest item that gets past the threshold', () => {
  const jollof = P('p1', 'Jollof Rice', 3000), plantain = P('p2', 'Fried Plantain', 2500), chicken = P('p3', 'Grilled Chicken', 4500), water = P('p4', 'Water', 500);
  const lines = [L(jollof)];
  const s = suggest({ lines, products: [jollof, plantain, chicken, water] as never, merchantId: 'm1', subtotal: 3000, deliveryFee: 800, freeFrom: 7000, past: [], on: () => true });
  assert.equal(s.length, 1); assert.equal(s[0].add?.id, 'p3', 'chicken (4,500) is the cheapest that reaches 7,000; plantain is too small');
  assert.match(s[0].detail, /save ₦800/);
  assert.equal(suggest({ lines, products: [jollof, chicken] as never, merchantId: 'm1', subtotal: 12000, deliveryFee: 0, freeFrom: 10000, past: [], on: () => true }).length, 0, 'already free');
  assert.equal(suggest({ lines, products: [jollof, chicken] as never, merchantId: 'm1', subtotal: 3000, deliveryFee: 800, freeFrom: 7000, past: [], on: (k) => k !== 'free_delivery' }).length, 0, 'switched off in Admin');
  assert.equal(suggest({ lines: [], products: [chicken] as never, merchantId: 'm1', subtotal: 0, deliveryFee: 0, freeFrom: 7000, past: [], on: () => true }).length, 0, 'empty basket');
});

test('suggestions: never offers prescriptions, required options, out of stock or other stores', () => {
  const base = P('p1', 'Jollof Rice', 3000);
  const bad = [P('r', 'Rx pill', 9000, { rx: true }), P('o', 'Combo', 9000, { modifiers: [{ id: 'g', name: 'Size', required: true, multi: false, max: 1, options: [] }] }), P('s', 'Sold out', 9000, { inStock: false }), P('x', 'Other store', 9000, { merchantId: 'm2' })];
  assert.equal(suggest({ lines: [L(base)], products: [base, ...bad] as never, merchantId: 'm1', subtotal: 3000, deliveryFee: 800, freeFrom: 7000, past: [], on: () => true }).length, 0);
});

test('suggestions: cheaper swap and repeat purchase', () => {
  const big = P('p1', 'Indomie Chicken 70g x40', 9000), small = P('p2', 'Indomie Onion 70g x20', 5000), other = P('p3', 'Peak Milk', 2000, { category: 'Dairy' });
  const swap = suggest({ lines: [L(big, 2)], products: [big, small, other] as never, merchantId: 'm1', subtotal: 18000, deliveryFee: 0, freeFrom: 10000, past: [], on: () => true });
  assert.equal(swap[0].kind, 'cheaper'); assert.equal(swap[0].swap?.to.id, 'p2'); assert.equal(swap[0].swap?.qty, 2); assert.match(swap[0].detail, /Saves ₦8,000/);
  const near = P('p9', 'Indomie Special', 8500);
  assert.equal(suggest({ lines: [L(big)], products: [big, near] as never, merchantId: 'm1', subtotal: 9000, deliveryFee: 0, freeFrom: 1000, past: [], on: () => true }).length, 0, 'less than 10% cheaper is not worth a swap');
  const past = [[L(P('p3', 'Peak Milk', 2000, { category: 'Dairy' }))]];
  const rep = suggest({ lines: [L(big)], products: [big, other] as never, merchantId: 'm1', subtotal: 9000, deliveryFee: 0, freeFrom: 1000, past, on: () => true });
  assert.equal(rep.length, 1); assert.equal(rep[0].kind, 'repeat'); assert.equal(rep[0].add?.id, 'p3');
  assert.equal(suggest({ lines: [L(big), L(other)], products: [big, other] as never, merchantId: 'm1', subtotal: 11000, deliveryFee: 0, freeFrom: 1000, past, on: () => true }).length, 0, 'already in basket');
});

test('splitEqual shares add up exactly and the host keeps the remainder', async () => {
  const { splitEqual } = await import('../lib/groups-split.ts');
  const s = splitEqual(1001, ['h', 'a', 'b'], 'h');
  assert.equal(s.reduce((a, x) => a + x.amount, 0), 1001);
  assert.equal(s.find((x) => x.user_id === 'a')!.amount, 333);
  assert.equal(s.find((x) => x.user_id === 'h')!.amount, 335);
  assert.deepEqual(splitEqual(500, [], 'h'), []);
});

test('alreadyRegistered spots the empty-identities fake user Supabase returns for existing emails', async () => {
  const { alreadyRegistered } = await import('../lib/signup.ts');
  assert.equal(alreadyRegistered({ identities: [] }), true);
  assert.equal(alreadyRegistered({ identities: [{ id: 'x' }] }), false);
  assert.equal(alreadyRegistered({}), false);
  assert.equal(alreadyRegistered(null), false);
});
