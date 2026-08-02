-- SitGuru admin + financial audit log tables for CPA/security trail.
-- Service-role writes only; authenticated clients cannot read/write directly.

begin;

create extension if not exists pgcrypto;

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid null,
  actor_email text null,
  actor_role text null,
  action text not null,
  area text null,
  target_type text null,
  target_id text null,
  severity text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.financial_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid null,
  actor_email text null,
  actor_role text null,
  action text not null,
  area text null,
  target_type text null,
  target_id text null,
  severity text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_at_idx
  on public.admin_audit_logs (created_at desc);

create index if not exists admin_audit_logs_actor_id_idx
  on public.admin_audit_logs (actor_id);

create index if not exists admin_audit_logs_action_idx
  on public.admin_audit_logs (action);

create index if not exists admin_audit_logs_area_idx
  on public.admin_audit_logs (area);

create index if not exists financial_audit_logs_created_at_idx
  on public.financial_audit_logs (created_at desc);

create index if not exists financial_audit_logs_actor_id_idx
  on public.financial_audit_logs (actor_id);

create index if not exists financial_audit_logs_action_idx
  on public.financial_audit_logs (action);

create index if not exists financial_audit_logs_area_idx
  on public.financial_audit_logs (area);

alter table public.admin_audit_logs enable row level security;
alter table public.financial_audit_logs enable row level security;

-- No policies for anon/authenticated: only service role (supabaseAdmin) can access.

comment on table public.admin_audit_logs is
  'SitGuru admin action trail. Service-role only.';

comment on table public.financial_audit_logs is
  'SitGuru financial export/statement trail. Service-role only.';

commit;
