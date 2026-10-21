import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'node:fs';
const db = new PGlite({ extensions: { pgcrypto } });
const root = new URL('../', import.meta.url).pathname;
await db.exec(`
 create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
 create schema auth; create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
 grant usage on schema public, auth to anon, authenticated, service_role;
 grant all on all tables in schema public to service_role;
`);
await db.exec(fs.readFileSync(root + 'migrations/20261018000001_core.sql', 'utf8'));
await db.exec(fs.readFileSync(root + 'migrations/20261019000001_messaging.sql', 'utf8'));
await db.exec(fs.readFileSync(root + 'migrations/20261019000002_oauth_profile.sql', 'utf8'));
await db.exec(fs.readFileSync(root + 'migrations/20261021000001_admin_customers_points.sql', 'utf8'));
await db.exec(fs.readFileSync(root + 'seed.sql', 'utf8'));
await db.exec(`grant all on all tables in schema public to service_role; grant execute on all functions in schema public to service_role;`);
await db.exec(`grant usage on all sequences in schema public to service_role`);
let pass = 0, fail = 0;
const as = async (uid, fn) => { await db.exec(`set role ${uid ? 'authenticated' : 'anon'}; select set_config('request.jwt.claim.sub', '${uid ?? ''}', false)`); try { return await fn(); } finally { await db.exec('reset role'); } };
const ok = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log((cond ? 'PASS ' : 'FAIL ') + name + (cond ? '' : ' ' + extra)); };
const throws = async (name, fn, match) => { try { await fn(); ok(name, false, 'did not throw'); } catch (e) { ok(name, !match || new RegExp(match, 'i').test(e.message), e.message); } };
const q = (s, p) => db.query(s, p).then(r => r.rows);

const mk = async (email, phone) => (await q(`insert into auth.users (email, raw_user_meta_data) values ($1, $2::jsonb) returning id`, [email, JSON.stringify({ full_name: email.split('@')[0], phone, role: 'admin' })]))[0].id;
const A = await mk('ada@x.ng', '08031110001'), B = await mk('bola@x.ng', '08031110002'), R = await mk('rider@x.ng', '08031110003'), M = await mk('merchant@x.ng', '08031110004'), ADM = await mk('admin@x.ng', '08031110005');
const prof = await q(`select role, phone from profiles where id = $1`, [A]);
ok('signup creates customer profile, ignores role metadata', prof[0].role === 'customer' && prof[0].phone === '+2348031110001');
ok('signup creates wallet', (await q(`select balance from wallets where user_id=$1`, [A]))[0].balance === 0);
await db.exec(`update profiles set role='admin' where id='${ADM}'; update profiles set role='rider' where id='${R}'; update profiles set role='merchant' where id='${M}'; update merchants set owner_id='${M}' where id='m1';
 insert into riders (user_id,name,plate,vehicle,verified,proxy_phone,online) values ('${R}','Alex Okoro','7NfLR004','Bike',true,'+234 700 555 0142',true);
 update wallets set balance = 20000 where user_id='${A}';`);

await as(A, async () => {
  await throws('client cannot set own role', () => db.query(`update profiles set role='admin' where id=$1`, [A]), 'permission denied');
  await throws('client cannot set own points', () => db.query(`update profiles set points=9999 where id=$1`, [A]), 'permission denied');
  await throws('client cannot edit wallet', () => db.query(`update wallets set balance=999999 where user_id=$1`, [A]), 'permission denied');
  await throws('client cannot insert orders', () => db.query(`insert into orders (customer_id,merchant_id,lines,subtotal,delivery_fee,service_fee,total,pay,address,eta_minutes,latest_by) values ($1,'m1','[]',1,0,0,1,'cod','{}',1,now())`, [A]), 'permission denied');
  await throws('client cannot read secrets table', () => db.query(`select * from platform_secrets`), 'permission denied');
});
const addr = (await as(A, () => q(`insert into addresses (user_id,label,line,area,lat,lng) values ($1,'Home','14 Adeola Odeku Street','Victoria Island, Lagos',6.43,3.41) returning id`, [A])))[0].id;

