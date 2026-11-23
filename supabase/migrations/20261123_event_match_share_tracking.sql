-- SitGuru Community Studio | Event Match & Share
-- Attribution counts only, no IP addresses, visitor identifiers or device fingerprints.
-- Campaign creation, approval and reporting are restricted to server-verified growth staff.
create table if not exists public.event_match_share_campaigns (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (length(code) between 16 and 48 and code ~ '^[A-Za-z0-9_-]+$'),
  event_id uuid not null,
  event_slug text not null check (length(event_slug) between 3 and 240),
  event_title text not null check (length(event_title) between 2 and 240),
  event_start_at timestamptz not null,
  city text,
  state text,
  created_by_user_id uuid not null,
  intern_id uuid,
  channel text not null check (channel in ('facebook','instagram','tiktok','x','other')),
  target_group text not null default '' check (length(target_group) <= 120),
  reply_text text not null check (length(reply_text) between 20 and 1400),
  status text not null default 'pending_review'
    check (status in ('pending_review','approved','rejected','archived')),
  approved_by_user_id uuid,
  approved_at timestamptz,
  shared_reported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists event_match_share_creator_idx on public.event_match_share_campaigns (created_by_user_id,created_at desc);
create index if not exists event_match_share_event_idx on public.event_match_share_campaigns (event_id);
create index if not exists event_match_share_date_idx on public.event_match_share_campaigns (created_at desc);

create table if not exists public.event_match_share_events (
  id uuid primary key default gen_random_uuid(),
  share_id uuid not null references public.event_match_share_campaigns(id) on delete cascade,
  event_type text not null check (event_type in ('link_open','qr_open','event_click','copy_intent','shared_reported')),
  source text not null check (source in ('facebook','instagram','tiktok','x','qr','other')),
  actor_user_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists event_match_events_share_idx on public.event_match_share_events (share_id,created_at desc);
create index if not exists event_match_events_date_idx on public.event_match_share_events (created_at desc);

alter table public.event_match_share_campaigns enable row level security;
alter table public.event_match_share_events enable row level security;
revoke all on public.event_match_share_campaigns from anon,authenticated;
revoke all on public.event_match_share_events from anon,authenticated;
grant select,insert,update,delete on public.event_match_share_campaigns to service_role;
grant select,insert,update,delete on public.event_match_share_events to service_role;
