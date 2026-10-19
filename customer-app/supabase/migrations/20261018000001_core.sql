-- ChowBuy core schema. Money is whole naira (integer). Clients never write orders, wallets or points directly:
-- they call the RPC functions below, which run as the database owner and enforce every rule on the server.

-- On Supabase, pgcrypto lives in the `extensions` schema; functions that call gen_random_bytes put it on their search_path.
create extension if not exists pgcrypto;

create type user_role  as enum ('customer', 'merchant', 'rider', 'admin');
create type order_stage as enum ('received', 'preparing', 'rider_accepted', 'rider_at_store', 'in_transit', 'arrived', 'delivered', 'cancelled');
create type pay_method as enum ('korapay', 'pocketfi', 'cod', 'wallet');

/* ---------------- identity ---------------- */
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       user_role not null default 'customer',
  full_name  text not null default '',
  email      text,
  phone      text unique,                 -- normalised +234XXXXXXXXXX, used for wallet transfers
  points     int  not null default 0 check (points >= 0),
  push_token jsonb,
  created_at timestamptz not null default now()
);

create table public.wallets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  balance int not null default 0 check (balance >= 0)
);
create table public.wallet_txs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  amount     int  not null check (amount > 0),
  dir        smallint not null check (dir in (1, -1)),
  ref        text unique,                 -- idempotency key for gateway credits
  created_at timestamptz not null default now()
);
create index on public.wallet_txs (user_id, created_at desc);

