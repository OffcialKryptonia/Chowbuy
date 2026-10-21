-- Admin customer control (wallet top-up / deduct, points), the master points system, and rider pay models.
-- Money is whole naira. Every admin action writes the audit log. Clients never change balances or points directly.

/* ---------------- settings defaults ----------------
   platform_settings key 'points':  earnPer = naira spent per 1 point; pointValue = naira value of 1 point when redeemed;
   minRedeem / stepRedeem = redemption rules; tiers = lifetime-points thresholds with an earn multiplier.
   platform_settings key 'rider_pay': partner commission % by tier, fleet default salary. */
create or replace function public.points_cfg() returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object('enabled', true, 'earnPer', 100, 'pointValue', 1, 'minRedeem', 500, 'stepRedeem', 100, 'reviewPoints', 50, 'signupBonus', 0,
    'tiers', jsonb_build_array(
      jsonb_build_object('id', 'bronze', 'name', 'Bronze', 'min', 0,     'mult', 1.0),
      jsonb_build_object('id', 'silver', 'name', 'Silver', 'min', 5000,  'mult', 1.25),
      jsonb_build_object('id', 'gold',   'name', 'Gold',   'min', 20000, 'mult', 1.5)))
  || coalesce(public.setting('points', '{}'::jsonb), '{}'::jsonb)
$$;
create or replace function public.rider_pay_cfg() returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object('commission', jsonb_build_object('Standard', 15, 'Silver', 12, 'Gold', 10), 'fleetSalary', 120000)
  || coalesce(public.setting('rider_pay', '{}'::jsonb), '{}'::jsonb)
$$;

/* ---------------- schema ---------------- */
alter table public.profiles add column if not exists lifetime_points int not null default 0 check (lifetime_points >= 0);
update public.profiles set lifetime_points = points where lifetime_points = 0 and points > 0;

create table public.points_ledger (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  delta      int  not null check (delta <> 0),
  kind       text not null check (kind in ('order', 'review', 'bonus', 'redeem', 'admin')),
  note       text not null default '',
  ref        text unique,
  created_at timestamptz not null default now()
);
create index on public.points_ledger (user_id, created_at desc);

alter table public.riders
  add column if not exists pay_model text not null default 'partner' check (pay_model in ('fleet', 'partner')),
  add column if not exists monthly_salary int not null default 0 check (monthly_salary >= 0),
  add column if not exists tier text not null default 'Standard' check (tier in ('Standard', 'Silver', 'Gold'));

