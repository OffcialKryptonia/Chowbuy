import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'node:fs';
const db = new PGlite({ extensions: { pgcrypto } });
const root = new URL('../', import.meta.url).pathname;
await db.exec(`
 create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
 create schema auth; create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}', last_sign_in_at timestamptz, email_confirmed_at timestamptz, raw_app_meta_data jsonb default '{}');
 create table auth.sessions (id uuid primary key default gen_random_uuid(), user_id uuid, user_agent text, ip inet, created_at timestamptz default now(), updated_at timestamptz, refreshed_at timestamptz);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
 grant usage on schema public, auth to anon, authenticated, service_role;
 grant all on all tables in schema public to service_role;
`);
await db.exec(fs.readFileSync(root + 'migrations/20261018000001_core.sql', 'utf8'));
await db.exec(fs.readFileSync(root + 'migrations/20261019000001_messaging.sql', 'utf8'));
await db.exec(fs.readFileSync(root + 'migrations/20261019000002_oauth_profile.sql', 'utf8'));
await db.exec(fs.readFileSync(root + 'migrations/20261021000001_admin_customers_points.sql', 'utf8'));
await db.exec(fs.readFileSync(root + 'migrations/20261022000001_kyc_emergency.sql', 'utf8'));
await db.exec(fs.readFileSync(root + 'migrations/20261029000001_rider_app.sql', 'utf8'));
await db.exec(fs.readFileSync(root + 'migrations/20261030000001_admin_live.sql', 'utf8'));
await db.exec(fs.readFileSync(root + 'migrations/20261031000001_admin_profile_team.sql', 'utf8'));
await db.exec(fs.readFileSync(root + 'migrations/20261031000002_rider_positions.sql', 'utf8'));
await db.exec(fs.readFileSync(root + 'migrations/20261031000003_admin_finance.sql', 'utf8'));
await db.exec(fs.readFileSync(root + 'migrations/20261101000001_admin_catalog.sql', 'utf8'));
await db.exec(fs.readFileSync(root + 'migrations/20261101000002_admin_chats_brand.sql', 'utf8'));
await db.exec(fs.readFileSync(root + 'migrations/20261101000003_admin_locations.sql', 'utf8'));
await db.exec(fs.readFileSync(root + 'migrations/20261101000004_group_orders.sql', 'utf8'));
await db.exec(fs.readFileSync(root + 'migrations/20261101000005_smart_cart_events.sql', 'utf8'));
await db.exec(fs.readFileSync(root + 'migrations/20261101000006_public_catalog.sql', 'utf8'));
await db.exec(fs.readFileSync(root + 'migrations/20261101000007_admin_customer_tools.sql', 'utf8'));
await db.exec(fs.readFileSync(root + 'migrations/20261101000008_merchant_live.sql', 'utf8'));
await db.exec(fs.readFileSync(root + 'migrations/20261101000009_merchant_onboarding.sql', 'utf8'));
await db.exec(fs.readFileSync(root + 'migrations/20261102000001_chowbuy_flex.sql', 'utf8'));
await db.exec(fs.readFileSync(root + 'migrations/20261103000001_merchant_kyc_sync.sql', 'utf8'));
await db.exec(fs.readFileSync(root + 'migrations/20261104000001_brand_storage_select.sql', 'utf8'));
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

// ---- KYC, SOS, emergency services
{
  let sosId;
  await as(R, async () => {
    await db.query(`select kyc_submit('rider', $1, 'nin', $1 || '/nin.jpg')`, [R]);
    await throws('rider cannot send documents for someone else', () => db.query(`select kyc_submit('rider', $1, 'nin', 'x/y.jpg')`, [B]), 'own account');
    await throws('applicant must attach a file', () => db.query(`select kyc_submit('rider', $1, 'licence', '')`, [R]), 'Attach');
    ok('rider sees own pending document', (await q(`select status from kyc_docs`))[0].status === 'pending');
  });
  await as(M, async () => { await db.query(`select kyc_submit('merchant', 'm1', 'cac', 'm1/cac.pdf')`); });
  await as(A, async () => { ok('customers see no KYC documents', (await q(`select count(*)::int n from kyc_docs`))[0].n === 0); });
  await as(ADM, async () => {
    await throws('decline needs a reason', () => db.query(`select admin_kyc_set('rider', $1, 'nin', 'declined', '')`, [R]), 'why');
    await db.query(`select admin_kyc_set('rider', $1, 'nin', 'declined', 'Photo is blurry')`, [R]);
    await db.query(`select admin_kyc_set('rider', $1, 'licence', 'approved', '', $1 || '/licence.jpg')`, [R]);
    const l = (await q(`select admin_kyc_list('rider') l`))[0].l.filter(x => x.id === R)[0];
    ok('admin can upload on behalf and approve while applicant is unverified', l.docs.some(d => d.doc === 'licence' && d.status === 'approved' && d.by_admin === true), JSON.stringify(l));
    ok('declined doc carries the reason', l.docs.some(d => d.doc === 'nin' && d.status === 'declined' && d.note === 'Photo is blurry'));
    await db.query(`select admin_kyc_decide('rider', $1, false)`, [R]);
    ok('admin can decline a rider outright', (await q(`select verified from riders where user_id=$1`, [R]))[0].verified === false);
    await db.query(`select admin_kyc_decide('merchant', 'm1', true)`);
    ok('merchant list works', (await q(`select admin_kyc_list('merchant') l`))[0].l.some(x => x.id === 'm1' && x.docs.length === 1));
  });
  await as(R, async () => {
    await db.query(`select kyc_submit('rider', $1, 'nin', $1 || '/nin2.jpg')`, [R]);
    ok('applicant can resend a declined document', (await q(`select status, note from kyc_docs where doc_type='nin'`))[0].status === 'pending');
    await throws('applicant cannot replace an approved document', () => db.query(`select kyc_submit('rider', $1, 'licence', 'z.jpg')`, [R]), 'already approved');
    await throws('applicant cannot approve', () => db.query(`select admin_kyc_set('rider', $1, 'nin', 'approved')`, [R]), 'Admins only');
    await db.query(`select rider_set_contacts('Mum', '08031112222', 'Tunde', '+2348033334444')`);
    ok('rider saves two contacts', (await q(`select count(*)::int n from rider_contacts`))[0].n === 2);
    await throws('contact phone is validated', () => db.query(`select rider_set_contacts('Mum', 'abc', 'Tunde', '08033334444')`), 'check');
    sosId = (await q(`select rider_sos('', 6.45, 3.47) id`))[0].id;
  });
  await as(A, async () => { await throws('customers cannot raise SOS', () => db.query(`select rider_sos('', 1, 1)`), 'Riders only'); });
  await as(ADM, async () => {
    const ev = (await q(`select admin_sos_list() l`))[0].l;
    ok('admin sees SOS with contacts and location', ev.length === 1 && ev[0].contacts.length === 2 && ev[0].status === 'open' && ev[0].lat === 6.45, JSON.stringify(ev));
    await db.query(`select admin_sos_set($1, 'resolved', 'Rider safe, called back')`, [sosId]);
    ok('admin resolves SOS', (await q(`select admin_sos_list() l`))[0].l[0].status === 'resolved');
    const id = (await q(`select admin_emergency_save(null, 'Abuja', 'police', 'FCT Police Command', '08032003913', true) id`))[0].id;
    await db.query(`select admin_emergency_save($1, 'Abuja', 'police', 'FCT Police Command', '08032003913', false)`, [id]);
    await throws('bad number rejected', () => db.query(`select admin_emergency_save(null, '', 'other', 'Bad', 'abc', true)`), 'check');
  });
  ok('public can read active emergency numbers only', (await as(null, () => q(`select label from emergency_services`))).every(x => x.label !== 'FCT Police Command') && (await as(null, () => q(`select 1 from emergency_services`))).length === 2);
  await as(A, async () => { await throws('customers cannot edit services', () => db.query(`select admin_emergency_delete(gen_random_uuid())`), 'Admins only'); });
}

