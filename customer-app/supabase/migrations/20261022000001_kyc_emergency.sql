-- KYC for riders and merchants (admin can help applicants upload and can accept or decline at any time),
-- rider emergency contacts + SOS events, and the Emergency Services directory managed from Admin.

/* ---------------- KYC documents ---------------- */
create table public.kyc_docs (
  id           uuid primary key default gen_random_uuid(),
  subject_kind text not null check (subject_kind in ('rider', 'merchant')),
  subject_id   text not null,                       -- riders.user_id (as text) or merchants.id
  doc_type     text not null check (length(doc_type) between 2 and 40),
  status       text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  file_path    text,                                -- storage path in the private 'kyc' bucket
  note         text not null default '',            -- reviewer note, shown to the applicant when declined
  submitted_by uuid references public.profiles(id),
  submitted_by_admin boolean not null default false,
  reviewed_by  uuid references public.profiles(id),
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (subject_kind, subject_id, doc_type)
);
create index on public.kyc_docs (subject_kind, status);

create or replace function public._kyc_owns(p_kind text, p_subject text) returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select case p_kind
    when 'rider' then p_subject = auth.uid()::text
    when 'merchant' then exists (select 1 from public.merchants where id = p_subject and owner_id = auth.uid())
    else false end
$$;

alter table public.kyc_docs enable row level security;
revoke all on public.kyc_docs from anon, authenticated;
grant select on public.kyc_docs to authenticated;
create policy kyc_read on public.kyc_docs for select using (public.is_admin() or public._kyc_owns(subject_kind, subject_id));

