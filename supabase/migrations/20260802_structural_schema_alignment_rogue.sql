-- SitGuru structural schema alignment for Rogue admin reporting
-- Safe / idempotent. Aligns missing tables + columns that admin-reporting.ts expects.
-- Project uses Supabase SQL (no Prisma). Apply via Supabase SQL editor or CLI.

begin;

create extension if not exists pgcrypto;

-- =============================================================================
-- 1) BOOKINGS — ensure reporting amount / service / tax / cancel columns
-- =============================================================================

do $$
begin
  if to_regclass('public.bookings') is not null then
    alter table public.bookings
      add column if not exists amount numeric,
      add column if not exists total_amount numeric,
      add column if not exists subtotal_amount numeric,
      add column if not exists customer_total_amount numeric,
      add column if not exists tax_amount numeric,
      add column if not exists service_name text,
      add column if not exists service_type text,
      add column if not exists cancellation_reason text,
      add column if not exists status text,
      add column if not exists created_at timestamptz default now(),
      add column if not exists updated_at timestamptz default now();

    -- Backfill amount from known dollar columns when empty.
    update public.bookings
    set amount = coalesce(
      amount,
      total_amount,
      customer_total_amount,
      subtotal_amount,
      0
    )
    where amount is null;

    update public.bookings
    set service_name = coalesce(nullif(btrim(service_name), ''), nullif(btrim(service_type), ''), service_name)
    where coalesce(nullif(btrim(service_name), ''), '') = ''
      and coalesce(nullif(btrim(service_type), ''), '') <> '';
  end if;
end $$;

-- =============================================================================
-- 2) PAYMENTS — canonical ledger + Rogue-facing compatibility surface
-- =============================================================================

create table if not exists public.booking_payments (
  id uuid primary key default gen_random_uuid(),
  booking_id text null,
  provider text not null default 'stripe',
  currency text not null default 'usd',
  status text not null default 'pending',
  amount_cents bigint not null default 0,
  marketplace_support_cents bigint not null default 0,
  tax_cents bigint not null default 0,
  tip_cents bigint not null default 0,
  subtotal_cents bigint not null default 0,
  refund_amount_cents bigint not null default 0,
  dispute_amount_cents bigint not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.booking_payments
  add column if not exists booking_id text,
  add column if not exists provider text default 'stripe',
  add column if not exists currency text default 'usd',
  add column if not exists status text default 'pending',
  add column if not exists amount_cents bigint default 0,
  add column if not exists marketplace_support_cents bigint default 0,
  add column if not exists tax_cents bigint default 0,
  add column if not exists tip_cents bigint default 0,
  add column if not exists subtotal_cents bigint default 0,
  add column if not exists refund_amount_cents bigint default 0,
  add column if not exists dispute_amount_cents bigint default 0,
  add column if not exists fee_amount numeric,
  add column if not exists amount numeric,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- Keep dollar mirrors for Rogue / legacy selects.
update public.booking_payments
set
  amount = coalesce(amount, round((coalesce(amount_cents, 0)::numeric / 100.0), 2)),
  fee_amount = coalesce(
    fee_amount,
    round((coalesce(marketplace_support_cents, 0)::numeric / 100.0), 2)
  )
where amount is null or fee_amount is null;

-- Physical payments table (Rogue + financial modules). Mirrors booking_payments.
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id text null,
  status text not null default 'pending',
  amount numeric not null default 0,
  fee_amount numeric not null default 0,
  processing_fee numeric not null default 0,
  amount_cents bigint not null default 0,
  provider text not null default 'stripe',
  currency text not null default 'usd',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments
  add column if not exists booking_id text,
  add column if not exists status text default 'pending',
  add column if not exists amount numeric default 0,
  add column if not exists fee_amount numeric default 0,
  add column if not exists processing_fee numeric default 0,
  add column if not exists amount_cents bigint default 0,
  add column if not exists provider text default 'stripe',
  add column if not exists currency text default 'usd',
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- Seed payments from booking_payments when empty / missing ids.
insert into public.payments (
  id,
  booking_id,
  status,
  amount,
  fee_amount,
  processing_fee,
  amount_cents,
  provider,
  currency,
  metadata,
  created_at,
  updated_at
)
select
  bp.id,
  bp.booking_id,
  coalesce(nullif(bp.status, ''), 'pending'),
  coalesce(bp.amount, round((coalesce(bp.amount_cents, 0)::numeric / 100.0), 2), 0),
  coalesce(bp.fee_amount, round((coalesce(bp.marketplace_support_cents, 0)::numeric / 100.0), 2), 0),
  coalesce(bp.fee_amount, round((coalesce(bp.marketplace_support_cents, 0)::numeric / 100.0), 2), 0),
  coalesce(bp.amount_cents, 0),
  coalesce(nullif(bp.provider, ''), 'stripe'),
  coalesce(nullif(bp.currency, ''), 'usd'),
  coalesce(bp.metadata, '{}'::jsonb),
  coalesce(bp.created_at, now()),
  coalesce(bp.updated_at, now())
from public.booking_payments bp
on conflict (id) do nothing;

create index if not exists payments_created_at_idx on public.payments (created_at desc);
create index if not exists payments_status_idx on public.payments (status);

-- =============================================================================
-- 3) PAYOUTS + GURU_PAYOUTS
-- =============================================================================

