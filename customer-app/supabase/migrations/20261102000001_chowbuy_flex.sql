-- ChowBuy Flex: a third rider operating model next to Fleet (salaried) and Partner (commission).
-- Additive and safe to re-run. Existing riders keep their model; Flex is only ever set through rider_apply (new applicants who
-- choose Flex) or admin_rider_set_type (an audited admin action). Nothing here invents a rate, a legal text or a payout policy:
-- those are Flex settings an admin must fill in, and the server blocks Flex registration/dispatch until they exist.

/* ---------------- schema ---------------- */
do $$ declare c text; begin
  for c in select conname from pg_constraint where conrelid = 'public.riders'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%pay_model%' loop
    execute format('alter table public.riders drop constraint %I', c);
  end loop;
  for c in select conname from pg_constraint where conrelid = 'public.rider_earnings'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%model%' loop
    execute format('alter table public.rider_earnings drop constraint %I', c);
  end loop;
end $$;
alter table public.riders add constraint riders_pay_model_check check (pay_model in ('fleet', 'partner', 'flex'));
alter table public.rider_earnings add constraint rider_earnings_model_check check (model in ('fleet', 'partner', 'flex'));

alter table public.riders
  add column if not exists applied_model text check (applied_model in ('fleet', 'partner', 'flex')),
  add column if not exists flex_status text check (flex_status in ('draft', 'submitted', 'under_review', 'action_required', 'approved', 'rejected', 'suspended')),
  add column if not exists flex_city text,
  add column if not exists flex_settlement jsonb,                 -- {bank, accountName, accountNo, status:'pending_verification'}; never shown as verified until a provider confirms
  add column if not exists flex_agreement_version text,
  add column if not exists flex_agreement_at timestamptz,
  add column if not exists flex_submitted_at timestamptz,
  add column if not exists flex_paused boolean not null default false,
  add column if not exists flex_note text not null default '',
  add column if not exists flex_decided_by uuid references public.profiles(id),
  add column if not exists flex_decided_at timestamptz;
create index if not exists riders_flex_status_idx on public.riders (flex_status) where pay_model = 'flex';

alter table public.rider_earnings
  add column if not exists status text not null default 'confirmed' check (status in ('pending', 'confirmed', 'available', 'requested', 'processing', 'paid', 'failed', 'reversed')),
  add column if not exists tip int not null default 0 check (tip >= 0),
  add column if not exists incentive int not null default 0 check (incentive >= 0),
  add column if not exists provider_ref text;

drop policy if exists earnings_read on public.rider_earnings;
create policy earnings_read on public.rider_earnings for select using (public.is_admin() or (rider_id = auth.uid() and model in ('partner', 'flex')));

/* ---------------- Flex settings (platform_settings key 'flex') ---------------- */
create or replace function public.flex_cfg() returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'registrationEnabled', false, 'dispatchEnabled', false,
    'requireApproval', true, 'requireEmail', false, 'requirePhone', true, 'requireIdentity', true, 'requireVehicle', true,
    'requireSettlement', false, 'requireAgreement', true,
    'regions', '[]'::jsonb, 'vehicleTypes', '["Bike","Car"]'::jsonb, 'deliveryTypes', '[]'::jsonb, 'maxConcurrent', 1, 'hours', null,
    'platformFeePct', null, 'tipsEligible', true, 'payoutSchedule', null, 'minPayout', null, 'agreementVersion', null)
  || coalesce(public.setting('flex', '{}'::jsonb), '{}'::jsonb)
$$;

create or replace function public.flex_config_warnings(c jsonb) returns text[] language plpgsql immutable set search_path = public, pg_temp as $$
declare w text[] := '{}';
begin
  if coalesce((c->>'requireAgreement')::boolean, true) and coalesce(btrim(c->>'agreementVersion'), '') = '' then w := w || 'Rider agreement version is not set (legal copy missing).'::text; end if;
  if jsonb_array_length(coalesce(c->'regions', '[]')) = 0 then w := w || 'No Flex service regions are enabled.'::text; end if;
  if jsonb_array_length(coalesce(c->'deliveryTypes', '[]')) = 0 then w := w || 'No delivery types are enabled for Flex.'::text; end if;
  if c->>'platformFeePct' is null then w := w || 'Platform fee is not set, so Flex earnings cannot be calculated.'::text; end if;
  if coalesce(btrim(c->>'payoutSchedule'), '') = '' then w := w || 'Payout schedule is not set.'::text; end if;
  return w;
end $$;

create or replace function public.admin_flex_settings_get() returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare c jsonb := public.flex_cfg();
begin
  perform public._need_admin();
  return jsonb_build_object('config', c, 'warnings', to_jsonb(public.flex_config_warnings(c)),
    'cities', coalesce((select jsonb_agg(jsonb_build_object('name', name, 'status', status) order by name) from public.loc_cities), '[]'::jsonb));
end $$;

create or replace function public.admin_flex_settings_save(p jsonb) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare cur jsonb := coalesce(public.setting('flex', '{}'::jsonb), '{}'::jsonb); nxt jsonb; k text; changed text[] := '{}'; merged jsonb; w text[];
  bools text[] := array['registrationEnabled', 'dispatchEnabled', 'requireApproval', 'requireEmail', 'requirePhone', 'requireIdentity', 'requireVehicle', 'requireSettlement', 'requireAgreement', 'tipsEligible'];
