-- Employer letter grades, intern submission timestamps, and instructor-style comments.
-- Letters evaluate SitGuru KPI/output versus SMART targets. They are not university course grades.

begin;

alter table public.internship_tasks
  add column if not exists submitted_at timestamptz,
  add column if not exists employer_letter text not null default '',
  add column if not exists kpi_tier text not null default '',
  add column if not exists output_vs_target numeric null;

alter table public.internship_content
  add column if not exists submitted_at timestamptz,
  add column if not exists supervisor_notes text not null default '',
  add column if not exists employer_letter text not null default '',
  add column if not exists kpi_tier text not null default '',
  add column if not exists output_vs_target numeric null,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid;

create table if not exists public.internship_work_comments (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.internship_interns(id) on delete cascade,
  item_type text not null,
  item_id uuid not null,
  author_role text not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.internship_work_comments enable row level security;
revoke all on table public.internship_work_comments from anon, authenticated;

commit;