// place order: server prices it
let placed = await as(A, () => q(`select place_order('m1', $1::jsonb, 'wallet', $2, 'LUNCH15') r`, [JSON.stringify([{ product_id: 'p1', qty: 2, mod_ids: ['sz-l', 'p-beef'] }, { product_id: 'p4', qty: 1 }]), addr]));
let r = placed[0].r, o = r.order;
// p1 3600+800+500=4900 x2 =9800 + 1500 = 11300; 15% = 1695; delivery free (>=10000); service min(300, 339)=300; total 9905? 11300-1695+0+300
ok('server computes subtotal 11300', o.subtotal === 11300, JSON.stringify(o));
ok('promo discount 15%', o.discount === 1695);
ok('free delivery over 10k, service capped', o.delivery_fee === 0 && o.service_fee === 300);
ok('total = 9905', o.total === 9905);
ok('otp is 4 digits', /^\d{4}$/.test(r.otp));
ok('wallet debited and order paid', o.paid && (await q(`select balance from wallets where user_id=$1`, [A]))[0].balance === 20000 - 9905);
await as(A, async () => {
  await throws('client price tampering impossible (unknown product)', () => db.query(`select place_order('m1', '[{"product_id":"p5","qty":1}]'::jsonb, 'cod', $1, null)`, [addr]), 'no longer available');
  await throws('required modifier enforced', () => db.query(`select place_order('m1', '[{"product_id":"p1","qty":1}]'::jsonb, 'cod', $1, null)`, [addr]), 'Choose an option');
  await throws('bad promo', () => db.query(`select place_order('m1', '[{"product_id":"p3","qty":1}]'::jsonb, 'cod', $1, 'FREEFOOD')`, [addr]), 'promo');
  await throws('rx item needs verified prescription', () => db.query(`select place_order('m6', '[{"product_id":"p9","qty":1}]'::jsonb, 'cod', $1, null)`, [addr]), 'prescription');
  await throws('COD cap', () => db.query(`select place_order('m1', '[{"product_id":"p2","qty":10,"mod_ids":["sz-l"]}]'::jsonb, 'cod', $1, null)`, [addr]), 'Cash on delivery');
  const own = await q(`select id from orders`); ok('customer sees own order', own.length === 1);
  const sec = await q(`select otp from order_secrets where order_id=$1`, [o.id]); ok('customer can read own otp', sec[0].otp === r.otp);
});
await as(B, async () => {
  ok('other customer sees no orders', (await q(`select 1 from orders`)).length === 0);
  ok('other customer cannot read otp', (await q(`select 1 from order_secrets`)).length === 0);
});
// merchant, rider flow
await as(M, async () => { ok('merchant sees paid order', (await q(`select 1 from orders`)).length === 1); await db.query(`select merchant_set_stage($1,'preparing')`, [o.id]); });
await as(R, async () => {
  ok('rider cannot see unassigned order', (await q(`select 1 from orders`)).length === 0);
  await db.query(`select rider_accept($1)`, [o.id]);
  ok('rider sees assigned order', (await q(`select 1 from orders`)).length === 1);
  ok('rider cannot read otp', (await q(`select 1 from order_secrets`)).length === 0);
  await db.query(`select rider_set_stage($1,'rider_at_store')`, [o.id]); await db.query(`select rider_set_stage($1,'in_transit')`, [o.id]);
  await db.query(`select rider_move($1, 6.431, 3.416, 450, 4)`, [o.id]);
  await throws('rider cannot complete with wrong otp', () => db.query(`select complete_delivery($1,'0000')`, [o.id]), 'not correct');
});
const stg = (await q(`select stage, rider, rider_heading, stage_times from orders where id=$1`, [o.id]))[0];
ok('stage + snapshot + heading normalised', stg.stage === 'in_transit' && stg.rider.name === 'Alex Okoro' && stg.rider_heading === 90 && !!stg.stage_times.rider_accepted);
await as(A, async () => {
  await db.query(`select send_chat($1,'Address is 100% correct, gate is open.')`, [o.id]);
  await throws('chat blocks off-platform payment', () => db.query(`select send_chat($1,'just send money to my account')`, [o.id]), 'pay only through ChowBuy');
  const m = (await q(`select to_jsonb(send_chat($1,'you are useless')) m`, [o.id]))[0].m; ok('chat masks insults and flags', /•/.test(m.body) && m.flags.length === 1, JSON.stringify(m));
  const p = (await q(`select to_jsonb(send_chat($1,'call me on 0803 123 4567 please')) m`, [o.id]))[0].m; ok('chat masks phone numbers', !/4567/.test(p.body) && /•/.test(p.body), p.body);
  await throws('tip needs funds/limits', () => db.query(`select tip_rider($1, 50)`, [o.id]), 'between');
  await db.query(`select tip_rider($1, 500)`, [o.id]);
});
ok('tip credited to rider wallet', (await q(`select balance from wallets where user_id=$1`, [R]))[0].balance === 500);
await as(R, async () => { await db.query(`select send_chat($1,'On the road now, heading straight to you!')`, [o.id]); });
await as(ADM, async () => { ok('admin sees all chats', (await q(`select 1 from chat_messages`)).length >= 4); await db.query(`select admin_chat_lock($1,true)`, [o.id]); });
await as(A, async () => { await throws('locked chat refuses messages', () => db.query(`select send_chat($1,'hello')`, [o.id]), 'paused'); });
await as(ADM, async () => { await db.query(`select admin_chat_lock($1,false)`, [o.id]); ok('broadcast reaches active chats', (await q(`select admin_broadcast('Victoria','Heavy rain alert') n`))[0].n === 1); });
await as(R, async () => {
  await db.query(`select rider_set_stage($1,'arrived')`, [o.id]);
  await db.query(`select complete_delivery($1,$2)`, [o.id, r.otp]);
});
ok('delivery completes only with right otp', (await q(`select stage from orders where id=$1`, [o.id]))[0].stage === 'delivered');
await as(A, async () => {
  await throws('chat closes after delivery', () => db.query(`select send_chat($1,'thanks')`, [o.id]), 'closed');
  const pts = (await q(`select submit_review($1, true, array['Delicious'], true, array['Fast'], 'great') p`, [o.id]))[0].p; ok('review awards 50 points', pts === 50);
  await throws('cannot review twice', () => db.query(`select submit_review($1, true, '{}', true, '{}', '')`, [o.id]), 'already');
});
const earnedOrder = await q(`select delta from points_ledger where user_id=$1 and kind='order'`, [A]);
const oSub = (await q(`select subtotal from orders where id=$1`, [o.id]))[0].subtotal;
ok('delivery earns order points once (1 per ₦100 of food)', earnedOrder.length === 1 && earnedOrder[0].delta === Math.floor(oSub / 100), JSON.stringify(earnedOrder) + ' sub ' + oSub);
ok('points stored = order points + 50 review points', (await q(`select points from profiles where id=$1`, [A]))[0].points === 50 + earnedOrder[0].delta);
ok('merchant rating updated', (await q(`select rating_count from merchants where id='m1'`))[0].rating_count === 436);
// COD + payment link + sponsor
const cod = (await as(A, () => q(`select place_order('m1','[{"product_id":"p3","qty":1}]'::jsonb,'cod',$1,null) r`, [addr])))[0].r.order;
ok('COD order unpaid, merchant can see it', !cod.paid);
const card = (await as(A, () => q(`select place_order('m1','[{"product_id":"p3","qty":2}]'::jsonb,'korapay',$1,null) r`, [addr])))[0].r.order;
const k = (await as(A, () => q(`select create_payment_link($1) l`, [card.id])))[0].l;
ok('payment link 24h', k.status === 'open' && /^[0-9a-f]{18}$/.test(k.token));
await as(M, async () => { ok('merchant cannot see unpaid card orders', (await q(`select 1 from orders where pay='korapay'`)).length === 0); });
await db.exec(`update wallets set balance = 10000 where user_id='${B}'`);
await as(B, async () => { const x = (await q(`select pay_link_with_wallet($1) r`, [k.token]))[0].r; ok('sponsor pays link from own wallet', x.paid_by === 'bola' ); });
ok('order marked paid by sponsor', (await q(`select paid, paid_by from orders where id=(select order_id from payment_links where token=$1)`, [k.token]))[0].paid === true);
await as(B, async () => { await throws('link cannot be paid twice', () => db.query(`select pay_link_with_wallet($1)`, [k.token]), 'expired'); });
// wallet send
await as(A, async () => {
  await throws('cannot send to self', () => db.query(`select wallet_send('08031110001', 200)`), 'yourself');
  await throws('cannot overdraw', () => db.query(`select wallet_send('08031110002', 400000)`), 'too low');
  await db.query(`select wallet_send('0803 111 0002', 300)`);
});
const bal = (await q(`select balance from wallets where user_id=$1`, [B]))[0].balance;
ok('transfer credited and sponsor debited', bal === 10000 - card.total + 300, String(bal));
// idempotent credit
const c1 = (await q(`select credit_wallet($1, 1000, 'KP-1') x`, [A]))[0].x, c2 = (await q(`select credit_wallet($1, 1000, 'KP-1') x`, [A]))[0].x;
ok('gateway credit is idempotent', c1 === true && c2 === false);
await as(A, async () => { await throws('customer cannot call service-only credit', () => db.query(`select credit_wallet($1,1000,'x')`, [A]), 'permission denied'); await throws('customer cannot mark paid', () => db.query(`select mark_order_paid('${cod.id}')`), 'permission denied'); });
ok('public config readable', (await as(null, () => q(`select get_public_config() c`)))[0].c.loyalty.reviewPoints === 50);
await as(null, async () => { ok('anon sees catalogue', (await q(`select 1 from merchants`)).length === 7); await throws('anon cannot read orders', () => db.query(`select 1 from orders`), 'permission denied'); });
// duplicate phone at sign-up must not leave the new user without a profile
const dup = await mk('dup@x.ng', '08031110001');
const dp = await q(`select phone from profiles where id=$1`, [dup]);
ok('duplicate phone still creates profile (phone left empty)', dp.length === 1 && dp[0].phone === null);
ok('duplicate-phone user has wallet', (await q(`select 1 from wallets where user_id=$1`, [dup])).length === 1);
// messaging
await as(A, async () => {
  await db.query(`update profiles set marketing_email=false where id=$1`, [A]);
  ok('user can opt out of promotional email', (await q(`select marketing_email from profiles where id=$1`, [A]))[0].marketing_email === false);
  await throws('customer cannot count audiences', () => db.query(`select admin_audience_count(array['customer'],'email')`), 'not allowed');
  await throws('customer cannot read broadcasts', () => db.query(`select 1 from broadcasts`).then(r => { if (r.rows.length) throw new Error('rows'); throw new Error('permission denied (empty)'); }), 'denied|rows');
  await throws('customer cannot insert broadcasts', () => db.query(`insert into broadcasts (kind,roles,subject,body) values ('email','{customer}','x','y')`), 'permission denied');
});
await db.exec(`update profiles set push_token='{"provider":"expo","token":"ExponentPushToken[x]"}' where id='${B}'`);
await as(ADM, async () => {
  ok('admin counts opted-in customer emails (A opted out)', (await q(`select admin_audience_count(array['customer'],'email') n`))[0].n === 2, JSON.stringify(await q(`select admin_audience_count(array['customer'],'email') n`)));
  ok('admin counts push audience by registered devices', (await q(`select admin_audience_count(array['customer'],'push') n`))[0].n === 1);
});
const cfg = (await as(null, () => q(`select get_public_config() c`)))[0].c;
ok('public config exposes sign-in flags (off by default)', cfg.auth.google.enabled === false && cfg.auth.apple.enabled === false && cfg.gateways.cod.maxAmount === 20000);
// oauth sign-up: no phone, name carried under "name" (Google/Apple)
{
  const id = (await q(`insert into auth.users (email, raw_user_meta_data) values ('goog@x.com', '{"name":"Ada Obi"}'::jsonb) returning id`))[0].id;
  const r = (await q(`select full_name, phone from profiles where id=$1`, [id]))[0];
  ok('oauth signup: profile made with name fallback and no phone', r && r.full_name === 'Ada Obi' && r.phone === null);
  ok('oauth signup: wallet made', (await q(`select 1 from wallets where user_id=$1`, [id])).length === 1);
}

