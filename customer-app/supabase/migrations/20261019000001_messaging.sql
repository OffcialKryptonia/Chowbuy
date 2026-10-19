-- Messaging: marketing opt-outs, broadcast log, audience counts, and the sign-in-method flags in the public config.

alter table public.profiles
  add column if not exists marketing_email boolean not null default true,
  add column if not exists marketing_push  boolean not null default true;
-- Customers (and riders/merchants) can switch their own promotional messages off. Role and points stay locked.
grant update (marketing_email, marketing_push) on public.profiles to authenticated;

-- One row per email or push campaign. Written by the admin-broadcast function (service role); admins can read the history.
create table if not exists public.broadcasts (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('email', 'push')),
  roles text[] not null,
  subject text not null,            -- email subject, or push title
  body text not null,
  test boolean not null default false,
  status text not null default 'sending' check (status in ('sending', 'done', 'failed')),
  total int not null default 0, sent int not null default 0, failed int not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), finished_at timestamptz
);
alter table public.broadcasts enable row level security;
revoke all on public.broadcasts from anon, authenticated;
grant select on public.broadcasts to authenticated;
create policy broadcasts_admin on public.broadcasts for select using (public.is_admin());

-- How many people a campaign would reach (opted in, and with an email address / a registered device).
create or replace function public.admin_audience_count(p_roles text[], p_kind text) returns int language plpgsql stable security definer set search_path = public, pg_temp as $$
declare n int;
begin
  if not public.is_admin() then raise exception 'Not allowed.'; end if;
  if p_kind = 'email' then
    select count(*) into n from public.profiles where role::text = any(p_roles) and marketing_email and email is not null;
  else
    select count(*) into n from public.profiles where role::text = any(p_roles) and marketing_push and push_token is not null;
  end if;
  return n;
end $$;
revoke all on function public.admin_audience_count(text[], text) from public, anon, authenticated;
grant execute on function public.admin_audience_count(text[], text) to authenticated;

-- Sign-in methods default to OFF until the provider is configured in Supabase Auth and switched on in Admin.
create or replace function public.get_public_config() returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select public.setting('public', '{}'::jsonb) || jsonb_build_object('auth', coalesce(public.setting('public', '{}'::jsonb)->'auth', jsonb_build_object('google', jsonb_build_object('enabled', false), 'apple', jsonb_build_object('enabled', false))))
         || jsonb_build_object('gateways', coalesce(public.setting('public', '{}'::jsonb)->'gateways', jsonb_build_object('korapay', jsonb_build_object('enabled', true, 'publicKey', '', 'live', false), 'pocketfi', jsonb_build_object('enabled', true, 'live', false),
              'cod', jsonb_build_object('enabled', true, 'maxAmount', 20000), 'wallet', jsonb_build_object('enabled', true))),
            'realtime', coalesce(public.setting('public', '{}'::jsonb)->'realtime', jsonb_build_object('provider', 'off')),
            'push', coalesce(public.setting('public', '{}'::jsonb)->'push', jsonb_build_object('fcmEnabled', false)),
            'maps', coalesce(public.setting('public', '{}'::jsonb)->'maps', jsonb_build_object('directionsViaProxy', true)),
            'loyalty', coalesce(public.setting('public', '{}'::jsonb)->'loyalty', jsonb_build_object('reviewPoints', 50)))
$$;
revoke all on function public.get_public_config() from public;
grant execute on function public.get_public_config() to anon, authenticated;