create table public.addresses (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references public.profiles(id) on delete cascade,
  label    text not null check (label in ('Home', 'Office', 'Other')),
  line     text not null check (char_length(line) between 5 and 200),
  area     text not null,
  landmark text,
  lat      double precision not null,
  lng      double precision not null,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public, pg_temp as
$$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;

create or replace function public.norm_ng_phone(raw text) returns text language plpgsql immutable set search_path = pg_catalog, pg_temp as $$
declare d text := regexp_replace(coalesce(raw, ''), '\D', '', 'g');
begin
  if d like '234%' then d := substr(d, 4); elsif d like '0%' then d := substr(d, 2); end if;
  if d ~ '^[789][01][0-9]{8}$' then return '+234' || d; end if;
  return null;
end $$;

-- New auth user => customer profile + wallet. The role is never read from client-supplied metadata.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare ph text := public.norm_ng_phone(new.raw_user_meta_data->>'phone');
begin
  -- A phone number already on another account must not block sign-up (it would leave the user without a profile): store it empty.
  if ph is not null and exists (select 1 from public.profiles where phone = ph) then ph := null; end if;
  insert into public.profiles (id, email, full_name, phone)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), ph)
  on conflict do nothing;
  insert into public.wallets (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

/* ---------------- catalogue ---------------- */
create table public.merchants (
  id text primary key, owner_id uuid references public.profiles(id),
  name text not null, vertical text not null check (vertical in ('restaurant', 'grocery', 'pharmacy', 'package')),
  cuisine text[] not null default '{}', image text, rating_pct int not null default 0, rating_count int not null default 0,
  eta_min int not null default 15, eta_max int not null default 30, distance_km numeric(5,1) not null default 0,
  delivery_fee int not null default 500, discount_pct int, open boolean not null default true, hours text,
  lat double precision not null, lng double precision not null, area text, active boolean not null default true
);
create table public.products (
  id text primary key, merchant_id text not null references public.merchants(id) on delete cascade,
  name text not null, descr text not null default '', price int not null check (price >= 0), image text,
  category text not null default '', modifiers jsonb not null default '[]', rx boolean not null default false,
  controlled boolean not null default false, in_stock boolean not null default true
);
create index on public.products (merchant_id);

create table public.promos (code text primary key, pct int not null check (pct between 1 and 90), active boolean not null default true, expires_at timestamptz);

create table public.riders (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  name text not null, plate text not null, vehicle text not null check (vehicle in ('Bike', 'Car')),
  rating_pct int not null default 95, rating_count int not null default 0, verified boolean not null default false,
  proxy_phone text not null, online boolean not null default false
);

/* ---------------- orders ---------------- */
create sequence public.order_seq start 84900;
create table public.orders (
  id text primary key default ('CB-' || nextval('public.order_seq')),
  customer_id uuid references public.profiles(id) on delete set null,   -- set null keeps financial records when an account is deleted
  merchant_id text not null references public.merchants(id),
  lines jsonb not null, subtotal int not null, delivery_fee int not null, service_fee int not null, discount int not null default 0, total int not null,
  promo_code text, pay pay_method not null, paid boolean not null default false, paid_at timestamptz, paid_by text,
  address jsonb not null,
  stage order_stage not null default 'received', stage_times jsonb not null default '{}',
  rider_id uuid references public.profiles(id), rider jsonb, rider_pos jsonb, rider_heading int, route jsonb,
  eta_minutes int not null, latest_by timestamptz not null, reviewed boolean not null default false, tip int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.orders (customer_id, created_at desc);
create index on public.orders (merchant_id, created_at desc);
create index on public.orders (rider_id);

-- The delivery code is readable by the customer only. Riders must type it; they can never read it.
create table public.order_secrets (order_id text primary key references public.orders(id) on delete cascade, otp text not null, attempts int not null default 0);

create table public.payments (
  reference text primary key, user_id uuid references public.profiles(id) on delete set null, order_id text references public.orders(id),
  purpose text not null check (purpose in ('order', 'topup')), method pay_method not null, amount int not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')), provider_ref text, meta jsonb,
  created_at timestamptz not null default now()
);
create table public.payment_links (
  token text primary key, order_id text not null references public.orders(id) on delete cascade, amount int not null,
  expires_at timestamptz not null, status text not null default 'open' check (status in ('open', 'paid', 'expired')), paid_by text,
  created_at timestamptz not null default now()
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(), order_id text not null references public.orders(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null, sender_role text not null check (sender_role in ('customer', 'rider', 'support', 'system')),
  body text not null check (char_length(body) between 1 and 500), flags text[] not null default '{}', reviewed boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.chat_messages (order_id, created_at);
create table public.chat_locks (order_id text primary key references public.orders(id) on delete cascade, locked_by uuid, at timestamptz not null default now());
create table public.chat_filters (id text primary key, name text not null, enabled boolean not null default true, action text not null check (action in ('block', 'mask', 'flag')), words text[] not null default '{}', builtin boolean not null default false);

create table public.reviews (
  order_id text primary key references public.orders(id) on delete cascade, user_id uuid references public.profiles(id) on delete set null,
  merchant_up boolean, merchant_tags text[] not null default '{}', rider_up boolean, rider_tags text[] not null default '{}', body text not null default '',
  created_at timestamptz not null default now()
);
create table public.rx_uploads (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  path text not null, status text not null default 'pending' check (status in ('pending', 'clarify', 'verified', 'rejected')), note text,
  created_at timestamptz not null default now()
);

/* ---------------- admin-managed settings ---------------- */
create table public.platform_settings (key text primary key, value jsonb not null, updated_at timestamptz not null default now());
-- Secrets: no policy and no grant for anon/authenticated. Only Edge Functions (service role) can read or write.
create table public.platform_secrets (key text primary key, value text not null, hint text, updated_at timestamptz not null default now());
create table public.audit_log (id bigserial primary key, actor uuid, action text not null, meta jsonb, at timestamptz not null default now());

/* ---------------- privileges + RLS ---------------- */
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on public.profiles, public.wallets, public.wallet_txs, public.addresses, public.merchants, public.products, public.riders,
  public.orders, public.order_secrets, public.payments, public.payment_links, public.chat_messages, public.chat_locks, public.reviews,
  public.rx_uploads, public.platform_settings, public.audit_log, public.chat_filters, public.promos to authenticated;
grant select on public.merchants, public.products to anon;
grant update (full_name, phone, push_token) on public.profiles to authenticated;       -- role and points are not client-writable
grant insert, update, delete on public.addresses to authenticated;
grant insert on public.rx_uploads to authenticated;
grant insert, update, delete on public.merchants, public.products to authenticated;     -- gated by RLS (owner or admin)
grant insert, update, delete on public.platform_settings, public.chat_filters, public.promos to authenticated;  -- gated by is_admin()
grant update (status, note) on public.rx_uploads to authenticated;                       -- admin only via RLS

do $$ declare t text; begin
  foreach t in array array['profiles','wallets','wallet_txs','addresses','merchants','products','promos','riders','orders','order_secrets','payments','payment_links','chat_messages','chat_locks','chat_filters','reviews','rx_uploads','platform_settings','platform_secrets','audit_log']
  loop execute format('alter table public.%I enable row level security', t); end loop;
end $$;

create policy profiles_self   on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy profiles_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy wallets_self    on public.wallets for select using (user_id = auth.uid() or public.is_admin());
create policy walletx_self    on public.wallet_txs for select using (user_id = auth.uid() or public.is_admin());
create policy addr_own        on public.addresses for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy merchants_read  on public.merchants for select using (active or owner_id = auth.uid() or public.is_admin());
create policy merchants_write on public.merchants for all using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());
create policy products_read   on public.products for select using (true);
create policy products_write  on public.products for all
  using (public.is_admin() or exists (select 1 from public.merchants m where m.id = merchant_id and m.owner_id = auth.uid()))
  with check (public.is_admin() or exists (select 1 from public.merchants m where m.id = merchant_id and m.owner_id = auth.uid()));
create policy promos_admin    on public.promos for all using (public.is_admin()) with check (public.is_admin());
create policy riders_self     on public.riders for select using (user_id = auth.uid() or public.is_admin());

create policy orders_customer on public.orders for select using (customer_id = auth.uid());
create policy orders_rider    on public.orders for select using (rider_id = auth.uid());
create policy orders_merchant on public.orders for select using ((paid or pay = 'cod') and exists (select 1 from public.merchants m where m.id = merchant_id and m.owner_id = auth.uid()));
create policy orders_admin    on public.orders for select using (public.is_admin());
create policy secrets_customer on public.order_secrets for select using (exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid()));
create policy payments_self   on public.payments for select using (user_id = auth.uid() or public.is_admin());
create policy links_owner     on public.payment_links for select using (exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid()) or public.is_admin());

create policy chat_read on public.chat_messages for select using (
  public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = auth.uid() or o.rider_id = auth.uid())));
