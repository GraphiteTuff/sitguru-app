-- Handshake Social & Community Growth Manager recruiting pipeline.
-- Service-role only from Admin HR. RLS on; no client policies.

begin;

create table if not exists public.growth_hire_leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text null,
  school text null,
  major text null,
  grad_year text null,
  source text not null default 'handshake',
  handshake_job_id text null default '11375329',
  shortlisted boolean not null default true,
  message_status text not null default 'not_messaged',
  stage text not null default 'shortlisted',
  next_follow_up date null,
  last_contacted_at timestamptz null,
  has_resume boolean not null default false,
  resume_file_name text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists growth_hire_leads_name_school_idx
  on public.growth_hire_leads (lower(full_name), coalesce(school, ''));

alter table public.growth_hire_leads enable row level security;

create table if not exists public.growth_hire_schools (
  id uuid primary key default gen_random_uuid(),
  school_name text not null unique,
  handshake_status text not null default 'pending',
  applications integer not null default 0,
  comments integer not null default 0,
  source text not null default 'handshake',
  handshake_job_id text null default '11375329',
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.growth_hire_schools enable row level security;

revoke all on table public.growth_hire_leads from anon, authenticated;
revoke all on table public.growth_hire_schools from anon, authenticated;

insert into public.growth_hire_schools (school_name, handshake_status)
values
  ('Bucks County Community College', 'pending'),
  ('DeSales University', 'pending'),
  ('Drexel University', 'pending'),
  ('Kutztown University of Pennsylvania', 'approved'),
  ('Lehigh University', 'pending'),
  ('Moravian University', 'pending'),
  ('Northampton Community College', 'pending'),
  ('Rider University', 'pending'),
  ('Rowan College at Burlington County', 'pending'),
  ('Rutgers University - New Brunswick (Flagship Campus)', 'approved'),
  ('Saint Joseph''s University', 'approved'),
  ('Temple University', 'approved'),
  ('Villanova University', 'approved'),
  ('West Chester University of Pennsylvania', 'pending')
on conflict (school_name) do update
  set handshake_status = excluded.handshake_status;

commit;
