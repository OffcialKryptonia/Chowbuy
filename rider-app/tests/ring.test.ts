import test from 'node:test';
import assert from 'node:assert/strict';
import { createRingController, type RingHandle, type RingPlayer } from '../lib/ring-controller.ts';
import { demoOffer, offerView, partnerPayout } from '../lib/offer.ts';

function fakePlayer(loadMs = 0) {
  const s = { playing: 0, vibrating: 0, stopped: 0, started: [] as string[] };
  const player: RingPlayer = {
    async loop(id) {
      await new Promise((r) => setTimeout(r, loadMs));
      s.playing++; s.started.push(id);
      const h: RingHandle = { stop: async () => { s.playing--; s.stopped++; } };
      return h;
    },
    vibrate() { s.vibrating++; return () => { s.vibrating--; }; },
  };
  return { s, player };
}

test('a ring plays and vibrates until the offer is accepted', async () => {
  const { s, player } = fakePlayer();
  const c = createRingController(player);
  await c.start('classic');
  assert.equal(s.playing, 1); assert.equal(s.vibrating, 1); assert.ok(c.isRinging());
  await c.stop('accepted');
  assert.equal(s.playing, 0); assert.equal(s.vibrating, 0); assert.ok(!c.isRinging());
});

test('declining stops the ring', async () => {
  const { s, player } = fakePlayer(); const log: string[] = [];
  const c = createRingController(player, (e) => log.push(`${e.type}:${e.reason ?? ''}`));
  await c.start('horn'); await c.stop('declined');
  assert.equal(s.playing, 0); assert.deepEqual(log, ['start:', 'stop:declined']);
});

test('declining while the sound is still loading never leaves a ring playing', async () => {
  const { s, player } = fakePlayer(40);
  const c = createRingController(player);
  const starting = c.start('siren');
  await c.stop('declined');                 // rider taps Decline immediately
  await starting;
  assert.equal(s.playing, 0); assert.equal(s.vibrating, 0); assert.ok(!c.isRinging());
});

test('starting a new ring replaces the old one (one ring at a time)', async () => {
  const { s, player } = fakePlayer();
  const c = createRingController(player);
  await c.start('classic'); await c.start('gong');
  assert.equal(s.playing, 1); assert.equal(s.vibrating, 1); assert.deepEqual(s.started, ['classic', 'gong']);
  await c.stop('timeout'); assert.equal(s.playing, 0);
});

test('vibration can be switched off and a failing player does not throw', async () => {
  const { s, player } = fakePlayer(); const c = createRingController(player);
  await c.start('bell', { vibrate: false }); assert.equal(s.vibrating, 0); await c.stop();
  const broken: RingPlayer = { loop: async () => { throw new Error('no audio'); }, vibrate: () => () => {} };
  const c2 = createRingController(broken); await c2.start('bell'); await c2.stop();
});

test('Fleet riders never see fares; Partner riders see the breakdown', () => {
  const o = demoOffer();
  const fleet = offerView('fleet', o);
  assert.equal(fleet.showEarnings, false); assert.equal(fleet.total, null); assert.deepEqual(fleet.lines, []);
  const partner = offerView('partner', o);
  assert.equal(partner.showEarnings, true); assert.equal(partner.total, partnerPayout(o.fare));
  assert.equal(partner.total, 600 + 420 + 130);
  assert.deepEqual(partner.lines.map((l) => l[0]), ['Base fare', 'Distance', 'Surge']);
});