create policy locks_read on public.chat_locks for select using (
  public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = auth.uid() or o.rider_id = auth.uid())));
create policy filters_admin on public.chat_filters for all using (public.is_admin()) with check (public.is_admin());
create policy reviews_read  on public.reviews for select using (user_id = auth.uid() or public.is_admin());
create policy rx_own_read   on public.rx_uploads for select using (user_id = auth.uid() or public.is_admin());
create policy rx_own_ins    on public.rx_uploads for insert with check (user_id = auth.uid() and status = 'pending');
create policy rx_admin_upd  on public.rx_uploads for update using (public.is_admin()) with check (public.is_admin());
create policy settings_read  on public.platform_settings for select using (public.is_admin());
create policy settings_write on public.platform_settings for all using (public.is_admin()) with check (public.is_admin());
create policy audit_admin    on public.audit_log for select using (public.is_admin());
-- platform_secrets intentionally has no policy.

/* ---------------- helpers ---------------- */
create or replace function public.now_ms() returns bigint language sql stable set search_path = pg_catalog, pg_temp as $$ select (extract(epoch from clock_timestamp()) * 1000)::bigint $$;
create or replace function public.setting(p_key text, p_default jsonb default null) returns jsonb language sql stable security definer set search_path = public, pg_temp as
$$ select coalesce((select value from public.platform_settings where key = p_key), p_default) $$;

create or replace function public.log_audit(p_action text, p_meta jsonb default '{}') returns void language sql security definer set search_path = public, pg_temp as
$$ insert into public.audit_log (actor, action, meta) values (auth.uid(), p_action, p_meta) $$;

