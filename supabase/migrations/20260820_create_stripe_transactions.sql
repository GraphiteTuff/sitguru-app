-- Restore public.stripe_transactions for Rogue/admin financial snapshots.
-- Mirrors the existing stripe_balance_transactions ledger pattern.
-- Service-role only (RLS on, no anon/authenticated policies).

begin;

create extension if not exists pgcrypto;

create table if not exists public.stripe_transactions (
  id uuid primary key default gen_random_uuid(),
  stripe_transaction_id text not null,
  stripe_charge_id text null,
  stripe_payment_intent_id text null,
  stripe_balance_transaction_id text null,
  stripe_customer_id text null,
  stripe_payout_external_id text null,
  booking_id text null,
  type text null,
  status text null,
  description text null,
  amount numeric not null default 0,
  fee numeric not null default 0,
  net numeric not null default 0,
  amount_cents bigint not null default 0,
  fee_cents bigint not null default 0,
  net_cents bigint not null default 0,
  currency text not null default 'usd',
  available_on date null,
  created_stripe_at timestamptz null,
  reconciliation_status text not null default 'unmatched',
  matched_reconciliation_id uuid null,
  metadata jsonb not null default '{}'::jsonb,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stripe_transactions_stripe_transaction_id_key
    unique (stripe_transaction_id)
);

create index if not exists stripe_transactions_created_at_idx
  on public.stripe_transactions (created_at desc);

create index if not exists stripe_transactions_created_stripe_at_idx
  on public.stripe_transactions (created_stripe_at desc);

create index if not exists stripe_transactions_type_status_idx
  on public.stripe_transactions (type, status);

create index if not exists stripe_transactions_payment_intent_idx
  on public.stripe_transactions (stripe_payment_intent_id);

create index if not exists stripe_transactions_charge_idx
  on public.stripe_transactions (stripe_charge_id);

create index if not exists stripe_transactions_balance_txn_idx
  on public.stripe_transactions (stripe_balance_transaction_id);

create index if not exists stripe_transactions_reconciliation_idx
  on public.stripe_transactions (reconciliation_status);

alter table public.stripe_transactions enable row level security;

comment on table public.stripe_transactions is
  'Mirrored Stripe charge/balance activity for admin financial snapshots. Service-role only.';

-- Ensure PostgREST picks up the new relation immediately.
notify pgrst, 'reload schema';

commit;
