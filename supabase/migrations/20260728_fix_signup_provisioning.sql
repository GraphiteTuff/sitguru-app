-- SitGuru signup provisioning repair
-- Purpose:
--   1. Create the core SitGuru workspace before referral-code work.
--   2. Repair missing public.users compatibility rows used by older foreign keys.
--   3. Remove the requirement for a UNIQUE constraint from the generic upsert helper.
--   4. Prevent referral-code schema/FK problems from rolling back a valid signup.
--   5. Provision or repair Pet Parent, Guru, Ambassador, and combined accounts.
--
-- Recommended migration path:
--   supabase/migrations/20260728_fix_signup_provisioning.sql

create extension if not exists pgcrypto;

alter table if exists public.profiles
  add column if not exists user_id uuid,
  add column if not exists service_area text,
  add column if not exists referral_code text,
  add column if not exists updated_at timestamptz;

alter table if exists public.gurus
  add column if not exists user_id uuid,
  add column if not exists service_area text,
  add column if not exists updated_at timestamptz;

alter table if exists public.ambassadors
  add column if not exists user_id uuid,
  add column if not exists full_name text,
  add column if not exists email text,
  add column if not exists contact_email text,
  add column if not exists phone text,
  add column if not exists referral_code text,
  add column if not exists status text,
  add column if not exists referral_status text,
  add column if not exists onboarding_status text,
  add column if not exists training_status text,
  add column if not exists dashboard_enabled boolean default false,
  add column if not exists login_enabled boolean default false,
  add column if not exists dashboard_slug text,
  add column if not exists base_zip_code text,
  add column if not exists service_area text,
  add column if not exists updated_at timestamptz;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.user_roles
  add column if not exists updated_at timestamptz;

create unique index if not exists user_roles_user_id_role_key
  on public.user_roles(user_id, role);

create index if not exists profiles_user_id_lookup_idx
  on public.profiles(user_id);

create index if not exists gurus_user_id_lookup_idx
  on public.gurus(user_id);

create index if not exists ambassadors_user_id_lookup_idx
  on public.ambassadors(user_id);

create or replace function public.sitguru_table_has_column(
  p_table regclass,
  p_column text
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from pg_attribute
    where attrelid = p_table
      and attnum > 0
      and not attisdropped
      and attname = p_column
  );
$$;

revoke all on function public.sitguru_table_has_column(regclass, text)
  from public, anon, authenticated;
grant execute on function public.sitguru_table_has_column(regclass, text)
  to service_role;

