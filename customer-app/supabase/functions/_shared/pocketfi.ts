/** Pocketfi API (https://developer.pocketfi.ng/docs). Live and sandbox differ only by base URL. Auth is a Bearer token. */
export const pocketfiBase = (live: boolean) => (live ? 'https://api.pocketfi.ng/api/v1' : 'https://api.pocketfi.ng/api/test');
export const pocketfiHeaders = (key: string) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Accept: 'application/json' });
export const POCKETFI_PAID = /^(success|successful|paid|completed|complete)$/i;
export const POCKETFI_FAILED = /^(failed|declined|cancelled|canceled|expired|reversed)$/i;

/** Asks Pocketfi directly whether a hosted-checkout payment completed. Never trust a redirect or webhook body alone. */
export async function pocketfiConfirm(live: boolean, key: string, paymentId: string): Promise<{ state: 'paid' | 'failed' | 'pending'; amount: number }> {
  const r = await fetch(`${pocketfiBase(live)}/checkout/confirm`, { method: 'POST', headers: pocketfiHeaders(key), body: JSON.stringify({ payment_id: paymentId }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return { state: 'pending', amount: 0 };
  const st = String(j?.status ?? '');
  return { state: POCKETFI_PAID.test(st) ? 'paid' : POCKETFI_FAILED.test(st) ? 'failed' : 'pending', amount: Number(j?.amount ?? 0) };
}
