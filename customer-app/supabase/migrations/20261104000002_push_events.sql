/*
 * Order and operations push alerts for all four apps (Customer, Rider, Merchant, Admin) through the push-notify edge function.
 * Database triggers post a tiny event to the function with pg_net. The function works out who to notify and sends through OneSignal
 * (or Expo for devices that registered with Expo). Nothing here can block or fail an order: every trigger swallows errors.
 */
create extension if not exists pg_net with schema extensions;

/* Shared secret and URL the triggers use to reach the function. Only the service role and these SECURITY DEFINER functions can read them. */
insert into public.platform_secrets (key, value, hint) values ('push_hook_secret', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'internal')
  on conflict (key) do nothing;
insert into public.platform_secrets (key, value, hint) values ('push_hook_url', 'https://nhaxcyfkbrbwlqbpizjo.supabase.co/functions/v1/push-notify', 'internal')
  on conflict (key) do nothing;

create or replace function public._push_event(p_event text, p_ref text) returns void language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare u text; s text;
begin
  select value into u from public.platform_secrets where key = 'push_hook_url';
  select value into s from public.platform_secrets where key = 'push_hook_secret';
  if u is null or s is null then return; end if;
  perform net.http_post(url := u, headers := jsonb_build_object('Content-Type', 'application/json', 'x-hook-secret', s),
    body := jsonb_build_object('event', p_event, 'ref', p_ref), timeout_milliseconds := 5000);
exception when others then
  null;   -- push is best effort and must never break the transaction that caused it
end $$;
revoke all on function public._push_event(text, text) from public, anon, authenticated;

create or replace function public._orders_push() returns trigger language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare ready_new boolean; ready_old boolean;
begin
  ready_new := new.paid or new.pay = 'cod';
  ready_old := case when tg_op = 'INSERT' then false else (old.paid or old.pay = 'cod') end;
  if ready_new and not ready_old and new.stage = 'received' then
    perform public._push_event('order_new', new.id);
  end if;
  if tg_op = 'UPDATE' and new.stage is distinct from old.stage then
    perform public._push_event('order_' || new.stage::text, new.id);
  end if;
  return null;
exception when others then
  return null;
end $$;
drop trigger if exists orders_push on public.orders;
create trigger orders_push after insert or update of stage, paid on public.orders for each row execute function public._orders_push();

create or replace function public._app_submitted_push() returns trigger language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  if new.status = 'SUBMITTED' and (tg_op = 'INSERT' or old.status is distinct from new.status) then perform public._push_event('application_submitted', new.id::text); end if;
  return null;
exception when others then
  return null;
end $$;
drop trigger if exists merchant_applications_push on public.merchant_applications;
create trigger merchant_applications_push after insert or update of status on public.merchant_applications for each row execute function public._app_submitted_push();

create or replace function public._sos_push() returns trigger language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  perform public._push_event('sos', new.id::text);
  return null;
exception when others then
  return null;
end $$;
drop trigger if exists sos_events_push on public.sos_events;
create trigger sos_events_push after insert on public.sos_events for each row execute function public._sos_push();
