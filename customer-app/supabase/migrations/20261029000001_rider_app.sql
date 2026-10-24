-- Rider app backend: apply, load own profile, go online, see open orders, load the active delivery.
-- Accepting, stage changes, live position, delivery code, chat and SOS already exist (rider_accept, rider_set_stage, rider_move,
-- complete_delivery, send_chat, rider_sos). Riders never read the delivery code and never see a customer's phone number.

-- Applicant creates their own rider record. It starts unverified; Admin approves it (admin_kyc_set). Everyone starts as a partner rider;
-- Admin moves a rider to the salaried fleet model (admin_rider_set_pay).
create or replace function public.rider_apply(p_name text, p_plate text, p_vehicle text, p_phone text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare ph text := public.norm_ng_phone(p_phone);
begin
  if auth.uid() is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  if char_length(btrim(coalesce(p_name, ''))) < 2 then raise exception 'Enter your full name.'; end if;
  if char_length(btrim(coalesce(p_plate, ''))) < 3 then raise exception 'Enter your plate number.'; end if;
  if p_vehicle not in ('Bike', 'Car') then raise exception 'Choose bike or car.'; end if;
  if ph is null then raise exception 'Enter a valid Nigerian phone number.'; end if;
  insert into public.riders (user_id, name, plate, vehicle, proxy_phone, verified, online)
    values (auth.uid(), left(btrim(p_name), 80), upper(left(btrim(p_plate), 20)), p_vehicle, ph, false, false)
  on conflict (user_id) do update set name = excluded.name, plate = excluded.plate, vehicle = excluded.vehicle, proxy_phone = excluded.proxy_phone
    where not public.riders.verified;
  update public.profiles set role = 'rider' where id = auth.uid() and role = 'customer';
end $$;

-- The signed-in rider's profile, documents, emergency contacts and earnings in one call. Null if they have not applied.
create or replace function public.rider_me() returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare r public.riders; out jsonb;
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
  end if;
  return out;
end $$;

create or replace function public.rider_set_online(p_online boolean) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_online and not exists (select 1 from public.riders where user_id = auth.uid() and verified) then raise exception 'Your account is waiting for approval.'; end if;
  update public.riders set online = coalesce(p_online, false) where user_id = auth.uid();
  if not found then raise exception 'Riders only.' using errcode = '42501'; end if;
end $$;

-- Straight-line distance in km (good enough for an offer card; the live route is computed from the map).
create or replace function public._km(a_lat double precision, a_lng double precision, b_lat double precision, b_lng double precision) returns numeric language sql immutable set search_path = pg_catalog, pg_temp as $$
  select round((6371 * 2 * asin(sqrt(power(sin(radians(b_lat - a_lat) / 2), 2) + cos(radians(a_lat)) * cos(radians(b_lat)) * power(sin(radians(b_lng - a_lng) / 2), 2))))::numeric, 1)
$$;

-- Orders a verified, online rider with no active delivery can take. Shows the area only; the street address, customer name and items
-- appear once the rider accepts. Fleet riders get no fare (they are salaried).
create or replace function public.rider_open_orders() returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare r public.riders; pc jsonb := public.rider_pay_cfg(); pct int;
begin
  select * into r from public.riders where user_id = auth.uid() and verified and online;
  if not found then return '[]'::jsonb; end if;
  if exists (select 1 from public.orders where rider_id = r.user_id and stage not in ('delivered', 'cancelled')) then return '[]'::jsonb; end if;
  pct := coalesce((pc->'commission'->>r.tier)::int, 15);
  return coalesce((select jsonb_agg(x order by x->>'createdAt') from (
    select jsonb_build_object(
      'id', o.id, 'merchant', m.name, 'pickupArea', coalesce(m.area, ''), 'dropArea', coalesce(o.address->>'area', ''),
      'pickup', jsonb_build_object('lat', m.lat, 'lng', m.lng),
      'km', public._km(m.lat, m.lng, (o.address->'location'->>'latitude')::double precision, (o.address->'location'->>'longitude')::double precision),
      'items', (select coalesce(sum((l->>'qty')::int), 0) from jsonb_array_elements(o.lines) l),
      'cod', case when o.pay = 'cod' then o.total else 0 end,
      'net', case when r.pay_model = 'partner' then o.delivery_fee - round(o.delivery_fee * pct / 100.0)::int else null end,
      'createdAt', o.created_at) x
    from public.orders o join public.merchants m on m.id = o.merchant_id
    where o.rider_id is null and o.stage in ('received', 'preparing') and (o.paid or o.pay = 'cod')
    order by o.created_at limit 5) s), '[]'::jsonb);
end $$;

-- The rider's current delivery with everything needed to complete it. The delivery code itself is never included.
create or replace function public.rider_active_order() returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare o public.orders; m public.merchants; cname text;
begin
  select * into o from public.orders where rider_id = auth.uid() and stage not in ('delivered', 'cancelled') order by created_at desc limit 1;
  if not found then return null; end if;
  select * into m from public.merchants where id = o.merchant_id;
  select split_part(coalesce(full_name, ''), ' ', 1) into cname from public.profiles where id = o.customer_id;
  return jsonb_build_object(
    'id', o.id, 'stage', o.stage, 'merchant', m.name, 'customer', coalesce(nullif(cname, ''), 'Customer'),
    'pickup', jsonb_build_object('lat', m.lat, 'lng', m.lng, 'label', coalesce(m.name || ', ' || m.area, m.name)),
    'drop', jsonb_build_object('lat', (o.address->'location'->>'latitude')::double precision, 'lng', (o.address->'location'->>'longitude')::double precision, 'label', coalesce(o.address->>'line', '') || ', ' || coalesce(o.address->>'area', '')),
    'km', public._km(m.lat, m.lng, (o.address->'location'->>'latitude')::double precision, (o.address->'location'->>'longitude')::double precision),
    'items', coalesce((select jsonb_agg(jsonb_build_object('id', coalesce(l->>'productId', ''), 'name', l->>'name', 'qty', (l->>'qty')::int)) from jsonb_array_elements(o.lines) l), '[]'::jsonb),
    'cod', case when o.pay = 'cod' and not o.paid then o.total else 0 end,
    'fee', o.delivery_fee, 'tip', o.tip, 'createdAt', o.created_at);
end $$;

revoke execute on function public.rider_apply(text, text, text, text), public.rider_me(), public.rider_set_online(boolean), public._km(double precision, double precision, double precision, double precision),
  public.rider_open_orders(), public.rider_active_order() from public, anon, authenticated;
grant execute on function public.rider_apply(text, text, text, text), public.rider_me(), public.rider_set_online(boolean), public.rider_open_orders(), public.rider_active_order() to authenticated;
