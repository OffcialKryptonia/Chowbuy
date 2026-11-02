-- Admin cancellation of active orders. Cancellation is atomic, audited and never deletes an order.
create table if not exists public.order_admin_cancellations (
  order_id text primary key references public.orders(id) on delete restrict,
  admin_id uuid not null references public.profiles(id),
  reason text not null check (char_length(reason) between 5 and 500),
  internal_note text not null default '' check (char_length(internal_note) <= 1000),
  stage_before_cancel order_stage not null,
  rider_id uuid references public.profiles(id),
  refund_status text not null check (refund_status in ('not_required', 'manual_review_required')),
  cancelled_at timestamptz not null default now()
);
alter table public.order_admin_cancellations enable row level security;
drop policy if exists order_admin_cancellations_admin_read on public.order_admin_cancellations;
create policy order_admin_cancellations_admin_read on public.order_admin_cancellations
  for select to authenticated using (public.is_admin());
revoke all on public.order_admin_cancellations from anon, authenticated;
grant select on public.order_admin_cancellations to authenticated;

create or replace function public.admin_cancel_order(
  p_order text,
  p_reason text,
  p_internal_note text default ''
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  o public.orders;
  why text := btrim(coalesce(p_reason, ''));
  note text := btrim(coalesce(p_internal_note, ''));
  refund_state text;
begin
  perform public._need_admin();
  if coalesce(btrim(p_order), '') = '' then raise exception 'Order reference is required.'; end if;
  if char_length(why) not between 5 and 500 then raise exception 'Enter a cancellation reason (5–500 characters).'; end if;
  if char_length(note) > 1000 then raise exception 'Internal note must be 1,000 characters or fewer.'; end if;

  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'Order not found.'; end if;
  if o.stage in ('delivered', 'cancelled') then raise exception 'This order is already completed or cancelled.'; end if;

  -- No payment is reversed here. A paid cancellation is explicitly queued for a human/provider refund review.
  refund_state := case when o.paid then 'manual_review_required' else 'not_required' end;
  insert into public.order_admin_cancellations
    (order_id, admin_id, reason, internal_note, stage_before_cancel, rider_id, refund_status)
  values (o.id, auth.uid(), why, note, o.stage, o.rider_id, refund_state);

  update public.orders
    set stage = 'cancelled',
        stage_times = coalesce(stage_times, '{}'::jsonb) || jsonb_build_object('cancelled', public.now_ms())
    where id = o.id;

  perform public.log_audit('admin_order_cancelled', jsonb_build_object(
    'order_id', o.id, 'reason', why, 'previous_stage', o.stage::text,
    'rider_id', o.rider_id, 'refund_status', refund_state
  ));

  return jsonb_build_object(
    'order_id', o.id, 'status', 'cancelled', 'previous_stage', o.stage::text,
    'cancelled_at', now(), 'refund_status', refund_state,
    'rider_notified', o.rider_id is not null
  );
end $$;

revoke all on function public.admin_cancel_order(text, text, text) from public, anon;
grant execute on function public.admin_cancel_order(text, text, text) to authenticated;
