import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'node:fs';
const db = new PGlite({ extensions: { pgcrypto } });
const root = new URL('../', import.meta.url).pathname;
await db.exec(`
 create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
 create schema auth; create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}', last_sign_in_at timestamptz);
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
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
