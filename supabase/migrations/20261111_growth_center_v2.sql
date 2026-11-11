-- Growth Center 2.0 — additive analytics settings, goals, social connectors, imports.
-- Backward compatible. No drops. Service-role writes; authenticated staff reads via app APIs.

create table if not exists public.growth_center_settings (
  flag_key text primary key,
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid null
);

insert into public.growth_center_settings (flag_key, enabled, metadata)
values (
  'growth_center_v2',
  true,
  jsonb_build_object('timezone', 'America/New_York', 'rollout', 'production')
)
on conflict (flag_key) do nothing;

create table if not exists public.growth_weekly_goals (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  metric_id text not null,
  target numeric not null check (target >= 0),
  owner_label text not null default 'Growth team',
  owner_user_id uuid null,
  audience_scope text not null default 'team'
    check (audience_scope in ('team', 'manager', 'intern', 'admin', 'campaign')),
  campaign_id uuid null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  status text not null default 'active'
    check (status in ('active', 'completed', 'cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end > period_start)
);

create index if not exists growth_weekly_goals_period_idx
  on public.growth_weekly_goals (period_start, period_end);

create index if not exists growth_weekly_goals_metric_idx
  on public.growth_weekly_goals (metric_id);

create table if not exists public.growth_social_connections (
  id uuid primary key default gen_random_uuid(),
  platform text not null
    check (platform in ('facebook', 'instagram', 'tiktok', 'youtube', 'x')),
  status text not null default 'not_configured'
    check (status in ('connected', 'manual', 'not_configured', 'error')),
  account_label text null,
  -- Encrypted/provider tokens must never be selected by browser clients.
  token_ciphertext text null,
  token_expires_at timestamptz null,
  scopes text[] not null default '{}',
  last_synced_at timestamptz null,
  error_message text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform)
);

create table if not exists public.growth_metric_imports (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  source_filename text null,
  checksum text null,
  row_count integer not null default 0,
  period_start date null,
  period_end date null,
  imported_by uuid null,
  status text not null default 'received'
    check (status in ('received', 'processed', 'rejected')),
  notes text null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists growth_metric_imports_platform_idx
  on public.growth_metric_imports (platform, created_at desc);

-- Helpful indexes for Growth Center first-party queries (safe if already present).
create index if not exists growth_campaign_events_created_at_idx
  on public.growth_campaign_events (created_at desc);

create index if not exists growth_campaign_events_type_created_idx
  on public.growth_campaign_events (event_type, created_at desc);

create index if not exists growth_campaign_events_campaign_created_idx
  on public.growth_campaign_events (campaign_id, created_at desc);

alter table public.growth_center_settings enable row level security;
alter table public.growth_weekly_goals enable row level security;
alter table public.growth_social_connections enable row level security;
alter table public.growth_metric_imports enable row level security;

-- No direct anon/authenticated policies: staff access goes through Next.js APIs with service role.
-- Super Admin / Manager / Intern authorization is enforced in application code.
