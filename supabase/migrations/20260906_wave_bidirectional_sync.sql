-- Optional Wave ledger snapshots. Sync still works with accounting_events +
-- accounting_sync_records if this table is not applied yet.

begin;

create table if not exists public.accounting_wave_ledger (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null default 'sitguru',
  provider_transaction_id text not null,
  external_id text not null default '',
  txn_date date null,
  description text not null default '',
  account_name text not null default '',
  direction text not null default '',
  amount numeric(12,2) not null default 0,
  origin text not null default 'wave_pull',
  payload jsonb not null default '{}'::jsonb,
  pulled_at timestamptz not null default now(),
  unique (organization_id, provider_transaction_id)
);

alter table public.accounting_wave_ledger enable row level security;
revoke all on public.accounting_wave_ledger from anon, authenticated;

create index if not exists accounting_wave_ledger_date_idx
  on public.accounting_wave_ledger (txn_date desc);

comment on table public.accounting_wave_ledger is
  'Wave transaction snapshots for Tax Center bidirectional sync. Service-role only.';

commit;