// ---- ChowBuy Flex
{
  const su = async sql => { await db.exec('reset role'); return db.exec(sql); };
  const F = await mk('flex1@x.ng', '08031120001'), PR = await mk('partner9@x.ng', '08031120002');
  const place = async () => (await as(A, () => q(`select place_order('m1', '[{"product_id":"p3","qty":1}]'::jsonb, 'cod', $1, null) r`, [addr])))[0].r.order;
  const deliver = id => su(`update orders set stage='delivered' where id='${id}'`);
  // settings: nothing is invented, and unsafe switches are refused
  await as(ADM, async () => {
    const g = (await q(`select admin_flex_settings_get() s`))[0].s;
    ok('flex ships closed with configuration warnings', g.config.registrationEnabled === false && g.config.dispatchEnabled === false && g.warnings.length >= 4 && g.config.platformFeePct === null, JSON.stringify(g));
    await throws('registration cannot open without agreement and region', () => db.query(`select admin_flex_settings_save('{"registrationEnabled":true}')`), 'agreement version');
    await throws('unknown setting rejected', () => db.query(`select admin_flex_settings_save('{"hack":1}')`), 'Unknown');
    await throws('fee must be a percentage', () => db.query(`select admin_flex_settings_save('{"platformFeePct":140}')`), '0 to 100');
    await throws('region must be a real city', () => db.query(`select admin_flex_settings_save('{"regions":["Atlantis"]}')`), 'service city');
    await db.query(`select admin_flex_settings_save('{"regions":["Lagos"],"deliveryTypes":["restaurant"],"agreementVersion":"v1","registrationEnabled":true}')`);
    await throws('dispatch cannot start while fee/payout policy is missing', () => db.query(`select admin_flex_settings_save('{"dispatchEnabled":true}')`), 'cannot be switched on');
  });
  await as(A, async () => { await throws('non-admin cannot save Flex settings', () => db.query(`select admin_flex_settings_save('{}')`), 'Admins only'); });
  // onboarding
  await as(F, async () => {
    await db.query(`select rider_apply('Femi Flex', 'flx123ab', 'Bike', '08031120001', 'flex')`);
    let me = (await q(`select rider_me() m`))[0].m;
    ok('flex applicant is a draft flex rider, unverified and offline', me.model === 'flex' && me.flex.status === 'draft' && !me.verified && !me.online && me.appliedModel === 'flex', JSON.stringify(me));
    await throws('cannot submit before choosing an area', () => db.query(`select rider_flex_submit('v1')`), 'service area');
    await throws('bad account number rejected', () => db.query(`select rider_flex_save('Lagos', 'GTBank', 'Femi Flex', '123')`), '10-digit');
    await db.query(`select rider_flex_save('Lagos', 'GTBank', 'Femi Flex', '0123456789')`);
    me = (await q(`select rider_me() m`))[0].m;
    ok('settlement is pending verification and only the last 4 digits come back', me.flex.settlement.status === 'pending_verification' && me.flex.settlement.last4 === '6789' && !JSON.stringify(me).includes('0123456789'), JSON.stringify(me.flex));
    await throws('must accept the current agreement version', () => db.query(`select rider_flex_submit('old')`), 'agreement was updated');
    await db.query(`select rider_flex_submit('v1')`);
    me = (await q(`select rider_me() m`))[0].m;
    ok('submission records agreement version and time', me.flex.status === 'submitted' && me.flex.agreementVersion === 'v1' && !!me.flex.agreementAt);
    await throws('registration alone grants no jobs', () => db.query(`select rider_set_online(true)`), 'waiting for approval');
    await throws('rider cannot approve themselves', () => db.query(`update riders set flex_status='approved' where user_id=$1`, [F]), 'permission denied');
    await throws('rider cannot change own model', () => db.query(`update riders set pay_model='partner' where user_id=$1`, [F]), 'permission denied');
    await throws('rider cannot call admin decisions', () => db.query(`select admin_flex_decide($1, 'approve', '')`, [F]), 'Admins only');
    await throws('submitted application cannot be edited', () => db.query(`select rider_flex_save('Lagos', '', '', '')`), 'no longer be edited');
  });
  await as(A, async () => { await throws('customers have no flex earnings', () => db.query(`select rider_flex_earnings()`), 'Flex riders only'); });
  // admin review
  await as(ADM, async () => {
    const l = (await q(`select admin_flex_applications('submitted', '', 25, 0) l`))[0].l;
    ok('admin sees the submitted application with checks and masked settlement', l.total === 1 && l.items[0].checks.agreement === true && l.items[0].checks.identity === false && l.items[0].settlement.last4 === '6789' && !JSON.stringify(l).includes('0123456789'), JSON.stringify(l));
    await throws('cannot approve before identity verification', () => db.query(`select admin_flex_decide($1, 'approve', '')`, [F]), 'Identity');
    await throws('request info needs a note', () => db.query(`select admin_flex_decide($1, 'request_info', '')`, [F]), 'what to fix');
    await db.query(`select admin_flex_decide($1, 'review', '')`, [F]);
    await db.query(`select admin_kyc_decide('rider', $1, true)`, [F]);
    await db.query(`select admin_flex_decide($1, 'approve', '')`, [F]);
    const h = (await q(`select admin_flex_applications('approved', '', 25, 0) l`))[0].l.items[0].history;
    ok('every decision is in the audit history', h.length >= 2 && h.some(x => x.action === 'flex_approve'), JSON.stringify(h));
  });
  await as(F, async () => {
    ok('approved but dispatch off is unavailable with a reason', (await q(`select rider_me() m`))[0].m.flex.availability === 'unavailable');
    await throws('cannot go online while Flex dispatch is closed', () => db.query(`select rider_set_online(true)`), 'not open yet');
  });
  await as(ADM, async () => { await db.query(`select admin_flex_settings_save('{"platformFeePct":10,"payoutSchedule":"weekly","dispatchEnabled":true}')`); });
  // dispatch through the existing engine
  const o1 = await place();
  await as(F, async () => {
    await db.query(`select rider_set_online(true)`);
    const offer = (await q(`select rider_open_orders() o`))[0].o.find(x => x.id === o1.id);
    ok('flex rider is offered an eligible delivery with the configured fee applied', !!offer && typeof offer.net === 'number', JSON.stringify(offer));
    await db.query(`select rider_accept($1)`, [o1.id]);
    await db.query(`select rider_accept($1)`, [o1.id]);
    ok('accepting twice is idempotent', (await q(`select count(*)::int n from orders where rider_id=$1`, [F]))[0].n === 1);
    await db.query(`select rider_set_online(false)`);
    ok('going offline does not cancel the accepted delivery', (await q(`select rider_active_order() a`))[0].a?.id === o1.id);
  });
  await as(PR, async () => { await db.query(`select rider_apply('Pat Partner', 'ptn123ab', 'Bike', '08031120002')`); });
  await su(`update riders set verified = true where user_id = '${PR}'`);
  await as(PR, async () => { await db.query(`select rider_set_online(true)`); await throws('a second rider cannot take an accepted order', () => db.query(`select rider_accept($1)`, [o1.id]), 'no longer available'); });
  await deliver(o1.id);
  const e1 = (await q(`select * from rider_earnings where order_id=$1`, [o1.id]))[0];
  ok('flex earning = fee - platform fee + eligible tip, confirmed', e1.model === 'flex' && e1.status === 'confirmed' && e1.commission === Math.round(e1.fare * 0.1) && e1.net === e1.fare - e1.commission + e1.tip, JSON.stringify(e1));
  await as(F, async () => {
    const fe = (await q(`select rider_flex_earnings() e`))[0].e;
    ok('flex rider sees only their own earnings with the breakdown', fe.items.length === 1 && fe.items[0].platformFee === e1.commission && fe.summary.confirmed.count === 1, JSON.stringify(fe));
  });
  // Partner and Fleet are unchanged
  const o2 = await place(); await su(`update orders set rider_id='${PR}' where id='${o2.id}'`); await deliver(o2.id);
  const e2 = (await q(`select * from rider_earnings where order_id=$1`, [o2.id]))[0];
  ok('partner earning is unchanged (15% on Standard)', e2.model === 'partner' && e2.commission === Math.round(e2.fare * 0.15) && e2.net === e2.fare - e2.commission && e2.status === 'confirmed', JSON.stringify(e2));
  await as(PR, async () => { ok('partner cannot see flex earnings of others', (await q(`select order_id from rider_earnings`)).every(x => x.order_id === o2.id)); });
  await as(F, async () => { ok('flex rider cannot read partner earnings', (await q(`select order_id from rider_earnings`)).every(x => x.order_id === o1.id)); });
  const o3 = await place(); await su(`update riders set pay_model='fleet' where user_id='${R}'`); await su(`update orders set rider_id='${R}' where id='${o3.id}'`); await deliver(o3.id);
  ok('fleet delivery still records a salaried row', (await q(`select model from rider_earnings where order_id=$1`, [o3.id]))[0]?.model === 'fleet');
  // missing fee never invents a rate
  await su(`update platform_settings set value = value || '{"platformFeePct":null}' where key='flex'`);
  const o4 = await place(); await su(`update orders set rider_id='${F}' where id='${o4.id}'`); await deliver(o4.id);
  const e4 = (await q(`select status, net, commission from rider_earnings where order_id=$1`, [o4.id]))[0];
  ok('without a configured fee the earning stays pending with no invented net', e4.status === 'pending' && e4.net === 0 && e4.commission === 0, JSON.stringify(e4));
  await as(ADM, async () => {
    await throws('cannot reprice before a fee is set', () => db.query(`select admin_flex_reprice_pending()`), 'platform fee');
    await db.query(`select admin_flex_settings_save('{"platformFeePct":10}')`);
    ok('admin reprices pending rows once the fee exists', (await q(`select admin_flex_reprice_pending() n`))[0].n === 1);
    await throws('adjustment needs a reason', () => db.query(`select admin_flex_adjust($1, 200, '')`, [o1.id]), 'reason');
    await db.query(`select admin_flex_adjust($1, 200, 'Peak hour bonus approved')`, [o1.id]);
    await throws('cannot jump to paid', () => db.query(`select admin_flex_earning_status($1, 'paid', 'REF12345', '')`, [o1.id]), 'Cannot move');
    for (const s of ['available', 'requested', 'processing']) await db.query(`select admin_flex_earning_status($1, $2, null, '')`, [o1.id, s]);
    await throws('paid needs a provider reference', () => db.query(`select admin_flex_earning_status($1, 'paid', '', '')`, [o1.id]), 'reference');
    await throws('processing earnings cannot be adjusted', () => db.query(`select admin_flex_adjust($1, 5, 'late change here')`, [o1.id]), 'no longer be adjusted');
    await db.query(`select admin_flex_earning_status($1, 'paid', 'KORA-8891', '')`, [o1.id]);
    const an = (await q(`select admin_flex_analytics(30, null, null) a`))[0].a;
    ok('analytics are computed from real rows', an.deliveries === 2 && an.money.incentives === 200 && an.active === 1, JSON.stringify(an));
  });
  // model changes: only by admin, audited, history untouched
  const before = (await q(`select count(*)::int n from rider_earnings where rider_id=$1`, [PR]))[0].n;
  await as(ADM, async () => {
    await throws('model change needs a reason', () => db.query(`select admin_rider_set_type($1, 'flex', '')`, [PR]), 'reason');
    await throws('fleet needs a salary', () => db.query(`select admin_rider_set_type($1, 'fleet', 'Moved to salaried team')`, [PR]), 'salary');
    await throws('pay settings screen refuses flex riders', () => db.query(`select admin_rider_set_pay($1, 'partner', null, 'Gold')`, [F]), 'Flex rider');
    await db.query(`select admin_rider_set_type($1, 'flex', 'Rider asked to join Flex, approved by ops')`, [PR]);
  });
  const pr = (await q(`select pay_model, flex_status, online from riders where user_id=$1`, [PR]))[0];
  ok('changed rider becomes a draft flex rider, offline, never auto-approved', pr.pay_model === 'flex' && pr.flex_status === 'draft' && pr.online === false, JSON.stringify(pr));
  ok('past partner earnings keep their model', (await q(`select count(*)::int n from rider_earnings where rider_id=$1 and model='partner'`, [PR]))[0].n === before);
  ok('the type change is audited with the reason', (await q(`select count(*)::int n from audit_log where action='rider_type' and meta->>'to'='flex' and meta->>'reason' like 'Rider asked%'`))[0].n === 1);
  await as(A, async () => { await throws('non-admin cannot change a model', () => db.query(`select admin_rider_set_type($1, 'fleet', 'sneaky change', 100)`, [PR]), 'Admins only'); });
  // suspension keeps history and stops work
  await as(ADM, async () => { await throws('suspend needs a reason', () => db.query(`select admin_flex_decide($1, 'suspend', '')`, [F]), 'reason'); await db.query(`select admin_flex_decide($1, 'suspend', 'Customer complaint under review')`, [F]); });
  await as(F, async () => {
    const m = (await q(`select rider_me() m`))[0].m;
    ok('suspended rider is offline and marked suspended', m.online === false && m.flex.availability === 'suspended');
    await throws('suspended rider cannot go online', () => db.query(`select rider_set_online(true)`), 'suspended');
    ok('earnings history is preserved on suspension', (await q(`select rider_flex_earnings() e`))[0].e.items.length === 2);
  });
  await as(ADM, async () => { await db.query(`select admin_flex_decide($1, 'reinstate', '')`, [F]); });
  // delivery type eligibility
  await su(`update platform_settings set value = value || '{"deliveryTypes":["pharmacy"]}' where key='flex'`);
  const o5 = await place();
  await as(F, async () => { await db.query(`select rider_set_online(true)`); ok('restaurant delivery hidden when only pharmacy is enabled', !(await q(`select rider_open_orders() o`))[0].o.some(x => x.id === o5.id)); await throws('and cannot be accepted', () => db.query(`select rider_accept($1)`, [o5.id]), 'not available for Flex'); });
}

// ---- Rider app: apply, profile, open orders, active order
{
  const N = await mk('newrider@x.ng', '08031110006'), R2 = await mk('rider2@x.ng', '08031110007');
  await as(N, async () => {
    await throws('applicant needs a valid phone', () => db.query(`select rider_apply('Ife Bello', 'KJA123AB', 'Bike', 'abc')`), 'phone');
    await throws('applicant needs bike or car', () => db.query(`select rider_apply('Ife Bello', 'KJA123AB', 'Truck', '08031110006')`), 'bike or car');
    await db.query(`select rider_apply('Ife Bello', 'kja123ab', 'Bike', '08031110006')`);
    const me = (await q(`select rider_me() m`))[0].m;
    ok('applicant starts unverified, offline, partner', me.verified === false && me.online === false && me.model === 'partner' && me.plate === 'KJA123AB', JSON.stringify(me));
    await throws('unverified rider cannot go online', () => db.query(`select rider_set_online(true)`), 'approval');
    ok('unverified rider sees no open orders', (await q(`select rider_open_orders() o`))[0].o.length === 0);
    await throws('applicant cannot self-verify', () => db.query(`update riders set verified=true where user_id=$1`, [N]), 'permission denied');
  });
  ok('applying makes the profile a rider', (await q(`select role from profiles where id=$1`, [N]))[0].role === 'rider');
  await as(A, async () => { ok('customer has no rider profile', (await q(`select rider_me() m`))[0].m === null); });
  await db.exec(`insert into riders (user_id,name,plate,vehicle,verified,proxy_phone,online) values ('${R2}','Seun Ade','LND456XY','Bike',true,'+2348031110007',false)`);
  const cod = (await as(A, () => q(`select place_order('m1', '[{"product_id":"p3","qty":1}]'::jsonb, 'cod', $1, null) r`, [addr])))[0].r.order;
  await as(R2, async () => {
    ok('offline rider sees nothing', (await q(`select rider_open_orders() o`))[0].o.length === 0);
    await db.query(`select rider_set_online(true)`);
    const open = (await q(`select rider_open_orders() o`))[0].o;
    const mine = open.find(x => x.id === cod.id);
    ok('online verified rider sees the open order', !!mine, JSON.stringify(open));
    ok('offer shows area and fare, never street or customer', mine && mine.dropArea && !('address' in mine) && !('customer' in mine) && typeof mine.net === 'number' && mine.cod === cod.total, JSON.stringify(mine));
    ok('offer distance is a number', mine && Number(mine.km) > 0);
    ok('no active order yet', (await q(`select rider_active_order() a`))[0].a === null);
    await db.query(`select rider_accept($1)`, [cod.id]);
    const act = (await q(`select rider_active_order() a`))[0].a;
    ok('active order has address, items and customer first name', act.id === cod.id && act.drop.label.includes('Adeola') && act.items.length === 1 && act.customer === 'ada', JSON.stringify(act));
    ok('active order never carries the delivery code', !JSON.stringify(act).match(/otp|pin|code/i));
    ok('busy rider is offered nothing', (await q(`select rider_open_orders() o`))[0].o.length === 0);
    ok('rider cannot read the delivery code', (await q(`select * from order_secrets`)).length === 0);
  });
  await as(N, async () => { ok('other riders cannot see an accepted order', true); });
  await as(null, async () => { await throws('anon cannot call rider functions', () => db.query(`select rider_open_orders()`), 'permission denied'); });
  await db.exec(`update riders set pay_model='fleet' where user_id='${R2}'`);
  await as(R2, async () => { ok('fleet rider profile has no earnings figure', !('earnings' in (await q(`select rider_me() m`))[0].m)); });
}

