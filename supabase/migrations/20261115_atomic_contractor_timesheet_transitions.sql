-- Transaction-safe status transitions for manager contractor timesheets.
-- Service role only; authentication, authorizations and notifications happen in
-- the Next.js server actions. Database verifies ownership and prevents self-approval.
begin;

create or replace function public.submit_staff_payment_period(
  p_period_id uuid, p_engagement_id uuid, p_actor_id uuid
)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_period public.staff_payment_periods%rowtype;
declare v_owner uuid;
begin
  select * into v_period from public.staff_payment_periods
    where id = p_period_id and engagement_id = p_engagement_id for update;
  if not found or v_period.status not in ('draft','needs_correction') then
    raise exception 'Period is not eligible for submission';
  end if;
  select user_id into v_owner from public.staff_engagements
   where id = p_engagement_id;
  if v_owner is distinct from p_actor_id then
    raise exception 'Only the contractor can submit this period';
  end if;
  if not exists (select 1 from public.staff_time_entries
    where payment_period_id = p_period_id and engagement_id = p_engagement_id)
    or exists (select 1 from public.staff_time_entries
    where payment_period_id = p_period_id and timer_started_at is not null
      and timer_stopped_at is null)
    or v_period.total_hours <= 0 then
    raise exception 'Submitted period must contain completed time';
  end if;
  update public.staff_time_entries
    set status = 'submitted', updated_at = now()
    where payment_period_id = p_period_id and engagement_id = p_engagement_id;
  update public.staff_payment_periods
    set status = 'submitted', submitted_at = now(), submitted_by = p_actor_id,
        needs_correction_at = null, correction_note = '', updated_at = now()
    where id = p_period_id;
  return true;
end;
$$;

create or replace function public.approve_staff_payment_period(
  p_period_id uuid, p_actor_id uuid
)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_period public.staff_payment_periods%rowtype;
declare v_owner uuid;
begin
  select * into v_period from public.staff_payment_periods
    where id = p_period_id for update;
  if not found or v_period.status <> 'submitted' then
    raise exception 'Only submitted payment periods can be approved';
  end if;
  select user_id into v_owner from public.staff_engagements
    where id = v_period.engagement_id;
  if v_owner = p_actor_id then
    raise exception 'Contractors cannot approve their own period';
  end if;
  update public.staff_time_entries set status='locked', updated_at=now()
    where payment_period_id = p_period_id;
  update public.staff_payment_periods
    set status='ready_for_payment', approved_at=now(), approved_by=p_actor_id,
        ready_at=now(), updated_at=now()
    where id = p_period_id;
  return true;
end;
$$;

create or replace function public.return_staff_payment_period(
  p_period_id uuid, p_actor_id uuid, p_note text
)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_period public.staff_payment_periods%rowtype;
declare v_owner uuid;
begin
  if length(trim(coalesce(p_note,''))) < 4 then
    raise exception 'An actionable correction note is required';
  end if;
  select * into v_period from public.staff_payment_periods
    where id = p_period_id for update;
  if not found or v_period.status <> 'submitted' then
    raise exception 'Only submitted periods can be returned';
  end if;
  select user_id into v_owner from public.staff_engagements
    where id = v_period.engagement_id;
  if v_owner = p_actor_id then
    raise exception 'Contractors cannot return their own period';
  end if;
  update public.staff_time_entries set status='draft', updated_at=now()
    where payment_period_id=p_period_id;
  update public.staff_payment_periods
    set status='needs_correction', needs_correction_at=now(),
        correction_note=trim(p_note), updated_at=now()
    where id=p_period_id;
  return true;
end;
$$;

revoke all on function public.submit_staff_payment_period(uuid,uuid,uuid) from public, anon, authenticated;
revoke all on function public.approve_staff_payment_period(uuid,uuid) from public, anon, authenticated;
revoke all on function public.return_staff_payment_period(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.submit_staff_payment_period(uuid,uuid,uuid) to service_role;
grant execute on function public.approve_staff_payment_period(uuid,uuid) to service_role;
grant execute on function public.return_staff_payment_period(uuid,uuid,text) to service_role;

commit;
