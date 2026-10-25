-- Smart Cart: the customer app reports what shoppers do with suggestions; the Admin Console counts them. Admin only to read.

create table if not exists public.smart_cart_events (
  id bigint generated always as identity primary key, user_id uuid references public.profiles(id) on delete set null,
  kind text not null check (kind in ('opened', 'optimized', 'accepted', 'dismissed')), rec text not null default '' check (char_length(rec) <= 30),
  created_at timestamptz not null default now());
create index if not exists smart_cart_events_at on public.smart_cart_events (created_at desc);
alter table public.smart_cart_events enable row level security;
revoke all on public.smart_cart_events from public, anon, authenticated;

create or replace function public.smart_cart_track(p_kind text, p_rec text default '') returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Sign in first.'; end if;
  if p_kind not in ('opened', 'optimized', 'accepted', 'dismissed') then raise exception 'Unknown event.'; end if;
  if (select count(*) from public.smart_cart_events where user_id = uid and created_at > now() - interval '1 minute') >= 60 then return; end if;
  insert into public.smart_cart_events (user_id, kind, rec) values (uid, p_kind, left(coalesce(p_rec, ''), 30));
end $$;

create or replace function public.admin_smart_cart(p_days int default 30) returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare d int := least(greatest(coalesce(p_days, 30), 1), 365); since timestamptz;
begin
  perform public._need_admin();
  since := now() - make_interval(days => d);
  return jsonb_build_object('days', d,
    'opened', (select count(*) from public.smart_cart_events where kind = 'opened' and created_at >= since),
    'optimized', (select count(*) from public.smart_cart_events where kind = 'optimized' and created_at >= since),
    'accepted', (select count(*) from public.smart_cart_events where kind = 'accepted' and created_at >= since),
    'dismissed', (select count(*) from public.smart_cart_events where kind = 'dismissed' and created_at >= since),
    'byRec', coalesce((select jsonb_agg(x order by x.accepted + x.dismissed desc) from (
       select rec, count(*) filter (where kind = 'accepted') as accepted, count(*) filter (where kind = 'dismissed') as dismissed
       from public.smart_cart_events where rec <> '' and kind in ('accepted', 'dismissed') and created_at >= since group by rec) x), '[]'::jsonb));
end $$;

revoke execute on function public.smart_cart_track(text, text), public.admin_smart_cart(int) from public, anon, authenticated;
grant execute on function public.smart_cart_track(text, text), public.admin_smart_cart(int) to authenticated;
