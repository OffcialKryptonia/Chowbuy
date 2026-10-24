-- Admin Console: the signed-in admin's own profile, the real admin team, and the admin's own sign-in sessions. Admin only.

create or replace function public.admin_me() returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare out jsonb;
begin
  perform public._need_admin();
  select jsonb_build_object('id', p.id, 'name', p.full_name, 'email', coalesce(p.email, u.email, ''), 'phone', coalesce(p.phone, ''),
           'role', p.role::text, 'createdAt', p.created_at, 'lastSignIn', u.last_sign_in_at) into out
    from public.profiles p join auth.users u on u.id = p.id where p.id = auth.uid();
  return out;
end $$;

create or replace function public.admin_team() returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  perform public._need_admin();
  return coalesce((select jsonb_agg(x order by x.created_at) from (
    select p.id, p.full_name as name, coalesce(p.email, u.email, '') as email, coalesce(p.phone, '') as phone, p.created_at,
           u.last_sign_in_at as last_sign_in, (p.id = auth.uid()) as me
    from public.profiles p join auth.users u on u.id = p.id where p.role = 'admin') x), '[]'::jsonb);
end $$;

-- The admin's own sessions only. IP addresses are masked.
create or replace function public.admin_my_sessions() returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare cur text := coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'session_id', '');
begin
  perform public._need_admin();
  return coalesce((select jsonb_agg(x order by x.last_active desc) from (
    select s.id, coalesce(s.user_agent, '') as agent,
           case when s.ip is null then '' else regexp_replace(s.ip::text, '^(\d+\.\d+)\.\d+\.\d+.*$', '\1.***.***') end as ip,
           coalesce(s.refreshed_at, s.updated_at, s.created_at) as last_active, (s.id::text = cur) as current
    from auth.sessions s where s.user_id = auth.uid() order by coalesce(s.refreshed_at, s.updated_at, s.created_at) desc limit 10) x), '[]'::jsonb);
end $$;

create or replace function public.admin_update_profile(p_name text, p_phone text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare ph text;
begin
  perform public._need_admin();
  if char_length(btrim(coalesce(p_name, ''))) < 2 then raise exception 'Enter your full name.'; end if;
  if btrim(coalesce(p_phone, '')) <> '' then
    ph := public.norm_ng_phone(p_phone);
    if ph is null then raise exception 'Enter a valid Nigerian phone number.'; end if;
  end if;
  update public.profiles set full_name = left(btrim(p_name), 80), phone = ph where id = auth.uid();
end $$;

revoke execute on function public.admin_me(), public.admin_team(), public.admin_my_sessions(), public.admin_update_profile(text, text) from public, anon, authenticated;
grant execute on function public.admin_me(), public.admin_team(), public.admin_my_sessions(), public.admin_update_profile(text, text) to authenticated;
