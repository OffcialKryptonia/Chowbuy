-- The customer apps read what the Admin Console controls (categories, brands, locations, Smart Cart, brand) from one public,
-- secret-free function. The free-delivery threshold set under Smart Cart now also drives the real delivery fee.

create or replace function public.place_order(p_merchant text, p_lines jsonb, p_pay pay_method, p_address uuid, p_promo text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  uid uuid := auth.uid(); m public.merchants; a public.addresses; l jsonb; prod public.products; grp jsonb; opt jsonb;
  qty int; unit int; sub int := 0; cnt int; mods_out jsonb; lines_out jsonb := '[]'; ids_expected int; v_pct int := 0; disc int; dlv int; svc int; tot int;
  free_from int := greatest(0, coalesce(round((public.setting('smart_cart', '{}')->>'threshold')::numeric)::int, 10000));
  cod_max int := coalesce((public.setting('public', '{}')->'gateways'->'cod'->>'maxAmount')::int, 20000);
  gw jsonb := coalesce(public.setting('public', '{}')->'gateways'->p_pay::text, '{"enabled": true}');
  o public.orders; v_otp text; eta int; ms bigint := public.now_ms(); keyparts text;
begin
  if uid is null then raise exception 'Sign in to place an order.'; end if;
  if coalesce((gw->>'enabled')::boolean, true) = false then raise exception 'That payment method is not available right now.'; end if;
  select * into m from public.merchants where id = p_merchant and active;
  if not found then raise exception 'That store is not available.'; end if;
  if not m.open then raise exception '% is closed right now.', m.name; end if;
  select * into a from public.addresses where id = p_address and user_id = uid;
  if not found then raise exception 'Choose a delivery address.'; end if;
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then raise exception 'Your basket is empty.'; end if;
  if jsonb_array_length(p_lines) > 40 then raise exception 'Too many items in one order.'; end if;

  for l in select * from jsonb_array_elements(p_lines) loop
    qty := (l->>'qty')::int;
    if qty is null or qty < 1 or qty > 50 then raise exception 'Invalid quantity.'; end if;
    select * into prod from public.products where id = l->>'product_id' and merchant_id = p_merchant;
    if not found or not prod.in_stock then raise exception 'An item in your basket is no longer available.'; end if;
    if prod.rx and not exists (select 1 from public.rx_uploads where user_id = uid and status = 'verified') then
      raise exception 'A verified prescription is required for %.', prod.name; end if;
    unit := prod.price; mods_out := '[]'; ids_expected := coalesce(jsonb_array_length(l->'mod_ids'), 0);
    for grp in select * from jsonb_array_elements(prod.modifiers) loop
      cnt := 0;
      for opt in select * from jsonb_array_elements(grp->'options') loop
        if coalesce((l->'mod_ids') ? (opt->>'id'), false) then cnt := cnt + 1; unit := unit + (opt->>'price')::int; mods_out := mods_out || jsonb_build_array(opt); end if;
      end loop;
      if (grp->>'required')::boolean and cnt < 1 then raise exception 'Choose an option for %.', grp->>'name'; end if;
      if not (grp->>'multi')::boolean and cnt > 1 then raise exception '%: pick only one.', grp->>'name'; end if;
      if (grp->>'multi')::boolean and coalesce((grp->>'max')::int, 0) > 0 and cnt > (grp->>'max')::int then raise exception '%: pick at most %.', grp->>'name', grp->>'max'; end if;
    end loop;
    if jsonb_array_length(mods_out) <> ids_expected then raise exception 'An option you chose is no longer available.'; end if;
    select string_agg(x->>'id', ',' order by x->>'id') into keyparts from jsonb_array_elements(mods_out) x;
    lines_out := lines_out || jsonb_build_object('key', prod.id || '|' || coalesce(keyparts, '') || '|' || lower(coalesce(left(l->>'note', 140), '')),
      'productId', prod.id, 'merchantId', m.id, 'name', prod.name, 'unitPrice', unit, 'qty', qty, 'mods', mods_out, 'note', nullif(left(l->>'note', 140), ''));
    sub := sub + unit * qty;
  end loop;

  if p_promo is not null and btrim(p_promo) <> '' then
    select pct into v_pct from public.promos where code = upper(btrim(p_promo)) and active and (expires_at is null or expires_at > now());
    if not found then raise exception 'That promo code is not valid or has expired.'; end if;
  end if;
  disc := round(sub * v_pct / 100.0);
  dlv  := case when sub >= free_from then 0 else m.delivery_fee + case when sub < 2000 then 300 else 0 end end;
  svc  := least(300, round(sub * 0.03));
  tot  := greatest(0, sub - disc + dlv + svc);
  if p_pay = 'cod' and tot > cod_max then raise exception 'Cash on delivery is available up to ₦%. Pay by card, transfer or wallet.', cod_max; end if;

  eta := round((m.eta_min + m.eta_max) / 2.0);
  insert into public.orders (customer_id, merchant_id, lines, subtotal, delivery_fee, service_fee, discount, total, promo_code, pay, address, stage_times, eta_minutes, latest_by)
  values (uid, m.id, lines_out, sub, dlv, svc, disc, tot, case when v_pct > 0 then upper(btrim(p_promo)) end, p_pay,
          jsonb_build_object('id', a.id, 'label', a.label, 'line', a.line, 'area', a.area, 'landmark', a.landmark, 'location', jsonb_build_object('latitude', a.lat, 'longitude', a.lng)),
          jsonb_build_object('received', ms), eta, now() + make_interval(mins => eta + 12))
  returning * into o;
  v_otp := (1000 + (abs(('x' || encode(gen_random_bytes(4), 'hex'))::bit(32)::bigint) % 9000))::text;
  insert into public.order_secrets (order_id, otp) values (o.id, v_otp);

  if p_pay = 'wallet' then
    perform public._debit(uid, tot, 'Order ' || o.id);
    update public.orders set paid = true, paid_at = now(), paid_by = 'wallet' where id = o.id returning * into o;
  end if;
  return jsonb_build_object('order', to_jsonb(o), 'otp', v_otp);
end $$;

create or replace function public.get_public_catalog() returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'categories', coalesce((select jsonb_agg(jsonb_build_object('vertical', c.vertical, 'name', c.name, 'icon', c.icon, 'visible', c.visible) order by c.vertical, c.name) from public.catalog_categories c), '[]'::jsonb),
    'brands', coalesce((select jsonb_agg(jsonb_build_object('name', b.name, 'vertical', b.vertical) order by b.name) from public.catalog_brands b where b.featured), '[]'::jsonb),
    'cities', coalesce((select jsonb_agg(jsonb_build_object('name', c.name, 'state', c.state, 'status', c.status) order by c.name) from public.loc_cities c), '[]'::jsonb),
    'hoods', coalesce((select jsonb_agg(jsonb_build_object('city', h.city, 'name', h.name, 'status', h.status) order by h.city, h.name) from public.loc_hoods h), '[]'::jsonb),
    'smartCart', coalesce((select value from public.platform_settings where key = 'smart_cart'), 'null'::jsonb),
    'brand', coalesce((select value from public.platform_settings where key = 'brand'), 'null'::jsonb))
$$;
revoke execute on function public.get_public_catalog() from public, anon, authenticated;
grant execute on function public.get_public_catalog() to anon, authenticated;