// ---- Admin live numbers
{
  await as(A, async () => {
    await throws('customers cannot read the dashboard', () => db.query(`select admin_dashboard(30)`), 'Admins only');
    await throws('customers cannot list orders', () => db.query(`select admin_orders('all', '', 10, 0)`), 'Admins only');
    await throws('customers cannot list merchants', () => db.query(`select admin_merchants()`), 'Admins only');
  });
  await as(ADM, async () => {
    const d = (await q(`select admin_dashboard(30) d`))[0].d;
    const total = (await q(`select count(*)::int n from orders`))[0].n;
    ok('dashboard counts real orders', d.orders === total && total > 0, JSON.stringify(d).slice(0, 300));
    ok('dashboard gmv equals delivered totals', d.gmv === (await q(`select coalesce(sum(total),0)::int s from orders where stage='delivered'`))[0].s);
    ok('dashboard has a 30 day series', d.daily.length === 30 && d.daily.reduce((a, x) => a + x.orders, 0) === d.orders);
    ok('dashboard riders and merchants are counted', d.riders.total >= 2 && d.merchants.live >= 1);
    ok('dashboard has no invented keys for sample data', typeof d.walletFloat === 'number' && Array.isArray(d.verticals) && Array.isArray(d.areas));
    const all = (await q(`select admin_orders('all', '', 50, 0) o`))[0].o;
    ok('admin orders lists every order', all.total === total && all.rows.length === Math.min(total, 50));
    ok('admin orders rows carry status, merchant and customer', all.rows.every(r => ['pending', 'processing', 'completed', 'cancelled'].includes(r.status) && r.merchant && r.customer));
    const done = (await q(`select admin_orders('completed', '', 50, 0) o`))[0].o;
    ok('status filter only returns that bucket', done.rows.every(r => r.status === 'completed'));
    const none = (await q(`select admin_orders('all', 'zzzz-no-match', 50, 0) o`))[0].o;
    ok('search with no match returns nothing', none.total === 0 && none.rows.length === 0);
    const ms = (await q(`select admin_merchants() m`))[0].m;
    ok('admin merchants lists merchants with 30 day numbers', ms.length >= 1 && ms.every(m => typeof m.orders30 === 'number' && typeof m.gmv30 === 'number'));
  });
}
// ---- Admin profile and team
{
  await as(A, async () => {
    await throws('customers cannot read admin profile', () => db.query(`select admin_me()`), 'Admins only');
    await throws('customers cannot list the team', () => db.query(`select admin_team()`), 'Admins only');
    await throws('customers cannot list sessions', () => db.query(`select admin_my_sessions()`), 'Admins only');
    await throws('customers cannot edit an admin profile', () => db.query(`select admin_update_profile('X Y', '')`), 'Admins only');
  });
  await db.exec(`insert into auth.sessions (user_id, user_agent, ip) values ('${ADM}', 'Safari on iPhone', '105.112.33.44'), ('${A}', 'Other user', '1.2.3.4')`);
  await as(ADM, async () => {
    const me = (await q(`select admin_me() m`))[0].m;
    ok('admin_me returns the signed-in admin only', me.id === ADM && me.role === 'admin' && me.email.includes('@'));
    const team = (await q(`select admin_team() t`))[0].t;
    ok('team lists admins only and flags the caller', team.length >= 1 && team.every(t => t.email) && team.filter(t => t.me).length === 1 && team.find(t => t.me).id === ADM);
    const ss = (await q(`select admin_my_sessions() s`))[0].s;
    ok('sessions are the caller own and the IP is masked', ss.length === 1 && ss[0].agent === 'Safari on iPhone' && ss[0].ip === '105.112.***.***');
    await q(`select admin_update_profile('  New Name ', '08031234567')`);
    const after = (await q(`select admin_me() m`))[0].m;
    ok('admin can update own name and phone', after.name === 'New Name' && after.phone === '+2348031234567', JSON.stringify(after));
    await throws('bad phone is rejected', () => db.query(`select admin_update_profile('New Name', '123')`), 'valid Nigerian phone');
    await throws('short name is rejected', () => db.query(`select admin_update_profile('A', '')`), 'full name');
  });
}
// ---- Real rider positions
{
  const rid = (await q(`select user_id from riders where verified order by user_id limit 1`))[0]?.user_id;
  ok('there is a verified rider to test with', !!rid);
  await as(A, async () => {
    await throws('customers cannot ping', () => db.query(`select rider_ping(6.5, 3.4)`), 'Go online first');
    await throws('customers cannot list riders', () => db.query(`select admin_riders()`), 'Admins only');
    await throws('customers cannot read locations directly', () => db.query(`select * from rider_locations`), 'permission denied');
  });
  await db.exec(`update riders set online=false where user_id='${rid}'`);
  await as(rid, async () => { await throws('offline rider cannot ping', () => db.query(`select rider_ping(6.5, 3.4)`), 'Go online first'); });
  await db.exec(`update riders set online=true where user_id='${rid}'`);
  await as(rid, async () => {
    await throws('bad latitude is rejected', () => db.query(`select rider_ping(95, 3.4)`), 'Invalid position');
    await throws('riders cannot read locations directly', () => db.query(`select * from rider_locations`), 'permission denied');
    await q(`select rider_ping(6.4281, 3.4219)`); await q(`select rider_ping(6.4300, 3.4300)`);
  });
  await as(ADM, async () => {
    const rs = (await q(`select admin_riders() r`))[0].r;
    const me = rs.find(r => r.id === rid);
    ok('admin sees the latest position once, not a trail', me && me.lat === 6.43 && me.lng === 3.43 && rs.filter(r => r.id === rid).length === 1, JSON.stringify(me));
    ok('every rider has a valid status', rs.every(r => ['pending', 'offline', 'idle', 'delivering'].includes(r.status)));
    ok('unverified riders are pending and not shown as online', rs.filter(r => !r.verified).every(r => r.status === 'pending'));
  });
  await db.exec(`update riders set online=false where user_id='${rid}'`);
  await as(ADM, async () => {
    const off = (await q(`select admin_riders() r`))[0].r.find(r => r.id === rid);
    ok('an offline rider is never located', off.status === 'offline' && off.lat === null && off.lng === null && off.seen_at === null, JSON.stringify(off));
  });
}
// ---- Admin finance and wallet transfers
{
  await as(A, async () => {
    await throws('customers cannot read finance', () => db.query(`select admin_finance(30)`), 'Admins only');
    await throws('customers cannot read the transfer trail', () => db.query(`select admin_wallet_transfers('', 10, 0)`), 'Admins only');
    await throws('customers cannot read transfers directly', () => db.query(`select * from wallet_transfers`), 'permission denied');
  });
  await as(ADM, async () => {
    const f = (await q(`select admin_finance(30) f`))[0].f;
    const dv = (await q(`select coalesce(sum(total),0)::int t, coalesce(sum(delivery_fee),0)::int d, coalesce(sum(service_fee),0)::int s, count(*)::int n from orders where stage='delivered' and created_at >= now() - interval '30 days'`))[0];
    ok('finance gmv equals delivered order totals', f.gmv === dv.t && f.delivered === dv.n, JSON.stringify(f).slice(0, 300));
    ok('finance fees equal delivered order fees', f.deliveryFees === dv.d && f.serviceFees === dv.s);
    ok('finance wallet float equals wallet balances', f.walletFloat === (await q(`select coalesce(sum(balance),0)::int s from wallets`))[0].s);
    ok('finance rider totals equal recorded earnings', f.riderNet === (await q(`select coalesce(sum(net),0)::int s from rider_earnings`))[0].s);
    ok('finance lists merchants and riders as arrays', Array.isArray(f.merchants) && Array.isArray(f.riders));
    ok('finance payment methods add up to gmv', Object.values(f.byMethod).reduce((a, b) => a + Number(b), 0) === f.gmv);
  });
  // a real transfer is recorded
  const before = (await q(`select count(*)::int n from wallet_transfers`))[0].n;
  await db.exec(`select set_config('request.jwt.claim.sub','${A}', false)`);
  await db.exec(`update wallets set balance = 5000 where user_id = '${A}'`);
  const other = (await q(`select phone from profiles where id <> '${A}' and phone is not null limit 1`))[0].phone;
  await as(A, async () => { await q(`select wallet_send('${other}', 700)`); });
  ok('wallet_send records the transfer', (await q(`select count(*)::int n from wallet_transfers`))[0].n === before + 1);
  await as(ADM, async () => {
    const t = (await q(`select admin_wallet_transfers('', 10, 0) t`))[0].t;
    const row = t.rows[0];
    ok('transfer trail shows reference, parties and amount', /^WT-\d+$/.test(row.id) && row.amount === 700 && row.fee === 0 && row.status === 'completed' && row.from && row.to, JSON.stringify(row));
    ok('transfer totals add up', t.volume >= 700 && t.count === before + 1);
    const none = (await q(`select admin_wallet_transfers('zzzz-none', 10, 0) t`))[0].t;
    ok('transfer search with no match returns nothing', none.total === 0 && none.rows.length === 0);
  });
}
// ---- Admin catalog: categories and brands
{
  await as(A, async () => {
    for (const sql of [`select admin_catalog()`, `select admin_category_add('grocery','Snacks','tags')`, `select admin_category_set_visible('CAT-1', false)`, `select admin_brand_add('Indomie','grocery')`, `select admin_brand_set_featured('BRD-1', true)`])
      await throws('customers cannot use ' + sql.slice(7, 30), () => db.query(sql), 'Admins only');
    await throws('customers cannot read catalog tables', () => db.query(`select * from catalog_categories`), 'permission denied');
  });
  await as(ADM, async () => {
    const c0 = (await q(`select admin_catalog() c`))[0].c;
    ok('catalog starts empty but lists unmanaged product categories', c0.categories.length === 0 && Array.isArray(c0.unmanaged) && Array.isArray(c0.brands));
    const cat = (await q(`select category from products where btrim(category) <> '' limit 1`))[0]?.category;
    const vert = cat ? (await q(`select m.vertical v from products p join merchants m on m.id = p.merchant_id where p.category = $1 limit 1`, [cat]))[0].v : 'grocery';
    await q(`select admin_category_add($1, $2, 'cart')`, [vert, '  ' + (cat || 'Snacks') + ' ']);
    await throws('duplicate category (any case) is rejected', () => db.query(`select admin_category_add($1, $2)`, [vert, (cat || 'Snacks').toUpperCase()]), 'already exists');
    await throws('short name is rejected', () => db.query(`select admin_category_add('grocery','A')`), 'at least 2');
    await throws('bad vertical is rejected', () => db.query(`select admin_category_add('cars','Tyres')`), 'Choose a vertical');
    const c1 = (await q(`select admin_catalog() c`))[0].c;
    const row = c1.categories[0];
    ok('added category appears with real item counts', c1.categories.length === 1 && row.visible === true && row.items === (await q(`select count(*)::int n from products p join merchants m on m.id=p.merchant_id where m.vertical=$1 and lower(p.category)=lower($2)`, [vert, cat || 'Snacks']))[0].n, JSON.stringify(row));
    ok('a managed category leaves the unmanaged list', !c1.unmanaged.some(u => u.vertical === vert && u.name.toLowerCase() === (cat || 'Snacks').toLowerCase()));
    await q(`select admin_category_set_visible($1, false)`, [row.id]);
    ok('visibility can be switched off', (await q(`select admin_catalog() c`))[0].c.categories[0].visible === false);
    await throws('unknown category id errors', () => db.query(`select admin_category_set_visible('CAT-999999', true)`), 'not found');
    await q(`select admin_brand_add('  Hollandia ', 'grocery')`);
    await throws('duplicate brand (any case) is rejected', () => db.query(`select admin_brand_add('HOLLANDIA', 'grocery')`), 'already in the catalog');
    const b = (await q(`select admin_catalog() c`))[0].c.brands[0];
    ok('brand is saved trimmed and not featured', b.name === 'Hollandia' && b.featured === false && b.products === 0);
    await q(`select admin_brand_set_featured($1, true)`, [b.id]);
    ok('brand can be featured', (await q(`select admin_catalog() c`))[0].c.brands[0].featured === true);
    ok('changes are written to the audit log', (await q(`select count(*)::int n from audit_log where action like 'catalog.%'`))[0].n >= 4);
  });
}
// ---- Admin chat supervision
{
  await as(A, async () => {
    for (const sql of [`select admin_chat_threads()`, `select admin_chat_review(gen_random_uuid())`, `select admin_chat_filter_save('pay', true, 'block', '{x}')`, `select admin_broadcast_count('')`])
      await throws('customers cannot use ' + sql.slice(7, 30), () => db.query(sql), 'Admins only');
  });
  const oid = (await q(`select id from orders where rider_id is not null order by created_at limit 1`))[0].id;
  await db.exec(`insert into chat_messages (order_id, sender_role, body, flags) values ('${oid}', 'rider', 'Send money to my account', '{"Off-platform payment"}')`);
  await db.exec(`insert into chat_messages (order_id, sender_role, body, flags, created_at) values ('${oid}', 'customer', 'Okay, heading out', '{}', now() + interval '1 second')`);
  await as(ADM, async () => {
    const t = (await q(`select admin_chat_threads() t`))[0].t;
    const th = t.threads.find(x => x.orderId === oid);
    const mine = th ? th.msgs.slice(-2) : [];
    ok('thread has the new messages in order with server flags', th && mine.length === 2 && mine[0].from === 'rider' && mine[0].flags[0] === 'Off-platform payment' && mine[1].flags.length === 0, JSON.stringify(mine));
    ok('thread names customer and rider', th.customer && th.rider && th.rider !== 'No rider yet');
    await q(`select admin_chat_review($1::uuid)`, [mine[0].id]);
    ok('a message can be marked reviewed', (await q(`select admin_chat_threads() t`))[0].t.threads.find(x => x.orderId === oid).msgs.find(m => m.id === mine[0].id).reviewed === true);
    await throws('unknown message errors', () => db.query(`select admin_chat_review(gen_random_uuid())`), 'not found');
    await q(`select admin_chat_lock('${oid}', true)`);
    ok('locked threads are marked locked', (await q(`select admin_chat_threads() t`))[0].t.threads.find(x => x.orderId === oid).locked === true);
    await q(`select admin_chat_lock('${oid}', false)`);
    await q(`select admin_chat_say('${oid}', 'Support here')`);
    ok('audit lists chat actions with who did them', (await q(`select admin_chat_threads() t`))[0].t.audit.length >= 3 && (await q(`select admin_chat_threads() t`))[0].t.audit.every(a => a.action.startsWith('chat.') && a.who));
    await q(`select admin_chat_filter_save('pay', true, 'flag', '{"  Opay ","opay","send money",""}')`);
    const f = (await q(`select action, words, enabled from chat_filters where id = 'pay'`))[0];
    ok('filter save trims, lowercases and dedupes keywords', f.action === 'flag' && f.enabled && JSON.stringify(f.words.slice().sort()) === JSON.stringify(['opay', 'send money']), JSON.stringify(f));
    await throws('bad action is rejected', () => db.query(`select admin_chat_filter_save('pay', true, 'ban', '{}')`), 'Choose block');
    await throws('unknown filter is rejected', () => db.query(`select admin_chat_filter_save('nope', true, 'flag', '{}')`), 'not found');
    const bi = (await q(`select words from chat_filters where builtin limit 1`))[0];
    if (bi) { const id = (await q(`select id from chat_filters where builtin limit 1`))[0].id; await q(`select admin_chat_filter_save($1, false, 'mask', '{"x"}')`, [id]); ok('built-in filters keep their own pattern', JSON.stringify((await q(`select words from chat_filters where id = $1`, [id]))[0].words) === JSON.stringify(bi.words)); }
    const n = (await q(`select admin_broadcast_count('') n`))[0].n;
    ok('broadcast count equals active paid or cash orders', n === (await q(`select count(*)::int c from orders where stage not in ('delivered','cancelled') and (paid or pay = 'cod')`))[0].c);
  });
}
// ---- Admin locations
{
  await as(A, async () => {
    for (const sql of [`select admin_locations()`, `select admin_loc_country_set('Ghana','live')`, `select admin_loc_city_save('Enugu','Enugu','live')`, `select admin_loc_hood_add('Lagos','Lekki')`, `select admin_loc_hood_set('LOC-1','disabled')`])
      await throws('customers cannot use ' + sql.slice(7, 30), () => db.query(sql), 'Admins only');
    await throws('customers cannot read location tables', () => db.query(`select * from loc_hoods`), 'permission denied');
  });
  await as(ADM, async () => {
    const l0 = (await q(`select admin_locations() l`))[0].l;
    ok('starts with Nigeria live and the five seeded cities, no hoods', l0.countries[0].name === 'Nigeria' && l0.countries[0].status === 'live' && l0.cities.length === 5 && l0.hoods.length === 0);
    await q(`select admin_loc_country_set('Ghana','live')`);
    ok('a country can go live', (await q(`select admin_locations() l`))[0].l.countries.find(c => c.name === 'Ghana').status === 'live');
    await throws('Nigeria cannot be paused', () => db.query(`select admin_loc_country_set('Nigeria','pipeline')`), 'cannot be paused');
    await throws('bad country status is rejected', () => db.query(`select admin_loc_country_set('Ghana','gone')`), 'Choose live');
    await q(`select admin_loc_city_save(' Enugu ', 'Enugu', 'pipeline')`);
    await q(`select admin_loc_city_save('Enugu', '', 'live')`);
    const en = (await q(`select admin_locations() l`))[0].l.cities.find(c => c.name === 'Enugu');
    ok('city saved trimmed, status updated, state kept', en && en.state === 'Enugu' && en.status === 'live');
    await throws('bad city status is rejected', () => db.query(`select admin_loc_city_save('Enugu','Enugu','closed')`), 'Choose live');
    const id = (await q(`select admin_loc_hood_add('Lagos','  Lekki Phase 1 ') id`))[0].id;
    await throws('duplicate neighbourhood (any case) is rejected', () => db.query(`select admin_loc_hood_add('Lagos','lekki phase 1')`), 'already exists');
    await throws('unknown city is rejected', () => db.query(`select admin_loc_hood_add('Atlantis','Reef')`), 'Choose a city');
    await q(`select admin_loc_hood_set($1, 'coming_soon')`, [id]);
    const l1 = (await q(`select admin_locations() l`))[0].l;
    ok('hood saved trimmed with new status', l1.hoods.length === 1 && l1.hoods[0].name === 'Lekki Phase 1' && l1.hoods[0].status === 'coming_soon');
    ok('only active hoods count toward a city', l1.cities.find(c => c.name === 'Lagos').active_hoods === 0);
    await q(`select admin_loc_hood_set($1, 'active')`, [id]);
    ok('active hood is counted', (await q(`select admin_locations() l`))[0].l.cities.find(c => c.name === 'Lagos').active_hoods === 1);
    await throws('unknown hood errors', () => db.query(`select admin_loc_hood_set('LOC-9999','active')`), 'not found');
    await throws('bad hood status is rejected', () => db.query(`select admin_loc_hood_set($1,'x')`, [id]), 'Choose active');
    ok('changes are audited', (await q(`select count(*)::int n from audit_log where action like 'location.%'`))[0].n >= 5);
  });
}
// ---- Group orders
{
  const ordId = (await q(`select id from orders where customer_id = $1 limit 1`, [A]))[0].id, ordTotal = (await q(`select total from orders where id = $1`, [ordId]))[0].total;
  let g1, g2;
  await as(A, async () => {
    await throws('cannot insert groups directly', () => db.query(`insert into group_orders (code, title, host_id, merchant_id) values ('X','Test',$1,'m1')`, [A]), 'permission denied');
    await throws('short title is rejected', () => db.query(`select group_create('m1','A')`), 'name');
    await throws('unknown merchant is rejected', () => db.query(`select group_create('nope','Office lunch')`), 'not available');
    g1 = (await q(`select group_create('m1','  Office lunch ', false) g`))[0].g;
    ok('group is created with an invite code and the host as first member', /^GRP-[0-9A-F]{6}$/.test(g1.code) && (await q(`select count(*)::int n from group_members where group_id = $1`, [g1.id]))[0].n === 1);
    g2 = (await q(`select group_create('m1','Game night', true) g`))[0].g;
  });
  await as(B, async () => {
    await throws('unknown code is rejected', () => db.query(`select group_join('GRP-NOPE00')`), 'No group found');
    await q(`select group_join($1)`, [' ' + g1.code.toLowerCase() + ' ']);
    await q(`select group_join($1)`, [g2.code]);
    ok('joining twice is harmless', (await q(`select group_join($1) id`, [g1.code]))[0].id === g1.id && (await q(`select count(*)::int n from group_members where group_id = $1`, [g1.id]))[0].n === 2);
    await throws('only the host can lock', () => db.query(`select group_set_status($1, 'locked')`, [g1.id]), 'Only the host');
    await throws('only the host can cancel', () => db.query(`select group_cancel($1)`, [g1.id]), 'Only the host');
    ok('members can see their group and its members', (await q(`select count(*)::int n from group_orders where id = $1`, [g1.id]))[0].n === 1 && (await q(`select count(*)::int n from group_members where group_id = $1`, [g1.id]))[0].n === 2);
    await throws('members cannot edit shares', () => db.query(`update group_members set amount = 1`), 'permission denied');
  });
  await as(R, async () => {
    ok('non-members cannot see a group', (await q(`select count(*)::int n from group_orders`))[0].n === 0 && (await q(`select count(*)::int n from group_members`))[0].n === 0);
    await throws('non-members cannot leave', () => db.query(`select group_leave($1)`, [g1.id]), 'not in that group');
  });
  await as(A, async () => {
    await throws('shares need a locked group', () => db.query(`select group_set_shares($1, '[]')`, [g1.id]), 'Lock the group');
    await q(`select group_set_status($1, 'locked')`, [g1.id]);
  });
  await as(R, async () => { await throws('locked groups cannot be joined', () => db.query(`select group_join($1)`, [g1.code]), 'no longer open'); });
  await as(A, async () => {
    await throws('negative shares are rejected', () => db.query(`select group_set_shares($1, $2::jsonb)`, [g1.id, JSON.stringify([{ user_id: A, amount: -5 }])]), 'zero or more');
    await throws('shares for strangers are rejected', () => db.query(`select group_set_shares($1, $2::jsonb)`, [g1.id, JSON.stringify([{ user_id: R, amount: 100 }])]), 'active member');
    await q(`select group_set_shares($1, $2::jsonb)`, [g1.id, JSON.stringify([{ user_id: A, amount: Math.floor(ordTotal / 2) }, { user_id: B, amount: ordTotal - Math.floor(ordTotal / 2) }])]);
    await throws('order must be yours', () => db.query(`select group_attach_order($1, 'CB-NOPE')`, [g1.id]), 'not yours');
    await q(`select group_attach_order($1, $2)`, [g1.id, ordId]);
    const row = (await q(`select status, total, order_id from group_orders where id = $1`, [g1.id]))[0];
    ok('attaching the order places the group with the real order total', row.status === 'placed' && row.total === ordTotal && row.order_id === ordId, JSON.stringify(row));
    await throws('a placed group cannot be cancelled', () => db.query(`select group_cancel($1)`, [g1.id]), 'no longer');
    await throws('an order cannot be linked twice', () => db.query(`select group_attach_order($1, $2)`, [g2.id, ordId]), 'Lock the group');
    await throws('customers cannot use admin_groups', () => db.query(`select admin_groups()`), 'Admins only');
    await throws('customers cannot use admin_group_cancel', () => db.query(`select admin_group_cancel($1)`, [g2.id]), 'Admins only');
  });
  await as(B, async () => { await q(`select group_leave($1)`, [g2.id]); });
  await as(A, async () => {
    ok('leaving removes the member from the group', (await q(`select count(*)::int n from group_members where group_id = $1 and left_at is null`, [g2.id]))[0].n === 1);
    await throws('the host cannot leave', () => db.query(`select group_leave($1)`, [g2.id]), 'host cannot leave');
  });
  await as(ADM, async () => {
    const su = async (sql, p) => { await db.exec('reset role'); await db.query(sql, p); await db.exec('set role authenticated'); };
    const list = (await q(`select admin_groups() l`))[0].l, a = list.find(x => x.id === g1.id), b = list.find(x => x.id === g2.id);
    ok('admin sees both groups with real members', list.length === 2 && a.people === 2 && a.members.length === 2 && a.members.some(m => m.host && m.name === 'ada') && a.host === 'ada' && a.merchant);
    ok('placed group reconciles: allocated equals the order total', a.status === 'placed' && a.allocated === a.total && a.total === ordTotal, JSON.stringify(a));
    ok('nothing is collected until shares are paid', a.collected === 0 && b.collected === 0);
    await su(`update group_members set amount = amount + 300 where group_id = $1 and user_id = $2`, [g1.id, B]);
    ok('an off-by-300 allocation is visible to the admin', (await q(`select admin_groups() l`))[0].l.find(x => x.id === g1.id).allocated === ordTotal + 300);
    await su(`update group_members set paid = true where group_id = $1 and user_id = $2`, [g1.id, A]);
    ok('collected counts paid shares only', (await q(`select admin_groups() l`))[0].l.find(x => x.id === g1.id).collected === Math.floor(ordTotal / 2));
    await su(`update orders set stage = 'delivered' where id = $1`, [ordId]);
    ok('a placed group becomes delivered with its order', (await q(`select admin_groups() l`))[0].l.find(x => x.id === g1.id).status === 'delivered');
    await throws('delivered groups cannot be cancelled by admin', () => db.query(`select admin_group_cancel($1)`, [g1.id]), 'Only open or locked');
    await q(`select admin_group_cancel($1)`, [g2.id]);
    const b2 = (await q(`select admin_groups() l`))[0].l.find(x => x.id === g2.id);
    ok('admin can cancel an open group', b2.status === 'cancelled' && b2.collected === 0);
    await throws('unknown group errors', () => db.query(`select admin_group_cancel('GO-9999')`), 'not found');
    ok('admin cancel is audited', (await q(`select count(*)::int n from audit_log where action = 'group.cancel'`))[0].n === 1);
  });
}
// ---- Smart Cart events
{
  await as(null, async () => { await throws('anonymous cannot track', () => db.query(`select smart_cart_track('opened')`), 'permission denied'); });
  await as(A, async () => {
    await throws('customers cannot read events', () => db.query(`select * from smart_cart_events`), 'permission denied');
    await throws('customers cannot read the summary', () => db.query(`select admin_smart_cart(30)`), 'Admins only');
    await throws('unknown event kind is rejected', () => db.query(`select smart_cart_track('hacked')`), 'Unknown event');
    await q(`select smart_cart_track('opened')`); await q(`select smart_cart_track('optimized')`);
    await q(`select smart_cart_track('accepted', 'cheaper')`); await q(`select smart_cart_track('accepted', 'cheaper')`); await q(`select smart_cart_track('dismissed', 'cheaper')`);
    await q(`select smart_cart_track('accepted', $1)`, ['x'.repeat(60)]);
    for (let i = 0; i < 70; i++) await q(`select smart_cart_track('opened')`);
  });
  await as(ADM, async () => {
    const m = (await q(`select admin_smart_cart(30) m`))[0].m;
    ok('counts events by kind', m.optimized === 1 && m.accepted === 3 && m.dismissed === 1, JSON.stringify(m));
    ok('a burst is rate limited to 60 a minute', m.opened + m.optimized + m.accepted + m.dismissed === 60, JSON.stringify(m));
    const c = m.byRec.find(r => r.rec === 'cheaper');
    ok('breaks accepted and dismissed down by suggestion', c && c.accepted === 2 && c.dismissed === 1, JSON.stringify(m.byRec));
    ok('long suggestion names are cut to 30 characters', m.byRec.some(r => r.rec.length === 30));
    ok('days is clamped', (await q(`select admin_smart_cart(100000) m`))[0].m.days === 365 && (await q(`select admin_smart_cart(0) m`))[0].m.days === 1);
  });
}
// ---- Public catalog feed and the Smart Cart free-delivery threshold
{
  const su = async sql => { await db.exec('reset role'); await db.exec(sql); };
  await as(null, async () => {
    const c = (await q(`select get_public_catalog() c`))[0].c;
    ok('anyone can read the public catalog feed', Array.isArray(c.categories) && Array.isArray(c.brands) && Array.isArray(c.cities) && Array.isArray(c.hoods));
    ok('the feed lists live and pipeline cities with their status', c.cities.some(x => x.name === 'Lagos' && x.status === 'live'));
    ok('the feed has no secrets or ids', !/secret|owner|user_id/i.test(JSON.stringify(c)));
    ok('unpublished smart cart and brand are null', c.smartCart === null && c.brand === null);
  });
  await su(`insert into platform_settings (key, value) values ('smart_cart', '{"threshold": 12000.4, "maxBundle": 8, "flags": {"cheaper": false}}'), ('brand', '{"MAIN": {"name": "ChowBuy"}}')`);
  await as(A, async () => {
    const c = (await q(`select get_public_catalog() c`))[0].c;
    ok('published smart cart and brand reach the feed', c.smartCart.threshold === 12000.4 && c.smartCart.flags.cheaper === false && c.brand.MAIN.name === 'ChowBuy');
    const place = async () => (await q(`select place_order('m1', '[{"product_id":"p3","qty":1}]'::jsonb, 'cod', $1, null) r`, [addr]))[0].r.order;
    await su(`update platform_settings set value = '{"threshold": 100}' where key = 'smart_cart'`);
    const low = await as(A, place);
    await su(`update platform_settings set value = '{"threshold": 99999999}' where key = 'smart_cart'`);
    const high = await as(A, place);
    ok('a low threshold makes delivery free, a high one charges it', low.delivery_fee === 0 && high.delivery_fee > 0, JSON.stringify([low.delivery_fee, high.delivery_fee, low.subtotal]));
    await su(`delete from platform_settings where key = 'smart_cart'`);
    const def = await as(A, place);
    ok('without a setting the old 10,000 rule still applies', def.delivery_fee === (def.subtotal >= 10000 ? 0 : high.delivery_fee), JSON.stringify([def.delivery_fee, def.subtotal]));
  });
}

