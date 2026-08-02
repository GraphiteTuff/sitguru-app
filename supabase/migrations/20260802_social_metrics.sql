-- SitGuru social platform metrics for brand + AI persona tracking (Rogue / Delilah).
-- Written by cron + service-role scripts; RLS denies client access.
-- Idempotent: safe to re-run when an older partial table already exists.

begin;

create extension if not exists pgcrypto;

create table if not exists public.social_platform_metrics (
  id uuid primary key default gen_random_uuid(),
  entity_id text not null,
  platform text not null,
  current_followers integer not null default 0,
  baseline_followers integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Rename legacy / mistyped column names onto the canonical layout FIRST,
-- before ADD COLUMN IF NOT EXISTS (which would otherwise create duplicates).
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'social_platform_metrics'
      and column_name = 'baseline_followers_start_of_day'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'social_platform_metrics'
      and column_name = 'baseline_followers'
  ) then
    alter table public.social_platform_metrics
      rename column baseline_followers_start_of_day to baseline_followers;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'social_platform_metrics'
      and column_name = 'current_followers_count'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'social_platform_metrics'
      and column_name = 'current_followers'
  ) then
    alter table public.social_platform_metrics
      rename column current_followers_count to current_followers;
  end if;
end $$;

-- Upgrade path: older partial tables may exist without these columns
-- (CREATE TABLE IF NOT EXISTS will not add them). Ensure exact names exist.
alter table public.social_platform_metrics
  add column if not exists entity_id text;

alter table public.social_platform_metrics
  add column if not exists platform text;

alter table public.social_platform_metrics
  add column if not exists current_followers integer not null default 0;

alter table public.social_platform_metrics
  add column if not exists baseline_followers integer not null default 0;

alter table public.social_platform_metrics
  add column if not exists updated_at timestamptz not null default now();

-- Backfill nulls before enforcing non-null + check constraints on upgrades.
update public.social_platform_metrics
set
  current_followers = coalesce(current_followers, 0),
  baseline_followers = coalesce(baseline_followers, 0),
  updated_at = coalesce(updated_at, now())
where current_followers is null
   or baseline_followers is null
   or updated_at is null;

do $$
begin
  alter table public.social_platform_metrics
    alter column current_followers set default 0,
    alter column current_followers set not null,
    alter column baseline_followers set default 0,
    alter column baseline_followers set not null,
    alter column updated_at set default now(),
    alter column updated_at set not null;
exception
  when others then
    -- Keep migration resilient if prior constraints already match.
    null;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'social_platform_metrics_followers_nonneg'
      and conrelid = 'public.social_platform_metrics'::regclass
  ) then
    alter table public.social_platform_metrics
      add constraint social_platform_metrics_followers_nonneg
      check (current_followers >= 0 and baseline_followers >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'social_platform_metrics_entity_platform_unique'
      and conrelid = 'public.social_platform_metrics'::regclass
  ) then
    alter table public.social_platform_metrics
      add constraint social_platform_metrics_entity_platform_unique
      unique (entity_id, platform);
  end if;
end $$;

create index if not exists social_platform_metrics_entity_idx
  on public.social_platform_metrics (entity_id);

create index if not exists social_platform_metrics_platform_idx
  on public.social_platform_metrics (platform);

create index if not exists social_platform_metrics_updated_at_idx
  on public.social_platform_metrics (updated_at desc);

alter table public.social_platform_metrics enable row level security;

-- Comments use the same exact column names as CREATE / ADD COLUMN above.
comment on table public.social_platform_metrics is
  'Live + baseline follower counts per entity/platform for Rogue, Delilah, and brand social tracking. Service-role only.';

comment on column public.social_platform_metrics.entity_id is
  'Logical owner key, e.g. brand, rogue, delilah, or an ambassador id.';

comment on column public.social_platform_metrics.platform is
  'Social network id: instagram, facebook, tiktok, x, youtube.';

comment on column public.social_platform_metrics.current_followers is
  'Most recently observed follower count from the social APIs (or safe fallback).';

comment on column public.social_platform_metrics.baseline_followers is
  'Locked baseline used for delta growth reporting.';

commit;
