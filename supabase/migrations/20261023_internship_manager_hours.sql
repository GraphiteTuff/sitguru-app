-- Additive internship manager, hours, review history, and week-0 checklist.
-- Service-role only, matching the existing internship tables.
-- Does not drop or rewrite approved time rows.

begin;

alter table public.internship_interns
  add column if not exists planned_weekly_hours numeric,
  add column if not exists internship_weeks integer,
  add column if not exists requirement_status text not null default 'pending',
  add column if not exists university_verification_status text not null default 'pending',
  add column if not exists hours_verified_by uuid,
  add column if not exists hours_verification_date date,
  add column if not exists manager_user_id uuid,
  add column if not exists supervisor_user_id uuid,
  add column if not exists day_to_day_manager_name text not null default '',
  add column if not exists site_supervisor_name text not null default '',
  add column if not exists university_notes text not null default '',
  add column if not exists academic_year text not null default '',
  add column if not exists week_zero_approved_at timestamptz;

alter table public.internship_tasks
  add column if not exists review_stage text not null default '';

alter table public.internship_content
  add column if not exists review_stage text not null default '';

alter table public.internship_weekly_reviews
  add column if not exists what_worked text not null default '',
  add column if not exists learning text not null default '',
  add column if not exists blockers text not null default '',
  add column if not exists review_status text not null default '',
  add column if not exists submitted_at timestamptz;

create table if not exists public.internship_time_logs (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.internship_interns(id) on delete cascade,
  worked_on date not null,
  hours numeric not null,
  activity text not null default '',
  work_item_type text not null default '',
  work_item_id text not null default '',
  week_number integer,
  notes text not null default '',
  evidence_url text not null default '',
  status text not null default 'draft',
  submitted_at timestamptz,
  manager_reviewed_at timestamptz,
  manager_reviewed_by uuid,
  supervisor_reviewed_at timestamptz,
  supervisor_reviewed_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint internship_time_logs_hours_check check (hours > 0 and hours <= 14)
);

create index if not exists internship_time_logs_intern_idx
  on public.internship_time_logs (intern_id, worked_on desc);

create table if not exists public.internship_review_events (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.internship_interns(id) on delete cascade,
  target_type text not null,
  target_id text not null,
  reviewer_id uuid,
  reviewer_role text not null default '',
  review_stage text not null default '',
  status text not null default '',
  comment text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists internship_review_events_target_idx
  on public.internship_review_events (target_type, target_id, created_at);

create table if not exists public.internship_questions (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.internship_interns(id) on delete cascade,
  target_type text not null default '',
  target_id text not null default '',
  target_title text not null default '',
  question text not null,
  urgency text not null default 'normal',
  status text not null default 'open',
  answer text not null default '',
  asked_by_role text not null default 'intern',
  asked_at timestamptz not null default now(),
  answered_at timestamptz,
  answered_by uuid
);

create index if not exists internship_questions_intern_idx
  on public.internship_questions (intern_id, status, asked_at desc);

create table if not exists public.internship_start_checks (
  intern_id uuid not null references public.internship_interns(id) on delete cascade,
  item_key text not null,
  completed_at timestamptz not null default now(),
  primary key (intern_id, item_key)
);

create table if not exists public.internship_schedule_exceptions (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.internship_interns(id) on delete cascade,
  week_number integer not null,
  planned_hours numeric not null default 0,
  reason text not null default '',
  created_at timestamptz not null default now(),
  unique (intern_id, week_number)
);

create table if not exists public.internship_requirement_audits (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.internship_interns(id) on delete cascade,
  actor_id uuid,
  field_name text not null,
  previous_value text not null default '',
  next_value text not null default '',
  reason text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.internship_report_revisions (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.internship_interns(id) on delete cascade,
  source_type text not null,
  source_id text not null,
  section_id text not null default '',
  body text not null default '',
  status text not null default 'draft',
  version integer not null default 1,
  reason text not null default '',
  reviewer_id uuid,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists internship_report_revisions_source_idx
  on public.internship_report_revisions (source_type, source_id, version);

alter table public.internship_time_logs enable row level security;
alter table public.internship_review_events enable row level security;
alter table public.internship_questions enable row level security;
alter table public.internship_start_checks enable row level security;
alter table public.internship_schedule_exceptions enable row level security;
alter table public.internship_requirement_audits enable row level security;
alter table public.internship_report_revisions enable row level security;

revoke all on table public.internship_time_logs from anon, authenticated;
revoke all on table public.internship_review_events from anon, authenticated;
revoke all on table public.internship_questions from anon, authenticated;
revoke all on table public.internship_start_checks from anon, authenticated;
revoke all on table public.internship_schedule_exceptions from anon, authenticated;
revoke all on table public.internship_requirement_audits from anon, authenticated;
revoke all on table public.internship_report_revisions from anon, authenticated;

insert into public.internship_requirement_audits (intern_id, field_name, previous_value, next_value, reason)
select id, 'required_hours', coalesce(required_hours::text, ''), '150',
  'Penn State Spring 2027 assignment confirmed at 3 credits and 150 hours.'
from public.internship_interns
where lower(full_name) like '%ryan%manibo%'
  and coalesce(required_hours, 0) is distinct from 150;

update public.internship_interns
set credits = coalesce(credits, 3),
    required_hours = 150,
    planned_weekly_hours = coalesce(planned_weekly_hours, 10),
    internship_weeks = coalesce(internship_weeks, 15),
    requirement_status = 'confirmed',
    university_verification_status = case
      when university_verification_status = 'pending' then 'confirmed'
      else university_verification_status
    end,
    semester = case when coalesce(semester, '') = '' then 'Spring 2027' else semester end,
    academic_year = case when coalesce(academic_year, '') = '' then '2026-2027' else academic_year end,
    day_to_day_manager_name = case
      when coalesce(day_to_day_manager_name, '') = '' then 'Ava'
      else day_to_day_manager_name
    end,
    site_supervisor_name = case
      when coalesce(site_supervisor_name, '') = '' then 'Jason'
      else site_supervisor_name
    end
where lower(full_name) like '%ryan%manibo%';

update public.internship_interns
set requirement_status = 'pending',
    university_verification_status = case
      when university_verification_status = '' then 'pending'
      else university_verification_status
    end,
    day_to_day_manager_name = case
      when coalesce(day_to_day_manager_name, '') = '' then 'Ava'
      else day_to_day_manager_name
    end,
    site_supervisor_name = case
      when coalesce(site_supervisor_name, '') = '' then 'Jason'
      else site_supervisor_name
    end
where lower(full_name) like '%lola%uhl%'
  and requirement_status is distinct from 'confirmed'
  and requirement_status is distinct from 'amended';

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'admin_marketing_content_calendar'
  ) then
    execute 'alter table public.admin_marketing_content_calendar add column if not exists approved_by_email text';
    execute 'alter table public.admin_marketing_content_calendar add column if not exists approved_at timestamptz';
    execute $sql$
      update public.admin_marketing_content_calendar
      set status = 'Submitted to Ava'
      where status = 'Needs CEO Review'
    $sql$;
  end if;
end $$;

commit;
