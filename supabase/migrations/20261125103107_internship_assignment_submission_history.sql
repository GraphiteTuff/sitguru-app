-- Snapshot the student's own written work in the same transaction as submission.
-- The assignment stays the workflow record. Reviewers read snapshots without rewriting them.
begin;

create table public.internship_assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.internship_tasks(id) on delete cascade,
  intern_id uuid not null references public.internship_interns(id) on delete cascade,
  submitted_at timestamptz not null,
  notes text not null,
  work_url text not null,
  work_snapshot jsonb not null default '{}'::jsonb,
  unique (task_id, submitted_at)
);

create index internship_assignment_submissions_intern_idx
  on public.internship_assignment_submissions (intern_id, submitted_at desc);

alter table public.internship_assignment_submissions enable row level security;
revoke all on public.internship_assignment_submissions from public, anon, authenticated, service_role;
grant select, insert on public.internship_assignment_submissions to service_role;

create function public.capture_internship_assignment_submission()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status <> 'submitted' or new.submitted_at is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and new.submitted_at is not distinct from old.submitted_at then
    return new;
  end if;

  insert into public.internship_assignment_submissions
    (task_id, intern_id, submitted_at, notes, work_url, work_snapshot)
  values (
    new.id, new.intern_id, new.submitted_at, coalesce(new.student_notes, ''), coalesce(new.work_url, ''),
    case when jsonb_typeof(new.brief_payload -> 'internWork') = 'object'
      then new.brief_payload -> 'internWork' else '{}'::jsonb end
  ) on conflict (task_id, submitted_at) do nothing;
  return new;
end
$$;

revoke all on function public.capture_internship_assignment_submission() from public, anon, authenticated;

create trigger capture_internship_assignment_submission
after insert or update of submitted_at, status on public.internship_tasks
for each row execute function public.capture_internship_assignment_submission();

commit;
