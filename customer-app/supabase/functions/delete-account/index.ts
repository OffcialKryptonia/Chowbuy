import { admin, handle, HttpError, json, requireUser } from '../_shared/util.ts';

/** POST : permanently deletes the caller's account (required by the App Store and Google Play). Order and payment records are kept without the person's identity. */
Deno.serve(handle(async (req) => {
  const { db, user } = await requireUser(req);
  const { data: w } = await db.from('wallets').select('balance').eq('user_id', user.id).maybeSingle();
  if ((w?.balance ?? 0) > 0) throw new HttpError(409, 'Spend or transfer your wallet balance before deleting your account.');
  const { count } = await db.from('orders').select('id', { count: 'exact', head: true }).eq('customer_id', user.id).not('stage', 'in', '(delivered,cancelled)');
  if (count) throw new HttpError(409, 'You have an order in progress. Delete your account after it is delivered.');
  const { error } = await admin().auth.admin.deleteUser(user.id);
  if (error) throw new HttpError(500, 'Could not delete the account. Please contact support.');
  return json({ ok: true });
}));
