-- Real numbers for the Admin Console: dashboard, orders and merchants. Admin only; nothing here is estimated or sample data.

create or replace function public.admin_dashboard(p_days int default 30) returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare d int := least(greatest(coalesce(p_days, 30), 1), 365); since timestamptz; out jsonb;
begin
  perform public._need_admin();
  since := now() - make_interval(days => d);
  select jsonb_build_object(
    'days', d,
    'orders', count(*) filter (where created_at >= since),
    'delivered', count(*) filter (where created_at >= since and stage = 'delivered'),
    'cancelled', count(*) filter (where created_at >= since and stage = 'cancelled'),
    'open', count(*) filter (where stage not in ('delivered', 'cancelled')),
    'gmv', coalesce(sum(total) filter (where created_at >= since and stage = 'delivered'), 0),
    'aov', coalesce(round(avg(total) filter (where created_at >= since and stage = 'delivered')), 0),
    'fees', coalesce(sum(service_fee) filter (where created_at >= since and stage = 'delivered'), 0)) into out
  from public.orders;
  return out || jsonb_build_object(
    'customers', (select count(*) from public.profiles where role = 'customer'),
    'newCustomers', (select count(*) from public.profiles where role = 'customer' and created_at >= since),
    'merchants', jsonb_build_object('live', (select count(*) from public.merchants where active), 'pending', (select count(*) from public.merchants where not active)),
    'riders', (select jsonb_build_object('total', count(*), 'verified', count(*) filter (where verified), 'online', count(*) filter (where verified and online),
                 'fleet', count(*) filter (where verified and pay_model = 'fleet'), 'partner', count(*) filter (where verified and pay_model = 'partner'),
                 'waiting', count(*) filter (where not verified)) from public.riders),
    'openSos', (select count(*) from public.sos_events where status = 'open'),
    'pendingDocs', (select count(*) from public.kyc_docs where status = 'pending'),
    'walletFloat', (select coalesce(sum(balance), 0) from public.wallets),
    'riderCommission', (select coalesce(sum(commission), 0) from public.rider_earnings where created_at >= since),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object('day', x.day::date, 'orders', x.n, 'gmv', x.g) order by x.day), '[]'::jsonb) from (
        select s.day, count(o.id) as n, coalesce(sum(o.total) filter (where o.stage = 'delivered'), 0) as g
        from generate_series(date_trunc('day', now()) - make_interval(days => least(d, 30) - 1), date_trunc('day', now()), interval '1 day') s(day)
        left join public.orders o on date_trunc('day', o.created_at) = s.day group by s.day) x),
    'verticals', (select coalesce(jsonb_agg(jsonb_build_object('vertical', x.v, 'orders', x.n) order by x.n desc), '[]'::jsonb) from (
        select m.vertical as v, count(*) as n from public.orders o join public.merchants m on m.id = o.merchant_id where o.created_at >= since group by m.vertical) x),
    'areas', (select coalesce(jsonb_agg(jsonb_build_object('area', x.a, 'orders', x.n) order by x.n desc), '[]'::jsonb) from (
        select coalesce(nullif(o.address->>'area', ''), 'Unknown') as a, count(*) as n from public.orders o where o.created_at >= since group by 1 order by n desc limit 6) x),
    'activity', (select coalesce(jsonb_agg(jsonb_build_object('at', x.at, 'action', x.action) order by x.at desc), '[]'::jsonb) from (select at, action from public.audit_log order by at desc limit 8) x));
end $$;

-- Order stage in the Admin's four buckets.
create or replace function public._admin_status(s order_stage) returns text language sql immutable set search_path = pg_catalog, pg_temp as $$
  select case s when 'delivered' then 'completed' when 'cancelled' then 'cancelled' when 'received' then 'pending' else 'processing' end
$$;

create or replace function public.admin_orders(p_status text default 'all', p_search text default '', p_limit int default 50, p_offset int default 0) returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare q text := '%' || lower(btrim(coalesce(p_search, ''))) || '%'; total int; rows jsonb;
begin
  perform public._need_admin();
  select count(*) into total from public.orders o join public.merchants m on m.id = o.merchant_id left join public.profiles c on c.id = o.customer_id
    where (coalesce(p_status, 'all') = 'all' or public._admin_status(o.stage) = p_status)
      and lower(o.id || ' ' || m.name || ' ' || coalesce(c.full_name, '') || ' ' || coalesce(o.rider->>'name', '')) like q;
  select coalesce(jsonb_agg(x order by x.placed desc), '[]'::jsonb) into rows from (
    select o.id, o.created_at as placed, m.vertical, m.name as merchant, coalesce(nullif(c.full_name, ''), c.email, 'Customer') as customer,
           coalesce(nullif(o.address->>'area', ''), '') as city, o.total, o.service_fee as commission, public._admin_status(o.stage) as status,
           o.stage::text as stage, coalesce(o.rider->>'name', '') as rider, o.pay::text as pay, o.paid
    from public.orders o join public.merchants m on m.id = o.merchant_id left join public.profiles c on c.id = o.customer_id
    where (coalesce(p_status, 'all') = 'all' or public._admin_status(o.stage) = p_status)
      and lower(o.id || ' ' || m.name || ' ' || coalesce(c.full_name, '') || ' ' || coalesce(o.rider->>'name', '')) like q
    order by o.created_at desc limit least(greatest(p_limit, 1), 200) offset greatest(p_offset, 0)) x;
  return jsonb_build_object('total', total, 'rows', rows);
end $$;

create or replace function public.admin_merchants() returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  perform public._need_admin();
  return coalesce((select jsonb_agg(x order by x.name) from (
    select m.id, m.name, m.vertical, coalesce(m.area, '') as city, m.active, m.open, m.rating_pct, m.rating_count,
      (select count(*) from public.orders o where o.merchant_id = m.id and o.created_at >= now() - interval '30 days') as orders30,
      (select coalesce(sum(o.total), 0) from public.orders o where o.merchant_id = m.id and o.stage = 'delivered' and o.created_at >= now() - interval '30 days') as gmv30,
      (select count(*) from public.kyc_docs d where d.subject_kind = 'merchant' and d.subject_id = m.id and d.status = 'approved') as docs_ok,
      (select count(*) from public.kyc_docs d where d.subject_kind = 'merchant' and d.subject_id = m.id and d.status = 'pending') as docs_pending
    from public.merchants m) x), '[]'::jsonb);
end $$;

revoke execute on function public.admin_dashboard(int), public._admin_status(order_stage), public.admin_orders(text, text, int, int), public.admin_merchants() from public, anon, authenticated;
grant execute on function public.admin_dashboard(int), public.admin_orders(text, text, int, int), public.admin_merchants() to authenticated;