-- Update an existing row first, then insert only when no matching row exists.
-- Unlike ON CONFLICT, this helper does not require a UNIQUE constraint on the
-- selected conflict columns. This is important for older SitGuru tables.
create or replace function public.sitguru_upsert_known_columns(
  p_table regclass,
  p_payload jsonb,
  p_conflict_columns text[],
  p_update_columns text[] default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_insert_columns text;
  v_select_columns text;
  v_update_assignments text;
  v_match_predicate text;
  v_missing_conflicts text;
  v_update_sql text;
  v_insert_sql text;
  v_exists_sql text;
  v_rows integer := 0;
  v_exists boolean := false;
begin
  if p_table is null then
    raise exception 'A target table is required.';
  end if;

  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'A JSON object payload is required for %.', p_table::text;
  end if;

  if p_conflict_columns is null or cardinality(p_conflict_columns) = 0 then
    raise exception 'At least one conflict column is required for %.', p_table::text;
  end if;

  select string_agg(requested.conflict_column, ', ' order by requested.ordinal_position)
  into v_missing_conflicts
  from unnest(p_conflict_columns) with ordinality
    as requested(conflict_column, ordinal_position)
  where not public.sitguru_table_has_column(
    p_table,
    requested.conflict_column
  )
  or not (p_payload ? requested.conflict_column);

  if v_missing_conflicts is not null then
    raise exception 'Missing conflict columns for %: %',
      p_table::text,
      v_missing_conflicts;
  end if;

  select
    string_agg(format('%I', attribute.attname), ', ' order by attribute.attnum),
    string_agg(format('source.%I', attribute.attname), ', ' order by attribute.attnum)
  into v_insert_columns, v_select_columns
  from pg_attribute attribute
  where attribute.attrelid = p_table
    and attribute.attnum > 0
    and not attribute.attisdropped
    and attribute.attgenerated = ''
    and attribute.attidentity <> 'a'
    and p_payload ? attribute.attname;

  if v_insert_columns is null then
    raise exception 'No matching columns were found for %.', p_table::text;
  end if;

  select string_agg(
    format('target.%1$I is not distinct from source.%1$I', requested.conflict_column),
    ' and ' order by requested.ordinal_position
  )
  into v_match_predicate
  from unnest(p_conflict_columns) with ordinality
    as requested(conflict_column, ordinal_position);

  select string_agg(
    format('%1$I = source.%1$I', attribute.attname),
    ', ' order by attribute.attnum
  )
  into v_update_assignments
  from pg_attribute attribute
  where attribute.attrelid = p_table
    and attribute.attnum > 0
    and not attribute.attisdropped
    and attribute.attgenerated = ''
    and attribute.attidentity <> 'a'
    and p_payload ? attribute.attname
    and not (attribute.attname = any(p_conflict_columns))
    and (
      p_update_columns is null
      or attribute.attname = any(p_update_columns)
    );

  if v_update_assignments is not null then
    v_update_sql := format(
      'update %1$s as target '
      'set %2$s '
      'from jsonb_populate_record(null::%1$s, $1) as source '
      'where %3$s',
      p_table,
      v_update_assignments,
      v_match_predicate
    );

    execute v_update_sql using p_payload;
    get diagnostics v_rows = row_count;

    if v_rows > 0 then
      return;
    end if;
  else
    v_exists_sql := format(
      'select exists ('
      '  select 1 '
      '  from %1$s as target '
      '  cross join jsonb_populate_record(null::%1$s, $1) as source '
      '  where %2$s'
      ')',
      p_table,
      v_match_predicate
    );

    execute v_exists_sql into v_exists using p_payload;

    if v_exists then
      return;
    end if;
  end if;

  v_insert_sql := format(
    'insert into %1$s (%2$s) '
    'select %3$s '
    'from jsonb_populate_record(null::%1$s, $1) as source',
    p_table,
    v_insert_columns,
    v_select_columns
  );

  begin
    execute v_insert_sql using p_payload;
  exception
    when unique_violation then
      -- A concurrent request may have inserted the row. Retry the update.
      if v_update_sql is not null then
        execute v_update_sql using p_payload;
        get diagnostics v_rows = row_count;

        if v_rows > 0 then
          return;
        end if;
      end if;

      raise;
  end;
end;
$$;

revoke all on function public.sitguru_upsert_known_columns(
  regclass,
  jsonb,
  text[],
  text[]
) from public, anon, authenticated;

grant execute on function public.sitguru_upsert_known_columns(
  regclass,
  jsonb,
  text[],
  text[]
) to service_role;

create or replace function public.provision_sitguru_account(
  p_user_id uuid,
  p_intent text,
  p_full_name text default null,
  p_email text default null,
  p_phone text default null,
  p_zip_code text default null,
  p_service_area text default null,
  p_ambassador_referral_code text default null,
  p_source text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_now timestamptz := now();
  v_intent text;
  v_profile_role text;
  v_roles text[];
  v_role text;
  v_expected_role_count integer;
  v_saved_role_count integer := 0;

  v_auth_email text;
  v_auth_phone text;
  v_auth_metadata jsonb := '{}'::jsonb;
  v_email_confirmed_at timestamptz;

  v_full_name text;
  v_first_name text;
  v_last_name text;
  v_email text;
  v_phone text;
  v_zip_code text;
  v_service_area text;
  v_source text;
  v_program text;

  v_referral_code text := null;
  v_referral_base text;
  v_referral_suffix text;
  v_candidate_code text;
  v_candidate_number integer := 0;
  v_code_owner_column text;
  v_code_lookup_column text;
  v_code_exists boolean := false;
  v_code_table regclass;

  v_slug_base text;
  v_workspace_slug text;
  v_site_url text := 'https://www.sitguru.com';

  v_profile_exists boolean := false;
  v_role_rows_ready boolean := false;
  v_guru_ready boolean := true;
  v_ambassador_ready boolean := true;
  v_workspace_ready boolean := false;
  v_requires_email_verification boolean := false;

  v_public_users_table regclass;
  v_public_users_conflict text[];
  v_profiles_conflict text[];
begin
  if p_user_id is null then
    raise exception 'A SitGuru Auth user ID is required.' using errcode = '22023';
  end if;

  v_intent := lower(
    regexp_replace(
      coalesce(trim(p_intent), ''),
      '[[:space:]-]+',
      '_',
      'g'
    )
  );

  if v_intent in ('customer', 'petparent', 'pet_owner', 'petowner', 'parent') then
    v_intent := 'pet_parent';
  elsif v_intent in ('future_guru', 'pet_guru', 'provider', 'sitter', 'walker') then
    v_intent := 'guru';
  elsif v_intent in ('partner', 'community_ambassador', 'student_ambassador') then
    v_intent := 'ambassador';
  end if;

  if v_intent not in ('pet_parent', 'guru', 'ambassador', 'both') then
    raise exception 'Unsupported SitGuru account intent: %',
      coalesce(p_intent, '')
      using errcode = '22023';
  end if;

  select
    lower(coalesce(users.email, '')),
    coalesce(users.phone, ''),
    coalesce(users.raw_user_meta_data, '{}'::jsonb),
    users.email_confirmed_at
  into
    v_auth_email,
    v_auth_phone,
    v_auth_metadata,
    v_email_confirmed_at
  from auth.users users
  where users.id = p_user_id;

  if not found then
    raise exception 'The SitGuru Auth account could not be found.'
      using errcode = 'P0002';
  end if;

  v_email := lower(
    coalesce(
      nullif(trim(p_email), ''),
      nullif(v_auth_email, ''),
      ''
    )
  );

  v_phone := coalesce(
    nullif(trim(p_phone), ''),
    nullif(v_auth_phone, ''),
    ''
  );

  v_full_name := coalesce(
    nullif(
      regexp_replace(
        trim(coalesce(p_full_name, '')),
        '[[:space:]]+',
        ' ',
        'g'
      ),
      ''
    ),
    nullif(
      regexp_replace(
        trim(coalesce(v_auth_metadata ->> 'full_name', '')),
        '[[:space:]]+',
        ' ',
        'g'
      ),
      ''
    ),
    nullif(
      regexp_replace(
        trim(
          concat_ws(
            ' ',
            nullif(v_auth_metadata ->> 'first_name', ''),
            nullif(v_auth_metadata ->> 'last_name', '')
          )
        ),
        '[[:space:]]+',
        ' ',
        'g'
      ),
      ''
    ),
    nullif(split_part(v_email, '@', 1), ''),
    'SitGuru Member'
  );

  v_first_name := nullif(split_part(v_full_name, ' ', 1), '');
  v_last_name := nullif(
    trim(
      regexp_replace(
        v_full_name,
        '^[^[:space:]]+[[:space:]]*',
        ''
      )
    ),
    ''
  );

  v_zip_code := coalesce(
    nullif(trim(p_zip_code), ''),
    nullif(trim(v_auth_metadata ->> 'zip_code'), ''),
    nullif(trim(v_auth_metadata ->> 'postal_code'), ''),
    ''
  );

  v_service_area := coalesce(
    nullif(trim(p_service_area), ''),
    nullif(trim(v_auth_metadata ->> 'service_area'), ''),
    nullif(trim(v_auth_metadata ->> 'community_area'), ''),
    nullif(v_zip_code, ''),
    ''
  );

  v_source := coalesce(
    nullif(trim(p_source), ''),
    'sitguru_signup_api'
  );

  v_program := coalesce(
    nullif(trim(v_auth_metadata ->> 'ambassador_program'), ''),
    nullif(trim(v_auth_metadata ->> 'program'), ''),
    nullif(trim(v_auth_metadata ->> 'candidate_path'), ''),
    ''
  );

  case v_intent
    when 'pet_parent' then
      v_profile_role := 'customer';
      v_roles := array['customer']::text[];
    when 'guru' then
      v_profile_role := 'guru';
      v_roles := array['guru']::text[];
    when 'ambassador' then
      v_profile_role := 'ambassador';
      v_roles := array['ambassador']::text[];
    when 'both' then
      v_profile_role := 'both';
      v_roles := array['customer', 'guru']::text[];
  end case;

  v_expected_role_count := cardinality(v_roles);

  v_slug_base := lower(
    regexp_replace(v_full_name, '[^A-Za-z0-9]+', '-', 'g')
  );
  v_slug_base := trim(both '-' from v_slug_base);
  v_workspace_slug :=
    coalesce(nullif(v_slug_base, ''), 'sitguru')
    || '-'
    || lower(left(replace(p_user_id::text, '-', ''), 8));

  -- -------------------------------------------------------------------------
  -- CORE ACCOUNT PROVISIONING
  -- These writes happen before referral-code creation. A referral/FK mismatch
  -- must never prevent a real member from receiving a SitGuru workspace.
  -- -------------------------------------------------------------------------

  v_public_users_table := to_regclass('public.users');

  if v_public_users_table is not null then
    begin
      if public.sitguru_table_has_column(v_public_users_table, 'id') then
        v_public_users_conflict := array['id'];
      elsif public.sitguru_table_has_column(v_public_users_table, 'user_id') then
        v_public_users_conflict := array['user_id'];
      else
        v_public_users_conflict := null;
      end if;

      if v_public_users_conflict is not null then
        perform public.sitguru_upsert_known_columns(
          v_public_users_table,
          jsonb_strip_nulls(
            jsonb_build_object(
              'id', p_user_id,
              'user_id', p_user_id,
              'auth_user_id', p_user_id,
              'full_name', v_full_name,
              'display_name', v_full_name,
              'name', v_full_name,
              'first_name', v_first_name,
              'last_name', v_last_name,
              'email', nullif(v_email, ''),
              'phone', nullif(v_phone, ''),
              'role', v_profile_role,
              'account_type', v_profile_role,
              'status', 'active',
              'source', v_source,
              'created_at', v_now,
              'updated_at', v_now
            )
          ),
          v_public_users_conflict,
          array[
            'full_name',
            'display_name',
            'name',
            'first_name',
            'last_name',
            'email',
            'phone',
            'role',
            'account_type',
            'status',
            'source',
            'updated_at'
          ]
        );
      end if;
    exception
      when others then
        -- Log the compatibility failure but continue. The core profiles/gurus
        -- tables may not depend on public.users in every environment.
        raise warning 'SitGuru public.users compatibility repair failed for %: %',
          p_user_id,
          sqlerrm;
    end;
  end if;

  if public.sitguru_table_has_column('public.profiles'::regclass, 'id') then
    v_profiles_conflict := array['id'];
  else
    v_profiles_conflict := array['user_id'];
  end if;

  perform public.sitguru_upsert_known_columns(
    'public.profiles'::regclass,
    jsonb_strip_nulls(
      jsonb_build_object(
        'id', p_user_id,
        'user_id', p_user_id,
        'auth_user_id', p_user_id,
        'full_name', v_full_name,
        'display_name', v_full_name,
        'name', v_full_name,
        'first_name', v_first_name,
        'last_name', v_last_name,
        'email', nullif(v_email, ''),
        'phone', nullif(v_phone, ''),
        'role', v_profile_role,
        'account_type', v_profile_role,
        'source', v_source,
        'zip_code', nullif(v_zip_code, ''),
        'postal_code', nullif(v_zip_code, ''),
        'service_area', nullif(v_service_area, ''),
        'ambassador_referral_code',
          nullif(upper(trim(p_ambassador_referral_code)), ''),
        'account_status', 'active',
        'status', 'active',
        'is_archived', false,
        'is_test_account', false,
        'created_at', v_now,
        'updated_at', v_now
      )
    ),
    v_profiles_conflict,
    array[
      'user_id',
      'auth_user_id',
      'full_name',
      'display_name',
      'name',
      'first_name',
      'last_name',
      'email',
      'phone',
      'role',
      'account_type',
      'source',
      'zip_code',
      'postal_code',
      'service_area',
      'ambassador_referral_code',
      'account_status',
      'status',
      'is_archived',
      'is_test_account',
      'updated_at'
    ]
  );

  foreach v_role in array v_roles
  loop
    perform public.sitguru_upsert_known_columns(
      'public.user_roles'::regclass,
      jsonb_build_object(
        'user_id', p_user_id,
        'role', v_role,
        'created_at', v_now,
        'updated_at', v_now
      ),
      array['user_id', 'role'],
      array['updated_at']
    );
  end loop;

  if v_intent in ('guru', 'both') then
    perform public.sitguru_upsert_known_columns(
      'public.gurus'::regclass,
      jsonb_strip_nulls(
        jsonb_build_object(
          'user_id', p_user_id,
          'profile_id', p_user_id,
          'display_name', v_full_name,
          'full_name', v_full_name,
          'name', v_full_name,
          'email', nullif(v_email, ''),
          'phone', nullif(v_phone, ''),
          'slug', v_workspace_slug,
          'zip_code', nullif(v_zip_code, ''),
          'postal_code', nullif(v_zip_code, ''),
          'service_area', nullif(v_service_area, ''),
          'source', v_source,
          'ambassador_referral_code',
            nullif(upper(trim(p_ambassador_referral_code)), ''),
          'status', 'pending_setup',
          'is_public', false,
          'booking_status', 'not_listed',
          'application_status', 'pending',
          'admin_status', 'pending_setup',
          'profile_quality_status', 'needs_setup',
          'is_public_visible', false,
          'is_bookable', false,
          'is_archived', false,
          'is_test_account', false,
          'missing_requirements', jsonb_build_array(
            'services offered',
            'rates/pricing',
            'availability',
            'bio/about',
            'profile photo',
            'admin approved'
          ),
          'onboarding_completed', false,
          'profile_completed', false,
          'created_at', v_now,
          'updated_at', v_now
        )
      ),
      array['user_id'],
      array[
        'profile_id',
        'display_name',
        'full_name',
        'name',
        'email',
        'phone',
        'slug',
        'zip_code',
        'postal_code',
        'service_area',
        'source',
        'ambassador_referral_code',
        'is_archived',
        'is_test_account',
        'updated_at'
      ]
    );
  end if;

  if v_intent = 'ambassador' then
    perform public.sitguru_upsert_known_columns(
      'public.ambassadors'::regclass,
      jsonb_strip_nulls(
        jsonb_build_object(
          'user_id', p_user_id,
          'profile_id', p_user_id,
          'full_name', v_full_name,
          'display_name', v_full_name,
          'name', v_full_name,
          'email', nullif(v_email, ''),
          'contact_email', nullif(v_email, ''),
          'login_email', nullif(v_email, ''),
          'phone', nullif(v_phone, ''),
          'status', 'new',
          'referral_status', 'active',
          'admin_status', 'application_received',
          'profile_quality_status', 'needs_setup',
          'is_public_visible', false,
          'is_bookable', false,
          'is_archived', false,
          'is_test_account', false,
          'missing_requirements', jsonb_build_array(
            'admin approved',
            'training completion'
          ),
          'onboarding_status', 'started',
          'training_status', 'not_started',
          'dashboard_enabled', true,
          'login_enabled', true,
          'dashboard_slug', v_workspace_slug,
          'base_zip_code', nullif(v_zip_code, ''),
          'zip_code', nullif(v_zip_code, ''),
          'service_area', nullif(v_service_area, ''),
          'source', v_source,
          'program', nullif(v_program, ''),
          'internal_role', 'ambassador',
          'created_at', v_now,
          'updated_at', v_now
        )
      ),
      array['user_id'],
      array[
        'profile_id',
        'full_name',
        'display_name',
        'name',
        'email',
        'contact_email',
        'login_email',
        'phone',
        'dashboard_slug',
        'base_zip_code',
        'zip_code',
        'service_area',
        'source',
        'program',
        'internal_role',
        'dashboard_enabled',
        'login_enabled',
        'is_archived',
        'is_test_account',
        'updated_at'
      ]
    );

    update public.ambassadors
    set
      dashboard_enabled = true,
      login_enabled = true,
      referral_status = case
        when referral_status is null
          or trim(referral_status) in ('', 'pending')
          then 'active'
        else referral_status
      end,
      updated_at = v_now
    where user_id = p_user_id
      and lower(coalesce(status, '')) not in (
        'archived',
        'inactive',
        'suspended'
      );
  end if;

  -- Verify the core workspace before any referral code is attempted.
  select exists (
    select 1
    from public.profiles profiles
    where profiles.id = p_user_id
       or profiles.user_id = p_user_id
  )
  into v_profile_exists;

  select count(distinct roles.role)
  into v_saved_role_count
  from public.user_roles roles
  where roles.user_id = p_user_id
    and roles.role = any(v_roles);

  v_role_rows_ready := v_saved_role_count = v_expected_role_count;

  if v_intent in ('guru', 'both') then
    select exists (
      select 1
      from public.gurus gurus
      where gurus.user_id = p_user_id
    )
    into v_guru_ready;
  end if;

  if v_intent = 'ambassador' then
    select exists (
      select 1
      from public.ambassadors ambassadors
      where ambassadors.user_id = p_user_id
        and ambassadors.dashboard_enabled is true
        and ambassadors.login_enabled is true
        and lower(coalesce(ambassadors.status, '')) <> 'archived'
    )
    into v_ambassador_ready;
  end if;

  v_workspace_ready :=
    v_profile_exists
    and v_role_rows_ready
    and v_guru_ready
    and v_ambassador_ready;

  if not v_workspace_ready then
    return jsonb_build_object(
      'ok', false,
      'user_id', p_user_id,
      'intent', v_intent,
      'profile_role', v_profile_role,
      'roles', to_jsonb(v_roles),
      'referral_code', null,
      'workspace_ready', false,
      'requires_email_verification',
        v_auth_email <> '' and v_email_confirmed_at is null,
      'diagnostics', jsonb_build_object(
        'profile_exists', v_profile_exists,
        'role_rows_ready', v_role_rows_ready,
        'guru_ready', v_guru_ready,
        'ambassador_ready', v_ambassador_ready,
        'saved_role_count', v_saved_role_count,
        'expected_role_count', v_expected_role_count
      )
    );
  end if;

  -- -------------------------------------------------------------------------
  -- BEST-EFFORT REFERRAL CODE
  -- Any error here is logged and isolated. It cannot roll back the valid
  -- profile, role, Guru, or Ambassador workspace created above.
  -- -------------------------------------------------------------------------
  begin
    v_code_table := to_regclass('public.pawperks_account_referral_codes');

    if v_code_table is not null then
      if public.sitguru_table_has_column(v_code_table, 'user_id') then
        v_code_owner_column := 'user_id';
      elsif public.sitguru_table_has_column(v_code_table, 'account_id') then
        v_code_owner_column := 'account_id';
      else
        v_code_owner_column := null;
      end if;

      if public.sitguru_table_has_column(v_code_table, 'normalized_code') then
        v_code_lookup_column := 'normalized_code';
      elsif public.sitguru_table_has_column(v_code_table, 'code_normalized') then
        v_code_lookup_column := 'code_normalized';
      elsif public.sitguru_table_has_column(v_code_table, 'code') then
        v_code_lookup_column := 'code';
      else
        v_code_lookup_column := null;
      end if;

      if v_code_owner_column is not null then
        execute format(
          'select code from %s where %I = $1 limit 1',
          v_code_table,
          v_code_owner_column
        )
        into v_referral_code
        using p_user_id;
      end if;

      if v_referral_code is null and v_code_lookup_column is not null then
        v_referral_base := upper(
          regexp_replace(v_full_name, '[^A-Za-z0-9]', '', 'g')
        );
        v_referral_base := left(
          coalesce(nullif(v_referral_base, ''), 'SITGURU'),
          8
        );
        v_referral_suffix := upper(
          left(replace(p_user_id::text, '-', ''), 8)
        );

        loop
          v_candidate_code :=
            v_referral_base
            || '-'
            || v_referral_suffix
            || case
                 when v_candidate_number = 0 then ''
                 else '-' || v_candidate_number::text
               end;

          execute format(
            'select exists (select 1 from %s where %I = $1)',
            v_code_table,
            v_code_lookup_column
          )
          into v_code_exists
          using case
            when v_code_lookup_column in ('normalized_code', 'code')
              then upper(v_candidate_code)
            else lower(v_candidate_code)
          end;

          exit when not v_code_exists;

          v_candidate_number := v_candidate_number + 1;

          if v_candidate_number > 100 then
            raise exception 'SitGuru could not create a unique referral code.';
          end if;
        end loop;

        perform public.sitguru_upsert_known_columns(
          v_code_table,
          jsonb_strip_nulls(
            jsonb_build_object(
              'account_id', p_user_id,
              'user_id', p_user_id,
              'profile_id', p_user_id,
              'code', v_candidate_code,
              'normalized_code', upper(v_candidate_code),
              'code_normalized', lower(v_candidate_code),
              'owner_type',
                case
                  when v_intent = 'pet_parent' then 'pet_parent'
                  when v_intent = 'guru' then 'guru'
                  when v_intent = 'ambassador' then 'ambassador'
                  else 'multi_role'
                end,
              'primary_role', v_profile_role,
              'owner_display_name', v_full_name,
              'owner_email', nullif(v_email, ''),
              'program_context', 'pawperks',
              'program_type', 'account_referral',
              'campaign_type', 'member_referral',
              'program', 'pawperks',
              'status', 'active',
              'is_default', true,
              'source', 'signup',
              'metadata', jsonb_build_object(
                'role', v_profile_role,
                'intent', v_intent,
                'signup_source', v_source
              ),
              'created_at', v_now,
              'updated_at', v_now
            )
          ),
          array['code'],
          array[
            'normalized_code',
            'code_normalized',
            'user_id',
            'account_id',
            'profile_id',
            'owner_type',
            'primary_role',
            'owner_display_name',
            'owner_email',
            'program_context',
            'program_type',
            'campaign_type',
            'program',
            'status',
            'is_default',
            'source',
            'metadata',
            'updated_at'
          ]
        );

        v_referral_code := v_candidate_code;
      end if;
    end if;
  exception
    when others then
      v_referral_code := null;
      raise warning 'SitGuru referral code creation was skipped for %: %',
        p_user_id,
        sqlerrm;
  end;

  if v_referral_code is not null then
    begin
      perform public.sitguru_upsert_known_columns(
        'public.profiles'::regclass,
        jsonb_build_object(
          'id', p_user_id,
          'user_id', p_user_id,
          'referral_code', v_referral_code,
          'updated_at', v_now
        ),
        v_profiles_conflict,
        array['referral_code', 'updated_at']
      );

      if v_intent = 'ambassador' then
        perform public.sitguru_upsert_known_columns(
          'public.ambassadors'::regclass,
          jsonb_build_object(
            'user_id', p_user_id,
            'referral_code', v_referral_code,
            'referral_link', v_site_url || '/r/' || v_referral_code,
            'pet_parent_referral_url',
              v_site_url || '/r/' || v_referral_code || '?role=pet_parent',
            'guru_referral_url',
              v_site_url || '/r/' || v_referral_code || '?role=guru',
            'updated_at', v_now
          ),
          array['user_id'],
          array[
            'referral_code',
            'referral_link',
            'pet_parent_referral_url',
            'guru_referral_url',
            'updated_at'
          ]
        );
      end if;
    exception
      when others then
        raise warning 'SitGuru referral code workspace update failed for %: %',
          p_user_id,
          sqlerrm;
    end;
  end if;

  v_requires_email_verification :=
    v_auth_email <> ''
    and v_email_confirmed_at is null;

  return jsonb_build_object(
    'ok', true,
    'user_id', p_user_id,
    'intent', v_intent,
    'profile_role', v_profile_role,
    'roles', to_jsonb(v_roles),
    'referral_code', v_referral_code,
    'workspace_ready', true,
    'requires_email_verification', v_requires_email_verification,
    'diagnostics', jsonb_build_object(
      'profile_exists', v_profile_exists,
      'role_rows_ready', v_role_rows_ready,
      'guru_ready', v_guru_ready,
      'ambassador_ready', v_ambassador_ready
    )
  );
exception
  when others then
    raise log 'provision_sitguru_account failed for user %: %',
      p_user_id,
      sqlerrm;
    raise;
end;
$$;

revoke all on function public.provision_sitguru_account(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) from public, anon, authenticated;

grant execute on function public.provision_sitguru_account(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) to service_role;

comment on function public.provision_sitguru_account(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) is
  'Provision or repair a SitGuru account. Core workspace creation is isolated from referral-code failures.';

-- ---------------------------------------------------------------------------
-- OPTIONAL IMMEDIATE REPAIR FOR SAMANTHA'S PHONE-VERIFIED ACCOUNT
-- Run this only after the migration above succeeds.
-- Do not also repair the duplicate email account unless you intentionally want
-- two separate Guru profiles.
-- ---------------------------------------------------------------------------
--
-- select public.provision_sitguru_account(
--   '59a4b42b-a91a-4baf-932c-656aa516398a'::uuid,
--   'guru',
--   'Samantha Nunez',
--   null,
--   '+19087642719',
--   null,
--   null,
--   null,
--   'admin_signup_repair'
-- );