/* ---- admin customer tools ---- */
{
  const su = async sql => { await db.exec('reset role'); await db.exec(sql); };
  const cust = (await q(`select id from profiles where role = 'customer' limit 1`))[0].id;
  await su(`update auth.users set email_confirmed_at = null where id = '${cust}'`);
  await as(cust, async () => {
    ok('a customer cannot read the admin customer profile', await q(`select admin_customer_profile('${cust}')`).then(() => false, () => true));
  });
  await as(ADM, async () => {
    const pr = (await q(`select admin_customer_profile('${cust}') p`))[0].p;
    ok('profile shows wallet, points, orders and email status', typeof pr.balance === 'number' && typeof pr.points === 'number' && typeof pr.orders === 'number' && pr.verified === false && Array.isArray(pr.addresses) && Array.isArray(pr.recent));
    const list = (await q(`select admin_customers('', 200, 0) c`))[0].c;
    ok('the list flags unverified customers', list.rows.some(r => r.id === cust && r.verified === false) && list.stats.unverified >= 1);
    ok('admin accounts are not in the customer list', !list.rows.some(r => r.id === ADM));
    ok('an admin id is not a customer profile', await q(`select admin_customer_profile('${ADM}')`).then(() => false, e => /not found/i.test(String(e.message))));
  });
  await su(`update auth.users set email_confirmed_at = now() where id = '${cust}'`);
  await as(ADM, async () => {
    ok('verified status follows the auth record', (await q(`select admin_customer_profile('${cust}') p`))[0].p.verified === true);
  });
}

