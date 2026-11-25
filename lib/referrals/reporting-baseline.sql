-- Referral Tracking 2.0, applied to SitGuru Supabase via a tracked migration.
-- This file documents the applied schema; a reset is ACTIVATE-ONLY and
-- INSERTS a new epoch separately after all dependent web builds pass.
-- No historical referral, reward, booking, account, or payout row is touched.
create table if not exists public.referral_reporting_epochs (
  id bigint generated always as identity primary key,
  started_at timestamptz not null default now(),
  label text not null,
  reason text not null,
  initiated_by text not null,
  historic_counts jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint referral_epoch_label_nonempty check (length(btrim(label)) between 1 and 120),
  constraint referral_epoch_reason_nonempty check (length(btrim(reason)) between 1 and 500)
);
create index if not exists referral_reporting_epochs_started_at_desc_idx on public.referral_reporting_epochs (started_at desc);
alter table public.referral_reporting_epochs enable row level security;
revoke all on public.referral_reporting_epochs from public, anon, authenticated;
grant select on public.referral_reporting_epochs to service_role;
