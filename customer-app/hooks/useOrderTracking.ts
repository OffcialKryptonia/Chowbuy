import { useEffect, useState } from 'react';
import { useOrders, isActive } from '@/stores/orders';
import { runSimulation } from '@/lib/simulator';
import { DEMO } from '@/lib/config';

/** Starts the transport for every active order: the simulator in demo mode, the WebSocket in production. */
export function useOrderTransport() {
  const [state] = useState<'live' | 'retrying' | 'demo'>(DEMO ? 'demo' : 'live');
  const orders = useOrders((s) => s.orders);
  const activeIds = orders.filter(isActive).map((o) => o.id).join(',');

  useEffect(() => {
    if (DEMO) {
      orders.filter(isActive).forEach((o) => { void runSimulation(o); });
      return;
    }
    // live mode: Supabase Realtime (hooks/useBackendSync.ts) keeps orders and chat current
  }, [activeIds]);
  return state;
}

export function useOrder(id: string | undefined) {
  return useOrders((s) => s.orders.find((o) => o.id === id));
}
export const sendRealtime = (_obj: unknown) => undefined;   // chat now goes through rpc send_chat
