import { getDirections, pointAlong, routeLengthKm } from './google-maps';
import { RIDERS, riderGreeting, RIDER_CHIPS } from './mock';
import { useOrders, stageIndex } from '@/stores/orders';
import type { Order, OrderStage } from './types';
import { chime } from './sound-effects';
import { useSettings } from '@/stores/settings';

/**
 * Demo transport. Mirrors exactly what the realtime server sends, so screens never know the difference.
 * Stage gaps are compressed to seconds so the whole journey can be watched in about two minutes.
 */
const GAPS: [OrderStage, number][] = [['preparing', 7], ['rider_accepted', 15], ['rider_at_store', 23], ['in_transit', 31]];
const TRAVEL_SECONDS = 50;
const running = new Map<string, ReturnType<typeof setInterval>>();

const replyFor = (text: string) => {
  const t = text.toLowerCase();
  if (t.includes('call')) return 'Okay, I will call you as soon as I reach the gate.';
  if (t.includes('security') || t.includes('reception')) return 'Noted. I will leave it with security and send you a photo.';
  if (t.includes('correct') || t.includes('gate is open')) return 'Perfect, thank you! See you shortly.';
  if (t.includes('landmark')) return 'Got the landmark, that helps a lot.';
  return RIDER_CHIPS[1];
};

export function simulatorReply(orderId: string, customerText: string) {
  setTimeout(() => useOrders.getState().say(orderId, 'rider', replyFor(customerText)), 1800);
}

export async function runSimulation(o: Order) {
  if (running.has(o.id) || o.stage === 'delivered') return;
  const st = useOrders.getState;
  const start = o.stageTimes.received ?? o.placedAt;
  const merchantPos = o.merchant.location, home = o.address.location;
  const dir = await getDirections(merchantPos, home);
  const rider = o.rider ?? RIDERS[Math.floor(Math.random() * RIDERS.length)];
  let greeted = !!(st().chats[o.id] ?? []).some((m) => m.from === 'rider');
  let travelStart = 0;

  const timer = setInterval(() => {
    const cur = st().orders.find((x) => x.id === o.id);
    if (!cur) { clearInterval(timer); running.delete(o.id); return; }
    const elapsed = (Date.now() - start) / 1000;
    for (const [stage, at] of GAPS) {
      if (elapsed >= at && stageIndex(cur.stage) < stageIndex(stage)) {
        st().setStage(o.id, stage);
        if (stage === 'rider_accepted') st().setRider(o.id, rider, dir.points);
        if (stage === 'in_transit') travelStart = Date.now();
      }
    }
    if (cur.stage === 'in_transit' || (travelStart > 0 && cur.stage !== 'arrived' && cur.stage !== 'delivered')) {
      if (!travelStart) travelStart = Date.now();
      if (!greeted) {
        greeted = true;
        st().say(o.id, 'rider', riderGreeting(firstName(), cur.merchant.name, cur.address.area));
      }
      const f = Math.min(1, (Date.now() - travelStart) / 1000 / TRAVEL_SECONDS);
      const { pos, heading } = pointAlong(dir.points, f);
      const left = Math.max(0, Math.ceil((1 - f) * (routeLengthKm(dir.points) / 22) * 60 * 1.1));
      st().moveRider(o.id, pos, heading, left);
      if (f >= 1) {
        st().setStage(o.id, 'arrived');
        st().say(o.id, 'rider', RIDER_CHIPS[3]);
        if (useSettings.getState().sounds) chime();
      }
    }
    if (cur.stage === 'arrived' && Date.now() - (cur.stageTimes.arrived ?? Date.now()) > 15000) {
      st().setStage(o.id, 'delivered');
      if (useSettings.getState().sounds) chime();
      clearInterval(timer); running.delete(o.id);
    }
  }, 1000);
  running.set(o.id, timer);
}

function firstName() {
  // Lazy require avoids a store import cycle at module load.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useSession } = require('@/stores/session') as typeof import('@/stores/session');
  return useSession.getState().name.split(' ')[0];
}

export function stopSimulation(id?: string) {
  if (id) { clearInterval(running.get(id)); running.delete(id); return; }
  running.forEach((t) => clearInterval(t)); running.clear();
}
