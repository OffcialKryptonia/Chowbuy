import test from 'node:test';
import assert from 'node:assert/strict';
import { advance, nextStage, STAGES, unreachableReady, BACKEND_STAGE } from '../lib/delivery.ts';
import { canAcceptCod, collectCash, codPaused, remit, COD_PAUSE_LIMIT } from '../lib/cod.ts';
import { gpsIntervalMs, haversineKm } from '../lib/telemetry.ts';
import { greeting, flagMessage, isUrgent, quickReplies } from '../lib/chat.ts';
import { sosSms, emergencyNumbers, validContacts, mapsLink } from '../lib/sos.ts';
import { requiredDocs, kycSummary } from '../lib/kyc.ts';
import { canPayout, summarise } from '../lib/wallet.ts';
import { shiftHours, SHIFTS, fmtHours } from '../lib/shift.ts';

test('stages go in order, one step at a time, ending at completed', () => {
  assert.equal(STAGES.length, 8);
  assert.equal(nextStage('offered'), 'accepted');
  assert.equal(nextStage('completed'), null);
  assert.deepEqual(advance('accepted'), { ok: true, stage: 'to_restaurant' });
});
test('cannot leave the restaurant until every item is checked', () => {
  const items = [{ id: 'a' }, { id: 'b' }];
  const r = advance('at_restaurant', { items, checklist: { a: true } });
  assert.equal(r.ok, false);
  assert.deepEqual(advance('at_restaurant', { items, checklist: { a: true, b: true } }), { ok: true, stage: 'picked_up' });
});
test('completing needs the exact 4-digit PIN', () => {
  assert.equal(advance('at_customer', { pin: '12', expectedPin: '1234' }).ok, false);
  assert.equal(advance('at_customer', { pin: '1111', expectedPin: '1234' }).ok, false);
  assert.deepEqual(advance('at_customer', { pin: '1234', expectedPin: '1234' }), { ok: true, stage: 'completed' });
  assert.equal(advance('at_customer', { supervisorApproved: true }).ok, true);
  assert.equal(advance('completed').ok, false);
});
test('backend stage names line up with the database', () => {
  assert.equal(BACKEND_STAGE.completed, 'delivered');
  assert.equal(BACKEND_STAGE.picked_up, 'in_transit');
});
test('unreachable flow needs a 5 minute wait and a photo', () => {
  assert.equal(unreachableReady({ waitedSeconds: 120, hasPhoto: true }).ok, false);
  assert.equal(unreachableReady({ waitedSeconds: 300, hasPhoto: false }).ok, false);
  assert.equal(unreachableReady({ waitedSeconds: 300, hasPhoto: true }).ok, true);
});
test('COD: pauses above 30,000 held; partners need float; fleet does not', () => {
  assert.equal(codPaused(COD_PAUSE_LIMIT), false);
  assert.equal(codPaused(COD_PAUSE_LIMIT + 1), true);
  assert.equal(canAcceptCod({ type: 'partner', amount: 12500, walletBalance: 5000, unremitted: 0 }).ok, false);
  assert.equal(canAcceptCod({ type: 'partner', amount: 12500, walletBalance: 20000, unremitted: 0 }).ok, true);
  assert.equal(canAcceptCod({ type: 'fleet', amount: 12500, walletBalance: 0, unremitted: 0 }).ok, true);
  assert.equal(canAcceptCod({ type: 'fleet', amount: 1000, walletBalance: 0, unremitted: 30001 }).ok, false);
  assert.equal(canAcceptCod({ type: 'partner', amount: 0, walletBalance: 0, unremitted: 99999 }).ok, true);
});
test('COD: collecting moves money correctly', () => {
  assert.deepEqual(collectCash({ type: 'partner', amount: 12500, walletBalance: 20000, unremitted: 1000 }), { walletBalance: 7500, unremitted: 13500 });
  assert.deepEqual(collectCash({ type: 'fleet', amount: 12500, walletBalance: 0, unremitted: 0 }), { walletBalance: 0, unremitted: 12500 });
  assert.equal(remit(13500, 20000), 0);
  assert.equal(remit(13500, 500), 13000);
});
test('GPS throttle follows the spec', () => {
  const base = { online: true, onBreak: false, atStore: false };
  assert.equal(gpsIntervalMs({ ...base, speedKmh: 30 }), 2000);
  assert.equal(gpsIntervalMs({ ...base, speedKmh: 1 }), 6000);
  assert.equal(gpsIntervalMs({ ...base, speedKmh: 0, atStore: true }), 15000);
  assert.equal(gpsIntervalMs({ ...base, speedKmh: 30, onBreak: true }), null);
  assert.equal(gpsIntervalMs({ online: false, onBreak: false, atStore: false, speedKmh: 30 }), null);
  assert.ok(Math.abs(haversineKm({ lat: 6.4281, lng: 3.4219 }, { lat: 6.4474, lng: 3.4723 }) - 5.8) < 0.5);
});
test('greeting, chips and safety filter', () => {
  const g = greeting('Ada', 'Mama Put Kitchen');
  assert.ok(g.startsWith('Good day Ada!') && g.includes('Mama Put Kitchen') && g.includes('estate gate codes'));
  assert.equal(quickReplies(7).length, 5);
  assert.ok(quickReplies(7)[2].text.includes('7 minutes'));
  assert.deepEqual(flagMessage('please send money to my account number'), ['offplatform_payment']);
  assert.ok(isUrgent(flagMessage('there was an accident, I am bleeding')));
  assert.deepEqual(flagMessage('I have arrived at your gate'), []);
});
test('SOS message, numbers and contacts', () => {
  const sms = sosSms({ riderName: 'Tunde', lat: 6.4281, lng: 3.4219, battery: 41.6, orderId: 'CB-84901', at: new Date('2026-10-22T10:00:00Z') });
  assert.ok(sms.includes('https://maps.google.com/?q=6.42810,3.42190') && sms.includes('CB-84901') && sms.includes('42%'));
  assert.equal(mapsLink(1, 2), 'https://maps.google.com/?q=1.00000,2.00000');
  assert.deepEqual(emergencyNumbers('Lagos').map((x) => x.number), ['112', '767']);
  assert.deepEqual(emergencyNumbers('Abuja').map((x) => x.number), ['112']);
  assert.equal(validContacts([{ name: 'A', phone: '0803' }, { name: 'Bola', phone: '0803 555 0142' }]).length, 1);
});
test('KYC documents depend on rider type and vehicle', () => {
  assert.ok(requiredDocs('partner', 'motorcycle').some((d) => d.id === 'insurance'));
  assert.ok(!requiredDocs('partner', 'bicycle').some((d) => d.id === 'insurance'));
  assert.ok(!requiredDocs('fleet', 'motorcycle').some((d) => d.id === 'plate'));
  const docs = requiredDocs('partner', 'bicycle');
  assert.equal(kycSummary(docs, {}).state, 'action_needed');
  const all = Object.fromEntries(docs.map((d) => [d.id, 'approved' as const]));
  assert.equal(kycSummary(docs, all).state, 'verified');
  assert.equal(kycSummary(docs, { ...all, police: 'pending' }).state, 'in_review');
});
test('payout and earnings summaries', () => {
  assert.equal(canPayout({ amount: 5000, balance: 20000, unremitted: 0, nuban: '0123456789' }).ok, true);
  assert.equal(canPayout({ amount: 500, balance: 20000, unremitted: 0, nuban: '0123456789' }).ok, false);
  assert.equal(canPayout({ amount: 5000, balance: 20000, unremitted: 18000, nuban: '0123456789' }).ok, false);
  assert.equal(canPayout({ amount: 5000, balance: 20000, unremitted: 0, nuban: '123' }).ok, false);
  const s = summarise([{ id: '1', kind: 'ride', title: '', amount: 900, at: 10 }, { id: '2', kind: 'tip', title: '', amount: 200, at: 10 }, { id: '3', kind: 'payout', title: '', amount: -500, at: 10 }, { id: '4', kind: 'ride', title: '', amount: 900, at: 1 }], 5);
  assert.deepEqual(s, { earned: 1100, tips: 200, rides: 1 });
});
test('shifts', () => {
  assert.deepEqual(SHIFTS.map(shiftHours), [8, 8, 8]);
  assert.equal(fmtHours(125), '2h 05m');
});
