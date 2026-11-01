import { admin, cors, safeEq, secret } from '../_shared/util.ts';

/**
 * Called only by the database triggers (pg_net) with the shared x-hook-secret. Deploy with verify_jwt = false.
 * POST { event, ref } -> works out the recipients, then sends through OneSignal (devices registered with OneSignal)
 * and Expo (devices registered with Expo). Always answers 200 so a failed push never retries into a storm.
 */
type Msg = { to: string[]; title: string; body: string; type: string; url?: string };
const money = (n: unknown) => '₦' + Number(n ?? 0).toLocaleString('en-NG');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const want = await secret('push_hook_secret');
  if (!want || !safeEq(req.headers.get('x-hook-secret') ?? '', want)) return new Response('forbidden', { status: 403 });
  const b = await req.json().catch(() => ({}));
  const event = String(b.event ?? ''), ref = String(b.ref ?? '');
  const db = admin();
  try {
    const msgs = await build(db, event, ref);
    for (const m of msgs) if (m.to.length) await deliver(db, m);
  } catch (e) { console.error('push-notify', event, e instanceof Error ? e.message : e); }
  return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, 'Content-Type': 'application/json' } });
});

async function build(db: ReturnType<typeof admin>, event: string, ref: string): Promise<Msg[]> {
  if (event === 'application_submitted' || event === 'sos') {
    const { data } = await db.from('profiles').select('id').eq('role', 'admin');
    const to = (data ?? []).map((r: any) => r.id);
    return event === 'sos'
      ? [{ to, title: 'SOS from a rider', body: 'A rider pressed the emergency button. Open Admin, Emergency.', type: 'sos', url: '/admin/' }]
      : [{ to, title: 'New merchant application', body: 'A business submitted its application for review.', type: 'application', url: '/admin/' }];
  }
  if (!event.startsWith('order_')) return [];
  const { data: o } = await db.from('orders').select('id,customer_id,merchant_id,rider_id,total,stage,cancel_reason').eq('id', ref).maybeSingle();
  if (!o) return [];
  const { data: m } = await db.from('merchants').select('name').eq('id', o.merchant_id).maybeSingle();
  const shop = m?.name ?? 'the store';
  const { data: mem } = await db.from('merchant_members').select('user_id').eq('merchant_id', o.merchant_id).eq('status', 'active');
  const merchantTo = (mem ?? []).map((r: any) => r.user_id);
  const code = String(o.id).slice(-6).toUpperCase();
  const out: Msg[] = [];
  switch (event) {
    case 'order_received': case 'order_new': {
      out.push({ to: merchantTo, title: 'New order', body: `Order ${code} · ${money(o.total)}. Open ChowBuy Merchant to accept.`, type: 'order_new', url: '/merchant/' });
      const { data: rs } = await db.from('riders').select('user_id').eq('online', true).eq('verified', true);
      out.push({ to: (rs ?? []).map((r: any) => r.user_id), title: 'New delivery nearby', body: `${shop} · ${money(o.total)}. Open the app to accept.`, type: 'rider_offer' });
      break;
    }
    case 'order_preparing': out.push({ to: [o.customer_id], title: 'Order accepted', body: `${shop} is preparing your order.`, type: 'order' }); break;
    case 'order_rider_accepted':
      out.push({ to: [o.customer_id], title: 'Rider assigned', body: 'A rider is on the way to pick up your order.', type: 'order' });
      out.push({ to: merchantTo, title: 'Rider assigned', body: `A rider is coming for order ${code}.`, type: 'order_rider', url: '/merchant/' });
      break;
    case 'order_rider_at_store': out.push({ to: merchantTo, title: 'Rider is at your store', body: `Hand over order ${code}.`, type: 'order_rider', url: '/merchant/' }); break;
    case 'order_in_transit': out.push({ to: [o.customer_id], title: 'On the way', body: 'Your rider has picked up your order.', type: 'order' }); break;
    case 'order_arrived': out.push({ to: [o.customer_id], title: 'Your rider has arrived', body: 'Meet your rider to collect your order.', type: 'order' }); break;
    case 'order_delivered': out.push({ to: [o.customer_id], title: 'Delivered', body: 'Enjoy your order! Tap to rate it.', type: 'order' }); break;
    case 'order_cancelled':
      out.push({ to: [o.customer_id], title: 'Order cancelled', body: o.cancel_reason ? String(o.cancel_reason).slice(0, 120) : 'Your order was cancelled.', type: 'order' });
      out.push({ to: merchantTo, title: 'Order cancelled', body: `Order ${code} was cancelled.`, type: 'order', url: '/merchant/' });
      if (o.rider_id) out.push({ to: [o.rider_id], title: 'Delivery cancelled', body: `Order ${code} was cancelled.`, type: 'order' });
      break;
  }
  return out;
}

async function deliver(db: ReturnType<typeof admin>, m: Msg) {
  const ids = [...new Set(m.to)];
  const { data: set } = await db.from('platform_settings').select('value').eq('key', 'public').maybeSingle();
  const appId = set?.value?.push?.onesignalAppId as string | undefined, key = await secret('onesignal_rest_key');
  // OneSignal targets by external id (the user id every app logs in with), so it reaches Customer, Rider, Merchant (web) and Admin (web) devices alike.
  if (set?.value?.push?.provider === 'onesignal' && appId && key) {
    const r = await fetch('https://api.onesignal.com/notifications', { method: 'POST', headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: appId, target_channel: 'push', include_aliases: { external_id: ids }, headings: { en: m.title }, contents: { en: m.body }, data: { type: m.type }, ...(m.url ? { web_url: 'https://chowbuy.ng' + m.url } : {}), priority: 10 }) });
    if (!r.ok) console.error('OneSignal', r.status, (await r.text().catch(() => '')).slice(0, 200));
  }
  // Devices that registered through Expo (older Customer builds) still get theirs.
  const { data: rows } = await db.from('profiles').select('id,push_token').in('id', ids);
  const ex = (rows ?? []).filter((r: any) => r.push_token?.provider === 'expo' && r.push_token?.token);
  if (ex.length) {
    const access = await secret('expo_access_token');
    await fetch('https://exp.host/--/api/v2/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(access ? { Authorization: `Bearer ${access}` } : {}) },
      body: JSON.stringify(ex.map((r: any) => ({ to: r.push_token.token, title: m.title, body: m.body, sound: r.push_token.sound && r.push_token.sound !== 'default' ? `notif_${r.push_token.sound}.wav` : 'default', channelId: `orders_${r.push_token.sound ?? 'dingtone'}`, data: { type: m.type } }))) }).catch(() => {});
  }
}
