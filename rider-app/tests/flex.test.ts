import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MODEL_CARDS, flexChecklist, flexEditable, flexAvailabilityText, cleanAccount, NAIRA_ACCOUNT } from '../lib/models.ts';
import { VEHICLES } from '../lib/validation.ts';
import { offerView, demoOffer } from '../lib/offer.ts';
import { canAcceptCod } from '../lib/cod.ts';
import { requiredDocs } from '../lib/kyc.ts';
import type { LiveMe, LiveFlex } from '../lib/live-map.ts';

const flex = (o: Partial<LiveFlex> = {}): LiveFlex => ({ status: 'draft', city: null, note: '', paused: false, agreementVersion: null, agreementAt: null, currentAgreementVersion: 'v1', registrationOpen: true, regions: ['Lagos'], blockedReason: null, availability: 'unavailable', settlement: null, ...o });
const me = (f: LiveFlex, o: Partial<LiveMe> = {}): LiveMe => ({ id: 'u', name: 'A', plate: 'ABC123', vehicle: 'Bike', verified: false, online: false, rating: 95, ratingCount: 0, model: 'flex', tier: 'Standard', docs: {}, contacts: [], deliveriesToday: 0, wallet: 0, flex: f, ...o });

test('three operating models are offered, in order, with required copy fields', () => {
  assert.deepEqual(MODEL_CARDS.map((c) => c.id), ['fleet', 'partner', 'flex']);
  for (const c of MODEL_CARDS) for (const k of ['title', 'tagline', 'compensation', 'eligibility', 'availability'] as const) assert.ok(c[k].length > 10, `${c.id}.${k}`);
});
test('model copy promises no income, no orders and quotes no figures', () => {
  const text = Object.values(MODEL_CARDS[2]).join(' ');
  assert.doesNotMatch(text, /₦|(?<!not )\bguarantee(d)? (income|orders|earnings)|earn up to|per month|\d{3,}/i);
  assert.match(MODEL_CARDS[2].availability, /does not guarantee orders/i);
});
test('flex vehicles exist and fleet/partner lists are unchanged', () => {
  assert.deepEqual(VEHICLES.flex.map((v) => v.id), ['motorcycle', 'bicycle', 'car']);
  assert.deepEqual(VEHICLES.fleet.map((v) => v.id), ['motorcycle', 'bicycle']);
  assert.equal(VEHICLES.partner.length, 5);
});
test('checklist never calls settlement verified', () => {
  const c = flexChecklist(me(flex({ city: 'Lagos', agreementVersion: 'v1', settlement: { bank: 'GTBank', accountName: 'A', last4: '6789', status: 'pending_verification' } }), { verified: true }));
  assert.ok(c.every((i) => i.done));
  const s = c.find((i) => i.id === 'settlement')!;
  assert.match(s.note!, /pending verification/);
  assert.doesNotMatch(s.note!, /verified by/i);
});
test('checklist shows what is missing', () => {
  const c = flexChecklist(me(flex()));
  assert.deepEqual(c.filter((i) => !i.done).map((i) => i.id), ['identity', 'area', 'settlement', 'agreement']);
});
test('only draft or action-required applications are editable', () => {
  assert.equal(flexEditable(flex({ status: 'draft' })), true);
  assert.equal(flexEditable(flex({ status: 'action_required' })), true);
  for (const s of ['submitted', 'under_review', 'approved', 'rejected', 'suspended'] as const) assert.equal(flexEditable(flex({ status: s })), false, s);
});
test('availability text covers every state', () => {
  assert.match(flexAvailabilityText(flex({ availability: 'suspended' })), /suspended/i);
  assert.equal(flexAvailabilityText(flex({ availability: 'unavailable', blockedReason: 'Flex deliveries are not open yet.' })), 'Flex deliveries are not open yet.');
  assert.match(flexAvailabilityText(flex({ availability: 'paused' })), /paused/i);
  assert.match(flexAvailabilityText(flex({ availability: 'online' })), /online/i);
  assert.match(flexAvailabilityText(flex({ availability: 'offline' })), /offline/i);
});
test('account number is cleaned to 10 digits', () => {
  assert.equal(cleanAccount('01 23-45 67 89 0123'), '0123456789');
  assert.ok(NAIRA_ACCOUNT.test('0123456789') && !NAIRA_ACCOUNT.test('12345'));
});
test('offer view: fleet hides fares, partner shows them, flex shows only a server-calculated net', () => {
  const o = demoOffer();
  assert.equal(offerView('fleet', o).showEarnings, false);
  assert.equal(offerView('partner', o).showEarnings, true);
  assert.equal(offerView('flex', o).showEarnings, true);
  assert.equal(offerView('flex', { ...o, fare: { base: 0, distance: 0, surge: 0, waiting: 0 } }).showEarnings, false);
});
test('cash rules: partner float rule unchanged, flex follows the shared cash limits', () => {
  assert.equal(canAcceptCod({ type: 'partner', amount: 5000, walletBalance: 100, unremitted: 0 }).ok, false);
  assert.equal(canAcceptCod({ type: 'fleet', amount: 5000, walletBalance: 0, unremitted: 0 }).ok, true);
  assert.equal(canAcceptCod({ type: 'flex', amount: 5000, walletBalance: 0, unremitted: 40000 }).ok, false);
});
test('flex uses the same KYC basics (identity, guarantor, police, next of kin)', () => {
  const ids = requiredDocs('flex', 'bicycle').map((d) => d.id);
  for (const k of ['photo_id', 'next_of_kin', 'guarantor', 'police']) assert.ok(ids.includes(k as never), k);
});
