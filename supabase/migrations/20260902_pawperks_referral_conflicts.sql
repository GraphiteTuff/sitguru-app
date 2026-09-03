-- Admin Referrals / PawPerks inventory conflict ledger.
-- Service-role only. Hub and inventory read this table.

begin;

create table if not exists public.pawperks_referral_conflicts (
  id uuid primary key default gen_random_uuid(),
  referral_code text null,
  conflict_key text null,
  conflict_type text not null default 'duplicate',
  status text not null default 'open',
  notes text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pawperks_referral_conflicts_status_idx
  on public.pawperks_referral_conflicts (status, created_at desc);

alter table public.pawperks_referral_conflicts enable row level security;

revoke all on table public.pawperks_referral_conflicts from anon, authenticated;

commit;
