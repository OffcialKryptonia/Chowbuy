-- Admin customer tools: richer customer list (email verified, last sign-in), a full customer profile, and group-order keys that
-- no longer block deleting a customer. Creating, verifying and deleting accounts go through the admin-customers edge function
-- (Supabase Admin API), not SQL.

alter table public.group_orders drop constraint if exists group_orders_host_id_fkey;
alter table public.group_orders add constraint group_orders_host_id_fkey foreign key (host_id) references public.profiles(id) on delete cascade;
alter table public.group_members drop constraint if exists group_members_user_id_fkey;
alter table public.group_members add constraint group_members_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;

create or replace function public.admin_customers(p_search text default '', p_limit int default 50, p_offset int default 0) returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare q text := '%' || lower(btrim(coalesce(p_search, ''))) || '%'; total int; rows jsonb; stats jsonb;
begin
  perform public._need_admin();
  select count(*) into total from public.profiles p where p.role = 'customer' and (lower(p.full_name || ' ' || coalesce(p.email, '') || ' ' || coalesce(p.phone, '')) like q);
  select coalesce(jsonb_agg(x), '[]'::jsonb) into rows from (
    select p.id, p.full_name as name, p.email, p.phone, coalesce(w.balance, 0) as balance, p.points, p.lifetime_points as lifetime,
      public.points_tier(p.lifetime_points)->>'name' as tier, p.created_at as joined,
      (u.email_confirmed_at is not null) as verified, u.last_sign_in_at as last_sign_in,
      (select count(*) from public.orders o where o.customer_id = p.id and o.stage = 'delivered') as orders,
      (select coalesce(sum(o.total), 0) from public.orders o where o.customer_id = p.id and o.stage = 'delivered') as spent
    from public.profiles p left join public.wallets w on w.user_id = p.id left join auth.users u on u.id = p.id
    where p.role = 'customer' and (lower(p.full_name || ' ' || coalesce(p.email, '') || ' ' || coalesce(p.phone, '')) like q)
    order by p.created_at desc limit least(greatest(p_limit, 1), 200) offset greatest(p_offset, 0)) x;
  select jsonb_build_object('customers', (select count(*) from public.profiles where role = 'customer'),
    'unverified', (select count(*) from public.profiles p join auth.users u on u.id = p.id where p.role = 'customer' and u.email_confirmed_at is null),
    'walletTotal', (select coalesce(sum(w.balance), 0) from public.wallets w join public.profiles p on p.id = w.user_id where p.role = 'customer'),
    'pointsOutstanding', (select coalesce(sum(points), 0) from public.profiles where role = 'customer')) into stats;
  return jsonb_build_object('total', total, 'rows', rows, 'stats', stats);
end $$;

-- One customer, everything an admin needs on a single screen.
create or replace function public.admin_customer_profile(p_user uuid) returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare p public.profiles; u auth.users; res jsonb;
begin
  perform public._need_admin();
  select * into p from public.profiles where id = p_user and role = 'customer';
  if not found then raise exception 'Customer not found.'; end if;
  select * into u from auth.users where id = p_user;
  select jsonb_build_object(
    'id', p.id, 'name', p.full_name, 'email', p.email, 'phone', p.phone, 'joined', p.created_at,
    'verified', u.email_confirmed_at is not null, 'verifiedAt', u.email_confirmed_at, 'lastSignIn', u.last_sign_in_at,
    'provider', coalesce(u.raw_app_meta_data->>'provider', 'email'),
    'balance', coalesce((select balance from public.wallets where user_id = p.id), 0),
    'points', p.points, 'lifetime', p.lifetime_points, 'tier', public.points_tier(p.lifetime_points)->>'name',
    'orders', (select count(*) from public.orders o where o.customer_id = p.id),
    'delivered', (select count(*) from public.orders o where o.customer_id = p.id and o.stage = 'delivered'),
    'cancelled', (select count(*) from public.orders o where o.customer_id = p.id and o.stage = 'cancelled'),
    'active', (select count(*) from public.orders o where o.customer_id = p.id and o.stage not in ('delivered', 'cancelled')),
    'spent', (select coalesce(sum(o.total), 0) from public.orders o where o.customer_id = p.id and o.stage = 'delivered'),
    'addresses', (select coalesce(jsonb_agg(to_jsonb(a) - 'user_id'), '[]'::jsonb) from (select * from public.addresses where user_id = p.id order by created_at desc limit 10) a),
    'recent', (select coalesce(jsonb_agg(r), '[]'::jsonb) from (select o.id, o.stage::text as stage, o.total, o.created_at, m.name as merchant from public.orders o left join public.merchants m on m.id = o.merchant_id where o.customer_id = p.id order by o.created_at desc limit 10) r)
  ) into res;
  return res;
end $$;

revoke execute on function public.admin_customers(text, int, int), public.admin_customer_profile(uuid) from public, anon, authenticated;
grant execute on function public.admin_customers(text, int, int), public.admin_customer_profile(uuid) to authenticated;