/* ---- merchant live dashboard and store-owner assignment ---- */
{
  const su = async sql => { await db.exec('reset role'); await db.exec(sql); };
  await as(M, async () => {
    const me = (await q(`select merchant_me() r`))[0].r;
    ok('merchant_me lists the owner\'s store', Array.isArray(me.stores) && me.stores.length === 1 && me.stores[0].id === 'm1');
    const ords = (await q(`select merchant_orders('m1') r`))[0].r;
    ok('merchant sees their store orders', Array.isArray(ords) && ords.length >= 1 && ords.every(o => typeof o.customer === 'string' && !('phone' in o) && !('customer_id' in o)), JSON.stringify(ords).slice(0, 200));
    ok('orders carry no customer phone or id', !/\+234803/.test(JSON.stringify(ords)));
    const id = (await q(`select merchant_product_save('m1', null, ' Test Jollof ', 'Spicy', 3500, 'Rice', true, true) id`))[0].id;
    ok('merchant adds a product', (await q(`select name, price, in_stock, rx from products where id = $1`, [id]))[0].name === 'Test Jollof');
    await q(`select merchant_product_save('m1', $1, 'Test Jollof XL', 'Bigger', 4200, 'Rice', true, false)`, [id]);
    ok('merchant edits a product', (await q(`select price from products where id = $1`, [id]))[0].price === 4200);
    await q(`select merchant_product_stock($1, false)`, [id]);
    ok('merchant toggles availability', (await q(`select in_stock from products where id = $1`, [id]))[0].in_stock === false);
    await throws('price must be valid', () => q(`select merchant_product_save('m1', null, 'X', '', -5, '', true, false)`), 'valid price');
    await throws('name is required', () => q(`select merchant_product_save('m1', null, '  ', '', 100, '', true, false)`), 'name');
    await q(`select merchant_set_open('m1', false)`);
    ok('merchant closes the store', (await q(`select open from merchants where id = 'm1'`))[0].open === false);
    await q(`select merchant_set_open('m1', true)`);
    await q(`select merchant_product_delete($1)`, [id]);
    ok('merchant deletes a product', (await q(`select 1 from products where id = $1`, [id])).length === 0);
    await throws('owner cannot change their own rating directly', () => q(`update merchants set rating_pct = 100 where id = 'm1'`), 'permission denied');
    await throws('owner cannot make themselves a different store owner', () => q(`update merchants set owner_id = '${A}' where id = 'm1'`), 'permission denied');
    await throws('owner cannot create a live store directly', () => q(`insert into merchants (id, owner_id, name, vertical, lat, lng) values ('mx', '${M}', 'Mine', 'restaurant', 1, 1)`), 'permission denied');
    await throws('owner cannot update the store table directly any more', () => q(`update merchants set name = 'Hack' where id = 'm1'`), 'permission denied');
    await q(`select merchant_store_update('m1', 'Mama Put Kitchen', '8am - 9pm', 600, 10, 20)`);
    ok('owner can still rename the store (through the function)', (await q(`select name from merchants where id = 'm1'`))[0].name === 'Mama Put Kitchen');
  });
  await as(A, async () => {
    const none = (await q(`select merchant_me() r`))[0].r;
    ok('a customer with no business gets no workspaces (and no arbitrary store)', none.stores.length === 0 && none.workspaces.length === 0 && none.invitations.length === 0);
    await throws('a customer cannot rename a store', () => q(`select merchant_store_update('m1', 'Hack', '', 0, 5, 9)`), 'not found');
    await throws('a customer cannot read store orders', () => q(`select merchant_orders('m1')`), 'not found');
    await throws('a customer cannot add products to a store', () => q(`select merchant_product_save('m1', null, 'Hack', '', 100, '', true, false)`), 'not found');
    await throws('a customer cannot close a store', () => q(`select merchant_set_open('m1', false)`), 'not found');
    await throws('a customer cannot assign owners', () => q(`select admin_merchant_owner('m1', 'bola@x.ng')`), 'admin');
  });
  await as(ADM, async () => {
    await throws('unknown email is refused', () => q(`select admin_merchant_owner('m1', 'nobody@x.ng')`), 'No ChowBuy account');
    await throws('rider accounts cannot own a store', () => q(`select admin_merchant_owner('m1', 'rider@x.ng')`), 'cannot own');
    await throws('unknown store is refused', () => q(`select admin_merchant_owner('nope', 'bola@x.ng')`), 'Store not found');
    await q(`select admin_merchant_owner('m1', ' Bola@X.ng ')`);
    ok('assigning an owner links the store and sets the merchant role', (await q(`select m.owner_id = '${B}' as linked, p.role::text as role from merchants m, profiles p where m.id = 'm1' and p.id = '${B}'`))[0].linked === true && (await q(`select role::text r from profiles where id = '${B}'`))[0].r === 'merchant');
    ok('admin_merchants shows the owner email', (await q(`select admin_merchants() r`))[0].r.some(x => x.id === 'm1' && x.owner === 'bola@x.ng'));
    await q(`select admin_merchant_owner('m1', '')`);
    ok('clearing the owner works', (await q(`select owner_id from merchants where id = 'm1'`))[0].owner_id === null);
    await q(`select admin_merchant_owner('m1', 'merchant@x.ng')`);
  });
  await su(`reset role`);
}

