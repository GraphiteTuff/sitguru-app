-- Atomic reconciliation of external contractor ACH payments.
-- Approval does not initiate bank payment. This function only records a
-- transfer already confirmed in Navy Federal or another financial institution.
begin;

create or replace function public.record_staff_contract_payment(
  p_period_id uuid,
  p_actor_id uuid,
  p_amount_cents integer,
  p_paid_on date,
  p_method text,
  p_reference text,
  p_notes text,
  p_total_hours numeric,
  p_rate_summary text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_period public.staff_payment_periods%rowtype;
  v_engagement public.staff_engagements%rowtype;
begin
  if p_actor_id is null or p_amount_cents is null or p_amount_cents <= 0
     or p_paid_on is null or length(trim(coalesce(p_reference, ''))) < 4
     or p_method <> 'manual_bank_ach' then
    raise exception 'Valid actor, amount, confirmed payment date, method and bank reference are required';
  end if;

  select * into v_period
    from public.staff_payment_periods
   where id = p_period_id
   for update;
  if not found or v_period.status not in ('ready_for_payment', 'approved', 'processing') then
    raise exception 'Period is not ready for bank reconciliation';
  end if;

  select * into v_engagement
    from public.staff_engagements
   where id = v_period.engagement_id;
  if not found or v_engagement.employment_classification <> 'contractor' then
    raise exception 'Valid contractor engagement is required';
  end if;

  if exists (select 1 from public.staff_payment_records where payment_period_id = p_period_id) then
    raise exception 'This payment period already has a recorded payment';
  end if;

  insert into public.staff_payment_records (
    engagement_id, payment_period_id, approved_hours, amount_cents,
    currency, rate_summary, payment_method, provider, expense_category,
    initiated_on, paid_on, external_reference, recorded_by, notes, status, updated_at
  ) values (
    v_period.engagement_id, p_period_id, p_total_hours, p_amount_cents,
    v_engagement.currency, coalesce(p_rate_summary, ''),
    'manual_bank_ach', 'graff_enterprises_llc', 'Contract Labor',
    p_paid_on, p_paid_on, trim(p_reference), p_actor_id, coalesce(p_notes, ''),
    'paid', now()
  );

  update public.staff_payment_periods
     set status = 'paid', paid_at = now(),
         amount_cents = p_amount_cents, total_hours = p_total_hours,
         updated_at = now()
   where id = p_period_id;
  return true;
end;
$$;

revoke all on function public.record_staff_contract_payment(
  uuid, uuid, integer, date, text, text, text, numeric, text
) from public, anon, authenticated;
grant execute on function public.record_staff_contract_payment(
  uuid, uuid, integer, date, text, text, text, numeric, text
) to service_role;

commit;
