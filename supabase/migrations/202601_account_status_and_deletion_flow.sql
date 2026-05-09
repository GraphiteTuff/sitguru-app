alter table public.profiles
add column if not exists account_status text not null default 'active',
add column if not exists deactivated_at timestamptz,
add column if not exists deletion_requested_at timestamptz,
add column if not exists deletion_reason text,
add column if not exists deletion_feedback text,
add column if not exists deletion_confirmed_at timestamptz,
add column if not exists deleted_at timestamptz;

alter table public.profiles
drop constraint if exists profiles_account_status_check;

alter table public.profiles
add constraint profiles_account_status_check
check (account_status in ('active', 'deactivated', 'deleted'));

alter table public.profiles
add column if not exists guru_status text;

alter table public.profiles
drop constraint if exists profiles_guru_status_check;

alter table public.profiles
add constraint profiles_guru_status_check
check (
  guru_status is null
  or guru_status in ('active', 'paused', 'cancelled', 'pending')
);

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text,
  role text,
  reason text not null,
  feedback text,
  confirmation_text text not null,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'requested'
);

alter table public.account_deletion_requests
drop constraint if exists account_deletion_requests_status_check;

alter table public.account_deletion_requests
add constraint account_deletion_requests_status_check
check (status in ('requested', 'completed', 'failed'));

alter table public.account_deletion_requests enable row level security;