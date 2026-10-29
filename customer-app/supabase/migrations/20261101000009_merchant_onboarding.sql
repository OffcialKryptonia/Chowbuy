/* Merchant registration, onboarding and ownership.

   Why "Not assigned owner" happened: every store had owner_id = NULL, and the only way to link a store to an account was an Admin typing the
   owner's email. A merchant who signed in therefore had no store, and merchant_me() raised "This account is not linked to a store yet".
   There was no self-service path that creates a business and its owner together.

   The fix: a business is created only together with an authorised membership (one transaction, server-side), applications move through an
   audited lifecycle, and every merchant function checks membership instead of a single owner_id column. owner_id is kept (and kept in sync)
   for older code, but it is no longer what grants access.

   Additive and safe to re-run: no rows are deleted, no orders, wallets or ledgers are touched. */

/* ---------------- merchants: business type, application status, demo marker ---------------- */
do $$
declare fresh boolean := not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'merchants' and column_name = 'application_status');
begin
  alter table public.merchants
    add column if not exists business_type text check (business_type in ('RESTAURANT', 'GROCERY_SUPERMARKET', 'PHARMACY', 'PACKAGE_LOGISTICS')),
    add column if not exists application_status text not null default 'DRAFT'
      check (application_status in ('DRAFT', 'EMAIL_VERIFICATION_PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'ACTION_REQUIRED', 'APPROVED', 'REJECTED', 'SUSPENDED')),
    add column if not exists trading_name text,
    add column if not exists is_demo boolean not null default false,
    add column if not exists verified boolean not null default false,
    add column if not exists created_at timestamptz not null default now();
  -- Stores that existed before applications did were created and vetted by ChowBuy: they are approved. Runs once, never on a re-run.
  if fresh then update public.merchants set application_status = 'APPROVED', verified = true; end if;
end $$;
update public.merchants set business_type = case vertical when 'restaurant' then 'RESTAURANT' when 'grocery' then 'GROCERY_SUPERMARKET'
  when 'pharmacy' then 'PHARMACY' else 'PACKAGE_LOGISTICS' end where business_type is null;
-- The sample catalogue from seed.sql (ids m1..m7, no owner). Identified by id + name + no owner so a real store can never match.
update public.merchants set is_demo = true where owner_id is null and (id, name) in
  (('m1', 'Bukka Republic'), ('m2', 'Mama Put Express'), ('m3', 'Slice Lagos'), ('m4', 'Smash Burger Co.'), ('m5', 'Ade''s Super Mart'), ('m6', 'CarePoint Pharmacy'), ('m7', 'Swiftbox Couriers'));

/* ---------------- memberships: who may act for a business ---------------- */
create table if not exists public.merchant_members (
  id           uuid primary key default gen_random_uuid(),
  merchant_id  text not null references public.merchants(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  role         text not null check (role in ('owner', 'manager', 'staff')),
  status       text not null default 'active' check (status in ('active', 'invited', 'suspended', 'removed')),
  relationship text not null default '',          -- what the person said they are to the business (owner, director, manager, representative)
  created_at   timestamptz not null default now(),
  unique (merchant_id, user_id)
);
create unique index if not exists merchant_members_one_owner on public.merchant_members (merchant_id) where role = 'owner' and status = 'active';
create index if not exists merchant_members_user on public.merchant_members (user_id, status);

insert into public.merchant_members (merchant_id, user_id, role, status, relationship)
  select id, owner_id, 'owner', 'active', 'owner' from public.merchants where owner_id is not null on conflict do nothing;

create or replace function public._is_member(p_merchant text, p_roles text[] default array['owner', 'manager', 'staff']) returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.merchant_members where merchant_id = p_merchant and user_id = auth.uid() and status = 'active' and role = any(p_roles))
$$;

/* ---------------- applications ---------------- */
create table if not exists public.merchant_applications (
  id           uuid primary key default gen_random_uuid(),
  merchant_id  text not null unique references public.merchants(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id),
  business_type text not null check (business_type in ('RESTAURANT', 'GROCERY_SUPERMARKET', 'PHARMACY', 'PACKAGE_LOGISTICS')),
  status       text not null default 'DRAFT' check (status in ('DRAFT', 'EMAIL_VERIFICATION_PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'ACTION_REQUIRED', 'APPROVED', 'REJECTED', 'SUSPENDED')),
  data         jsonb not null default '{}',       -- business, owner, location, specific sections (no bank or identity numbers)
  checklist    jsonb not null default '{}',       -- setup tasks the merchant confirms by hand
  submitted_at timestamptz, reviewed_by uuid references public.profiles(id), reviewed_at timestamptz,
  review_note  text not null default '',
  created_at   timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists merchant_applications_status on public.merchant_applications (status, submitted_at);

-- Bank details live apart from everything else and are never readable through a table grant.
create table if not exists public.merchant_settlement (
  merchant_id text primary key references public.merchants(id) on delete cascade,
  beneficiary text not null, bank_name text not null, account_number text not null check (account_number ~ '^[0-9]{10}$'),
  status text not null default 'PENDING_VERIFICATION' check (status in ('PENDING_VERIFICATION', 'VERIFIED', 'FAILED')),
  note text not null default '', updated_by uuid references public.profiles(id), updated_at timestamptz not null default now()
);

alter table public.merchant_members enable row level security;
alter table public.merchant_applications enable row level security;
alter table public.merchant_settlement enable row level security;
revoke all on public.merchant_members, public.merchant_applications, public.merchant_settlement from anon, authenticated;
grant select on public.merchant_members, public.merchant_applications to authenticated;
drop policy if exists mm_read on public.merchant_members;
create policy mm_read on public.merchant_members for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists ma_read on public.merchant_applications;
create policy ma_read on public.merchant_applications for select using (public._is_member(merchant_id, array['owner', 'manager']) or public.is_admin());

-- Safety net against the original bug: any path that sets merchants.owner_id (admin SQL, older tools) also records the membership.
create or replace function public._owner_sync() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.owner_id is not null and (tg_op = 'INSERT' or new.owner_id is distinct from old.owner_id) then
    update public.merchant_members set status = 'removed' where merchant_id = new.id and role = 'owner' and status = 'active' and user_id <> new.owner_id;
    insert into public.merchant_members (merchant_id, user_id, role, status, relationship) values (new.id, new.owner_id, 'owner', 'active', 'owner')
    on conflict (merchant_id, user_id) do update set role = 'owner', status = 'active', relationship = 'owner';
  end if;
  return null;
end $$;
drop trigger if exists merchants_owner_sync on public.merchants;
create trigger merchants_owner_sync after insert or update of owner_id on public.merchants for each row execute function public._owner_sync();

/* ---------------- access rules now follow membership, not a single owner_id ---------------- */
-- Owners could previously write their store row directly (and rows could be written by anyone matching owner_id): everything goes through functions now.
revoke insert, update, delete on public.merchants from authenticated;
drop policy if exists merchants_read on public.merchants;
create policy merchants_read on public.merchants for select using (active or public._is_member(id) or public.is_admin());
drop policy if exists merchants_write on public.merchants;
create policy merchants_write on public.merchants for all using (public.is_admin()) with check (public.is_admin());

-- Only stores customers can actually see (or their own team and admins) expose their catalogue.
drop policy if exists products_read on public.products;
create policy products_read on public.products for select using (exists (select 1 from public.merchants m where m.id = merchant_id and (m.active or public._is_member(m.id) or public.is_admin())));
drop policy if exists products_write on public.products;
create policy products_write on public.products for all
  using (public.is_admin() or (public._is_member(merchant_id, array['owner', 'manager']) and exists (select 1 from public.merchants m where m.id = merchant_id and m.application_status = 'APPROVED' and m.verified)))
  with check (public.is_admin() or (public._is_member(merchant_id, array['owner', 'manager']) and exists (select 1 from public.merchants m where m.id = merchant_id and m.application_status = 'APPROVED' and m.verified)));
drop policy if exists orders_merchant on public.orders;
create policy orders_merchant on public.orders for select using ((paid or pay = 'cod') and public._is_member(merchant_id));

create or replace function public._kyc_owns(p_kind text, p_subject text) returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select case p_kind
    when 'rider' then p_subject = auth.uid()::text
    when 'merchant' then public._is_member(p_subject, array['owner', 'manager'])
    else false end
$$;

-- Documents are private, images or PDFs, 8 MB at most (enforced by the bucket itself, not only the browser).
do $$ begin
  if to_regclass('storage.buckets') is not null then
    execute $p$update storage.buckets set file_size_limit = 8388608, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] where id = 'kyc'$p$;
  end if;
end $$;

create or replace function public._store_of(p_merchant text) returns public.merchants language plpgsql stable security definer set search_path = public, pg_temp as $$
declare m public.merchants;
begin
  select * into m from public.merchants where id = p_merchant and (public._is_member(id) or public.is_admin());
  if not found then raise exception 'Store not found.'; end if;
  return m;
end $$;

/* ---------------- validation helpers ---------------- */
create or replace function public._vertical_of(p_type text) returns text language sql immutable set search_path = pg_catalog, pg_temp as $$
  select case p_type when 'RESTAURANT' then 'restaurant' when 'GROCERY_SUPERMARKET' then 'grocery' when 'PHARMACY' then 'pharmacy' when 'PACKAGE_LOGISTICS' then 'package' end
$$;

create or replace function public._t(j jsonb, k text, lo int, hi int, label text) returns text language plpgsql immutable set search_path = pg_catalog, pg_temp as $$
declare v text := btrim(coalesce(j->>k, ''));
begin
  if char_length(v) < lo or char_length(v) > hi then
    raise exception '%', case when lo > 0 then 'Check ' || label || ': ' || lo || ' to ' || hi || ' characters.' else 'Check ' || label || ': ' || hi || ' characters at most.' end;
  end if;
  return v;
end $$;

create or replace function public._arr(j jsonb, k text, allowed text[], lo int, hi int, label text) returns jsonb language plpgsql immutable set search_path = pg_catalog, pg_temp as $$
declare out jsonb := '[]'; v text;
begin
  if jsonb_typeof(j->k) is distinct from 'array' then
    if lo > 0 then raise exception 'Choose at least % for %.', lo, label; end if;
    return out;
  end if;
  for v in select btrim(x) from jsonb_array_elements_text(j->k) x loop
    if v = '' then continue; end if;
    if allowed is not null and not (v = any(allowed)) then raise exception 'Choose %: "%" is not an option.', label, left(v, 30); end if;
    if char_length(v) > 40 then raise exception 'Check %: entries are too long.', label; end if;
    if not out ? v then out := out || to_jsonb(v); end if;
  end loop;
  if jsonb_array_length(out) < lo then raise exception 'Choose at least % for %.', lo, label; end if;
  if jsonb_array_length(out) > hi then raise exception 'Choose at most % for %.', hi, label; end if;
  return out;
end $$;

create or replace function public._int(v text) returns int language sql immutable set search_path = pg_catalog, pg_temp as $$
  select case when btrim(coalesce(v, '')) ~ '^[0-9]{1,6}$' then btrim(v)::int end
$$;

create or replace function public._email_ok(v text, label text) returns text language plpgsql immutable set search_path = pg_catalog, pg_temp as $$
begin
  v := lower(btrim(coalesce(v, '')));
  if v !~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' or char_length(v) > 120 then raise exception 'Enter a valid email address for %.', label; end if;
  return v;
end $$;

create or replace function public._phone_ok(v text, label text) returns text language plpgsql immutable set search_path = public, pg_temp as $$
declare p text := public.norm_ng_phone(v);
begin
  if p is null then raise exception 'Enter a valid Nigerian phone number for %.', label; end if;
  return p;
end $$;

-- Clean one section of the application on the server. Unknown keys are dropped; the client is never trusted.
create or replace function public._app_clean(p_section text, p_data jsonb, p_type text) returns jsonb language plpgsql stable set search_path = public, pg_temp as $$
declare j jsonb := coalesce(p_data, '{}'); out jsonb; cac text; num text; site text; pos text; lat double precision; lng double precision; city text; exp date; st text;
begin
  if jsonb_typeof(j) <> 'object' or char_length(j::text) > 8000 then raise exception 'That information is too large or in the wrong format.'; end if;
  if p_section = 'business' then
    cac := coalesce(j->>'cac_status', '');
    if cac not in ('registered', 'in_progress', 'sole_proprietor') then raise exception 'Choose your CAC registration status.'; end if;
    num := upper(btrim(coalesce(j->>'cac_number', '')));
    if cac = 'registered' and num !~ '^(RC|BN|IT|LP|LLP)?[ -]?[0-9]{4,9}$' then raise exception 'Enter your CAC registration number, for example RC1234567.'; end if;
    if cac <> 'registered' then num := ''; end if;
    site := btrim(coalesce(j->>'website', ''));
    if site <> '' and site !~* '^https?://[^[:space:]]{3,200}$' then raise exception 'Enter the website or social page as a full link starting with https://.'; end if;
    return jsonb_build_object('trading_name', public._t(j, 'trading_name', 2, 80, 'the store name'), 'registered_name', public._t(j, 'registered_name', 0, 120, 'the registered name'),
      'description', public._t(j, 'description', 10, 500, 'the business description'), 'cac_status', cac, 'cac_number', num,
      'business_email', public._email_ok(j->>'business_email', 'the business'), 'business_phone', public._phone_ok(j->>'business_phone', 'the business'), 'website', site);
  elsif p_section = 'owner' then
    pos := coalesce(j->>'position', '');
    if pos not in ('owner', 'director', 'manager', 'representative') then raise exception 'Choose how you are connected to the business.'; end if;
    if coalesce(j->>'authorized', '') <> 'true' then raise exception 'Confirm that you are authorised to register this business.'; end if;
    if coalesce(j->>'id_type', '') not in ('', 'nin', 'passport', 'drivers_licence', 'voters_card') then raise exception 'Choose a valid identity document type.'; end if;
    return jsonb_build_object('full_name', public._t(j, 'full_name', 3, 80, 'the full legal name'), 'phone', public._phone_ok(j->>'phone', 'the owner'),
      'email', public._email_ok(j->>'email', 'the owner'), 'position', pos, 'authorized', true, 'id_type', coalesce(j->>'id_type', ''));
  elsif p_section = 'location' then
    if coalesce(j->>'country', 'Nigeria') <> 'Nigeria' then raise exception 'ChowBuy only operates in Nigeria for now.'; end if;
    city := public._t(j, 'city', 2, 40, 'the city');
    if btrim(coalesce(j->>'lat', '')) <> '' or btrim(coalesce(j->>'lng', '')) <> '' then
      begin lat := (j->>'lat')::double precision; lng := (j->>'lng')::double precision;
      exception when others then raise exception 'The map location is not valid.'; end;
      if lat is null or lng is null or lat not between 4 and 14 or lng not between 2.5 and 15 then raise exception 'The map location must be inside Nigeria.'; end if;
    end if;
    return jsonb_build_object('country', 'Nigeria', 'state', public._t(j, 'state', 2, 40, 'the state'), 'city', city, 'area', public._t(j, 'area', 2, 60, 'the area'),
      'address', public._t(j, 'address', 8, 200, 'the full address'), 'postal', public._t(j, 'postal', 0, 10, 'the postal code'), 'branch', public._t(j, 'branch', 0, 60, 'the branch name'),
      'lat', to_jsonb(lat), 'lng', to_jsonb(lng),
      'serviceable', exists (select 1 from public.loc_cities c where lower(c.name) = lower(city) and c.status = 'live'));
  elsif p_section = 'specific' then
    if p_type = 'RESTAURANT' then
      if coalesce(public._int(j->>'prep_minutes'), 0) not between 5 and 120 then raise exception 'Enter the usual preparation time (5 to 120 minutes).'; end if;
      if coalesce(j->>'prep_model', '') not in ('kitchen', 'cloud_kitchen', 'bakery_counter') then raise exception 'Choose your food preparation model.'; end if;
      if coalesce(j->>'menu_status', '') not in ('ready', 'building', 'none') then raise exception 'Tell us how ready your menu is.'; end if;
      if not (coalesce(j->>'delivery', '') = 'true') and not (coalesce(j->>'pickup', '') = 'true') then raise exception 'Choose delivery, pickup or both.'; end if;
      return jsonb_build_object('cuisines', public._arr(j, 'cuisines', null, 1, 8, 'cuisine categories'), 'hours', public._t(j, 'hours', 3, 80, 'the opening hours'),
        'prep_model', j->>'prep_model', 'menu_status', j->>'menu_status', 'prep_minutes', public._int(j->>'prep_minutes'),
        'pickup', (coalesce(j->>'pickup', '') = 'true'), 'delivery', (coalesce(j->>'delivery', '') = 'true'));
    elsif p_type = 'GROCERY_SUPERMARKET' then
      if coalesce(j->>'store_category', '') not in ('supermarket', 'minimart', 'foodstuff', 'household', 'specialty') then raise exception 'Choose your store category.'; end if;
      if coalesce(j->>'inventory_pref', '') not in ('manual', 'barcode', 'pos_sync') then raise exception 'Choose how you manage inventory.'; end if;
      if coalesce(j->>'catalog_status', '') not in ('ready', 'building', 'none') then raise exception 'Tell us how ready your product catalogue is.'; end if;
      return jsonb_build_object('store_category', j->>'store_category', 'product_categories', public._arr(j, 'product_categories', null, 1, 12, 'product categories'),
        'hours', public._t(j, 'hours', 3, 80, 'the opening hours'), 'inventory_pref', j->>'inventory_pref', 'cold_chain', (coalesce(j->>'cold_chain', '') = 'true'), 'catalog_status', j->>'catalog_status');
    elsif p_type = 'PHARMACY' then
      if coalesce(j->>'pharmacy_category', '') not in ('community', 'hospital', 'chain', 'online') then raise exception 'Choose your pharmacy category.'; end if;
      begin exp := (j->>'licence_expiry')::date; exception when others then raise exception 'Enter the premises licence expiry date.'; end;
      if exp is null or exp <= current_date then raise exception 'The premises licence must not be expired.'; end if;
      return jsonb_build_object('pharmacy_category', j->>'pharmacy_category', 'premises_licence_no', public._t(j, 'premises_licence_no', 3, 40, 'the premises licence number'),
        'licence_expiry', exp, 'pharmacist_name', public._t(j, 'pharmacist_name', 3, 80, 'the responsible pharmacist''s name'),
        'pharmacist_reg_no', public._t(j, 'pharmacist_reg_no', 3, 40, 'the pharmacist registration number'), 'hours', public._t(j, 'hours', 3, 80, 'the opening hours'));
    elsif p_type = 'PACKAGE_LOGISTICS' then
      if coalesce(public._int(j->>'fleet_size'), 0) not between 1 and 10000 then raise exception 'Enter your fleet or rider capacity (1 to 10,000).'; end if;
      return jsonb_build_object('logistics_name', public._t(j, 'logistics_name', 2, 80, 'the logistics business name'),
        'service_types', public._arr(j, 'service_types', array['same_day', 'next_day', 'intercity', 'bulk'], 1, 4, 'service types'),
        'operating_regions', public._arr(j, 'operating_regions', null, 1, 12, 'operating regions'),
        'package_types', public._arr(j, 'package_types', array['documents', 'parcels', 'fragile', 'food', 'bulky'], 1, 5, 'package types'),
        'pickup_dropoff', (coalesce(j->>'pickup_dropoff', '') = 'true'), 'fleet_size', public._int(j->>'fleet_size'), 'hours', public._t(j, 'hours', 3, 80, 'the operating hours'));
    end if;
    raise exception 'Choose a business type first.';
  end if;
  raise exception 'Unknown section.';
end $$;

-- Documents each business type must supply. CAC is only demanded of businesses that say they are registered (pharmacies always).
create or replace function public._required_docs(p_type text, p_cac text) returns text[] language sql immutable set search_path = pg_catalog, pg_temp as $$
  select array_remove(array['owner_id']
    || case when p_cac = 'registered' or p_type = 'PHARMACY' then array['cac'] else array[]::text[] end
    || case p_type when 'RESTAURANT' then array['food_permit'] when 'PHARMACY' then array['pcn_premises', 'pharmacist_licence'] else array[]::text[] end, null)
$$;

create or replace function public._app_missing(p_merchant text) returns text[] language plpgsql stable security definer set search_path = public, pg_temp as $$
declare a public.merchant_applications; miss text[] := '{}'; d text;
begin
  select * into a from public.merchant_applications where merchant_id = p_merchant;
  if not found then return array['Application not found']; end if;
  if not exists (select 1 from auth.users where id = a.applicant_id and email_confirmed_at is not null) then miss := array_append(miss, 'Verify your email address'); end if;
  if not a.data ? 'business' then miss := array_append(miss, 'Business information'); end if;
  if not a.data ? 'owner' then miss := array_append(miss, 'Owner or representative details'); end if;
  if not a.data ? 'location' then miss := array_append(miss, 'Business location'); end if;
  if not a.data ? 'specific' then miss := array_append(miss, 'Business-specific details'); end if;
  if not exists (select 1 from public.merchant_settlement where merchant_id = p_merchant) then miss := array_append(miss, 'Payout account details'); end if;
  foreach d in array public._required_docs(a.business_type, a.data->'business'->>'cac_status') loop
    if not exists (select 1 from public.kyc_docs k where k.subject_kind = 'merchant' and k.subject_id = p_merchant and k.doc_type = d and k.status in ('pending', 'approved')) then
      miss := array_append(miss, 'Document: ' || d);
    end if;
  end loop;
  return miss;
end $$;

create or replace function public._app_set_status(p_app uuid, p_status text, p_note text default null) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare mid text;
begin
  update public.merchant_applications set status = p_status, updated_at = now(), review_note = coalesce(p_note, review_note) where id = p_app returning merchant_id into mid;
  update public.merchants set application_status = p_status where id = mid;
end $$;

/* ---------------- merchant: start, save, submit ---------------- */
create or replace function public.merchant_app_start(p_type text) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); r user_role; mid text; aid uuid; ex public.merchant_applications;
begin
  if uid is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  select role into r from public.profiles where id = uid;
  if not found then raise exception 'Account not found.'; end if;
  if r in ('admin', 'rider') then raise exception 'Admin and rider accounts cannot register a business. Use a different account.'; end if;
  if not exists (select 1 from auth.users where id = uid and email_confirmed_at is not null) then raise exception 'Verify your email address first. We sent you a link.'; end if;
  if p_type is null or p_type not in ('RESTAURANT', 'GROCERY_SUPERMARKET', 'PHARMACY', 'PACKAGE_LOGISTICS') then raise exception 'Choose one of the four business types.'; end if;
  -- An unsubmitted draft is reused (and re-typed if they changed their mind), so repeated taps never create duplicate businesses.
  select a.* into ex from public.merchant_applications a join public.merchant_members mm on mm.merchant_id = a.merchant_id and mm.user_id = uid and mm.status = 'active'
    where a.status = 'DRAFT' order by a.created_at limit 1 for update of a;
  if found then
    if ex.business_type <> p_type then
      update public.merchant_applications set business_type = p_type, data = data - 'specific', updated_at = now() where id = ex.id;
      update public.merchants set business_type = p_type, vertical = public._vertical_of(p_type) where id = ex.merchant_id;
    end if;
    return jsonb_build_object('merchant', ex.merchant_id, 'application', ex.id, 'reused', true);
  end if;
  if (select count(*) from public.merchant_members where user_id = uid and status = 'active') >= 5 then raise exception 'This account already manages the maximum number of businesses. Contact ChowBuy support.'; end if;
  mid := 'mc' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  insert into public.merchants (id, name, vertical, business_type, application_status, active, open, lat, lng) values (mid, 'New business', public._vertical_of(p_type), p_type, 'DRAFT', false, false, 0, 0);
  insert into public.merchant_members (merchant_id, user_id, role, status) values (mid, uid, 'manager', 'active');
  insert into public.merchant_applications (merchant_id, applicant_id, business_type) values (mid, uid, p_type) returning id into aid;
  perform public.log_audit('merchant_application_started', jsonb_build_object('merchant', mid, 'application', aid, 'type', p_type));
  return jsonb_build_object('merchant', mid, 'application', aid, 'reused', false);
end $$;

create or replace function public.merchant_app_save(p_merchant text, p_section text, p_data jsonb) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); a public.merchant_applications; clean jsonb; pos text; other int;
begin
  if uid is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  if p_section not in ('business', 'owner', 'location', 'specific') then raise exception 'Unknown section.'; end if;
  select * into a from public.merchant_applications where merchant_id = p_merchant for update;
  if not found or not public._is_member(p_merchant, array['owner', 'manager']) then raise exception 'Application not found.'; end if;
  if a.status not in ('DRAFT', 'ACTION_REQUIRED') then raise exception 'This application can no longer be edited.'; end if;
  clean := public._app_clean(p_section, p_data, a.business_type);
  update public.merchant_applications set data = jsonb_set(data, array[p_section], clean, true), updated_at = now() where id = a.id;
  if p_section = 'business' then
    update public.merchants set name = clean->>'trading_name', trading_name = clean->>'trading_name' where id = p_merchant;
  elsif p_section = 'location' then
    update public.merchants set area = (clean->>'area') || ', ' || (clean->>'city'),
      lat = coalesce((clean->>'lat')::double precision, lat), lng = coalesce((clean->>'lng')::double precision, lng) where id = p_merchant;
  elsif p_section = 'specific' then
    update public.merchants set hours = clean->>'hours',
      cuisine = case when a.business_type = 'RESTAURANT' then array(select jsonb_array_elements_text(clean->'cuisines')) else cuisine end,
      eta_min = case when a.business_type = 'RESTAURANT' then (clean->>'prep_minutes')::int else eta_min end,
      eta_max = case when a.business_type = 'RESTAURANT' then (clean->>'prep_minutes')::int + 15 else eta_max end where id = p_merchant;
  elsif p_section = 'owner' then
    pos := clean->>'position';
    select count(*) into other from public.merchant_members where merchant_id = p_merchant and role = 'owner' and status = 'active' and user_id <> uid;
    if pos = 'owner' and other = 0 then
      -- The applicant says they own the business: record it, auditable. Admin checks this against the ID document before approving.
      update public.merchant_members set role = 'owner', relationship = 'owner' where merchant_id = p_merchant and user_id = uid;
      update public.merchants set owner_id = uid where id = p_merchant and owner_id is null;
    else
      update public.merchant_members set relationship = pos where merchant_id = p_merchant and user_id = uid;
    end if;
    perform public.log_audit('merchant_owner_declared', jsonb_build_object('merchant', p_merchant, 'position', pos));
  end if;
  return jsonb_build_object('saved', p_section, 'data', clean);
end $$;

create or replace function public.merchant_settlement_save(p_merchant text, p_beneficiary text, p_bank text, p_account text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare ben text := btrim(coalesce(p_beneficiary, '')); bank text := btrim(coalesce(p_bank, '')); acct text := regexp_replace(coalesce(p_account, ''), '\s', '', 'g');
begin
  if not public._is_member(p_merchant, array['owner', 'manager']) then raise exception 'Store not found.'; end if;
  if char_length(ben) not between 3 and 80 then raise exception 'Enter the account name (3 to 80 characters).'; end if;
  if char_length(bank) not between 2 and 60 then raise exception 'Enter the bank name.'; end if;
  if acct !~ '^[0-9]{10}$' then raise exception 'Enter the 10-digit account number.'; end if;
  insert into public.merchant_settlement (merchant_id, beneficiary, bank_name, account_number, status, updated_by) values (p_merchant, ben, bank, acct, 'PENDING_VERIFICATION', auth.uid())
  on conflict (merchant_id) do update set beneficiary = ben, bank_name = bank, account_number = acct, status = 'PENDING_VERIFICATION', note = '', updated_by = auth.uid(), updated_at = now();
  perform public.log_audit('merchant_settlement_saved', jsonb_build_object('merchant', p_merchant));
end $$;

create or replace function public.merchant_doc_submit(p_merchant text, p_doc text, p_path text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public._is_member(p_merchant, array['owner', 'manager']) then raise exception 'Store not found.'; end if;
  if p_doc is null or p_doc not in ('owner_id', 'cac', 'food_permit', 'pcn_premises', 'pharmacist_licence', 'operating_permit', 'vehicle_docs', 'tin', 'logo') then raise exception 'Unknown document type.'; end if;
  if p_path is null or p_path !~ '^[A-Za-z0-9_-]+/[A-Za-z0-9._ -]{1,120}$' or p_path like '%..%' or split_part(p_path, '/', 1) <> p_merchant then raise exception 'Upload the document again.'; end if;
  if exists (select 1 from public.merchant_applications where merchant_id = p_merchant and status in ('REJECTED', 'SUSPENDED')) then raise exception 'This application is closed. Contact ChowBuy support.'; end if;
  insert into public.kyc_docs (subject_kind, subject_id, doc_type, status, file_path, submitted_by) values ('merchant', p_merchant, p_doc, 'pending', p_path, auth.uid())
  on conflict (subject_kind, subject_id, doc_type) do update set status = 'pending', file_path = excluded.file_path, note = '', submitted_by = auth.uid(), submitted_by_admin = false, reviewed_by = null, reviewed_at = null, updated_at = now()
    where public.kyc_docs.status <> 'approved';
  if not found then raise exception 'This document is already approved.'; end if;
end $$;

create or replace function public.merchant_app_submit(p_merchant text) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare a public.merchant_applications; miss text[];
begin
  select * into a from public.merchant_applications where merchant_id = p_merchant for update;
  if not found or not public._is_member(p_merchant, array['owner', 'manager']) then raise exception 'Application not found.'; end if;
  if a.status in ('SUBMITTED', 'UNDER_REVIEW') then return jsonb_build_object('status', a.status, 'already', true); end if;   -- a double tap does nothing
  if a.status not in ('DRAFT', 'ACTION_REQUIRED') then raise exception 'This application cannot be submitted.'; end if;
  miss := public._app_missing(p_merchant);
  if cardinality(miss) > 0 then raise exception 'Still needed: %.', array_to_string(miss[1:4], ', ') || case when cardinality(miss) > 4 then ' and ' || (cardinality(miss) - 4) || ' more' else '' end; end if;
  update public.merchant_applications set submitted_at = now() where id = a.id;
  perform public._app_set_status(a.id, 'SUBMITTED');
  perform public.log_audit('merchant_application_submitted', jsonb_build_object('merchant', p_merchant, 'application', a.id));
  return jsonb_build_object('status', 'SUBMITTED');
end $$;

create or replace function public.merchant_checklist_ack(p_merchant text, p_key text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_key not in ('notifications', 'policies', 'fulfillment') then raise exception 'Unknown task.'; end if;
  if not public._is_member(p_merchant, array['owner', 'manager']) then raise exception 'Store not found.'; end if;
  update public.merchant_applications set checklist = checklist || jsonb_build_object(p_key, true) where merchant_id = p_merchant;
end $$;

/* One call for the whole onboarding / status screen. */
create or replace function public.merchant_app_get(p_merchant text) returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare a public.merchant_applications; m public.merchants; s public.merchant_settlement;
begin
  if not public._is_member(p_merchant, array['owner', 'manager']) then raise exception 'Store not found.'; end if;
  select * into a from public.merchant_applications where merchant_id = p_merchant;
  select * into m from public.merchants where id = p_merchant;
  select * into s from public.merchant_settlement where merchant_id = p_merchant;
  return jsonb_build_object('merchant', p_merchant, 'name', m.name, 'type', m.business_type, 'status', m.application_status, 'note', coalesce(a.review_note, ''),
    'submittedAt', a.submitted_at, 'data', coalesce(a.data, '{}'), 'active', m.active, 'verified', m.verified,
    'required', to_jsonb(public._required_docs(m.business_type, a.data->'business'->>'cac_status')),
    'missing', to_jsonb(public._app_missing(p_merchant)),
    'docs', coalesce((select jsonb_agg(jsonb_build_object('doc', d.doc_type, 'status', d.status, 'note', d.note, 'at', d.updated_at)) from public.kyc_docs d where d.subject_kind = 'merchant' and d.subject_id = p_merchant), '[]'),
    'settlement', case when s.merchant_id is null then null else jsonb_build_object('beneficiary', s.beneficiary, 'bank', s.bank_name, 'last4', right(s.account_number, 4), 'status', s.status, 'note', s.note) end);
end $$;

/* ---------------- merchant: who am I, and where may I work ---------------- */
create or replace function public.merchant_me() returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); out jsonb; confirmed boolean;
begin
  if uid is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  select exists (select 1 from auth.users where id = uid and email_confirmed_at is not null) into confirmed;
  select jsonb_build_object('name', coalesce(p.full_name, ''), 'email', coalesce(p.email, ''), 'role', p.role, 'emailConfirmed', confirmed,
    'workspaces', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'name', m.name, 'type', m.business_type, 'vertical', m.vertical, 'role', mm.role, 'status', m.application_status,
      'active', m.active, 'open', m.open, 'verified', m.verified, 'area', coalesce(m.area, ''), 'hours', coalesce(m.hours, ''), 'deliveryFee', m.delivery_fee, 'etaMin', m.eta_min, 'etaMax', m.eta_max,
      'ratingPct', m.rating_pct, 'ratingCount', m.rating_count) order by m.name)
      from public.merchant_members mm join public.merchants m on m.id = mm.merchant_id where mm.user_id = uid and mm.status = 'active'), '[]'),
    'invitations', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'name', m.name, 'type', m.business_type, 'role', mm.role) order by m.name)
      from public.merchant_members mm join public.merchants m on m.id = mm.merchant_id where mm.user_id = uid and mm.status = 'invited'), '[]'))
  into out from public.profiles p where p.id = uid;
  if out is null then raise exception 'Account not found.'; end if;
  -- "stores" is the subset the dashboard may open: approved businesses only.
  return out || jsonb_build_object('stores', coalesce((select jsonb_agg(w) from jsonb_array_elements(out->'workspaces') w where w->>'status' = 'APPROVED'), '[]'));
