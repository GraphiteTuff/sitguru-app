-- Create the canonical SitGuru signup provisioning RPC.
--
-- This function is called by:
--   app/api/auth/provision-signup/route.ts
--
-- It safely provisions Pet Parent, Guru, Ambassador, and combined workspaces,
-- creates the user's canonical referral code, records incoming Ambassador
-- attribution, and returns a verification payload to the API route.

create extension if not exists pgcrypto;

-- Compatibility columns used by the provisioning RPC. These statements are
-- intentionally additive and do not remove or rename existing columns.
alter table if exists public.profiles
  add column if not exists service_area text,
  add column if not exists referral_code text,
  add column if not exists updated_at timestamptz;

alter table if exists public.gurus
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

create unique index if not exists ambassadors_user_id_key
  on public.ambassadors(user_id);

-- Insert or update only columns that actually exist in the target table.
-- This keeps the RPC compatible with SitGuru environments that have optional
-- profile/workspace columns while still preserving existing production data.
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
  v_conflict_columns text;
  v_update_assignments text;
  v_missing_conflicts text;
  v_sql text;
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

  select string_agg(conflict_column, ', ' order by ordinal_position)
  into v_missing_conflicts
  from unnest(p_conflict_columns) with ordinality as requested(conflict_column, ordinal_position)
  where not exists (
    select 1
    from pg_attribute attribute
    where attribute.attrelid = p_table
      and attribute.attnum > 0
      and not attribute.attisdropped
      and attribute.attname = requested.conflict_column
  )
  or not (p_payload ? requested.conflict_column);

  if v_missing_conflicts is not null then
    raise exception 'Missing conflict columns for %: %', p_table::text, v_missing_conflicts;
  end if;

  select
    string_agg(format('%I', attribute.attname), ', ' order by attribute.attnum),
    string_agg(format('%I', attribute.attname), ', ' order by attribute.attnum)
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

  select string_agg(format('%I', conflict_column), ', ' order by ordinal_position)
  into v_conflict_columns
  from unnest(p_conflict_columns) with ordinality as requested(conflict_column, ordinal_position);

  select string_agg(
    format('%1$I = excluded.%1$I', attribute.attname),
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

  if v_update_assignments is null then
    v_sql := format(
      'insert into %1$s (%2$s) '
      'select %3$s from jsonb_populate_record(null::%1$s, $1) '
      'on conflict (%4$s) do nothing',
      p_table,
      v_insert_columns,
      v_select_columns,
      v_conflict_columns
    );
  else
    v_sql := format(
      'insert into %1$s (%2$s) '
      'select %3$s from jsonb_populate_record(null::%1$s, $1) '
      'on conflict (%4$s) do update set %5$s',
      p_table,
      v_insert_columns,
      v_select_columns,
      v_conflict_columns,
      v_update_assignments
    );
  end if;

  execute v_sql using p_payload;
end;
$$;

revoke all on function public.sitguru_upsert_known_columns(regclass, jsonb, text[], text[])
  from public, anon, authenticated;
grant execute on function public.sitguru_upsert_known_columns(regclass, jsonb, text[], text[])
  to service_role;

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

  v_referral_code text;
  v_referral_base text;
  v_referral_suffix text;
  v_candidate_code text;
  v_candidate_number integer := 0;

  v_incoming_referral_code text;
  v_incoming_referral_code_id uuid;
  v_referrer_account_id uuid;

  v_slug_base text;
  v_workspace_slug text;
  v_site_url text := 'https://www.sitguru.com';

  v_profile_exists boolean := false;
  v_role_rows_ready boolean := false;
  v_guru_ready boolean := true;
  v_ambassador_ready boolean := true;
  v_workspace_ready boolean := false;
  v_requires_email_verification boolean := false;
begin
  if p_user_id is null then
    raise exception 'A SitGuru Auth user ID is required.' using errcode = '22023';
  end if;

  v_intent := lower(regexp_replace(coalesce(trim(p_intent), ''), '[[:space:]-]+', '_', 'g'));

  if v_intent in ('customer', 'petparent', 'pet_owner', 'petowner', 'parent') then
    v_intent := 'pet_parent';
  elsif v_intent in ('future_guru', 'pet_guru', 'provider', 'sitter', 'walker') then
    v_intent := 'guru';
  elsif v_intent in ('partner', 'community_ambassador', 'student_ambassador') then
    v_intent := 'ambassador';
  end if;

  if v_intent not in ('pet_parent', 'guru', 'ambassador', 'both') then
    raise exception 'Unsupported SitGuru account intent: %', coalesce(p_intent, '')
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
    raise exception 'The SitGuru Auth account could not be found.' using errcode = 'P0002';
  end if;

  v_email := lower(coalesce(nullif(trim(p_email), ''), nullif(v_auth_email, ''), ''));
  v_phone := coalesce(nullif(trim(p_phone), ''), nullif(v_auth_phone, ''), '');

  v_full_name := coalesce(
    nullif(regexp_replace(trim(coalesce(p_full_name, '')), '[[:space:]]+', ' ', 'g'), ''),
    nullif(regexp_replace(trim(coalesce(v_auth_metadata ->> 'full_name', '')), '[[:space:]]+', ' ', 'g'), ''),
    nullif(regexp_replace(trim(concat_ws(
      ' ',
      nullif(v_auth_metadata ->> 'first_name', ''),
      nullif(v_auth_metadata ->> 'last_name', '')
    )), '[[:space:]]+', ' ', 'g'), ''),
    nullif(split_part(v_email, '@', 1), ''),
    'SitGuru Member'
  );

  v_first_name := nullif(split_part(v_full_name, ' ', 1), '');
  v_last_name := nullif(trim(regexp_replace(v_full_name, '^[^[:space:]]+[[:space:]]*', '')), '');

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

  v_source := coalesce(nullif(trim(p_source), ''), 'sitguru_signup_api');
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

  -- Preserve an existing canonical code. Create one only when the account does
  -- not already own a code.
  select codes.code
  into v_referral_code
  from public.pawperks_account_referral_codes codes
  where codes.account_id = p_user_id
  limit 1;

  if v_referral_code is null then
    v_referral_base := upper(regexp_replace(v_full_name, '[^A-Za-z0-9]', '', 'g'));
    v_referral_base := left(coalesce(nullif(v_referral_base, ''), 'SITGURU'), 8);
    v_referral_suffix := upper(left(replace(p_user_id::text, '-', ''), 8));

    loop
      v_candidate_code := v_referral_base || '-' || v_referral_suffix ||
        case
          when v_candidate_number = 0 then ''
          else '-' || v_candidate_number::text
        end;

      insert into public.pawperks_account_referral_codes (
        account_id,
        code,
        program,
        status,
        source,
        created_at,
        updated_at,
        metadata
      )
      values (
        p_user_id,
        v_candidate_code,
        'pawperks',
        'active',
        'signup',
        v_now,
        v_now,
        jsonb_build_object(
          'role', v_profile_role,
          'intent', v_intent,
          'signup_source', v_source
        )
      )
      on conflict do nothing
      returning code into v_referral_code;

      exit when v_referral_code is not null;

      select codes.code
      into v_referral_code
      from public.pawperks_account_referral_codes codes
      where codes.account_id = p_user_id
      limit 1;

      exit when v_referral_code is not null;

      v_candidate_number := v_candidate_number + 1;

      if v_candidate_number > 100 then
        raise exception 'SitGuru could not create a unique referral code.';
      end if;
    end loop;
  else
    update public.pawperks_account_referral_codes
    set
      status = case when status = 'retired' then status else 'active' end,
      updated_at = v_now,
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'role', v_profile_role,
        'intent', v_intent,
        'signup_source', v_source
      )
    where account_id = p_user_id;
  end if;

  perform public.sitguru_upsert_known_columns(
    'public.profiles'::regclass,
    jsonb_strip_nulls(jsonb_build_object(
      'id', p_user_id,
      'user_id', p_user_id,
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
      'service_area', nullif(v_service_area, ''),
      'referral_code', v_referral_code,
      'ambassador_referral_code', nullif(upper(trim(p_ambassador_referral_code)), ''),
      'account_status', 'active',
      'is_archived', false,
      'is_test_account', false,
      'created_at', v_now,
      'updated_at', v_now
    )),
    array['id'],
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
      'source',
      'zip_code',
      'service_area',
      'referral_code',
      'ambassador_referral_code',
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

  v_slug_base := lower(regexp_replace(v_full_name, '[^A-Za-z0-9]+', '-', 'g'));
  v_slug_base := trim(both '-' from v_slug_base);
  v_workspace_slug := coalesce(nullif(v_slug_base, ''), 'sitguru') || '-' ||
    lower(left(replace(p_user_id::text, '-', ''), 8));

  if v_intent in ('guru', 'both') then
    perform public.sitguru_upsert_known_columns(
      'public.gurus'::regclass,
      jsonb_strip_nulls(jsonb_build_object(
        'user_id', p_user_id,
        'display_name', v_full_name,
        'full_name', v_full_name,
        'email', nullif(v_email, ''),
        'phone', nullif(v_phone, ''),
        'slug', v_workspace_slug,
        'zip_code', nullif(v_zip_code, ''),
        'service_area', nullif(v_service_area, ''),
        'source', v_source,
        'ambassador_referral_code', nullif(upper(trim(p_ambassador_referral_code)), ''),
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
      )),
      array['user_id'],
      array[
        'display_name',
        'full_name',
        'email',
        'phone',
        'slug',
        'zip_code',
        'service_area',
        'source',
        'ambassador_referral_code',
        'updated_at'
      ]
    );
  end if;

  if v_intent = 'ambassador' then
    perform public.sitguru_upsert_known_columns(
      'public.ambassadors'::regclass,
      jsonb_strip_nulls(jsonb_build_object(
        'user_id', p_user_id,
        'full_name', v_full_name,
        'display_name', v_full_name,
        'email', nullif(v_email, ''),
        'contact_email', nullif(v_email, ''),
        'login_email', nullif(v_email, ''),
        'phone', nullif(v_phone, ''),
        'referral_code', v_referral_code,
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
        'service_area', nullif(v_service_area, ''),
        'source', v_source,
        'program', nullif(v_program, ''),
        'internal_role', 'ambassador',
        'referral_link', v_site_url || '/r/' || v_referral_code,
        'pet_parent_referral_url', v_site_url || '/r/' || v_referral_code || '?role=pet_parent',
        'guru_referral_url', v_site_url || '/r/' || v_referral_code || '?role=guru',
        'created_at', v_now,
        'updated_at', v_now
      )),
      array['user_id'],
      array[
        'full_name',
        'display_name',
        'email',
        'contact_email',
        'login_email',
        'phone',
        'referral_code',
        'dashboard_slug',
        'base_zip_code',
        'service_area',
        'source',
        'program',
        'internal_role',
        'referral_link',
        'pet_parent_referral_url',
        'guru_referral_url',
        'updated_at'
      ]
    );

    -- Repair Ambassador accounts created before dashboard access was wired.
    -- Archived, inactive, and suspended records are intentionally excluded.
    update public.ambassadors
    set
      dashboard_enabled = true,
      login_enabled = true,
      referral_status = case
        when referral_status is null or trim(referral_status) in ('', 'pending')
          then 'active'
        else referral_status
      end,
      updated_at = v_now
    where user_id = p_user_id
      and lower(coalesce(status, '')) not in ('archived', 'inactive', 'suspended');
  end if;

  -- Persist incoming Ambassador attribution in the canonical PawPerks event
  -- ledger without allowing self-referrals or duplicate signup events.
  v_incoming_referral_code := upper(trim(coalesce(p_ambassador_referral_code, '')));

  if v_incoming_referral_code <> '' then
    select codes.id, codes.account_id
    into v_incoming_referral_code_id, v_referrer_account_id
    from public.pawperks_account_referral_codes codes
    where codes.code_normalized = lower(v_incoming_referral_code)
      and codes.status = 'active'
    limit 1;

    if v_incoming_referral_code_id is null
      and to_regclass('public.pawperks_referral_code_aliases') is not null then
      select codes.id, codes.account_id
      into v_incoming_referral_code_id, v_referrer_account_id
      from public.pawperks_referral_code_aliases aliases
      join public.pawperks_account_referral_codes codes
        on codes.id = aliases.referral_code_id
      where aliases.alias_code_normalized = lower(v_incoming_referral_code)
        and aliases.status = 'active'
        and codes.status = 'active'
      limit 1;
    end if;

    if v_incoming_referral_code_id is not null
      and v_referrer_account_id is distinct from p_user_id
      and not exists (
        select 1
        from public.pawperks_referral_events events
        where events.referred_account_id = p_user_id
          and events.event_type = 'signup_completed'
          and events.referral_code_id = v_incoming_referral_code_id
      ) then
      insert into public.pawperks_referral_events (
        referral_code_id,
        referrer_account_id,
        referred_account_id,
        referral_code,
        event_type,
        event_source,
        event_at,
        request_path,
        metadata,
        created_at
      )
      values (
        v_incoming_referral_code_id,
        v_referrer_account_id,
        p_user_id,
        v_incoming_referral_code,
        'signup_completed',
        v_source,
        v_now,
        '/api/auth/provision-signup',
        jsonb_build_object(
          'referred_intent', v_intent,
          'referred_profile_role', v_profile_role,
          'provisioning_source', v_source
        ),
        v_now
      );
    end if;
  end if;

  select exists (
    select 1
    from public.profiles profiles
    where profiles.id = p_user_id
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

  v_requires_email_verification :=
    v_auth_email <> '' and v_email_confirmed_at is null;

  return jsonb_build_object(
    'ok', v_workspace_ready,
    'user_id', p_user_id,
    'intent', v_intent,
    'profile_role', v_profile_role,
    'roles', to_jsonb(v_roles),
    'referral_code', v_referral_code,
    'workspace_ready', v_workspace_ready,
    'requires_email_verification', v_requires_email_verification
  );
exception
  when others then
    raise log 'provision_sitguru_account failed for user %: %', p_user_id, sqlerrm;
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
) is 'Provision or repair a SitGuru Pet Parent, Guru, Ambassador, or combined account after Supabase Auth signup.';