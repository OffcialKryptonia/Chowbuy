-- Group orders: a host starts a shared order with an invite code, friends join, the host splits the cost and attaches the
-- placed order. Admins can see every group and cancel open ones. (The customer app does not use this yet.)

create sequence if not exists public.group_seq start 1;
create table if not exists public.group_orders (
  id text primary key default ('GO-' || nextval('public.group_seq')), code text not null unique,
  title text not null check (char_length(title) between 2 and 60),
  host_id uuid not null references public.profiles(id), merchant_id text not null references public.merchants(id),
  host_pays boolean not null default false, status text not null default 'open' check (status in ('open', 'locked', 'placed', 'cancelled')),
  order_id text unique references public.orders(id), total int check (total is null or total >= 0),
  created_at timestamptz not null default now());
create table if not exists public.group_members (
  group_id text not null references public.group_orders(id) on delete cascade, user_id uuid not null references public.profiles(id),
  amount int not null default 0 check (amount >= 0), paid boolean not null default false,
  joined_at timestamptz not null default now(), left_at timestamptz, primary key (group_id, user_id));
alter table public.group_orders enable row level security;
alter table public.group_members enable row level security;
revoke all on public.group_orders, public.group_members from public, anon, authenticated;
grant select on public.group_orders, public.group_members to authenticated;

create or replace function public._group_member(p_group text) returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.group_members where group_id = p_group and user_id = auth.uid() and left_at is null) $$;
revoke execute on function public._group_member(text) from public, anon;
grant execute on function public._group_member(text) to authenticated;

create policy group_orders_read on public.group_orders for select to authenticated using (host_id = auth.uid() or public._group_member(id) or public.is_admin());
create policy group_members_read on public.group_members for select to authenticated using (user_id = auth.uid() or public._group_member(group_id) or public.is_admin());

create or replace function public.group_create(p_merchant text, p_title text, p_host_pays boolean default false) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); v_id text; v_code text; n int := 0;
begin
  if uid is null then raise exception 'Sign in first.'; end if;
  if char_length(btrim(coalesce(p_title, ''))) < 2 then raise exception 'Give the group a name.'; end if;
  if not exists (select 1 from public.merchants where id = p_merchant and active) then raise exception 'That merchant is not available.'; end if;
  if (select count(*) from public.group_orders where host_id = uid and status in ('open', 'locked')) >= 5 then raise exception 'You already have 5 open groups.'; end if;
  loop
    v_code := 'GRP-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6)); n := n + 1;
    exit when not exists (select 1 from public.group_orders where code = v_code) or n > 20;
  end loop;
  insert into public.group_orders (code, title, host_id, merchant_id, host_pays) values (v_code, btrim(p_title), uid, p_merchant, coalesce(p_host_pays, false)) returning id into v_id;
  insert into public.group_members (group_id, user_id) values (v_id, uid);
  return jsonb_build_object('id', v_id, 'code', v_code);
end $$;

create or replace function public.group_join(p_code text) returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); g public.group_orders;
begin
  if uid is null then raise exception 'Sign in first.'; end if;
  select * into g from public.group_orders where code = upper(btrim(coalesce(p_code, '')));
  if not found then raise exception 'No group found with that code.'; end if;
  if g.status <> 'open' then raise exception 'This group is no longer open.'; end if;
  if (select count(*) from public.group_members where group_id = g.id and left_at is null) >= 20 and not exists (select 1 from public.group_members where group_id = g.id and user_id = uid) then raise exception 'This group is full.'; end if;
  insert into public.group_members (group_id, user_id) values (g.id, uid) on conflict (group_id, user_id) do update set left_at = null;
  return g.id;
end $$;

create or replace function public.group_leave(p_group text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); g public.group_orders;
begin
  if uid is null then raise exception 'Sign in first.'; end if;
  select * into g from public.group_orders where id = p_group;
  if not found or not public._group_member(p_group) then raise exception 'You are not in that group.'; end if;
  if g.host_id = uid then raise exception 'The host cannot leave. Cancel the group instead.'; end if;
  if g.status not in ('open', 'locked') then raise exception 'This group can no longer change.'; end if;
  update public.group_members set left_at = now(), amount = 0 where group_id = p_group and user_id = uid;
end $$;

