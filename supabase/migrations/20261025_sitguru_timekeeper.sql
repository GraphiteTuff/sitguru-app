-- Shared SitGuru Timekeeper. Service-role only.
-- Copies existing internship time logs once. Does not delete them.

begin;

create table if not exists public.timekeeper_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  audience text not null default 'both',
  is_active boolean not null default true,
  sort_order integer not null default 100
);

insert into public.timekeeper_categories (slug, name, audience, sort_order) values
  ('growth-strategy', 'Growth Strategy', 'contractor', 10),
  ('social-content', 'Social & Content', 'contractor', 20),
  ('community-events-contractor', 'Community / Events', 'contractor', 30),
  ('ambassador-contractor', 'Ambassador Program', 'contractor', 40),
  ('market-research', 'Market Research / Surveys', 'contractor', 50),
  ('analytics-reporting', 'Analytics & Reporting', 'contractor', 60),
  ('partnerships-contractor', 'Partnerships / Outreach', 'contractor', 70),
  ('intern-leadership', 'Intern Leadership', 'contractor', 80),
  ('meetings-contractor', 'Meetings', 'contractor', 90),
  ('administrative', 'Administrative', 'contractor', 100),
  ('other-contractor', 'Other Approved Work', 'contractor', 110),
  ('audience-research', 'Market / Audience Research', 'intern', 210),
  ('content-social', 'Content & Social', 'intern', 220),
  ('campaigns', 'Campaigns', 'intern', 230),
  ('analytics', 'Analytics', 'intern', 240),
  ('community-events', 'Community / Events', 'intern', 250),
  ('partnerships', 'Partnerships', 'intern', 260),
  ('ambassador', 'Ambassador Program', 'intern', 270),
  ('meetings-training', 'Meetings / Training', 'intern', 280),
  ('final-project', 'Final Project', 'intern', 290),
  ('other-internship', 'Other Approved Internship Work', 'intern', 300)
on conflict (slug) do update set name = excluded.name, is_active = true;

create table if not exists public.timekeeper_entries (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid,
  intern_id uuid references public.internship_interns(id) on delete cascade,
  subject_kind text not null default 'intern',
  entry_mode text not null default 'manual',
  worked_on date not null,
  started_at timestamptz,
  ended_at timestamptz,
  duration_hours numeric not null default 0,
  category_slug text not null default '',
  description text not null default '',
  project_ref text not null default '',
  planner_ref text not null default '',
  milestone_ref text not null default '',
  final_section text not null default '',
  evidence_url text not null default '',
  tool_name text not null default '',
  notes text not null default '',
  learning_objective text not null default '',
  week_number integer,
  status text not null default 'draft',
  timer_active boolean not null default false,
  legacy_time_log_id uuid,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint timekeeper_entries_hours_check check (duration_hours >= 0 and duration_hours <= 14)
);

create unique index if not exists timekeeper_entries_legacy_idx
  on public.timekeeper_entries (legacy_time_log_id)
  where legacy_time_log_id is not null;

create unique index if not exists timekeeper_one_active_timer
  on public.timekeeper_entries (owner_user_id)
  where timer_active = true and owner_user_id is not null;

create index if not exists timekeeper_entries_intern_idx
  on public.timekeeper_entries (intern_id, worked_on desc);

create table if not exists public.timekeeper_plans (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.internship_interns(id) on delete cascade,
  week_number integer not null,
  projected_hours numeric not null default 0,
  status text not null default 'draft',
  notes text not null default '',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (intern_id, week_number)
);

create table if not exists public.timekeeper_plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.timekeeper_plans(id) on delete cascade,
  label text not null,
  planned_hours numeric not null default 0
);

create table if not exists public.timekeeper_weeks (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.internship_interns(id) on delete cascade,
  week_number integer not null,
  status text not null default 'open',
  reflection text not null default '',
  learning_objective text not null default '',
  variance_note text not null default '',
  manager_note text not null default '',
  founder_note text not null default '',
  exception_reason text not null default '',
  submitted_at timestamptz,
  recommended_at timestamptz,
  approved_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (intern_id, week_number)
);

create table if not exists public.timekeeper_audit (
  id uuid primary key default gen_random_uuid(),
  target_type text not null,
  target_id text not null,
  actor_id uuid,
  actor_role text not null default '',
  previous_status text not null default '',
  new_status text not null default '',
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.timekeeper_adjustments (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.timekeeper_entries(id) on delete cascade,
  original_hours numeric not null,
  proposed_hours numeric not null,
  reason text not null default '',
  requester_id uuid,
  approver_id uuid,
  status text not null default 'requested',
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create table if not exists public.timekeeper_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.timekeeper_rates (
  user_id uuid primary key,
  hourly_rate numeric,
  updated_by uuid,
  updated_at timestamptz not null default now()
);

alter table public.timekeeper_categories enable row level security;
alter table public.timekeeper_entries enable row level security;
alter table public.timekeeper_plans enable row level security;
alter table public.timekeeper_plan_items enable row level security;
alter table public.timekeeper_weeks enable row level security;
alter table public.timekeeper_audit enable row level security;
alter table public.timekeeper_adjustments enable row level security;
alter table public.timekeeper_settings enable row level security;
alter table public.timekeeper_rates enable row level security;

revoke all on table public.timekeeper_categories from anon, authenticated;
revoke all on table public.timekeeper_entries from anon, authenticated;
revoke all on table public.timekeeper_plans from anon, authenticated;
revoke all on table public.timekeeper_plan_items from anon, authenticated;
revoke all on table public.timekeeper_weeks from anon, authenticated;
revoke all on table public.timekeeper_audit from anon, authenticated;
revoke all on table public.timekeeper_adjustments from anon, authenticated;
revoke all on table public.timekeeper_settings from anon, authenticated;
revoke all on table public.timekeeper_rates from anon, authenticated;

insert into public.timekeeper_entries (
  owner_user_id, intern_id, subject_kind, entry_mode, worked_on, duration_hours,
  description, evidence_url, notes, week_number, status, legacy_time_log_id, submitted_at
)
select
  i.user_id,
  l.intern_id,
  'intern',
  'manual',
  l.worked_on,
  l.hours,
  l.activity,
  l.evidence_url,
  l.notes,
  l.week_number,
  case l.status
    when 'supervisor_verified' then 'founder_approved'
    when 'ava_approved' then 'manager_recommended'
    when 'submitted' then 'submitted'
    when 'changes_requested' then 'returned'
    else 'draft'
  end,
  l.id,
  l.submitted_at
from public.internship_time_logs l
join public.internship_interns i on i.id = l.intern_id
where not exists (
  select 1 from public.timekeeper_entries e where e.legacy_time_log_id = l.id
);

commit;
