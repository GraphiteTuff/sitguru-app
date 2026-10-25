-- Growth Workspace outcome layer (measurement + decision support).
-- Does NOT store Planner-style tasks, assignments, checklists, or workflow buckets.
-- Optional microsoft_* columns reserved for future Graph integration (unused in V1).

begin;

create table if not exists public.growth_initiatives (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  purpose text not null default '',
  status text not null default 'active',
  market text not null default '',
  start_on date null,
  end_on date null,
  notes text not null default '',
  -- Future Microsoft extensibility only (do not populate with fake IDs)
  microsoft_planner_plan_id text null,
  microsoft_planner_bucket_ref text null,
  microsoft_teams_channel_ref text null,
  microsoft_sharepoint_folder_ref text null,
  created_by_email text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists growth_initiatives_status_idx
  on public.growth_initiatives (status, updated_at desc);

alter table public.growth_initiatives enable row level security;
revoke all on table public.growth_initiatives from anon, authenticated;

create table if not exists public.growth_event_results (
  id uuid primary key default gen_random_uuid(),
  community_event_id uuid null,
  event_name text not null,
  event_date date null,
  location text not null default '',
  event_type text not null default 'community',
  status text not null default 'completed',
  objective text not null default '',
  target_audiences text not null default '',
  pet_parent_leads integer not null default 0,
  guru_leads integer not null default 0,
  ambassador_leads integer not null default 0,
  qr_scans integer not null default 0,
  pet_parent_registrations integer not null default 0,
  guru_registrations integer not null default 0,
  ambassador_registrations integer not null default 0,
  follow_up_count integer not null default 0,
  notes text not null default '',
  lessons_learned text not null default '',
  recommended_next_action text not null default '',
  -- manual | system | mixed — offline metrics are expected at events
  leads_metric_source text not null default 'manual',
  registrations_metric_source text not null default 'manual',
  qr_scans_metric_source text not null default 'manual',
  microsoft_planner_task_ref text null,
  recorded_by_email text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists growth_event_results_date_idx
  on public.growth_event_results (event_date desc nulls last, created_at desc);

alter table public.growth_event_results enable row level security;
revoke all on table public.growth_event_results from anon, authenticated;

create table if not exists public.growth_intelligence_entries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  study_type text not null default 'survey',
  audience text not null default '',
  objective text not null default '',
  response_count integer not null default 0,
  key_finding text not null default '',
  business_interpretation text not null default '',
  recommendation text not null default '',
  action_taken text not null default '',
  follow_up_test text not null default '',
  status text not null default 'recorded',
  tested_on date null,
  microsoft_teams_channel_ref text null,
  created_by_email text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists growth_intelligence_tested_idx
  on public.growth_intelligence_entries (tested_on desc nulls last, created_at desc);

alter table public.growth_intelligence_entries enable row level security;
revoke all on table public.growth_intelligence_entries from anon, authenticated;

-- Outcome fields on campaigns when the table already exists (tracking links stay).
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'growth_campaigns'
  ) then
    execute 'alter table public.growth_campaigns add column if not exists purpose text not null default ''''';
    execute 'alter table public.growth_campaigns add column if not exists target_audience text not null default ''''';
    execute 'alter table public.growth_campaigns add column if not exists target_kpi text not null default ''''';
    execute 'alter table public.growth_campaigns add column if not exists actual_result text not null default ''''';
    execute 'alter table public.growth_campaigns add column if not exists registrations_generated integer not null default 0';
    execute 'alter table public.growth_campaigns add column if not exists referral_activity text not null default ''''';
    execute 'alter table public.growth_campaigns add column if not exists conversion_note text not null default ''''';
    execute 'alter table public.growth_campaigns add column if not exists key_finding text not null default ''''';
    execute 'alter table public.growth_campaigns add column if not exists recommendation text not null default ''''';
    execute 'alter table public.growth_campaigns add column if not exists microsoft_planner_bucket_ref text null';
  end if;
end $$;

commit;