create or replace function public.group_set_status(p_group text, p_status text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare g public.group_orders;
begin
  select * into g from public.group_orders where id = p_group and host_id = auth.uid();
  if not found then raise exception 'Only the host can do that.'; end if;
  if p_status not in ('open', 'locked') then raise exception 'Choose open or locked.'; end if;
  if g.status not in ('open', 'locked') then raise exception 'This group can no longer change.'; end if;
  update public.group_orders set status = p_status where id = p_group;
end $$;

-- p_shares: [{"user_id": "...", "amount": 1500}, ...]. Only active members, only while locked, whole naira.
create or replace function public.group_set_shares(p_group text, p_shares jsonb) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare g public.group_orders; s jsonb;
begin
  select * into g from public.group_orders where id = p_group and host_id = auth.uid();
  if not found then raise exception 'Only the host can do that.'; end if;
  if g.status <> 'locked' then raise exception 'Lock the group before splitting the cost.'; end if;
  if jsonb_typeof(coalesce(p_shares, 'null'::jsonb)) <> 'array' then raise exception 'Send a list of shares.'; end if;
  for s in select * from jsonb_array_elements(p_shares) loop
    if (s->>'amount') is null or (s->>'amount')::int < 0 then raise exception 'Each share must be zero or more.'; end if;
    update public.group_members set amount = (s->>'amount')::int where group_id = p_group and user_id = (s->>'user_id')::uuid and left_at is null;
    if not found then raise exception 'Everyone in the split must be an active member.'; end if;
  end loop;
end $$;

create or replace function public.group_attach_order(p_group text, p_order text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare g public.group_orders; o public.orders;
begin
  select * into g from public.group_orders where id = p_group and host_id = auth.uid();
  if not found then raise exception 'Only the host can do that.'; end if;
  if g.status <> 'locked' then raise exception 'Lock the group before attaching the order.'; end if;
  select * into o from public.orders where id = p_order and customer_id = auth.uid();
  if not found then raise exception 'That order is not yours.'; end if;
  if o.merchant_id <> g.merchant_id then raise exception 'The order must be from the same merchant as the group.'; end if;
  if exists (select 1 from public.group_orders where order_id = p_order) then raise exception 'That order is already linked to a group.'; end if;
  update public.group_orders set order_id = p_order, total = o.total, status = 'placed' where id = p_group;
end $$;

create or replace function public.group_cancel(p_group text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare g public.group_orders;
begin
  select * into g from public.group_orders where id = p_group and host_id = auth.uid();
  if not found then raise exception 'Only the host can do that.'; end if;
  if g.status not in ('open', 'locked') then raise exception 'This group can no longer be cancelled.'; end if;
  update public.group_orders set status = 'cancelled' where id = p_group;
end $$;

-- Admin: every group with its members. Placed groups become delivered or cancelled with their order.
create or replace function public.admin_groups() returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  perform public._need_admin();
  return coalesce((select jsonb_agg(x order by x.created_at desc) from (
    select g.id, g.code, g.title, coalesce(nullif(h.full_name, ''), 'Customer') as host, m.name as merchant, coalesce(m.area, '') as area, g.host_pays, g.total, g.created_at,
      case when g.status = 'placed' and o.stage = 'delivered' then 'delivered' when g.status = 'placed' and o.stage = 'cancelled' then 'cancelled' else g.status end as status,
      coalesce((select sum(amount) from public.group_members x where x.group_id = g.id and x.left_at is null), 0) as allocated,
      coalesce((select count(*) from public.group_members x where x.group_id = g.id and x.left_at is null), 0) as people,
      case when g.status = 'cancelled' or (g.status = 'placed' and o.stage = 'cancelled') then 0
           when g.host_pays then case when g.status = 'placed' then coalesce(g.total, 0) else 0 end
           else coalesce((select sum(amount) from public.group_members x where x.group_id = g.id and x.left_at is null and x.paid), 0) end as collected,
      (select coalesce(jsonb_agg(jsonb_build_object('name', coalesce(nullif(p.full_name, ''), 'Customer'), 'amount', x.amount, 'paid', x.paid, 'host', x.user_id = g.host_id) order by x.joined_at), '[]'::jsonb)
         from public.group_members x join public.profiles p on p.id = x.user_id where x.group_id = g.id and x.left_at is null) as members
    from public.group_orders g join public.merchants m on m.id = g.merchant_id left join public.profiles h on h.id = g.host_id left join public.orders o on o.id = g.order_id) x), '[]'::jsonb);
end $$;

create or replace function public.admin_group_cancel(p_group text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare g public.group_orders;
begin
  perform public._need_admin();
  select * into g from public.group_orders where id = p_group;
  if not found then raise exception 'Group not found.'; end if;
  if g.status not in ('open', 'locked') then raise exception 'Only open or locked groups can be cancelled.'; end if;
  update public.group_orders set status = 'cancelled' where id = p_group;
  perform public.log_audit('group.cancel', jsonb_build_object('group', p_group, 'code', g.code));
end $$;

revoke execute on function public.group_create(text, text, boolean), public.group_join(text), public.group_leave(text), public.group_set_status(text, text), public.group_set_shares(text, jsonb), public.group_attach_order(text, text), public.group_cancel(text), public.admin_groups(), public.admin_group_cancel(text) from public, anon, authenticated;
grant execute on function public.group_create(text, text, boolean), public.group_join(text), public.group_leave(text), public.group_set_status(text, text), public.group_set_shares(text, jsonb), public.group_attach_order(text, text), public.group_cancel(text), public.admin_groups(), public.admin_group_cancel(text) to authenticated;
