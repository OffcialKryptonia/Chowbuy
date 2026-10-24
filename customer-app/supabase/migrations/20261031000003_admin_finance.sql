-- Admin Console: real money figures and a real wallet transfer trail. Admin only.

/* ---------------- wallet transfers ledger ---------------- */
create sequence if not exists public.wallet_transfer_seq start 1000;
create table if not exists public.wallet_transfers (
  id text primary key default ('WT-' || nextval('public.wallet_transfer_seq')),
  sender uuid references public.profiles(id) on delete set null,
  recipient uuid references public.profiles(id) on delete set null,
  sender_label text not null default '', recipient_label text not null default '',
  amount int not null check (amount > 0), fee int not null default 0 check (fee >= 0),
  status text not null default 'completed' check (status in ('completed', 'failed', 'reversed')),
  created_at timestamptz not null default now()
);
create index if not exists wallet_transfers_created on public.wallet_transfers (created_at desc);
alter table public.wallet_transfers enable row level security;
revoke all on public.wallet_transfers from public, anon, authenticated;   -- written by wallet_send, read by Admin through admin_wallet_transfers

-- Same rules as before; it now also records the transfer for the compliance trail.
create or replace function public.wallet_send(p_phone text, p_amount int) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); n text := public.norm_ng_phone(p_phone); rcpt uuid; nm text; sname text; sphone text;
begin
  if uid is null then raise exception 'Sign in first.'; end if;
  if p_amount is null or p_amount < 100 then raise exception 'Minimum transfer is ₦100.'; end if;
  if p_amount > 500000 then raise exception 'Maximum single transfer is ₦500,000.'; end if;
  if n is null then raise exception 'Enter a valid Nigerian mobile number.'; end if;
  select id, full_name into rcpt, nm from public.profiles where phone = n;
  if rcpt is null then raise exception 'No ChowBuy wallet found for that number.'; end if;
  if rcpt = uid then raise exception 'You cannot send money to yourself.'; end if;
  select full_name, phone into sname, sphone from public.profiles where id = uid;
  perform public._debit(uid, p_amount, 'Sent to ' || n);
  perform public._credit(rcpt, p_amount, 'Received from ' || coalesce(nullif(sname, ''), 'a ChowBuy user'));
  insert into public.wallet_transfers (sender, recipient, sender_label, recipient_label, amount)
    values (uid, rcpt, coalesce(nullif(sname, ''), 'Customer') || coalesce(' · ' || sphone, ''), coalesce(nullif(nm, ''), 'Customer') || ' · ' || n, p_amount);
end $$;

create or replace function public.admin_wallet_transfers(p_search text default '', p_limit int default 50, p_offset int default 0) returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare q text := '%' || lower(btrim(coalesce(p_search, ''))) || '%';
begin
  perform public._need_admin();
  return jsonb_build_object(
    'volume', (select coalesce(sum(amount), 0) from public.wallet_transfers where status = 'completed'),
    'fees', (select coalesce(sum(fee), 0) from public.wallet_transfers where status = 'completed'),
    'count', (select count(*) from public.wallet_transfers),
    'total', (select count(*) from public.wallet_transfers where lower(id || ' ' || sender_label || ' ' || recipient_label) like q),
    'rows', coalesce((select jsonb_agg(x order by x.created_at desc) from (
      select id, sender_label as "from", recipient_label as "to", amount, fee, status, created_at from public.wallet_transfers
      where lower(id || ' ' || sender_label || ' ' || recipient_label) like q
      order by created_at desc limit least(greatest(p_limit, 1), 200) offset greatest(p_offset, 0)) x), '[]'::jsonb));
end $$;

/* ---------------- finance ---------------- */
-- Figures are computed from delivered orders, the wallet, and recorded rider earnings. Payout batches and refunds are not recorded
-- in the backend yet, so nothing here pretends otherwise.
create or replace function public.admin_finance(p_days int default 30) returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare d int := least(greatest(coalesce(p_days, 30), 1), 365); since timestamptz; out jsonb;
begin
  perform public._need_admin();
  since := now() - make_interval(days => d);
  select jsonb_build_object(
    'days', d,
    'delivered', count(*) filter (where stage = 'delivered'),
    'gmv', coalesce(sum(total) filter (where stage = 'delivered'), 0),
    'merchantSales', coalesce(sum(subtotal - discount) filter (where stage = 'delivered'), 0),
    'deliveryFees', coalesce(sum(delivery_fee) filter (where stage = 'delivered'), 0),
    'serviceFees', coalesce(sum(service_fee) filter (where stage = 'delivered'), 0),
    'discounts', coalesce(sum(discount) filter (where stage = 'delivered'), 0),
    'tips', coalesce(sum(tip) filter (where stage = 'delivered'), 0),
    'cancelledPaid', coalesce(sum(total) filter (where stage = 'cancelled' and paid and pay <> 'cod'), 0),
    'codOwed', coalesce(sum(total) filter (where pay = 'cod' and not paid and stage not in ('cancelled')), 0),
    'byMethod', coalesce((select jsonb_object_agg(m, v) from (select pay::text as m, sum(total) as v from public.orders where created_at >= since and stage = 'delivered' group by pay) t), '{}'::jsonb)
  ) into out from public.orders where created_at >= since;
  return out || jsonb_build_object(
    'walletFloat', (select coalesce(sum(balance), 0) from public.wallets),
    'topups', (select coalesce(sum(amount), 0) from public.payments where purpose = 'topup' and status = 'paid' and created_at >= since),
    'riderNet', (select coalesce(sum(net), 0) from public.rider_earnings where created_at >= since),
    'riderCommission', (select coalesce(sum(commission), 0) from public.rider_earnings where created_at >= since),
    'merchants', (select coalesce(jsonb_agg(x order by x.sales desc), '[]'::jsonb) from (
        select m.id, m.name, count(*) as orders, sum(o.subtotal - o.discount) as sales
        from public.orders o join public.merchants m on m.id = o.merchant_id where o.created_at >= since and o.stage = 'delivered' group by m.id, m.name order by 4 desc limit 20) x),
    'riders', (select coalesce(jsonb_agg(x order by x.net desc), '[]'::jsonb) from (
        select e.rider_id as id, coalesce(r.name, 'Rider') as name, e.model, count(*) as deliveries, sum(e.net) as net, sum(e.commission) as commission
        from public.rider_earnings e left join public.riders r on r.user_id = e.rider_id where e.created_at >= since group by e.rider_id, r.name, e.model order by 5 desc limit 20) x));
end $$;

revoke execute on function public.wallet_send(text, int), public.admin_wallet_transfers(text, int, int), public.admin_finance(int) from public, anon, authenticated;
grant execute on function public.wallet_send(text, int), public.admin_wallet_transfers(text, int, int), public.admin_finance(int) to authenticated;
