/*
 * Admin uploads to the public 'brand' bucket use upsert (replace a file in place). A storage upsert is INSERT ... ON CONFLICT DO UPDATE,
 * which Postgres only allows when the role can also SELECT the object. The bucket had insert, update and delete policies but no select policy,
 * so every upload failed with "new row violates row-level security policy". Public reads are unaffected (the bucket is public).
 */
do $$ begin
  if to_regclass('storage.objects') is not null then
    drop policy if exists brand_admin_select on storage.objects;
    create policy brand_admin_select on storage.objects for select to authenticated using (bucket_id = 'brand' and public.is_admin());
    drop policy if exists brand_admin_update on storage.objects;
    create policy brand_admin_update on storage.objects for update to authenticated using (bucket_id = 'brand' and public.is_admin()) with check (bucket_id = 'brand' and public.is_admin());
  end if;
end $$;
