-- SitGuru internship playbook: cohort milestones, SMART goals, experiments, access grants.
-- University-owned milestones attach to a student institution and are never the program root.

begin;

create table if not exists public.internship_milestones (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.internship_cohorts(id) on delete cascade,
  university_id uuid null references public.internship_universities(id) on delete cascade,
  milestone_key text not null,
  title text not null,
  due_on date not null,
  phase text not null default 'Recruiting',
  owner text not null default 'sitguru',
  action text not null default '',
  status text not null default 'scheduled',
  created_at timestamptz not null default now(),
  unique (cohort_id, milestone_key)
);

create table if not exists public.internship_smart_goals (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.internship_interns(id) on delete cascade,
  specific text not null default '',
  measurable text not null default '',
  achievable text not null default '',
  relevant text not null default '',
  time_bound text not null default '',
  metric_key text not null default '',
  baseline_value text not null default '',
  target_value text not null default '',
  source_system text not null default 'sitguru_admin',
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists public.internship_experiments (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.internship_interns(id) on delete cascade,
  campaign_id uuid null references public.internship_campaigns(id) on delete set null,
  hypothesis text not null default '',
  action text not null default '',
  audience text not null default '',
  result text not null default '',
  lesson text not null default '',
  next_step text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.internship_access_grants (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.internship_interns(id) on delete cascade,
  tool_key text not null,
  granted boolean not null default false,
  notes text not null default '',
  granted_at timestamptz null,
  unique (intern_id, tool_key)
);

alter table public.internship_milestones enable row level security;
alter table public.internship_smart_goals enable row level security;
alter table public.internship_experiments enable row level security;
alter table public.internship_access_grants enable row level security;

revoke all on table public.internship_milestones from anon, authenticated;
revoke all on table public.internship_smart_goals from anon, authenticated;
revoke all on table public.internship_experiments from anon, authenticated;
revoke all on table public.internship_access_grants from anon, authenticated;

insert into public.internship_milestones (
  cohort_id, university_id, milestone_key, title, due_on, phase, owner, action
)
select c.id, null, v.key, v.title, v.due_on::date, v.phase, 'sitguru', v.action
from public.internship_cohorts c
join (
  values
    ('program_confirmation', 'Program confirmation', '2026-09-18', 'Recruiting', 'Confirm project structure, site-supervisor expectations, and credit-eligibility language. Do not invent a university unpublished deadline.'),
    ('post_recruit', 'Post & recruit', '2026-09-30', 'Recruiting', 'Publish the SitGuru Internship Program posting for eligible universities.'),
    ('candidate_pipeline', 'Candidate pipeline', '2026-10-31', 'Recruiting', 'Screen, interview, and explain credit/funding as subject to the student university approval.'),
    ('select_finalist', 'Select finalist + alternate', '2026-11-13', 'Onboarding', 'Choose the primary intern and one alternate. Confirm that intern hours and academic pathway.'),
    ('employer_paperwork', 'Employer paperwork', '2026-11-20', 'Onboarding', 'Complete the employer acceptance letter on SitGuru / Graff Enterprises LLC letterhead using that intern university template when provided.'),
    ('onboarding_ready', 'Onboarding, access, SMART baseline', '2027-01-09', 'Onboarding', 'Prepare portal access, KPI baseline template, timesheet, weekly check-in, confidentiality, brand standards, and SMART learning plan.'),
    ('phase_1', 'Phase 1 — Baseline', '2027-01-22', 'Delivery', 'Baseline, market research, KPI targets, campaign plan.'),
    ('phase_2', 'Phase 2 — Campaign system', '2027-02-19', 'Delivery', 'Build content system, tracking, creative assets, and first experiments.'),
    ('phase_3', 'Phase 3 — Execute and iterate', '2027-04-02', 'Delivery', 'Execute campaigns and keep the experiment log current.'),
    ('phase_4', 'Phase 4 — Optimize and document', '2027-04-23', 'Delivery', 'Optimize strongest channels and prepare final analysis.'),
    ('closeout', 'Closeout — growth report + evaluation', '2027-04-30', 'Closeout', 'Final presentation, Business Growth Report, handoff package, and required evaluations.')
) as v(key, title, due_on, phase, action) on true
where c.season = 'spring' and c.year = 2027
on conflict (cohort_id, milestone_key) do update
  set title = excluded.title, due_on = excluded.due_on, action = excluded.action;

insert into public.internship_milestones (
  cohort_id, university_id, milestone_key, title, due_on, phase, owner, action
)
select c.id, u.id, v.key, v.title, v.due_on::date, v.phase, 'university', v.action
from public.internship_cohorts c
join public.internship_universities u on u.slug = 'penn-state-abington'
join (
  values
    ('psu_abington_career_fair', 'Optional campus recruiting event', '2026-10-21', 'Recruiting', 'Optional campus career fair for this student institution. Verify with that campus before treating as required.'),
    ('psu_abington_credit_deadline', 'Published Spring 2027 credit application deadline', '2026-12-04', 'Onboarding', 'This campus currently lists December 4, 2026. Confirm before committing to a student. Do not apply this deadline to other universities.'),
    ('psu_abington_term', 'Published Spring 2027 class dates', '2027-01-11', 'Delivery', 'This campus currently lists classes January 11–April 30, 2027. Other universities will differ.'),
    ('psu_abington_funding_watch', 'Watch Spring 2027 funding cycle', '2026-12-15', 'Onboarding', 'Public funding page may still show a prior term. Confirm with that campus. Do not invent a Spring deadline.')
) as v(key, title, due_on, phase, action) on true
where c.season = 'spring' and c.year = 2027
on conflict (cohort_id, milestone_key) do update
  set title = excluded.title, due_on = excluded.due_on, action = excluded.action;

commit;
