import { SignJWT } from 'npm:jose@5';
import { handle, HttpError, json, publicSettings, requireUser, secret } from '../_shared/util.ts';

/** POST { orderId } : short-lived LiveKit room token. Only the customer or the assigned rider of an active order may join its room. */
Deno.serve(handle(async (req) => {
  const { db, user } = await requireUser(req);
  const { orderId } = await req.json().catch(() => ({}));
  const { data: o } = await db.from('orders').select('id,stage,customer_id,rider_id').eq('id', orderId).maybeSingle();   // RLS already limits to participants
  if (!o || (o.customer_id !== user.id && o.rider_id !== user.id)) throw new HttpError(404, 'Order not found.');
  if (['delivered', 'cancelled'].includes(o.stage)) throw new HttpError(409, 'This order is complete, so calls are closed.');
  if (!o.rider_id) throw new HttpError(409, 'A rider has not accepted this order yet.');
  const rt = (await publicSettings()).realtime ?? {};
  if (rt.provider !== 'livekit') throw new HttpError(503, 'In-app calls are not enabled.');
  const apiKey = await secret('livekit_api_key'), apiSecret = await secret('livekit_api_secret');
  if (!apiKey || !apiSecret || !rt.livekitUrl) throw new HttpError(503, 'In-app calls are not configured yet.');
  const token = await new SignJWT({ name: o.customer_id === user.id ? 'Customer' : 'Rider', video: { room: `order-${o.id}`, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: false } })
    .setProtectedHeader({ alg: 'HS256' }).setIssuer(apiKey).setSubject(user.id).setNotBefore(0).setExpirationTime('10m').sign(new TextEncoder().encode(apiSecret));
  return json({ token, url: rt.livekitUrl });
}));
