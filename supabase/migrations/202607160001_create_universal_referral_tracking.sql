-- SitGuru universal referral tracking
-- Migration: 202607160001_create_universal_referral_tracking.sql
--
-- Purpose:
--   1. Give Pet Parents, Gurus, Ambassadors, partners, and campaigns one
--      canonical referral-code registry.
--   2. Connect tracked links and QR scans to the same canonical code.
--   3. Create one durable referral relationship after a referred member signs up.
--   4. Let the referrer and referred member read safe progress information.
--   5. Give SitGuru Admin a complete audit and attribution record.
--   6. Never create, approve, or pay a reward merely because a code was entered,
--      a link was visited, or a QR code was scanned.
--
-- This migration is idempotent and can be run from the Supabase SQL Editor.
-- Legacy profile/referral rows may contain UUIDs that are not Auth user IDs.
-- Those values are retained in legacy/profile fields but are never inserted
-- into auth.users foreign-key columns unless the Auth user actually exists.

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Shared helper functions
-- ---------------------------------------------------------------------------

create or replace function public.normalize_sitguru_referral_code(
  p_value text
)
returns text
language sql
immutable
as $$
  select left(
    regexp_replace(
      upper(trim(coalesce(p_value, ''))),
      '[^A-Z0-9_-]',
      '',
      'g'
    ),
    64
  );
$$;

create or replace function public.try_uuid(
  p_value text
)
returns uuid
language plpgsql
immutable
as $$
begin
  if nullif(trim(coalesce(p_value, '')), '') is null then
    return null;
  end if;

  return trim(p_value)::uuid;
exception
  when others then
    return null;
end;
$$;

create or replace function public.try_timestamptz(
  p_value text
)
returns timestamptz
language plpgsql
immutable
as $$
begin
  if nullif(trim(coalesce(p_value, '')), '') is null then
    return null;
  end if;

  return trim(p_value)::timestamptz;
exception
  when others then
    return null;
end;
$$;

create or replace function public.try_auth_user_id(
  p_value text
)
returns uuid
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
begin
  v_user_id := public.try_uuid(p_value);

  if v_user_id is null then
    return null;
  end if;

  if exists (
    select 1
    from auth.users
    where id = v_user_id
  ) then
    return v_user_id;
  end if;

  return null;
end;
$$;

revoke all on function public.try_auth_user_id(text) from public;
grant execute on function public.try_auth_user_id(text) to authenticated;
grant execute on function public.try_auth_user_id(text) to service_role;

create or replace function public.try_boolean(
  p_value text
)
returns boolean
language plpgsql
immutable
as $$
begin
  if nullif(trim(coalesce(p_value, '')), '') is null then
    return null;
  end if;

  return trim(p_value)::boolean;
exception
  when others then
    return null;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Admin checks are intentionally conservative. Server-side Admin pages using
-- the Supabase service role bypass RLS. This helper additionally supports
-- authenticated Admin users whose JWT or profiles row clearly marks them Admin.
create or replace function public.is_sitguru_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_claims jsonb := '{}'::jsonb;
  v_role text := '';
  v_is_admin boolean := false;
  v_user_id uuid := auth.uid();
begin
  begin
    v_claims :=
      coalesce(
        nullif(current_setting('request.jwt.claims', true), '')::jsonb,
        '{}'::jsonb
      );
  exception
    when others then
      v_claims := '{}'::jsonb;
  end;

  v_role := lower(
    coalesce(
      v_claims #>> '{app_metadata,role}',
      v_claims #>> '{user_metadata,role}',
      v_claims #>> '{app_metadata,account_type}',
      v_claims #>> '{user_metadata,account_type}',
      ''
    )
  );

  if v_role in ('admin', 'administrator', 'super_admin', 'superadmin') then
    return true;
  end if;

  if v_user_id is null then
    return false;
  end if;

  if to_regclass('public.profiles') is not null then
    begin
      if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'profiles'
          and column_name = 'user_id'
      ) then
        execute $sql$
          select exists (
            select 1
            from public.profiles p
            where p.user_id = $1
              and (
                lower(coalesce(to_jsonb(p)->>'role', '')) in
                  ('admin', 'administrator', 'super_admin', 'superadmin')
                or lower(coalesce(to_jsonb(p)->>'admin_status', '')) in
                  ('active', 'approved', 'admin')
                or coalesce((to_jsonb(p)->>'is_admin')::boolean, false) = true
              )
          )
        $sql$
        into v_is_admin
        using v_user_id;
      else
        execute $sql$
          select exists (
            select 1
            from public.profiles p
            where p.id = $1
              and (
                lower(coalesce(to_jsonb(p)->>'role', '')) in
                  ('admin', 'administrator', 'super_admin', 'superadmin')
                or lower(coalesce(to_jsonb(p)->>'admin_status', '')) in
                  ('active', 'approved', 'admin')
                or coalesce((to_jsonb(p)->>'is_admin')::boolean, false) = true
              )
          )
        $sql$
        into v_is_admin
        using v_user_id;
      end if;

      if v_is_admin then
        return true;
      end if;
    exception
      when others then
        null;
    end;
  end if;

  return false;
end;
$$;

revoke all on function public.is_sitguru_admin() from public;
grant execute on function public.is_sitguru_admin() to authenticated;
grant execute on function public.is_sitguru_admin() to service_role;

-- ---------------------------------------------------------------------------
-- Canonical referral-code registry
-- ---------------------------------------------------------------------------

create table if not exists public.pawperks_account_referral_codes (
  id uuid primary key default gen_random_uuid(),

  code text not null,
  normalized_code text not null,

  user_id uuid null references auth.users(id) on delete set null,
  profile_id uuid null,

  owner_type text not null default 'unknown',
  primary_role text null,

  owner_display_name text null,
  owner_email text null,

  program_context text null,
  program_type text null,
  campaign_type text null,

  legacy_referral_code_id uuid null,
  ambassador_id uuid null,
  guru_id uuid null,
  partner_id uuid null,

  legacy_source_table text null,
  legacy_source_id text null,

  status text not null default 'active',
  is_default boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint pawperks_account_referral_codes_code_length
    check (char_length(normalized_code) between 2 and 64),

  constraint pawperks_account_referral_codes_status_not_blank
    check (char_length(trim(status)) > 0)
);