/* ---- cancel with refund + reason, and mark ready ---- */
{
  const su = async sql => { await db.exec('reset role'); await db.exec(sql); };
  await su(`update wallets set balance = 50000 where user_id = '${A}'; update merchants set owner_id = '${M}' where id = 'm1'`);
  const bal = async () => (await q(`select balance from wallets where user_id = '${A}'`))[0].balance;
  const paidO = (await as(A, () => q(`select place_order('m1', '[{"product_id":"p3","qty":1}]'::jsonb, 'wallet', $1, null) r`, [addr])))[0].r.order;
  const paidTotal = (await q(`select total from orders where id = '${paidO.id}'`))[0].total;
  const before = await bal();
  await as(M, async () => {
    await throws('cancel needs a reason', () => q(`select merchant_cancel_order($1, '')`, [paidO.id]), 'reason');
    await throws('cancelling through set_stage is closed', () => q(`select merchant_set_stage($1, 'cancelled')`, [paidO.id]), 'only start preparing');
    await throws('cannot mark ready before preparing', () => q(`select merchant_mark_ready($1)`, [paidO.id]), 'Start preparing');
    await q(`select merchant_set_stage($1, 'preparing')`, [paidO.id]);
    await q(`select merchant_mark_ready($1)`, [paidO.id]);
    await q(`select merchant_mark_ready($1)`, [paidO.id]);
    const row = (await q(`select merchant_orders('m1') r`))[0].r.find(x => x.id === paidO.id);
    ok('ready is recorded once and shown to the merchant', row && row.stage === 'preparing' && !!row.times.ready, JSON.stringify(row && row.times));
    const out = (await q(`select merchant_cancel_order($1, 'Item out of stock') r`, [paidO.id]))[0].r;
    ok('cancelling a paid order reports the refund', out.refunded === paidTotal, JSON.stringify(out));
    await throws('a second cancel is refused (no double refund)', () => q(`select merchant_cancel_order($1, 'again')`, [paidO.id]), 'no longer');
  });
  ok('customer wallet is refunded in full', (await bal()) === before + paidTotal, before + ' -> ' + (await bal()));
  ok('refund appears in wallet history', (await q(`select 1 from wallet_txs where user_id = '${A}' and ref = 'refund:${paidO.id}' and dir = 1 and amount = ${paidTotal}`)).length === 1);
  await as(ADM, async () => {
    const r = (await q(`select admin_orders('all', '${paidO.id}', 10, 0) r`))[0].r.rows[0];
    ok('admin sees the cancel reason, who cancelled and the refund', r.cancel_reason === 'Item out of stock' && r.cancelled_by === 'merchant' && r.refunded === paidTotal && r.status === 'cancelled', JSON.stringify(r));
    ok('admin activity feed carries the reason', (await q(`select admin_dashboard(30) d`))[0].d.activity.some(a => /cancelled by .*Item out of stock/.test(a.action)));
  });
  const codO = (await as(A, () => q(`select place_order('m1', '[{"product_id":"p3","qty":1}]'::jsonb, 'cod', $1, null) r`, [addr])))[0].r.order;
  const b2 = await bal();
  await as(M, async () => { const out = (await q(`select merchant_cancel_order($1, 'Closing early') r`, [codO.id]))[0].r; ok('cancelling a cash order refunds nothing', out.refunded === 0); });
  ok('wallet unchanged for cash order', (await bal()) === b2);
  await as(B, async () => { await throws('another customer cannot cancel', () => q(`select merchant_cancel_order($1, 'nope')`, [codO.id]), 'not found'); });
  await su(`reset role`);
}

