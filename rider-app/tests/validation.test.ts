import test from 'node:test';
import assert from 'node:assert/strict';
import { VEHICLES, isEmail, isNigerianMobile, nationalPhone, passwordOk, passwordRules } from '../lib/validation.ts';

test('email', () => {
  assert.ok(isEmail('rider@chowbuy.ng'));
  assert.ok(isEmail(' Longliveeldeen@gmail.com '));
  assert.ok(!isEmail('rider@chowbuy'));
  assert.ok(!isEmail('rider chowbuy.ng'));
});

test('nigerian phone numbers are normalised and checked', () => {
  assert.equal(nationalPhone('0813 632 0187'), '8136320187');
  assert.equal(nationalPhone('+234 813 632 0187'), '8136320187');
  assert.ok(isNigerianMobile('8136320187'));
  assert.ok(isNigerianMobile('08136320187'));
  assert.ok(isNigerianMobile('+2347012345678'));
  assert.ok(!isNigerianMobile('8136320'));        // the short number from the Glovo screenshot is rejected
  assert.ok(!isNigerianMobile('5136320187'));     // must start 7, 8 or 9
  assert.ok(!isNigerianMobile('813632018799'));
});

test('password rules', () => {
  assert.ok(!passwordOk('short1A!'));
  assert.ok(!passwordOk('alllowercase1!'));
  assert.ok(!passwordOk('NoNumbersHere!'));
  assert.ok(!passwordOk('NoSpecial12345'));
  assert.ok(passwordOk('ChowBuy#2026'));
  assert.equal(passwordRules('ChowBuy#2026').filter((r) => r.ok).length, 5);
  assert.equal(passwordRules('').filter((r) => r.ok).length, 0);
});

test('vehicle options follow the Fleet / Partner split', () => {
  assert.deepEqual(VEHICLES.fleet.map((v) => v.id), ['motorcycle', 'bicycle']);
  assert.deepEqual(VEHICLES.partner.map((v) => v.id), ['motorcycle', 'bicycle', 'car', 'truck', 'van']);
  assert.deepEqual(VEHICLES.partner.filter((v) => v.note === 'Dispatch only').map((v) => v.id), ['truck', 'van']);
});
