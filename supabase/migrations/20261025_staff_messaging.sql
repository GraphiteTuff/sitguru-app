-- Additive staff messaging fields. Existing marketplace rows stay conversation_type = marketplace.

begin;

alter table public.conversations add column if not exists conversation_type text not null default 'marketplace';
alter table public.conversations add column if not exists workflow_status text not null default 'open';
alter table public.conversations add column if not exists assigned_user_id uuid;
alter table public.conversations add column if not exists assigned_by uuid;
alter table public.conversations add column if not exists assigned_at timestamptz;
alter table public.conversations add column if not exists review_required boolean not null default false;
alter table public.conversations add column if not exists escalation_reason text not null default '';
alter table public.conversations add column if not exists linked_entity_type text not null default '';
alter table public.conversations add column if not exists linked_entity_id text not null default '';
alter table public.conversations add column if not exists retention_class text not null default 'standard';
alter table public.conversations add column if not exists legal_hold boolean not null default false;

alter table public.messages add column if not exists visibility text not null default 'participant';
alter table public.messages add column if not exists deleted_at timestamptz;
alter table public.messages add column if not exists edited_at timestamptz;

create table if not exists public.message_versions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null,
  body text not null default '',
  editor_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.message_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid,
  conversation_id uuid,
  reporter_id uuid,
  reason text not null default '',
  status text not null default 'open',
  route_to text not null default 'moderation_queue',
  created_at timestamptz not null default now()
);

create table if not exists public.messaging_permissions (
  user_id uuid primary key,
  permission_level text not null default 'none',
  review_level text not null default 'all',
  audiences text not null default '',
  updated_by uuid,
  updated_at timestamptz not null default now()
);

create table if not exists public.messaging_moderation_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_role text not null default '',
  action text not null,
  report_id uuid,
  conversation_id uuid,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.messaging_policy_acknowledgments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  policy_version text not null,
  acknowledged_at timestamptz not null default now()
);

alter table public.message_versions enable row level security;
alter table public.message_reports enable row level security;
alter table public.messaging_permissions enable row level security;
alter table public.messaging_moderation_events enable row level security;
alter table public.messaging_policy_acknowledgments enable row level security;

revoke all on table public.message_versions from anon, authenticated;
revoke all on table public.message_reports from anon, authenticated;
revoke all on table public.messaging_permissions from anon, authenticated;
revoke all on table public.messaging_moderation_events from anon, authenticated;
revoke all on table public.messaging_policy_acknowledgments from anon, authenticated;

commit;
