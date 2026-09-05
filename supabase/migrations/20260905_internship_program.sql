-- SitGuru Social Media & Community Growth Internship Program.
-- University-agnostic: SitGuru owns the program; universities approve student academics.
-- Service-role only. Interns and HQ use server routes, not direct client table access.

begin;

create table if not exists public.internship_universities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  display_name text not null default '',
  short_name text not null default '',
  parent_university_id uuid null references public.internship_universities(id) on delete set null,
  city text not null default '',
  state text not null default '',
  region text not null default '',
  country text not null default 'US',
  website_url text not null default '',
  status text not null default 'research_needed',
  is_university_partner boolean not null default false,
  partner_notes text not null default '',
  partner_since date null,
  remote_eligible boolean not null default true,
  academic_credit_status text not null default 'unknown',
  internship_eligibility_status text not null default 'unknown',
  funding_status text not null default 'unknown',
  source_url text not null default '',
  verified_at timestamptz null,
  verified_by uuid null,
  notes text not null default '',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.internship_university_campuses (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.internship_universities(id) on delete cascade,
  slug text not null,
  name text not null,
  display_name text not null default '',
  city text not null default '',
  state text not null default '',
  is_primary boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique (university_id, slug)
);

create table if not exists public.internship_path_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  is_active boolean not null default true,
  sort_order integer not null default 100
);

