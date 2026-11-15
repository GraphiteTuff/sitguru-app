-- Service-role-only atomic contractor finance transitions; no ACH transfer is initiated.
-- Internal application actions authorize authenticated manager/admin before RPC calls.
begin;
create table if not exists public.staff_period_audit_events (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.staff_payment_periods(id) on delete restrict,
  action text not null,
  previous_status text,
  next_status text not null,
  actor_user_id uuid null,
  note text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists staff_period_audit_events_period_idx
  on public.staff_period_audit_events (period_id, created_at desc);
alter table public.staff_period_audit_events enable row level security;
revoke all on public.staff_period_audit_events from anon, authenticated;
grant select, insert on public.staff_period_audit_events to service_role;

create or replace function public.staff_time_submit_period(
  p_period_id uuid, p_actor_id uuid
) returns boolean language plpgsql security invoker set search_path = public as $$
declare
  v_period public.staff_payment_periods%rowtype;
  v_owner uuid;
  v_entries integer;
  v_hours numeric;
begin
  select * into v_period from public.staff_payment_periods
    where id = p_period_id for update;
  if not found or v_period.status not in ('draft','needs_correction') then
    raise exception 'This payment period is not available for submission';
  end if;
  select user_id into v_owner from public.staff_engagements
    where id = v_period.engagement_id and status = 'active';
  if v_owner is distinct from p_actor_id then
    raise exception 'Only the active contractor may submit their own period';
  end if;
  select count(*), coalesce(sum(hours),0) into v_entries,v_hours
    from public.staff_time_entries where payment_period_id=p_period_id;
  if v_entries=0 or v_hours<>v_period.total_hours or v_period.amount_cents<=0
    or exists (select 1 from public.staff_time_entries
       where payment_period_id=p_period_id
         and (worked_on not between v_period.period_start and v_period.period_end
           or (timer_started_at is not null and timer_stopped_at is null))) then
    raise exception 'Hours, rate or entries must be reconciled before submission';
  end if;

  update public.staff_time_entries set status='submitted', updated_at=now()
    where payment_period_id=p_period_id;
  update public.staff_payment_periods
    set status='submitted', submitted_at=now(), submitted_by=p_actor_id,
        correction_note='', needs_correction_at=null, updated_at=now()
    where id=p_period_id;
  insert into public.staff_period_audit_events(period_id,action,previous_status,next_status,actor_user_id)
    values (p_period_id,'manager_submitted',v_period.status,'submitted',p_actor_id);
  return true;
end;
$$;

create or replace function public.staff_time_approve_period(
  p_period_id uuid, p_actor_id uuid
) returns boolean language plpgsql security invoker set search_path = public as $$
declare
  v_period public.staff_payment_periods%rowtype;
  v_owner uuid;
  v_entries integer;
  v_hours numeric;
begin
  select * into v_period from public.staff_payment_periods
    where id=p_period_id for update;
  if not found or v_period.status<>'submitted' then
    raise exception 'Only submitted periods can be approved';
  end if;
  select user_id into v_owner from public.staff_engagements
    where id=v_period.engagement_id;
  if v_owner is null or p_actor_id is null or v_owner=p_actor_id then
    raise exception 'A separate authorized administrator must approve';
  end if;
  select count(*),coalesce(sum(hours),0) into v_entries,v_hours
    from public.staff_time_entries where payment_period_id=p_period_id;
  if v_entries=0 or v_hours<>v_period.total_hours or v_period.amount_cents<=0
    or exists (select 1 from public.staff_time_entries
      where payment_period_id=p_period_id and status<>'submitted') then
    raise exception 'Entries must all be submitted and reconciled before approval';
  end if;
  update public.staff_time_entries
    set status='locked',updated_at=now() where payment_period_id=p_period_id;
  update public.staff_payment_periods
    set status='ready_for_payment',approved_at=now(),approved_by=p_actor_id,
        ready_at=now(),updated_at=now()
    where id=p_period_id;
  insert into public.staff_period_audit_events(period_id,action,previous_status,next_status,actor_user_id)
    values (p_period_id,'admin_approved',v_period.status,'ready_for_payment',p_actor_id);
  return true;
end;
$$;

create or replace function public.staff_time_return_period(
  p_period_id uuid, p_actor_id uuid, p_note text
) returns boolean language plpgsql security invoker set search_path = public as $$
declare
  v_period public.staff_payment_periods%rowtype;
  v_owner uuid;
begin
  if length(trim(coalesce(p_note,'')))<4 then
    raise exception 'A specific correction reason is required';
  end if;
  select * into v_period from public.staff_payment_periods
    where id=p_period_id for update;
  if not found or v_period.status<>'submitted' then
    raise exception 'Only submitted periods can be returned';
  end if;
  select user_id into v_owner from public.staff_engagements
    where id=v_period.engagement_id;
  if v_owner is null or p_actor_id is null or v_owner=p_actor_id then
    raise exception 'A separate authorized administrator must request corrections';
  end if;
  update public.staff_time_entries
    set status='draft',updated_at=now() where payment_period_id=p_period_id;
  update public.staff_payment_periods
    set status='needs_correction',needs_correction_at=now(),
        correction_note=trim(p_note),updated_at=now()
    where id=p_period_id;
  insert into public.staff_period_audit_events(period_id,action,previous_status,next_status,actor_user_id,note)
    values (p_period_id,'admin_requested_correction',v_period.status,'needs_correction',p_actor_id,trim(p_note));
  return true;
end;
$$;

create or replace function public.staff_time_record_confirmed_ach(
  p_period_id uuid, p_actor_id uuid, p_paid_on date,
  p_reference text, p_amount_cents integer, p_rate_summary text, p_note text
) returns boolean language plpgsql security invoker set search_path = public as $$
declare
  v_period public.staff_payment_periods%rowtype;
  v_owner uuid;
begin
  if p_paid_on is null or p_paid_on>current_date
    or length(trim(coalesce(p_reference,'')))<4 then
    raise exception 'A confirmed bank date and ACH reference are required';
  end if;
  select * into v_period from public.staff_payment_periods
    where id=p_period_id for update;
  if not found or v_period.status not in ('approved','ready_for_payment','processing') then
    raise exception 'Only approved payable periods can be marked paid';
  end if;
  if p_amount_cents is null or p_amount_cents<=0 or p_amount_cents<>v_period.amount_cents then
    raise exception 'Recorded amount must equal the approved payable amount';
  end if;
  select user_id into v_owner from public.staff_engagements
    where id=v_period.engagement_id and employment_classification='contractor';
  if v_owner is null or p_actor_id is null or v_owner=p_actor_id then
    raise exception 'Only a separate authorized administrator can record settlement';
  end if;
  if exists(select 1 from public.staff_payment_records where payment_period_id=p_period_id) then
    raise exception 'Payment has already been recorded for this period';
  end if;
  insert into public.staff_payment_records(
    engagement_id,payment_period_id,approved_hours,amount_cents,currency,
    rate_summary,payment_method,provider,expense_category,initiated_on,paid_on,
    external_reference,recorded_by,notes,status,updated_at
  ) values(
    v_period.engagement_id,p_period_id,v_period.total_hours,v_period.amount_cents,
    v_period.currency,coalesce(p_rate_summary,''),'manual_bank_ach',
    'graff_enterprises_llc','Contract Labor',p_paid_on,p_paid_on,
    trim(p_reference),p_actor_id,coalesce(p_note,''),'paid',now()
  );
  update public.staff_payment_periods
    set status='paid',paid_at=now(),updated_at=now()
    where id=p_period_id;
  insert into public.staff_period_audit_events(period_id,action,previous_status,next_status,actor_user_id,note)
    values (p_period_id,'confirmed_bank_ach_recorded',v_period.status,'paid',
      p_actor_id,concat('ACH confirmation ',trim(p_reference)));
  return true;
end;
$$;

revoke all on function public.staff_time_submit_period(uuid,uuid) from public,anon,authenticated;
revoke all on function public.staff_time_approve_period(uuid,uuid) from public,anon,authenticated;
revoke all on function public.staff_time_return_period(uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.staff_time_record_confirmed_ach(uuid,uuid,date,text,integer,text,text) from public,anon,authenticated;
grant execute on function public.staff_time_submit_period(uuid,uuid) to service_role;
grant execute on function public.staff_time_approve_period(uuid,uuid) to service_role;
grant execute on function public.staff_time_return_period(uuid,uuid,text) to service_role;
grant execute on function public.staff_time_record_confirmed_ach(uuid,uuid,date,text,integer,text,text) to service_role;
commit;