/* ---------------- wallet ---------------- */
-- Atomic debit. Raises when the balance is too low.
create or replace function public._debit(p_user uuid, p_amount int, p_title text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.wallets set balance = balance - p_amount where user_id = p_user and balance >= p_amount;
  if not found then raise exception 'Your wallet balance is too low for this payment.' using errcode = 'P0001'; end if;
  insert into public.wallet_txs (user_id, title, amount, dir) values (p_user, p_title, p_amount, -1);
end $$;
create or replace function public._credit(p_user uuid, p_amount int, p_title text, p_ref text default null) returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_ref is not null and exists (select 1 from public.wallet_txs where ref = p_ref) then return false; end if;   -- already credited
  update public.wallets set balance = balance + p_amount where user_id = p_user;
  insert into public.wallet_txs (user_id, title, amount, dir, ref) values (p_user, p_title, p_amount, 1, p_ref);
  return true;
end $$;

-- Gateway-confirmed top-up. Called only by the payment webhook (service role).
create or replace function public.credit_wallet(p_user uuid, p_amount int, p_ref text) returns boolean language sql security definer set search_path = public, pg_temp as
$$ select public._credit(p_user, p_amount, 'Wallet top-up', p_ref) $$;

create or replace function public.wallet_send(p_phone text, p_amount int) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); n text := public.norm_ng_phone(p_phone); rcpt uuid; nm text;
begin
  if uid is null then raise exception 'Sign in first.'; end if;
  if p_amount is null or p_amount < 100 then raise exception 'Minimum transfer is ₦100.'; end if;
  if p_amount > 500000 then raise exception 'Maximum single transfer is ₦500,000.'; end if;
  if n is null then raise exception 'Enter a valid Nigerian mobile number.'; end if;
  select id, full_name into rcpt, nm from public.profiles where phone = n;
  if rcpt is null then raise exception 'No ChowBuy wallet found for that number.'; end if;
  if rcpt = uid then raise exception 'You cannot send money to yourself.'; end if;
  perform public._debit(uid, p_amount, 'Sent to ' || n);
  perform public._credit(rcpt, p_amount, 'Received from ' || coalesce(nullif((select full_name from public.profiles where id = uid), ''), 'a ChowBuy user'));
end $$;

