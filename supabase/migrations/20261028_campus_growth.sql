-- Campus Growth records that the existing assignment, campaign, and referral tables do not store.
-- Server-only. Interns are not Ambassadors, and these rows do not create reward entitlements.

begin;

create table if not exists public.campus_growth_profiles (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.internship_interns(id) on delete cascade,
  university_id uuid null,
  manager_user_id uuid null,
  status text not null default 'active',
  market_notes text not null default '',
  policy_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (intern_id)
);

create table if not exists public.campus_growth_opportunities (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.internship_interns(id) on delete cascade,
  university_id uuid null,
  title text not null default '',
  opportunity_type text not null default 'Other',
  description text not null default '',
  source_url text not null default '',
  contact_name text not null default '',
  contact_organization text not null default '',
  contact_info text not null default '',
  happens_on date null,
  location text not null default '',
  estimated_audience integer null,
  potential_goal text not null default '',
  notes text not null default '',
  rules_notes text not null default '',
  approval text not null default 'needs_research',
  ava_review text not null default '',
  jason_review text not null default '',
  status text not null default 'Idea',
  created_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campus_growth_leads (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.internship_interns(id) on delete cascade,
  university_id uuid null,
  opportunity_id uuid null,
  lead_type text not null default 'Other',
  name text not null default '',
  organization text not null default '',
  contact text not null default '',
  notes text not null default '',
  status text not null default 'New',
  follow_up text not null default 'manager',
  created_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campus_growth_links (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.internship_interns(id) on delete cascade,
  university_id uuid null,
  code text not null unique,
  campaign_label text not null default '',
  channel text not null default 'link',
  target_type text not null default 'awareness',
  grants_reward boolean not null default false,
  created_by uuid null,
  created_at timestamptz not null default now()
);

create table if not exists public.campus_growth_visits (
  id uuid primary key default gen_random_uuid(),
  link_id uuid null,
  intern_id uuid null,
  code text not null default '',
  kind text not null default 'visit',
  created_at timestamptz not null default now()
);

create table if not exists public.campus_growth_results (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.internship_interns(id) on delete cascade,
  university_id uuid null,
  opportunity_id uuid null,
  lesson text not null default '',
  recommendation text not null default '',
  pet_parent_registrations integer not null default 0,
  guru_applications integer not null default 0,
  bookings integer not null default 0,
  recorded_by uuid null,
  created_at timestamptz not null default now()
);

create table if not exists public.campus_growth_audit (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid null,
  resource_type text not null,
  resource_id text not null default '',
  action text not null,
  actor_id uuid null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists campus_growth_opportunities_intern_idx on public.campus_growth_opportunities (intern_id, created_at desc);
create index if not exists campus_growth_leads_intern_idx on public.campus_growth_leads (intern_id, created_at desc);
create index if not exists campus_growth_visits_code_idx on public.campus_growth_visits (code, kind);

alter table public.campus_growth_profiles enable row level security;
alter table public.campus_growth_opportunities enable row level security;
alter table public.campus_growth_leads enable row level security;
alter table public.campus_growth_links enable row level security;
alter table public.campus_growth_visits enable row level security;
alter table public.campus_growth_results enable row level security;
alter table public.campus_growth_audit enable row level security;

revoke all on table public.campus_growth_profiles from anon, authenticated;
revoke all on table public.campus_growth_opportunities from anon, authenticated;
revoke all on table public.campus_growth_leads from anon, authenticated;
revoke all on table public.campus_growth_links from anon, authenticated;
revoke all on table public.campus_growth_visits from anon, authenticated;
revoke all on table public.campus_growth_results from anon, authenticated;
revoke all on table public.campus_growth_audit from anon, authenticated;

commit;
