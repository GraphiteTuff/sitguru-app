-- SitGuru social platform metrics — live follower baselines for Rogue / Delilah.
-- Used by lib/services/socialMediaClient.ts + fetchLiveSocialFollowers AI tool.
-- Service-role reads/writes; RLS denies client access.

begin;

create extension if not exists pgcrypto;

create table if not exists public.social_platform_metrics (
  id uuid primary key default gen_random_uuid(),
  -- Brand entity uses 'sitguru-brand'; ambassadors use ambassador UUID or handle:<slug>
  entity_id text not null,
  platform text not null
    check (platform in ('instagram', 'facebook', 'tiktok', 'x')),
  handle text not null default 'SitGuruOfficial',
  current_followers integer not null default 0
    check (current_followers >= 0),
  baseline_followers_start_of_day integer not null default 0
    check (baseline_followers_start_of_day >= 0),
  -- UTC calendar date the baseline was stamped (midnight roll-forward)
  baseline_date date not null default ((timezone('utc', now()))::date),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (entity_id, platform, handle)
);

create index if not exists social_platform_metrics_entity_idx
  on public.social_platform_metrics (entity_id);

create index if not exists social_platform_metrics_platform_idx
  on public.social_platform_metrics (platform, handle);

create index if not exists social_platform_metrics_baseline_date_idx
  on public.social_platform_metrics (baseline_date);

comment on table public.social_platform_metrics is
  'Live + midnight-baseline social follower counts for SitGuru brand and ambassadors (Rogue/Delilah tools).';

comment on column public.social_platform_metrics.entity_id is
  'Brand key (sitguru-brand) or ambassador id / handle:<slug>.';

comment on column public.social_platform_metrics.baseline_followers_start_of_day is
  'Follower count at the start of the UTC day; used for new-followers-today deltas.';

alter table public.social_platform_metrics enable row level security;

-- Deny anon/authenticated direct access; service role bypasses RLS.
drop policy if exists social_platform_metrics_deny_all on public.social_platform_metrics;
create policy social_platform_metrics_deny_all
  on public.social_platform_metrics
  for all
  to anon, authenticated
  using (false)
  with check (false);

-- Seed brand rows for @SitGuruOfficial (counts filled by sync / tool calls).
insert into public.social_platform_metrics (
  entity_id,
  platform,
  handle,
  current_followers,
  baseline_followers_start_of_day,
  baseline_date
)
values
  ('sitguru-brand', 'instagram', 'SitGuruOfficial', 0, 0, (timezone('utc', now()))::date),
  ('sitguru-brand', 'facebook', 'SitGuruOfficial', 0, 0, (timezone('utc', now()))::date),
  ('sitguru-brand', 'tiktok', 'SitGuruOfficial', 0, 0, (timezone('utc', now()))::date),
  ('sitguru-brand', 'x', 'SitGuruOfficial', 0, 0, (timezone('utc', now()))::date)
on conflict (entity_id, platform, handle) do nothing;

commit;