begin
  perform public._need_admin();
  if jsonb_typeof(p) <> 'object' then raise exception 'Invalid settings.'; end if;
  nxt := cur;
  for k in select jsonb_object_keys(p) loop
    if k = any (bools) then
      if jsonb_typeof(p->k) <> 'boolean' then raise exception '% must be on or off.', k; end if;
    elsif k = 'regions' or k = 'vehicleTypes' or k = 'deliveryTypes' then
      if jsonb_typeof(p->k) <> 'array' then raise exception '% must be a list.', k; end if;
      if exists (select 1 from jsonb_array_elements(p->k) e where jsonb_typeof(e) <> 'string' or char_length(e #>> '{}') > 40) then raise exception '% has an invalid entry.', k; end if;
      if k = 'vehicleTypes' and exists (select 1 from jsonb_array_elements_text(p->k) e where e not in ('Bike', 'Car')) then raise exception 'Vehicle types are Bike or Car.'; end if;
      if k = 'deliveryTypes' and exists (select 1 from jsonb_array_elements_text(p->k) e where e not in ('restaurant', 'grocery', 'pharmacy', 'package')) then raise exception 'Delivery types are restaurant, grocery, pharmacy or package.'; end if;
      if k = 'regions' and exists (select 1 from jsonb_array_elements_text(p->k) e where not exists (select 1 from public.loc_cities c where c.name = e)) then raise exception 'Every region must be an existing service city.'; end if;
    elsif k = 'maxConcurrent' then
      if jsonb_typeof(p->k) <> 'number' or (p->>k)::numeric not between 1 and 5 or (p->>k)::numeric <> floor((p->>k)::numeric) then raise exception 'Max concurrent deliveries is 1 to 5.'; end if;
    elsif k = 'platformFeePct' then
      if jsonb_typeof(p->k) <> 'null' and (jsonb_typeof(p->k) <> 'number' or (p->>k)::numeric not between 0 and 100) then raise exception 'Platform fee is 0 to 100 percent.'; end if;
    elsif k = 'minPayout' then
      if jsonb_typeof(p->k) <> 'null' and (jsonb_typeof(p->k) <> 'number' or (p->>k)::numeric < 0) then raise exception 'Minimum payout cannot be negative.'; end if;
    elsif k in ('payoutSchedule', 'agreementVersion', 'hours') then
      if jsonb_typeof(p->k) not in ('string', 'null') or char_length(coalesce(p->>k, '')) > 120 then raise exception '% is invalid.', k; end if;
    else raise exception 'Unknown setting %.', k; end if;
    if nxt->k is distinct from p->k then changed := changed || k; end if;
    nxt := nxt || jsonb_build_object(k, p->k);
  end loop;
  merged := (public.flex_cfg() - 'x') || nxt;
  w := public.flex_config_warnings(merged);
  if coalesce((merged->>'registrationEnabled')::boolean, false) and (coalesce((merged->>'requireAgreement')::boolean, true) and coalesce(btrim(merged->>'agreementVersion'), '') = '' or jsonb_array_length(merged->'regions') = 0) then
    raise exception 'Set the agreement version and at least one region before opening Flex registration.'; end if;
  if coalesce((merged->>'dispatchEnabled')::boolean, false) and cardinality(w) > 0 then
    raise exception 'Flex dispatch cannot be switched on yet: %', array_to_string(w, ' ');
  end if;
  insert into public.platform_settings (key, value, updated_at) values ('flex', nxt, now()) on conflict (key) do update set value = excluded.value, updated_at = now();
  perform public.log_audit('flex_settings', jsonb_build_object('changed', to_jsonb(changed), 'registrationEnabled', merged->'registrationEnabled', 'dispatchEnabled', merged->'dispatchEnabled', 'platformFeePct', merged->'platformFeePct'));
  return jsonb_build_object('config', merged, 'warnings', to_jsonb(w));
end $$;

/* ---------------- eligibility (the one place that decides if a Flex rider may work) ---------------- */
-- Returns null when the rider may go online and take Flex deliveries, otherwise a plain-language reason. Non-Flex riders: always null.
create or replace function public._flex_block(r public.riders) returns text language plpgsql stable security definer set search_path = public, pg_temp as $$
declare c jsonb := public.flex_cfg();
begin
  if r.pay_model <> 'flex' then return null; end if;
  if r.flex_status = 'suspended' then return 'Your Flex access is suspended. Contact ChowBuy support.'; end if;
  if r.flex_status is distinct from 'approved' then return 'Your Flex application is not approved yet.'; end if;
  if not r.verified then return 'Identity verification is not complete.'; end if;
  if not coalesce((c->>'dispatchEnabled')::boolean, false) then return 'Flex deliveries are not open yet.'; end if;
  if not (c->'vehicleTypes') ? r.vehicle then return 'Your vehicle type is not enabled for Flex.'; end if;
  if r.flex_city is null or not (c->'regions') ? r.flex_city or not exists (select 1 from public.loc_cities where name = r.flex_city and status = 'live') then return 'Your service area is not active for Flex.'; end if;
  return null;
end $$;

-- Is this order one a Flex rider may take (delivery type enabled)? Concurrency is checked by the caller.
create or replace function public._flex_order_ok(p_vertical text) returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select (public.flex_cfg()->'deliveryTypes') ? p_vertical
$$;

/* ---------------- rider apply (now takes the chosen model) ---------------- */
drop function if exists public.rider_apply(text, text, text, text);
create or replace function public.rider_apply(p_name text, p_plate text, p_vehicle text, p_phone text, p_type text default 'partner') returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare ph text := public.norm_ng_phone(p_phone); t text := coalesce(p_type, 'partner'); c jsonb := public.flex_cfg();
begin
  if auth.uid() is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  if t not in ('fleet', 'partner', 'flex') then raise exception 'Choose how you want to deliver.'; end if;
  if char_length(btrim(coalesce(p_name, ''))) < 2 then raise exception 'Enter your full name.'; end if;
  if char_length(btrim(coalesce(p_plate, ''))) < 3 then raise exception 'Enter your plate number.'; end if;
  if p_vehicle not in ('Bike', 'Car') then raise exception 'Choose bike or car.'; end if;
  if ph is null then raise exception 'Enter a valid Nigerian phone number.'; end if;
  if t = 'flex' and not coalesce((c->>'registrationEnabled')::boolean, false) and not exists (select 1 from public.riders where user_id = auth.uid() and pay_model = 'flex') then
    raise exception 'ChowBuy Flex registration is not open yet.'; end if;
  -- Fleet is salaried and set by Admin, so a Fleet applicant starts as a Partner rider and Admin moves them. Flex starts as a draft application.
  insert into public.riders (user_id, name, plate, vehicle, proxy_phone, verified, online, pay_model, applied_model, flex_status)
    values (auth.uid(), left(btrim(p_name), 80), upper(left(btrim(p_plate), 20)), p_vehicle, ph, false, false,
            case when t = 'flex' then 'flex' else 'partner' end, t, case when t = 'flex' then 'draft' end)
  on conflict (user_id) do update set name = excluded.name, plate = excluded.plate, vehicle = excluded.vehicle, proxy_phone = excluded.proxy_phone
    where not public.riders.verified;
  update public.profiles set role = 'rider' where id = auth.uid() and role = 'customer';
end $$;

-- Flex onboarding details (service area + settlement). Settlement is stored as pending verification, never as verified.
create or replace function public.rider_flex_save(p_city text, p_bank text, p_account_name text, p_account_no text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare r public.riders; acct text := regexp_replace(coalesce(p_account_no, ''), '\s', '', 'g');
begin
  select * into r from public.riders where user_id = auth.uid() for update;
  if not found or r.pay_model <> 'flex' then raise exception 'This is only for ChowBuy Flex applications.'; end if;
  if r.flex_status not in ('draft', 'action_required') then raise exception 'Your application can no longer be edited.'; end if;
  if not exists (select 1 from public.loc_cities where name = p_city and status = 'live') then raise exception 'Choose a city where ChowBuy is live.'; end if;
  if coalesce(btrim(p_bank), '') <> '' or acct <> '' or coalesce(btrim(p_account_name), '') <> '' then
    if char_length(btrim(coalesce(p_bank, ''))) < 2 or char_length(btrim(coalesce(p_account_name, ''))) < 2 or acct !~ '^[0-9]{10}$' then
      raise exception 'Enter the bank, the account name and a 10-digit account number.'; end if;
    update public.riders set flex_settlement = jsonb_build_object('bank', left(btrim(p_bank), 60), 'accountName', left(btrim(p_account_name), 80), 'accountNo', acct, 'status', 'pending_verification') where user_id = r.user_id;
  end if;
  update public.riders set flex_city = p_city where user_id = r.user_id;
end $$;

create or replace function public.rider_flex_submit(p_agreement_version text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare r public.riders; c jsonb := public.flex_cfg();
begin
  select * into r from public.riders where user_id = auth.uid() for update;
  if not found or r.pay_model <> 'flex' then raise exception 'This is only for ChowBuy Flex applications.'; end if;
  if r.flex_status not in ('draft', 'action_required') then raise exception 'Your application is already with ChowBuy.'; end if;
  if not coalesce((c->>'registrationEnabled')::boolean, false) then raise exception 'ChowBuy Flex registration is not open yet.'; end if;
  if r.flex_city is null then raise exception 'Choose your service area first.'; end if;
  if not (c->'regions') ? r.flex_city then raise exception 'Flex is not open in your area yet.'; end if;
  if not (c->'vehicleTypes') ? r.vehicle then raise exception 'Your vehicle type is not enabled for Flex.'; end if;
  if coalesce((c->>'requireSettlement')::boolean, false) and r.flex_settlement is null then raise exception 'Add your settlement details.'; end if;
  if coalesce((c->>'requireAgreement')::boolean, true) then
    if coalesce(c->>'agreementVersion', '') = '' then raise exception 'The rider agreement is not published yet.'; end if;
    if p_agreement_version is distinct from c->>'agreementVersion' then raise exception 'The agreement was updated. Please read and accept the current version.'; end if;
  end if;
  update public.riders set flex_status = 'submitted', flex_agreement_version = p_agreement_version, flex_agreement_at = now(), flex_submitted_at = now(), flex_note = '' where user_id = r.user_id;
  perform public.log_audit('flex_submit', jsonb_build_object('rider', r.user_id, 'agreement', p_agreement_version));
end $$;

-- Rider chooses to pause or resume receiving offers. Going offline never cancels an accepted delivery.
create or replace function public.rider_flex_pause(p_paused boolean) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.riders set flex_paused = coalesce(p_paused, false) where user_id = auth.uid() and pay_model = 'flex';
  if not found then raise exception 'Flex riders only.' using errcode = '42501'; end if;
end $$;

/* ---------------- rider profile / online / offers / accept ---------------- */
create or replace function public.rider_me() returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare r public.riders; out jsonb; blk text; c jsonb;
begin
  select * into r from public.riders where user_id = auth.uid();
  if not found then return null; end if;
  out := jsonb_build_object(
    'id', r.user_id, 'name', r.name, 'plate', r.plate, 'vehicle', r.vehicle, 'verified', r.verified, 'online', r.online,
    'rating', r.rating_pct, 'ratingCount', r.rating_count, 'model', r.pay_model, 'tier', r.tier,
    'docs', coalesce((select jsonb_object_agg(d.doc_type, jsonb_build_object('status', d.status, 'note', d.note)) from public.kyc_docs d where d.subject_kind = 'rider' and d.subject_id = r.user_id::text), '{}'::jsonb),
    'contacts', coalesce((select jsonb_agg(jsonb_build_object('name', c.name, 'phone', c.phone) order by c.slot) from public.rider_contacts c where c.rider_id = r.user_id), '[]'::jsonb),
    'deliveriesToday', (select count(*) from public.orders o where o.rider_id = r.user_id and o.stage = 'delivered' and o.created_at >= date_trunc('day', now())),
    'wallet', coalesce((select balance from public.wallets where user_id = r.user_id), 0));
  if r.pay_model = 'partner' then
    out := out || jsonb_build_object('earnings', coalesce((select sum(net) from public.rider_earnings where rider_id = r.user_id), 0));
  elsif r.pay_model = 'flex' then
    c := public.flex_cfg(); blk := public._flex_block(r);
    out := out || jsonb_build_object(
      'earnings', coalesce((select sum(net) from public.rider_earnings where rider_id = r.user_id and status <> 'reversed'), 0),
      'flex', jsonb_build_object(
        'status', r.flex_status, 'city', r.flex_city, 'note', r.flex_note, 'paused', r.flex_paused,
        'agreementVersion', r.flex_agreement_version, 'agreementAt', r.flex_agreement_at,
        'currentAgreementVersion', c->'agreementVersion', 'registrationOpen', coalesce((c->>'registrationEnabled')::boolean, false),
        'settlement', case when r.flex_settlement is null then null else jsonb_build_object('bank', r.flex_settlement->>'bank', 'accountName', r.flex_settlement->>'accountName',
          'last4', right(r.flex_settlement->>'accountNo', 4), 'status', r.flex_settlement->>'status') end,
        'regions', c->'regions', 'blockedReason', blk,
        'availability', case when r.flex_status = 'suspended' then 'suspended' when blk is not null then 'unavailable' when not r.online then 'offline' when r.flex_paused then 'paused' else 'online' end));
  end if;
  return out || jsonb_build_object('appliedModel', r.applied_model);
end $$;

create or replace function public.rider_set_online(p_online boolean) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare r public.riders; blk text;
begin
  select * into r from public.riders where user_id = auth.uid();
  if not found then raise exception 'Riders only.' using errcode = '42501'; end if;
  if p_online then
    if not r.verified then raise exception 'Your account is waiting for approval.'; end if;
    blk := public._flex_block(r);
    if blk is not null then raise exception '%', blk; end if;
  end if;
  update public.riders set online = coalesce(p_online, false) where user_id = auth.uid();
end $$;

create or replace function public.rider_open_orders() returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare r public.riders; pc jsonb := public.rider_pay_cfg(); pct int; fc jsonb := public.flex_cfg(); fpct numeric; maxc int; busy int;
begin
  select * into r from public.riders where user_id = auth.uid() and verified and online;
  if not found then return '[]'::jsonb; end if;
  select count(*) into busy from public.orders where rider_id = r.user_id and stage not in ('delivered', 'cancelled');
  if r.pay_model = 'flex' then
    if public._flex_block(r) is not null or r.flex_paused then return '[]'::jsonb; end if;
    maxc := coalesce((fc->>'maxConcurrent')::int, 1);
    if busy >= maxc then return '[]'::jsonb; end if;
    fpct := nullif(fc->>'platformFeePct', '')::numeric;
  elsif busy > 0 then return '[]'::jsonb; end if;
  pct := coalesce((pc->'commission'->>r.tier)::int, 15);
  return coalesce((select jsonb_agg(x order by x->>'createdAt') from (
    select jsonb_build_object(
      'id', o.id, 'merchant', m.name, 'pickupArea', coalesce(m.area, ''), 'dropArea', coalesce(o.address->>'area', ''),
      'pickup', jsonb_build_object('lat', m.lat, 'lng', m.lng),
      'km', public._km(m.lat, m.lng, (o.address->'location'->>'latitude')::double precision, (o.address->'location'->>'longitude')::double precision),
      'items', (select coalesce(sum((l->>'qty')::int), 0) from jsonb_array_elements(o.lines) l),
      'cod', case when o.pay = 'cod' then o.total else 0 end,
      'net', case when r.pay_model = 'partner' then o.delivery_fee - round(o.delivery_fee * pct / 100.0)::int
                  when r.pay_model = 'flex' and fpct is not null then o.delivery_fee - round(o.delivery_fee * fpct / 100.0)::int else null end,
      'createdAt', o.created_at) x
    from public.orders o join public.merchants m on m.id = o.merchant_id
    where o.rider_id is null and o.stage in ('received', 'preparing') and (o.paid or o.pay = 'cod')
      and (r.pay_model <> 'flex' or public._flex_order_ok(m.vertical))
    order by o.created_at limit 5) s), '[]'::jsonb);
end $$;

-- Accepting is atomic (one UPDATE wins the order) and idempotent (accepting your own order again is a no-op).
create or replace function public.rider_accept(p_order text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare r public.riders; blk text; v text; busy int; mine boolean;
begin
  select * into r from public.riders where user_id = auth.uid() and verified for update;
  if not found then raise exception 'Only verified riders can accept orders.'; end if;
  select (rider_id = r.user_id) into mine from public.orders where id = p_order;
  if coalesce(mine, false) then return; end if;
  if r.pay_model = 'flex' then
    blk := public._flex_block(r);
    if blk is not null then raise exception '%', blk; end if;
    if not r.online or r.flex_paused then raise exception 'Go online to accept deliveries.'; end if;
    select m.vertical into v from public.orders o join public.merchants m on m.id = o.merchant_id where o.id = p_order;
    if v is null or not public._flex_order_ok(v) then raise exception 'This delivery type is not available for Flex.'; end if;
    select count(*) into busy from public.orders where rider_id = r.user_id and stage not in ('delivered', 'cancelled');
    if busy >= coalesce((public.flex_cfg()->>'maxConcurrent')::int, 1) then raise exception 'Finish your current delivery first.'; end if;
  end if;
  update public.orders set rider_id = r.user_id,
    rider = jsonb_build_object('id', r.user_id, 'name', r.name, 'plate', r.plate, 'vehicle', r.vehicle, 'rating', r.rating_pct, 'verified', r.verified, 'proxyPhone', r.proxy_phone)
  where id = p_order and rider_id is null and stage in ('received', 'preparing') and (paid or pay = 'cod');
  if not found then raise exception 'This order is no longer available.'; end if;
  perform public._set_stage(p_order, 'rider_accepted');
end $$;

/* ---------------- delivery hook: explicit branch per model (no implicit "else = partner") ---------------- */
create or replace function public._on_delivered() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare cfg jsonb := public.points_cfg(); pc jsonb := public.rider_pay_cfg(); fc jsonb := public.flex_cfg(); lt int; mult numeric; pts int; r public.riders; pct int; cm int; fpct numeric; tp int;
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
        elsif r.pay_model = 'partner' then
          pct := coalesce((pc->'commission'->>r.tier)::int, 15);
          cm := round(new.delivery_fee * pct / 100.0);
          insert into public.rider_earnings (order_id, rider_id, model, fare, commission, net) values (new.id, new.rider_id, 'partner', new.delivery_fee, cm, new.delivery_fee - cm) on conflict do nothing;
        elsif r.pay_model = 'flex' then
          -- gross fare - platform fee + eligible tip (+ approved incentives later). If no platform fee is configured the row stays 'pending'
          -- with net 0 until Admin sets the fee and re-prices pending rows; nothing is invented.
          fpct := nullif(fc->>'platformFeePct', '')::numeric;
          if fpct is null then
            insert into public.rider_earnings (order_id, rider_id, model, fare, status) values (new.id, new.rider_id, 'flex', new.delivery_fee, 'pending') on conflict do nothing;
          else
            cm := round(new.delivery_fee * fpct / 100.0);
            tp := case when coalesce((fc->>'tipsEligible')::boolean, true) then coalesce(new.tip, 0) else 0 end;
            insert into public.rider_earnings (order_id, rider_id, model, fare, commission, tip, net, status) values (new.id, new.rider_id, 'flex', new.delivery_fee, cm, tp, new.delivery_fee - cm + tp, 'confirmed') on conflict do nothing;
          end if;
        end if;
      end if;
    end if;
  end if;
  return new;
end $$;

/* ---------------- Flex earnings: rider view and admin controls ---------------- */
create or replace function public.rider_flex_earnings(p_limit int default 50) returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not exists (select 1 from public.riders where user_id = auth.uid() and pay_model = 'flex') then raise exception 'Flex riders only.' using errcode = '42501'; end if;
  return jsonb_build_object(
    'summary', (select coalesce(jsonb_object_agg(status, jsonb_build_object('count', n, 'net', s)), '{}'::jsonb) from (
      select status, count(*) n, sum(net) s from public.rider_earnings where rider_id = auth.uid() and model = 'flex' group by status) t),
    'items', coalesce((select jsonb_agg(jsonb_build_object('order', order_id, 'at', created_at, 'fare', fare, 'platformFee', commission, 'tip', tip, 'incentive', incentive, 'net', net, 'status', status) order by created_at desc)
      from (select * from public.rider_earnings where rider_id = auth.uid() and model = 'flex' order by created_at desc limit least(greatest(coalesce(p_limit, 50), 1), 200)) e), '[]'::jsonb));
end $$;

create or replace function public.admin_flex_reprice_pending() returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare fc jsonb := public.flex_cfg(); fpct numeric := nullif(public.flex_cfg()->>'platformFeePct', '')::numeric; n int;
begin
  perform public._need_admin();
  if fpct is null then raise exception 'Set the Flex platform fee first.'; end if;
  update public.rider_earnings e set commission = round(e.fare * fpct / 100.0), tip = case when coalesce((fc->>'tipsEligible')::boolean, true) then coalesce((select o.tip from public.orders o where o.id = e.order_id), 0) else 0 end, status = 'confirmed'
    where e.model = 'flex' and e.status = 'pending';
  get diagnostics n = row_count;
  update public.rider_earnings set net = fare - commission + tip + incentive where model = 'flex' and status = 'confirmed' and net = 0 and fare > 0;
  perform public.log_audit('flex_reprice', jsonb_build_object('rows', n, 'platformFeePct', fpct));
  return n;
end $$;

create or replace function public.admin_flex_adjust(p_order text, p_incentive int, p_reason text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare e public.rider_earnings;
begin
  perform public._need_admin();
  if char_length(btrim(coalesce(p_reason, ''))) < 5 then raise exception 'Give a reason for the adjustment.'; end if;
  if p_incentive is null or p_incentive < 0 or p_incentive > 1000000 then raise exception 'Incentive must be 0 or more.'; end if;
  select * into e from public.rider_earnings where order_id = p_order and model = 'flex' for update;
  if not found then raise exception 'No Flex earning for that order.'; end if;
  if e.status in ('pending', 'paid', 'processing', 'reversed') then raise exception 'This earning can no longer be adjusted (%).', e.status; end if;
  update public.rider_earnings set incentive = p_incentive, net = fare - commission + tip + p_incentive where order_id = p_order;
  perform public.log_audit('flex_adjust', jsonb_build_object('order', p_order, 'rider', e.rider_id, 'incentiveBefore', e.incentive, 'incentiveAfter', p_incentive, 'reason', left(btrim(p_reason), 200)));
end $$;

-- Status moves one step along the payout path. 'paid' needs the payout provider's reference; nothing is marked paid on our say-so.
create or replace function public.admin_flex_earning_status(p_order text, p_status text, p_ref text default null, p_reason text default '') returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare e public.rider_earnings; ok boolean;
begin
  perform public._need_admin();
  select * into e from public.rider_earnings where order_id = p_order and model = 'flex' for update;
  if not found then raise exception 'No Flex earning for that order.'; end if;
  if e.status = p_status then return; end if;
  ok := (e.status, p_status) in (('confirmed', 'available'), ('available', 'requested'), ('requested', 'processing'), ('processing', 'paid'), ('processing', 'failed'), ('failed', 'requested'),
                                 ('confirmed', 'reversed'), ('available', 'reversed'), ('requested', 'reversed'), ('failed', 'reversed'), ('paid', 'reversed'));
  if not ok then raise exception 'Cannot move an earning from % to %.', e.status, p_status; end if;
  if p_status = 'paid' and char_length(btrim(coalesce(p_ref, ''))) < 4 then raise exception 'A payout provider reference is required to mark an earning paid.'; end if;
  if p_status in ('reversed', 'failed') and char_length(btrim(coalesce(p_reason, ''))) < 5 then raise exception 'Give a reason.'; end if;
  update public.rider_earnings set status = p_status, provider_ref = coalesce(nullif(btrim(p_ref), ''), provider_ref) where order_id = p_order;
  perform public.log_audit('flex_earning_status', jsonb_build_object('order', p_order, 'rider', e.rider_id, 'from', e.status, 'to', p_status, 'ref', left(coalesce(p_ref, ''), 60), 'reason', left(coalesce(p_reason, ''), 200)));
end $$;

/* ---------------- Admin: applications, decisions, model changes, analytics ---------------- */
create or replace function public.admin_flex_applications(p_status text default 'all', p_search text default '', p_limit int default 25, p_offset int default 0) returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare lim int := least(greatest(coalesce(p_limit, 25), 1), 100); off int := greatest(coalesce(p_offset, 0), 0); q text := '%' || lower(btrim(coalesce(p_search, ''))) || '%'; c jsonb := public.flex_cfg(); total int;
begin
  perform public._need_admin();
  select count(*) into total from public.riders r left join public.profiles p on p.id = r.user_id
    where r.pay_model = 'flex' and (p_status = 'all' or r.flex_status = p_status) and (lower(r.name) like q or lower(coalesce(p.phone, r.proxy_phone)) like q);
  return jsonb_build_object('total', total, 'items', coalesce((select jsonb_agg(x order by x->>'sort' desc) from (
    select jsonb_build_object('id', r.user_id, 'name', r.name, 'phone', coalesce(p.phone, r.proxy_phone), 'vehicle', r.vehicle, 'plate', r.plate, 'verified', r.verified, 'online', r.online,
      'status', r.flex_status, 'city', r.flex_city, 'note', r.flex_note, 'submittedAt', r.flex_submitted_at, 'decidedAt', r.flex_decided_at, 'sort', coalesce(r.flex_submitted_at, r.flex_decided_at, now())::text,
      'agreementVersion', r.flex_agreement_version, 'agreementAt', r.flex_agreement_at,
      'settlement', case when r.flex_settlement is null then null else jsonb_build_object('bank', r.flex_settlement->>'bank', 'accountName', r.flex_settlement->>'accountName', 'last4', right(r.flex_settlement->>'accountNo', 4), 'status', r.flex_settlement->>'status') end,
      'docs', coalesce((select jsonb_agg(jsonb_build_object('doc', d.doc_type, 'status', d.status, 'file', d.file_path, 'note', d.note)) from public.kyc_docs d where d.subject_kind = 'rider' and d.subject_id = r.user_id::text), '[]'::jsonb),
      'checks', jsonb_build_object('identity', r.verified, 'vehicle', (c->'vehicleTypes') ? r.vehicle, 'area', r.flex_city is not null and (c->'regions') ? r.flex_city,
        'settlement', r.flex_settlement is not null, 'agreement', r.flex_agreement_version is not null and r.flex_agreement_version = c->>'agreementVersion'),
      'history', coalesce((select jsonb_agg(jsonb_build_object('action', a.action, 'at', a.at, 'meta', a.meta - 'rider') order by a.at desc) from (
          select * from public.audit_log where meta->>'rider' = r.user_id::text and (action like 'flex\_%' or action = 'rider_type') order by at desc limit 15) a), '[]'::jsonb)) as x
    from public.riders r left join public.profiles p on p.id = r.user_id
    where r.pay_model = 'flex' and (p_status = 'all' or r.flex_status = p_status) and (lower(r.name) like q or lower(coalesce(p.phone, r.proxy_phone)) like q)
    order by coalesce(r.flex_submitted_at, r.flex_decided_at) desc nulls last limit lim offset off) s), '[]'::jsonb));
end $$;

create or replace function public.admin_flex_decide(p_rider uuid, p_action text, p_note text default '') returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare r public.riders; c jsonb := public.flex_cfg(); n text := left(btrim(coalesce(p_note, '')), 300); nxt text;
begin
  perform public._need_admin();
  select * into r from public.riders where user_id = p_rider and pay_model = 'flex' for update;
  if not found then raise exception 'Flex rider not found.'; end if;
  if p_action = 'review' then
    if r.flex_status <> 'submitted' then raise exception 'Only submitted applications can be moved to review.'; end if; nxt := 'under_review';
  elsif p_action = 'request_info' then
    if r.flex_status not in ('submitted', 'under_review') then raise exception 'This application is not under review.'; end if;
    if char_length(n) < 5 then raise exception 'Tell the applicant what to fix.'; end if; nxt := 'action_required';
  elsif p_action = 'approve' then
    if r.flex_status not in ('submitted', 'under_review') then raise exception 'Only submitted applications can be approved.'; end if;
    if coalesce((c->>'requireIdentity')::boolean, true) and not r.verified then raise exception 'Identity verification is not complete.'; end if;
    if coalesce((c->>'requireVehicle')::boolean, true) and not (c->'vehicleTypes') ? r.vehicle then raise exception 'Vehicle type is not enabled for Flex.'; end if;
    if r.flex_city is null or not (c->'regions') ? r.flex_city then raise exception 'The rider''s service area is not enabled for Flex.'; end if;
    if coalesce((c->>'requireSettlement')::boolean, false) and r.flex_settlement is null then raise exception 'Settlement details are missing.'; end if;
    if coalesce((c->>'requireAgreement')::boolean, true) and (r.flex_agreement_version is null or r.flex_agreement_version is distinct from c->>'agreementVersion') then raise exception 'The rider has not accepted the current agreement.'; end if;
    nxt := 'approved'; n := '';
  elsif p_action = 'reject' then
    if r.flex_status not in ('submitted', 'under_review', 'action_required') then raise exception 'This application cannot be rejected now.'; end if;
    if char_length(n) < 5 then raise exception 'Give a reason for rejecting.'; end if; nxt := 'rejected';
  elsif p_action = 'suspend' then
    if r.flex_status <> 'approved' then raise exception 'Only approved riders can be suspended.'; end if;
    if char_length(n) < 5 then raise exception 'Give a reason for suspending.'; end if; nxt := 'suspended';
  elsif p_action = 'reinstate' then
    if r.flex_status <> 'suspended' then raise exception 'This rider is not suspended.'; end if; nxt := 'approved'; n := '';
  else raise exception 'Unknown action.'; end if;
  update public.riders set flex_status = nxt, flex_note = n, flex_decided_by = auth.uid(), flex_decided_at = now(), online = case when nxt in ('suspended', 'rejected', 'action_required') then false else online end where user_id = p_rider;
  perform public.log_audit('flex_' || p_action, jsonb_build_object('rider', p_rider, 'from', r.flex_status, 'to', nxt, 'note', n));
end $$;

-- The only way a rider's model changes. Needs a reason, is audited, and never touches past earnings (they keep the model they were earned under).
create or replace function public.admin_rider_set_type(p_rider uuid, p_model text, p_reason text, p_salary int default null) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare r public.riders;
begin
  perform public._need_admin();
  if p_model not in ('fleet', 'partner', 'flex') then raise exception 'Model must be fleet, partner or flex.'; end if;
  if char_length(btrim(coalesce(p_reason, ''))) < 5 then raise exception 'Give a reason for the change.'; end if;
  select * into r from public.riders where user_id = p_rider for update;
  if not found then raise exception 'Rider not found.'; end if;
  if r.pay_model = p_model then raise exception 'The rider is already on this model.'; end if;
  if exists (select 1 from public.orders where rider_id = p_rider and stage not in ('delivered', 'cancelled')) then raise exception 'The rider has a delivery in progress. Change the model after it is done.'; end if;
  if p_model = 'fleet' and (p_salary is null or p_salary < 1) then raise exception 'Set a monthly salary for a fleet rider.'; end if;
  update public.riders set pay_model = p_model, online = false,
    monthly_salary = case when p_model = 'fleet' then p_salary else 0 end,
    flex_status = case when p_model = 'flex' then coalesce(case when flex_status in ('approved', 'suspended') then flex_status end, 'draft') else flex_status end
  where user_id = p_rider;
  perform public.log_audit('rider_type', jsonb_build_object('rider', p_rider, 'from', r.pay_model, 'to', p_model, 'reason', left(btrim(p_reason), 200)));
end $$;

-- Fleet/Partner pay settings only. Flex riders are changed through admin_rider_set_type and Flex settings.
create or replace function public.admin_rider_set_pay(p_rider uuid, p_model text, p_salary int, p_tier text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public._need_admin();
  if p_model not in ('fleet', 'partner') then raise exception 'Pay model must be fleet or partner.'; end if;
  if exists (select 1 from public.riders where user_id = p_rider and pay_model = 'flex') then raise exception 'This is a Flex rider. Use Change model.'; end if;
  if p_model = 'fleet' and (p_salary is null or p_salary < 1) then raise exception 'Set a monthly salary for a fleet rider.'; end if;
  update public.riders set pay_model = p_model, monthly_salary = case when p_model = 'fleet' then p_salary else 0 end, tier = coalesce(p_tier, tier) where user_id = p_rider;
  if not found then raise exception 'Rider not found.'; end if;
  perform public.log_audit('rider_pay', jsonb_build_object('rider', p_rider, 'model', p_model, 'salary', p_salary, 'tier', p_tier));
end $$;

create or replace function public.admin_flex_analytics(p_days int default 30, p_city text default null, p_vehicle text default null) returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare since timestamptz := now() - make_interval(days => least(greatest(coalesce(p_days, 30), 1), 365));
begin
  perform public._need_admin();
  return jsonb_build_object(
    'applications', coalesce((select jsonb_object_agg(s, n) from (select flex_status s, count(*) n from public.riders where pay_model = 'flex' and flex_status is not null
        and (p_city is null or flex_city = p_city) and (p_vehicle is null or vehicle = p_vehicle) group by flex_status) t), '{}'::jsonb),
    'active', (select count(*) from public.riders where pay_model = 'flex' and flex_status = 'approved' and verified and (p_city is null or flex_city = p_city) and (p_vehicle is null or vehicle = p_vehicle)),
    'online', (select count(*) from public.riders where pay_model = 'flex' and flex_status = 'approved' and verified and online and (p_city is null or flex_city = p_city) and (p_vehicle is null or vehicle = p_vehicle)),
    'deliveries', (select count(*) from public.rider_earnings e join public.riders r on r.user_id = e.rider_id where e.model = 'flex' and e.created_at >= since and (p_city is null or r.flex_city = p_city) and (p_vehicle is null or r.vehicle = p_vehicle)),
    'money', (select jsonb_build_object('gross', coalesce(sum(e.fare), 0), 'platformFee', coalesce(sum(e.commission), 0), 'tips', coalesce(sum(e.tip), 0), 'incentives', coalesce(sum(e.incentive), 0), 'net', coalesce(sum(e.net), 0),
        'pending', count(*) filter (where e.status = 'pending'))
      from public.rider_earnings e join public.riders r on r.user_id = e.rider_id where e.model = 'flex' and e.created_at >= since and e.status <> 'reversed' and (p_city is null or r.flex_city = p_city) and (p_vehicle is null or r.vehicle = p_vehicle)));
end $$;

-- Rider list for Admin: now carries the Flex lifecycle, and Flex riders who are not approved show as pending, suspended ones as suspended.
create or replace function public.admin_riders() returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  perform public._need_admin();
  return coalesce((select jsonb_agg(x order by x.sort, x.name) from (
    select r.user_id as id, r.name, r.plate, r.vehicle, r.pay_model as model, r.tier, r.verified, r.online, r.applied_model as "appliedModel", r.flex_status as "flexStatus", r.flex_city as "flexCity",
      r.rating_pct, r.rating_count, coalesce(p.phone, r.proxy_phone) as phone,
      (select count(*) from public.orders o where o.rider_id = r.user_id and o.stage = 'delivered' and o.created_at >= now() - interval '30 days') as trips30,
      a.id as active_order, a.stage::text as active_stage,
      case when r.online then coalesce((a.rider_pos->>'latitude')::double precision, l.lat) end as lat,
      case when r.online then coalesce((a.rider_pos->>'longitude')::double precision, l.lng) end as lng,
      case when not r.online then null when a.rider_pos is not null then now() else l.seen_at end as seen_at,
      case when r.pay_model = 'flex' and r.flex_status = 'suspended' then 'suspended'
           when not r.verified or (r.pay_model = 'flex' and r.flex_status is distinct from 'approved') then 'pending'
           when not r.online then 'offline' when a.id is not null then 'delivering' else 'idle' end as status,
      case when not r.verified or (r.pay_model = 'flex' and r.flex_status is distinct from 'approved') then 2 when r.online then 0 else 1 end as sort
    from public.riders r
    left join public.profiles p on p.id = r.user_id
    left join public.rider_locations l on l.rider_id = r.user_id
    left join lateral (select o.id, o.stage, o.rider_pos from public.orders o where o.rider_id = r.user_id and o.stage not in ('delivered', 'cancelled') order by o.created_at desc limit 1) a on true) x), '[]'::jsonb);
end $$;

/* ---------------- privileges: nothing is callable unless listed ---------------- */
revoke execute on function public.flex_cfg(), public.flex_config_warnings(jsonb), public._flex_block(public.riders), public._flex_order_ok(text), public.rider_apply(text, text, text, text, text),
  public.rider_flex_save(text, text, text, text), public.rider_flex_submit(text), public.rider_flex_pause(boolean), public.rider_me(), public.rider_set_online(boolean), public.rider_open_orders(),
  public.rider_accept(text), public.rider_flex_earnings(int), public.admin_flex_settings_get(), public.admin_flex_settings_save(jsonb), public.admin_flex_reprice_pending(),
  public.admin_flex_adjust(text, int, text), public.admin_flex_earning_status(text, text, text, text), public.admin_flex_applications(text, text, int, int), public.admin_flex_decide(uuid, text, text),
  public.admin_rider_set_type(uuid, text, text, int), public.admin_rider_set_pay(uuid, text, int, text), public.admin_flex_analytics(int, text, text), public.admin_riders(), public._on_delivered()
  from public, anon, authenticated;
grant execute on function public.rider_apply(text, text, text, text, text), public.rider_flex_save(text, text, text, text), public.rider_flex_submit(text), public.rider_flex_pause(boolean), public.rider_me(),
  public.rider_set_online(boolean), public.rider_open_orders(), public.rider_accept(text), public.rider_flex_earnings(int), public.admin_flex_settings_get(), public.admin_flex_settings_save(jsonb),
  public.admin_flex_reprice_pending(), public.admin_flex_adjust(text, int, text), public.admin_flex_earning_status(text, text, text, text), public.admin_flex_applications(text, text, int, int),
  public.admin_flex_decide(uuid, text, text), public.admin_rider_set_type(uuid, text, text, int), public.admin_rider_set_pay(uuid, text, int, text), public.admin_flex_analytics(int, text, text), public.admin_riders()
  to authenticated;