create table if not exists public.internship_academic_requirements (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.internship_universities(id) on delete cascade,
  campus_id uuid null references public.internship_university_campuses(id) on delete set null,
  department text not null default '',
  academic_program text not null default '',
  course_code text not null default '',
  course_name text not null default '',
  credit_hours numeric null,
  minimum_internship_hours integer null,
  maximum_internship_hours integer null,
  required_weekly_hours numeric null,
  requires_faculty_supervisor boolean not null default false,
  requires_learning_agreement boolean not null default false,
  requires_offer_letter boolean not null default false,
  requires_midpoint_evaluation boolean not null default false,
  requires_final_evaluation boolean not null default false,
  requires_timesheet boolean not null default false,
  requires_final_report boolean not null default false,
  requires_student_reflection boolean not null default false,
  requires_site_visit boolean not null default false,
  other_requirements text not null default '',
  source_url text not null default '',
  verified_at timestamptz null,
  verified_by uuid null,
  effective_start_date date null,
  effective_end_date date null,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.internship_funding_opportunities (
  id uuid primary key default gen_random_uuid(),
  university_id uuid null references public.internship_universities(id) on delete set null,
  campus_id uuid null references public.internship_university_campuses(id) on delete set null,
  fund_name text not null,
  semester text not null default '',
  academic_year text not null default '',
  funding_type text not null default '',
  maximum_award text not null default '',
  eligibility text not null default '',
  financial_need_required boolean not null default false,
  credit_bearing_required boolean not null default false,
  unpaid_preference boolean not null default false,
  low_paid_preference boolean not null default false,
  geographic_requirement text not null default '',
  industry_requirement text not null default '',
  business_growth_requirement text not null default '',
  student_application_required boolean not null default false,
  employer_application_required boolean not null default false,
  faculty_approval_required boolean not null default false,
  deadline date null,
  application_url text not null default '',
  status text not null default 'unknown',
  source_url text not null default '',
  last_verified_at timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists public.internship_university_contacts (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.internship_universities(id) on delete cascade,
  campus_id uuid null references public.internship_university_campuses(id) on delete set null,
  full_name text not null default '',
  title text not null default '',
  department text not null default '',
  role_key text not null default 'career_services',
  email text not null default '',
  phone text not null default '',
  notes text not null default '',
  last_contacted_at date null,
  relationship_status text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.internship_document_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  document_kind text not null,
  body text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.internship_university_documents (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.internship_universities(id) on delete cascade,
  requirement_id uuid null references public.internship_academic_requirements(id) on delete set null,
  template_id uuid null references public.internship_document_templates(id) on delete set null,
  source text not null default 'sitguru_template',
  file_url text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.internship_cohorts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  season text not null,
  year integer not null,
  academic_year text not null default '',
  starts_on date null,
  ends_on date null,
  status text not null default 'planning',
  created_at timestamptz not null default now(),
  unique (season, year)
);

create table if not exists public.internship_cohort_universities (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.internship_cohorts(id) on delete cascade,
  university_id uuid not null references public.internship_universities(id) on delete cascade,
  campus_id uuid null references public.internship_university_campuses(id) on delete set null,
  target_program text not null default '',
  participation_status text not null default 'target',
  unique (cohort_id, university_id)
);

create table if not exists public.internship_projects (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.internship_cohorts(id) on delete cascade,
  slug text not null,
  name text not null,
  project_kind text not null,
  baseline_notes text not null default '',
  target_notes text not null default '',
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  unique (cohort_id, slug)
);

create table if not exists public.internship_interns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  full_name text not null,
  email text not null,
  phone text not null default '',
  cohort_id uuid not null references public.internship_cohorts(id) on delete restrict,
  university_id uuid not null references public.internship_universities(id) on delete restrict,
  campus_id uuid null references public.internship_university_campuses(id) on delete set null,
  path_type text not null default 'credit_bearing',
  academic_program text not null default '',
  course_code text not null default '',
  credits numeric null,
  required_hours integer null,
  faculty_supervisor text not null default '',
  academic_advisor text not null default '',
  career_office text not null default '',
  academic_coordinator text not null default '',
  approval_status text not null default 'pending',
  approval_date date null,
  semester text not null default '',
  academic_start_date date null,
  academic_end_date date null,
  status text not null default 'applicant',
  portal_enabled boolean not null default true,
  academic_snapshot jsonb not null default '{}'::jsonb,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists internship_interns_cohort_email_idx
  on public.internship_interns (cohort_id, lower(email));

create table if not exists public.internship_project_assignments (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.internship_interns(id) on delete cascade,
  project_id uuid not null references public.internship_projects(id) on delete cascade,
  contribution_type text not null default 'primary',
  unique (intern_id, project_id)
);

create table if not exists public.internship_tasks (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.internship_interns(id) on delete cascade,
  project_id uuid null references public.internship_projects(id) on delete set null,
  title text not null,
  due_on date null,
  status text not null default 'todo',
  work_url text not null default '',
  business_objective text not null default '',
  metric_affected text not null default '',
  student_notes text not null default '',
  supervisor_notes text not null default '',
  supervisor_approved boolean not null default false,
  approved_at timestamptz null,
  approved_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.internship_content (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.internship_interns(id) on delete cascade,
  title text not null,
  platform text not null default '',
  draft_url text not null default '',
  published_url text not null default '',
  status text not null default 'draft',
  due_on date null,
  student_notes text not null default '',
  supervisor_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.internship_campaigns (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid null references public.internship_interns(id) on delete set null,
  project_id uuid null references public.internship_projects(id) on delete set null,
  name text not null,
  utm_source text not null default '',
  utm_campaign text not null default '',
  referral_code text not null default '',
  tracking_url text not null default '',
  objective text not null default '',
  status text not null default 'draft',
  primary_owner_intern_id uuid null references public.internship_interns(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.internship_campaign_contributors (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.internship_campaigns(id) on delete cascade,
  intern_id uuid not null references public.internship_interns(id) on delete cascade,
  contribution_type text not null default 'supporting',
  unique (campaign_id, intern_id)
);

create table if not exists public.internship_metrics (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid null references public.internship_interns(id) on delete set null,
  campaign_id uuid null references public.internship_campaigns(id) on delete set null,
  project_id uuid null references public.internship_projects(id) on delete set null,
  metric_key text not null default '',
  label text not null,
  value_numeric numeric null,
  period_start date null,
  period_end date null,
  source_system text not null,
  source_note text not null default '',
  is_verified boolean not null default false,
  self_reported boolean not null default false,
  verified_by uuid null,
  verified_at timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists public.internship_scorecards (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.internship_interns(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  quality integer not null default 0,
  communication integer not null default 0,
  reliability integer not null default 0,
  creativity integer not null default 0,
  analytics integer not null default 0,
  judgment integer not null default 0,
  initiative integer not null default 0,
  kpi_contribution integer not null default 0,
  strongest_contribution text not null default '',
  improvement_required text not null default '',
  scored_by uuid null,
  scored_at timestamptz not null default now()
);

create table if not exists public.internship_weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.internship_interns(id) on delete cascade,
  week_of date not null,
  accomplished text not null default '',
  data_showed text not null default '',
  didnt_work text not null default '',
  changing_next_week text not null default '',
  upcoming_approved boolean not null default false,
  meeting_at timestamptz null,
  supervisor_id uuid null,
  created_at timestamptz not null default now(),
  unique (intern_id, week_of)
);

create table if not exists public.internship_evaluations (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.internship_interns(id) on delete cascade,
  kind text not null,
  presented_at date null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

alter table public.internship_universities enable row level security;
alter table public.internship_university_campuses enable row level security;
alter table public.internship_path_types enable row level security;
alter table public.internship_academic_requirements enable row level security;
alter table public.internship_funding_opportunities enable row level security;
alter table public.internship_university_contacts enable row level security;
alter table public.internship_document_templates enable row level security;
alter table public.internship_university_documents enable row level security;
alter table public.internship_cohorts enable row level security;
alter table public.internship_cohort_universities enable row level security;
alter table public.internship_projects enable row level security;
alter table public.internship_interns enable row level security;
alter table public.internship_project_assignments enable row level security;
alter table public.internship_tasks enable row level security;
alter table public.internship_content enable row level security;
alter table public.internship_campaigns enable row level security;
alter table public.internship_campaign_contributors enable row level security;
alter table public.internship_metrics enable row level security;
alter table public.internship_scorecards enable row level security;
alter table public.internship_weekly_reviews enable row level security;
alter table public.internship_evaluations enable row level security;

revoke all on table public.internship_universities from anon, authenticated;
revoke all on table public.internship_university_campuses from anon, authenticated;
revoke all on table public.internship_path_types from anon, authenticated;
revoke all on table public.internship_academic_requirements from anon, authenticated;
revoke all on table public.internship_funding_opportunities from anon, authenticated;
revoke all on table public.internship_university_contacts from anon, authenticated;
revoke all on table public.internship_document_templates from anon, authenticated;
revoke all on table public.internship_university_documents from anon, authenticated;
revoke all on table public.internship_cohorts from anon, authenticated;
revoke all on table public.internship_cohort_universities from anon, authenticated;
revoke all on table public.internship_projects from anon, authenticated;
revoke all on table public.internship_interns from anon, authenticated;
revoke all on table public.internship_project_assignments from anon, authenticated;
revoke all on table public.internship_tasks from anon, authenticated;
revoke all on table public.internship_content from anon, authenticated;
revoke all on table public.internship_campaigns from anon, authenticated;
revoke all on table public.internship_campaign_contributors from anon, authenticated;
revoke all on table public.internship_metrics from anon, authenticated;
revoke all on table public.internship_scorecards from anon, authenticated;
revoke all on table public.internship_weekly_reviews from anon, authenticated;
revoke all on table public.internship_evaluations from anon, authenticated;

insert into public.internship_path_types (slug, name, sort_order) values
  ('credit_bearing', 'Credit-Bearing Internship', 10),
  ('non_credit', 'Non-Credit Internship', 20),
  ('required_major', 'Required Major Internship', 30),
  ('elective', 'Elective Internship', 40),
  ('co_op', 'Co-op', 50),
  ('experiential_learning', 'Experiential Learning Project', 60),
  ('independent_study', 'Independent Study Internship', 70),
  ('capstone', 'Capstone / Applied Project', 80),
  ('career_internship', 'Career Internship', 90),
  ('externship', 'Externship', 100),
  ('university_sponsored_project', 'University-Sponsored Project', 110)
on conflict (slug) do update set name = excluded.name;

insert into public.internship_document_templates (slug, name, document_kind, body) values
  ('employer_internship_description', 'Employer Internship Description', 'employer_internship_description', 'SitGuru Social Media & Community Growth Internship Program — employer description.'),
  ('offer_letter', 'Offer Letter', 'offer_letter', ''),
  ('acceptance_letter', 'Internship Acceptance Letter', 'acceptance_letter', ''),
  ('learning_agreement', 'Learning Agreement', 'learning_agreement', ''),
  ('learning_objectives', 'Learning Objectives', 'learning_objectives', ''),
  ('supervisor_agreement', 'Supervisor Agreement', 'supervisor_agreement', ''),
  ('timesheet', 'Timesheet', 'timesheet', ''),
  ('midpoint_evaluation', 'Midpoint Evaluation', 'midpoint_evaluation', ''),
  ('final_evaluation', 'Final Evaluation', 'final_evaluation', ''),
  ('completion_letter', 'Internship Completion Letter', 'completion_letter', ''),
  ('business_growth_report', 'Business Growth Report', 'business_growth_report', ''),
  ('university_internship_packet', 'University Internship Packet', 'university_internship_packet', '')
on conflict (slug) do update set name = excluded.name;

insert into public.internship_universities (
  slug, name, display_name, short_name, city, state, region, status,
  is_university_partner, academic_credit_status, internship_eligibility_status, funding_status
) values
  ('penn-state-university', 'Penn State University', 'Penn State University', 'Penn State', 'University Park', 'PA', 'Pennsylvania', 'research_needed', false, 'unknown', 'unknown', 'unknown'),
  ('penn-state-abington', 'Penn State Abington', 'Penn State Abington', 'PSU Abington', 'Abington', 'PA', 'Greater Philadelphia', 'requirements_identified', false, 'likely', 'eligible', 'available'),
  ('penn-state-world-campus', 'Penn State World Campus', 'Penn State World Campus', 'World Campus', 'University Park', 'PA', 'Remote Eligible', 'research_needed', false, 'unknown', 'unknown', 'unknown'),
  ('bucks-county-community-college', 'Bucks County Community College', 'Bucks County Community College', 'Bucks', 'Newtown', 'PA', 'Greater Philadelphia', 'potential_partner', false, 'unknown', 'unknown', 'unknown'),
  ('montgomery-county-community-college', 'Montgomery County Community College', 'Montgomery County Community College', 'Montco', 'Blue Bell', 'PA', 'Greater Philadelphia', 'potential_partner', false, 'unknown', 'unknown', 'unknown'),
  ('delaware-valley-university', 'Delaware Valley University', 'Delaware Valley University', 'DelVal', 'Doylestown', 'PA', 'Greater Philadelphia', 'potential_partner', false, 'unknown', 'unknown', 'unknown'),
  ('gwynedd-mercy-university', 'Gwynedd Mercy University', 'Gwynedd Mercy University', 'GMercyU', 'Gwynedd Valley', 'PA', 'Greater Philadelphia', 'potential_partner', false, 'unknown', 'unknown', 'unknown'),
  ('arcadia-university', 'Arcadia University', 'Arcadia University', 'Arcadia', 'Glenside', 'PA', 'Greater Philadelphia', 'potential_partner', false, 'unknown', 'unknown', 'unknown'),
  ('ursinus-college', 'Ursinus College', 'Ursinus College', 'Ursinus', 'Collegeville', 'PA', 'Greater Philadelphia', 'research_needed', false, 'unknown', 'unknown', 'unknown'),
  ('temple-university', 'Temple University', 'Temple University', 'Temple', 'Philadelphia', 'PA', 'Greater Philadelphia', 'potential_partner', false, 'unknown', 'unknown', 'unknown'),
  ('drexel-university', 'Drexel University', 'Drexel University', 'Drexel', 'Philadelphia', 'PA', 'Greater Philadelphia', 'research_needed', false, 'unknown', 'unknown', 'unknown'),
  ('villanova-university', 'Villanova University', 'Villanova University', 'Villanova', 'Villanova', 'PA', 'Greater Philadelphia', 'research_needed', false, 'unknown', 'unknown', 'unknown'),
  ('lehigh-university', 'Lehigh University', 'Lehigh University', 'Lehigh', 'Bethlehem', 'PA', 'Pennsylvania', 'research_needed', false, 'unknown', 'unknown', 'unknown'),
  ('rutgers-university', 'Rutgers University', 'Rutgers University', 'Rutgers', 'New Brunswick', 'NJ', 'Greater Philadelphia', 'research_needed', false, 'unknown', 'unknown', 'unknown'),
  ('rowan-university', 'Rowan University', 'Rowan University', 'Rowan', 'Glassboro', 'NJ', 'Greater Philadelphia', 'research_needed', false, 'unknown', 'unknown', 'unknown'),
  ('rider-university', 'Rider University', 'Rider University', 'Rider', 'Lawrenceville', 'NJ', 'Greater Philadelphia', 'research_needed', false, 'unknown', 'unknown', 'unknown'),
  ('the-college-of-new-jersey', 'The College of New Jersey', 'The College of New Jersey', 'TCNJ', 'Ewing', 'NJ', 'Greater Philadelphia', 'research_needed', false, 'unknown', 'unknown', 'unknown')
on conflict (slug) do update
  set name = excluded.name,
      display_name = excluded.display_name,
      city = excluded.city,
      state = excluded.state,
      region = excluded.region;

update public.internship_universities child
set parent_university_id = parent.id
from public.internship_universities parent
where parent.slug = 'penn-state-university'
  and child.slug in ('penn-state-abington', 'penn-state-world-campus');

insert into public.internship_university_campuses (university_id, slug, name, display_name, city, state, is_primary)
select id, 'abington', 'Abington', 'Penn State Abington', 'Abington', 'PA', true
from public.internship_universities
where slug = 'penn-state-abington'
on conflict (university_id, slug) do update set display_name = excluded.display_name;

insert into public.internship_academic_requirements (
  university_id, campus_id, department, academic_program, course_code, course_name,
  credit_hours, minimum_internship_hours, requires_faculty_supervisor, requires_learning_agreement,
  requires_offer_letter, requires_midpoint_evaluation, requires_final_evaluation, requires_timesheet,
  requires_final_report, status, other_requirements
)
select
  u.id,
  c.id,
  'Corporate Communication',
  'Corporate Communication',
  'CC 495',
  'Internship',
  3,
  135,
  true, true, true, true, true, false, true,
  'verified',
  'Do not treat these hours as universal. Other Penn State programs may require different credit or hour totals.'
from public.internship_universities u
left join public.internship_university_campuses c
  on c.university_id = u.id and c.slug = 'abington'
where u.slug = 'penn-state-abington'
  and not exists (
    select 1 from public.internship_academic_requirements r
    where r.university_id = u.id and r.course_code = 'CC 495'
  );

insert into public.internship_academic_requirements (
  university_id, department, academic_program, course_code, course_name,
  credit_hours, minimum_internship_hours, requires_faculty_supervisor,
  requires_midpoint_evaluation, requires_final_evaluation, status, other_requirements
)
select
  u.id,
  'Business',
  'Business',
  '',
  '',
  3,
  300,
  true, true, true,
  'verified',
  'Program-level example: Business internships at this campus may require 300 hours for 3 credits. Confirm against the current university guide before assigning a student.'
from public.internship_universities u
where u.slug = 'penn-state-abington'
  and not exists (
    select 1 from public.internship_academic_requirements r
    where r.university_id = u.id and r.academic_program = 'Business'
  );

insert into public.internship_funding_opportunities (
  university_id, fund_name, funding_type, student_application_required, employer_application_required,
  status, eligibility
)
select u.id, 'Hynes Internship Support Fund', 'university_fund', true, false, 'available',
  'Penn State Abington students. Confirm current eligibility on the university site before citing an award.'
from public.internship_universities u
where u.slug = 'penn-state-abington'
  and not exists (
    select 1 from public.internship_funding_opportunities f
    where f.university_id = u.id and f.fund_name = 'Hynes Internship Support Fund'
  );

insert into public.internship_funding_opportunities (
  university_id, fund_name, funding_type, student_application_required, employer_application_required,
  business_growth_requirement, status, eligibility
)
select u.id, 'Economic Development Internship Fund', 'university_fund', true, true, 'Employer must demonstrate business development or job creation, or the intern must work on a project that grows the business in a demonstrable way.', 'available',
  'Penn State Abington students. Confirm current rules and deadlines on the university site.'
from public.internship_universities u
where u.slug = 'penn-state-abington'
  and not exists (
    select 1 from public.internship_funding_opportunities f
    where f.university_id = u.id and f.fund_name = 'Economic Development Internship Fund'
  );

insert into public.internship_cohorts (name, season, year, academic_year, starts_on, ends_on, status)
values ('Spring 2027 Cohort', 'spring', 2027, '2026-2027', '2027-01-12', '2027-05-07', 'planning')
on conflict (season, year) do update
  set name = excluded.name,
      starts_on = excluded.starts_on,
      ends_on = excluded.ends_on;

insert into public.internship_cohort_universities (cohort_id, university_id, target_program, participation_status)
select c.id, u.id, v.program, 'target'
from public.internship_cohorts c
join (
  values
    ('penn-state-abington', 'Corporate Communication'),
    ('bucks-county-community-college', 'Marketing'),
    ('gwynedd-mercy-university', 'Digital Communications'),
    ('montgomery-county-community-college', 'Marketing'),
    ('delaware-valley-university', 'Media & Communication'),
    ('arcadia-university', 'Media & Communication')
) as v(slug, program) on true
join public.internship_universities u on u.slug = v.slug
where c.season = 'spring' and c.year = 2027
on conflict (cohort_id, university_id) do update
  set target_program = excluded.target_program;

insert into public.internship_projects (cohort_id, slug, name, project_kind, status, baseline_notes, target_notes)
select c.id, v.slug, v.name, v.kind, 'active',
  'Record the verified SitGuru baseline before the intern starts execution.',
  'Targets must be measured from SitGuru Admin, GA4, social analytics, or another approved source — not intern self-report.'
from public.internship_cohorts c
join (
  values
    ('pet-parent-growth', 'Pet Parent Growth', 'pet_parent_growth'),
    ('guru-growth', 'Guru Growth', 'guru_growth'),
    ('community-partnership-growth', 'Community Partnership Growth', 'community_partnership_growth'),
    ('content-conversion', 'Content & Conversion Optimization', 'content_conversion')
) as v(slug, name, kind) on true
where c.season = 'spring' and c.year = 2027
on conflict (cohort_id, slug) do update
  set name = excluded.name,
      status = excluded.status;

commit;
