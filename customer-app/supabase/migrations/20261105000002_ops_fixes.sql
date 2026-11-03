-- Operations fixes (run once in the Supabase SQL editor; safe to run again).
--  1. Rider sign-ups are recorded as riders from the start, so they never appear in the Customers list.
--  2. Admin can cancel a pending order; unassigned pending orders expire on their own (with an automatic refund when already paid).
--  3. Admin Riders list also shows people who signed up as a rider but have not finished the application yet.

/* ---------------- 1. rider sign-ups ---------------- */
-- Only the Rider app sends signup_as = 'rider'. No other value can ever grant a role at sign-up (admin and merchant are never self-assigned).
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare ph text := public.norm_ng_phone(new.raw_user_meta_data->>'phone');
begin
  if ph is not null and exists (select 1 from public.profiles where phone = ph) then ph := null; end if;
  insert into public.profiles (id, email, full_name, phone, role)
  values (new.id, new.email, coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), nullif(new.raw_user_meta_data->>'name', ''), ''), ph,
          case when new.raw_user_meta_data->>'signup_as' = 'rider' then 'rider'::user_role else 'customer'::user_role end)
  on conflict do nothing;
  insert into public.wallets (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;

-- Repair: the account you signed up through the Rider app before this fix. Only moves a plain customer with no orders.
update public.profiles p set role = 'rider'
 where p.email = 'admin@kryptlab.co' and p.role = 'customer'
   and not exists (select 1 from public.orders o where o.customer_id = p.id);

/* ---------------- 2. cancel and expire pending orders ---------------- */
-- One place that cancels an order, refunds it when it was paid online, and records who did it and why.
create or replace function public._cancel_order(p_order text, p_reason text, p_by text) returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare o public.orders; amt int := 0;
begin
  select ord.* into o from public.orders ord where ord.id = p_order and ord.stage in ('received', 'preparing') for update of ord;
  if not found then return -1; end if;
  if o.paid and o.pay <> 'cod' and o.customer_id is not null and o.total > 0 then
    if public._credit(o.customer_id, o.total, 'Refund: order ' || o.id || ' was cancelled', 'refund:' || o.id) then amt := o.total; end if;
  end if;
  update public.orders set stage = 'cancelled', stage_times = stage_times || jsonb_build_object('cancelled', public.now_ms()),
    cancel_reason = p_reason, cancelled_by = p_by, refunded = amt, rider_id = null, rider = null where id = o.id;
  perform public.log_audit('Order ' || o.id || ' cancelled by ' || p_by || ': ' || p_reason || case when amt > 0 then ' (refunded N' || amt || ' to the customer wallet)' else '' end,
    jsonb_build_object('order', o.id, 'merchant', o.merchant_id, 'reason', p_reason, 'refunded', amt, 'by', p_by));
  return amt;
end $$;

-- Admin cancels an order that has not been picked up yet (pending or being prepared).
create or replace function public.admin_cancel_order(p_order text, p_reason text) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare why text := left(btrim(coalesce(p_reason, '')), 200); amt int;
begin
  perform public._need_admin();
  if char_length(why) < 3 then raise exception 'Write a reason for cancelling.'; end if;
  amt := public._cancel_order(p_order, why, 'admin');
  if amt < 0 then raise exception 'Only pending or preparing orders can be cancelled here. This one has moved on or does not exist.'; end if;
  return jsonb_build_object('refunded', amt);
end $$;

-- Waiting limits, in minutes. Defaults follow the market: a store that has not accepted within 15 minutes has effectively missed the order,
-- and a delivery with no rider after 30 minutes is cancelled (the same 30-minute rule StoreHub Beep Delivery publishes).
-- Admin can change them later by saving platform_settings key 'order_timeouts' = {"pendingMin":15,"noRiderMin":30,"unpaidMin":30}.
create or replace function public.expire_stale_orders() returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare cfg jsonb := coalesce((select value from public.platform_settings where key = 'order_timeouts'), '{}'::jsonb);
        pend int := least(greatest(coalesce((cfg->>'pendingMin')::int, 15), 5), 240);
        norider int := least(greatest(coalesce((cfg->>'noRiderMin')::int, 30), 10), 480);
        unpaid int := least(greatest(coalesce((cfg->>'unpaidMin')::int, 30), 10), 480);
        r record; n int := 0;
begin
  for r in
    select o.id, case
        when not o.paid and o.pay <> 'cod' then 'Payment was not completed in time.'
        when o.stage = 'received' then 'The store did not accept the order in time.'
        else 'No rider was available in time.' end as why
      from public.orders o
     where o.stage in ('received', 'preparing') and o.rider_id is null
       and ( (not o.paid and o.pay <> 'cod' and o.created_at < now() - make_interval(mins => unpaid))
          or ((o.paid or o.pay = 'cod') and o.stage = 'received' and o.created_at < now() - make_interval(mins => pend))
          or ((o.paid or o.pay = 'cod') and o.stage = 'preparing' and o.created_at < now() - make_interval(mins => norider)) )
     order by o.created_at limit 200
  loop
    if public._cancel_order(r.id, r.why, 'system') >= 0 then n := n + 1; end if;
  end loop;
  return n;
end $$;

revoke all on function public._cancel_order(text, text, text), public.expire_stale_orders() from public, anon, authenticated;
revoke all on function public.admin_cancel_order(text, text) from public, anon;
grant execute on function public.admin_cancel_order(text, text) to authenticated;

-- Runs every minute. If pg_cron cannot be enabled here, the notice below says so and the rest of this file still applies.
do $$ begin
  create extension if not exists pg_cron;
  perform cron.unschedule(jobid) from cron.job where jobname = 'chowbuy-expire-orders';
  perform cron.schedule('chowbuy-expire-orders', '* * * * *', 'select public.expire_stale_orders()');
exception when others then
  raise notice 'pg_cron is not available (%). Enable it in Dashboard > Database > Extensions, then run this file again.', sqlerrm;
end $$;

/* ---------------- 3. Admin Riders list includes unfinished rider sign-ups ---------------- */
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
      case when not r.verified or (r.pay_model = 'flex' and r.flex_status is distinct from 'approved') then 2 when r.online then 0 else 1 end as sort,
      true as applied
    from public.riders r
    left join public.profiles p on p.id = r.user_id
    left join public.rider_locations l on l.rider_id = r.user_id
    left join lateral (select o.id, o.stage, o.rider_pos from public.orders o where o.rider_id = r.user_id and o.stage not in ('delivered', 'cancelled') order by o.created_at desc limit 1) a on true) x), '[]'::jsonb)
  || coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'name', coalesce(nullif(p.full_name, ''), p.email, 'New rider'), 'plate', 'Application not started', 'vehicle', '—', 'model', 'partner', 'tier', null,
        'verified', false, 'online', false, 'appliedModel', null, 'flexStatus', null, 'flexCity', null, 'rating_pct', 0, 'rating_count', 0, 'phone', coalesce(p.phone, ''), 'trips30', 0,
        'active_order', null, 'active_stage', null, 'lat', null, 'lng', null, 'seen_at', null, 'status', 'pending', 'sort', 2, 'applied', false) order by p.created_at desc)
      from public.profiles p where p.role = 'rider' and not exists (select 1 from public.riders r where r.user_id = p.id)), '[]'::jsonb);
end $$;
revoke execute on function public.admin_riders() from public, anon;
grant execute on function public.admin_riders() to authenticated;
