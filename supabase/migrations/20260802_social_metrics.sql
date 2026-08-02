-- SitGuru social platform metrics for brand + AI persona tracking (Rogue / Delilah).
-- Written by cron + service-role scripts; RLS denies client access.

begin;

create extension if not exists pgcrypto;

create table if not exists public.social_platform_metrics (
  id uuid primary key default gen_random_uuid(),
  entity_id text not null,
  platform text not null,
  current_followers integer not null default 0,
  baseline_followers integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint social_platform_metrics_followers_nonneg
    check (current_followers >= 0 and baseline_followers >= 0),
  constraint social_platform_metrics_entity_platform_unique
    unique (entity_id, platform)
);

create index if not exists social_platform_metrics_entity_idx
  on public.social_platform_metrics (entity_id);

create index if not exists social_platform_metrics_platform_idx
  on public.social_platform_metrics (platform);

create index if not exists social_platform_metrics_updated_at_idx
  on public.social_platform_metrics (updated_at desc);

alter table public.social_platform_metrics enable row level security;

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
