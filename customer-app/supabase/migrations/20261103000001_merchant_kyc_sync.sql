/*
 * Merchant KYC and application status were two separate switches.
 * Admin > KYC > "Accept merchant" only set merchants.active, so a business could be live to customers while the merchant
 * still saw "Submitted" and merchants.verified stayed false. Now there is one lifecycle: accepting or declining a merchant in
 * KYC drives the same application status the merchant sees, with the same rules as Admin > Merchant applications.
 */
drop function if exists public.admin_kyc_decide(text, text, boolean);
create or replace function public.admin_kyc_decide(p_kind text, p_subject text, p_approve boolean, p_note text default '') returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare a public.merchant_applications; note text := left(btrim(coalesce(p_note, '')), 500); ns text; d text;
begin
  perform public._need_admin();
  if p_kind = 'rider' then
    update public.riders set verified = p_approve where user_id::text = p_subject;
    if not found then raise exception 'Not found.'; end if;
  elsif p_kind = 'merchant' then
    if not exists (select 1 from public.merchants where id = p_subject) then raise exception 'Not found.'; end if;
    select * into a from public.merchant_applications where merchant_id = p_subject for update;
    if not found then
      update public.merchants set active = p_approve, verified = p_approve where id = p_subject;   -- older store with no application record
    else
      if a.status in ('DRAFT', 'EMAIL_VERIFICATION_PENDING') then raise exception 'This business has not submitted its application yet.'; end if;
      if p_approve then
        if a.status = 'APPROVED' then return; end if;
        if a.status not in ('SUBMITTED', 'UNDER_REVIEW', 'SUSPENDED') then raise exception 'This application is % and must be reopened first (Admin, Merchant applications).', lower(a.status); end if;
        if a.status <> 'SUSPENDED' then
          foreach d in array public._required_docs(a.business_type, a.data->'business'->>'cac_status') loop
            if not exists (select 1 from public.kyc_docs k where k.subject_kind = 'merchant' and k.subject_id = a.merchant_id and k.doc_type = d and k.status = 'approved') then
              raise exception 'Approve the % document first.', d;
            end if;
          end loop;
        end if;
        ns := 'APPROVED';
      else
        if a.status in ('REJECTED', 'SUSPENDED') then return; end if;
        if char_length(note) < 5 then raise exception 'Give the reason. The merchant will see it.'; end if;
        ns := case when a.status = 'APPROVED' then 'SUSPENDED' else 'REJECTED' end;
      end if;
      update public.merchant_applications set reviewed_by = auth.uid(), reviewed_at = now() where id = a.id;
      perform public._app_set_status(a.id, ns, case when ns = 'APPROVED' then '' else note end);
      if ns = 'APPROVED' then
        update public.merchants set active = true, verified = true where id = a.merchant_id;
        update public.profiles set role = 'merchant' where role = 'customer' and id in (select user_id from public.merchant_members where merchant_id = a.merchant_id and status = 'active');
      else
        update public.merchants set active = false, open = false where id = a.merchant_id;
      end if;
    end if;
  else raise exception 'Kind must be rider or merchant.'; end if;
  perform public.log_audit(case when p_approve then 'kyc_accept' else 'kyc_decline' end, jsonb_build_object('kind', p_kind, 'subject', p_subject, 'note', note));
end $$;
revoke all on function public.admin_kyc_decide(text, text, boolean, text) from public, anon;
grant execute on function public.admin_kyc_decide(text, text, boolean, text) to authenticated;

/* The KYC list also reports the real application status and verified flag, so Admin shows what the merchant sees. */
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
      select jsonb_build_object('id', m.id, 'name', m.name, 'vertical', m.vertical, 'active', m.active, 'verified', m.verified, 'app_status', m.application_status,
        'docs', coalesce((select jsonb_agg(jsonb_build_object('doc', d.doc_type, 'status', d.status, 'file', d.file_path, 'note', d.note, 'by_admin', d.submitted_by_admin, 'at', d.updated_at)) from public.kyc_docs d where d.subject_kind = 'merchant' and d.subject_id = m.id), '[]'::jsonb)) x
      from public.merchants m) s), '[]'::jsonb);
  end if;
  raise exception 'Kind must be rider or merchant.';
end $$;

/* One-time repair of businesses the old switch left half-done. Live but unapproved: approve if every required document is approved, otherwise take them offline. */
do $$
declare r record; miss boolean;
begin
  for r in select a.id aid, a.merchant_id mid, a.business_type bt, a.data dat from public.merchant_applications a join public.merchants m on m.id = a.merchant_id
           where a.status in ('SUBMITTED', 'UNDER_REVIEW') and m.active loop
    select exists (select 1 from unnest(public._required_docs(r.bt, r.dat->'business'->>'cac_status')) d
                   where not exists (select 1 from public.kyc_docs k where k.subject_kind = 'merchant' and k.subject_id = r.mid and k.doc_type = d and k.status = 'approved')) into miss;
    if not miss then
      perform public._app_set_status(r.aid, 'APPROVED', '');
      update public.merchants set active = true, verified = true where id = r.mid;
      update public.profiles set role = 'merchant' where role = 'customer' and id in (select user_id from public.merchant_members where merchant_id = r.mid and status = 'active');
    else
      update public.merchants set active = false, open = false where id = r.mid;
    end if;
  end loop;
end $$;
