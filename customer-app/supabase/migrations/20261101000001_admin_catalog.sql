-- Admin Console: managed categories and brands. Admin only. (The customer app does not read these yet.)

create sequence if not exists public.catalog_seq start 1;
create table if not exists public.catalog_categories (
  id text primary key default ('CAT-' || nextval('public.catalog_seq')),
  vertical text not null check (vertical in ('restaurant', 'grocery', 'pharmacy', 'package')),
  name text not null check (char_length(name) between 2 and 40),
  icon text not null default 'tags', visible boolean not null default true, created_at timestamptz not null default now()
);
create unique index if not exists catalog_categories_uq on public.catalog_categories (vertical, lower(name));
create table if not exists public.catalog_brands (
  id text primary key default ('BRD-' || nextval('public.catalog_seq')),
  name text not null check (char_length(name) between 2 and 40),
  vertical text not null check (vertical in ('restaurant', 'grocery', 'pharmacy', 'package')),
  featured boolean not null default false, created_at timestamptz not null default now()
);
create unique index if not exists catalog_brands_uq on public.catalog_brands (lower(name));
alter table public.catalog_categories enable row level security;
alter table public.catalog_brands enable row level security;
revoke all on public.catalog_categories, public.catalog_brands from public, anon, authenticated;

-- Counts come from real products and delivered orders (last 30 days). Brands are matched by name inside product names.
create or replace function public.admin_catalog() returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare out jsonb;
begin
  perform public._need_admin();
  with sales as (
    select m.vertical, lower(p.category) as cat, sum((l->>'unitPrice')::numeric * (l->>'qty')::numeric) as s
    from public.orders o cross join lateral jsonb_array_elements(o.lines) l
      join public.products p on p.id = l->>'productId' join public.merchants m on m.id = p.merchant_id
    where o.stage = 'delivered' and o.created_at >= now() - interval '30 days' group by 1, 2),
  tot as (select coalesce(sum(s), 0) as t from sales)
  select jsonb_build_object(
    'categories', coalesce((select jsonb_agg(x order by x.vertical, x.name) from (
        select c.id, c.vertical, c.name, c.icon, c.visible,
          (select count(*) from public.products p join public.merchants m on m.id = p.merchant_id where m.vertical = c.vertical and lower(p.category) = lower(c.name)) as items,
          (select count(distinct p.merchant_id) from public.products p join public.merchants m on m.id = p.merchant_id where m.vertical = c.vertical and lower(p.category) = lower(c.name)) as merchants,
          case when (select t from tot) = 0 then 0 else round(coalesce((select s from sales where sales.vertical = c.vertical and sales.cat = lower(c.name)), 0) / (select t from tot) * 100, 1) end as share
        from public.catalog_categories c) x), '[]'::jsonb),
    'unmanaged', coalesce((select jsonb_agg(x order by x.vertical, x.name) from (
        select m.vertical, min(p.category) as name, count(*) as items
        from public.products p join public.merchants m on m.id = p.merchant_id
        where btrim(p.category) <> '' and not exists (select 1 from public.catalog_categories c where c.vertical = m.vertical and lower(c.name) = lower(p.category))
        group by m.vertical, lower(p.category)) x), '[]'::jsonb),
    'brands', coalesce((select jsonb_agg(x order by x.name) from (
        select b.id, b.name, b.vertical, b.featured,
          (select count(*) from public.products p where lower(p.name) like '%' || lower(b.name) || '%') as products,
          (select count(distinct p.merchant_id) from public.products p where lower(p.name) like '%' || lower(b.name) || '%') as merchants
        from public.catalog_brands b) x), '[]'::jsonb)) into out;
  return out;
end $$;

create or replace function public.admin_category_add(p_vertical text, p_name text, p_icon text default 'tags') returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare n text := btrim(coalesce(p_name, ''));
begin
  perform public._need_admin();
  if p_vertical not in ('restaurant', 'grocery', 'pharmacy', 'package') then raise exception 'Choose a vertical.'; end if;
  if char_length(n) < 2 then raise exception 'Enter a category name (at least 2 characters).'; end if;
  if char_length(n) > 40 then raise exception 'Category names can be up to 40 characters.'; end if;
  if p_icon is null or p_icon not in ('utensils', 'cart', 'pill', 'box', 'tags', 'sparkles', 'star', 'zap', 'bag', 'store') then p_icon := 'tags'; end if;
  if exists (select 1 from public.catalog_categories where vertical = p_vertical and lower(name) = lower(n)) then raise exception 'That category already exists in %.', p_vertical; end if;
  insert into public.catalog_categories (vertical, name, icon) values (p_vertical, n, p_icon);
  perform public.log_audit('catalog.category_add', jsonb_build_object('vertical', p_vertical, 'name', n));
end $$;

create or replace function public.admin_category_set_visible(p_id text, p_visible boolean) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public._need_admin();
  update public.catalog_categories set visible = coalesce(p_visible, true) where id = p_id;
  if not found then raise exception 'Category not found.'; end if;
  perform public.log_audit('catalog.category_visible', jsonb_build_object('id', p_id, 'visible', p_visible));
end $$;

create or replace function public.admin_brand_add(p_name text, p_vertical text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare n text := btrim(coalesce(p_name, ''));
begin
  perform public._need_admin();
  if p_vertical not in ('restaurant', 'grocery', 'pharmacy', 'package') then raise exception 'Choose a vertical.'; end if;
  if char_length(n) < 2 then raise exception 'Enter a brand name.'; end if;
  if char_length(n) > 40 then raise exception 'Brand names can be up to 40 characters.'; end if;
  if exists (select 1 from public.catalog_brands where lower(name) = lower(n)) then raise exception 'That brand is already in the catalog.'; end if;
  insert into public.catalog_brands (name, vertical) values (n, p_vertical);
  perform public.log_audit('catalog.brand_add', jsonb_build_object('vertical', p_vertical, 'name', n));
end $$;

create or replace function public.admin_brand_set_featured(p_id text, p_featured boolean) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public._need_admin();
  update public.catalog_brands set featured = coalesce(p_featured, false) where id = p_id;
  if not found then raise exception 'Brand not found.'; end if;
  perform public.log_audit('catalog.brand_featured', jsonb_build_object('id', p_id, 'featured', p_featured));
end $$;

revoke execute on function public.admin_catalog(), public.admin_category_add(text, text, text), public.admin_category_set_visible(text, boolean),
  public.admin_brand_add(text, text), public.admin_brand_set_featured(text, boolean) from public, anon, authenticated;
grant execute on function public.admin_catalog(), public.admin_category_add(text, text, text), public.admin_category_set_visible(text, boolean),
  public.admin_brand_add(text, text), public.admin_brand_set_featured(text, boolean) to authenticated;
