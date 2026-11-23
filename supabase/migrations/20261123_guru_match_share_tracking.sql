-- SitGuru Community Studio | Guru Match & Share
-- Dedicated campaign attribution; no raw visitor IPs, emails or browser fingerprints.
-- All writes and staff reporting go through role-checked server routes only.
create table if not exists public.guru_match_share_campaigns (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (length(code) between 16 and 48 and code ~ '^[A-Za-z0-9_-]+$'),
  guru_id uuid not null references public.gurus(id) on delete restrict,
  created_by_user_id uuid not null,
  intern_id uuid null,
  city text not null check (length(city) between 2 and 90),
  state text not null check (state ~ '^[A-Z]{2}$'),
  radius_miles integer not null check (radius_miles between 1 and 50),
  service_key text not null check (length(service_key) between 3 and 60),
  pet_type text not null check (pet_type in ('any','dog','cat')),
  channel text not null check (channel in ('facebook','instagram','tiktok','x','other')),
  reply_text text not null check (length(reply_text) between 30 and 1000),
  status text not null default 'pending_review'
    check (status in ('pending_review','approved','rejected','archived')),
  approved_by_user_id uuid null,
  approved_at timestamptz null,
  shared_reported_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists guru_match_shares_recent_idx
  on public.guru_match_share_campaigns (created_at desc);
create index if not exists guru_match_shares_creator_idx
  on public.guru_match_share_campaigns (created_by_user_id, created_at desc);
create index if not exists guru_match_shares_guru_idx
  on public.guru_match_share_campaigns (guru_id);

create table if not exists public.guru_match_share_events (
  id uuid primary key default gen_random_uuid(),
  share_id uuid not null references public.guru_match_share_campaigns(id) on delete cascade,
  event_type text not null check (event_type in (
    'link_open','qr_open','profile_click','inquiry_click','copy_intent','shared_reported'
  )),
  source text not null default 'unknown' check (source in (
    'facebook','instagram','tiktok','x','qr','other','unknown'
  )),
  created_at timestamptz not null default now()
);
create index if not exists guru_match_share_events_time_idx
  on public.guru_match_share_events (created_at desc);
create index if not exists guru_match_share_events_share_idx
  on public.guru_match_share_events (share_id, created_at desc);

alter table public.guru_match_share_campaigns enable row level security;
alter table public.guru_match_share_events enable row level security;
revoke all on public.guru_match_share_campaigns from anon, authenticated;
revoke all on public.guru_match_share_events from anon, authenticated;
grant select, insert, update, delete on public.guru_match_share_campaigns to service_role;
grant select, insert, update, delete on public.guru_match_share_events to service_role;
-- Sequences are not used: UUID defaults only.