create unique index if not exists
  pawperks_account_referral_codes_normalized_code_uidx
on public.pawperks_account_referral_codes(normalized_code);

create index if not exists
  pawperks_account_referral_codes_user_id_idx
on public.pawperks_account_referral_codes(user_id);

create index if not exists
  pawperks_account_referral_codes_profile_id_idx
on public.pawperks_account_referral_codes(profile_id);

create index if not exists
  pawperks_account_referral_codes_owner_type_idx
on public.pawperks_account_referral_codes(owner_type);

create index if not exists
  pawperks_account_referral_codes_legacy_referral_code_id_idx
on public.pawperks_account_referral_codes(legacy_referral_code_id);

create index if not exists
  pawperks_account_referral_codes_ambassador_id_idx
on public.pawperks_account_referral_codes(ambassador_id);

create index if not exists
  pawperks_account_referral_codes_guru_id_idx
on public.pawperks_account_referral_codes(guru_id);

create table if not exists public.pawperks_referral_code_aliases (
  id uuid primary key default gen_random_uuid(),

  canonical_code_id uuid not null
    references public.pawperks_account_referral_codes(id)
    on delete cascade,

  alias_code text not null,
  normalized_alias_code text not null,

  status text not null default 'active',
  source text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint pawperks_referral_code_aliases_code_length
    check (char_length(normalized_alias_code) between 2 and 64)
);

create unique index if not exists
  pawperks_referral_code_aliases_normalized_alias_code_uidx
on public.pawperks_referral_code_aliases(normalized_alias_code);

create index if not exists
  pawperks_referral_code_aliases_canonical_code_id_idx
on public.pawperks_referral_code_aliases(canonical_code_id);

create or replace function public.normalize_canonical_referral_code_row()
returns trigger
language plpgsql
as $$
begin
  new.code := public.normalize_sitguru_referral_code(new.code);
  new.normalized_code := public.normalize_sitguru_referral_code(
    coalesce(new.normalized_code, new.code)
  );

  if new.code = '' then
    new.code := new.normalized_code;
  end if;

  if new.normalized_code = '' then
    raise exception 'Referral code cannot be blank.';
  end if;

  new.owner_email := nullif(lower(trim(coalesce(new.owner_email, ''))), '');
  new.owner_type := lower(trim(coalesce(new.owner_type, 'unknown')));
  new.primary_role := nullif(lower(trim(coalesce(new.primary_role, ''))), '');
  new.status := lower(trim(coalesce(new.status, 'active')));
  new.updated_at := now();

  return new;
end;
$$;

drop trigger if exists
  pawperks_account_referral_codes_normalize_trg
on public.pawperks_account_referral_codes;

create trigger pawperks_account_referral_codes_normalize_trg
before insert or update
on public.pawperks_account_referral_codes
for each row
execute function public.normalize_canonical_referral_code_row();

create or replace function public.normalize_referral_alias_row()
returns trigger
language plpgsql
as $$
begin
  new.alias_code := public.normalize_sitguru_referral_code(new.alias_code);
  new.normalized_alias_code := public.normalize_sitguru_referral_code(
    coalesce(new.normalized_alias_code, new.alias_code)
  );

  if new.normalized_alias_code = '' then
    raise exception 'Referral alias cannot be blank.';
  end if;

  new.status := lower(trim(coalesce(new.status, 'active')));
  new.updated_at := now();

  return new;
end;
$$;

drop trigger if exists
  pawperks_referral_code_aliases_normalize_trg
on public.pawperks_referral_code_aliases;

create trigger pawperks_referral_code_aliases_normalize_trg
before insert or update
on public.pawperks_referral_code_aliases
for each row
execute function public.normalize_referral_alias_row();

drop trigger if exists
  pawperks_account_referral_codes_updated_at_trg
on public.pawperks_account_referral_codes;

create trigger pawperks_account_referral_codes_updated_at_trg
before update
on public.pawperks_account_referral_codes
for each row
execute function public.set_updated_at();

drop trigger if exists
  pawperks_referral_code_aliases_updated_at_trg
on public.pawperks_referral_code_aliases;

create trigger pawperks_referral_code_aliases_updated_at_trg
before update
on public.pawperks_referral_code_aliases
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Canonical event and relationship tables
-- ---------------------------------------------------------------------------

create table if not exists public.pawperks_referral_events (
  id uuid primary key default gen_random_uuid(),

  canonical_code_id uuid not null
    references public.pawperks_account_referral_codes(id)
    on delete restrict,

  submitted_code text not null,

  referrer_profile_id uuid null,
  referrer_user_id uuid null references auth.users(id) on delete set null,
  referrer_role text null,

  referred_profile_id uuid null,
  referred_user_id uuid null references auth.users(id) on delete set null,
  referred_email text null,
  referred_name text null,
  referred_role_at_signup text null,

  event_type text not null,
  program_context text null,
  capture_point text null,

  source text null,
  platform text null,
  medium text null,
  campaign text null,

  utm_source text null,
  utm_medium text null,
  utm_campaign text null,
  utm_content text null,

  landing_page text null,

  conversion_stage text null,
  conversion_status text null,

  source_table text null,
  source_event_id text null,
  dedupe_key text null,

  metadata jsonb not null default '{}'::jsonb,

  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint pawperks_referral_events_event_type_not_blank
    check (char_length(trim(event_type)) > 0)
);

create unique index if not exists
  pawperks_referral_events_dedupe_key_uidx
on public.pawperks_referral_events(dedupe_key)
where dedupe_key is not null;

create unique index if not exists
  pawperks_referral_events_signup_capture_uidx
on public.pawperks_referral_events(
  canonical_code_id,
  referred_user_id,
  event_type
)
where referred_user_id is not null
  and event_type = 'signup_capture';

create index if not exists
  pawperks_referral_events_canonical_code_id_idx
on public.pawperks_referral_events(canonical_code_id);

create index if not exists
  pawperks_referral_events_referrer_user_id_idx
