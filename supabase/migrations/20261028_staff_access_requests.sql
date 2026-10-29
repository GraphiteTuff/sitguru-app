-- Student requests for the existing Spring 2027 internship.
-- One SitGuru account. No second internship identity.

begin;

create table if not exists public.staff_access_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  email text not null,
  full_name text not null default '',
  role_key text not null default 'social_media_community_growth_intern',
  university_name text not null default '',
  academic_program text not null default '',
  status text not null default 'pending_ceo_review',
  intern_id uuid null references public.internship_interns(id) on delete set null,
  ceo_reviewed_at timestamptz null,
  university_verified_at timestamptz null,
  decided_by uuid null,
  decision_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists staff_access_requests_open_user_idx
  on public.staff_access_requests (user_id)
  where status in (
    'pending_ceo_review',
    'pending_university_approval',
    'approved',
    'active'
  );

create index if not exists staff_access_requests_status_idx
  on public.staff_access_requests (status, created_at desc);

alter table public.staff_access_requests enable row level security;
revoke all on table public.staff_access_requests from anon, authenticated;

commit;