/* ---------------- placing an order (server-side pricing) ---------------- */
create or replace function public.place_order(p_merchant text, p_lines jsonb, p_pay pay_method, p_address uuid, p_promo text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  uid uuid := auth.uid(); m public.merchants; a public.addresses; l jsonb; prod public.products; grp jsonb; opt jsonb;
  qty int; unit int; sub int := 0; cnt int; mods_out jsonb; lines_out jsonb := '[]'; ids_expected int; v_pct int := 0; disc int; dlv int; svc int; tot int;
  cod_max int := coalesce((public.setting('public', '{}')->'gateways'->'cod'->>'maxAmount')::int, 20000);
  gw jsonb := coalesce(public.setting('public', '{}')->'gateways'->p_pay::text, '{"enabled": true}');
  o public.orders; v_otp text; eta int; ms bigint := public.now_ms(); keyparts text;
begin
  if uid is null then raise exception 'Sign in to place an order.'; end if;
  if coalesce((gw->>'enabled')::boolean, true) = false then raise exception 'That payment method is not available right now.'; end if;
  select * into m from public.merchants where id = p_merchant and active;
  if not found then raise exception 'That store is not available.'; end if;
  if not m.open then raise exception '% is closed right now.', m.name; end if;
  select * into a from public.addresses where id = p_address and user_id = uid;
  if not found then raise exception 'Choose a delivery address.'; end if;
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then raise exception 'Your basket is empty.'; end if;
  if jsonb_array_length(p_lines) > 40 then raise exception 'Too many items in one order.'; end if;

  for l in select * from jsonb_array_elements(p_lines) loop
    qty := (l->>'qty')::int;
    if qty is null or qty < 1 or qty > 50 then raise exception 'Invalid quantity.'; end if;
    select * into prod from public.products where id = l->>'product_id' and merchant_id = p_merchant;
    if not found or not prod.in_stock then raise exception 'An item in your basket is no longer available.'; end if;
    if prod.rx and not exists (select 1 from public.rx_uploads where user_id = uid and status = 'verified') then
      raise exception 'A verified prescription is required for %.', prod.name; end if;
    unit := prod.price; mods_out := '[]'; ids_expected := coalesce(jsonb_array_length(l->'mod_ids'), 0);
    for grp in select * from jsonb_array_elements(prod.modifiers) loop
      cnt := 0;
      for opt in select * from jsonb_array_elements(grp->'options') loop
        if coalesce((l->'mod_ids') ? (opt->>'id'), false) then cnt := cnt + 1; unit := unit + (opt->>'price')::int; mods_out := mods_out || jsonb_build_array(opt); end if;
      end loop;
      if (grp->>'required')::boolean and cnt < 1 then raise exception 'Choose an option for %.', grp->>'name'; end if;
      if not (grp->>'multi')::boolean and cnt > 1 then raise exception '%: pick only one.', grp->>'name'; end if;
      if (grp->>'multi')::boolean and coalesce((grp->>'max')::int, 0) > 0 and cnt > (grp->>'max')::int then raise exception '%: pick at most %.', grp->>'name', grp->>'max'; end if;
    end loop;
    if jsonb_array_length(mods_out) <> ids_expected then raise exception 'An option you chose is no longer available.'; end if;
    select string_agg(x->>'id', ',' order by x->>'id') into keyparts from jsonb_array_elements(mods_out) x;
    lines_out := lines_out || jsonb_build_object('key', prod.id || '|' || coalesce(keyparts, '') || '|' || lower(coalesce(left(l->>'note', 140), '')),
      'productId', prod.id, 'merchantId', m.id, 'name', prod.name, 'unitPrice', unit, 'qty', qty, 'mods', mods_out, 'note', nullif(left(l->>'note', 140), ''));
    sub := sub + unit * qty;
  end loop;

  if p_promo is not null and btrim(p_promo) <> '' then
    select pct into v_pct from public.promos where code = upper(btrim(p_promo)) and active and (expires_at is null or expires_at > now());
    if not found then raise exception 'That promo code is not valid or has expired.'; end if;
  end if;
  disc := round(sub * v_pct / 100.0);
  dlv  := case when sub >= 10000 then 0 else m.delivery_fee + case when sub < 2000 then 300 else 0 end end;
  svc  := least(300, round(sub * 0.03));
  tot  := greatest(0, sub - disc + dlv + svc);
  if p_pay = 'cod' and tot > cod_max then raise exception 'Cash on delivery is available up to ₦%. Pay by card, transfer or wallet.', cod_max; end if;

  eta := round((m.eta_min + m.eta_max) / 2.0);
  insert into public.orders (customer_id, merchant_id, lines, subtotal, delivery_fee, service_fee, discount, total, promo_code, pay, address, stage_times, eta_minutes, latest_by)
  values (uid, m.id, lines_out, sub, dlv, svc, disc, tot, case when v_pct > 0 then upper(btrim(p_promo)) end, p_pay,
          jsonb_build_object('id', a.id, 'label', a.label, 'line', a.line, 'area', a.area, 'landmark', a.landmark, 'location', jsonb_build_object('latitude', a.lat, 'longitude', a.lng)),
          jsonb_build_object('received', ms), eta, now() + make_interval(mins => eta + 12))
  returning * into o;
  v_otp := (1000 + (abs(('x' || encode(gen_random_bytes(4), 'hex'))::bit(32)::bigint) % 9000))::text;
  insert into public.order_secrets (order_id, otp) values (o.id, v_otp);

  if p_pay = 'wallet' then
    perform public._debit(uid, tot, 'Order ' || o.id);
    update public.orders set paid = true, paid_at = now(), paid_by = 'wallet' where id = o.id returning * into o;
  end if;
  return jsonb_build_object('order', to_jsonb(o), 'otp', v_otp);
end $$;

-- Gateway or sponsor payment confirmed. Service role only.
create or replace function public.mark_order_paid(p_order text, p_by text default null) returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.orders set paid = true, paid_at = now(), paid_by = coalesce(p_by, paid_by) where id = p_order and not paid;
  if not found then return false; end if;
  update public.payment_links set status = 'paid', paid_by = p_by where order_id = p_order and status = 'open';
  return true;
end $$;

create or replace function public.create_payment_link(p_order text) returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare o public.orders; tok text := encode(gen_random_bytes(9), 'hex'); l public.payment_links;
begin
  select * into o from public.orders where id = p_order and customer_id = auth.uid();
  if not found then raise exception 'Order not found.'; end if;
  if o.paid then raise exception 'This order is already paid.'; end if;
  update public.payment_links set status = 'expired' where order_id = o.id and status = 'open';
  insert into public.payment_links (token, order_id, amount, expires_at) values (tok, o.id, o.total, now() + interval '24 hours') returning * into l;
  return to_jsonb(l);
end $$;

-- A sponsor pays someone else's order from their own wallet.
create or replace function public.pay_link_with_wallet(p_token text) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare l public.payment_links; uid uuid := auth.uid(); nm text;
begin
  if uid is null then raise exception 'Sign in to pay with your wallet.'; end if;
  select * into l from public.payment_links where token = p_token for update;
  if not found or l.status <> 'open' or l.expires_at <= now() then raise exception 'This payment link has expired.'; end if;
  select coalesce(nullif(full_name, ''), 'A friend') into nm from public.profiles where id = uid;
  perform public._debit(uid, l.amount, 'Paid order ' || l.order_id || ' for a friend');
  perform public.mark_order_paid(l.order_id, nm);
  return jsonb_build_object('order_id', l.order_id, 'paid_by', nm);
end $$;

/* ---------------- fulfilment (merchant, rider, customer) ---------------- */
create or replace function public._set_stage(p_order text, p_stage order_stage) returns void language sql security definer set search_path = public, pg_temp as $$
  update public.orders set stage = p_stage, stage_times = stage_times || jsonb_build_object(p_stage::text, public.now_ms())
  where id = p_order and stage < p_stage and stage <> 'cancelled'
$$;

create or replace function public.merchant_set_stage(p_order text, p_stage order_stage) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_stage not in ('preparing', 'cancelled') then raise exception 'Merchants can only start preparing or cancel.'; end if;
  if not exists (select 1 from public.orders o join public.merchants m on m.id = o.merchant_id where o.id = p_order and m.owner_id = auth.uid() and (o.paid or o.pay = 'cod'))
    and not public.is_admin() then raise exception 'Order not found.'; end if;
  if p_stage = 'cancelled' then
    update public.orders set stage = 'cancelled', stage_times = stage_times || jsonb_build_object('cancelled', public.now_ms()) where id = p_order and stage in ('received', 'preparing');
    if not found then raise exception 'This order can no longer be cancelled.'; end if;
  else perform public._set_stage(p_order, p_stage); end if;
end $$;

create or replace function public.rider_accept(p_order text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare r public.riders;
begin
  select * into r from public.riders where user_id = auth.uid() and verified;
  if not found then raise exception 'Only verified riders can accept orders.'; end if;
  update public.orders set rider_id = r.user_id,
    rider = jsonb_build_object('id', r.user_id, 'name', r.name, 'plate', r.plate, 'vehicle', r.vehicle, 'rating', r.rating_pct, 'verified', r.verified, 'proxyPhone', r.proxy_phone)
  where id = p_order and rider_id is null and stage in ('received', 'preparing') and (paid or pay = 'cod');
  if not found then raise exception 'This order is no longer available.'; end if;
  perform public._set_stage(p_order, 'rider_accepted');
end $$;

create or replace function public.rider_set_stage(p_order text, p_stage order_stage) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_stage not in ('rider_at_store', 'in_transit', 'arrived') then raise exception 'Invalid stage for a rider.'; end if;
  if not exists (select 1 from public.orders where id = p_order and rider_id = auth.uid()) then raise exception 'Order not found.'; end if;
  perform public._set_stage(p_order, p_stage);
end $$;

create or replace function public.rider_move(p_order text, p_lat double precision, p_lng double precision, p_heading int, p_eta int) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.orders set rider_pos = jsonb_build_object('latitude', p_lat, 'longitude', p_lng), rider_heading = ((p_heading % 360) + 360) % 360, eta_minutes = greatest(0, p_eta)
  where id = p_order and rider_id = auth.uid() and stage in ('rider_at_store', 'in_transit', 'arrived');
  if not found then raise exception 'Order not found.'; end if;
end $$;

-- The only way to finish a delivery: the rider enters the customer's 4-digit code. Five wrong tries lock it for support.
create or replace function public.complete_delivery(p_order text, p_otp text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare s public.order_secrets;
begin
  if not exists (select 1 from public.orders where id = p_order and rider_id = auth.uid() and stage in ('in_transit', 'arrived')) then raise exception 'Order not found.'; end if;
  select * into s from public.order_secrets where order_id = p_order for update;
  if s.attempts >= 5 then raise exception 'Too many wrong codes. Contact ChowBuy support.'; end if;
  if s.otp <> btrim(coalesce(p_otp, '')) then
    update public.order_secrets set attempts = attempts + 1 where order_id = p_order;
    raise exception 'That code is not correct. Ask the customer to check their app.';
  end if;
  perform public._set_stage(p_order, 'delivered');
  update public.orders set paid = true, paid_at = coalesce(paid_at, now()), paid_by = coalesce(paid_by, 'cash') where id = p_order and not paid;   -- COD: cash collected
end $$;

create or replace function public.tip_rider(p_order text, p_amount int) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare o public.orders;
begin
  if p_amount is null or p_amount < 100 or p_amount > 20000 then raise exception 'Tips are between ₦100 and ₦20,000.'; end if;
  select * into o from public.orders where id = p_order and customer_id = auth.uid() and rider_id is not null for update;
  if not found then raise exception 'There is no rider to tip on this order yet.'; end if;
  perform public._debit(auth.uid(), p_amount, 'Tip for ' || (o.rider->>'name'));
  perform public._credit(o.rider_id, p_amount, 'Tip from order ' || o.id);
  update public.orders set tip = tip + p_amount where id = o.id;
end $$;

/* ---------------- chat with server-side screening ---------------- */
create or replace function public._screen(p_text text) returns table (filter_id text, filter_name text, action text, masked text) language plpgsql stable security definer set search_path = public, pg_temp as $$
declare f public.chat_filters; w text; digits text := regexp_replace(p_text, '(?<=[0-9])[\s-]+(?=[0-9])', '', 'g'); hit boolean; out_text text := p_text;
begin
  for f in select * from public.chat_filters where enabled loop
    hit := false;
    if f.builtin then
      hit := digits ~ '(\+?234|\m0)[789][01][0-9]{8}';
      if hit then out_text := regexp_replace(out_text, '(\+?234|\m0)[\s-]?[789]([\s-]?[0-9]){9}', '•••••••••••', 'g'); end if;
    else
      foreach w in array f.words loop
        if w <> '' and p_text ~* ('(^|[^a-z0-9])' || regexp_replace(w, '([.*+?^${}()|\[\]\\])', '\\\1', 'g') || '([^a-z0-9]|$)') then
          hit := true; out_text := regexp_replace(out_text, regexp_replace(w, '([.*+?^${}()|\[\]\\])', '\\\1', 'g'), repeat('•', char_length(w)), 'gi');
        end if;
      end loop;
    end if;
    if hit then filter_id := f.id; filter_name := f.name; action := f.action; masked := out_text; return next; end if;
  end loop;
end $$;

create or replace function public.send_chat(p_order text, p_text text) returns public.chat_messages language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); o public.orders; role_ text; body text := btrim(coalesce(p_text, '')); r record; flags text[] := '{}'; shown text; msg public.chat_messages;
begin
  select * into o from public.orders where id = p_order and (customer_id = uid or rider_id = uid);
  if not found then raise exception 'Order not found.'; end if;
  if o.stage in ('delivered', 'cancelled') then raise exception 'This chat is closed because the order is complete.'; end if;
  if exists (select 1 from public.chat_locks where order_id = p_order) then raise exception 'This chat has been paused by ChowBuy support.'; end if;
  if char_length(body) < 1 then raise exception 'Type a message first.'; end if;
  if char_length(body) > 500 then raise exception 'Keep messages under 500 characters.'; end if;
  role_ := case when o.customer_id = uid then 'customer' else 'rider' end;
  shown := body;
  for r in select * from public._screen(body) loop
    if r.action = 'block' then
      raise exception '%', case r.filter_id when 'pay' then 'Please pay only through ChowBuy so your order stays protected.' when 'har' then 'That message breaks our community rules.' else 'For your privacy, share phone numbers by calling through ChowBuy instead.' end;
    elsif r.action = 'mask' then shown := r.masked; end if;
    flags := flags || r.filter_name;
  end loop;
  insert into public.chat_messages (order_id, sender_id, sender_role, body, flags) values (p_order, uid, role_, shown, flags) returning * into msg;
  return msg;
end $$;

create or replace function public.admin_chat_say(p_order text, p_text text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_admin() then raise exception 'Not allowed.'; end if;
  insert into public.chat_messages (order_id, sender_role, body) values (p_order, 'support', left(p_text, 500));
  perform public.log_audit('chat.support_message', jsonb_build_object('order', p_order));
end $$;
create or replace function public.admin_chat_lock(p_order text, p_lock boolean) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_admin() then raise exception 'Not allowed.'; end if;
  if p_lock then insert into public.chat_locks (order_id, locked_by) values (p_order, auth.uid()) on conflict do nothing; else delete from public.chat_locks where order_id = p_order; end if;
  perform public.log_audit(case when p_lock then 'chat.lock' else 'chat.unlock' end, jsonb_build_object('order', p_order));
end $$;
-- Emergency broadcast into every active chat, optionally limited to an area, e.g. 'Lekki'.
create or replace function public.admin_broadcast(p_area text, p_text text) returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare n int;
begin
  if not public.is_admin() then raise exception 'Not allowed.'; end if;
  insert into public.chat_messages (order_id, sender_role, body)
    select id, 'support', left(p_text, 500) from public.orders where stage not in ('delivered', 'cancelled') and (paid or pay = 'cod')
      and (coalesce(p_area, '') = '' or address->>'area' ilike '%' || p_area || '%');
  get diagnostics n = row_count;
  perform public.log_audit('chat.broadcast', jsonb_build_object('area', p_area, 'chats', n));
  return n;
end $$;

/* ---------------- reviews and loyalty ---------------- */
create or replace function public.submit_review(p_order text, p_merchant_up boolean, p_merchant_tags text[], p_rider_up boolean, p_rider_tags text[], p_body text default '') returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare o public.orders; pts int := coalesce((public.setting('public', '{}')->'loyalty'->>'reviewPoints')::int, 50);
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
  update public.profiles set points = points + pts where id = auth.uid();
  return pts;
end $$;

/* ---------------- public config for the apps (no secrets) ---------------- */
create or replace function public.get_public_config() returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select public.setting('public', jsonb_build_object(
    'gateways', jsonb_build_object('korapay', jsonb_build_object('enabled', true, 'publicKey', '', 'live', false), 'pocketfi', jsonb_build_object('enabled', true, 'live', false),
      'cod', jsonb_build_object('enabled', true, 'maxAmount', 20000), 'wallet', jsonb_build_object('enabled', true)),
    'realtime', jsonb_build_object('provider', 'off'), 'push', jsonb_build_object('fcmEnabled', false), 'maps', jsonb_build_object('directionsViaProxy', true),
    'loyalty', jsonb_build_object('reviewPoints', 50)))
$$;

/* ---------------- function privileges ---------------- */
-- Start from nothing (Supabase's default ACL would otherwise let anon/authenticated call everything), then grant only the public API.
do $$ declare f record; begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prokind = 'f' loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;
grant execute on function public.get_public_config(), public.is_admin(), public.norm_ng_phone(text) to anon, authenticated;
grant execute on function public.place_order(text, jsonb, pay_method, uuid, text), public.wallet_send(text, int), public.create_payment_link(text),
  public.pay_link_with_wallet(text), public.merchant_set_stage(text, order_stage), public.rider_accept(text), public.rider_set_stage(text, order_stage),
  public.rider_move(text, double precision, double precision, int, int), public.complete_delivery(text, text), public.tip_rider(text, int),
  public.send_chat(text, text), public.admin_chat_say(text, text), public.admin_chat_lock(text, boolean), public.admin_broadcast(text, text),
  public.submit_review(text, boolean, text[], boolean, text[], text) to authenticated;
-- credit_wallet, mark_order_paid, _debit, _credit, _set_stage, _screen, setting, log_audit, handle_new_user: no grants. Service role and the
-- database owner only.

/* ---------------- realtime ---------------- */
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.orders, public.chat_messages, public.chat_locks, public.payment_links, public.wallets, public.profiles, public.rx_uploads;
  end if;
end $$;

/* ---------------- storage: private bucket for prescription photos, one folder per user ---------------- */
do $$ begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public) values ('rx', 'rx', false) on conflict do nothing;
    execute $p$create policy rx_upload on storage.objects for insert to authenticated with check (bucket_id = 'rx' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
    execute $p$create policy rx_read on storage.objects for select to authenticated using (bucket_id = 'rx' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()))$p$;
  end if;
end $$;