on public.pawperks_referral_events(referrer_user_id);

create index if not exists
  pawperks_referral_events_referred_user_id_idx
on public.pawperks_referral_events(referred_user_id);

create index if not exists
  pawperks_referral_events_event_type_idx
on public.pawperks_referral_events(event_type);

create index if not exists
  pawperks_referral_events_occurred_at_idx
on public.pawperks_referral_events(occurred_at desc);

drop trigger if exists
  pawperks_referral_events_updated_at_trg
on public.pawperks_referral_events;

create trigger pawperks_referral_events_updated_at_trg
before update
on public.pawperks_referral_events
for each row
execute function public.set_updated_at();

create table if not exists public.pawperks_referral_relationships (
  id uuid primary key default gen_random_uuid(),

  canonical_code_id uuid not null
    references public.pawperks_account_referral_codes(id)
    on delete restrict,

  referral_code text not null,

  referrer_profile_id uuid null,
  referrer_user_id uuid null references auth.users(id) on delete set null,
  referrer_role text null,
  referrer_display_name text null,

  referred_profile_id uuid null,
  referred_user_id uuid not null references auth.users(id) on delete cascade,
  referred_role text null,
  referred_display_name text null,
  referred_email text null,

  source text null,
  platform text null,
  medium text null,
  campaign text null,

  utm_source text null,
  utm_medium text null,
  utm_campaign text null,
  utm_content text null,

  status text not null default 'pending',
  referral_stage text not null default 'signup',

  signup_at timestamptz not null default now(),
  verified_at timestamptz null,
  profile_completed_at timestamptz null,
  activated_at timestamptz null,
  qualified_at timestamptz null,
  first_booking_at timestamptz null,

  reward_status text not null default 'not_evaluated',
  reward_amount numeric(12, 2) not null default 0,
  reward_approved_at timestamptz null,
  reward_paid_at timestamptz null,
  reward_payment_reference text null,

  attribution_locked boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint pawperks_referral_relationships_reward_amount_nonnegative
    check (reward_amount >= 0),

  constraint pawperks_referral_relationships_status_not_blank
    check (char_length(trim(status)) > 0)
);

create unique index if not exists
  pawperks_referral_relationships_referred_user_uidx
on public.pawperks_referral_relationships(referred_user_id);

create index if not exists
  pawperks_referral_relationships_canonical_code_id_idx
on public.pawperks_referral_relationships(canonical_code_id);

create index if not exists
  pawperks_referral_relationships_referrer_user_id_idx
on public.pawperks_referral_relationships(referrer_user_id);

create index if not exists
  pawperks_referral_relationships_status_idx
on public.pawperks_referral_relationships(status);

create index if not exists
  pawperks_referral_relationships_referral_stage_idx
on public.pawperks_referral_relationships(referral_stage);

create index if not exists
  pawperks_referral_relationships_signup_at_idx
on public.pawperks_referral_relationships(signup_at desc);

drop trigger if exists
  pawperks_referral_relationships_updated_at_trg
on public.pawperks_referral_relationships;

create trigger pawperks_referral_relationships_updated_at_trg
before update
on public.pawperks_referral_relationships
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Admin audit log
-- ---------------------------------------------------------------------------

create table if not exists public.pawperks_referral_audit_log (
  id uuid primary key default gen_random_uuid(),

  relationship_id uuid null
    references public.pawperks_referral_relationships(id)
    on delete set null,

  canonical_code_id uuid null
    references public.pawperks_account_referral_codes(id)
    on delete set null,

  actor_user_id uuid null references auth.users(id) on delete set null,
  actor_source text not null default 'database',

  operation text not null,
  old_record jsonb null,
  new_record jsonb null,

  created_at timestamptz not null default now()
);

create index if not exists
  pawperks_referral_audit_log_relationship_id_idx
on public.pawperks_referral_audit_log(relationship_id);

create index if not exists
  pawperks_referral_audit_log_canonical_code_id_idx
on public.pawperks_referral_audit_log(canonical_code_id);

create index if not exists
  pawperks_referral_audit_log_created_at_idx
on public.pawperks_referral_audit_log(created_at desc);

