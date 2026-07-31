-- PawReport / live visit schema
-- Aligns with existing app code that reads/writes:
--   booking_visit_sessions, booking_visit_updates,
--   booking_walk_tracks, booking_walk_track_points
-- Safe to run repeatedly (IF NOT EXISTS).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Visit session = one PawReport per booking
-- Links booking ↔ assigned guru ↔ customer (via bookings ownership columns)
-- ---------------------------------------------------------------------------
create table if not exists public.booking_visit_sessions (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null,
  guru_id uuid not null,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'completed', 'canceled')),
  started_at timestamptz,
  ended_at timestamptz,
  start_lat double precision,
  start_lng double precision,
  start_accuracy double precision,
  end_lat double precision,
  end_lng double precision,
  end_accuracy double precision,
  final_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists booking_visit_sessions_booking_id_uidx
  on public.booking_visit_sessions (booking_id);

create index if not exists booking_visit_sessions_guru_id_idx
  on public.booking_visit_sessions (guru_id);

-- ---------------------------------------------------------------------------
-- Timeline updates: food / water / potty / medication / photo / notes / walk
-- ---------------------------------------------------------------------------
create table if not exists public.booking_visit_updates (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.booking_visit_sessions (id) on delete cascade,
  booking_id uuid not null,
  update_type text not null,
  note text,
  photo_url text,
  lat double precision,
  lng double precision,
  accuracy double precision,
  created_at timestamptz not null default now()
);

create index if not exists booking_visit_updates_booking_id_created_idx
  on public.booking_visit_updates (booking_id, created_at);

create index if not exists booking_visit_updates_session_id_idx
  on public.booking_visit_updates (session_id);

-- ---------------------------------------------------------------------------
-- Active / completed walk tracks with aggregate metrics
-- ---------------------------------------------------------------------------
create table if not exists public.booking_walk_tracks (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null,
  session_id uuid references public.booking_visit_sessions (id) on delete set null,
  guru_id uuid not null,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'paused', 'completed', 'canceled')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  start_lat double precision,
  start_lng double precision,
  end_lat double precision,
  end_lng double precision,
  total_distance_meters numeric not null default 0,
  total_duration_seconds integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists booking_walk_tracks_booking_id_idx
  on public.booking_walk_tracks (booking_id);

create index if not exists booking_walk_tracks_session_status_idx
  on public.booking_walk_tracks (session_id, status);

-- ---------------------------------------------------------------------------
-- GPS path coordinates for walk maps
-- ---------------------------------------------------------------------------
create table if not exists public.booking_walk_track_points (
  id uuid primary key default gen_random_uuid(),
  walk_track_id uuid not null references public.booking_walk_tracks (id) on delete cascade,
  booking_id uuid not null,
  session_id uuid,
  guru_id uuid not null,
  lat double precision not null,
  lng double precision not null,
  accuracy double precision,
  recorded_at timestamptz not null default now()
);

create index if not exists booking_walk_track_points_track_recorded_idx
  on public.booking_walk_track_points (walk_track_id, recorded_at);

-- Optional: enable realtime for Pet Parent live polling / subscriptions
-- alter publication supabase_realtime add table public.booking_visit_updates;
-- alter publication supabase_realtime add table public.booking_walk_tracks;
-- alter publication supabase_realtime add table public.booking_walk_track_points;
