-- Assignment links to Planner, SharePoint, Teams, and Canva.
-- SitGuru remains the internship record. Secrets are never stored here.

begin;

create table if not exists public.assignment_integrations (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.internship_tasks(id) on delete cascade,
  provider text not null check (provider in ('planner', 'sharepoint', 'teams', 'canva')),
  external_id text not null default '',
  external_parent_id text not null default '',
  external_url text not null default '',
  status text not null default 'not_configured',
  last_synced_at timestamptz null,
  last_error text not null default '',
  external_etag text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, provider)
);

create index if not exists assignment_integrations_assignment_idx
  on public.assignment_integrations (assignment_id);

create table if not exists public.microsoft_user_links (
  user_id uuid primary key,
  entra_object_id text not null default '',
  user_principal_name text not null default '',
  status text not null default 'needs_access',
  updated_at timestamptz not null default now()
);

alter table public.assignment_integrations enable row level security;
alter table public.microsoft_user_links enable row level security;
revoke all on table public.assignment_integrations from anon, authenticated;
revoke all on table public.microsoft_user_links from anon, authenticated;

commit;
