begin;

-- Academic semester state is separate from cohort planning and operational work.
create table public.internship_program_controls (
  cohort_id uuid primary key references public.internship_cohorts(id) on delete restrict,
  status text not null default 'pre_launch' check (status in ('pre_launch', 'active', 'paused', 'completed')),
  activated_at timestamptz,
  activated_by uuid,
  revision integer not null default 0 check (revision >= 0),
  constraint internship_program_activation_consistency check (
    (status = 'pre_launch' and activated_at is null and activated_by is null) or
    (status <> 'pre_launch' and activated_at is not null and activated_by is not null)
  )
);

create table public.internship_program_control_events (
  cohort_id uuid not null references public.internship_program_controls(cohort_id) on delete restrict,
  revision integer not null,
  from_status text not null,
  to_status text not null,
  actor_id uuid not null,
  actor_role text not null check (actor_role in ('supervisor', 'manager')),
  occurred_at timestamptz not null default now(),
  primary key (cohort_id, revision)
);

alter table public.internship_program_controls enable row level security;
alter table public.internship_program_control_events enable row level security;
revoke all on public.internship_program_controls, public.internship_program_control_events from public, anon, authenticated, service_role;
grant select on public.internship_program_controls, public.internship_program_control_events to service_role;

insert into public.internship_program_controls (cohort_id)
select id from public.internship_cohorts where lower(season) = 'spring' and year = 2027
on conflict do nothing;

-- Called only by the authenticated server action. The invoker is checked before
-- trusting the server-resolved actor ID and role. Cohort ownership is checked
-- again inside the transaction, so reassignment and concurrent changes are safe.
create schema if not exists internship_private;
revoke all on schema internship_private from public, anon, authenticated;
grant usage on schema internship_private to service_role;

create function internship_private.transition_internship_program(
  p_cohort_id uuid, p_actor_id uuid, p_actor_role text, p_revision integer, p_action text
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  cohort public.internship_cohorts%rowtype;
  state public.internship_program_controls%rowtype;
  next_status text;
begin
  if current_setting('role', true) <> 'service_role' or
    p_actor_id is null or p_actor_role is null or p_actor_role not in ('supervisor', 'manager') then
    raise exception 'Program controls access required' using errcode = '42501';
  end if;

  select * into cohort from public.internship_cohorts where id = p_cohort_id for share;
  if not found or (p_actor_role = 'manager' and cohort.default_manager_user_id is distinct from p_actor_id) then
    raise exception 'Program controls access required' using errcode = '42501';
  end if;

  insert into public.internship_program_controls (cohort_id) values (p_cohort_id) on conflict do nothing;
  select * into state from public.internship_program_controls where cohort_id = p_cohort_id for update;
  if state.revision is distinct from p_revision then return false; end if;

  next_status := case
    when p_action = 'activate' and state.status = 'pre_launch' then 'active'
    when p_action = 'pause' and state.status = 'active' then 'paused'
    when p_action = 'resume' and state.status = 'paused' then 'active'
    when p_action = 'complete' and state.status in ('active', 'paused') then 'completed'
  end;
  if next_status is null then return false; end if;

  if p_action = 'activate' and (
    cohort.starts_on is null or cohort.ends_on is null or cohort.ends_on < cohort.starts_on
    or cohort.default_manager_user_id is null or cohort.default_supervisor_user_id is null
    or not exists (select from public.internship_interns i where i.cohort_id = p_cohort_id
      and i.portal_enabled and i.status in ('accepted', 'active', 'approved'))
  ) then return false; end if;

  update public.internship_program_controls
  set status = next_status,
      revision = state.revision + 1,
      activated_at = coalesce(state.activated_at, transaction_timestamp()),
      activated_by = coalesce(state.activated_by, p_actor_id)
  where cohort_id = p_cohort_id;

  insert into public.internship_program_control_events
    (cohort_id, revision, from_status, to_status, actor_id, actor_role)
  values (p_cohort_id, state.revision + 1, state.status, next_status, p_actor_id, p_actor_role);

  return true;
end;
$$;

revoke all on function internship_private.transition_internship_program(uuid, uuid, text, integer, text) from public, anon, authenticated;
grant execute on function internship_private.transition_internship_program(uuid, uuid, text, integer, text) to service_role;

create function public.transition_internship_program(
  p_cohort_id uuid, p_actor_id uuid, p_actor_role text, p_revision integer, p_action text
) returns boolean
language sql
security invoker
set search_path = ''
as $$
  select internship_private.transition_internship_program(p_cohort_id, p_actor_id, p_actor_role, p_revision, p_action);
$$;

revoke all on function public.transition_internship_program(uuid, uuid, text, integer, text) from public, anon, authenticated;
grant execute on function public.transition_internship_program(uuid, uuid, text, integer, text) to service_role;

-- A shared lock serializes official grade releases with pause and completion.
create function internship_private.require_active_internship_for_evaluation() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1 from public.internship_program_controls p
    join public.internship_interns i on i.cohort_id = p.cohort_id
    where i.id = new.intern_id and p.status = 'active'
    for share of p, i;
  if not found then
    raise exception 'The internship semester must be active' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function internship_private.require_active_internship_for_evaluation() from public, anon, authenticated;
grant execute on function internship_private.require_active_internship_for_evaluation() to service_role;

create trigger internship_assignment_evaluation_semester_release
before insert or update of released_at on public.internship_assignment_evaluations
for each row when (new.released_at is not null)
execute function internship_private.require_active_internship_for_evaluation();

create trigger internship_program_evaluation_semester_release
before insert or update of status on public.internship_evaluations
for each row when (new.status = 'released' and new.kind in ('midpoint', 'final'))
execute function internship_private.require_active_internship_for_evaluation();

commit;