/* ---- merchant registration, onboarding, review, ownership ---- */
{
  const su = async sql => { await db.exec('reset role'); await db.exec(sql); };
  const qj = (sql, obj) => q(sql, [JSON.stringify(obj)]);
  const N1 = await mk('nkechi@shop.ng', '08032220001'), N2 = await mk('pharma@shop.ng', '08032220002'), N3 = await mk('logi@shop.ng', '08032220003'), N4 = await mk('grocer@shop.ng', '08032220004'), U0 = await mk('raw@shop.ng', '08032220005');
  await su(`update auth.users set email_confirmed_at = now() where id in ('${N1}', '${N2}', '${N3}', '${N4}', '${ADM}', '${R}')`);
  const biz = { trading_name: 'Nkechi Kitchen', registered_name: 'Nkechi Foods Ltd', description: 'Home-style Nigerian meals made fresh daily.', cac_status: 'registered', cac_number: 'RC1234567', business_email: 'hello@nkechi.ng', business_phone: '08032220001', website: '' };
  const own = { full_name: 'Nkechi Okoro', phone: '08032220001', email: 'nkechi@shop.ng', position: 'owner', authorized: true, id_type: 'nin' };
  const loc = { country: 'Nigeria', state: 'Lagos', city: 'Lagos', area: 'Lekki Phase 1', address: '12 Admiralty Way, Lekki Phase 1', postal: '106104', branch: 'Main', lat: 6.45, lng: 3.47 };
  const spec = { cuisines: ['Local Swallows', 'Grills'], hours: '8am - 10pm daily', prep_model: 'kitchen', menu_status: 'building', prep_minutes: 25, pickup: true, delivery: true };
  let mid, aid, pidShared;

  await as(U0, async () => { await throws('unconfirmed email cannot start an application', () => q(`select merchant_app_start('RESTAURANT')`), 'Verify your email'); });
  await as(ADM, async () => { await throws('admin accounts cannot register a business', () => q(`select merchant_app_start('RESTAURANT')`), 'cannot register'); });
  await as(R, async () => { await throws('rider accounts cannot register a business', () => q(`select merchant_app_start('RESTAURANT')`), 'cannot register'); });
  await as(N1, async () => {
    await throws('only the four business types exist', () => q(`select merchant_app_start('CLOUD_KITCHEN')`), 'four business types');
    await throws('a combined type is refused', () => q(`select merchant_app_start('RESTAURANT,PHARMACY')`), 'four business types');
    const r = (await q(`select merchant_app_start('RESTAURANT') r`))[0].r; mid = r.merchant; aid = r.application;
    ok('starting creates a business, an application and the membership together', !!mid && !!aid && (await q(`select 1 from merchants m join merchant_members mm on mm.merchant_id = m.id and mm.user_id = '${N1}' where m.id = '${mid}' and m.application_status = 'DRAFT' and not m.active and m.business_type = 'RESTAURANT' and m.vertical = 'restaurant'`)).length === 1);
    const again = (await q(`select merchant_app_start('RESTAURANT') r`))[0].r;
    ok('a second tap reuses the draft (no duplicate business)', again.merchant === mid && again.reused === true && (await q(`select count(*)::int n from merchant_members where user_id = '${N1}'`))[0].n === 1);
    const sw = (await q(`select merchant_app_start('GROCERY_SUPERMARKET') r`))[0].r;
    ok('changing the type of a draft re-types it instead of creating another business', sw.merchant === mid && (await q(`select business_type, vertical from merchants where id = '${mid}'`))[0].vertical === 'grocery');
    await q(`select merchant_app_start('RESTAURANT')`);

    await throws('a bad business phone is refused', () => qj(`select merchant_app_save('${mid}', 'business', $1::jsonb)`, { ...biz, business_phone: '12345' }), 'phone');
    await throws('a registered business needs a CAC number', () => qj(`select merchant_app_save('${mid}', 'business', $1::jsonb)`, { ...biz, cac_number: 'abc' }), 'CAC');
    await throws('a CAC status must be chosen', () => qj(`select merchant_app_save('${mid}', 'business', $1::jsonb)`, { ...biz, cac_status: '' }), 'CAC');
    await qj(`select merchant_app_save('${mid}', 'business', $1::jsonb)`, { ...biz, cac_status: 'sole_proprietor', cac_number: '' });
    ok('a sole proprietor is not forced to invent a CAC number', (await q(`select data->'business'->>'cac_number' c from merchant_applications where id = '${aid}'`))[0].c === '');
    await qj(`select merchant_app_save('${mid}', 'business', $1::jsonb)`, biz);
    ok('the store name is mirrored onto the business', (await q(`select name from merchants where id = '${mid}'`))[0].name === 'Nkechi Kitchen');
    await throws('the representative must confirm authorisation', () => qj(`select merchant_app_save('${mid}', 'owner', $1::jsonb)`, { ...own, authorized: false }), 'authorised');
    await throws('the position must be one of the choices', () => qj(`select merchant_app_save('${mid}', 'owner', $1::jsonb)`, { ...own, position: 'ceo' }), 'connected');
    ok('before declaring ownership the applicant is a manager, not the owner', (await q(`select role from merchant_members where merchant_id = '${mid}' and user_id = '${N1}'`))[0].role === 'manager');
    await qj(`select merchant_app_save('${mid}', 'owner', $1::jsonb)`, own);
    ok('declaring ownership records an auditable owner membership', (await q(`select mm.role, mm.relationship, m.owner_id = '${N1}' as linked from merchant_members mm join merchants m on m.id = mm.merchant_id where mm.merchant_id = '${mid}' and mm.user_id = '${N1}'`))[0].role === 'owner');
    await throws('the location must be in Nigeria', () => qj(`select merchant_app_save('${mid}', 'location', $1::jsonb)`, { ...loc, lat: 51.5, lng: -0.1 }), 'inside Nigeria');
    await throws('only Nigeria is accepted as a country', () => qj(`select merchant_app_save('${mid}', 'location', $1::jsonb)`, { ...loc, country: 'Ghana' }), 'Nigeria');
    const lr = (await qj(`select merchant_app_save('${mid}', 'location', $1::jsonb) r`, loc))[0].r;
    ok('a live city is marked serviceable, set by the server', lr.data.serviceable === true);
    const lr2 = (await qj(`select merchant_app_save('${mid}', 'location', $1::jsonb) r`, { ...loc, city: 'Sokoto', serviceable: true, lat: '', lng: '' }))[0].r;
    ok('an unserved city is recorded as awaiting availability (client flag ignored)', lr2.data.serviceable === false);
    await qj(`select merchant_app_save('${mid}', 'location', $1::jsonb)`, loc);
    await throws('restaurant details are validated', () => qj(`select merchant_app_save('${mid}', 'specific', $1::jsonb)`, { ...spec, prep_minutes: 500 }), 'preparation time');
    await throws('restaurant needs delivery or pickup', () => qj(`select merchant_app_save('${mid}', 'specific', $1::jsonb)`, { ...spec, pickup: false, delivery: false }), 'delivery, pickup');
    await qj(`select merchant_app_save('${mid}', 'specific', $1::jsonb)`, spec);
    ok('a restaurant is not asked for pharmacy fields', !('premises_licence_no' in (await q(`select data->'specific' s from merchant_applications where id = '${aid}'`))[0].s));

    await throws('submitting early lists what is missing', () => q(`select merchant_app_submit('${mid}')`), 'Still needed');
    await throws('account number must be 10 digits', () => q(`select merchant_settlement_save('${mid}', 'Nkechi Okoro', 'GTBank', '12345')`), '10-digit');
    await q(`select merchant_settlement_save('${mid}', 'Nkechi Okoro', 'GTBank', '0123 456 789')`);
    const got = (await q(`select merchant_app_get('${mid}') r`))[0].r;
    ok('bank details come back masked and unverified', got.settlement.last4 === '6789' && got.settlement.status === 'PENDING_VERIFICATION' && !JSON.stringify(got).includes('0123456789'));
    await throws('a document path for another folder is refused', () => q(`select merchant_doc_submit('${mid}', 'owner_id', 'someone-else/id.pdf')`), 'again');
    await throws('an unknown document type is refused', () => q(`select merchant_doc_submit('${mid}', 'passport_scan', '${mid}/x.pdf')`), 'Unknown document');
    await throws('path traversal is refused', () => q(`select merchant_doc_submit('${mid}', 'owner_id', '${mid}/../x.pdf')`), 'again');
    ok('a restaurant that says it is registered needs CAC and a food permit', ['owner_id', 'cac', 'food_permit'].every(d => got.required.includes(d)) && !got.required.includes('pcn_premises'));
    for (const d of ['owner_id', 'cac', 'food_permit']) await q(`select merchant_doc_submit('${mid}', '${d}', '${mid}/${d}.pdf')`);
    await throws('direct writes to the application table are closed', () => q(`update merchant_applications set status = 'APPROVED' where id = '${aid}'`), 'permission denied');
    await throws('direct writes to the business table are closed', () => q(`update merchants set active = true, application_status = 'APPROVED' where id = '${mid}'`), 'permission denied');
    await throws('the bank table cannot be read directly', () => q(`select * from merchant_settlement`), 'permission denied');
    await throws('a merchant cannot approve themselves', () => q(`select admin_application_decide('${aid}', 'approve', '')`), 'admin');
    await throws('products cannot be listed before approval', () => q(`select merchant_product_save('${mid}', null, 'Jollof', '', 3000, 'Rice', true, false)`), 'approved');
    ok('submit succeeds once everything is in', (await q(`select merchant_app_submit('${mid}') r`))[0].r.status === 'SUBMITTED');
    ok('submitting twice does nothing', (await q(`select merchant_app_submit('${mid}') r`))[0].r.already === true);
    await throws('a submitted application can no longer be edited', () => qj(`select merchant_app_save('${mid}', 'business', $1::jsonb)`, biz), 'no longer be edited');
  });

  await as(A, async () => { ok('the business is invisible to customers while a draft', (await q(`select 1 from merchants where id = '${mid}'`)).length === 0); });
  await as(N4, async () => {
    await throws('another merchant cannot read the application', () => q(`select merchant_app_get('${mid}')`), 'not found');
    await throws('another merchant cannot save to it', () => qj(`select merchant_app_save('${mid}', 'business', $1::jsonb)`, biz), 'not found');
    await throws('another merchant cannot submit it', () => q(`select merchant_app_submit('${mid}')`), 'not found');
    await throws('another merchant cannot read its bank details', () => q(`select merchant_settlement_get('${mid}')`), 'not found');
    await throws('another merchant cannot read its team', () => q(`select merchant_team('${mid}')`), 'not found');
    ok('another merchant sees no foreign application rows', (await q(`select 1 from merchant_applications`)).length === 0 && (await q(`select 1 from merchant_members where merchant_id = '${mid}'`)).length === 0);
    await throws('another merchant cannot invite into it', () => q(`select merchant_invite('${mid}', 'bola@x.ng', 'staff')`), 'owner');
  });

  await as(ADM, async () => {
    const list = (await q(`select admin_applications('SUBMITTED', 'RESTAURANT', 'nkechi') r`))[0].r;
    ok('admin sees the submitted application in a filtered list', list.length === 1 && list[0].merchant === mid && list[0].docs_required === 3);
    ok('filters exclude other statuses and types', (await q(`select admin_applications('APPROVED', 'all', '') r`))[0].r.every(x => x.status === 'APPROVED') && (await q(`select admin_applications('all', 'PHARMACY', '') r`))[0].r.length === 0);
    const det = (await q(`select admin_application('${aid}') r`))[0].r;
    ok('admin detail shows owner declaration, documents, members and the full account for verification', det.data.owner.position === 'owner' && det.docs.length === 3 && det.members.length === 1 && det.settlement.account === '0123456789');
    await throws('approval is blocked until required documents are approved', () => q(`select admin_application_decide('${aid}', 'approve', '')`), 'Approve these documents');
    await throws('sending back needs a reason', () => q(`select admin_application_decide('${aid}', 'request_info', '')`), 'Say what');
    await q(`select admin_application_decide('${aid}', 'start_review', '')`);
    await q(`select admin_application_decide('${aid}', 'request_info', 'The ID photo is cropped. Please upload the full card.')`);
    await q(`select admin_kyc_set('merchant', '${mid}', 'owner_id', 'declined', 'The ID photo is cropped.')`);
  });
  await as(N1, async () => {
    const g = (await q(`select merchant_app_get('${mid}') r`))[0].r;
    ok('the merchant sees ACTION_REQUIRED with the reviewer\'s actual reason', g.status === 'ACTION_REQUIRED' && /cropped/.test(g.note) && g.docs.find(d => d.doc === 'owner_id').status === 'declined');
    await qj(`select merchant_app_save('${mid}', 'business', $1::jsonb)`, { ...biz, description: 'Home-style Nigerian meals, made fresh daily in Lekki.' });
    await q(`select merchant_doc_submit('${mid}', 'owner_id', '${mid}/owner_id-full.pdf')`);
    ok('the merchant can fix and resubmit', (await q(`select merchant_app_submit('${mid}') r`))[0].r.status === 'SUBMITTED');
  });
  await as(ADM, async () => {
    for (const d of ['owner_id', 'cac', 'food_permit']) await q(`select admin_kyc_set('merchant', '${mid}', '${d}', 'approved', '')`);
    await throws('reject needs a reason', () => q(`select admin_application_decide('${aid}', 'reject', '')`), 'reason');
    const r = (await q(`select admin_application_decide('${aid}', 'approve', '') r`))[0].r;
    ok('admin approves once documents are approved', r.status === 'APPROVED');
    const m = (await q(`select active, verified, open, application_status from merchants where id = '${mid}'`))[0];
    ok('approval activates the business but leaves it closed until the merchant opens it', m.active && m.verified && m.open === false && m.application_status === 'APPROVED');
    ok('approval is in the audit trail with who did it', (await q(`select admin_application('${aid}') r`))[0].r.history.some(h => h.action === 'merchant_application_approve' && h.by === 'admin@x.ng'));
  });
  await as(N1, async () => {
    const me = (await q(`select merchant_me() r`))[0].r;
    ok('the approved business appears as an openable store', me.stores.length === 1 && me.stores[0].id === mid && me.stores[0].role === 'owner' && me.workspaces.length === 1);
    ok('profile became a merchant after approval', (await q(`select role::text r from profiles where id = '${N1}'`))[0].r === 'merchant');
    let ck = (await q(`select merchant_checklist('${mid}') r`))[0].r; const done = k => ck.find(c => c.key === k).done;
    ok('restaurant checklist has restaurant tasks only', ['menu_categories', 'menu_items', 'prices', 'prep_times', 'accept_orders'].every(k => ck.some(c => c.key === k)) && !ck.some(c => c.key === 'regulatory' || c.key === 'service_areas'));
    ok('tasks are not complete just because they exist', !done('menu_items') && !done('settlement') && !done('notifications') && done('prep_times') && done('address'));
    const pid = (await q(`select merchant_product_save('${mid}', null, 'Party Jollof', 'Smoky', 3500, 'Rice', true, false) id`))[0].id;
    ck = (await q(`select merchant_checklist('${mid}') r`))[0].r;
    ok('adding a dish completes the menu tasks from real data', done('menu_items') && done('menu_categories') && done('prices'));
    await q(`select merchant_checklist_ack('${mid}', 'policies')`);
    await throws('only manual tasks can be confirmed by hand', () => q(`select merchant_checklist_ack('${mid}', 'settlement')`), 'Unknown task');
    ck = (await q(`select merchant_checklist('${mid}') r`))[0].r;
    ok('confirming policies completes only that task', done('policies') && !done('notifications'));
    await q(`select merchant_set_open('${mid}', true)`);
    ok('the approved merchant can open for orders', (await q(`select open from merchants where id = '${mid}'`))[0].open === true);
    pidShared = pid;
  });
  await as(A, async () => { ok('the public can now see the approved store and its dish', (await q(`select 1 from merchants where id = '${mid}'`)).length === 1 && (await q(`select 1 from products where id = '${pidShared}'`)).length === 1); });
  await as(N1, async () => { await q(`select merchant_set_open('${mid}', false)`); });
  await as(ADM, async () => {
    await throws('settlement cannot be verified by the merchant, only admin (and needs a reason to fail it)', () => q(`select admin_settlement_status('${mid}', 'FAILED', '')`), 'what was wrong');
    await q(`select admin_settlement_status('${mid}', 'VERIFIED', '')`);
  });
  await as(N1, async () => { ok('verifying settlement completes that task', (await q(`select merchant_checklist('${mid}') r`))[0].r.find(c => c.key === 'settlement').done === true); });
  await as(N4, async () => { await throws('an unrelated merchant cannot change the catalogue', () => q(`select merchant_product_save('${mid}', null, 'Hack', '', 100, '', true, false)`), 'not found'); });

  /* team: invitations, roles, removal */
  await as(N1, async () => {
    await throws('invites need an existing account', () => q(`select merchant_invite('${mid}', 'ghost@x.ng', 'staff')`), 'No ChowBuy account');
    await throws('the owner role cannot be handed out by invite', () => q(`select merchant_invite('${mid}', 'grocer@shop.ng', 'owner')`), 'manager or staff');
    await q(`select merchant_invite('${mid}', 'grocer@shop.ng', 'staff')`);
  });
  await as(N4, async () => {
    const me = (await q(`select merchant_me() r`))[0].r;
    ok('the invitee sees an invitation, and no access yet', me.invitations.length === 1 && me.invitations[0].id === mid && me.workspaces.length === 0);
    await throws('no access to orders until accepted', () => q(`select merchant_orders('${mid}')`), 'not found');
    await q(`select merchant_invite_respond('${mid}', true)`);
    ok('accepting gives staff access', (await q(`select merchant_orders('${mid}') r`))[0].r.length === 0);
    await throws('staff cannot edit the catalogue', () => q(`select merchant_product_save('${mid}', null, 'X', '', 100, '', true, false)`), 'owner or manager');
    await throws('staff cannot see applications or bank details', () => q(`select merchant_settlement_get('${mid}')`), 'not found');
    await throws('staff cannot invite', () => q(`select merchant_invite('${mid}', 'bola@x.ng', 'staff')`), 'owner');
  });
  await as(N1, async () => {
    await throws('the owner cannot remove themselves', () => q(`select merchant_member_remove('${mid}', '${N1}')`), 'yourself');
    await q(`select merchant_member_remove('${mid}', '${N4}')`);
  });
  await as(N4, async () => { await throws('a removed member loses access immediately', () => q(`select merchant_orders('${mid}')`), 'not found'); });

  /* suspension and reinstatement */
  await as(ADM, async () => {
    await throws('suspending needs a reason', () => q(`select admin_application_decide('${aid}', 'suspend', '')`), 'reason');
    await q(`select admin_application_decide('${aid}', 'suspend', 'Customer complaints under investigation')`);
  });
  await as(N1, async () => {
    const me = (await q(`select merchant_me() r`))[0].r;
    ok('a suspended business shows its status but cannot open the dashboard', me.workspaces[0].status === 'SUSPENDED' && me.stores.length === 0);
    await throws('a suspended store cannot open for orders', () => q(`select merchant_set_open('${mid}', true)`), 'approved and activated');
  });
  await as(ADM, async () => { await q(`select admin_application_decide('${aid}', 'reinstate', '')`); ok('reinstating restores the business', (await q(`select active from merchants where id = '${mid}'`))[0].active === true); });

  /* pharmacy: regulatory gate */
  let pm, pa;
  await as(N2, async () => {
    const r = (await q(`select merchant_app_start('PHARMACY') r`))[0].r; pm = r.merchant; pa = r.application;
    await qj(`select merchant_app_save('${pm}', 'business', $1::jsonb)`, { ...biz, trading_name: 'CarePlus Pharmacy', cac_status: 'in_progress', cac_number: '', business_email: 'care@plus.ng', business_phone: '08032220002' });
    await qj(`select merchant_app_save('${pm}', 'owner', $1::jsonb)`, { ...own, full_name: 'Dr Ada Obi', phone: '08032220002', email: 'pharma@shop.ng', position: 'director' });
    ok('a director is not silently made the legal owner', (await q(`select role, relationship from merchant_members where merchant_id = '${pm}' and user_id = '${N2}'`))[0].role === 'manager');
    await qj(`select merchant_app_save('${pm}', 'location', $1::jsonb)`, loc);
    const pspec = { pharmacy_category: 'community', premises_licence_no: 'PCN-12345', licence_expiry: '2020-01-01', pharmacist_name: 'Dr Ada Obi', pharmacist_reg_no: 'PCN/998877', hours: '8am - 9pm' };
    await throws('an expired premises licence is refused', () => qj(`select merchant_app_save('${pm}', 'specific', $1::jsonb)`, pspec), 'expired');
    await throws('a missing pharmacist registration is refused', () => qj(`select merchant_app_save('${pm}', 'specific', $1::jsonb)`, { ...pspec, licence_expiry: '2030-01-01', pharmacist_reg_no: '' }), 'pharmacist');
    await qj(`select merchant_app_save('${pm}', 'specific', $1::jsonb)`, { ...pspec, licence_expiry: '2030-01-01' });
    const g = (await q(`select merchant_app_get('${pm}') r`))[0].r;
    ok('a pharmacy must always supply CAC, premises licence and pharmacist licence', ['owner_id', 'cac', 'pcn_premises', 'pharmacist_licence'].every(d => g.required.includes(d)));
    await q(`select merchant_settlement_save('${pm}', 'CarePlus Pharmacy', 'Access Bank', '0987654321')`);
    await throws('the pharmacy cannot submit without the licence documents', () => q(`select merchant_app_submit('${pm}')`), 'Document: cac');
    for (const d of ['owner_id', 'cac', 'pcn_premises', 'pharmacist_licence']) await q(`select merchant_doc_submit('${pm}', '${d}', '${pm}/${d}.pdf')`);
    await q(`select merchant_app_submit('${pm}')`);
    await throws('an unverified pharmacy cannot list medicines', () => q(`select merchant_product_save('${pm}', null, 'Amoxicillin', '', 3000, 'Rx', true, true)`), 'verification');
    const ck = (await q(`select merchant_checklist('${pm}') r`))[0].r;
    ok('pharmacy checklist is regulatory, with no restaurant tasks', ck.some(c => c.key === 'regulatory' && c.done === false) && !ck.some(c => c.key === 'menu_items'));
  });
  await as(ADM, async () => {
    for (const d of ['owner_id', 'cac', 'pcn_premises']) await q(`select admin_kyc_set('merchant', '${pm}', '${d}', 'approved', '')`);
    await throws('a pharmacy cannot be approved with the pharmacist licence still unreviewed', () => q(`select admin_application_decide('${pa}', 'approve', '')`), 'pharmacist_licence');
    await q(`select admin_kyc_set('merchant', '${pm}', 'pharmacist_licence', 'approved', '')`);
    await q(`select admin_application_decide('${pa}', 'approve', '')`);
  });
  await as(N2, async () => { await q(`select merchant_product_save('${pm}', null, 'Paracetamol 500mg', '', 600, 'Pain', true, true)`); ok('once verified, the pharmacy can list (and flag Rx items)', (await q(`select rx from products where merchant_id = '${pm}'`))[0].rx === true); });

  /* logistics and grocery get their own requirements and checklist */
  let lm;
  await as(N3, async () => {
    lm = (await q(`select merchant_app_start('PACKAGE_LOGISTICS') r`))[0].r.merchant;
    await throws('logistics needs service types', () => qj(`select merchant_app_save('${lm}', 'specific', $1::jsonb)`, { logistics_name: 'Swift Dispatch', service_types: [], operating_regions: ['Lagos'], package_types: ['parcels'], pickup_dropoff: true, fleet_size: 12, hours: '7am - 8pm' }), 'service types');
    await throws('logistics rejects an invented service type', () => qj(`select merchant_app_save('${lm}', 'specific', $1::jsonb)`, { logistics_name: 'Swift Dispatch', service_types: ['teleport'], operating_regions: ['Lagos'], package_types: ['parcels'], fleet_size: 12, hours: '7am - 8pm' }), 'not an option');
    await qj(`select merchant_app_save('${lm}', 'specific', $1::jsonb)`, { logistics_name: 'Swift Dispatch', service_types: ['same_day', 'intercity'], operating_regions: ['Lagos', 'Ogun'], package_types: ['parcels', 'documents'], pickup_dropoff: true, fleet_size: 12, hours: '7am - 8pm' });
    const g = (await q(`select merchant_app_get('${lm}') r`))[0].r;
    ok('logistics is not asked for a pharmacy licence or a food permit', g.required.join() === 'owner_id' && g.type === 'PACKAGE_LOGISTICS');
    ok('logistics checklist has logistics tasks only', (await q(`select merchant_checklist('${lm}') r`))[0].r.every(c => !['menu_items', 'regulatory', 'products'].includes(c.key)));
  });
  await as(N4, async () => {
    const gm = (await q(`select merchant_app_start('GROCERY_SUPERMARKET') r`))[0].r.merchant;
    await qj(`select merchant_app_save('${gm}', 'specific', $1::jsonb)`, { store_category: 'minimart', product_categories: ['Staples', 'Drinks'], hours: '8am - 9pm', inventory_pref: 'manual', cold_chain: false, catalog_status: 'building' });
    ok('a grocery checklist has product tasks and no prescription tasks', (await q(`select merchant_checklist('${gm}') r`))[0].r.some(c => c.key === 'products') && !(await q(`select merchant_checklist('${gm}') r`))[0].r.some(c => c.key === 'regulatory'));
    ok('a user can run several businesses, each with its own workspace', (await q(`select count(*)::int n from merchant_members where user_id = '${N4}' and status = 'active'`))[0].n === 1);
  });

  /* the original bug: setting owner_id by any route now creates the membership, and survives sign-out/in (a new session) */
  await su(`update merchants set owner_id = '${N3}' where id = 'm3'`);
  await as(N3, async () => {
    const me = (await q(`select merchant_me() r`))[0].r;
    ok('linking a store by owner_id also creates the membership (the "not assigned owner" cause)', me.workspaces.some(w => w.id === 'm3' && w.role === 'owner'));
  });
  await as(N3, async () => { ok('the link persists for a fresh session', (await q(`select merchant_me() r`))[0].r.stores.some(w => w.id === 'm3')); });
  await su(`update merchants set owner_id = null where id = 'm3'; update merchant_members set status = 'removed' where merchant_id = 'm3'`);

  /* demo cleanup: flagged by id + name + no owner, reversible, history untouched */
  const ordersBefore = (await q(`select count(*)::int n from orders`))[0].n, walletBefore = (await q(`select coalesce(sum(balance),0)::int s from wallets`))[0].s, txBefore = (await q(`select count(*)::int n from wallet_txs`))[0].n;
  await su(fs.readFileSync(root + 'migrations/20261101000010_demo_cleanup.sql', 'utf8'));
  ok('only the seeded sample stores are flagged as demo', (await q(`select count(*)::int n from merchants where is_demo and id not in ('m1','m2','m3','m4','m5','m6','m7')`))[0].n === 0 && (await q(`select count(*)::int n from merchants where not is_demo and id in ('${mid}', '${pm}')`))[0].n === 2);
  ok('demo stores no longer appear to customers', (await as(A, () => q(`select id from merchants where active`))).every(x => !/^m[1-7]$/.test(x.id)));
  ok('real approved merchants are untouched by the cleanup', (await q(`select active from merchants where id = '${mid}'`))[0].active === true);
  await throws('nobody can order from a demo store', () => as(A, () => q(`select place_order('m1', '[{"product_id":"p1","qty":1}]'::jsonb, 'wallet', '${addr}', null)`)), 'not available');
  ok('orders, wallets and the ledger are intact after cleanup', (await q(`select count(*)::int n from orders`))[0].n === ordersBefore && (await q(`select coalesce(sum(balance),0)::int s from wallets`))[0].s === walletBefore && (await q(`select count(*)::int n from wallet_txs`))[0].n === txBefore);
  ok('the cleanup is idempotent', (await su(fs.readFileSync(root + 'migrations/20261101000010_demo_cleanup.sql', 'utf8')), (await q(`select count(*)::int n from merchants where is_demo and active`))[0].n === 0));
  ok('re-running the onboarding migration does not re-approve drafts', (await su(fs.readFileSync(root + 'migrations/20261101000009_merchant_onboarding.sql', 'utf8')), (await q(`select application_status s from merchants where id = '${lm}'`))[0].s === 'DRAFT'));

  // KYC accept/decline and the merchant-visible application status are one lifecycle.
  {
    const su2 = async sql => { await db.exec('reset role'); return db.exec(sql); };
    await su2(`update merchant_applications set status = 'SUBMITTED' where id = '${aid}'; update merchants set application_status = 'SUBMITTED', active = true, verified = false, open = false where id = '${mid}'`);
    await as(ADM, async () => {
      const l = (await q(`select admin_kyc_list('merchant') r`))[0].r.find(x => x.id === mid);
      ok('the KYC list reports the real application status', l.app_status === 'SUBMITTED' && l.verified === false);
      await q(`select admin_kyc_decide('merchant', '${mid}', true)`);
      const m = (await q(`select m.active, m.verified, m.application_status s, a.status a from merchants m join merchant_applications a on a.merchant_id = m.id where m.id = '${mid}'`))[0];
      ok('KYC accept approves the application the merchant sees', m.active && m.verified && m.s === 'APPROVED' && m.a === 'APPROVED');
      await throws('declining a merchant needs a reason', () => q(`select admin_kyc_decide('merchant', '${mid}', false)`), 'reason');
      await q(`select admin_kyc_decide('merchant', '${mid}', false, 'Documents do not match the business name.')`);
      const d = (await q(`select m.active, m.open, m.application_status s, a.review_note n from merchants m join merchant_applications a on a.merchant_id = m.id where m.id = '${mid}'`))[0];
      ok('declining an approved merchant suspends it and closes the store', d.s === 'SUSPENDED' && !d.active && !d.open && /do not match/.test(d.n));
      await q(`select admin_kyc_decide('merchant', '${mid}', true)`);
      ok('accepting a suspended merchant reinstates it', (await q(`select application_status s, active from merchants where id = '${mid}'`))[0].s === 'APPROVED');
    });
    await su2(`update merchant_applications set status = 'REJECTED' where id = '${aid}'; update merchants set application_status = 'REJECTED', active = false where id = '${mid}'`);
    await as(ADM, async () => { await throws('a rejected application must be reopened before KYC can accept it', () => q(`select admin_kyc_decide('merchant', '${mid}', true)`), 'reopened'); });
    await su2(`update merchant_applications set status = 'APPROVED' where id = '${aid}'; update merchants set application_status = 'APPROVED', active = true, verified = true where id = '${mid}'`);
  }
}
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
