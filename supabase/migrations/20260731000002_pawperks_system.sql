-- =============================================================================
-- PawPerks loyalty ledger (behavior rewards + checkout redemption)
-- Rule: 100 points = $1.00 USD cash discount value
-- Keeps referral pawperks_* tables untouched.
-- =============================================================================

create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'pawperk_source_type'
      and n.nspname = 'public'
  ) then
    create type public.pawperk_source_type as enum (
      'GURU_REWARD',
      'BOOKING_REDEMPTION',
      'SIGNUP_BONUS',
      'ADMIN_DEBIT',
      'ADMIN_CREDIT'
    );
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- pet_parent_perks — one balance row per Pet Parent profile
-- ---------------------------------------------------------------------------

create table if not exists public.pet_parent_perks (
  parent_id uuid primary key references auth.users (id) on delete cascade,
  points_balance integer not null default 0,
  lifetime_earned integer not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  constraint pet_parent_perks_balance_nonneg
    check (points_balance >= 0),
  constraint pet_parent_perks_lifetime_nonneg
    check (lifetime_earned >= 0)
);

create index if not exists pet_parent_perks_balance_idx
  on public.pet_parent_perks (points_balance desc);

comment on table public.pet_parent_perks is
  'PawPerks loyalty vault — 100 points redeem for $1.00 USD at checkout.';

-- ---------------------------------------------------------------------------
-- pawperk_transactions — immutable-ish ledger of earn / redeem events
-- ---------------------------------------------------------------------------

create table if not exists public.pawperk_transactions (
  transaction_id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references auth.users (id) on delete cascade,
  points_delta integer not null,
  source_type public.pawperk_source_type not null,
  booking_id text null,
  memo text null,
  awarded_by_guru_id uuid null references auth.users (id) on delete set null,
  payment_intent_id text null,
  created_at timestamptz not null default now(),

  constraint pawperk_transactions_delta_nonzero
    check (points_delta <> 0)
);

create index if not exists pawperk_transactions_parent_created_idx
  on public.pawperk_transactions (parent_id, created_at desc);

create index if not exists pawperk_transactions_booking_idx
  on public.pawperk_transactions (booking_id)
  where booking_id is not null;

create index if not exists pawperk_transactions_source_idx
  on public.pawperk_transactions (source_type, created_at desc);

-- At most one active redemption hold per booking (re-created intents reverse prior hold in app code)
create unique index if not exists pawperk_transactions_booking_redemption_unique
  on public.pawperk_transactions (booking_id)
  where source_type = 'BOOKING_REDEMPTION' and booking_id is not null;

comment on table public.pawperk_transactions is
  'PawPerks ledger — positive deltas earn, negative deltas redeem.';

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.set_pet_parent_perks_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_pet_parent_perks_updated_at on public.pet_parent_perks;
create trigger trg_pet_parent_perks_updated_at
  before update on public.pet_parent_perks
  for each row
  execute function public.set_pet_parent_perks_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — parents read own vault; writes go through service role APIs
-- ---------------------------------------------------------------------------

alter table public.pet_parent_perks enable row level security;
alter table public.pawperk_transactions enable row level security;

drop policy if exists pet_parent_perks_select_own on public.pet_parent_perks;
create policy pet_parent_perks_select_own
  on public.pet_parent_perks
  for select
  to authenticated
  using (parent_id = auth.uid());

drop policy if exists pawperk_transactions_select_own on public.pawperk_transactions;
create policy pawperk_transactions_select_own
  on public.pawperk_transactions
  for select
  to authenticated
  using (parent_id = auth.uid());
