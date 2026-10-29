-- Self-service staff access requests. Only the authenticated account owner can
-- read their request. All writes, including approval, are server-side only.
-- A request never changes a user's profile, roles, or HQ permissions.

begin;

create extension if not exists pgcrypto;

create table if not exists public.staff_role_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  requested_role text not null
    check (requested_role in ('social_community_manager')),
  reason text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'approved', 'denied')),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  review_note text not null default '',
  constraint staff_role_requests_email_check check (length(email) between 3 and 320),
  constraint staff_role_requests_name_check check (length(full_name) between 2 and 120),
  constraint staff_role_requests_reason_check check (length(reason) <= 600)
);

create unique index if not exists staff_role_requests_one_open_per_user
  on public.staff_role_requests (user_id, requested_role)
  where status in ('pending', 'processing');

create index if not exists staff_role_requests_queue_idx
  on public.staff_role_requests (status, requested_at desc);

alter table public.staff_role_requests enable row level security;

revoke all on table public.staff_role_requests from anon, authenticated;
grant select on table public.staff_role_requests to authenticated;

drop policy if exists "Account owner can view staff access requests" on public.staff_role_requests;
create policy "Account owner can view staff access requests"
  on public.staff_role_requests
  for select to authenticated
  using (auth.uid() = user_id);

commit;