-- One row per delivery. Fleet riders get no per-ride pay (net = 0, they are salaried); partners keep fare minus commission.
create table public.rider_earnings (
  order_id   text primary key references public.orders(id) on delete cascade,
  rider_id   uuid not null references public.profiles(id) on delete cascade,
  model      text not null check (model in ('fleet', 'partner')),
  fare       int not null default 0,
  commission int not null default 0,
  net        int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.rider_earnings (rider_id, created_at desc);

alter table public.points_ledger enable row level security;
alter table public.rider_earnings enable row level security;
revoke all on public.points_ledger, public.rider_earnings from anon, authenticated;
grant select on public.points_ledger, public.rider_earnings to authenticated;
create policy points_self on public.points_ledger for select using (user_id = auth.uid() or public.is_admin());
-- Fleet riders never see per-ride fares: only partners can read their own earnings rows.
create policy earnings_read on public.rider_earnings for select using (public.is_admin() or (rider_id = auth.uid() and model = 'partner'));

/* ---------------- internal helpers ---------------- */
create or replace function public.points_tier(p_lifetime int) returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select t from jsonb_array_elements(public.points_cfg()->'tiers') t where (t->>'min')::int <= p_lifetime order by (t->>'min')::int desc limit 1
$$;

-- Adds or removes points. Idempotent when p_ref is given. Earned points (not admin fixes or redemptions) also build lifetime tier progress.
create or replace function public._points_add(p_user uuid, p_delta int, p_kind text, p_note text, p_ref text default null) returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_delta = 0 then return false; end if;
  if p_ref is not null and exists (select 1 from public.points_ledger where ref = p_ref) then return false; end if;
  update public.profiles set points = points + p_delta,
    lifetime_points = lifetime_points + case when p_delta > 0 and p_kind in ('order', 'review', 'bonus') then p_delta else 0 end
  where id = p_user and points + p_delta >= 0;
  if not found then raise exception 'That would take the points balance below zero.' using errcode = 'P0001'; end if;
  insert into public.points_ledger (user_id, delta, kind, note, ref) values (p_user, p_delta, p_kind, left(coalesce(p_note, ''), 200), p_ref);
  return true;
end $$;

create or replace function public._need_admin() returns void language plpgsql stable security definer set search_path = public, pg_temp as $$
begin if not public.is_admin() then raise exception 'Admins only.' using errcode = '42501'; end if; end $$;

/* ---------------- delivery hook: customer points and rider earnings ---------------- */
create or replace function public._on_delivered() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare cfg jsonb := public.points_cfg(); pc jsonb := public.rider_pay_cfg(); lt int; mult numeric; pts int; r public.riders; pct int; cm int;
begin
  if new.stage = 'delivered' and old.stage is distinct from 'delivered' then
    if new.customer_id is not null and coalesce((cfg->>'enabled')::boolean, true) then
      select lifetime_points into lt from public.profiles where id = new.customer_id;
      mult := coalesce((public.points_tier(coalesce(lt, 0))->>'mult')::numeric, 1);
      pts := floor(new.subtotal::numeric / greatest((cfg->>'earnPer')::int, 1) * mult);
      if pts > 0 then perform public._points_add(new.customer_id, pts, 'order', 'Order ' || new.id, 'order:' || new.id); end if;
    end if;
    if new.rider_id is not null then
      select * into r from public.riders where user_id = new.rider_id;
      if found then
        if r.pay_model = 'fleet' then
          insert into public.rider_earnings (order_id, rider_id, model) values (new.id, new.rider_id, 'fleet') on conflict do nothing;
        else
          pct := coalesce((pc->'commission'->>r.tier)::int, 15);
          cm := round(new.delivery_fee * pct / 100.0);
          insert into public.rider_earnings (order_id, rider_id, model, fare, commission, net) values (new.id, new.rider_id, 'partner', new.delivery_fee, cm, new.delivery_fee - cm) on conflict do nothing;
        end if;
      end if;
    end if;
  end if;
  return new;
end $$;
create trigger orders_delivered after update of stage on public.orders for each row execute function public._on_delivered();

-- Review points now go through the ledger (same amount rules as before, read from the points settings).
create or replace function public.submit_review(p_order text, p_merchant_up boolean, p_merchant_tags text[], p_rider_up boolean, p_rider_tags text[], p_body text default '') returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare o public.orders; pts int := coalesce((public.points_cfg()->>'reviewPoints')::int, 50);
begin
  select * into o from public.orders where id = p_order and customer_id = auth.uid() for update;
  if not found then raise exception 'Order not found.'; end if;
  if o.stage <> 'delivered' then raise exception 'You can review an order once it is delivered.'; end if;
  if o.reviewed then raise exception 'You have already reviewed this order.'; end if;
  if p_merchant_up is null and p_rider_up is null then raise exception 'Tap a thumb for the restaurant or your rider first.'; end if;
  insert into public.reviews (order_id, user_id, merchant_up, merchant_tags, rider_up, rider_tags, body)
  values (p_order, auth.uid(), p_merchant_up, coalesce(p_merchant_tags, '{}'), p_rider_up, coalesce(p_rider_tags, '{}'), left(coalesce(p_body, ''), 400));
  update public.orders set reviewed = true where id = p_order;
  if p_merchant_up is not null then
    update public.merchants set rating_pct = round((rating_pct * rating_count + case when p_merchant_up then 100 else 0 end) / (rating_count + 1.0))::int, rating_count = rating_count + 1 where id = o.merchant_id;
  end if;
  if p_rider_up is not null and o.rider_id is not null then
    update public.riders set rating_pct = round((rating_pct * rating_count + case when p_rider_up then 100 else 0 end) / (rating_count + 1.0))::int, rating_count = rating_count + 1 where user_id = o.rider_id;
  end if;
  if pts > 0 then perform public._points_add(auth.uid(), pts, 'review', 'Review for ' || p_order, 'review:' || p_order); end if;
  return pts;
end $$;

/* ---------------- customer: redeem points into wallet ---------------- */
create or replace function public.redeem_points(p_points int) returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare cfg jsonb := public.points_cfg(); val numeric := (cfg->>'pointValue')::numeric; naira int;
begin
  if auth.uid() is null then raise exception 'Sign in first.'; end if;
  if not coalesce((cfg->>'enabled')::boolean, true) then raise exception 'Points are paused right now.'; end if;
  if p_points is null or p_points < (cfg->>'minRedeem')::int then raise exception 'You can redeem from % points.', cfg->>'minRedeem'; end if;
  if p_points % greatest((cfg->>'stepRedeem')::int, 1) <> 0 then raise exception 'Redeem in steps of % points.', cfg->>'stepRedeem'; end if;
  naira := floor(p_points * val);
  if naira < 1 then raise exception 'Nothing to redeem.'; end if;
  perform public._points_add(auth.uid(), -p_points, 'redeem', 'Redeemed to wallet');
  perform public._credit(auth.uid(), naira, 'Points redeemed');
  return naira;
end $$;

/* ---------------- admin: customers ---------------- */
create or replace function public.admin_customers(p_search text default '', p_limit int default 50, p_offset int default 0) returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare q text := '%' || lower(btrim(coalesce(p_search, ''))) || '%'; total int; rows jsonb; stats jsonb;
begin
  perform public._need_admin();
  select count(*) into total from public.profiles p where p.role = 'customer' and (lower(p.full_name || ' ' || coalesce(p.email, '') || ' ' || coalesce(p.phone, '')) like q);
  select coalesce(jsonb_agg(x), '[]'::jsonb) into rows from (
    select p.id, p.full_name as name, p.email, p.phone, coalesce(w.balance, 0) as balance, p.points, p.lifetime_points as lifetime,
      public.points_tier(p.lifetime_points)->>'name' as tier, p.created_at as joined,
      (select count(*) from public.orders o where o.customer_id = p.id and o.stage = 'delivered') as orders,
      (select coalesce(sum(o.total), 0) from public.orders o where o.customer_id = p.id and o.stage = 'delivered') as spent
    from public.profiles p left join public.wallets w on w.user_id = p.id
    where p.role = 'customer' and (lower(p.full_name || ' ' || coalesce(p.email, '') || ' ' || coalesce(p.phone, '')) like q)
    order by p.created_at desc limit least(greatest(p_limit, 1), 200) offset greatest(p_offset, 0)) x;
  select jsonb_build_object('customers', (select count(*) from public.profiles where role = 'customer'),
    'walletTotal', (select coalesce(sum(w.balance), 0) from public.wallets w join public.profiles p on p.id = w.user_id where p.role = 'customer'),
    'pointsOutstanding', (select coalesce(sum(points), 0) from public.profiles where role = 'customer')) into stats;
  return jsonb_build_object('total', total, 'rows', rows, 'stats', stats);
end $$;

create or replace function public.admin_customer_ledger(p_user uuid) returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  perform public._need_admin();
  return jsonb_build_object(
    'wallet', (select coalesce(jsonb_agg(t order by t.created_at desc), '[]'::jsonb) from (select title, amount, dir, created_at from public.wallet_txs where user_id = p_user order by created_at desc limit 30) t),
    'points', (select coalesce(jsonb_agg(t order by t.created_at desc), '[]'::jsonb) from (select note, delta, kind, created_at from public.points_ledger where user_id = p_user order by created_at desc limit 30) t));
end $$;

-- p_dir: 1 = top up, -1 = deduct. A reason is required and shown to the customer in their wallet history.
create or replace function public.admin_wallet_adjust(p_user uuid, p_amount int, p_dir int, p_reason text) returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare why text := btrim(coalesce(p_reason, '')); bal int;
begin
  perform public._need_admin();
  if p_dir not in (1, -1) then raise exception 'Choose top up or deduct.'; end if;
  if p_amount is null or p_amount < 1 or p_amount > 1000000 then raise exception 'Enter an amount from ₦1 to ₦1,000,000.'; end if;
  if length(why) < 3 then raise exception 'Add a short reason. The customer sees it in their wallet history.'; end if;
  if not exists (select 1 from public.profiles where id = p_user and role = 'customer') then raise exception 'Customer not found.'; end if;
  if p_dir = 1 then perform public._credit(p_user, p_amount, 'ChowBuy top-up: ' || left(why, 80));
  else
    update public.wallets set balance = balance - p_amount where user_id = p_user and balance >= p_amount;
    if not found then raise exception 'The balance is lower than the amount you are deducting.'; end if;
    insert into public.wallet_txs (user_id, title, amount, dir) values (p_user, 'ChowBuy adjustment: ' || left(why, 80), p_amount, -1);
  end if;
  select balance into bal from public.wallets where user_id = p_user;
  perform public.log_audit('wallet_adjust', jsonb_build_object('user', p_user, 'amount', p_amount, 'dir', p_dir, 'reason', why));
  return bal;
end $$;

create or replace function public.admin_points_adjust(p_user uuid, p_delta int, p_reason text) returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare why text := btrim(coalesce(p_reason, '')); pts int;
begin
  perform public._need_admin();
  if p_delta is null or p_delta = 0 or abs(p_delta) > 1000000 then raise exception 'Enter a points amount (not zero, up to 1,000,000).'; end if;
  if length(why) < 3 then raise exception 'Add a short reason.'; end if;
  if not exists (select 1 from public.profiles where id = p_user and role = 'customer') then raise exception 'Customer not found.'; end if;
  perform public._points_add(p_user, p_delta, case when p_delta > 0 then 'bonus' else 'admin' end, 'ChowBuy: ' || left(why, 100));
  select points into pts from public.profiles where id = p_user;
  perform public.log_audit('points_adjust', jsonb_build_object('user', p_user, 'delta', p_delta, 'reason', why));
  return pts;
end $$;

/* ---------------- admin: rider pay ---------------- */
create or replace function public.admin_rider_set_pay(p_rider uuid, p_model text, p_salary int, p_tier text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public._need_admin();
  if p_model not in ('fleet', 'partner') then raise exception 'Pay model must be fleet or partner.'; end if;
  if p_model = 'fleet' and (p_salary is null or p_salary < 1) then raise exception 'Set a monthly salary for a fleet rider.'; end if;
  update public.riders set pay_model = p_model, monthly_salary = case when p_model = 'fleet' then p_salary else 0 end, tier = coalesce(p_tier, tier) where user_id = p_rider;
  if not found then raise exception 'Rider not found.'; end if;
  perform public.log_audit('rider_pay', jsonb_build_object('rider', p_rider, 'model', p_model, 'salary', p_salary, 'tier', p_tier));
end $$;

create or replace function public.admin_rider_pay_summary(p_days int default 30) returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  perform public._need_admin();
  return coalesce((select jsonb_agg(x) from (
    select r.user_id as id, r.name, r.pay_model as model, r.monthly_salary as salary, r.tier,
      count(e.order_id) as deliveries, coalesce(sum(e.net), 0) as partner_net, coalesce(sum(e.commission), 0) as commission,
      (select coalesce(sum(o.tip), 0) from public.orders o where o.rider_id = r.user_id and o.stage = 'delivered' and o.created_at > now() - make_interval(days => p_days)) as tips
    from public.riders r left join public.rider_earnings e on e.rider_id = r.user_id and e.created_at > now() - make_interval(days => p_days)
    group by r.user_id order by r.name) x), '[]'::jsonb);
end $$;

/* ---------------- public config: loyalty block now carries the whole points programme ---------------- */
create or replace function public.get_public_config() returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select public.setting('public', '{}'::jsonb) || jsonb_build_object('auth', coalesce(public.setting('public', '{}'::jsonb)->'auth', jsonb_build_object('google', jsonb_build_object('enabled', false), 'apple', jsonb_build_object('enabled', false))))
         || jsonb_build_object('gateways', coalesce(public.setting('public', '{}'::jsonb)->'gateways', jsonb_build_object('korapay', jsonb_build_object('enabled', true, 'publicKey', '', 'live', false), 'pocketfi', jsonb_build_object('enabled', true, 'live', false),
              'cod', jsonb_build_object('enabled', true, 'maxAmount', 20000), 'wallet', jsonb_build_object('enabled', true))),
            'realtime', coalesce(public.setting('public', '{}'::jsonb)->'realtime', jsonb_build_object('provider', 'off')),
            'push', coalesce(public.setting('public', '{}'::jsonb)->'push', jsonb_build_object('fcmEnabled', false)),
            'maps', coalesce(public.setting('public', '{}'::jsonb)->'maps', jsonb_build_object('directionsViaProxy', true)),
            'loyalty', public.points_cfg())
$$;

/* ---------------- privileges: nothing is callable unless listed ---------------- */
revoke all on function public.points_cfg(), public.rider_pay_cfg(), public.points_tier(int), public._points_add(uuid, int, text, text, text), public._need_admin(),
  public._on_delivered(), public.redeem_points(int), public.admin_customers(text, int, int), public.admin_customer_ledger(uuid),
  public.admin_wallet_adjust(uuid, int, int, text), public.admin_points_adjust(uuid, int, text), public.admin_rider_set_pay(uuid, text, int, text),
  public.admin_rider_pay_summary(int), public.submit_review(text, boolean, text[], boolean, text[], text), public.get_public_config() from public, anon, authenticated;
grant execute on function public.get_public_config() to anon, authenticated;
grant execute on function public.redeem_points(int), public.submit_review(text, boolean, text[], boolean, text[], text), public.admin_customers(text, int, int),
  public.admin_customer_ledger(uuid), public.admin_wallet_adjust(uuid, int, int, text), public.admin_points_adjust(uuid, int, text),
  public.admin_rider_set_pay(uuid, text, int, text), public.admin_rider_pay_summary(int) to authenticated;
