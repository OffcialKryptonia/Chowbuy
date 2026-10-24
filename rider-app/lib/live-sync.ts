import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useRouter } from 'expo-router';
import { LIVE } from './config';
import * as live from './live';
import { etaMinutes } from './live-map';
import { useRider } from '@/stores/rider';

const declined = new Set<string>();
export const declineOffer = (id: string) => declined.add(id);
let lastRemoteOnline: boolean | null = null;
let lastMoveAt = 0;

/**
 * Keeps the app and the backend in step while a rider is signed in (live mode only):
 *  - tells the backend when the rider goes online or offline,
 *  - looks for open orders every few seconds while online and free, and rings the offer screen,
 *  - resumes an active delivery after a restart,
 *  - sends the rider's position to the customer while a delivery is underway.
 */
export function useLiveSync() {
  const r = useRouter();
  const online = useRider((s) => s.online);
  const onBreak = useRider((s) => s.onBreak);
  const active = useRider((s) => s.active);
  const hasOffer = useRider((s) => !!s.offer);
  const verified = useRider((s) => !!s.me?.verified);
  const lastPos = useRider((s) => s.lastPos);
  const busy = useRef(false);

  // online/offline -> backend
  useEffect(() => {
    if (!LIVE) return;
    if (lastRemoteOnline === null) { lastRemoteOnline = useRider.getState().me?.online ?? online; }
    if (online === lastRemoteOnline) return;
    lastRemoteOnline = online;
    live.setOnline(online).catch(() => { lastRemoteOnline = !online; useRider.setState({ online: !online }); });
  }, [online]);

  // profile + active delivery, on start and every 20 seconds
  useEffect(() => {
    if (!LIVE) return;
    const pull = async () => {
      try {
        const m = await live.me();
        if (m) { lastRemoteOnline = m.online; useRider.getState().hydrateMe(m); }
        useRider.getState().hydrateActive(await live.activeOrder());
      } catch { /* offline: keep what we have */ }
    };
    void pull();
    const t = setInterval(pull, 20000);
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') void pull(); });
    return () => { clearInterval(t); sub.remove(); };
  }, []);

  // open orders
  useEffect(() => {
    if (!LIVE || !online || onBreak || active || hasOffer || !verified) return;
    const look = async () => {
      if (busy.current) return;
      busy.current = true;
      try {
        const list = await live.openOrders();
        const next = list.find((o) => !declined.has(o.id));
        if (next) { useRider.getState().showOffer(next); r.push('/offer'); }
      } catch { /* try again on the next tick */ } finally { busy.current = false; }
    };
    void look();
    const t = setInterval(look, 6000);
    return () => clearInterval(t);
  }, [online, onBreak, active, hasOffer, verified, r]);

  // position -> customer
  useEffect(() => {
    if (!LIVE || !active || !lastPos) return;
    const st = active.stage;
    if (st !== 'at_restaurant' && st !== 'picked_up' && st !== 'to_customer' && st !== 'at_customer') return;   // the backend only takes position once the rider is at the store
    const now = Date.now();
    if (now - lastMoveAt < 8000) return;
    lastMoveAt = now;
    const toStore = st === 'at_restaurant';
    const target = toStore ? active.order.pickupLL : active.order.dropLL;
    live.move(active.order.id, lastPos.lat, lastPos.lng, 0, etaMinutes(lastPos, target)).catch(() => {});
  }, [lastPos, active]);
}
