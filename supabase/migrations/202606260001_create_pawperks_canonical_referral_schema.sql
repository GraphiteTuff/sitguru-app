-- PawPerks canonical referral schema.
--
-- This migration records the schema that was already applied manually in Supabase.
-- It intentionally does not backfill, mutate, or remove any legacy referral data.

create table if not exists public.pawperks_account_referral_codes (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  code text not null,
  code_normalized text generated always as (lower(trim(code))) stored,
  program text not null default 'pawperks',
  status text not null default 'active',
  source text not null default 'canonical',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,
  metadata jsonb not null default '{}'::jsonb
);

alter table public.pawperks_account_referral_codes
  drop constraint if exists pawperks_account_referral_codes_status_check;

alter table public.pawperks_account_referral_codes
  add constraint pawperks_account_referral_codes_status_check
  check (status in ('active', 'inactive', 'retired'));

alter table public.pawperks_account_referral_codes
  drop constraint if exists pawperks_account_referral_codes_program_check;

alter table public.pawperks_account_referral_codes
  add constraint pawperks_account_referral_codes_program_check
  check (program = 'pawperks');

create unique index if not exists pawperks_account_referral_codes_account_id_key
  on public.pawperks_account_referral_codes(account_id);

create unique index if not exists pawperks_account_referral_codes_code_normalized_key
  on public.pawperks_account_referral_codes(code_normalized);

create index if not exists pawperks_account_referral_codes_status_idx
  on public.pawperks_account_referral_codes(status);

create index if not exists pawperks_account_referral_codes_created_at_idx
  on public.pawperks_account_referral_codes(created_at desc);

create table if not exists public.pawperks_referral_code_aliases (
  id uuid primary key default gen_random_uuid(),
  referral_code_id uuid not null references public.pawperks_account_referral_codes(id) on delete cascade,
  alias_code text not null,
  alias_code_normalized text generated always as (lower(trim(alias_code))) stored,
  alias_type text not null default 'legacy',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  created_by uuid,
  metadata jsonb not null default '{}'::jsonb
);

alter table public.pawperks_referral_code_aliases
  drop constraint if exists pawperks_referral_code_aliases_status_check;

alter table public.pawperks_referral_code_aliases
  add constraint pawperks_referral_code_aliases_status_check
  check (status in ('active', 'inactive', 'retired'));

alter table public.pawperks_referral_code_aliases
  drop constraint if exists pawperks_referral_code_aliases_alias_type_check;

alter table public.pawperks_referral_code_aliases
  add constraint pawperks_referral_code_aliases_alias_type_check
  check (alias_type in ('legacy', 'vanity', 'imported', 'manual'));

create unique index if not exists pawperks_referral_code_aliases_alias_code_normalized_key
  on public.pawperks_referral_code_aliases(alias_code_normalized);

create index if not exists pawperks_referral_code_aliases_referral_code_id_idx
  on public.pawperks_referral_code_aliases(referral_code_id);

create index if not exists pawperks_referral_code_aliases_status_idx
  on public.pawperks_referral_code_aliases(status);