/* ---- admin customers, points, rider pay ---- */
{
  const before = (await q(`select balance from wallets where user_id=$1`, [A]))[0].balance;
  await as(A, async () => {
    await throws('customer cannot top up wallets', () => db.query(`select admin_wallet_adjust($1, 500, 1, 'free money')`, [A]), 'Admins only');
    await throws('customer cannot list customers', () => db.query(`select admin_customers('')`), 'Admins only');
    await throws('customer cannot adjust points', () => db.query(`select admin_points_adjust($1, 500, 'free')`, [A]), 'Admins only');
    await throws('customer cannot redeem below minimum', () => db.query(`select redeem_points(100)`), 'from 500');
  });
  await as(ADM, async () => {
    const bal = (await q(`select admin_wallet_adjust($1, 2500, 1, 'Refund for cold food') b`, [A]))[0].b;
    ok('admin top-up raises balance', bal === before + 2500, String(bal));
    await throws('deduct needs a reason', () => db.query(`select admin_wallet_adjust($1, 100, -1, '')`, [A]), 'reason');
    await throws('cannot deduct more than the balance', () => db.query(`select admin_wallet_adjust($1, 99999999, -1, 'oops')`, [A]), 'Enter an amount');
    await throws('cannot overdraw by deducting', () => db.query(`select admin_wallet_adjust($1, 900000, -1, 'too much')`, [A]), 'lower than');
    const b2 = (await q(`select admin_wallet_adjust($1, 1000, -1, 'Chargeback') b`, [A]))[0].b;
    ok('admin deduct lowers balance', b2 === before + 1500, String(b2));
    ok('wallet history shows reason to customer', (await q(`select 1 from wallet_txs where user_id=$1 and title like 'ChowBuy adjustment: Chargeback'`, [A])).length === 1);
    ok('admin actions are audited', (await q(`select count(*)::int n from audit_log where action='wallet_adjust'`))[0].n === 2);
    const list = (await q(`select admin_customers('ada@x.ng') r`))[0].r;
    ok('admin sees customer with balance, points and tier', list.total === 1 && list.rows[0].balance === b2 && list.rows[0].tier === 'Bronze' && list.stats.walletTotal >= b2, JSON.stringify(list));
    const pts = (await q(`select admin_points_adjust($1, 5000, 'Loyalty gift') p`, [A]))[0].p;
    const cur = (await q(`select points, lifetime_points from profiles where id=$1`, [A]))[0];
    ok('bonus points raise balance and lifetime tier progress', cur.points === pts && cur.lifetime_points >= 5000);
    ok('bonus past 5,000 lifetime moves to Silver', (await q(`select admin_customers('ada@x.ng') r`))[0].r.rows[0].tier === 'Silver', JSON.stringify((await q(`select admin_customers('ada@x.ng') r`))[0].r.rows));
    await throws('points cannot go below zero', () => db.query(`select admin_points_adjust($1, -99999, 'too many')`, [A]), 'below zero');
    const led = (await q(`select admin_customer_ledger($1) l`, [A]))[0].l;
    ok('ledger shows wallet and points history', led.wallet.length >= 2 && led.points.length >= 2);
  });
  await as(A, async () => {
    const n = (await q(`select redeem_points(1000) n`))[0].n;
    ok('redeem 1,000 points gives ₦1,000 (1 point = ₦1)', n === 1000);
    await throws('redeem needs steps of 100', () => db.query(`select redeem_points(550)`), 'steps of');
  });
  ok('redemption is in both ledgers', (await q(`select 1 from points_ledger where user_id=$1 and kind='redeem' and delta=-1000`, [A])).length === 1 && (await q(`select 1 from wallet_txs where user_id=$1 and title='Points redeemed'`, [A])).length === 1);
  // rider pay
  const e = (await q(`select model, fare, commission, net from rider_earnings where rider_id=$1`, [R]))[0];
  ok('partner earns fare minus tier commission per ride', e && e.model === 'partner' && e.net === e.fare - e.commission && e.commission === Math.round(e.fare * 0.15), JSON.stringify(e));
  await as(R, async () => { ok('partner can read own earnings', (await q(`select count(*)::int n from rider_earnings`))[0].n === 1); });
  await as(ADM, async () => {
    await db.query(`select admin_rider_set_pay($1, 'fleet', 120000, 'Standard')`, [R]);
    await throws('fleet needs a salary', () => db.query(`select admin_rider_set_pay($1, 'fleet', 0, null)`, [R]), 'salary');
    const sum = (await q(`select admin_rider_pay_summary(30) s`))[0].s.filter(x => x.id === R)[0];
    ok('summary: fleet rider has salary', sum.model === 'fleet' && sum.salary === 120000);
  });
  await db.exec(`insert into rider_earnings (order_id, rider_id, model) select id, '${R}', 'fleet' from orders where id <> '${o.id}' limit 1`);
  await as(R, async () => { ok('fleet earnings rows stay hidden from the rider (history of partner rows still visible)', (await q(`select count(*)::int n from rider_earnings where model='fleet'`))[0].n === 0 && (await q(`select count(*)::int n from rider_earnings`))[0].n === 1); });
  const cfg2 = (await as(null, () => q(`select get_public_config() c`)))[0].c;
  ok('public config carries the points programme', cfg2.loyalty.earnPer === 100 && cfg2.loyalty.tiers.length === 3);
}
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
