/* Merchant dashboard (live mode) and admin store-owner assignment.
   A merchant is a profile that owns one or more rows in public.merchants (owner_id). Everything a merchant does goes through
   the functions below, which check ownership, so a store owner can never touch another store or the fields ChowBuy controls. */

-- Owners could previously write any column of their own store row (rating, active, even create new live stores).
-- Close that: no direct inserts or deletes, and updates only on the fields a store owner legitimately edits.
revoke insert, update, delete on public.merchants from authenticated;
grant update (name, open, hours, delivery_fee, eta_min, eta_max, image, cuisine) on public.merchants to authenticated;

create or replace function public._store_of(p_merchant text) returns public.merchants language plpgsql stable security definer set search_path = public, pg_temp as $$
declare m public.merchants;
begin
  select * into m from public.merchants where id = p_merchant and (owner_id = auth.uid() or public.is_admin());
  if not found then raise exception 'Store not found.'; end if;
  return m;
end $$;

create or replace function public.merchant_me() returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare out jsonb;
begin
  select jsonb_build_object('name', coalesce(p.full_name, ''), 'email', coalesce(p.email, ''),
    'stores', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'name', m.name, 'vertical', m.vertical, 'open', m.open, 'active', m.active,
      'area', coalesce(m.area, ''), 'hours', coalesce(m.hours, ''), 'deliveryFee', m.delivery_fee, 'etaMin', m.eta_min, 'etaMax', m.eta_max,
      'ratingPct', m.rating_pct, 'ratingCount', m.rating_count) order by m.name) from public.merchants m where m.owner_id = auth.uid()), '[]'::jsonb))
  into out from public.profiles p where p.id = auth.uid();
  if out is null or jsonb_array_length(out->'stores') = 0 then raise exception 'This account is not linked to a store yet.'; end if;
  return out;
end $$;

create or replace function public.merchant_orders(p_merchant text, p_limit int default 150) returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  perform public._store_of(p_merchant);
  return coalesce((select jsonb_agg(x order by x.created desc) from (
    select o.id, o.created_at as created, o.stage::text as stage, o.stage_times as times, o.pay::text as pay, o.paid,
      o.subtotal, o.delivery_fee as fee, o.discount, o.total, o.lines,
      jsonb_build_object('line', o.address->>'line', 'area', o.address->>'area', 'landmark', o.address->>'landmark') as addr,
      coalesce(nullif(split_part(coalesce(p.full_name, ''), ' ', 1), ''), 'Customer') as customer,
      case when o.rider is null then null else jsonb_build_object('name', o.rider->>'name', 'plate', o.rider->>'plate') end as rider
    from public.orders o left join public.profiles p on p.id = o.customer_id
    where o.merchant_id = p_merchant and (o.paid or o.pay = 'cod')
    order by o.created_at desc limit least(greatest(coalesce(p_limit, 150), 1), 300)) x), '[]'::jsonb);
end $$;

create or replace function public.merchant_product_save(p_merchant text, p_id text, p_name text, p_descr text, p_price int, p_category text, p_in_stock boolean, p_rx boolean default false)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare m public.merchants; pid text; v_rx boolean;
begin
  m := public._store_of(p_merchant);
  p_name := btrim(coalesce(p_name, '')); p_descr := btrim(coalesce(p_descr, '')); p_category := btrim(coalesce(p_category, ''));
  if char_length(p_name) not between 1 and 80 then raise exception 'Enter a name of up to 80 characters.'; end if;
  if p_price is null or p_price < 0 or p_price > 10000000 then raise exception 'Enter a valid price.'; end if;
  if char_length(p_descr) > 400 then raise exception 'The description is too long (400 characters at most).'; end if;
  if char_length(p_category) > 40 then raise exception 'The category is too long (40 characters at most).'; end if;
  v_rx := coalesce(p_rx, false) and m.vertical = 'pharmacy';
  if coalesce(p_id, '') = '' then
    pid := 'p' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
    insert into public.products (id, merchant_id, name, descr, price, category, in_stock, rx) values (pid, m.id, p_name, p_descr, p_price, p_category, coalesce(p_in_stock, true), v_rx);
  else
    update public.products set name = p_name, descr = p_descr, price = p_price, category = p_category, in_stock = coalesce(p_in_stock, true), rx = v_rx
      where id = p_id and merchant_id = m.id;
    if not found then raise exception 'Item not found.'; end if;
    pid := p_id;
  end if;
  return pid;
