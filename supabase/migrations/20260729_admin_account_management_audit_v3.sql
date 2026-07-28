-- =============================================================================
-- SitGuru Admin Account Management + Audit Trail
-- Migration: 20260729_admin_account_management_audit_v3.sql
--
-- Purpose
--   1. Give SitGuru staff controlled account-management access.
--   2. Track which administrator worked on an account.
--   3. Record before/after data, communication activity, notes, assignments,
--      timestamps, and the page/system that performed the action.
--   4. Preserve an automatic database-level fallback audit when an update is
--      made without using a dedicated Admin RPC.
--   5. Preserve orphaned and deleted-account UUIDs without audit-table FK failures.
--
-- Important application behavior
--   - Admin actions should call public.record_account_lifecycle_event(...)
--     after a successful write and pass the currently authenticated Admin ID.
--   - Automatic triggers remain as a fallback. When a service-role process
--     changes data without an explicit Admin ID, the event is recorded as
--     "System / database".
-- =============================================================================

begin;

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Shared updated_at trigger
-- -----------------------------------------------------------------------------

create or replace function public.sitguru_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Admin access and permissions
-- -----------------------------------------------------------------------------

create table if not exists public.admin_account_permissions (
  user_id uuid primary key references auth.users(id) on delete cascade,

  access_level text not null default 'support'
    check (
      access_level in (
        'super_admin',
        'account_manager',
        'reviewer',
        'support',
        'read_only'
      )
    ),

  permissions jsonb not null default '{}'::jsonb
    check (jsonb_typeof(permissions) = 'object'),

  is_active boolean not null default true,

  display_name text,
  email text,

  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_account_permissions_access_level_idx
  on public.admin_account_permissions(access_level);

create index if not exists admin_account_permissions_active_idx
  on public.admin_account_permissions(is_active)
  where is_active = true;

drop trigger if exists trg_admin_account_permissions_updated_at
  on public.admin_account_permissions;

create trigger trg_admin_account_permissions_updated_at
before update on public.admin_account_permissions
for each row
execute function public.sitguru_touch_updated_at();

create or replace function public.default_admin_permissions(
  p_access_level text
)
returns jsonb
language sql
immutable
as $$
  select case lower(coalesce(p_access_level, 'read_only'))
    when 'super_admin' then jsonb_build_object(
      'view_accounts', true,
      'edit_profiles', true,
      'send_messages', true,
      'add_notes', true,
      'assign_accounts', true,
      'request_completion', true,
      'review_profiles', true,
      'make_visible', true,
      'make_bookable', true,
      'manage_verification', true,
      'merge_accounts', true,
      'archive_accounts', true,
      'manage_admin_access', true,
      'view_audit_history', true,
      'export_data', true
    )
    when 'account_manager' then jsonb_build_object(
      'view_accounts', true,
      'edit_profiles', true,
      'send_messages', true,
      'add_notes', true,
      'assign_accounts', true,
      'request_completion', true,
      'review_profiles', true,
      'make_visible', true,
      'make_bookable', false,
      'manage_verification', false,
      'merge_accounts', false,
      'archive_accounts', false,
      'manage_admin_access', false,
      'view_audit_history', true,
      'export_data', true
    )
    when 'reviewer' then jsonb_build_object(
      'view_accounts', true,
      'edit_profiles', false,
      'send_messages', true,
      'add_notes', true,
      'assign_accounts', false,
      'request_completion', true,
      'review_profiles', true,
      'make_visible', true,
      'make_bookable', false,
      'manage_verification', true,
      'merge_accounts', false,
      'archive_accounts', false,
      'manage_admin_access', false,
      'view_audit_history', true,
      'export_data', false
    )
    when 'support' then jsonb_build_object(
      'view_accounts', true,
      'edit_profiles', false,
      'send_messages', true,
      'add_notes', true,
      'assign_accounts', false,
      'request_completion', true,
      'review_profiles', false,
      'make_visible', false,
      'make_bookable', false,
      'manage_verification', false,
      'merge_accounts', false,
      'archive_accounts', false,
      'manage_admin_access', false,
      'view_audit_history', true,
      'export_data', false
    )
    else jsonb_build_object(
      'view_accounts', true,
      'edit_profiles', false,
      'send_messages', false,
      'add_notes', false,
      'assign_accounts', false,
      'request_completion', false,
      'review_profiles', false,
      'make_visible', false,
      'make_bookable', false,
      'manage_verification', false,
      'merge_accounts', false,
      'archive_accounts', false,
      'manage_admin_access', false,
      'view_audit_history', true,
      'export_data', false
    )
  end;
$$;

create or replace function public.get_sitguru_admin_access_level(
  p_user_id uuid default auth.uid()
)
returns text
language plpgsql
stable
security definer
set search_path = public, auth
set row_security = off
as $$
declare
  v_level text;
  v_profile_role text;
begin
  if p_user_id is null then
    return null;
  end if;

  select aap.access_level
    into v_level
  from public.admin_account_permissions aap
  where aap.user_id = p_user_id
    and aap.is_active = true
  limit 1;

  if v_level is not null then
    return v_level;
  end if;

  select lower(
    coalesce(
      nullif(to_jsonb(p) ->> 'role', ''),
      nullif(to_jsonb(p) ->> 'account_type', ''),
      ''
    )
  )
    into v_profile_role
  from public.profiles p
  where p.id = p_user_id
  limit 1;

  if v_profile_role in ('super_admin', 'owner') then
    return 'super_admin';
  end if;

  if v_profile_role = 'admin' then
    -- Legacy Admin profiles remain fully usable until explicit permission
    -- records are created for each staff member.
    return 'super_admin';
  end if;

  if v_profile_role = 'account_manager' then
    return 'account_manager';
  end if;

  if v_profile_role = 'reviewer' then
    return 'reviewer';
  end if;

  if v_profile_role = 'support' then
    return 'support';
  end if;

  select case
    when exists (
      select 1
      from public.user_roles ur
      where ur.user_id = p_user_id
        and lower(ur.role::text) in ('super_admin', 'owner')
    ) then 'super_admin'
    when exists (
      select 1
      from public.user_roles ur
      where ur.user_id = p_user_id
        and lower(ur.role::text) = 'admin'
    ) then 'super_admin'
    when exists (
      select 1
      from public.user_roles ur
      where ur.user_id = p_user_id
        and lower(ur.role::text) = 'account_manager'
    ) then 'account_manager'
    when exists (
      select 1
      from public.user_roles ur
      where ur.user_id = p_user_id
        and lower(ur.role::text) = 'reviewer'
    ) then 'reviewer'
    when exists (
      select 1
      from public.user_roles ur
      where ur.user_id = p_user_id
        and lower(ur.role::text) = 'support'
    ) then 'support'
    else null
  end
    into v_level;

  return v_level;
end;
$$;

create or replace function public.is_sitguru_admin(
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
set row_security = off
as $$
  select public.get_sitguru_admin_access_level(p_user_id) is not null;
$$;

create or replace function public.is_sitguru_super_admin(
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
set row_security = off
as $$
  select public.get_sitguru_admin_access_level(p_user_id) = 'super_admin';
$$;

create or replace function public.has_sitguru_admin_permission(
  p_permission text,
  p_user_id uuid default auth.uid()
)
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth
set row_security = off
as $$
declare
  v_level text;
  v_permissions jsonb;
begin
  if p_user_id is null or nullif(trim(p_permission), '') is null then
    return false;
  end if;

  select
    aap.access_level,
    aap.permissions
  into
    v_level,
    v_permissions
  from public.admin_account_permissions aap
  where aap.user_id = p_user_id
    and aap.is_active = true
  limit 1;

  if v_level is null then
    v_level := public.get_sitguru_admin_access_level(p_user_id);
    v_permissions := public.default_admin_permissions(v_level);
  end if;

  return coalesce((v_permissions ->> p_permission)::boolean, false);
exception
  when others then
    return false;
end;
$$;

-- Bootstrap existing Admin profiles. Jason remains the initial Super Admin.
insert into public.admin_account_permissions (
  user_id,
  access_level,
  permissions,
  is_active,
  display_name,
  email,
  created_at,
  updated_at
)
select
  au.id,
  case
    when lower(coalesce(au.email, '')) = 'jason@sitguru.com'
      then 'super_admin'
    else 'account_manager'
  end,
  public.default_admin_permissions(
    case
      when lower(coalesce(au.email, '')) = 'jason@sitguru.com'
        then 'super_admin'
      else 'account_manager'
    end
  ),
  true,
  coalesce(
    nullif(to_jsonb(p) ->> 'full_name', ''),
    nullif(to_jsonb(p) ->> 'display_name', ''),
    nullif(to_jsonb(p) ->> 'name', ''),
    nullif(au.raw_user_meta_data ->> 'full_name', ''),
    nullif(au.raw_user_meta_data ->> 'name', ''),
    au.email,
    'SitGuru Admin'
  ),
  au.email,
  now(),
  now()
from auth.users au
left join public.profiles p
  on p.id = au.id
where
  lower(coalesce(au.email, '')) = 'jason@sitguru.com'
  or lower(
    coalesce(
      nullif(to_jsonb(p) ->> 'role', ''),
      nullif(to_jsonb(p) ->> 'account_type', ''),
      ''
    )
  ) in ('admin', 'super_admin', 'owner')
on conflict (user_id) do update
set
  access_level = case
    when lower(coalesce(excluded.email, '')) = 'jason@sitguru.com'
      then 'super_admin'
    else public.admin_account_permissions.access_level
  end,
  permissions = case
    when lower(coalesce(excluded.email, '')) = 'jason@sitguru.com'
      then public.default_admin_permissions('super_admin')
    else public.admin_account_permissions.permissions
  end,
  display_name = excluded.display_name,
  email = excluded.email,
  is_active = true,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- Account assignments
-- -----------------------------------------------------------------------------

create table if not exists public.account_management_assignments (
  id uuid primary key default gen_random_uuid(),

  target_user_id uuid not null references auth.users(id) on delete cascade,
  assigned_admin_user_id uuid references auth.users(id) on delete set null,

  status text not null default 'assigned'
    check (
      status in (
        'assigned',
        'in_progress',
        'waiting_on_user',
        'follow_up',
        'completed',
        'unassigned'
      )
    ),

  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),

  next_follow_up_at timestamptz,
  assignment_note text,

  assigned_by uuid references auth.users(id) on delete set null,
  completed_by uuid references auth.users(id) on delete set null,
  completed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists account_management_assignments_one_active_idx
  on public.account_management_assignments(target_user_id)
  where status not in ('completed', 'unassigned');

create index if not exists account_management_assignments_admin_idx
  on public.account_management_assignments(assigned_admin_user_id, status);

create index if not exists account_management_assignments_follow_up_idx
  on public.account_management_assignments(next_follow_up_at)
  where next_follow_up_at is not null
    and status not in ('completed', 'unassigned');

drop trigger if exists trg_account_management_assignments_updated_at
  on public.account_management_assignments;

create trigger trg_account_management_assignments_updated_at
before update on public.account_management_assignments
for each row
execute function public.sitguru_touch_updated_at();

-- -----------------------------------------------------------------------------
-- Permanent account lifecycle audit events
-- -----------------------------------------------------------------------------

create table if not exists public.account_lifecycle_events (
  id uuid primary key default gen_random_uuid(),

  -- user_id is retained for compatibility with the existing Account Lifecycle
  -- page. target_user_id is the clearer canonical audit-column name.
  user_id uuid,
  target_user_id uuid,
  target_account_type text not null default 'account',
  target_record_id uuid,

  event_type text not null,
  action_label text not null,
  description text,

  actor_user_id uuid,
  actor_name text,
  actor_email text,
  actor_role text,
  actor_type text not null default 'admin'
    check (actor_type in ('admin', 'system', 'user', 'integration')),

  source text not null default 'admin_portal',
  channel text,
  delivery_status text,

  before_data jsonb not null default '{}'::jsonb,
  after_data jsonb not null default '{}'::jsonb,
  changed_fields text[] not null default array[]::text[],
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

-- Compatibility upgrade for an older account_lifecycle_events table.
-- CREATE TABLE IF NOT EXISTS does not add missing columns to an existing table,
-- which is why the original migration stopped on target_user_id.
alter table public.account_lifecycle_events
  add column if not exists user_id uuid,
  add column if not exists target_user_id uuid,
  add column if not exists target_account_type text default 'account',
  add column if not exists target_record_id uuid,
  add column if not exists event_type text,
  add column if not exists action_label text,
  add column if not exists description text,
  add column if not exists actor_user_id uuid,
  add column if not exists actor_name text,
  add column if not exists actor_email text,
  add column if not exists actor_role text,
  add column if not exists actor_type text default 'admin',
  add column if not exists source text default 'admin_portal',
  add column if not exists channel text,
  add column if not exists delivery_status text,
  add column if not exists before_data jsonb default '{}'::jsonb,
  add column if not exists after_data jsonb default '{}'::jsonb,
  add column if not exists changed_fields text[] default array[]::text[],
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now();

-- Audit history must survive deleted, orphaned, or legacy Auth accounts.
-- Remove any pre-existing foreign keys from the audit table before backfilling
-- compatibility columns. The UUID values remain available for investigation.
do $$
declare
  v_constraint record;
begin
  for v_constraint in
    select c.conname
    from pg_constraint c
    join pg_class t
      on t.oid = c.conrelid
    join pg_namespace n
      on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'account_lifecycle_events'
      and c.contype = 'f'
  loop
    execute format(
      'alter table public.account_lifecycle_events drop constraint if exists %I',
      v_constraint.conname
    );
  end loop;
end;
$$;

update public.account_lifecycle_events
set
  target_user_id = coalesce(target_user_id, user_id),
  user_id = coalesce(user_id, target_user_id),
  target_account_type = coalesce(nullif(target_account_type, ''), 'account'),
  event_type = coalesce(nullif(event_type, ''), 'legacy_account_activity'),
  action_label = coalesce(nullif(action_label, ''), 'Legacy account activity'),
  actor_type = coalesce(nullif(actor_type, ''), 'system'),
  source = coalesce(nullif(source, ''), 'legacy'),
  before_data = coalesce(before_data, '{}'::jsonb),
  after_data = coalesce(after_data, '{}'::jsonb),
  changed_fields = coalesce(changed_fields, array[]::text[]),
  metadata = coalesce(metadata, '{}'::jsonb),
  created_at = coalesce(created_at, now());

alter table public.account_lifecycle_events
  alter column target_account_type set default 'account',
  alter column target_account_type set not null,
  alter column event_type set not null,
  alter column action_label set not null,
  alter column actor_type set default 'admin',
  alter column actor_type set not null,
  alter column source set default 'admin_portal',
  alter column source set not null,
  alter column before_data set default '{}'::jsonb,
  alter column before_data set not null,
  alter column after_data set default '{}'::jsonb,
  alter column after_data set not null,
  alter column changed_fields set default array[]::text[],
  alter column changed_fields set not null,
  alter column metadata set default '{}'::jsonb,
  alter column metadata set not null,
  alter column created_at set default now(),
  alter column created_at set not null;

create or replace function public.sync_account_lifecycle_event_user_ids()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.target_user_id := coalesce(new.target_user_id, new.user_id);
  new.user_id := coalesce(new.user_id, new.target_user_id);
  return new;
end;
$$;

drop trigger if exists trg_sync_account_lifecycle_event_user_ids
  on public.account_lifecycle_events;

create trigger trg_sync_account_lifecycle_event_user_ids
before insert or update on public.account_lifecycle_events
for each row
execute function public.sync_account_lifecycle_event_user_ids();

create index if not exists account_lifecycle_events_user_created_idx
  on public.account_lifecycle_events(user_id, created_at desc);

create index if not exists account_lifecycle_events_target_created_idx
  on public.account_lifecycle_events(target_user_id, created_at desc);

create index if not exists account_lifecycle_events_actor_created_idx
  on public.account_lifecycle_events(actor_user_id, created_at desc);

create index if not exists account_lifecycle_events_type_idx
  on public.account_lifecycle_events(event_type, created_at desc);

create index if not exists account_lifecycle_events_source_idx
  on public.account_lifecycle_events(source, created_at desc);

create index if not exists account_lifecycle_events_metadata_gin_idx
  on public.account_lifecycle_events using gin(metadata);

-- -----------------------------------------------------------------------------
-- Internal Admin notes
-- -----------------------------------------------------------------------------

create table if not exists public.account_admin_notes (
  id uuid primary key default gen_random_uuid(),

  target_user_id uuid not null references auth.users(id) on delete cascade,

  note text not null
    check (length(trim(note)) between 1 and 10000),

  note_type text not null default 'general'
    check (
      note_type in (
        'general',
        'follow_up',
        'verification',
        'profile_review',
        'communication',
        'safety',
        'account_repair'
      )
    ),

  is_pinned boolean not null default false,

  created_by uuid references auth.users(id) on delete set null,
  created_by_name text,
  created_by_email text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists account_admin_notes_target_created_idx
  on public.account_admin_notes(target_user_id, created_at desc);

create index if not exists account_admin_notes_pinned_idx
  on public.account_admin_notes(target_user_id, is_pinned)
  where is_pinned = true;

drop trigger if exists trg_account_admin_notes_updated_at
  on public.account_admin_notes;

create trigger trg_account_admin_notes_updated_at
before update on public.account_admin_notes
for each row
execute function public.sitguru_touch_updated_at();

-- -----------------------------------------------------------------------------
-- Resolve an Admin snapshot for event attribution
-- -----------------------------------------------------------------------------

create or replace function public.get_sitguru_actor_snapshot(
  p_user_id uuid
)
returns table (
  actor_name text,
  actor_email text,
  actor_role text
)
language plpgsql
stable
security definer
set search_path = public, auth
set row_security = off
as $$
begin
  if p_user_id is null then
    return query
    select
      'System / database'::text,
      null::text,
      'system'::text;
    return;
  end if;

  return query
  select
    coalesce(
      nullif(to_jsonb(p) ->> 'full_name', ''),
      nullif(to_jsonb(p) ->> 'display_name', ''),
      nullif(to_jsonb(p) ->> 'name', ''),
      nullif(au.raw_user_meta_data ->> 'full_name', ''),
      nullif(au.raw_user_meta_data ->> 'name', ''),
      au.email,
      'SitGuru Admin'
    )::text,
    au.email::text,
    coalesce(
      public.get_sitguru_admin_access_level(p_user_id),
      lower(
        coalesce(
          nullif(to_jsonb(p) ->> 'role', ''),
          nullif(to_jsonb(p) ->> 'account_type', ''),
          'user'
        )
      )
    )::text
  from auth.users au
  left join public.profiles p
    on p.id = au.id
  where au.id = p_user_id
  limit 1;

  if not found then
    return query
    select
      'Unknown user'::text,
      null::text,
      'unknown'::text;
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Central explicit audit logger
-- -----------------------------------------------------------------------------

create or replace function public.record_account_lifecycle_event(
  p_target_user_id uuid,
  p_event_type text,
  p_action_label text,
  p_description text default null,
  p_source text default 'admin_portal',
  p_actor_user_id uuid default null,
  p_target_account_type text default 'account',
  p_target_record_id uuid default null,
  p_before_data jsonb default '{}'::jsonb,
  p_after_data jsonb default '{}'::jsonb,
  p_changed_fields text[] default array[]::text[],
  p_channel text default null,
  p_delivery_status text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
set row_security = off
as $$
declare
  v_caller_user_id uuid := auth.uid();
  v_actor_user_id uuid := coalesce(p_actor_user_id, auth.uid());
  v_actor_name text;
  v_actor_email text;
  v_actor_role text;
  v_actor_type text := 'admin';
  v_event_id uuid;
  v_is_service_role boolean :=
    coalesce(auth.role(), '') = 'service_role'
    or current_user in ('postgres', 'supabase_admin');
begin
  if p_target_user_id is null then
    raise exception 'target user id is required';
  end if;

  if nullif(trim(p_event_type), '') is null then
    raise exception 'event type is required';
  end if;

  if nullif(trim(p_action_label), '') is null then
    raise exception 'action label is required';
  end if;

  if not v_is_service_role then
    if v_caller_user_id is null
       or not public.is_sitguru_admin(v_caller_user_id) then
      raise exception 'SitGuru Admin access is required';
    end if;

    if p_actor_user_id is not null
       and p_actor_user_id is distinct from v_caller_user_id
       and not public.is_sitguru_super_admin(v_caller_user_id) then
      raise exception 'Only a Super Admin may attribute an event to another user';
    end if;
  end if;

  if v_actor_user_id is null then
    v_actor_type := 'system';
  end if;

  select
    snapshot.actor_name,
    snapshot.actor_email,
    snapshot.actor_role
  into
    v_actor_name,
    v_actor_email,
    v_actor_role
  from public.get_sitguru_actor_snapshot(v_actor_user_id) snapshot;

  insert into public.account_lifecycle_events (
    user_id,
    target_user_id,
    target_account_type,
    target_record_id,
    event_type,
    action_label,
    description,
    actor_user_id,
    actor_name,
    actor_email,
    actor_role,
    actor_type,
    source,
    channel,
    delivery_status,
    before_data,
    after_data,
    changed_fields,
    metadata,
    created_at
  )
  values (
    p_target_user_id,
    p_target_user_id,
    coalesce(nullif(trim(p_target_account_type), ''), 'account'),
    p_target_record_id,
    trim(p_event_type),
    trim(p_action_label),
    nullif(trim(coalesce(p_description, '')), ''),
    v_actor_user_id,
    v_actor_name,
    v_actor_email,
    v_actor_role,
    v_actor_type,
    coalesce(nullif(trim(p_source), ''), 'admin_portal'),
    nullif(trim(coalesce(p_channel, '')), ''),
    nullif(trim(coalesce(p_delivery_status, '')), ''),
    coalesce(p_before_data, '{}'::jsonb),
    coalesce(p_after_data, '{}'::jsonb),
    coalesce(p_changed_fields, array[]::text[]),
    coalesce(p_metadata, '{}'::jsonb)
      || jsonb_build_object(
        'caller_user_id', v_caller_user_id,
        'recorded_at', now()
      ),
    now()
  )
  returning id into v_event_id;

  return v_event_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Assignment RPC
-- -----------------------------------------------------------------------------

create or replace function public.assign_sitguru_account_manager(
  p_target_user_id uuid,
  p_assigned_admin_user_id uuid,
  p_status text default 'assigned',
  p_priority text default 'normal',
  p_next_follow_up_at timestamptz default null,
  p_assignment_note text default null,
  p_actor_user_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
set row_security = off
as $$
declare
  v_actor_user_id uuid := coalesce(p_actor_user_id, auth.uid());
  v_old_assignment public.account_management_assignments%rowtype;
  v_new_assignment public.account_management_assignments%rowtype;
begin
  if not (
    coalesce(auth.role(), '') = 'service_role'
    or current_user in ('postgres', 'supabase_admin')
    or public.has_sitguru_admin_permission(
      'assign_accounts',
      coalesce(auth.uid(), v_actor_user_id)
    )
  ) then
    raise exception 'Account assignment permission is required';
  end if;

  select *
    into v_old_assignment
  from public.account_management_assignments ama
  where ama.target_user_id = p_target_user_id
    and ama.status not in ('completed', 'unassigned')
  order by ama.updated_at desc
  limit 1;

  if found then
    update public.account_management_assignments
    set
      status = 'unassigned',
      updated_at = now()
    where id = v_old_assignment.id;
  end if;

  insert into public.account_management_assignments (
    target_user_id,
    assigned_admin_user_id,
    status,
    priority,
    next_follow_up_at,
    assignment_note,
    assigned_by
  )
  values (
    p_target_user_id,
    p_assigned_admin_user_id,
    coalesce(nullif(trim(p_status), ''), 'assigned'),
    coalesce(nullif(trim(p_priority), ''), 'normal'),
    p_next_follow_up_at,
    nullif(trim(coalesce(p_assignment_note, '')), ''),
    v_actor_user_id
  )
  returning * into v_new_assignment;

  perform public.record_account_lifecycle_event(
    p_target_user_id := p_target_user_id,
    p_event_type := 'account_assignment',
    p_action_label := case
      when p_assigned_admin_user_id is null then 'Account unassigned'
      else 'Account manager assigned'
    end,
    p_description := p_assignment_note,
    p_source := 'admin_account_management',
    p_actor_user_id := v_actor_user_id,
    p_before_data := case
      when v_old_assignment.id is null then '{}'::jsonb
      else to_jsonb(v_old_assignment)
    end,
    p_after_data := to_jsonb(v_new_assignment),
    p_changed_fields := array[
      'assigned_admin_user_id',
      'status',
      'priority',
      'next_follow_up_at'
    ]
  );

  return v_new_assignment.id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Admin note RPC
-- -----------------------------------------------------------------------------

create or replace function public.add_sitguru_account_admin_note(
  p_target_user_id uuid,
  p_note text,
  p_note_type text default 'general',
  p_is_pinned boolean default false,
  p_actor_user_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
set row_security = off
as $$
declare
  v_actor_user_id uuid := coalesce(p_actor_user_id, auth.uid());
  v_actor_name text;
  v_actor_email text;
  v_actor_role text;
  v_note_id uuid;
begin
  if nullif(trim(p_note), '') is null then
    raise exception 'note text is required';
  end if;

  if not (
    coalesce(auth.role(), '') = 'service_role'
    or current_user in ('postgres', 'supabase_admin')
    or public.has_sitguru_admin_permission(
      'add_notes',
      coalesce(auth.uid(), v_actor_user_id)
    )
  ) then
    raise exception 'Admin note permission is required';
  end if;

  select
    snapshot.actor_name,
    snapshot.actor_email,
    snapshot.actor_role
  into
    v_actor_name,
    v_actor_email,
    v_actor_role
  from public.get_sitguru_actor_snapshot(v_actor_user_id) snapshot;

  insert into public.account_admin_notes (
    target_user_id,
    note,
    note_type,
    is_pinned,
    created_by,
    created_by_name,
    created_by_email
  )
  values (
    p_target_user_id,
    trim(p_note),
    coalesce(nullif(trim(p_note_type), ''), 'general'),
    coalesce(p_is_pinned, false),
    v_actor_user_id,
    v_actor_name,
    v_actor_email
  )
  returning id into v_note_id;

  perform public.record_account_lifecycle_event(
    p_target_user_id := p_target_user_id,
    p_event_type := 'admin_note',
    p_action_label := 'Admin note added',
    p_description := trim(p_note),
    p_source := 'admin_account_management',
    p_actor_user_id := v_actor_user_id,
    p_after_data := jsonb_build_object(
      'note_id', v_note_id,
      'note_type', p_note_type,
      'is_pinned', p_is_pinned
    ),
    p_changed_fields := array['admin_note'],
    p_metadata := jsonb_build_object(
      'actor_role', v_actor_role
    )
  );

  return v_note_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Communication audit RPC
-- Call this after email, SMS, or SitGuru message delivery is attempted.
-- -----------------------------------------------------------------------------

create or replace function public.record_sitguru_admin_communication(
  p_target_user_id uuid,
  p_channel text,
  p_delivery_status text,
  p_recipient text default null,
  p_subject text default null,
  p_message_preview text default null,
  p_communication_log_id uuid default null,
  p_actor_user_id uuid default null,
  p_source text default 'admin_communication'
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
set row_security = off
as $$
declare
  v_actor_user_id uuid := coalesce(p_actor_user_id, auth.uid());
begin
  if not (
    coalesce(auth.role(), '') = 'service_role'
    or current_user in ('postgres', 'supabase_admin')
    or public.has_sitguru_admin_permission(
      'send_messages',
      coalesce(auth.uid(), v_actor_user_id)
    )
  ) then
    raise exception 'Communication permission is required';
  end if;

  return public.record_account_lifecycle_event(
    p_target_user_id := p_target_user_id,
    p_event_type := 'communication',
    p_action_label := concat(
      initcap(coalesce(nullif(trim(p_channel), ''), 'Message')),
      ' communication recorded'
    ),
    p_description := p_message_preview,
    p_source := p_source,
    p_actor_user_id := v_actor_user_id,
    p_channel := p_channel,
    p_delivery_status := p_delivery_status,
    p_after_data := jsonb_build_object(
      'recipient', p_recipient,
      'subject', p_subject,
      'message_preview', p_message_preview,
      'communication_log_id', p_communication_log_id
    ),
    p_changed_fields := array['communication'],
    p_metadata := jsonb_build_object(
      'recipient', p_recipient,
      'subject', p_subject,
      'communication_log_id', p_communication_log_id
    )
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Automatic fallback auditing for important account tables
-- -----------------------------------------------------------------------------

create or replace function public.audit_sitguru_account_row_change()
returns trigger
language plpgsql
security definer
set search_path = public, auth
set row_security = off
as $$
declare
  v_before jsonb := case
    when tg_op = 'INSERT' then '{}'::jsonb
    else to_jsonb(old)
  end;

  v_after jsonb := case
    when tg_op = 'DELETE' then '{}'::jsonb
    else to_jsonb(new)
  end;

  v_row jsonb := case
    when tg_op = 'DELETE' then to_jsonb(old)
    else to_jsonb(new)
  end;

  v_target_user_id_text text;
  v_target_user_id uuid;
  v_target_record_id_text text;
  v_target_record_id uuid;
  v_actor_user_id uuid := auth.uid();
  v_actor_name text;
  v_actor_email text;
  v_actor_role text;
  v_changed_fields text[] := array[]::text[];
  v_key text;
begin
  v_target_user_id_text := coalesce(
    nullif(v_row ->> 'user_id', ''),
    nullif(v_row ->> 'account_id', ''),
    nullif(v_row ->> 'profile_id', ''),
    case
      when tg_table_name = 'profiles' then nullif(v_row ->> 'id', '')
      else null
    end
  );

  if v_target_user_id_text ~*
     '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  then
    if exists (
      select 1
      from auth.users au
      where au.id = v_target_user_id_text::uuid
    ) then
      v_target_user_id := v_target_user_id_text::uuid;
    end if;
  end if;

  v_target_record_id_text := nullif(v_row ->> 'id', '');

  if v_target_record_id_text ~*
     '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  then
    v_target_record_id := v_target_record_id_text::uuid;
  end if;

  for v_key in
    select distinct key
    from (
      select jsonb_object_keys(v_before) as key
      union all
      select jsonb_object_keys(v_after) as key
    ) keys
  loop
    if (v_before -> v_key) is distinct from (v_after -> v_key) then
      v_changed_fields := array_append(v_changed_fields, v_key);
    end if;
  end loop;

  select
    snapshot.actor_name,
    snapshot.actor_email,
    snapshot.actor_role
  into
    v_actor_name,
    v_actor_email,
    v_actor_role
  from public.get_sitguru_actor_snapshot(v_actor_user_id) snapshot;

  insert into public.account_lifecycle_events (
    user_id,
    target_user_id,
    target_account_type,
    target_record_id,
    event_type,
    action_label,
    description,
    actor_user_id,
    actor_name,
    actor_email,
    actor_role,
    actor_type,
    source,
    before_data,
    after_data,
    changed_fields,
    metadata,
    created_at
  )
  values (
    v_target_user_id,
    v_target_user_id,
    tg_table_name,
    v_target_record_id,
    lower(tg_table_name || '.' || tg_op),
    initcap(replace(tg_table_name, '_', ' ')) || ' ' || lower(tg_op),
    'Automatic database audit event.',
    v_actor_user_id,
    coalesce(v_actor_name, 'System / database'),
    v_actor_email,
    coalesce(v_actor_role, 'system'),
    case when v_actor_user_id is null then 'system' else 'admin' end,
    'database_trigger',
    v_before,
    v_after,
    v_changed_fields,
    jsonb_build_object(
      'table_name', tg_table_name,
      'operation', tg_op,
      'trigger_name', tg_name
    ),
    now()
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'profiles',
    'gurus',
    'ambassadors',
    'pawperks_account_referral_codes'
  ]
  loop
    if to_regclass('public.' || v_table) is not null then
      execute format(
        'drop trigger if exists %I on public.%I',
        'trg_audit_' || v_table,
        v_table
      );

      execute format(
        'create trigger %I
         after insert or update or delete on public.%I
         for each row
         execute function public.audit_sitguru_account_row_change()',
        'trg_audit_' || v_table,
        v_table
      );
    end if;
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- Automatic communication-log auditing when the table exists
-- -----------------------------------------------------------------------------

create or replace function public.audit_sitguru_communication_log()
returns trigger
language plpgsql
security definer
set search_path = public, auth
set row_security = off
as $$
declare
  v_row jsonb := to_jsonb(new);
  v_target_user_id_text text := coalesce(
    nullif(v_row ->> 'user_id', ''),
    nullif(v_row ->> 'recipient_user_id', ''),
    nullif(v_row ->> 'account_id', '')
  );
  v_target_user_id uuid;
  v_actor_user_id_text text := coalesce(
    nullif(v_row ->> 'sent_by_user_id', ''),
    nullif(v_row ->> 'actor_user_id', ''),
    nullif(v_row ->> 'admin_user_id', '')
  );
  v_actor_user_id uuid := auth.uid();
  v_actor_name text;
  v_actor_email text;
  v_actor_role text;
begin
  if v_target_user_id_text ~*
     '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
     and exists (
       select 1
       from auth.users au
       where au.id = v_target_user_id_text::uuid
     )
  then
    v_target_user_id := v_target_user_id_text::uuid;
  end if;

  if v_actor_user_id is null
     and v_actor_user_id_text ~*
       '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  then
    v_actor_user_id := v_actor_user_id_text::uuid;
  end if;

  select
    snapshot.actor_name,
    snapshot.actor_email,
    snapshot.actor_role
  into
    v_actor_name,
    v_actor_email,
    v_actor_role
  from public.get_sitguru_actor_snapshot(v_actor_user_id) snapshot;

  insert into public.account_lifecycle_events (
    user_id,
    target_user_id,
    target_account_type,
    target_record_id,
    event_type,
    action_label,
    description,
    actor_user_id,
    actor_name,
    actor_email,
    actor_role,
    actor_type,
    source,
    channel,
    delivery_status,
    after_data,
    changed_fields,
    metadata,
    created_at
  )
  values (
    v_target_user_id,
    v_target_user_id,
    'communication',
    case
      when nullif(v_row ->> 'id', '') ~*
        '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then (v_row ->> 'id')::uuid
      else null
    end,
    'communication.' || lower(tg_op),
    concat(
      initcap(
        coalesce(
          nullif(v_row ->> 'channel', ''),
          nullif(v_row ->> 'delivery_channel', ''),
          'Message'
        )
      ),
      ' communication ',
      lower(tg_op)
    ),
    coalesce(
      nullif(v_row ->> 'message_preview', ''),
      nullif(v_row ->> 'preview', ''),
      nullif(v_row ->> 'message', ''),
      nullif(v_row ->> 'body', '')
    ),
    v_actor_user_id,
    coalesce(v_actor_name, 'System / database'),
    v_actor_email,
    coalesce(v_actor_role, 'system'),
    case when v_actor_user_id is null then 'system' else 'admin' end,
    'communication_logs_trigger',
    coalesce(
      nullif(v_row ->> 'channel', ''),
      nullif(v_row ->> 'delivery_channel', '')
    ),
    coalesce(
      nullif(v_row ->> 'status', ''),
      nullif(v_row ->> 'delivery_status', '')
    ),
    v_row,
    array['communication'],
    jsonb_build_object(
      'recipient',
      coalesce(
        nullif(v_row ->> 'recipient', ''),
        nullif(v_row ->> 'recipient_email', ''),
        nullif(v_row ->> 'to_email', ''),
        nullif(v_row ->> 'to_phone', '')
      ),
      'subject',
      coalesce(
        nullif(v_row ->> 'subject', ''),
        nullif(v_row ->> 'title', '')
      )
    ),
    now()
  );

  return new;
end;
$$;

do $$
begin
  if to_regclass('public.communication_logs') is not null then
    execute '
      drop trigger if exists trg_audit_communication_logs
      on public.communication_logs
    ';

    execute '
      create trigger trg_audit_communication_logs
      after insert or update on public.communication_logs
      for each row
      execute function public.audit_sitguru_communication_log()
    ';
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table public.admin_account_permissions enable row level security;
alter table public.account_management_assignments enable row level security;
alter table public.account_lifecycle_events enable row level security;
alter table public.account_admin_notes enable row level security;

drop policy if exists admin_permissions_select on public.admin_account_permissions;
create policy admin_permissions_select
on public.admin_account_permissions
for select
to authenticated
using (public.is_sitguru_admin(auth.uid()));

drop policy if exists admin_permissions_insert on public.admin_account_permissions;
create policy admin_permissions_insert
on public.admin_account_permissions
for insert
to authenticated
with check (public.is_sitguru_super_admin(auth.uid()));

drop policy if exists admin_permissions_update on public.admin_account_permissions;
create policy admin_permissions_update
on public.admin_account_permissions
for update
to authenticated
using (public.is_sitguru_super_admin(auth.uid()))
with check (public.is_sitguru_super_admin(auth.uid()));

drop policy if exists admin_permissions_delete on public.admin_account_permissions;
create policy admin_permissions_delete
on public.admin_account_permissions
for delete
to authenticated
using (public.is_sitguru_super_admin(auth.uid()));

drop policy if exists assignments_select on public.account_management_assignments;
create policy assignments_select
on public.account_management_assignments
for select
to authenticated
using (public.is_sitguru_admin(auth.uid()));

drop policy if exists assignments_insert on public.account_management_assignments;
create policy assignments_insert
on public.account_management_assignments
for insert
to authenticated
with check (
  public.has_sitguru_admin_permission('assign_accounts', auth.uid())
);

drop policy if exists assignments_update on public.account_management_assignments;
create policy assignments_update
on public.account_management_assignments
for update
to authenticated
using (
  public.has_sitguru_admin_permission('assign_accounts', auth.uid())
)
with check (
  public.has_sitguru_admin_permission('assign_accounts', auth.uid())
);

drop policy if exists assignments_delete on public.account_management_assignments;
create policy assignments_delete
on public.account_management_assignments
for delete
to authenticated
using (public.is_sitguru_super_admin(auth.uid()));

drop policy if exists lifecycle_events_select on public.account_lifecycle_events;
create policy lifecycle_events_select
on public.account_lifecycle_events
for select
to authenticated
using (
  public.has_sitguru_admin_permission('view_audit_history', auth.uid())
);

drop policy if exists admin_notes_select on public.account_admin_notes;
create policy admin_notes_select
on public.account_admin_notes
for select
to authenticated
using (public.is_sitguru_admin(auth.uid()));

drop policy if exists admin_notes_insert on public.account_admin_notes;
create policy admin_notes_insert
on public.account_admin_notes
for insert
to authenticated
with check (
  public.has_sitguru_admin_permission('add_notes', auth.uid())
);

drop policy if exists admin_notes_update on public.account_admin_notes;
create policy admin_notes_update
on public.account_admin_notes
for update
to authenticated
using (
  created_by = auth.uid()
  or public.is_sitguru_super_admin(auth.uid())
)
with check (
  created_by = auth.uid()
  or public.is_sitguru_super_admin(auth.uid())
);

drop policy if exists admin_notes_delete on public.account_admin_notes;
create policy admin_notes_delete
on public.account_admin_notes
for delete
to authenticated
using (
  created_by = auth.uid()
  or public.is_sitguru_super_admin(auth.uid())
);

-- -----------------------------------------------------------------------------
-- Grants
-- -----------------------------------------------------------------------------

grant select on public.admin_account_permissions to authenticated;
grant select on public.account_management_assignments to authenticated;
grant select on public.account_lifecycle_events to authenticated;
grant select on public.account_admin_notes to authenticated;

grant insert, update on public.account_management_assignments to authenticated;
grant insert, update, delete on public.account_admin_notes to authenticated;

revoke insert, update, delete on public.account_lifecycle_events
  from anon, authenticated;

grant execute on function public.default_admin_permissions(text)
  to authenticated, service_role;

grant execute on function public.get_sitguru_admin_access_level(uuid)
  to authenticated, service_role;

grant execute on function public.is_sitguru_admin(uuid)
  to authenticated, service_role;

grant execute on function public.is_sitguru_super_admin(uuid)
  to authenticated, service_role;

grant execute on function public.has_sitguru_admin_permission(text, uuid)
  to authenticated, service_role;

grant execute on function public.get_sitguru_actor_snapshot(uuid)
  to authenticated, service_role;

grant execute on function public.record_account_lifecycle_event(
  uuid,
  text,
  text,
  text,
  text,
  uuid,
  text,
  uuid,
  jsonb,
  jsonb,
  text[],
  text,
  text,
  jsonb
) to authenticated, service_role;

grant execute on function public.assign_sitguru_account_manager(
  uuid,
  uuid,
  text,
  text,
  timestamptz,
  text,
  uuid
) to authenticated, service_role;

grant execute on function public.add_sitguru_account_admin_note(
  uuid,
  text,
  text,
  boolean,
  uuid
) to authenticated, service_role;

grant execute on function public.record_sitguru_admin_communication(
  uuid,
  text,
  text,
  text,
  text,
  text,
  uuid,
  uuid,
  text
) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Helpful comments
-- -----------------------------------------------------------------------------

comment on table public.admin_account_permissions is
  'SitGuru staff access levels and fine-grained Admin account-management permissions.';

comment on table public.account_management_assignments is
  'Tracks which SitGuru staff member owns an account review and the next follow-up date.';

comment on table public.account_lifecycle_events is
  'Permanent account audit trail with actor, timestamp, source, communication details, and before/after data.';

comment on table public.account_admin_notes is
  'Internal SitGuru staff notes attached to a user account.';

comment on function public.record_account_lifecycle_event is
  'Use after every Admin account mutation to preserve the logged-in Admin identity and before/after values.';

commit;

-- =============================================================================
-- OPTIONAL VERIFICATION QUERIES
-- Run these separately after the migration succeeds.
-- =============================================================================

-- 1. Confirm Jason was bootstrapped as Super Admin:
--
-- select
--   aap.user_id,
--   aap.display_name,
--   aap.email,
--   aap.access_level,
--   aap.is_active,
--   aap.permissions
-- from public.admin_account_permissions aap
-- where lower(aap.email) = 'jason@sitguru.com';

-- 2. Confirm the audit tables exist:
--
-- select
--   to_regclass('public.admin_account_permissions') as admin_permissions,
--   to_regclass('public.account_management_assignments') as assignments,
--   to_regclass('public.account_lifecycle_events') as lifecycle_events,
--   to_regclass('public.account_admin_notes') as admin_notes;

-- 3. Example: log a Regine account-repair event as Jason.
-- Replace the actor UUID with the auth.users ID for jason@sitguru.com.
--
-- select public.record_account_lifecycle_event(
--   p_target_user_id := 'f87b7afa-6c8b-4c20-85d8-c5567ab7e372'::uuid,
--   p_event_type := 'account_repair',
--   p_action_label := 'Guru workspace repaired',
--   p_description := 'Created the missing canonical Guru workspace.',
--   p_source := 'admin_account_lifecycle',
--   p_actor_user_id := 'REPLACE_WITH_JASON_AUTH_USER_ID'::uuid,
--   p_before_data := jsonb_build_object('guru_workspace_exists', false),
--   p_after_data := jsonb_build_object(
--     'guru_workspace_exists', true,
--     'status', 'pending_setup',
--     'is_public_visible', false,
--     'is_bookable', false
--   ),
--   p_changed_fields := array[
--     'guru_workspace_exists',
--     'status',
--     'is_public_visible',
--     'is_bookable'
--   ]
-- );

-- 4. View the newest account events:
--
-- select
--   ale.created_at,
--   ale.action_label,
--   ale.actor_name,
--   ale.actor_email,
--   ale.actor_role,
--   ale.source,
--   ale.channel,
--   ale.delivery_status,
--   ale.changed_fields,
--   ale.before_data,
--   ale.after_data
-- from public.account_lifecycle_events ale
-- where coalesce(ale.target_user_id, ale.user_id) =
--   'f87b7afa-6c8b-4c20-85d8-c5567ab7e372'::uuid
-- order by ale.created_at desc;


-- 5. Confirm the audit table has no foreign-key constraints that could erase
--    or reject historical orphan/deleted account identifiers:
--
-- select
--   c.conname,
--   pg_get_constraintdef(c.oid) as definition
-- from pg_constraint c
-- join pg_class t on t.oid = c.conrelid
-- join pg_namespace n on n.oid = t.relnamespace
-- where n.nspname = 'public'
--   and t.relname = 'account_lifecycle_events'
--   and c.contype = 'f';
--
-- Expected result: zero rows.