-- Explicit internship manager and supervisor eligibility.
-- Defaults are off. Existing internship assignments are not changed.

begin;

create table if not exists public.internship_staff_eligibility (
  user_id uuid primary key,
  can_manage_interns boolean not null default false,
  can_supervise_interns boolean not null default false,
  job_title text not null default '',
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.internship_staff_eligibility_audits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  old_can_manage boolean not null default false,
  new_can_manage boolean not null default false,
  old_can_supervise boolean not null default false,
  new_can_supervise boolean not null default false,
  changed_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists internship_staff_eligibility_audits_user_idx
  on public.internship_staff_eligibility_audits (user_id, created_at desc);

alter table public.internship_staff_eligibility enable row level security;
alter table public.internship_staff_eligibility_audits enable row level security;

revoke all on table public.internship_staff_eligibility from anon, authenticated;
revoke all on table public.internship_staff_eligibility_audits from anon, authenticated;

commit;