end $$;

create or replace function public.merchant_product_stock(p_id text, p_in_stock boolean) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.products p set in_stock = coalesce(p_in_stock, true)
    where p.id = p_id and exists (select 1 from public.merchants m where m.id = p.merchant_id and (m.owner_id = auth.uid() or public.is_admin()));
  if not found then raise exception 'Item not found.'; end if;
end $$;

create or replace function public.merchant_product_delete(p_id text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  delete from public.products p
    where p.id = p_id and exists (select 1 from public.merchants m where m.id = p.merchant_id and (m.owner_id = auth.uid() or public.is_admin()));
  if not found then raise exception 'Item not found.'; end if;
end $$;

create or replace function public.merchant_set_open(p_merchant text, p_open boolean) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public._store_of(p_merchant);
  update public.merchants set open = coalesce(p_open, true) where id = p_merchant;
end $$;

/* Admin: link a store to the account that runs it (or clear it with an empty email). */
create or replace function public.admin_merchant_owner(p_merchant text, p_email text) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid; r user_role; em text := lower(btrim(coalesce(p_email, '')));
begin
  perform public._need_admin();
  if em = '' then
    update public.merchants set owner_id = null where id = p_merchant;
    if not found then raise exception 'Store not found.'; end if;
    perform public.log_audit('merchant_owner_cleared', jsonb_build_object('merchant', p_merchant));
    return jsonb_build_object('owner', '');
  end if;
  select id, role into uid, r from public.profiles where lower(email) = em;
  if not found then raise exception 'No ChowBuy account uses that email. Ask them to sign up in the app first.'; end if;
  if r in ('admin', 'rider') then raise exception 'Admin and rider accounts cannot own a store.'; end if;
  update public.merchants set owner_id = uid where id = p_merchant;
  if not found then raise exception 'Store not found.'; end if;
  update public.profiles set role = 'merchant' where id = uid and role = 'customer';
  perform public.log_audit('merchant_owner_set', jsonb_build_object('merchant', p_merchant, 'owner', uid));
  return jsonb_build_object('owner', em);
end $$;

create or replace function public.admin_merchants() returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  perform public._need_admin();
  return coalesce((select jsonb_agg(x order by x.name) from (
    select m.id, m.name, m.vertical, coalesce(m.area, '') as city, m.active, m.open, m.rating_pct, m.rating_count,
      coalesce((select p.email from public.profiles p where p.id = m.owner_id), '') as owner,
      (select count(*) from public.orders o where o.merchant_id = m.id and o.created_at >= now() - interval '30 days') as orders30,
      (select coalesce(sum(o.total), 0) from public.orders o where o.merchant_id = m.id and o.stage = 'delivered' and o.created_at >= now() - interval '30 days') as gmv30,
      (select count(*) from public.kyc_docs d where d.subject_kind = 'merchant' and d.subject_id = m.id and d.status = 'approved') as docs_ok,
      (select count(*) from public.kyc_docs d where d.subject_kind = 'merchant' and d.subject_id = m.id and d.status = 'pending') as docs_pending
    from public.merchants m) x), '[]'::jsonb);
end $$;

revoke execute on function public._store_of(text), public.merchant_me(), public.merchant_orders(text, int), public.merchant_product_save(text, text, text, text, int, text, boolean, boolean),
  public.merchant_product_stock(text, boolean), public.merchant_product_delete(text), public.merchant_set_open(text, boolean), public.admin_merchant_owner(text, text), public.admin_merchants()
  from public, anon, authenticated;
grant execute on function public.merchant_me(), public.merchant_orders(text, int), public.merchant_product_save(text, text, text, text, int, text, boolean, boolean),
  public.merchant_product_stock(text, boolean), public.merchant_product_delete(text), public.merchant_set_open(text, boolean), public.admin_merchant_owner(text, text), public.admin_merchants() to authenticated;
