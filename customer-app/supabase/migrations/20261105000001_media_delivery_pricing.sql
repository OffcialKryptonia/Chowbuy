/*
 * 1. Store media: merchants upload a logo, a cover image and product photos to the public store-media bucket (one folder per store).
 * 2. Delivery fee is a platform decision. Merchants can no longer set it; Admin sets it once in the delivery pricing engine and it applies to every store.
 */
alter table public.merchants add column if not exists logo text;

do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      values ('store-media', 'store-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
      on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];
    execute 'drop policy if exists store_media_insert on storage.objects';
    execute 'drop policy if exists store_media_select on storage.objects';
    execute 'drop policy if exists store_media_update on storage.objects';
    execute 'drop policy if exists store_media_delete on storage.objects';
    execute $p$create policy store_media_insert on storage.objects for insert to authenticated with check (bucket_id = 'store-media' and (public.is_admin() or public._is_member((storage.foldername(name))[1], array['owner', 'manager'])))$p$;
    execute $p$create policy store_media_select on storage.objects for select to authenticated using (bucket_id = 'store-media' and (public.is_admin() or public._is_member((storage.foldername(name))[1], array['owner', 'manager'])))$p$;
    execute $p$create policy store_media_update on storage.objects for update to authenticated using (bucket_id = 'store-media' and (public.is_admin() or public._is_member((storage.foldername(name))[1], array['owner', 'manager']))) with check (bucket_id = 'store-media' and (public.is_admin() or public._is_member((storage.foldername(name))[1], array['owner', 'manager'])))$p$;
    execute $p$create policy store_media_delete on storage.objects for delete to authenticated using (bucket_id = 'store-media' and (public.is_admin() or public._is_member((storage.foldername(name))[1], array['owner', 'manager'])))$p$;
  end if;
end $$;

/* Only addresses inside this store's own media folder are accepted, so nobody can point a store at someone else's picture or a tracking URL. */
create or replace function public._store_media_ok(p_merchant text, p_url text) returns boolean language sql immutable set search_path = public, pg_temp as $$
  select p_url is null or p_url = '' or (char_length(p_url) <= 400 and p_url ~ ('^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/store-media/' || p_merchant || '/[A-Za-z0-9._-]+$'))
$$;

create or replace function public.merchant_media_save(p_merchant text, p_logo text default null, p_cover text default null) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_admin() and not public._is_member(p_merchant, array['owner', 'manager']) then raise exception 'Store not found.'; end if;
  if not public._store_media_ok(p_merchant, p_logo) or not public._store_media_ok(p_merchant, p_cover) then raise exception 'That image address is not allowed. Upload it from the Store settings page.'; end if;
  update public.merchants set logo = case when p_logo is null then logo else nullif(p_logo, '') end, image = case when p_cover is null then image else nullif(p_cover, '') end where id = p_merchant;
  if not found then raise exception 'Store not found.'; end if;
end $$;

/* Product save now carries the photo. p_image null keeps the current one; empty text removes it. */
drop function if exists public.merchant_product_save(text, text, text, text, int, text, boolean, boolean);
create or replace function public.merchant_product_save(p_merchant text, p_id text, p_name text, p_descr text, p_price int, p_category text, p_in_stock boolean, p_rx boolean default false, p_image text default null)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare m public.merchants; pid text; v_rx boolean;
begin
  m := public._store_of(p_merchant);
  if not public.is_admin() and not public._is_member(p_merchant, array['owner', 'manager']) then raise exception 'Only an owner or manager can change the catalogue.'; end if;
  if m.application_status <> 'APPROVED' or not m.verified then
    raise exception '%', case when m.business_type = 'PHARMACY' then 'Your pharmacy must finish verification before you can list products.' else 'Your application must be approved before you can list products.' end;
  end if;
  p_name := btrim(coalesce(p_name, '')); p_descr := btrim(coalesce(p_descr, '')); p_category := btrim(coalesce(p_category, ''));
  if char_length(p_name) not between 1 and 80 then raise exception 'Enter a name of up to 80 characters.'; end if;
  if p_price is null or p_price < 0 or p_price > 10000000 then raise exception 'Enter a valid price.'; end if;
  if char_length(p_descr) > 400 then raise exception 'The description is too long (400 characters at most).'; end if;
  if char_length(p_category) > 40 then raise exception 'The category is too long (40 characters at most).'; end if;
  if not public._store_media_ok(p_merchant, p_image) then raise exception 'That image address is not allowed. Upload the photo from this form.'; end if;
  v_rx := coalesce(p_rx, false) and m.vertical = 'pharmacy';
  if coalesce(p_id, '') = '' then
    pid := 'p' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
    insert into public.products (id, merchant_id, name, descr, price, category, in_stock, rx, image) values (pid, m.id, p_name, p_descr, p_price, p_category, coalesce(p_in_stock, true), v_rx, nullif(p_image, ''));
  else
    update public.products set name = p_name, descr = p_descr, price = p_price, category = p_category, in_stock = coalesce(p_in_stock, true), rx = v_rx,
      image = case when p_image is null then image else nullif(p_image, '') end
      where id = p_id and merchant_id = m.id;
    if not found then raise exception 'Item not found.'; end if;
    pid := p_id;
  end if;
  return pid;
