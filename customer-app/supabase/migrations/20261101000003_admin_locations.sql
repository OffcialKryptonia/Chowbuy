-- Admin Console: service locations (country > city > neighbourhood). Admin only. (The customer app does not read these yet.)

create sequence if not exists public.loc_seq start 1;
create table if not exists public.loc_countries (name text primary key check (char_length(name) between 2 and 40), status text not null default 'pipeline' check (status in ('live', 'pipeline')));
create table if not exists public.loc_cities (
  name text primary key check (char_length(name) between 2 and 40), state text not null default '' check (char_length(state) <= 40),
  status text not null default 'live' check (status in ('live', 'paused', 'pipeline')), created_at timestamptz not null default now());
create table if not exists public.loc_hoods (
  id text primary key default ('LOC-' || nextval('public.loc_seq')), name text not null check (char_length(name) between 2 and 40),
  city text not null references public.loc_cities(name) on update cascade,
  status text not null default 'active' check (status in ('active', 'disabled', 'coming_soon')), created_at timestamptz not null default now());
create unique index if not exists loc_hoods_uq on public.loc_hoods (lower(city), lower(name));
alter table public.loc_countries enable row level security;
alter table public.loc_cities enable row level security;
alter table public.loc_hoods enable row level security;
revoke all on public.loc_countries, public.loc_cities, public.loc_hoods from public, anon, authenticated;

insert into public.loc_countries (name, status) values ('Nigeria', 'live'), ('Ghana', 'pipeline'), ('Kenya', 'pipeline') on conflict do nothing;
insert into public.loc_cities (name, state, status) values ('Lagos', 'Lagos', 'live'), ('Abuja', 'FCT', 'live'), ('Ibadan', 'Oyo', 'live'), ('Port Harcourt', 'Rivers', 'live'), ('Kano', 'Kano', 'live') on conflict do nothing;

-- Merchant and order counts match the city or neighbourhood name inside the merchant's area / the order's delivery area.
create or replace function public.admin_locations() returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  perform public._need_admin();
  return jsonb_build_object(
    'countries', coalesce((select jsonb_agg(jsonb_build_object('name', c.name, 'status', c.status) order by (c.status = 'live') desc, c.name) from public.loc_countries c), '[]'::jsonb),
    'cities', coalesce((select jsonb_agg(x order by x.name) from (
      select c.name, c.state, c.status,
        (select count(*) from public.merchants m where m.area ilike '%' || c.name || '%') as merchants,
        (select count(*) from public.orders o where o.created_at >= now() - interval '30 days' and o.address->>'area' ilike '%' || c.name || '%') as orders30,
        (select count(*) from public.loc_hoods h where h.city = c.name and h.status = 'active') as active_hoods
      from public.loc_cities c) x), '[]'::jsonb),
    'hoods', coalesce((select jsonb_agg(x order by x.city, x.name) from (
      select h.id, h.name, h.city, h.status,
        (select count(*) from public.orders o where o.created_at >= now() - interval '30 days' and o.address->>'area' ilike '%' || h.name || '%') as orders30
      from public.loc_hoods h) x), '[]'::jsonb));
end $$;

create or replace function public.admin_loc_country_set(p_name text, p_status text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public._need_admin();
  if p_status not in ('live', 'pipeline') then raise exception 'Choose live or pipeline.'; end if;
  if lower(btrim(p_name)) = 'nigeria' and p_status <> 'live' then raise exception 'Nigeria is the live market and cannot be paused.'; end if;
  insert into public.loc_countries (name, status) values (btrim(p_name), p_status) on conflict (name) do update set status = excluded.status;
  perform public.log_audit('location.country', jsonb_build_object('name', p_name, 'status', p_status));
end $$;

create or replace function public.admin_loc_city_save(p_name text, p_state text, p_status text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public._need_admin();
  if p_status not in ('live', 'paused', 'pipeline') then raise exception 'Choose live, paused or pipeline.'; end if;
  if char_length(btrim(coalesce(p_name, ''))) < 2 then raise exception 'Enter a city name.'; end if;
  insert into public.loc_cities (name, state, status) values (btrim(p_name), btrim(coalesce(p_state, '')), p_status)
    on conflict (name) do update set status = excluded.status, state = case when excluded.state = '' then public.loc_cities.state else excluded.state end;
  perform public.log_audit('location.city', jsonb_build_object('name', p_name, 'status', p_status));
end $$;

create or replace function public.admin_loc_hood_add(p_city text, p_name text) returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare v text;
begin
  perform public._need_admin();
  if not exists (select 1 from public.loc_cities where name = p_city) then raise exception 'Choose a city from the list.'; end if;
  if char_length(btrim(coalesce(p_name, ''))) < 2 then raise exception 'Enter a neighbourhood name.'; end if;
  if exists (select 1 from public.loc_hoods where lower(city) = lower(p_city) and lower(name) = lower(btrim(p_name))) then raise exception '% already exists in %.', btrim(p_name), p_city; end if;
  insert into public.loc_hoods (city, name) values (p_city, btrim(p_name)) returning id into v;
  perform public.log_audit('location.hood_add', jsonb_build_object('city', p_city, 'name', p_name));
  return v;
end $$;

create or replace function public.admin_loc_hood_set(p_id text, p_status text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public._need_admin();
  if p_status not in ('active', 'disabled', 'coming_soon') then raise exception 'Choose active, disabled or coming soon.'; end if;
  update public.loc_hoods set status = p_status where id = p_id;
  if not found then raise exception 'Neighbourhood not found.'; end if;
  perform public.log_audit('location.hood_set', jsonb_build_object('id', p_id, 'status', p_status));
end $$;

revoke execute on function public.admin_locations(), public.admin_loc_country_set(text, text), public.admin_loc_city_save(text, text, text), public.admin_loc_hood_add(text, text), public.admin_loc_hood_set(text, text) from public, anon, authenticated;
grant execute on function public.admin_locations(), public.admin_loc_country_set(text, text), public.admin_loc_city_save(text, text, text), public.admin_loc_hood_add(text, text), public.admin_loc_hood_set(text, text) to authenticated;
