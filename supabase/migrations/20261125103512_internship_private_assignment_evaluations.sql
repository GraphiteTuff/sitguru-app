begin;

create schema if not exists internship_security;
revoke all on schema internship_security from public, anon, authenticated;
grant usage on schema internship_security to authenticated;

-- Browser clients cannot read internship_interns. This helper answers only
-- whether the current authenticated caller owns the linked record.
create function internship_security.owns_active_internship(internship_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.internship_interns
    where id = internship_id
      and user_id = (select auth.uid())
      and portal_enabled
      and status in ('accepted', 'active', 'approved', 'completed')
  );
$$;

revoke all on function internship_security.owns_active_internship(uuid) from public, anon, authenticated;
grant execute on function internship_security.owns_active_internship(uuid) to authenticated;

create unique index if not exists internship_tasks_id_intern_id_idx
  on public.internship_tasks(id, intern_id);

create table public.internship_assignment_evaluations (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null,
  intern_id uuid not null,
  evaluator_id uuid not null,
  scores integer[] not null,
  maximums integer[] not null,
  total integer generated always as (scores[1] + scores[2] + scores[3] + scores[4]) stored,
  total_possible integer generated always as (maximums[1] + maximums[2] + maximums[3] + maximums[4]) stored,
  feedback text not null default '' check (char_length(feedback) <= 4000),
  private_notes text not null default '' check (char_length(private_notes) <= 4000),
  evaluated_submission_at timestamptz,
  created_at timestamptz not null default now(),
  released_at timestamptz,
  foreign key (task_id, intern_id) references public.internship_tasks(id, intern_id) on delete cascade,
  check (scores = array[scores[1], scores[2], scores[3], scores[4]]
    and maximums = array[maximums[1], maximums[2], maximums[3], maximums[4]]
    and array_position(scores, null) is null and array_position(maximums, null) is null),
  check (scores[1] between 0 and maximums[1] and maximums[1] between 1 and 1000
    and scores[2] between 0 and maximums[2] and maximums[2] between 1 and 1000
    and scores[3] between 0 and maximums[3] and maximums[3] between 1 and 1000
    and scores[4] between 0 and maximums[4] and maximums[4] between 1 and 1000)
);

create index internship_assignment_evaluations_intern_idx
  on public.internship_assignment_evaluations(intern_id, task_id, created_at desc);

alter table public.internship_assignment_evaluations enable row level security;
revoke all on public.internship_assignment_evaluations from public, anon, authenticated, service_role;
grant select, insert on public.internship_assignment_evaluations to service_role;
grant select (id, task_id, intern_id, scores, maximums, total, total_possible, feedback, evaluated_submission_at, created_at, released_at)
  on public.internship_assignment_evaluations to authenticated;

create policy internship_assignment_evaluation_intern_release
  on public.internship_assignment_evaluations for select to authenticated
  using (released_at is not null and internship_security.owns_active_internship(intern_id));

commit;
