import * as live from './live';
import { fromBackendVehicle, toBackendVehicle, type LiveMe } from './live-map';
import { BackendError } from './supabase';
import { useApply } from '@/stores/apply';
import { useRider } from '@/stores/rider';

/**
 * After a sign-in or a restored session: load the rider's profile (filing the application first if they signed up but had to confirm their
 * email before it could be sent) and copy it into the app's stores so every screen reads the real account.
 */
export async function startSession(email?: string): Promise<LiveMe> {
  let me = await live.me();
  const a = useApply.getState();
  if (!me && a.name && a.phone) {
    await live.apply({ name: a.name, plate: a.vehicle === 'bicycle' ? 'BICYCLE' : a.plate || 'PENDING', vehicle: toBackendVehicle(a.vehicle), phone: a.phone, type: a.type ?? undefined });
    me = await live.me();
  }
  if (!me) {
    await live.signOut();
    throw new BackendError('There is no rider account for this email yet. Tap Apply now to create one.');
  }
  useRider.getState().hydrateMe(me);
  useRider.getState().hydrateActive(await live.activeOrder().catch(() => null));
  useApply.getState().set({ email: email ?? a.email, type: me.model, vehicle: fromBackendVehicle(me.vehicle), verified: me.verified, submitted: true, name: me.name });
  return me;
}

export async function endSession() {
  try { if (useRider.getState().online) await live.setOnline(false); } catch { /* already offline or no connection */ }
  await live.signOut().catch(() => {});
  useRider.getState().reset();
  useApply.getState().reset();
}