create or replace function public.audit_referral_relationship_change()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.pawperks_referral_audit_log (
    relationship_id,
    canonical_code_id,
    actor_user_id,
    actor_source,
    operation,
    old_record,
    new_record
  )
  values (
    coalesce(new.id, old.id),
    coalesce(new.canonical_code_id, old.canonical_code_id),
    auth.uid(),
    case
      when auth.uid() is null then 'service_or_database'
      else 'authenticated_user'
    end,
    tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists
  pawperks_referral_relationships_audit_trg
on public.pawperks_referral_relationships;

create trigger pawperks_referral_relationships_audit_trg
after insert or update or delete
on public.pawperks_referral_relationships
for each row
execute function public.audit_referral_relationship_change();

-- ---------------------------------------------------------------------------
-- Canonical relationship lifecycle
-- ---------------------------------------------------------------------------

create or replace function public.sync_referral_relationship_from_event()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_code public.pawperks_account_referral_codes%rowtype;
  v_reward_amount numeric(12, 2) := 0;
  v_reward_reference text := '';
begin
  select *
  into v_code
  from public.pawperks_account_referral_codes
  where id = new.canonical_code_id;

  if new.event_type = 'signup_capture'
     and new.referred_user_id is not null then

    insert into public.pawperks_referral_relationships (
      canonical_code_id,
      referral_code,

      referrer_profile_id,
      referrer_user_id,
      referrer_role,
      referrer_display_name,

      referred_profile_id,
      referred_user_id,
      referred_role,
      referred_display_name,
      referred_email,

      source,
      platform,
      medium,
      campaign,

      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,

      status,
      referral_stage,
      signup_at,
      reward_status,
      reward_amount,
      attribution_locked,
      metadata
    )
    values (
      new.canonical_code_id,
      new.submitted_code,

      coalesce(new.referrer_profile_id, v_code.profile_id),
      coalesce(new.referrer_user_id, v_code.user_id),
      coalesce(new.referrer_role, v_code.primary_role, v_code.owner_type),
      v_code.owner_display_name,

      new.referred_profile_id,
      new.referred_user_id,
      new.referred_role_at_signup,
      new.referred_name,
      new.referred_email,

      new.source,
      new.platform,
      new.medium,
      new.campaign,

      new.utm_source,
      new.utm_medium,
      new.utm_campaign,
      new.utm_content,

      'pending',
      'signup',
      coalesce(new.occurred_at, new.created_at, now()),
      'not_evaluated',
      0,
      true,
      jsonb_build_object(
        'signup_event_id', new.id,
        'capture_point', new.capture_point,
        'program_context', new.program_context,
        'source_table', new.source_table
      ) || coalesce(new.metadata, '{}'::jsonb)
    )
    on conflict (referred_user_id)
    do update
    set
      referred_profile_id =
        coalesce(
          public.pawperks_referral_relationships.referred_profile_id,
          excluded.referred_profile_id
        ),
      referred_display_name =
        coalesce(
          public.pawperks_referral_relationships.referred_display_name,
          excluded.referred_display_name
        ),
      referred_email =
        coalesce(
          public.pawperks_referral_relationships.referred_email,
          excluded.referred_email
        ),
      source =
        coalesce(
          public.pawperks_referral_relationships.source,
          excluded.source
        ),
      platform =
        coalesce(
          public.pawperks_referral_relationships.platform,
          excluded.platform
        ),
      medium =
        coalesce(
          public.pawperks_referral_relationships.medium,
          excluded.medium
        ),
      campaign =
        coalesce(
          public.pawperks_referral_relationships.campaign,
          excluded.campaign
        ),
      metadata =
        public.pawperks_referral_relationships.metadata ||
        jsonb_build_object(
          'last_signup_event_id', new.id,
          'last_signup_event_at', coalesce(new.occurred_at, now())
        ),
      updated_at = now()
    where
      public.pawperks_referral_relationships.canonical_code_id =
      excluded.canonical_code_id;

    return new;
  end if;

  if new.referred_user_id is null then
    return new;
  end if;

  if new.event_type in (
    'email_verified',
    'phone_verified',
    'identity_verified'
  ) then
    update public.pawperks_referral_relationships
    set
      verified_at = coalesce(verified_at, new.occurred_at, now()),
      referral_stage = 'verified',
      status = case when status = 'pending' then 'verified' else status end,
      updated_at = now()
    where referred_user_id = new.referred_user_id;

  elsif new.event_type in (
    'profile_completed',
    'profile_complete'
  ) then
    update public.pawperks_referral_relationships
    set
      profile_completed_at =
        coalesce(profile_completed_at, new.occurred_at, now()),
      referral_stage = 'profile_completed',
      status = case
        when status in ('pending', 'verified') then 'profile_completed'
        else status
      end,
      updated_at = now()
    where referred_user_id = new.referred_user_id;

  elsif new.event_type in (
    'account_activated',
    'guru_activated',
    'ambassador_activated',
    'pet_parent_activated'
  ) then
    update public.pawperks_referral_relationships
    set
      activated_at = coalesce(activated_at, new.occurred_at, now()),
      referral_stage = 'activated',
      status = 'active',
      updated_at = now()
    where referred_user_id = new.referred_user_id;

  elsif new.event_type in (
    'qualified',
    'referral_qualified'
  ) then
    update public.pawperks_referral_relationships
    set
      qualified_at = coalesce(qualified_at, new.occurred_at, now()),
      referral_stage = 'qualified',
      status = 'qualified',
      updated_at = now()
    where referred_user_id = new.referred_user_id;

  elsif new.event_type in (
    'first_booking_completed',
    'booking_completed'
  ) then
    update public.pawperks_referral_relationships
    set
      first_booking_at =
        coalesce(first_booking_at, new.occurred_at, now()),
      referral_stage = 'first_booking_completed',
      status = case
        when status in ('pending', 'verified', 'profile_completed', 'active')
          then 'qualified'
        else status
      end,
      qualified_at =
        coalesce(qualified_at, new.occurred_at, now()),
      updated_at = now()
    where referred_user_id = new.referred_user_id;

  elsif new.event_type in (
    'reward_approved',
    'commission_approved'
  ) then
    begin
      v_reward_amount :=
        greatest(
          coalesce(
            nullif(new.metadata->>'reward_amount', '')::numeric,
            0
          ),
          0
        );
    exception
      when others then
        v_reward_amount := 0;
    end;

    update public.pawperks_referral_relationships
    set
      reward_status = 'approved',
      reward_amount = greatest(reward_amount, v_reward_amount),
      reward_approved_at =
        coalesce(reward_approved_at, new.occurred_at, now()),
      updated_at = now()
    where referred_user_id = new.referred_user_id;

  elsif new.event_type in (
    'reward_paid',
    'commission_paid'
  ) then
    begin
      v_reward_amount :=
        greatest(
          coalesce(
            nullif(new.metadata->>'reward_amount', '')::numeric,
            0
          ),
          0
        );
    exception
      when others then
        v_reward_amount := 0;
    end;

    v_reward_reference := coalesce(
      new.metadata->>'payment_reference',
      new.metadata->>'payout_reference',
      new.metadata->>'stripe_transfer_id',
      ''
    );

    -- A paid state requires a durable payment reference.
    if v_reward_reference <> '' then
      update public.pawperks_referral_relationships
      set
        reward_status = 'paid',
        reward_amount = greatest(reward_amount, v_reward_amount),
        reward_paid_at =
          coalesce(reward_paid_at, new.occurred_at, now()),
        reward_payment_reference = v_reward_reference,
        updated_at = now()
      where referred_user_id = new.referred_user_id;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists
  pawperks_referral_events_relationship_sync_trg
on public.pawperks_referral_events;

create trigger pawperks_referral_events_relationship_sync_trg
after insert
on public.pawperks_referral_events
for each row
execute function public.sync_referral_relationship_from_event();

-- ---------------------------------------------------------------------------
-- Legacy code synchronization
-- ---------------------------------------------------------------------------

create or replace function public.upsert_canonical_referral_code_from_json(
  p_row jsonb,
  p_source_table text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_code text := '';
  v_owner_type text := 'unknown';
  v_primary_role text := null;
  v_status text := 'active';

  v_user_id uuid := null;
  v_profile_id uuid := null;
  v_legacy_referral_code_id uuid := null;
  v_ambassador_id uuid := null;
  v_guru_id uuid := null;
  v_partner_id uuid := null;

  v_source_id text := '';
  v_owner_display_name text := '';
  v_owner_email text := '';

  v_program_context text := '';
  v_program_type text := '';
  v_campaign_type text := '';

  v_is_default boolean := false;
  v_id uuid;
begin
  v_code := public.normalize_sitguru_referral_code(
    coalesce(
      p_row->>'normalized_code',
      p_row->>'referral_code',
      p_row->>'ambassador_code',
      p_row->>'code',
      p_row->>'slug',
      ''
    )
  );

  if char_length(v_code) < 2 then
    return null;
  end if;

  v_source_id := coalesce(p_row->>'id', '');

  v_owner_type := lower(
    coalesce(
      p_row->>'owner_type',
      p_row->>'primary_role',
      p_row->>'role',
      p_row->>'account_type',
      p_row->>'program_type',
      p_row->>'campaign_type',
      ''
    )
  );

  if p_source_table = 'ambassadors' then
    v_owner_type := 'ambassador';
  elsif p_source_table in ('gurus', 'guru_referral_campaigns') then
    v_owner_type := 'guru';
  elsif p_source_table in ('customers', 'pet_parents') then
    v_owner_type := 'pet_parent';
  elsif p_source_table = 'profiles' and v_owner_type in ('customer', 'pet_owner') then
    v_owner_type := 'pet_parent';
  end if;

  if v_owner_type = '' then
    v_owner_type := 'unknown';
  end if;

  v_primary_role := nullif(
    lower(
      coalesce(
        p_row->>'primary_role',
        p_row->>'role',
        p_row->>'account_type',
        v_owner_type
      )
    ),
    ''
  );

  v_status := lower(coalesce(p_row->>'status', 'active'));

  if v_status in ('archived', 'inactive', 'disabled', 'deleted', 'expired') then
    v_status := v_status;
  else
    v_status := 'active';
  end if;

  if p_source_table = 'profiles' then
    v_user_id := public.try_auth_user_id(
      coalesce(p_row->>'user_id', p_row->>'id', '')
    );
    v_profile_id := public.try_uuid(p_row->>'id');
  else
    v_user_id := public.try_auth_user_id(
      coalesce(
        p_row->>'owner_user_id',
        p_row->>'issued_to_user_id',
        p_row->>'guru_user_id',
        p_row->>'user_id',
        ''
      )
    );
    v_profile_id := public.try_uuid(
      coalesce(
        p_row->>'owner_profile_id',
        p_row->>'profile_id',
        ''
      )
    );
  end if;

  if p_source_table = 'referral_codes' then
    v_legacy_referral_code_id := public.try_uuid(p_row->>'id');
  else
    v_legacy_referral_code_id := public.try_uuid(
      p_row->>'legacy_referral_code_id'
    );
  end if;

  if p_source_table = 'ambassadors' then
    v_ambassador_id := public.try_uuid(p_row->>'id');
  else
    v_ambassador_id := public.try_uuid(p_row->>'ambassador_id');
  end if;

  if p_source_table = 'gurus' then
    v_guru_id := public.try_uuid(p_row->>'id');
  else
    v_guru_id := public.try_uuid(p_row->>'guru_id');
  end if;

  v_partner_id := public.try_uuid(p_row->>'partner_id');

  v_owner_display_name := coalesce(
    p_row->>'owner_display_name',
    p_row->>'display_name',
    p_row->>'full_name',
    p_row->>'name',
    p_row->>'business_name',
    ''
  );

  v_owner_email := lower(
    coalesce(
      p_row->>'owner_email',
      p_row->>'contact_email',
      p_row->>'login_email',
      p_row->>'email',
      ''
    )
  );

  v_program_context := coalesce(
    p_row->>'program_context',
    p_row->>'program',
    ''
  );

  v_program_type := coalesce(
    p_row->>'program_type',
    p_row->>'referral_type',
    ''
  );

  v_campaign_type := coalesce(
    p_row->>'campaign_type',
    p_row->>'campaign',
    ''
  );

  v_is_default := coalesce(
    public.try_boolean(p_row->>'is_default'),
    false
  );

  insert into public.pawperks_account_referral_codes (
    code,
    normalized_code,

    user_id,
    profile_id,

    owner_type,
    primary_role,

    owner_display_name,
    owner_email,

    program_context,
    program_type,
    campaign_type,

    legacy_referral_code_id,
    ambassador_id,
    guru_id,
    partner_id,

    legacy_source_table,
    legacy_source_id,

    status,
    is_default
  )
  values (
    v_code,
    v_code,

    v_user_id,
    v_profile_id,

    v_owner_type,
    v_primary_role,

    nullif(v_owner_display_name, ''),
    nullif(v_owner_email, ''),

    nullif(v_program_context, ''),
    nullif(v_program_type, ''),
    nullif(v_campaign_type, ''),

    v_legacy_referral_code_id,
    v_ambassador_id,
    v_guru_id,
    v_partner_id,

    p_source_table,
    nullif(v_source_id, ''),

    v_status,
    v_is_default
  )
  on conflict (normalized_code)
  do update
  set
    user_id = coalesce(
      public.pawperks_account_referral_codes.user_id,
      excluded.user_id
    ),
    profile_id = coalesce(
      public.pawperks_account_referral_codes.profile_id,
      excluded.profile_id
    ),
    owner_type = case
      when public.pawperks_account_referral_codes.owner_type in ('', 'unknown')
        then excluded.owner_type
      else public.pawperks_account_referral_codes.owner_type
    end,
    primary_role = coalesce(
      public.pawperks_account_referral_codes.primary_role,
      excluded.primary_role
    ),
    owner_display_name = coalesce(
      public.pawperks_account_referral_codes.owner_display_name,
      excluded.owner_display_name
    ),
    owner_email = coalesce(
      public.pawperks_account_referral_codes.owner_email,
      excluded.owner_email
    ),
    program_context = coalesce(
      public.pawperks_account_referral_codes.program_context,
      excluded.program_context
    ),
    program_type = coalesce(
      public.pawperks_account_referral_codes.program_type,
      excluded.program_type
    ),
    campaign_type = coalesce(
      public.pawperks_account_referral_codes.campaign_type,
      excluded.campaign_type
    ),
    legacy_referral_code_id = coalesce(
      public.pawperks_account_referral_codes.legacy_referral_code_id,
      excluded.legacy_referral_code_id
    ),
    ambassador_id = coalesce(
      public.pawperks_account_referral_codes.ambassador_id,
      excluded.ambassador_id
    ),
    guru_id = coalesce(
      public.pawperks_account_referral_codes.guru_id,
      excluded.guru_id
    ),
    partner_id = coalesce(
      public.pawperks_account_referral_codes.partner_id,
      excluded.partner_id
    ),
    status = case
      when excluded.status in ('archived', 'inactive', 'disabled', 'deleted', 'expired')
        then excluded.status
      else public.pawperks_account_referral_codes.status
    end,
    updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.sync_legacy_referral_code_to_canonical()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.upsert_canonical_referral_code_from_json(
    to_jsonb(new),
    tg_table_name
  );

  return new;
end;
$$;

-- Backfill all known referral-code sources without requiring any one legacy
-- table to exist.
do $$
declare
  v_table text;
  v_row jsonb;
begin
  foreach v_table in array array[
    'referral_codes',
    'referral_profiles',
    'profiles',
    'customers',
    'pet_parents',
    'gurus',
    'ambassadors',
    'guru_referral_campaigns'
  ]
  loop
    if to_regclass(format('public.%I', v_table)) is not null then
      for v_row in execute format(
        'select to_jsonb(t) from public.%I t',
        v_table
      )
      loop
        perform public.upsert_canonical_referral_code_from_json(
          v_row,
          v_table
        );
      end loop;
    end if;
  end loop;
end;
$$;

-- Keep the canonical registry synchronized with future inserts and updates.
do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'referral_codes',
    'referral_profiles',
    'profiles',
    'customers',
    'pet_parents',
    'gurus',
    'ambassadors',
    'guru_referral_campaigns'
  ]
  loop
    if to_regclass(format('public.%I', v_table)) is not null then
      execute format(
        'drop trigger if exists sitguru_referral_code_sync_trg on public.%I',
        v_table
      );

      execute format(
        'create trigger sitguru_referral_code_sync_trg
         after insert or update on public.%I
         for each row
         execute function public.sync_legacy_referral_code_to_canonical()',
        v_table
      );
    end if;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tracked links and QR scans
-- ---------------------------------------------------------------------------

create or replace function public.record_referral_click_event_from_json(
  p_row jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_canonical_code_id uuid := null;
  v_legacy_code_id uuid := public.try_uuid(p_row->>'referral_code_id');
  v_code text := public.normalize_sitguru_referral_code(
    coalesce(
      p_row->>'referral_code',
      p_row->>'code',
      ''
    )
  );

  v_legacy_row jsonb := null;
  v_event_type text := 'link_visit';
  v_medium text := lower(
    coalesce(
      p_row->>'utm_medium',
      p_row->>'medium',
      ''
    )
  );
  v_landing_page text := coalesce(p_row->>'landing_page', '');
  v_source_event_id text := coalesce(p_row->>'id', '');
  v_dedupe_key text := '';

  v_code_row public.pawperks_account_referral_codes%rowtype;
  v_occurred_at timestamptz := coalesce(
    public.try_timestamptz(p_row->>'created_at'),
    now()
  );
begin
  if v_medium = 'qr'
     or lower(v_landing_page) like '%via=qr%' then
    v_event_type := 'qr_scan';
  end if;

  if v_legacy_code_id is not null then
    select id
    into v_canonical_code_id
    from public.pawperks_account_referral_codes
    where legacy_referral_code_id = v_legacy_code_id
    limit 1;
  end if;

  if v_canonical_code_id is null
     and v_legacy_code_id is not null
     and to_regclass('public.referral_codes') is not null then

    execute $sql$
      select to_jsonb(t)
      from public.referral_codes t
      where t.id::text = $1
      limit 1
    $sql$
    into v_legacy_row
    using v_legacy_code_id::text;

    if v_legacy_row is not null then
      v_canonical_code_id :=
        public.upsert_canonical_referral_code_from_json(
          v_legacy_row,
          'referral_codes'
        );

      if v_code = '' then
        v_code := public.normalize_sitguru_referral_code(
          coalesce(
            v_legacy_row->>'normalized_code',
            v_legacy_row->>'code',
            v_legacy_row->>'referral_code',
            ''
          )
        );
      end if;
    end if;
  end if;

  if v_canonical_code_id is null and v_code <> '' then
    select id
    into v_canonical_code_id
    from public.pawperks_account_referral_codes
    where normalized_code = v_code
    limit 1;
  end if;

  if v_canonical_code_id is null then
    return false;
  end if;

  select *
  into v_code_row
  from public.pawperks_account_referral_codes
  where id = v_canonical_code_id;

  if v_code = '' then
    v_code := v_code_row.normalized_code;
  end if;

  if v_source_event_id <> '' then
    v_dedupe_key := 'referral_clicks:' || v_source_event_id;
  else
    v_dedupe_key :=
      'referral_clicks:' ||
      encode(
        digest(
          concat_ws(
            '|',
            v_canonical_code_id::text,
            v_event_type,
            coalesce(v_landing_page, ''),
            v_occurred_at::text
          ),
          'sha256'
        ),
        'hex'
      );
  end if;

  insert into public.pawperks_referral_events (
    canonical_code_id,
    submitted_code,

    referrer_profile_id,
    referrer_user_id,
    referrer_role,

    event_type,
    program_context,
    capture_point,

    source,
    platform,
    medium,
    campaign,

    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,

    landing_page,

    conversion_stage,
    conversion_status,

    source_table,
    source_event_id,
    dedupe_key,

    metadata,
    occurred_at,
    created_at,
    updated_at
  )
  values (
    v_canonical_code_id,
    v_code,

    v_code_row.profile_id,
    v_code_row.user_id,
    coalesce(v_code_row.primary_role, v_code_row.owner_type),

    v_event_type,
    coalesce(
      v_code_row.program_context,
      v_code_row.program_type,
      v_code_row.campaign_type
    ),
    'tracked_referral_route',

    coalesce(
      p_row->>'utm_source',
      p_row->>'source',
      'referral_link'
    ),
    coalesce(p_row->>'platform', p_row->>'utm_source'),
    coalesce(p_row->>'utm_medium', p_row->>'medium'),
    coalesce(p_row->>'utm_campaign', p_row->>'campaign'),

    p_row->>'utm_source',
    p_row->>'utm_medium',
    p_row->>'utm_campaign',
    p_row->>'utm_content',

    nullif(v_landing_page, ''),

    'visit',
    'recorded',

    'referral_clicks',
    nullif(v_source_event_id, ''),
    v_dedupe_key,

    p_row,
    v_occurred_at,
    v_occurred_at,
    now()
  )
  on conflict (dedupe_key)
  where dedupe_key is not null
  do nothing;

  return true;
end;
$$;

create or replace function public.sync_referral_click_to_canonical_event()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.record_referral_click_event_from_json(to_jsonb(new));
  return new;
end;
$$;

-- Backfill existing referral clicks before installing the trigger.
do $$
declare
  v_row jsonb;
begin
  if to_regclass('public.referral_clicks') is not null then
    for v_row in
      execute 'select to_jsonb(t) from public.referral_clicks t'
    loop
      perform public.record_referral_click_event_from_json(v_row);
    end loop;
  end if;
end;
$$;

do $$
begin
  if to_regclass('public.referral_clicks') is not null then
    execute
      'drop trigger if exists sitguru_referral_click_event_sync_trg
       on public.referral_clicks';

    execute
      'create trigger sitguru_referral_click_event_sync_trg
       after insert on public.referral_clicks
       for each row
       execute function public.sync_referral_click_to_canonical_event()';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Backfill durable relationships from existing general referrals when possible
-- ---------------------------------------------------------------------------

do $$
declare
  v_row jsonb;
  v_code text;
  v_user_id uuid;
  v_canonical_code_id uuid;
  v_referrer_user_id uuid;
  v_referrer_profile_id uuid;
  v_referred_profile_id uuid;
  v_code_row public.pawperks_account_referral_codes%rowtype;
begin
  if to_regclass('public.referrals') is not null then
    for v_row in execute 'select to_jsonb(t) from public.referrals t'
    loop
      v_code := public.normalize_sitguru_referral_code(
        coalesce(v_row->>'referral_code', v_row->>'code', '')
      );

      v_user_id := public.try_auth_user_id(
        v_row->>'referred_user_id'
      );

      if v_code = '' or v_user_id is null then
        continue;
      end if;

      select *
      into v_code_row
      from public.pawperks_account_referral_codes
      where normalized_code = v_code
      limit 1;

      if v_code_row.id is null then
        continue;
      end if;

      v_canonical_code_id := v_code_row.id;
      v_referrer_user_id := coalesce(
        public.try_auth_user_id(v_row->>'referrer_user_id'),
        v_code_row.user_id
      );
      v_referrer_profile_id := coalesce(
        public.try_uuid(v_row->>'referrer_profile_id'),
        v_code_row.profile_id
      );
      v_referred_profile_id :=
        public.try_uuid(v_row->>'referred_profile_id');

      insert into public.pawperks_referral_relationships (
        canonical_code_id,
        referral_code,

        referrer_profile_id,
        referrer_user_id,
        referrer_role,
        referrer_display_name,

        referred_profile_id,
        referred_user_id,
        referred_role,
        referred_display_name,
        referred_email,

        source,
        platform,
        medium,
        campaign,

        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,

        status,
        referral_stage,
        signup_at,
        reward_status,
        reward_amount,
        metadata
      )
      values (
        v_canonical_code_id,
        v_code,

        v_referrer_profile_id,
        v_referrer_user_id,
        coalesce(v_code_row.primary_role, v_code_row.owner_type),
        v_code_row.owner_display_name,

        v_referred_profile_id,
        v_user_id,
        coalesce(
          v_row->>'referred_role',
          v_row->>'referral_type',
          'unknown'
        ),
        coalesce(
          v_row->>'referred_display_name',
          v_row->>'display_name',
          v_row->>'referred_name'
        ),
        lower(
          coalesce(
            v_row->>'referred_email',
            v_row->>'email',
            ''
          )
        ),

        coalesce(v_row->>'source', 'legacy_referrals_backfill'),
        v_row->>'platform',
        coalesce(v_row->>'medium', v_row->>'utm_medium'),
        coalesce(v_row->>'campaign', v_row->>'utm_campaign'),

        v_row->>'utm_source',
        v_row->>'utm_medium',
        v_row->>'utm_campaign',
        v_row->>'utm_content',

        coalesce(v_row->>'status', 'pending'),
        coalesce(v_row->>'conversion_stage', 'signup'),
        coalesce(
          public.try_timestamptz(v_row->>'signup_at'),
          public.try_timestamptz(v_row->>'created_at'),
          now()
        ),
        coalesce(v_row->>'reward_status', 'not_evaluated'),
        greatest(
          coalesce(nullif(v_row->>'reward_amount', '')::numeric, 0),
          0
        ),
        jsonb_build_object(
          'legacy_source_table', 'referrals',
          'legacy_row_id', v_row->>'id'
        )
      )
      on conflict (referred_user_id)
      do nothing;
    end loop;
  end if;
exception
  when others then
    raise warning
      'Universal referral relationship backfill skipped remaining rows: %',
      sqlerrm;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.pawperks_account_referral_codes
  enable row level security;

alter table public.pawperks_referral_code_aliases
  enable row level security;

alter table public.pawperks_referral_events
  enable row level security;

alter table public.pawperks_referral_relationships
  enable row level security;

alter table public.pawperks_referral_audit_log
  enable row level security;

drop policy if exists
  pawperks_account_referral_codes_select_own_or_admin
on public.pawperks_account_referral_codes;

create policy pawperks_account_referral_codes_select_own_or_admin
on public.pawperks_account_referral_codes
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_sitguru_admin()
);

drop policy if exists
  pawperks_referral_code_aliases_select_own_or_admin
on public.pawperks_referral_code_aliases;

create policy pawperks_referral_code_aliases_select_own_or_admin
on public.pawperks_referral_code_aliases
for select
to authenticated
using (
  public.is_sitguru_admin()
  or exists (
    select 1
    from public.pawperks_account_referral_codes c
    where c.id = canonical_code_id
      and c.user_id = auth.uid()
  )
);

drop policy if exists
  pawperks_referral_events_select_participant_or_admin
on public.pawperks_referral_events;

create policy pawperks_referral_events_select_participant_or_admin
on public.pawperks_referral_events
for select
to authenticated
using (
  referrer_user_id = auth.uid()
  or referred_user_id = auth.uid()
  or public.is_sitguru_admin()
);

drop policy if exists
  pawperks_referral_relationships_select_participant_or_admin
on public.pawperks_referral_relationships;

create policy pawperks_referral_relationships_select_participant_or_admin
on public.pawperks_referral_relationships
for select
to authenticated
using (
  referrer_user_id = auth.uid()
  or referred_user_id = auth.uid()
  or public.is_sitguru_admin()
);

drop policy if exists
  pawperks_referral_audit_log_select_admin
on public.pawperks_referral_audit_log;

create policy pawperks_referral_audit_log_select_admin
on public.pawperks_referral_audit_log
for select
to authenticated
using (public.is_sitguru_admin());

revoke all
on public.pawperks_account_referral_codes
from anon;

revoke all
on public.pawperks_referral_code_aliases
from anon;

revoke all
on public.pawperks_referral_events
from anon;

revoke all
on public.pawperks_referral_relationships
from anon;

revoke all
on public.pawperks_referral_audit_log
from anon;

grant select
on public.pawperks_account_referral_codes
to authenticated;

grant select
on public.pawperks_referral_code_aliases
to authenticated;

grant select
on public.pawperks_referral_events
to authenticated;

grant select
on public.pawperks_referral_relationships
to authenticated;

grant select
on public.pawperks_referral_audit_log
to authenticated;

grant all
on public.pawperks_account_referral_codes
to service_role;

grant all
on public.pawperks_referral_code_aliases
to service_role;

grant all
on public.pawperks_referral_events
to service_role;

grant all
on public.pawperks_referral_relationships
to service_role;

grant all
on public.pawperks_referral_audit_log
to service_role;

-- ---------------------------------------------------------------------------
-- Safe participant view and full Admin view
-- ---------------------------------------------------------------------------

create or replace view public.my_referral_relationships
with (security_invoker = true)
as
select
  r.id,
  r.referral_code,

  r.referrer_user_id,
  r.referrer_role,
  r.referrer_display_name,

  r.referred_user_id,
  r.referred_role,
  r.referred_display_name,

  r.source,
  r.platform,
  r.medium,
  r.campaign,

  r.status,
  r.referral_stage,

  r.signup_at,
  r.verified_at,
  r.profile_completed_at,
  r.activated_at,
  r.qualified_at,
  r.first_booking_at,

  r.reward_status,
  r.reward_amount,
  r.reward_approved_at,
  r.reward_paid_at,

  (
    select count(*)::bigint
    from public.pawperks_referral_events e
    where e.canonical_code_id = r.canonical_code_id
      and e.event_type = 'link_visit'
  ) as tracked_link_visits,

  (
    select count(*)::bigint
    from public.pawperks_referral_events e
    where e.canonical_code_id = r.canonical_code_id
      and e.event_type = 'qr_scan'
  ) as tracked_qr_scans,

  r.created_at,
  r.updated_at
from public.pawperks_referral_relationships r;

revoke all
on public.my_referral_relationships
from anon;

grant select
on public.my_referral_relationships
to authenticated;

grant select
on public.my_referral_relationships
to service_role;

create or replace view public.admin_referral_tracking
with (security_invoker = true)
as
select
  r.*,

  c.owner_type as code_owner_type,
  c.primary_role as code_owner_primary_role,
  c.owner_display_name as code_owner_display_name,
  c.owner_email as code_owner_email,
  c.program_context,
  c.program_type,
  c.campaign_type,
  c.ambassador_id,
  c.guru_id,
  c.partner_id,
  c.legacy_referral_code_id,

  (
    select count(*)::bigint
    from public.pawperks_referral_events e
    where e.canonical_code_id = r.canonical_code_id
      and e.event_type = 'link_visit'
  ) as tracked_link_visits,

  (
    select count(*)::bigint
    from public.pawperks_referral_events e
    where e.canonical_code_id = r.canonical_code_id
      and e.event_type = 'qr_scan'
  ) as tracked_qr_scans,

  (
    select max(e.occurred_at)
    from public.pawperks_referral_events e
    where e.canonical_code_id = r.canonical_code_id
      and e.event_type in ('link_visit', 'qr_scan')
  ) as last_tracked_visit_at

from public.pawperks_referral_relationships r
join public.pawperks_account_referral_codes c
  on c.id = r.canonical_code_id;

revoke all
on public.admin_referral_tracking
from anon, authenticated;

grant select
on public.admin_referral_tracking
to service_role;

comment on table public.pawperks_account_referral_codes is
  'Canonical SitGuru referral-code registry for Pet Parents, Gurus, Ambassadors, partners, businesses, campaigns, and system codes.';

comment on table public.pawperks_referral_events is
  'Append-only referral event stream for tracked links, QR scans, signup capture, verification, activation, qualification, booking, and reward audit events.';

comment on table public.pawperks_referral_relationships is
  'One durable first-touch referral relationship per referred SitGuru account. Reward status remains separate from attribution.';

comment on view public.my_referral_relationships is
  'RLS-protected safe referral progress view for the referrer and referred member.';

comment on view public.admin_referral_tracking is
  'Full universal referral tracking view intended for SitGuru Admin server-side access through the service role.';

commit;