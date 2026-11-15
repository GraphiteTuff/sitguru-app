-- Move Ava's active contractor engagement to weekly periods without editing
-- historical submitted/approved/paid records. Run in a reviewed migration window.
-- Existing 2026-11-15..2026-11-28 draft is split if it exists.
begin;

do $$
declare
  target_engagement uuid;
  current_draft uuid;
  next_draft uuid;
begin
  select id into target_engagement
  from public.staff_engagements
  where user_id = '023ef25a-44a5-4732-a96e-e67430ee8798'::uuid
    and employment_classification = 'contractor'
    and status = 'active'
  for update;

  if target_engagement is null then
    raise notice 'Ava contractor engagement not found; cadence unchanged';
    return;
  end if;

  -- This migration deliberately refuses to restructure any submitted or
  -- completed 11/15+ pay period; reconcile those periods manually instead.
  if exists (
    select 1 from public.staff_payment_periods
    where engagement_id = target_engagement
      and period_end >= date '2026-11-15'
      and status <> 'draft'
  ) then
    raise exception 'Ava has a non-draft 2026-11-15+ pay period. Reconcile before changing cadence.';
  end if;

  if exists (
    select 1 from public.staff_payment_periods
    where engagement_id = target_engagement
      and period_end >= date '2026-11-15'
      and (period_start <> date '2026-11-15' or period_end <> date '2026-11-28')
      and (period_start <> date '2026-11-15' or period_end <> date '2026-11-21')
      and (period_start <> date '2026-11-22' or period_end <> date '2026-11-28')
  ) then
    raise exception 'Ava has an unexpected future pay-period range. Review manually.';
  end if;

  select id into current_draft
  from public.staff_payment_periods
  where engagement_id = target_engagement
    and period_start = date '2026-11-15'
    and period_end = date '2026-11-28'
    and status = 'draft'
  for update;

  if current_draft is not null then
    update public.staff_payment_periods
       set period_end = date '2026-11-21',
           total_hours = 0,
           amount_cents = 0,
           updated_at = now()
     where id = current_draft;

    insert into public.staff_payment_periods
      (engagement_id, period_start, period_end, status, currency)
    values (target_engagement, date '2026-11-22', date '2026-11-28', 'draft', 'USD')
    on conflict (engagement_id, period_start, period_end) do nothing;

    select id into next_draft from public.staff_payment_periods
    where engagement_id = target_engagement
      and period_start = date '2026-11-22'
      and period_end = date '2026-11-28';

    update public.staff_time_entries
       set payment_period_id = next_draft, updated_at = now()
     where payment_period_id = current_draft
       and worked_on >= date '2026-11-22';

    if exists (select 1 from public.staff_time_entries where payment_period_id = current_draft and worked_on > date '2026-11-21') then
      raise exception 'Ava has entries outside the first weekly period; migration canceled.';
    end if;
  end if;

  update public.staff_engagements
     set payment_cadence = 'weekly',
         period_anchor_on = date '2026-11-15',
         updated_at = now()
   where id = target_engagement;
end $$;

commit;