end $$;

create or replace function public.merchant_team(p_merchant text) returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public._is_member(p_merchant, array['owner', 'manager']) then raise exception 'Store not found.'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('user', mm.user_id, 'name', coalesce(p.full_name, ''), 'email', coalesce(p.email, ''), 'role', mm.role, 'status', mm.status, 'relationship', mm.relationship, 'me', mm.user_id = auth.uid())
    order by (mm.role = 'owner') desc, p.full_name) from public.merchant_members mm join public.profiles p on p.id = mm.user_id where mm.merchant_id = p_merchant and mm.status in ('active', 'invited')), '[]');
end $$;

create or replace function public.merchant_invite(p_merchant text, p_email text, p_role text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid; r user_role; em text := lower(btrim(coalesce(p_email, '')));
begin
  if not public._is_member(p_merchant, array['owner']) then raise exception 'Only the owner can invite people.'; end if;
  if p_role not in ('manager', 'staff') then raise exception 'Choose manager or staff.'; end if;
  select id, role into uid, r from public.profiles where lower(email) = em;
  if not found then raise exception 'No ChowBuy account uses that email. Ask them to create an account first.'; end if;
  if r in ('admin', 'rider') then raise exception 'That account cannot join a business.'; end if;
  if uid = auth.uid() then raise exception 'You are already on this team.'; end if;
  insert into public.merchant_members (merchant_id, user_id, role, status, relationship) values (p_merchant, uid, p_role, 'invited', p_role)
  on conflict (merchant_id, user_id) do update set role = excluded.role, status = case when public.merchant_members.status = 'active' then 'active' else 'invited' end
    where public.merchant_members.role <> 'owner';
  perform public.log_audit('merchant_member_invited', jsonb_build_object('merchant', p_merchant, 'user', uid, 'role', p_role));
end $$;

create or replace function public.merchant_invite_respond(p_merchant text, p_accept boolean) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.merchant_members set status = case when p_accept then 'active' else 'removed' end where merchant_id = p_merchant and user_id = auth.uid() and status = 'invited';
  if not found then raise exception 'Invitation not found.'; end if;
  perform public.log_audit('merchant_invite_' || case when p_accept then 'accepted' else 'declined' end, jsonb_build_object('merchant', p_merchant));
end $$;

create or replace function public.merchant_member_remove(p_merchant text, p_user uuid) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public._is_member(p_merchant, array['owner']) then raise exception 'Only the owner can remove people.'; end if;
  if p_user = auth.uid() then raise exception 'You cannot remove yourself.'; end if;
  update public.merchant_members set status = 'removed' where merchant_id = p_merchant and user_id = p_user and role <> 'owner' and status in ('active', 'invited');
  if not found then raise exception 'Team member not found.'; end if;
  perform public.log_audit('merchant_member_removed', jsonb_build_object('merchant', p_merchant, 'user', p_user));
end $$;

create or replace function public.merchant_settlement_get(p_merchant text) returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare s public.merchant_settlement;
begin
  if not public._is_member(p_merchant, array['owner']) and not public.is_admin() then raise exception 'Store not found.'; end if;
  select * into s from public.merchant_settlement where merchant_id = p_merchant;
  if not found then return null; end if;
  return jsonb_build_object('beneficiary', s.beneficiary, 'bank', s.bank_name, 'last4', right(s.account_number, 4), 'status', s.status, 'note', s.note);
end $$;

/* ---------------- setup checklist: completion is computed from facts, never from opening a screen ---------------- */
create or replace function public.merchant_checklist(p_merchant text) returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare m public.merchants; a public.merchant_applications; out jsonb := '[]'; n int; sp jsonb; s text; docs_ok boolean;
begin
  if not public._is_member(p_merchant, array['owner', 'manager']) then raise exception 'Store not found.'; end if;
  select * into m from public.merchants where id = p_merchant;
  select * into a from public.merchant_applications where merchant_id = p_merchant;
  sp := coalesce(a.data->'specific', '{}');
  select status into s from public.merchant_settlement where merchant_id = p_merchant;
  select count(*) into n from public.products where merchant_id = p_merchant;
  out := out
    || jsonb_build_object('key', 'profile', 'label', 'Confirm business profile', 'done', coalesce(a.data ? 'business', false), 'manual', false)
    || jsonb_build_object('key', 'address', 'label', 'Confirm business address', 'done', coalesce(a.data ? 'location', false), 'manual', false)
    || jsonb_build_object('key', 'hours', 'label', 'Configure opening hours', 'done', coalesce(m.hours, '') <> '', 'manual', false)
    || jsonb_build_object('key', 'settlement', 'label', 'Verify settlement information', 'done', coalesce(s = 'VERIFIED', false), 'manual', false)
    || jsonb_build_object('key', 'notifications', 'label', 'Configure notifications', 'done', coalesce((a.checklist->>'notifications')::boolean, false), 'manual', true)
    || jsonb_build_object('key', 'policies', 'label', 'Review operating policies', 'done', coalesce((a.checklist->>'policies')::boolean, false), 'manual', true);
  if m.business_type = 'RESTAURANT' then
    out := out
      || jsonb_build_object('key', 'menu_categories', 'label', 'Add menu categories', 'done', exists (select 1 from public.products where merchant_id = p_merchant and category <> ''), 'manual', false)
      || jsonb_build_object('key', 'menu_items', 'label', 'Add menu items', 'done', n > 0, 'manual', false)
      || jsonb_build_object('key', 'prices', 'label', 'Set prices', 'done', n > 0 and not exists (select 1 from public.products where merchant_id = p_merchant and price = 0), 'manual', false)
      || jsonb_build_object('key', 'prep_times', 'label', 'Configure preparation times', 'done', coalesce(sp ? 'prep_minutes', false), 'manual', false)
      || jsonb_build_object('key', 'accept_orders', 'label', 'Configure order acceptance', 'done', m.open, 'manual', false);
  elsif m.business_type = 'GROCERY_SUPERMARKET' then
    out := out
      || jsonb_build_object('key', 'product_categories', 'label', 'Add product categories', 'done', exists (select 1 from public.products where merchant_id = p_merchant and category <> ''), 'manual', false)
      || jsonb_build_object('key', 'products', 'label', 'Add products', 'done', n > 0, 'manual', false)
      || jsonb_build_object('key', 'prices_stock', 'label', 'Set prices and stock', 'done', n > 0 and exists (select 1 from public.products where merchant_id = p_merchant and in_stock) and not exists (select 1 from public.products where merchant_id = p_merchant and price = 0), 'manual', false)
      || jsonb_build_object('key', 'inventory', 'label', 'Configure inventory', 'done', coalesce(sp->>'inventory_pref', '') <> '', 'manual', false)
      || jsonb_build_object('key', 'fulfillment', 'label', 'Configure fulfilment', 'done', coalesce((a.checklist->>'fulfillment')::boolean, false), 'manual', true);
  elsif m.business_type = 'PHARMACY' then
    select not exists (select 1 from unnest(array['pcn_premises', 'pharmacist_licence']) d where not exists (select 1 from public.kyc_docs k where k.subject_kind = 'merchant' and k.subject_id = p_merchant and k.doc_type = d and k.status = 'approved')) into docs_ok;
    out := out
      || jsonb_build_object('key', 'regulatory', 'label', 'Complete required regulatory verification', 'done', m.verified, 'manual', false)
      || jsonb_build_object('key', 'professional', 'label', 'Confirm qualified professional details', 'done', docs_ok, 'manual', false)
      || jsonb_build_object('key', 'catalog', 'label', 'Configure authorised product catalogue', 'done', m.verified and n > 0, 'manual', false)
      || jsonb_build_object('key', 'compliance', 'label', 'Complete compliance checks before activation', 'done', m.verified and m.active and docs_ok, 'manual', false);
  else
    out := out
      || jsonb_build_object('key', 'service_areas', 'label', 'Configure service areas', 'done', jsonb_array_length(coalesce(sp->'operating_regions', '[]')) > 0, 'manual', false)
      || jsonb_build_object('key', 'package_types', 'label', 'Define package types', 'done', jsonb_array_length(coalesce(sp->'package_types', '[]')) > 0, 'manual', false)
      || jsonb_build_object('key', 'dispatch', 'label', 'Configure dispatch capacity', 'done', coalesce((sp->>'fleet_size')::int, 0) > 0, 'manual', false)
      || jsonb_build_object('key', 'operational', 'label', 'Complete operational verification', 'done', m.verified, 'manual', false);
  end if;
  return out;
end $$;

/* ---------------- existing merchant functions, now membership-based ---------------- */
create or replace function public.merchant_set_stage(p_order text, p_stage order_stage) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_stage <> 'preparing' then raise exception 'Merchants can only start preparing here. Use cancel to cancel an order.'; end if;
  if not exists (select 1 from public.orders o where o.id = p_order and public._is_member(o.merchant_id) and (o.paid or o.pay = 'cod'))
    and not public.is_admin() then raise exception 'Order not found.'; end if;
  perform public._set_stage(p_order, p_stage);
end $$;

create or replace function public.merchant_cancel_order(p_order text, p_reason text) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare o public.orders; mname text; own boolean; why text := left(btrim(coalesce(p_reason, '')), 200); amt int := 0;
begin
  if char_length(why) < 3 then raise exception 'Choose or write a reason for cancelling.'; end if;
  select ord.* into o from public.orders ord where ord.id = p_order and (ord.paid or ord.pay = 'cod') and (public._is_member(ord.merchant_id) or public.is_admin()) for update of ord;
  if not found then raise exception 'Order not found.'; end if;
  if o.stage not in ('received', 'preparing') then raise exception 'This order can no longer be cancelled.'; end if;
  select name, public._is_member(id) into mname, own from public.merchants where id = o.merchant_id;
  if o.paid and o.pay <> 'cod' and o.customer_id is not null and o.total > 0 then
    if public._credit(o.customer_id, o.total, 'Refund: order ' || o.id || ' was cancelled', 'refund:' || o.id) then amt := o.total; end if;
  end if;
  update public.orders set stage = 'cancelled', stage_times = stage_times || jsonb_build_object('cancelled', public.now_ms()),
    cancel_reason = why, cancelled_by = case when own then 'merchant' else 'admin' end, refunded = amt where id = o.id;
  perform public.log_audit('Order ' || o.id || ' cancelled by ' || case when own then mname else 'admin' end || ': ' || why || case when amt > 0 then ' (refunded N' || amt || ' to the customer wallet)' else '' end,
    jsonb_build_object('order', o.id, 'merchant', o.merchant_id, 'reason', why, 'refunded', amt));
  return jsonb_build_object('refunded', amt);
end $$;

create or replace function public.merchant_mark_ready(p_order text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare o public.orders;
begin
  select ord.* into o from public.orders ord where ord.id = p_order and (ord.paid or ord.pay = 'cod') and (public._is_member(ord.merchant_id) or public.is_admin()) for update of ord;
  if not found then raise exception 'Order not found.'; end if;
  if o.stage not in ('preparing', 'rider_accepted', 'rider_at_store') then raise exception 'Start preparing the order before marking it ready.'; end if;
  if o.stage_times ? 'ready' then return; end if;
  update public.orders set stage_times = stage_times || jsonb_build_object('ready', public.now_ms()) where id = o.id;
end $$;

create or replace function public.merchant_orders(p_merchant text, p_limit int default 150) returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  perform public._store_of(p_merchant);
  return coalesce((select jsonb_agg(x order by x.created desc) from (
    select o.id, o.created_at as created, o.stage::text as stage, o.stage_times as times, o.pay::text as pay, o.paid,
      o.subtotal, o.delivery_fee as fee, o.discount, o.total, o.lines, o.cancel_reason as "cancelReason", o.refunded,
      jsonb_build_object('line', o.address->>'line', 'area', o.address->>'area', 'landmark', o.address->>'landmark') as addr,
      coalesce(nullif(split_part(coalesce(p.full_name, ''), ' ', 1), ''), 'Customer') as customer,
      case when o.rider is null then null else jsonb_build_object('name', o.rider->>'name', 'plate', o.rider->>'plate') end as rider
    from public.orders o left join public.profiles p on p.id = o.customer_id
    where o.merchant_id = p_merchant and (o.paid or o.pay = 'cod')
    order by o.created_at desc limit least(greatest(coalesce(p_limit, 150), 1), 300)) x), '[]'::jsonb);
end $$;

create or replace function public.merchant_product_save(p_merchant text, p_id text, p_name text, p_descr text, p_price int, p_category text, p_in_stock boolean, p_rx boolean default false)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare m public.merchants; pid text; v_rx boolean;
begin
  m := public._store_of(p_merchant);
  if not public.is_admin() and not public._is_member(p_merchant, array['owner', 'manager']) then raise exception 'Only an owner or manager can change the catalogue.'; end if;
  if m.application_status <> 'APPROVED' or not m.verified then
    raise exception '%', case when m.business_type = 'PHARMACY' then 'Your pharmacy must finish verification before you can list products.' else 'Your application must be approved before you can list products.' end;
  end if;
  p_name := btrim(coalesce(p_name, '')); p_descr := btrim(coalesce(p_descr, '')); p_category := btrim(coalesce(p_category, ''));
  if char_length(p_name) not between 1 and 80 then raise exception 'Enter a name of up to 80 characters.'; end if;
  if p_price is null or p_price < 0 or p_price > 10000000 then raise exception 'Enter a valid price.'; end if;
  if char_length(p_descr) > 400 then raise exception 'The description is too long (400 characters at most).'; end if;
  if char_length(p_category) > 40 then raise exception 'The category is too long (40 characters at most).'; end if;
  v_rx := coalesce(p_rx, false) and m.vertical = 'pharmacy';
  if coalesce(p_id, '') = '' then
    pid := 'p' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
    insert into public.products (id, merchant_id, name, descr, price, category, in_stock, rx) values (pid, m.id, p_name, p_descr, p_price, p_category, coalesce(p_in_stock, true), v_rx);
  else
    update public.products set name = p_name, descr = p_descr, price = p_price, category = p_category, in_stock = coalesce(p_in_stock, true), rx = v_rx
      where id = p_id and merchant_id = m.id;
    if not found then raise exception 'Item not found.'; end if;
    pid := p_id;
  end if;
  return pid;
end $$;

create or replace function public.merchant_product_stock(p_id text, p_in_stock boolean) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.products p set in_stock = coalesce(p_in_stock, true)
    where p.id = p_id and (public._is_member(p.merchant_id) or public.is_admin());
  if not found then raise exception 'Item not found.'; end if;
end $$;

create or replace function public.merchant_product_delete(p_id text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  delete from public.products p where p.id = p_id and (public._is_member(p.merchant_id, array['owner', 'manager']) or public.is_admin());
  if not found then raise exception 'Item not found.'; end if;
end $$;

create or replace function public.merchant_set_open(p_merchant text, p_open boolean) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare m public.merchants;
begin
  m := public._store_of(p_merchant);
  if coalesce(p_open, true) and (m.application_status <> 'APPROVED' or not m.active) then raise exception 'Your store cannot accept orders until ChowBuy has approved and activated it.'; end if;
  update public.merchants set open = coalesce(p_open, true) where id = p_merchant;
end $$;

-- Direct table updates are closed; the fields a store may edit go through here.
create or replace function public.merchant_store_update(p_merchant text, p_name text, p_hours text, p_fee int, p_eta_min int, p_eta_max int) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public._is_member(p_merchant, array['owner', 'manager']) then raise exception 'Store not found.'; end if;
  if char_length(btrim(coalesce(p_name, ''))) not between 2 and 80 then raise exception 'Enter a store name.'; end if;
  if char_length(coalesce(p_hours, '')) > 80 then raise exception 'The opening hours are too long.'; end if;
  if p_fee is null or p_fee not between 0 and 100000 then raise exception 'Enter a delivery fee in naira.'; end if;
  if p_eta_min is null or p_eta_max is null or p_eta_min < 1 or p_eta_max < p_eta_min or p_eta_max > 240 then raise exception 'Enter a delivery time range, fastest first.'; end if;
  update public.merchants set name = btrim(p_name), hours = btrim(coalesce(p_hours, '')), delivery_fee = p_fee, eta_min = p_eta_min, eta_max = p_eta_max where id = p_merchant;
end $$;

/* Admin: link a store to the account that runs it (or clear it). Now writes a real membership as well as owner_id. */
create or replace function public.admin_merchant_owner(p_merchant text, p_email text) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid; r user_role; em text := lower(btrim(coalesce(p_email, '')));
begin
  perform public._need_admin();
  if not exists (select 1 from public.merchants where id = p_merchant) then raise exception 'Store not found.'; end if;
  if em = '' then
    update public.merchant_members set status = 'removed' where merchant_id = p_merchant and role = 'owner' and status = 'active';
    update public.merchants set owner_id = null where id = p_merchant;
    perform public.log_audit('merchant_owner_cleared', jsonb_build_object('merchant', p_merchant));
    return jsonb_build_object('owner', '');
  end if;
  select id, role into uid, r from public.profiles where lower(email) = em;
  if not found then raise exception 'No ChowBuy account uses that email. Ask them to sign up in the app first.'; end if;
  if r in ('admin', 'rider') then raise exception 'Admin and rider accounts cannot own a store.'; end if;
  update public.merchant_members set status = 'removed' where merchant_id = p_merchant and role = 'owner' and status = 'active' and user_id <> uid;
  insert into public.merchant_members (merchant_id, user_id, role, status, relationship) values (p_merchant, uid, 'owner', 'active', 'owner')
  on conflict (merchant_id, user_id) do update set role = 'owner', status = 'active', relationship = 'owner';
  update public.merchants set owner_id = uid where id = p_merchant;
  update public.profiles set role = 'merchant' where id = uid and role = 'customer';
  perform public.log_audit('merchant_owner_set', jsonb_build_object('merchant', p_merchant, 'owner', uid));
  return jsonb_build_object('owner', em);
end $$;

create or replace function public.admin_merchants() returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  perform public._need_admin();
  return coalesce((select jsonb_agg(x order by x.name) from (
    select m.id, m.name, m.vertical, m.business_type, m.application_status, m.is_demo, coalesce(m.area, '') as city, m.active, m.open, m.rating_pct, m.rating_count,
      coalesce((select p.email from public.merchant_members mm join public.profiles p on p.id = mm.user_id where mm.merchant_id = m.id and mm.role = 'owner' and mm.status = 'active' limit 1), '') as owner,
      (select count(*) from public.orders o where o.merchant_id = m.id and o.created_at >= now() - interval '30 days') as orders30,
      (select coalesce(sum(o.total), 0) from public.orders o where o.merchant_id = m.id and o.stage = 'delivered' and o.created_at >= now() - interval '30 days') as gmv30,
      (select count(*) from public.kyc_docs d where d.subject_kind = 'merchant' and d.subject_id = m.id and d.status = 'approved') as docs_ok,
      (select count(*) from public.kyc_docs d where d.subject_kind = 'merchant' and d.subject_id = m.id and d.status = 'pending') as docs_pending
    from public.merchants m) x), '[]'::jsonb);
end $$;

/* ---------------- admin: application review ---------------- */
create or replace function public.admin_applications(p_status text default 'all', p_type text default 'all', p_search text default '') returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare q text := '%' || lower(btrim(coalesce(p_search, ''))) || '%';
begin
  perform public._need_admin();
  return coalesce((select jsonb_agg(x order by x.sort desc) from (
    select a.id, a.merchant_id as merchant, m.name, a.business_type as type, a.status, coalesce(pr.email, '') as applicant, coalesce(pr.full_name, '') as applicant_name,
      coalesce(a.data->'location'->>'city', '') as city, coalesce((a.data->'location'->>'serviceable')::boolean, false) as serviceable, a.submitted_at, a.created_at,
      (select count(*) from public.kyc_docs d where d.subject_kind = 'merchant' and d.subject_id = a.merchant_id and d.status = 'approved') as docs_ok,
      (select count(*) from public.kyc_docs d where d.subject_kind = 'merchant' and d.subject_id = a.merchant_id and d.status = 'pending') as docs_pending,
      cardinality(public._required_docs(a.business_type, a.data->'business'->>'cac_status')) as docs_required,
      coalesce(a.submitted_at, a.created_at) as sort
    from public.merchant_applications a join public.merchants m on m.id = a.merchant_id join public.profiles pr on pr.id = a.applicant_id
    where (coalesce(p_status, 'all') = 'all' or a.status = p_status) and (coalesce(p_type, 'all') = 'all' or a.business_type = p_type)
      and lower(m.name || ' ' || coalesce(pr.email, '') || ' ' || coalesce(pr.full_name, '')) like q
    limit 300) x), '[]'::jsonb);
end $$;

create or replace function public.admin_application(p_id uuid) returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare a public.merchant_applications; m public.merchants; s public.merchant_settlement;
begin
  perform public._need_admin();
  select * into a from public.merchant_applications where id = p_id;
  if not found then raise exception 'Application not found.'; end if;
  select * into m from public.merchants where id = a.merchant_id;
  select * into s from public.merchant_settlement where merchant_id = a.merchant_id;
  return jsonb_build_object('id', a.id, 'merchant', a.merchant_id, 'name', m.name, 'type', a.business_type, 'status', a.status, 'note', a.review_note, 'data', a.data,
    'active', m.active, 'verified', m.verified, 'submittedAt', a.submitted_at, 'reviewedAt', a.reviewed_at,
    'required', to_jsonb(public._required_docs(a.business_type, a.data->'business'->>'cac_status')), 'missing', to_jsonb(public._app_missing(a.merchant_id)),
    'applicant', (select jsonb_build_object('name', p.full_name, 'email', p.email, 'phone', p.phone) from public.profiles p where p.id = a.applicant_id),
    'members', coalesce((select jsonb_agg(jsonb_build_object('name', p.full_name, 'email', p.email, 'role', mm.role, 'status', mm.status, 'relationship', mm.relationship, 'since', mm.created_at) order by mm.created_at)
      from public.merchant_members mm join public.profiles p on p.id = mm.user_id where mm.merchant_id = a.merchant_id), '[]'),
    'docs', coalesce((select jsonb_agg(jsonb_build_object('doc', d.doc_type, 'status', d.status, 'file', d.file_path, 'note', d.note, 'at', d.updated_at)) from public.kyc_docs d where d.subject_kind = 'merchant' and d.subject_id = a.merchant_id), '[]'),
    'settlement', case when s.merchant_id is null then null else jsonb_build_object('beneficiary', s.beneficiary, 'bank', s.bank_name, 'account', s.account_number, 'status', s.status, 'note', s.note) end,
    'history', coalesce((select jsonb_agg(jsonb_build_object('at', l.at, 'action', l.action, 'by', coalesce(p.email, 'system'), 'meta', l.meta) order by l.at desc)
      from (select * from public.audit_log where meta->>'merchant' = a.merchant_id order by at desc limit 60) l left join public.profiles p on p.id = l.actor), '[]'));
end $$;

create or replace function public.admin_application_decide(p_id uuid, p_action text, p_note text default '') returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare a public.merchant_applications; note text := left(btrim(coalesce(p_note, '')), 500); miss text[]; new_status text; d text;
begin
  perform public._need_admin();
  select * into a from public.merchant_applications where id = p_id for update;
  if not found then raise exception 'Application not found.'; end if;
  if p_action = 'start_review' then
    if a.status <> 'SUBMITTED' then raise exception 'Only a submitted application can be taken into review.'; end if; new_status := 'UNDER_REVIEW';
  elsif p_action = 'request_info' then
    if a.status not in ('SUBMITTED', 'UNDER_REVIEW') then raise exception 'Only an application in review can be sent back.'; end if;
    if char_length(note) < 5 then raise exception 'Say what the merchant needs to fix. They will see this.'; end if; new_status := 'ACTION_REQUIRED';
  elsif p_action = 'approve' then
    if a.status not in ('SUBMITTED', 'UNDER_REVIEW') then raise exception 'Only an application in review can be approved.'; end if;
    miss := '{}';
    foreach d in array public._required_docs(a.business_type, a.data->'business'->>'cac_status') loop
      if not exists (select 1 from public.kyc_docs k where k.subject_kind = 'merchant' and k.subject_id = a.merchant_id and k.doc_type = d and k.status = 'approved') then miss := array_append(miss, d); end if;
    end loop;
    if cardinality(miss) > 0 then raise exception 'Approve these documents first: %.', array_to_string(miss, ', '); end if;
    new_status := 'APPROVED';
  elsif p_action = 'reject' then
    if a.status not in ('SUBMITTED', 'UNDER_REVIEW', 'ACTION_REQUIRED') then raise exception 'This application cannot be rejected now.'; end if;
    if char_length(note) < 5 then raise exception 'Give the reason. The merchant will see it.'; end if; new_status := 'REJECTED';
  elsif p_action = 'reopen' then
    if a.status <> 'REJECTED' then raise exception 'Only a rejected application can be reopened.'; end if; new_status := 'ACTION_REQUIRED';
  elsif p_action = 'suspend' then
    if a.status <> 'APPROVED' then raise exception 'Only an approved merchant can be suspended.'; end if;
    if char_length(note) < 5 then raise exception 'Give the reason for the suspension.'; end if; new_status := 'SUSPENDED';
  elsif p_action = 'reinstate' then
    if a.status <> 'SUSPENDED' then raise exception 'Only a suspended merchant can be reinstated.'; end if; new_status := 'APPROVED';
  else raise exception 'Unknown action.'; end if;

  update public.merchant_applications set reviewed_by = auth.uid(), reviewed_at = now() where id = a.id;
  perform public._app_set_status(a.id, new_status, case when p_action in ('approve', 'reinstate', 'start_review') then '' else note end);
  if new_status = 'APPROVED' then
    update public.merchants set active = true, verified = true where id = a.merchant_id;   -- closed until the merchant opens it
    update public.profiles set role = 'merchant' where role = 'customer' and id in (select user_id from public.merchant_members where merchant_id = a.merchant_id and status = 'active');
  elsif new_status in ('SUSPENDED', 'REJECTED') then
    update public.merchants set active = false, open = false where id = a.merchant_id;
  end if;
  perform public.log_audit('merchant_application_' || p_action, jsonb_build_object('merchant', a.merchant_id, 'application', a.id, 'from', a.status, 'to', new_status, 'note', note));
  return jsonb_build_object('status', new_status);
end $$;

create or replace function public.admin_settlement_status(p_merchant text, p_status text, p_note text default '') returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public._need_admin();
  if p_status not in ('PENDING_VERIFICATION', 'VERIFIED', 'FAILED') then raise exception 'Bad status.'; end if;
  if p_status = 'FAILED' and char_length(btrim(coalesce(p_note, ''))) < 3 then raise exception 'Say what was wrong with the account details.'; end if;
  update public.merchant_settlement set status = p_status, note = left(coalesce(p_note, ''), 300), updated_by = auth.uid(), updated_at = now() where merchant_id = p_merchant;
  if not found then raise exception 'No payout details on file.'; end if;
  perform public.log_audit('merchant_settlement_' || lower(p_status), jsonb_build_object('merchant', p_merchant, 'note', p_note));
end $$;

/* ---------------- grants: nothing here is callable anonymously ---------------- */
revoke execute on function public._is_member(text, text[]), public._vertical_of(text), public._int(text), public._owner_sync(), public._t(jsonb, text, int, int, text), public._arr(jsonb, text, text[], int, int, text), public._email_ok(text, text), public._phone_ok(text, text),
  public._app_clean(text, jsonb, text), public._required_docs(text, text), public._app_missing(text), public._app_set_status(uuid, text, text),
  public.merchant_app_start(text), public.merchant_app_save(text, text, jsonb), public.merchant_settlement_save(text, text, text, text), public.merchant_doc_submit(text, text, text), public.merchant_app_submit(text),
  public.merchant_checklist_ack(text, text), public.merchant_app_get(text), public.merchant_me(), public.merchant_team(text), public.merchant_invite(text, text, text), public.merchant_invite_respond(text, boolean),
  public.merchant_member_remove(text, uuid), public.merchant_settlement_get(text), public.merchant_checklist(text), public.merchant_store_update(text, text, text, int, int, int),
  public.admin_applications(text, text, text), public.admin_application(uuid), public.admin_application_decide(uuid, text, text), public.admin_settlement_status(text, text, text),
  public.merchant_set_stage(text, order_stage), public.merchant_cancel_order(text, text), public.merchant_mark_ready(text), public.merchant_orders(text, int), public._store_of(text), public._kyc_owns(text, text),
  public.merchant_product_save(text, text, text, text, int, text, boolean, boolean), public.merchant_product_stock(text, boolean), public.merchant_product_delete(text), public.merchant_set_open(text, boolean),
  public.admin_merchant_owner(text, text), public.admin_merchants() from public, anon, authenticated;
-- Helpers used inside row-level-security policies must stay executable by the roles that evaluate those policies.
grant execute on function public._is_member(text, text[]), public._kyc_owns(text, text) to anon, authenticated;
grant execute on function public.merchant_app_start(text), public.merchant_app_save(text, text, jsonb), public.merchant_settlement_save(text, text, text, text), public.merchant_doc_submit(text, text, text), public.merchant_app_submit(text),
  public.merchant_checklist_ack(text, text), public.merchant_app_get(text), public.merchant_me(), public.merchant_team(text), public.merchant_invite(text, text, text), public.merchant_invite_respond(text, boolean),
  public.merchant_member_remove(text, uuid), public.merchant_settlement_get(text), public.merchant_checklist(text), public.merchant_store_update(text, text, text, int, int, int),
  public.admin_applications(text, text, text), public.admin_application(uuid), public.admin_application_decide(uuid, text, text), public.admin_settlement_status(text, text, text),
  public.merchant_set_stage(text, order_stage), public.merchant_cancel_order(text, text), public.merchant_mark_ready(text), public.merchant_orders(text, int),
  public.merchant_product_save(text, text, text, text, int, text, boolean, boolean), public.merchant_product_stock(text, boolean), public.merchant_product_delete(text), public.merchant_set_open(text, boolean),
  public.admin_merchant_owner(text, text), public.admin_merchants() to authenticated;
