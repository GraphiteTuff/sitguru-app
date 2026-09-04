-- Provider-neutral accounting connections for Tax Center (QuickBooks + Wave).
-- Service-role writes only. Tokens are stored encrypted by the app.

begin;

create table if not exists public.accounting_provider_catalog (
  provider text primary key,
  provider_name text not null,
  logo_url text null,
  pricing_note text not null default '',
  support_url text not null default '',
  connect_url text not null default '',
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.accounting_provider_catalog (
  provider, provider_name, pricing_note, support_url, connect_url, enabled
) values
  (
    'quickbooks',
    'QuickBooks Online',
    'Intuit subscription required for a live QuickBooks Online company.',
    'https://quickbooks.intuit.com',
    '/api/admin/financials/quickbooks/connect',
    true
  ),
  (
    'wave',
    'Wave Accounting',
    'Wave Pro is required for direct API connection. Check Wave for current pricing.',
    'https://www.waveapps.com/tax-season',
    '/api/tax/wave/connect',
    true
  )
on conflict (provider) do update set
  provider_name = excluded.provider_name,
  pricing_note = excluded.pricing_note,
  support_url = excluded.support_url,
  connect_url = excluded.connect_url,
  updated_at = now();

create table if not exists public.accounting_oauth_states (
  state text primary key,
  provider text not null,
  organization_id text not null default 'sitguru',
  actor_id uuid null,
  actor_email text null,
  return_path text not null default '/admin/financials/tax-reports',
  created_at timestamptz not null default now()
);

create table if not exists public.accounting_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null default 'sitguru',
  provider text not null,
  provider_business_id text null,
  provider_business_name text null,
  access_token_encrypted text null,
  refresh_token_encrypted text null,
  token_expires_at timestamptz null,
  scopes text null,
  status text not null default 'disconnected',
  last_sync_at timestamptz null,
  last_sync_status text null,
  last_sync_error text null,
  connected_by uuid null,
  connected_email text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider)
);

create table if not exists public.accounting_account_mappings (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null default 'sitguru',
  provider text not null,
  sitguru_account_key text not null,
  sitguru_account_name text not null,
  provider_account_id text null,
  provider_account_name text null,
  provider_account_type text null,
  mapping_source text not null default 'suggested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider, sitguru_account_key)
);

create table if not exists public.accounting_events (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null default 'sitguru',
  booking_id text null,
  payment_id text null,
  event_type text not null,
  event_date date not null,
  gross_service_amount numeric(12,2) not null default 0,
  sales_tax numeric(12,2) not null default 0,
  tip numeric(12,2) not null default 0,
  guru_payout numeric(12,2) not null default 0,
  refund_amount numeric(12,2) not null default 0,
  payment_processing_cost numeric(12,2) not null default 0,
  other_expense numeric(12,2) not null default 0,
  currency text not null default 'USD',
  provider_sync_status text not null default 'pending',
  source_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, source_key)
);

create table if not exists public.accounting_sync_records (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null default 'sitguru',
  provider text not null,
  accounting_event_id uuid null references public.accounting_events(id) on delete set null,
  external_id text not null,
  sync_status text not null default 'ok',
  sync_error text null,
  synced_at timestamptz not null default now(),
  unique (organization_id, provider, external_id)
);

create table if not exists public.organization_tax_profiles (
  organization_id text primary key,
  legal_entity text not null,
  dba text not null,
  tax_classification text not null,
  tax_year integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_tax_owners (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organization_tax_profiles(organization_id) on delete cascade,
  owner_name text not null,
  ownership_percent numeric(5,2) not null,
  display_order integer not null default 0,
  unique (organization_id, owner_name)
);

create table if not exists public.tax_professional_handoffs (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null default 'sitguru',
  tax_year integer not null,
  tax_professional_name text null,
  tax_professional_firm text null,
  tax_professional_email text null,
  date_sent timestamptz null,
  return_status text not null default 'not_started',
  notes text null,
  updated_by_email text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, tax_year)
);

insert into public.organization_tax_profiles (
  organization_id, legal_entity, dba, tax_classification, tax_year
) values (
  'sitguru', 'Graff Enterprises LLC', 'SitGuru', 'Partnership', extract(year from now())::integer
) on conflict (organization_id) do nothing;

insert into public.organization_tax_owners (
  organization_id, owner_name, ownership_percent, display_order
) values
  ('sitguru', 'Jason Graff', 81.00, 1),
  ('sitguru', 'Danette Graff', 19.00, 2)
on conflict (organization_id, owner_name) do nothing;

insert into public.tax_professional_handoffs (
  organization_id, tax_year, return_status
) values (
  'sitguru', extract(year from now())::integer, 'not_started'
) on conflict (organization_id, tax_year) do nothing;

create index if not exists accounting_oauth_states_created_at_idx
  on public.accounting_oauth_states (created_at desc);

create index if not exists accounting_connections_provider_status_idx
  on public.accounting_connections (provider, status);

create index if not exists accounting_events_date_idx
  on public.accounting_events (event_date desc);

create index if not exists accounting_sync_records_provider_idx
  on public.accounting_sync_records (provider, synced_at desc);

alter table public.accounting_provider_catalog enable row level security;
alter table public.accounting_oauth_states enable row level security;
alter table public.accounting_connections enable row level security;
alter table public.accounting_account_mappings enable row level security;
alter table public.accounting_events enable row level security;
alter table public.accounting_sync_records enable row level security;
alter table public.organization_tax_profiles enable row level security;
alter table public.organization_tax_owners enable row level security;
alter table public.tax_professional_handoffs enable row level security;

revoke all on public.accounting_provider_catalog from anon, authenticated;
revoke all on public.accounting_oauth_states from anon, authenticated;
revoke all on public.accounting_connections from anon, authenticated;
revoke all on public.accounting_account_mappings from anon, authenticated;
revoke all on public.accounting_events from anon, authenticated;
revoke all on public.accounting_sync_records from anon, authenticated;
revoke all on public.organization_tax_profiles from anon, authenticated;
revoke all on public.organization_tax_owners from anon, authenticated;
revoke all on public.tax_professional_handoffs from anon, authenticated;

comment on table public.accounting_connections is
  'Encrypted OAuth tokens for Tax Center accounting providers. Service-role only. QuickBooks live tokens remain in admin_quickbooks_connections.';

commit;
