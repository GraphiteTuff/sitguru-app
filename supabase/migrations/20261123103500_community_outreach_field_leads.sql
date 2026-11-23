-- SitGuru field encounters -> assigned, auditable community-growth relationships.
-- Existing outreach records and commitments remain intact.
begin;

alter table public.manager_work_outreach
  add column if not exists created_by_user_id uuid null,
  add column if not exists assigned_to_user_id uuid null,
  add column if not exists lead_source text not null default 'Manual',
  add column if not exists city text not null default '',
  add column if not exists state text not null default '',
  add column if not exists street_address text not null default '',
  add column if not exists phone text not null default '',
  add column if not exists email text not null default '',
  add column if not exists website text not null default '',
  add column if not exists social_url text not null default '',
  add column if not exists interests text[] not null default '{}'::text[],
  add column if not exists priority text not null default 'Normal',
  add column if not exists outcome_type text not null default '',
  add column if not exists last_contacted_at timestamptz null,
  add column if not exists closed_at timestamptz null,
  add column if not exists updated_at timestamptz not null default now();

-- Existing manager-owned records become assigned to their prior owner.
update public.manager_work_outreach
set assigned_to_user_id = owner_user_id, created_by_user_id = owner_user_id
where assigned_to_user_id is null or created_by_user_id is null;

create index if not exists manager_work_outreach_assignee_followup_idx
  on public.manager_work_outreach (assigned_to_user_id, follow_up_on);
create index if not exists manager_work_outreach_market_idx
  on public.manager_work_outreach (state, city, created_at desc);
create index if not exists manager_work_outreach_status_idx
  on public.manager_work_outreach (status, updated_at desc);

create table if not exists public.manager_work_outreach_activity (
  id uuid primary key default gen_random_uuid(),
  outreach_id uuid not null references public.manager_work_outreach(id) on delete cascade,
  actor_user_id uuid null,
  activity_type text not null default 'note',
  previous_status text not null default '',
  new_status text not null default '',
  note text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists manager_work_outreach_activity_recent_idx
  on public.manager_work_outreach_activity (outreach_id, created_at desc);

-- Contact details, team notes, and private introductions are never public Data API tables.
alter table public.manager_work_outreach enable row level security;
alter table public.manager_work_outreach_activity enable row level security;
revoke all on public.manager_work_outreach from anon, authenticated;
revoke all on public.manager_work_outreach_activity from anon, authenticated;

commit;
