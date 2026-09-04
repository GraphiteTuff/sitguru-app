-- SitGuru Tax Center QuickBooks Online OAuth tokens.
-- Service-role writes only; authenticated clients cannot read tokens.

begin;

create table if not exists public.admin_quickbooks_oauth_states (
  state text primary key,
  actor_id uuid null,
  actor_email text null,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_quickbooks_connections (
  id uuid primary key default gen_random_uuid(),
  realm_id text not null unique,
  company_name text null,
  environment text not null default 'sandbox',
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamptz not null,
  refresh_expires_at timestamptz null,
  connected_by uuid null,
  connected_email text null,
  last_pushed_at timestamptz null,
  last_push_doc_number text null,
  last_push_journal_id text null,
  last_push_error text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_quickbooks_oauth_states_created_at_idx
  on public.admin_quickbooks_oauth_states (created_at desc);

create index if not exists admin_quickbooks_connections_updated_at_idx
  on public.admin_quickbooks_connections (updated_at desc);

alter table public.admin_quickbooks_oauth_states enable row level security;
alter table public.admin_quickbooks_connections enable row level security;

revoke all on public.admin_quickbooks_oauth_states from anon, authenticated;
revoke all on public.admin_quickbooks_connections from anon, authenticated;

comment on table public.admin_quickbooks_connections is
  'Intuit OAuth tokens for SitGuru Tax Center QuickBooks push. Service-role only.';

commit;
