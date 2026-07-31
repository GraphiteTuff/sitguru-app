-- Admin PawReport oversight: global tracking status, admin notes, GPS freshness
-- Safe to run repeatedly.

-- Global admin-facing tracking status (mirrors product enum)
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'pawreport_global_tracking_status'
      and n.nspname = 'public'
  ) then
    create type public.pawreport_global_tracking_status as enum (
      'PRE_WALK',
      'ACTIVE_TRACKING',
      'PAUSED_BREAK',
      'COMPLETED',
      'FLAGGED_ALERT',
      'ARCHIVED'
    );
  end if;
end $$;

alter table public.booking_visit_sessions
  add column if not exists admin_notes text,
  add column if not exists flagged_at timestamptz,
  add column if not exists last_gps_at timestamptz,
  add column if not exists archived_at timestamptz;

-- Prefer text + check so older clients stay flexible if enum cast fails mid-deploy
alter table public.booking_visit_sessions
  add column if not exists global_tracking_status text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'booking_visit_sessions_global_tracking_status_check'
  ) then
    alter table public.booking_visit_sessions
      add constraint booking_visit_sessions_global_tracking_status_check
      check (
        global_tracking_status is null
        or global_tracking_status in (
          'PRE_WALK',
          'ACTIVE_TRACKING',
          'PAUSED_BREAK',
          'COMPLETED',
          'FLAGGED_ALERT',
          'ARCHIVED'
        )
      );
  end if;
end $$;

update public.booking_visit_sessions
set global_tracking_status = case
  when status = 'completed' then 'COMPLETED'
  when status = 'canceled' then 'ARCHIVED'
  when status = 'in_progress' then 'ACTIVE_TRACKING'
  else 'PRE_WALK'
end
where global_tracking_status is null;

alter table public.booking_visit_sessions
  alter column global_tracking_status set default 'PRE_WALK';

create index if not exists booking_visit_sessions_global_status_idx
  on public.booking_visit_sessions (global_tracking_status);

create index if not exists booking_visit_sessions_last_gps_at_idx
  on public.booking_visit_sessions (last_gps_at);

-- Optional mirror on walk tracks for fast live queries
alter table public.booking_walk_tracks
  add column if not exists last_gps_at timestamptz,
  add column if not exists global_tracking_status text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'booking_walk_tracks_global_tracking_status_check'
  ) then
    alter table public.booking_walk_tracks
      add constraint booking_walk_tracks_global_tracking_status_check
      check (
        global_tracking_status is null
        or global_tracking_status in (
          'PRE_WALK',
          'ACTIVE_TRACKING',
          'PAUSED_BREAK',
          'COMPLETED',
          'FLAGGED_ALERT',
          'ARCHIVED'
        )
      );
  end if;
end $$;

create index if not exists booking_walk_tracks_global_status_idx
  on public.booking_walk_tracks (global_tracking_status);

-- Lightweight admin audit for overrides / flags
create table if not exists public.pawreport_admin_audit (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null,
  session_id uuid references public.booking_visit_sessions (id) on delete set null,
  admin_user_id uuid not null,
  action text not null,
  detail text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists pawreport_admin_audit_booking_created_idx
  on public.pawreport_admin_audit (booking_id, created_at desc);
