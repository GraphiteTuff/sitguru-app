alter table public.profiles
add column if not exists account_status text not null default 'active',
add column if not exists deactivated_at timestamptz,
add column if not exists suspended_at timestamptz,
add column if not exists suspension_reason text,
add column if not exists deletion_requested_at timestamptz,
add column if not exists deletion_reason text,
add column if not exists deletion_feedback text,
add column if not exists deletion_confirmed_at timestamptz,
add column if not exists deleted_at timestamptz,
add column if not exists guru_status text,
add column if not exists guru_cancelled_at timestamptz,
add column if not exists guru_cancellation_reason text;

alter table public.profiles
drop constraint if exists profiles_account_status_check;

alter table public.profiles
add constraint profiles_account_status_check
check (
  account_status in (
    'active',
    'deactivated',
    'suspended',
    'deleted'
  )
);

alter table public.profiles
drop constraint if exists profiles_guru_status_check;

alter table public.profiles
add constraint profiles_guru_status_check
check (
  guru_status is null
  or guru_status in (
    'pending',
    'active',
    'paused',
    'cancelled',
    'suspended'
  )
);

create table if not exists public.account_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text,
  role text,
  previous_account_status text,
  new_account_status text,
  previous_guru_status text,
  new_guru_status text,
  event_type text not null,
  reason text,
  feedback text,
  performed_by uuid,
  performed_by_email text,
  created_at timestamptz not null default now()
);

alter table public.account_lifecycle_events
drop constraint if exists account_lifecycle_events_event_type_check;

alter table public.account_lifecycle_events
add constraint account_lifecycle_events_event_type_check
check (
  event_type in (
    'account_deactivated',
    'account_reactivated',
    'account_suspended',
    'account_deleted',
    'guru_paused',
    'guru_cancelled',
    'guru_suspended',
    'guru_reactivated',
    'admin_status_change'
  )
);

create index if not exists account_lifecycle_events_user_id_idx
on public.account_lifecycle_events(user_id);

create index if not exists account_lifecycle_events_email_idx
on public.account_lifecycle_events(email);

create index if not exists account_lifecycle_events_event_type_idx
on public.account_lifecycle_events(event_type);

create index if not exists account_lifecycle_events_created_at_idx
on public.account_lifecycle_events(created_at desc);

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

alter table public.account_lifecycle_events enable row level security;
alter table public.account_deletion_requests enable row level security;