-- Applicant sends (or re-sends) a document. Approved documents cannot be replaced by the applicant.
create or replace function public.kyc_submit(p_kind text, p_subject text, p_doc text, p_path text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  if not public._kyc_owns(p_kind, p_subject) then raise exception 'You can only send documents for your own account.' using errcode = '42501'; end if;
  if coalesce(trim(p_path), '') = '' then raise exception 'Attach the document first.'; end if;
  insert into public.kyc_docs (subject_kind, subject_id, doc_type, status, file_path, submitted_by)
    values (p_kind, p_subject, p_doc, 'pending', p_path, auth.uid())
  on conflict (subject_kind, subject_id, doc_type) do update
    set status = 'pending', file_path = excluded.file_path, note = '', submitted_by = auth.uid(), submitted_by_admin = false, reviewed_by = null, reviewed_at = null, updated_at = now()
    where public.kyc_docs.status <> 'approved';
  if not found then raise exception 'This document is already approved.'; end if;
end $$;

-- Admin: list everything for riders or merchants, including applicants who have not been approved yet.
create or replace function public.admin_kyc_list(p_kind text) returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  perform public._need_admin();
  if p_kind = 'rider' then
    return coalesce((select jsonb_agg(x order by x->>'name') from (
      select jsonb_build_object('id', r.user_id::text, 'name', r.name, 'phone', pr.phone, 'vehicle', r.vehicle, 'verified', r.verified, 'pay_model', r.pay_model,
        'docs', coalesce((select jsonb_agg(jsonb_build_object('doc', d.doc_type, 'status', d.status, 'file', d.file_path, 'note', d.note, 'by_admin', d.submitted_by_admin, 'at', d.updated_at)) from public.kyc_docs d where d.subject_kind = 'rider' and d.subject_id = r.user_id::text), '[]'::jsonb)) x
      from public.riders r join public.profiles pr on pr.id = r.user_id) s), '[]'::jsonb);
  elsif p_kind = 'merchant' then
    return coalesce((select jsonb_agg(x order by x->>'name') from (
      select jsonb_build_object('id', m.id, 'name', m.name, 'vertical', m.vertical, 'active', m.active,
        'docs', coalesce((select jsonb_agg(jsonb_build_object('doc', d.doc_type, 'status', d.status, 'file', d.file_path, 'note', d.note, 'by_admin', d.submitted_by_admin, 'at', d.updated_at)) from public.kyc_docs d where d.subject_kind = 'merchant' and d.subject_id = m.id), '[]'::jsonb)) x
      from public.merchants m) s), '[]'::jsonb);
  end if;
  raise exception 'Kind must be rider or merchant.';
end $$;

-- Admin: add/replace a document on the applicant's behalf, and accept or decline it, whether or not the applicant is verified yet.
create or replace function public.admin_kyc_set(p_kind text, p_subject text, p_doc text, p_status text, p_note text default '', p_path text default null) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public._need_admin();
  if p_kind not in ('rider', 'merchant') then raise exception 'Kind must be rider or merchant.'; end if;
  if p_status not in ('pending', 'approved', 'declined') then raise exception 'Status must be pending, approved or declined.'; end if;
  if p_status = 'declined' and coalesce(trim(p_note), '') = '' then raise exception 'Say why it was declined so the applicant can fix it.'; end if;
  if p_kind = 'rider' and not exists (select 1 from public.riders where user_id::text = p_subject) then raise exception 'Rider not found.'; end if;
  if p_kind = 'merchant' and not exists (select 1 from public.merchants where id = p_subject) then raise exception 'Merchant not found.'; end if;
  insert into public.kyc_docs (subject_kind, subject_id, doc_type, status, file_path, note, submitted_by, submitted_by_admin, reviewed_by, reviewed_at)
    values (p_kind, p_subject, p_doc, p_status, p_path, coalesce(p_note, ''), auth.uid(), p_path is not null, auth.uid(), case when p_status = 'pending' then null else now() end)
  on conflict (subject_kind, subject_id, doc_type) do update
    set status = excluded.status, note = excluded.note, file_path = coalesce(excluded.file_path, public.kyc_docs.file_path),
        submitted_by_admin = public.kyc_docs.submitted_by_admin or (p_path is not null),
        reviewed_by = excluded.reviewed_by, reviewed_at = excluded.reviewed_at, updated_at = now();
  perform public.log_audit('kyc_' || p_status, jsonb_build_object('kind', p_kind, 'subject', p_subject, 'doc', p_doc, 'note', p_note, 'helped', p_path is not null));
end $$;

-- Admin: mark the whole applicant verified (riders) or live (merchants). Independent of document state so ops can act while documents are outstanding.
create or replace function public.admin_kyc_decide(p_kind text, p_subject text, p_approve boolean) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public._need_admin();
  if p_kind = 'rider' then update public.riders set verified = p_approve where user_id::text = p_subject;
  elsif p_kind = 'merchant' then update public.merchants set active = p_approve where id = p_subject;
  else raise exception 'Kind must be rider or merchant.'; end if;
  if not found then raise exception 'Not found.'; end if;
  perform public.log_audit(case when p_approve then 'kyc_accept' else 'kyc_decline' end, jsonb_build_object('kind', p_kind, 'subject', p_subject));
end $$;

/* ---------------- emergency contacts, SOS, services directory ---------------- */
create table public.rider_contacts (
  rider_id uuid not null references public.profiles(id) on delete cascade,
  slot     int  not null check (slot in (1, 2)),
  name     text not null check (length(trim(name)) > 1),
  phone    text not null check (phone ~ '^[+]?[0-9 ]{9,}$'),
  primary key (rider_id, slot)
);
alter table public.rider_contacts enable row level security;
revoke all on public.rider_contacts from anon, authenticated;
grant select on public.rider_contacts to authenticated;
create policy contacts_read on public.rider_contacts for select using (rider_id = auth.uid() or public.is_admin());

create or replace function public.rider_set_contacts(p_name1 text, p_phone1 text, p_name2 text, p_phone2 text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not exists (select 1 from public.riders where user_id = auth.uid()) then raise exception 'Riders only.' using errcode = '42501'; end if;
  insert into public.rider_contacts values (auth.uid(), 1, p_name1, p_phone1) on conflict (rider_id, slot) do update set name = excluded.name, phone = excluded.phone;
  insert into public.rider_contacts values (auth.uid(), 2, p_name2, p_phone2) on conflict (rider_id, slot) do update set name = excluded.name, phone = excluded.phone;
end $$;

create table public.sos_events (
  id         uuid primary key default gen_random_uuid(),
  rider_id   uuid not null references public.profiles(id) on delete cascade,
  order_id   text references public.orders(id) on delete set null,
  lat        double precision, lng double precision,
  status     text not null default 'open' check (status in ('open', 'acknowledged', 'resolved')),
  note       text not null default '',
  handled_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  handled_at timestamptz
);
create index on public.sos_events (status, created_at desc);
alter table public.sos_events enable row level security;
revoke all on public.sos_events from anon, authenticated;
grant select on public.sos_events to authenticated;
create policy sos_read on public.sos_events for select using (rider_id = auth.uid() or public.is_admin());

create or replace function public.rider_sos(p_order text, p_lat double precision, p_lng double precision) returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v uuid;
begin
  if not exists (select 1 from public.riders where user_id = auth.uid()) then raise exception 'Riders only.' using errcode = '42501'; end if;
  insert into public.sos_events (rider_id, order_id, lat, lng) values (auth.uid(), nullif(p_order, ''), p_lat, p_lng) returning id into v;
  return v;
end $$;

create or replace function public.admin_sos_list() returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  perform public._need_admin();
  return coalesce((select jsonb_agg(x order by x->>'created_at' desc) from (
    select jsonb_build_object('id', e.id, 'rider', r.name, 'phone', pr.phone, 'order', e.order_id, 'lat', e.lat, 'lng', e.lng, 'status', e.status, 'note', e.note, 'created_at', e.created_at,
      'contacts', coalesce((select jsonb_agg(jsonb_build_object('name', c.name, 'phone', c.phone) order by c.slot) from public.rider_contacts c where c.rider_id = e.rider_id), '[]'::jsonb)) x
    from public.sos_events e join public.riders r on r.user_id = e.rider_id join public.profiles pr on pr.id = e.rider_id order by e.created_at desc limit 200) s), '[]'::jsonb);
end $$;

create or replace function public.admin_sos_set(p_id uuid, p_status text, p_note text default '') returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public._need_admin();
  if p_status not in ('open', 'acknowledged', 'resolved') then raise exception 'Bad status.'; end if;
  update public.sos_events set status = p_status, note = coalesce(p_note, note), handled_by = auth.uid(), handled_at = now() where id = p_id;
  if not found then raise exception 'SOS event not found.'; end if;
  perform public.log_audit('sos_' || p_status, jsonb_build_object('id', p_id, 'note', p_note));
end $$;

create table public.emergency_services (
  id      uuid primary key default gen_random_uuid(),
  city    text not null default '',                 -- '' = nationwide
  kind    text not null check (kind in ('police', 'ambulance', 'fire', 'road_safety', 'hotline', 'other')),
  label   text not null check (length(trim(label)) > 1),
  number  text not null check (number ~ '^[+]?[0-9 ]{3,}$'),
  active  boolean not null default true,
  sort    int not null default 0
);
alter table public.emergency_services enable row level security;
revoke all on public.emergency_services from anon, authenticated;
grant select on public.emergency_services to anon, authenticated;
create policy emerg_read on public.emergency_services for select using (active or public.is_admin());
insert into public.emergency_services (city, kind, label, number, sort) values
  ('', 'hotline', 'Nigeria Emergency Services', '112', 0),
  ('Lagos', 'hotline', 'Lagos State Emergency (LASEMA)', '767', 1);

create or replace function public.admin_emergency_save(p_id uuid, p_city text, p_kind text, p_label text, p_number text, p_active boolean) returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v uuid;
begin
  perform public._need_admin();
  if p_id is null then insert into public.emergency_services (city, kind, label, number, active) values (coalesce(p_city, ''), p_kind, p_label, p_number, coalesce(p_active, true)) returning id into v;
  else update public.emergency_services set city = coalesce(p_city, ''), kind = p_kind, label = p_label, number = p_number, active = coalesce(p_active, true) where id = p_id returning id into v;
    if v is null then raise exception 'Not found.'; end if; end if;
  perform public.log_audit('emergency_save', jsonb_build_object('id', v, 'label', p_label, 'number', p_number));
  return v;
end $$;
create or replace function public.admin_emergency_delete(p_id uuid) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin perform public._need_admin(); delete from public.emergency_services where id = p_id; perform public.log_audit('emergency_delete', jsonb_build_object('id', p_id)); end $$;

/* ---------------- storage: private 'kyc' bucket, one folder per subject id; admins can read and write all ---------------- */
do $$ begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public) values ('kyc', 'kyc', false) on conflict do nothing;
    execute $p$create policy kyc_upload on storage.objects for insert to authenticated with check (bucket_id = 'kyc' and (public.is_admin() or public._kyc_owns('rider', (storage.foldername(name))[1]) or public._kyc_owns('merchant', (storage.foldername(name))[1])))$p$;
    execute $p$create policy kyc_read_obj on storage.objects for select to authenticated using (bucket_id = 'kyc' and (public.is_admin() or public._kyc_owns('rider', (storage.foldername(name))[1]) or public._kyc_owns('merchant', (storage.foldername(name))[1])))$p$;
  end if;
end $$;

/* ---------------- grants ---------------- */
revoke all on function public._kyc_owns(text, text), public.kyc_submit(text, text, text, text), public.admin_kyc_list(text), public.admin_kyc_set(text, text, text, text, text, text),
  public.admin_kyc_decide(text, text, boolean), public.rider_set_contacts(text, text, text, text), public.rider_sos(text, double precision, double precision),
  public.admin_sos_list(), public.admin_sos_set(uuid, text, text), public.admin_emergency_save(uuid, text, text, text, text, boolean), public.admin_emergency_delete(uuid) from public, anon, authenticated;
grant execute on function public._kyc_owns(text, text), public.kyc_submit(text, text, text, text), public.admin_kyc_list(text), public.admin_kyc_set(text, text, text, text, text, text),
  public.admin_kyc_decide(text, text, boolean), public.rider_set_contacts(text, text, text, text), public.rider_sos(text, double precision, double precision),
  public.admin_sos_list(), public.admin_sos_set(uuid, text, text), public.admin_emergency_save(uuid, text, text, text, text, boolean), public.admin_emergency_delete(uuid) to authenticated;
