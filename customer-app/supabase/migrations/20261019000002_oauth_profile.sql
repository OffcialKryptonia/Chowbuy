-- Accounts made with Google or Apple have no phone and may carry the name under "name". Never blocks sign-up.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare ph text := public.norm_ng_phone(new.raw_user_meta_data->>'phone');
begin
  if ph is not null and exists (select 1 from public.profiles where phone = ph) then ph := null; end if;
  insert into public.profiles (id, email, full_name, phone)
  values (new.id, new.email, coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), nullif(new.raw_user_meta_data->>'name', ''), ''), ph)
  on conflict do nothing;
  insert into public.wallets (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;