create table if not exists public.guru_payouts (
  id uuid primary key default gen_random_uuid(),
  guru_id uuid null,
  booking_id text null,
  amount_cents bigint not null default 0,
  amount numeric not null default 0,
  currency text not null default 'usd',
  status text not null default 'pending',
  payout_status text null,
  stripe_transfer_id text null,
  transaction_reference text null,
  scheduled_for timestamptz null,
  released_at timestamptz null,
  paid_at timestamptz null,
  failure_reason text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.guru_payouts
  add column if not exists guru_id uuid,
  add column if not exists booking_id text,
  add column if not exists amount_cents bigint default 0,
  add column if not exists amount numeric default 0,
  add column if not exists currency text default 'usd',
  add column if not exists status text default 'pending',
  add column if not exists payout_status text,
  add column if not exists stripe_transfer_id text,
  add column if not exists transaction_reference text,
  add column if not exists scheduled_for timestamptz,
  add column if not exists released_at timestamptz,
  add column if not exists paid_at timestamptz,
  add column if not exists failure_reason text,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.guru_payouts
set amount = coalesce(
  nullif(amount, 0),
  round((coalesce(amount_cents, 0)::numeric / 100.0), 2),
  amount,
  0
)
where coalesce(amount, 0) = 0 and coalesce(amount_cents, 0) <> 0;

create index if not exists guru_payouts_created_at_idx on public.guru_payouts (created_at desc);
create index if not exists guru_payouts_status_idx on public.guru_payouts (status);

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  party_type text null,
  party_id uuid null,
  guru_id uuid null,
  booking_id text null,
  amount_cents bigint not null default 0,
  amount numeric not null default 0,
  payout_amount numeric null,
  currency text not null default 'usd',
  status text not null default 'pending',
  provider text null,
  scheduled_for timestamptz null,
  paid_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payouts
  add column if not exists party_type text,
  add column if not exists party_id uuid,
  add column if not exists guru_id uuid,
  add column if not exists booking_id text,
  add column if not exists amount_cents bigint default 0,
  add column if not exists amount numeric default 0,
  add column if not exists payout_amount numeric,
  add column if not exists currency text default 'usd',
  add column if not exists status text default 'pending',
  add column if not exists provider text,
  add column if not exists scheduled_for timestamptz,
  add column if not exists paid_at timestamptz,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.payouts
set
  amount = coalesce(nullif(amount, 0), payout_amount, round((coalesce(amount_cents, 0)::numeric / 100.0), 2), 0),
  payout_amount = coalesce(payout_amount, amount, round((coalesce(amount_cents, 0)::numeric / 100.0), 2))
where coalesce(amount, 0) = 0 or payout_amount is null;

create index if not exists payouts_created_at_idx on public.payouts (created_at desc);
create index if not exists payouts_status_idx on public.payouts (status);

-- =============================================================================
-- 4) AUDIT — entity_type + ensure financial_audit_logs structure
-- =============================================================================

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid null,
  actor_email text null,
  actor_role text null,
  action text not null,
  area text null,
  target_type text null,
  target_id text null,
  entity_type text null,
  severity text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.financial_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid null,
  actor_email text null,
  actor_role text null,
  action text not null,
  area text null,
  target_type text null,
  target_id text null,
  entity_type text null,
  severity text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_logs
  add column if not exists actor_id uuid,
  add column if not exists actor_email text,
  add column if not exists actor_role text,
  add column if not exists action text,
  add column if not exists area text,
  add column if not exists target_type text,
  add column if not exists target_id text,
  add column if not exists entity_type text,
  add column if not exists severity text,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now();

alter table public.financial_audit_logs
  add column if not exists actor_id uuid,
  add column if not exists actor_email text,
  add column if not exists actor_role text,
  add column if not exists action text,
  add column if not exists area text,
  add column if not exists target_type text,
  add column if not exists target_id text,
  add column if not exists entity_type text,
  add column if not exists severity text,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now();

update public.admin_audit_logs
set entity_type = coalesce(nullif(entity_type, ''), target_type)
where coalesce(nullif(entity_type, ''), '') = '';

update public.financial_audit_logs
set entity_type = coalesce(nullif(entity_type, ''), target_type)
where coalesce(nullif(entity_type, ''), '') = '';

create index if not exists admin_audit_logs_entity_type_idx
  on public.admin_audit_logs (entity_type);

create index if not exists financial_audit_logs_entity_type_idx
  on public.financial_audit_logs (entity_type);

alter table public.admin_audit_logs enable row level security;
alter table public.financial_audit_logs enable row level security;

-- =============================================================================
-- 5) LIVE WALKS / TRUST QUEUES — Rogue names + PawReport bridges
-- =============================================================================

