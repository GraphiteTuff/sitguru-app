-- SitGuru careers + internship postings. Service-role only.
-- Public /careers reads published rows through server admin.

begin;

create table if not exists public.career_jobs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null check (category in ('career', 'internship')),
  track text not null default 'general',
  location text not null default 'Remote',
  employment_type text not null default 'full_time',
  compensation_type text not null default 'paid_salary',
  compensation_note text null,
  hours_per_week text null,
  academic_credit_eligible boolean not null default false,
  college_partner text null,
  status text not null default 'draft' check (status in ('draft', 'published', 'closed')),
  summary text not null default '',
  description text not null default '',
  highlights text[] not null default '{}',
  apply_email text not null default 'jason@sitguru.com',
  apply_url text null,
  sort_order integer not null default 100,
  published_at timestamptz null,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists career_jobs_status_category_idx
  on public.career_jobs (status, category, sort_order, created_at desc);

alter table public.career_jobs enable row level security;

revoke all on table public.career_jobs from anon, authenticated;
grant select on table public.career_jobs to anon, authenticated;

create policy career_jobs_public_read
  on public.career_jobs
  for select
  to anon, authenticated
  using (status = 'published');

commit;
