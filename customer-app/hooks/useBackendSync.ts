import { useEffect } from 'react';
import { AppState } from 'react-native';
import { DEMO } from '@/lib/config';
import { loadAccount, loadCatalog, subscribe } from '@/lib/backend';
import { useAuth } from '@/stores/auth';
import { useCart } from '@/stores/cart';
import { useOrders } from '@/stores/orders';
import { useRx } from '@/stores/rx';
import { useSession } from '@/stores/session';

let lastUser: string | null = null;

/** Live mode only: loads the catalogue, then the signed-in customer's data, and keeps it current through Supabase Realtime. */
export function useBackendSync() {
  const uid = useAuth((s) => s.session?.user.id ?? null);
  useEffect(() => {
    if (DEMO) return;
    void loadCatalog().catch(() => {});
  }, []);
  useEffect(() => {
    if (DEMO || !uid) return;
    if (lastUser && lastUser !== uid) {   // another person signed in on this phone: nothing of the previous account may linger
      useOrders.getState().clearAll(); useCart.getState().clear(); useRx.getState().replace([]); useSession.getState().clear();
    }
    lastUser = uid;
    const sync = () => { void loadAccount(uid).catch(() => {}); };
    sync();
    const off = subscribe(uid);
    const app = AppState.addEventListener('change', (s) => { if (s === 'active') { sync(); void loadCatalog().catch(() => {}); } });
    return () => { off(); app.remove(); };
  }, [uid]);
}