create table if not exists public.pawperks_referral_events (
  id uuid primary key default gen_random_uuid(),
  referral_code_id uuid references public.pawperks_account_referral_codes(id) on delete set null,
  referrer_account_id uuid,
  referred_account_id uuid,
  referral_code text,
  referral_code_normalized text generated always as (lower(trim(referral_code))) stored,
  event_type text not null,
  event_source text,
  event_at timestamptz not null default now(),
  request_path text,
  session_id text,
  ip_hash text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.pawperks_referral_events
  drop constraint if exists pawperks_referral_events_event_type_check;

alter table public.pawperks_referral_events
  add constraint pawperks_referral_events_event_type_check
  check (event_type in ('click', 'signup_started', 'signup_completed', 'account_created', 'qualified', 'reward_pending', 'reward_approved', 'reward_declined'));

create index if not exists pawperks_referral_events_referral_code_id_idx
  on public.pawperks_referral_events(referral_code_id);

create index if not exists pawperks_referral_events_referrer_account_id_idx
  on public.pawperks_referral_events(referrer_account_id);

create index if not exists pawperks_referral_events_referred_account_id_idx
  on public.pawperks_referral_events(referred_account_id);

create index if not exists pawperks_referral_events_referral_code_normalized_idx
  on public.pawperks_referral_events(referral_code_normalized);

create index if not exists pawperks_referral_events_event_type_idx
  on public.pawperks_referral_events(event_type);

create index if not exists pawperks_referral_events_event_at_idx
  on public.pawperks_referral_events(event_at desc);

create table if not exists public.pawperks_referral_backfill_audit (
  id uuid primary key default gen_random_uuid(),
  backfill_name text not null,
  legacy_source text,
  legacy_record_id text,
  referral_code_id uuid references public.pawperks_account_referral_codes(id) on delete set null,
  referral_event_id uuid references public.pawperks_referral_events(id) on delete set null,
  action text not null,
  status text not null default 'recorded',
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid
);

create index if not exists pawperks_referral_backfill_audit_backfill_name_idx
  on public.pawperks_referral_backfill_audit(backfill_name);

create index if not exists pawperks_referral_backfill_audit_legacy_source_idx
  on public.pawperks_referral_backfill_audit(legacy_source, legacy_record_id);

create index if not exists pawperks_referral_backfill_audit_created_at_idx
  on public.pawperks_referral_backfill_audit(created_at desc);

create table if not exists public.pawperks_referral_conflicts (
  id uuid primary key default gen_random_uuid(),
  conflict_type text not null,
  conflict_key text not null,
  canonical_referral_code_id uuid references public.pawperks_account_referral_codes(id) on delete set null,
  conflicting_table text,
  conflicting_record_id text,
  resolution_status text not null default 'open',
  resolution_notes text,
  resolved_at timestamptz,
  resolved_by uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.pawperks_referral_conflicts
  drop constraint if exists pawperks_referral_conflicts_resolution_status_check;

alter table public.pawperks_referral_conflicts
  add constraint pawperks_referral_conflicts_resolution_status_check
  check (resolution_status in ('open', 'reviewing', 'resolved', 'ignored'));

create index if not exists pawperks_referral_conflicts_conflict_key_idx
  on public.pawperks_referral_conflicts(conflict_key);

create index if not exists pawperks_referral_conflicts_resolution_status_idx
  on public.pawperks_referral_conflicts(resolution_status);

create index if not exists pawperks_referral_conflicts_created_at_idx
  on public.pawperks_referral_conflicts(created_at desc);

alter table public.pawperks_account_referral_codes enable row level security;
alter table public.pawperks_referral_code_aliases enable row level security;
alter table public.pawperks_referral_events enable row level security;
alter table public.pawperks_referral_backfill_audit enable row level security;
alter table public.pawperks_referral_conflicts enable row level security;

drop policy if exists "Admins can manage PawPerks account referral codes" on public.pawperks_account_referral_codes;
create policy "Admins can manage PawPerks account referral codes"
  on public.pawperks_account_referral_codes
  for all
  using (public.is_admin_user())
  with check (public.is_admin_user());

drop policy if exists "Owners can read their PawPerks account referral code" on public.pawperks_account_referral_codes;
create policy "Owners can read their PawPerks account referral code"
  on public.pawperks_account_referral_codes
  for select
  using (account_id = auth.uid());

drop policy if exists "Admins can manage PawPerks referral code aliases" on public.pawperks_referral_code_aliases;
create policy "Admins can manage PawPerks referral code aliases"
  on public.pawperks_referral_code_aliases
  for all
  using (public.is_admin_user())
  with check (public.is_admin_user());

drop policy if exists "Owners can read their PawPerks referral code aliases" on public.pawperks_referral_code_aliases;
create policy "Owners can read their PawPerks referral code aliases"
  on public.pawperks_referral_code_aliases
  for select
  using (
    exists (
      select 1
      from public.pawperks_account_referral_codes codes
      where codes.id = pawperks_referral_code_aliases.referral_code_id
        and codes.account_id = auth.uid()
    )
  );

drop policy if exists "Admins can manage PawPerks referral events" on public.pawperks_referral_events;
create policy "Admins can manage PawPerks referral events"
  on public.pawperks_referral_events
  for all
  using (public.is_admin_user())
  with check (public.is_admin_user());

drop policy if exists "Owners can read their PawPerks referral events" on public.pawperks_referral_events;
create policy "Owners can read their PawPerks referral events"
  on public.pawperks_referral_events
  for select
  using (referrer_account_id = auth.uid() or referred_account_id = auth.uid());

drop policy if exists "Admins can manage PawPerks referral backfill audit" on public.pawperks_referral_backfill_audit;
create policy "Admins can manage PawPerks referral backfill audit"
  on public.pawperks_referral_backfill_audit
  for all
  using (public.is_admin_user())
  with check (public.is_admin_user());

drop policy if exists "Admins can manage PawPerks referral conflicts" on public.pawperks_referral_conflicts;
create policy "Admins can manage PawPerks referral conflicts"
  on public.pawperks_referral_conflicts
  for all
  using (public.is_admin_user())
  with check (public.is_admin_user());

create or replace view public.v_account_referral_codes
with (security_invoker = true) as
select
  codes.id,
  codes.account_id,
  codes.code,
  codes.code_normalized,
  codes.program,
  codes.status,
  codes.source,
  codes.created_at,
  codes.updated_at,
  codes.metadata
from public.pawperks_account_referral_codes codes;

create or replace view public.v_account_referral_activity
with (security_invoker = true) as
select
  events.id,
  events.referral_code_id,
  events.referrer_account_id,
  events.referred_account_id,
  events.referral_code,
  events.event_type,
  events.event_source,
  events.event_at,
  events.metadata,
  events.created_at
from public.pawperks_referral_events events;

create or replace view public.v_admin_pawperks_referrals
with (security_invoker = true) as
select
  codes.id as referral_code_id,
  codes.account_id,
  codes.code,
  codes.code_normalized,
  codes.program,
  codes.status,
  codes.source,
  codes.created_at,
  codes.updated_at,
  count(events.id) as total_events,
  count(events.id) filter (where events.event_type = 'click') as click_events,
  count(events.id) filter (where events.event_type in ('signup_completed', 'account_created')) as signup_events,
  max(events.event_at) as last_event_at
from public.pawperks_account_referral_codes codes
left join public.pawperks_referral_events events
  on events.referral_code_id = codes.id
group by
  codes.id,
  codes.account_id,
  codes.code,
  codes.code_normalized,
  codes.program,
  codes.status,
  codes.source,
  codes.created_at,
  codes.updated_at;
