-- Admin Console: real chat supervision and a public bucket for brand assets. Admin only.

create or replace function public.admin_chat_threads() returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  perform public._need_admin();
  return jsonb_build_object(
    'threads', coalesce((select jsonb_agg(t order by t.last_at desc) from (
      select o.id as id, o.id as "orderId", coalesce(nullif(c.full_name, ''), 'Customer') as customer, coalesce(r.name, 'No rider yet') as rider,
        coalesce(nullif(o.address->>'area', ''), '') as city, o.stage::text as stage,
        exists (select 1 from public.chat_locks l where l.order_id = o.id) as locked, x.last_at,
        (select coalesce(jsonb_agg(jsonb_build_object('id', m.id, 'from', m.sender_role, 't', m.body, 'ts', (extract(epoch from m.created_at) * 1000)::bigint,
            'flags', to_jsonb(m.flags), 'reviewed', m.reviewed) order by m.created_at), '[]'::jsonb)
         from (select * from public.chat_messages where order_id = o.id order by created_at desc limit 60) m) as msgs
      from (select order_id, max(created_at) as last_at from public.chat_messages group by order_id order by 2 desc limit 100) x
        join public.orders o on o.id = x.order_id
        left join public.profiles c on c.id = o.customer_id
        left join public.riders r on r.user_id = o.rider_id) t), '[]'::jsonb),
    'audit', coalesce((select jsonb_agg(a order by a.at desc) from (
      select g.action, g.meta, g.at, coalesce(nullif(p.full_name, ''), 'Admin') as who
      from public.audit_log g left join public.profiles p on p.id = g.actor where g.action like 'chat.%' order by g.at desc limit 30) a), '[]'::jsonb));
end $$;

create or replace function public.admin_chat_review(p_message uuid) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public._need_admin();
  update public.chat_messages set reviewed = true where id = p_message;
  if not found then raise exception 'Message not found.'; end if;
  perform public.log_audit('chat.review', jsonb_build_object('message', p_message));
end $$;

create or replace function public.admin_chat_filter_save(p_id text, p_enabled boolean, p_action text, p_words text[]) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare f public.chat_filters; w text[];
begin
  perform public._need_admin();
  select * into f from public.chat_filters where id = p_id;
  if not found then raise exception 'Filter not found.'; end if;
  if p_action not in ('block', 'mask', 'flag') then raise exception 'Choose block, mask or flag.'; end if;
  if f.builtin then w := f.words;
  else
    select coalesce(array_agg(distinct x), '{}') into w from (select lower(btrim(e)) as x from unnest(coalesce(p_words, '{}')) e) s where x <> '';
    if array_length(w, 1) > 100 then raise exception 'Up to 100 keywords per filter.'; end if;
    if exists (select 1 from unnest(w) e where char_length(e) > 40) then raise exception 'Keywords can be up to 40 characters.'; end if;
  end if;
  update public.chat_filters set enabled = coalesce(p_enabled, true), action = p_action, words = w where id = p_id;
  perform public.log_audit('chat.filter', jsonb_build_object('id', p_id, 'enabled', p_enabled, 'action', p_action, 'words', coalesce(array_length(w, 1), 0)));
end $$;

create or replace function public.admin_broadcast_count(p_area text) returns int language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  perform public._need_admin();
  return (select count(*) from public.orders where stage not in ('delivered', 'cancelled') and (paid or pay = 'cod')
    and (coalesce(p_area, '') = '' or address->>'area' ilike '%' || p_area || '%'));
end $$;

/* ---------------- storage: public 'brand' bucket for logos; only admins can write ---------------- */
do $$ begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public) values ('brand', 'brand', true) on conflict do nothing;
    execute $p$create policy brand_admin_insert on storage.objects for insert to authenticated with check (bucket_id = 'brand' and public.is_admin())$p$;
    execute $p$create policy brand_admin_update on storage.objects for update to authenticated using (bucket_id = 'brand' and public.is_admin())$p$;
    execute $p$create policy brand_admin_delete on storage.objects for delete to authenticated using (bucket_id = 'brand' and public.is_admin())$p$;
  end if;
end $$;

revoke execute on function public.admin_chat_threads(), public.admin_chat_review(uuid), public.admin_chat_filter_save(text, boolean, text, text[]), public.admin_broadcast_count(text) from public, anon, authenticated;
grant execute on function public.admin_chat_threads(), public.admin_chat_review(uuid), public.admin_chat_filter_save(text, boolean, text, text[]), public.admin_broadcast_count(text) to authenticated;