-- Ensure PawReport sources exist (no-op if already created).
create table if not exists public.booking_visit_sessions (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid null,
  guru_id uuid null,
  status text not null default 'not_started',
  started_at timestamptz null,
  ended_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.booking_walk_tracks (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid null,
  session_id uuid null,
  guru_id uuid null,
  status text not null default 'in_progress',
  started_at timestamptz null,
  ended_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.booking_walk_track_points (
  id uuid primary key default gen_random_uuid(),
  walk_track_id uuid null,
  booking_id uuid null,
  session_id uuid null,
  guru_id uuid null,
  lat double precision null,
  lng double precision null,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Rogue-facing physical tables (also usable as write targets).
create table if not exists public.live_walks (
  id uuid primary key default gen_random_uuid(),
  booking_id text null,
  guru_id uuid null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.live_walks
  add column if not exists booking_id text,
  add column if not exists guru_id uuid,
  add column if not exists status text default 'active',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create table if not exists public.walk_sessions (
  id uuid primary key default gen_random_uuid(),
  booking_id text null,
  guru_id uuid null,
  status text not null default 'in_progress',
  check_in_at timestamptz null,
  check_out_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.walk_sessions
  add column if not exists booking_id text,
  add column if not exists guru_id uuid,
  add column if not exists status text default 'in_progress',
  add column if not exists check_in_at timestamptz,
  add column if not exists check_out_at timestamptz,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create table if not exists public.gps_events (
  id uuid primary key default gen_random_uuid(),
  walk_id uuid null,
  booking_id text null,
  event_type text not null default 'point',
  lat double precision null,
  lng double precision null,
  created_at timestamptz not null default now()
);

alter table public.gps_events
  add column if not exists walk_id uuid,
  add column if not exists booking_id text,
  add column if not exists event_type text default 'point',
  add column if not exists lat double precision,
  add column if not exists lng double precision,
  add column if not exists created_at timestamptz default now();

-- Bridge existing PawReport rows into Rogue tables (idempotent by id).
insert into public.live_walks (id, booking_id, guru_id, status, created_at, updated_at)
select
  t.id,
  t.booking_id::text,
  t.guru_id,
  case
    when lower(coalesce(t.status, '')) in ('in_progress', 'active', 'live', 'started') then 'active'
    else coalesce(nullif(t.status, ''), 'active')
  end,
  coalesce(t.created_at, now()),
  coalesce(t.updated_at, now())
from public.booking_walk_tracks t
on conflict (id) do nothing;

insert into public.walk_sessions (id, booking_id, guru_id, status, check_in_at, check_out_at, created_at, updated_at)
select
  s.id,
  s.booking_id::text,
  s.guru_id,
  case
    when lower(coalesce(s.status, '')) = 'in_progress' then 'in_progress'
    when lower(coalesce(s.status, '')) = 'completed' then 'completed'
    else coalesce(nullif(s.status, ''), 'in_progress')
  end,
  s.started_at,
  s.ended_at,
  coalesce(s.created_at, now()),
  coalesce(s.updated_at, now())
from public.booking_visit_sessions s
on conflict (id) do nothing;

insert into public.gps_events (id, walk_id, booking_id, event_type, lat, lng, created_at)
select
  p.id,
  p.walk_track_id,
  p.booking_id::text,
  'point',
  p.lat,
  p.lng,
  coalesce(p.recorded_at, now())
from public.booking_walk_track_points p
on conflict (id) do nothing;

create table if not exists public.moderation_flags (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'open',
  subject_type text null,
  subject_id text null,
  reason text null,
  severity text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.moderation_flags
  add column if not exists status text default 'open',
  add column if not exists subject_type text,
  add column if not exists subject_id text,
  add column if not exists reason text,
  add column if not exists severity text,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create table if not exists public.fraud_flags (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'open',
  subject_type text null,
  subject_id text null,
  reason text null,
  severity text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.fraud_flags
  add column if not exists status text default 'open',
  add column if not exists subject_type text,
  add column if not exists subject_id text,
  add column if not exists reason text,
  add column if not exists severity text,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create index if not exists moderation_flags_created_at_idx on public.moderation_flags (created_at desc);
create index if not exists fraud_flags_created_at_idx on public.fraud_flags (created_at desc);
create index if not exists live_walks_status_idx on public.live_walks (status);
create index if not exists walk_sessions_created_at_idx on public.walk_sessions (created_at desc);
create index if not exists gps_events_created_at_idx on public.gps_events (created_at desc);

comment on table public.payments is
  'Rogue/admin payment ledger surface. Seeded from booking_payments; amount is dollars.';
comment on table public.guru_payouts is
  'Guru payout roster with amount + amount_cents for release + Rogue reporting.';
comment on table public.payouts is
  'Shared platform payout queue for Rogue financial modules.';
comment on table public.live_walks is
  'Rogue live-walk pulse table; bridged from booking_walk_tracks.';
comment on table public.walk_sessions is
  'Rogue walk session table; bridged from booking_visit_sessions.';
comment on table public.gps_events is
  'Rogue GPS event sample table; bridged from booking_walk_track_points.';
comment on table public.moderation_flags is
  'Trust & safety moderation queue for Rogue System Audit.';
comment on table public.fraud_flags is
  'Trust & safety fraud queue for Rogue System Audit.';

commit;
