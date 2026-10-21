import test from 'node:test';
import assert from 'node:assert/strict';
import { matchDemo, DEMO_RIDERS } from '../lib/demo.ts';

test('demo rider signs in with the right password, any email case', () => {
  assert.equal(matchDemo('Rider@ChowBuy.ng ', 'ChowRider#2026')?.type, 'partner');
  assert.equal(matchDemo('fleet@chowbuy.ng', 'ChowFleet#2026')?.type, 'fleet');
});
test('wrong password or unknown email is not a demo rider', () => {
  assert.equal(matchDemo('rider@chowbuy.ng', 'nope'), null);
  assert.equal(matchDemo('someone@else.com', 'ChowRider#2026'), null);
  assert.equal(DEMO_RIDERS.length, 2);
});