end $$;
revoke all on function public.merchant_product_save(text, text, text, text, int, text, boolean, boolean, text) from public, anon;
grant execute on function public.merchant_product_save(text, text, text, text, int, text, boolean, boolean, text) to authenticated;
revoke all on function public.merchant_media_save(text, text, text) from public, anon;
grant execute on function public.merchant_media_save(text, text, text) to authenticated;
revoke all on function public._store_media_ok(text, text) from public, anon;
grant execute on function public._store_media_ok(text, text) to authenticated;

/* Store details a merchant may change no longer include the delivery fee. */
drop function if exists public.merchant_store_update(text, text, text, int, int, int);
create or replace function public.merchant_store_update(p_merchant text, p_name text, p_hours text, p_eta_min int, p_eta_max int) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public._is_member(p_merchant, array['owner', 'manager']) then raise exception 'Store not found.'; end if;
  if char_length(btrim(coalesce(p_name, ''))) not between 2 and 80 then raise exception 'Enter a store name.'; end if;
  if char_length(coalesce(p_hours, '')) > 80 then raise exception 'The opening hours are too long.'; end if;
  if p_eta_min is null or p_eta_max is null or p_eta_min < 1 or p_eta_max < p_eta_min or p_eta_max > 240 then raise exception 'Enter a delivery time range, fastest first.'; end if;
  update public.merchants set name = btrim(p_name), hours = btrim(coalesce(p_hours, '')), eta_min = p_eta_min, eta_max = p_eta_max where id = p_merchant;
end $$;
revoke all on function public.merchant_store_update(text, text, text, int, int) from public, anon;
grant execute on function public.merchant_store_update(text, text, text, int, int) to authenticated;
do $$ begin
  begin revoke update (delivery_fee, image, logo) on public.merchants from authenticated; exception when others then null; end;
end $$;

/* ---------------- delivery pricing engine (Admin only) ---------------- */
create or replace function public._delivery_cfg() returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object('base', 500, 'perKm', 0, 'service', 0, 'minBasket', 0) || coalesce((select value from public.platform_settings where key = 'delivery'), '{}'::jsonb)
$$;
revoke all on function public._delivery_cfg() from public, anon, authenticated;

create or replace function public.admin_delivery_get() returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  perform public._need_admin();
  return public._delivery_cfg();
end $$;

create or replace function public.admin_delivery_save(p jsonb) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare k text; v numeric; cur jsonb := public._delivery_cfg(); nxt jsonb := public._delivery_cfg();
begin
  perform public._need_admin();
  if jsonb_typeof(p) <> 'object' then raise exception 'Invalid settings.'; end if;
  foreach k in array array['base', 'perKm', 'service', 'minBasket'] loop
    if p ? k then
      begin v := (p->>k)::numeric; exception when others then raise exception 'Enter a valid amount for %.', k; end;
      if v < 0 or v > 100000 then raise exception 'Enter an amount between 0 and 100000 for %.', k; end if;
      nxt := nxt || jsonb_build_object(k, round(v));
    end if;
  end loop;
  insert into public.platform_settings (key, value, updated_at) values ('delivery', nxt, now()) on conflict (key) do update set value = excluded.value, updated_at = now();
  /* The base fare is the delivery fee every store charges, so the app quote and the order total always agree. */
  update public.merchants set delivery_fee = (nxt->>'base')::int where delivery_fee is distinct from (nxt->>'base')::int;
  perform public.log_audit('delivery_pricing', jsonb_build_object('before', cur, 'after', nxt));
  return nxt;
end $$;
revoke all on function public.admin_delivery_get(), public.admin_delivery_save(jsonb) from public, anon;
grant execute on function public.admin_delivery_get(), public.admin_delivery_save(jsonb) to authenticated;

/* New stores start at the platform fare. */
create or replace function public._merchant_fee_default() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  new.delivery_fee := (public._delivery_cfg()->>'base')::int;
  return new;
end $$;
drop trigger if exists merchants_fee_default on public.merchants;
create trigger merchants_fee_default before insert on public.merchants for each row execute function public._merchant_fee_default();
