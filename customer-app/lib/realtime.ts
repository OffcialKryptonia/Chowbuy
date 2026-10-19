import { z } from 'zod';
import { WS_URL } from './config';

export const OrderStageZ = z.enum(['received', 'preparing', 'rider_accepted', 'rider_at_store', 'in_transit', 'arrived', 'delivered']);
const Ll = z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) });

export const EventZ = z.discriminatedUnion('type', [
  z.object({ type: z.literal('stage'), orderId: z.string(), stage: OrderStageZ, at: z.number().optional() }),
  z.object({
    type: z.literal('rider'), orderId: z.string(),
    rider: z.object({ id: z.string(), name: z.string(), plate: z.string(), vehicle: z.enum(['Bike', 'Car']), rating: z.number(), verified: z.boolean(), proxyPhone: z.string() }),
    route: z.array(Ll),
  }),
  z.object({ type: z.literal('position'), orderId: z.string(), pos: Ll, heading: z.number(), etaMinutes: z.number() }),
  z.object({ type: z.literal('chat'), orderId: z.string(), from: z.enum(['rider', 'system']), text: z.string().max(1000) }),
  z.object({ type: z.literal('payment'), orderId: z.string(), status: z.literal('paid'), by: z.string().optional() }),
  z.object({ type: z.literal('call'), orderId: z.string(), action: z.enum(['incoming', 'ended']) }),
]);
export type RealtimeEvent = z.infer<typeof EventZ>;

type Handler = (e: RealtimeEvent) => void;

/**
 * WebSocket with exponential backoff and heartbeat. Invalid payloads are dropped, never trusted.
 * Auth is sent as the first message so the token never appears in a URL or server logs.
 */
export class RealtimeClient {
  private ws: WebSocket | null = null;
  private tries = 0;
  private closed = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private beat: ReturnType<typeof setInterval> | null = null;
  constructor(private orderIds: () => string[], private token: () => string | null, private onEvent: Handler, private onState?: (s: 'live' | 'retrying') => void) {}

  start() { this.closed = false; this.connect(); }
  stop() { this.closed = true; this.clear(); this.ws?.close(); this.ws = null; }
  send(obj: unknown) { if (this.ws?.readyState === 1) this.ws.send(JSON.stringify(obj)); }

  private clear() { if (this.timer) clearTimeout(this.timer); if (this.beat) clearInterval(this.beat); this.timer = null; this.beat = null; }

  private connect() {
    if (this.closed) return;
    const ws = new WebSocket(WS_URL);
    this.ws = ws;
    ws.onopen = () => {
      this.tries = 0; this.onState?.('live');
      ws.send(JSON.stringify({ type: 'auth', token: this.token(), orders: this.orderIds() }));
      this.beat = setInterval(() => this.send({ type: 'ping' }), 25000);
    };
    ws.onmessage = (m) => {
      try {
        const parsed = EventZ.safeParse(JSON.parse(String(m.data)));
        if (parsed.success) this.onEvent(parsed.data);
      } catch { /* ignore malformed frame */ }
    };
    ws.onclose = () => {
      this.clear(); this.onState?.('retrying');
      if (this.closed) return;
      const wait = Math.min(30000, 1000 * 2 ** this.tries++) + Math.random() * 400;
      this.timer = setTimeout(() => this.connect(), wait);
    };
    ws.onerror = () => ws.close();
  }
}
