-- Real rider positions. A verified, online rider reports where they are; only Admin reads it (never customers or other riders).

create table if not exists public.rider_locations (
  rider_id uuid primary key references public.riders(user_id) on delete cascade,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  seen_at timestamptz not null default now()
);
alter table public.rider_locations enable row level security;
revoke all on public.rider_locations from public, anon, authenticated;   -- no direct access; the functions below are the only way in

create or replace function public.rider_ping(p_lat double precision, p_lng double precision) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_lat is null or p_lng is null or p_lat not between -90 and 90 or p_lng not between -180 and 180 then raise exception 'Invalid position.'; end if;
  if not exists (select 1 from public.riders where user_id = auth.uid() and verified and online) then raise exception 'Go online first.' using errcode = '42501'; end if;
  insert into public.rider_locations (rider_id, lat, lng, seen_at) values (auth.uid(), p_lat, p_lng, now())
  on conflict (rider_id) do update set lat = excluded.lat, lng = excluded.lng, seen_at = now();
end $$;

-- Every rider with status, last known position and 30 day trips. Offline riders are never located; the client treats a position older than 3 minutes as stale.
create or replace function public.admin_riders() returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  perform public._need_admin();
  return coalesce((select jsonb_agg(x order by x.sort, x.name) from (
    select r.user_id as id, r.name, r.plate, r.vehicle, r.pay_model as model, r.tier, r.verified, r.online,
      r.rating_pct, r.rating_count, coalesce(p.phone, r.proxy_phone) as phone,
      (select count(*) from public.orders o where o.rider_id = r.user_id and o.stage = 'delivered' and o.created_at >= now() - interval '30 days') as trips30,
      a.id as active_order, a.stage::text as active_stage,
      case when r.online then coalesce((a.rider_pos->>'latitude')::double precision, l.lat) end as lat,
      case when r.online then coalesce((a.rider_pos->>'longitude')::double precision, l.lng) end as lng,
      case when not r.online then null when a.rider_pos is not null then now() else l.seen_at end as seen_at,
      case when not r.verified then 'pending' when not r.online then 'offline' when a.id is not null then 'delivering' else 'idle' end as status,
      case when not r.verified then 2 when r.online then 0 else 1 end as sort
    from public.riders r
    left join public.profiles p on p.id = r.user_id
    left join public.rider_locations l on l.rider_id = r.user_id
    left join lateral (select o.id, o.stage, o.rider_pos from public.orders o where o.rider_id = r.user_id and o.stage not in ('delivered', 'cancelled') order by o.created_at desc limit 1) a on true) x), '[]'::jsonb);
end $$;

revoke execute on function public.rider_ping(double precision, double precision), public.admin_riders() from public, anon, authenticated;
grant execute on function public.rider_ping(double precision, double precision), public.admin_riders() to authenticated;
