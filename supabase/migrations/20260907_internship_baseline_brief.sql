-- Baseline & Growth Brief: structured payload, categorized attachments,
-- official baseline lock, and a safe backfill of the semester deliverable.
-- Additive only. Service-role access matches existing internship tables.

begin;

alter table public.internship_tasks
  add column if not exists brief_payload jsonb not null default '{}'::jsonb;

alter table public.internship_work_attachments
  add column if not exists category text not null default '';

alter table public.internship_interns
  add column if not exists baseline_locked_at timestamptz null,
  add column if not exists baseline_lock_reason text not null default '';

alter table public.internship_metrics
  add column if not exists intern_reported_value text not null default '',
  add column if not exists verified_value text not null default '',
  add column if not exists unit text not null default '',
  add column if not exists source_url text not null default '',
  add column if not exists captured_on date null,
  add column if not exists intern_notes text not null default '',
  add column if not exists kpi_tier text not null default '',
  add column if not exists verification_status text not null default 'draft',
  add column if not exists original_value text not null default '',
  add column if not exists correction_reason text not null default '';

create table if not exists public.internship_baseline_brief_audit (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.internship_interns(id) on delete cascade,
  task_id uuid null references public.internship_tasks(id) on delete set null,
  action text not null default '',
  field text not null default '',
  original_value text not null default '',
  new_value text not null default '',
  reason text not null default '',
  changed_by uuid null,
  changed_at timestamptz not null default now()
);

alter table public.internship_baseline_brief_audit enable row level security;
revoke all on table public.internship_baseline_brief_audit from anon, authenticated;

insert into public.internship_tasks (
  intern_id, title, status, business_objective, metric_affected, student_notes, final_section, week_number
)
select
  i.id,
  'Baseline & Growth Brief',
  'todo',
  'Official starting point for the Final Business Growth Report',
  'SitGuru Market Growth Project',
  'Weeks 1–2 · Required semester deliverable · Supervisor approval required',
  'growth_strategy',
  2
from public.internship_interns i
where not exists (
  select 1
  from public.internship_tasks t
  where t.intern_id = i.id
    and (
      lower(t.title) like '%baseline & growth brief%'
      or lower(t.title) like '%baseline and growth brief%'
    )
);

commit;
