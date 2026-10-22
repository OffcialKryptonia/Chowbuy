/** The delivery state machine from the rider master prompt. Pure, so it is covered by tests/delivery.test.ts. */

export type Stage = 'offered' | 'accepted' | 'to_restaurant' | 'at_restaurant' | 'picked_up' | 'to_customer' | 'at_customer' | 'completed';
export const STAGES: Stage[] = ['offered', 'accepted', 'to_restaurant', 'at_restaurant', 'picked_up', 'to_customer', 'at_customer', 'completed'];

export interface StepInfo { label: string; action: string | null; hint: string }
export const STEPS: Record<Stage, StepInfo> = {
  offered: { label: 'New order', action: 'Accept order', hint: 'Accept within 30 seconds or it goes to another rider.' },
  accepted: { label: 'Accepted', action: 'Start trip to the restaurant', hint: 'Head to the pickup point.' },
  to_restaurant: { label: 'On the way to pick up', action: "I've arrived at the restaurant", hint: 'Follow the route to the pickup point.' },
  at_restaurant: { label: 'At the restaurant', action: 'Items checked, picked up', hint: 'Check every item against the order before you leave.' },
  picked_up: { label: 'Picked up', action: 'Start trip to the customer', hint: 'A polite greeting is sent to the customer for you.' },
  to_customer: { label: 'On the way to the customer', action: "I've arrived at the customer", hint: 'The customer and merchant can follow you live.' },
  at_customer: { label: 'At the customer', action: 'Complete with 4-digit PIN', hint: 'Ask the customer for their 4-digit delivery PIN.' },
  completed: { label: 'Delivered', action: null, hint: 'Well done. This delivery is complete.' },
};

export const nextStage = (s: Stage): Stage | null => STAGES[STAGES.indexOf(s) + 1] ?? null;
export const stageIndex = (s: Stage): number => STAGES.indexOf(s);

export interface AdvanceContext {
  checklist?: Record<string, boolean>;
  items?: { id: string }[];
  pin?: string;
  expectedPin?: string;
  /** Set when the order was handed over by the "customer unreachable" flow and a supervisor approved it. */
  supervisorApproved?: boolean;
}

export type AdvanceResult = { ok: true; stage: Stage } | { ok: false; reason: string };

/** Moves one step forward, or says why it cannot. Skipping steps is never allowed. */
export function advance(from: Stage, ctx: AdvanceContext = {}): AdvanceResult {
  const to = nextStage(from);
  if (!to) return { ok: false, reason: 'This delivery is already complete.' };
  if (from === 'at_restaurant') {
    const missing = (ctx.items ?? []).filter((i) => !ctx.checklist?.[i.id]).length;
    if (missing > 0) return { ok: false, reason: missing === 1 ? 'Check the last item before you leave.' : `Check all ${missing} remaining items before you leave.` };
  }
  if (from === 'at_customer' && !ctx.supervisorApproved) {
    if (!/^\d{4}$/.test(ctx.pin ?? '')) return { ok: false, reason: 'Enter the 4-digit PIN from the customer.' };
    if (ctx.pin !== ctx.expectedPin) return { ok: false, reason: 'That PIN is not correct. Ask the customer to check their app.' };
  }
  return { ok: true, stage: to };
}

/** Maps the rider's stage to the status the ChowBuy backend uses (order_stage). */
export const BACKEND_STAGE: Partial<Record<Stage, string>> = {
  accepted: 'rider_accepted', at_restaurant: 'rider_at_store', picked_up: 'in_transit', at_customer: 'arrived', completed: 'delivered',
};

/** Customer unreachable: 5 minute wait, a photo of the spot, then a supervisor must sign off. */
export const UNREACHABLE_WAIT_SECONDS = 300;
export function unreachableReady(o: { waitedSeconds: number; hasPhoto: boolean }): { ok: boolean; reason: string } {
  if (o.waitedSeconds < UNREACHABLE_WAIT_SECONDS) return { ok: false, reason: `Wait ${Math.ceil((UNREACHABLE_WAIT_SECONDS - o.waitedSeconds) / 60)} more minute(s) and keep trying to reach the customer.` };
  if (!o.hasPhoto) return { ok: false, reason: 'Take a photo of the location or security post first.' };
  return { ok: true, reason: '' };
}
