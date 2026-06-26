-- PawPerks read-only referral conflict inventory.
--
-- This migration does not choose canonical PawPerks referral codes, create aliases,
-- create referral events, update legacy referral data, or change signup behavior.
-- It only writes admin-review inventory into:
--   - public.pawperks_referral_conflicts
--   - public.pawperks_referral_backfill_audit

do $$
declare
  v_migration_name constant text := '202606260002_backfill_pawperks_referral_conflict_inventory';
  v_batch_id constant text := 'pawperks-referral-conflict-inventory-202606260002';
  v_profiles_count integer := 0;
  v_legacy_code_count integer := 0;
  v_missing_count integer := 0;
  v_multi_count integer := 0;
  v_duplicate_count integer := 0;
  v_activity_count integer := 0;
  v_sql text;
  v_table text;
  v_code_col text;
  v_owner_col text;
  v_referred_col text;
  v_record_id_col text;
  v_activity_code_col text;
  v_activity_source_col text;
  v_activity_status_col text;
  v_activity_created_col text;
begin
  create temp table if not exists pg_temp.pawperks_legacy_profiles (
    profile_id uuid primary key,
    source text not null default 'profiles',
    legacy_record_id text not null,
    metadata jsonb not null default '{}'::jsonb
  ) on commit drop;

  create temp table if not exists pg_temp.pawperks_legacy_codes (
    legacy_source text not null,
    legacy_record_id text not null,
    owner_profile_id uuid,
    referral_code text not null,
    referral_code_normalized text not null,
    metadata jsonb not null default '{}'::jsonb
  ) on commit drop;

  create temp table if not exists pg_temp.pawperks_referral_activity_inventory (
    legacy_source text not null,
    legacy_record_id text not null,
    owner_profile_id uuid,
    referred_profile_id uuid,
    referral_code text,
    referral_code_normalized text,
    metadata jsonb not null default '{}'::jsonb
  ) on commit drop;

  truncate table pg_temp.pawperks_legacy_profiles;
  truncate table pg_temp.pawperks_legacy_codes;
  truncate table pg_temp.pawperks_referral_activity_inventory;

  if to_regclass('public.profiles') is not null then
    insert into pg_temp.pawperks_legacy_profiles (profile_id, legacy_record_id, metadata)
    select p.id, p.id::text, jsonb_build_object('inspected_table', 'profiles')
    from public.profiles p
    where p.id is not null;

    get diagnostics v_profiles_count = row_count;
  end if;

  foreach v_table in array array[
    'profiles',
    'referral_profiles',
    'ambassadors',
    'referral_codes',
    'guru_referral_campaigns',
    'petperks_referrals',
    'ambassador_referrals',
    'guru_referrals'
  ] loop
    v_code_col := null;
    v_owner_col := null;
    v_record_id_col := null;

    if to_regclass(format('public.%I', v_table)) is null then
      insert into public.pawperks_referral_backfill_audit (
        backfill_name,
        legacy_source,
        legacy_record_id,
        action,
        status,
        notes,
        metadata
      )
      select v_migration_name, v_table, v_table, 'inspect_legacy_source', 'skipped',
        'Legacy referral source table was not present; skipped without changing referral behavior.',
        jsonb_build_object('batch_id', v_batch_id, 'migration_name', v_migration_name, 'table', v_table)
      where not exists (
        select 1 from public.pawperks_referral_backfill_audit existing
        where existing.backfill_name = v_migration_name
          and existing.legacy_source = v_table
          and existing.legacy_record_id = v_table
          and existing.action = 'inspect_legacy_source'
      );
      continue;
    end if;

    select column_name into v_record_id_col
    from information_schema.columns
    where table_schema = 'public'
      and table_name = v_table
      and column_name = 'id'
    limit 1;

    select column_name into v_code_col
    from information_schema.columns
    where table_schema = 'public'
      and table_name = v_table
      and column_name = any(array['referral_code', 'code', 'partner_referral_code', 'customer_referral_code', 'guru_referral_code', 'ambassador_referral_code'])
    order by array_position(array['referral_code', 'code', 'partner_referral_code', 'customer_referral_code', 'guru_referral_code', 'ambassador_referral_code'], column_name)
    limit 1;

    if v_code_col is null then
      insert into public.pawperks_referral_backfill_audit (backfill_name, legacy_source, legacy_record_id, action, status, notes, metadata)
      select v_migration_name, v_table, v_table, 'inspect_legacy_source', 'skipped',
        'Legacy referral source table has no known referral-code column; skipped without changing referral behavior.',
        jsonb_build_object('batch_id', v_batch_id, 'migration_name', v_migration_name, 'table', v_table)
      where not exists (
        select 1 from public.pawperks_referral_backfill_audit existing
        where existing.backfill_name = v_migration_name
          and existing.legacy_source = v_table
          and existing.legacy_record_id = v_table
          and existing.action = 'inspect_legacy_source'
      );
      continue;
    end if;

    select column_name into v_owner_col
    from information_schema.columns
    where table_schema = 'public'
      and table_name = v_table
      and column_name = any(array['account_id', 'user_id', 'owner_user_id', 'profile_id', 'customer_id', 'referrer_user_id', 'ambassador_id', 'guru_id', 'id'])
    order by array_position(array['account_id', 'user_id', 'owner_user_id', 'profile_id', 'customer_id', 'referrer_user_id', 'ambassador_id', 'guru_id', 'id'], column_name)
    limit 1;

    v_sql := format($fmt$
      insert into pg_temp.pawperks_legacy_codes (legacy_source, legacy_record_id, owner_profile_id, referral_code, referral_code_normalized, metadata)
      select %L,
        coalesce(%s, md5(t::text)),
        case when %s is not null and %s ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then %s::uuid end,
        trim(t.%I::text),
        lower(trim(t.%I::text)),
        jsonb_build_object('batch_id', %L, 'migration_name', %L, 'owner_column', %L, 'code_column', %L)
      from public.%I t
      where nullif(trim(t.%I::text), '') is not null
    $fmt$,
      v_table,
      case when v_record_id_col is null then 'null' else format('t.%I::text', v_record_id_col) end,
      case when v_owner_col is null then 'null' else format('t.%I::text', v_owner_col) end,
      case when v_owner_col is null then 'null' else format('t.%I::text', v_owner_col) end,
      case when v_owner_col is null then 'null' else format('t.%I::text', v_owner_col) end,
      v_code_col,
      v_code_col,
      v_batch_id,
      v_migration_name,
      v_owner_col,
      v_code_col,
      v_table,
      v_code_col
    );

    execute v_sql;
  end loop;

  select count(*) into v_legacy_code_count from pg_temp.pawperks_legacy_codes;

  insert into public.pawperks_referral_backfill_audit (backfill_name, legacy_source, legacy_record_id, action, status, notes, metadata)
  select v_migration_name, 'legacy_referral_sources', v_batch_id, 'inspect_legacy_codes', 'recorded',
    'Inspected known legacy referral code sources and staged codes in a temporary read-only inventory.',
    jsonb_build_object('batch_id', v_batch_id, 'migration_name', v_migration_name, 'profiles_inspected', v_profiles_count, 'legacy_codes_found', v_legacy_code_count)
  where not exists (
    select 1 from public.pawperks_referral_backfill_audit existing
    where existing.backfill_name = v_migration_name
      and existing.legacy_source = 'legacy_referral_sources'
      and existing.legacy_record_id = v_batch_id
      and existing.action = 'inspect_legacy_codes'
  );

  insert into public.pawperks_referral_conflicts (conflict_type, conflict_key, conflicting_table, conflicting_record_id, metadata)
  select 'missing_legacy_referral_code',
    'missing_legacy_referral_code:' || p.profile_id::text,
    'profiles',
    p.profile_id::text,
    jsonb_build_object('batch_id', v_batch_id, 'migration_name', v_migration_name, 'profile_id', p.profile_id, 'recommended_action', 'Admin review should decide whether this profile should receive a canonical PawPerks referral code in a later migration.')
  from pg_temp.pawperks_legacy_profiles p
  where not exists (
    select 1 from pg_temp.pawperks_legacy_codes c
    where c.owner_profile_id = p.profile_id
  )
    and not exists (
      select 1 from public.pawperks_referral_conflicts existing
      where existing.conflict_type = 'missing_legacy_referral_code'
        and existing.conflict_key = 'missing_legacy_referral_code:' || p.profile_id::text
        and existing.conflicting_table = 'profiles'
        and existing.conflicting_record_id = p.profile_id::text
        and existing.metadata->>'migration_name' = v_migration_name
    );
  get diagnostics v_missing_count = row_count;

  insert into public.pawperks_referral_conflicts (conflict_type, conflict_key, conflicting_table, conflicting_record_id, metadata)
  select 'multiple_legacy_referral_codes',
    'multiple_legacy_referral_codes:' || owner_profile_id::text,
    'legacy_referral_sources',
    owner_profile_id::text,
    jsonb_build_object('batch_id', v_batch_id, 'migration_name', v_migration_name, 'profile_id', owner_profile_id, 'codes', jsonb_agg(distinct referral_code_normalized), 'source_records', jsonb_agg(jsonb_build_object('source', legacy_source, 'record_id', legacy_record_id, 'code', referral_code)), 'recommended_action', 'Admin review should choose one canonical code and decide whether the remaining codes become aliases in a later migration.')
  from pg_temp.pawperks_legacy_codes
  where owner_profile_id is not null
  group by owner_profile_id
  having count(distinct referral_code_normalized) > 1
    and not exists (
      select 1 from public.pawperks_referral_conflicts existing
      where existing.conflict_type = 'multiple_legacy_referral_codes'
        and existing.conflict_key = 'multiple_legacy_referral_codes:' || owner_profile_id::text
        and existing.conflicting_table = 'legacy_referral_sources'
        and existing.conflicting_record_id = owner_profile_id::text
        and existing.metadata->>'migration_name' = v_migration_name
    );
  get diagnostics v_multi_count = row_count;

  insert into public.pawperks_referral_conflicts (conflict_type, conflict_key, conflicting_table, conflicting_record_id, metadata)
  select 'duplicate_legacy_referral_code',
    'duplicate_legacy_referral_code:' || referral_code_normalized,
    'legacy_referral_sources',
    referral_code_normalized,
    jsonb_build_object('batch_id', v_batch_id, 'migration_name', v_migration_name, 'code_normalized', referral_code_normalized, 'owners', jsonb_agg(distinct owner_profile_id), 'source_records', jsonb_agg(jsonb_build_object('source', legacy_source, 'record_id', legacy_record_id, 'owner_profile_id', owner_profile_id, 'code', referral_code)), 'recommended_action', 'Admin review should resolve duplicate ownership before any canonical PawPerks code or alias is backfilled.')
  from pg_temp.pawperks_legacy_codes
  where owner_profile_id is not null
  group by referral_code_normalized
  having count(distinct owner_profile_id) > 1
    and not exists (
      select 1 from public.pawperks_referral_conflicts existing
      where existing.conflict_type = 'duplicate_legacy_referral_code'
        and existing.conflict_key = 'duplicate_legacy_referral_code:' || referral_code_normalized
        and existing.conflicting_table = 'legacy_referral_sources'
        and existing.conflicting_record_id = referral_code_normalized
        and existing.metadata->>'migration_name' = v_migration_name
    );
  get diagnostics v_duplicate_count = row_count;

  foreach v_table in array array['referral_activity', 'referral_events', 'referral_clicks', 'referral_conversions'] loop
    v_activity_code_col := null;
    v_owner_col := null;
    v_referred_col := null;
    v_activity_source_col := null;
    v_activity_status_col := null;
    v_activity_created_col := null;
    v_record_id_col := null;

    if to_regclass(format('public.%I', v_table)) is null then
      continue;
    end if;

    select column_name into v_record_id_col
    from information_schema.columns
    where table_schema = 'public'
      and table_name = v_table
      and column_name = 'id'
    limit 1;

    select column_name into v_activity_code_col
    from information_schema.columns
    where table_schema = 'public'
      and table_name = v_table
      and column_name = any(array['referral_code', 'code', 'ref', 'campaign_code'])
    order by array_position(array['referral_code', 'code', 'ref', 'campaign_code'], column_name)
    limit 1;

    if v_activity_code_col is null then
      continue;
    end if;

    select column_name into v_owner_col
    from information_schema.columns
    where table_schema = 'public'
      and table_name = v_table
      and column_name = any(array['referrer_account_id', 'referrer_user_id', 'owner_user_id', 'account_id', 'user_id'])
    order by array_position(array['referrer_account_id', 'referrer_user_id', 'owner_user_id', 'account_id', 'user_id'], column_name)
    limit 1;

    select column_name into v_referred_col
    from information_schema.columns
    where table_schema = 'public'
      and table_name = v_table
      and column_name = any(array['referred_account_id', 'referred_user_id', 'customer_id', 'profile_id'])
    order by array_position(array['referred_account_id', 'referred_user_id', 'customer_id', 'profile_id'], column_name)
    limit 1;

    select column_name into v_activity_source_col
    from information_schema.columns
    where table_schema = 'public' and table_name = v_table and column_name = any(array['event_source', 'source', 'utm_source'])
    limit 1;

    select column_name into v_activity_status_col
    from information_schema.columns
    where table_schema = 'public' and table_name = v_table and column_name = any(array['status', 'event_type', 'event_name'])
    limit 1;

    select column_name into v_activity_created_col
    from information_schema.columns
    where table_schema = 'public' and table_name = v_table and column_name = any(array['created_at', 'event_at', 'updated_at'])
    limit 1;

    execute format($fmt$
      insert into pg_temp.pawperks_referral_activity_inventory (legacy_source, legacy_record_id, owner_profile_id, referred_profile_id, referral_code, referral_code_normalized, metadata)
      select %L,
        coalesce(%s, md5(t::text)),
        case when %s is not null and %s ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then %s::uuid end,
        case when %s is not null and %s ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then %s::uuid end,
        trim(t.%I::text),
        lower(trim(t.%I::text)),
        jsonb_build_object('batch_id', %L, 'migration_name', %L, 'activity_source', %s, 'activity_status', %s, 'activity_at', %s)
      from public.%I t
      where nullif(trim(t.%I::text), '') is not null
    $fmt$,
      v_table,
      case when v_record_id_col is null then 'null' else format('t.%I::text', v_record_id_col) end,
      case when v_owner_col is null then 'null' else format('t.%I::text', v_owner_col) end,
      case when v_owner_col is null then 'null' else format('t.%I::text', v_owner_col) end,
      case when v_owner_col is null then 'null' else format('t.%I::text', v_owner_col) end,
      case when v_referred_col is null then 'null' else format('t.%I::text', v_referred_col) end,
      case when v_referred_col is null then 'null' else format('t.%I::text', v_referred_col) end,
      case when v_referred_col is null then 'null' else format('t.%I::text', v_referred_col) end,
      v_activity_code_col,
      v_activity_code_col,
      v_batch_id,
      v_migration_name,
      case when v_activity_source_col is null then 'null' else format('t.%I::text', v_activity_source_col) end,
      case when v_activity_status_col is null then 'null' else format('t.%I::text', v_activity_status_col) end,
      case when v_activity_created_col is null then 'null' else format('t.%I::text', v_activity_created_col) end,
      v_table,
      v_activity_code_col
    );
  end loop;

  insert into public.pawperks_referral_conflicts (conflict_type, conflict_key, conflicting_table, conflicting_record_id, metadata)
  select 'unresolved_referral_activity',
    'unresolved_referral_activity:' || a.legacy_source || ':' || a.legacy_record_id,
    a.legacy_source,
    a.legacy_record_id,
    a.metadata || jsonb_build_object('referral_code', a.referral_code, 'referral_code_normalized', a.referral_code_normalized, 'owner_profile_id', a.owner_profile_id, 'referred_profile_id', a.referred_profile_id, 'matching_owner_count', coalesce(m.matching_owner_count, 0), 'recommended_action', 'Admin review should reconcile this legacy activity with an owner and referred account before event backfill.')
  from pg_temp.pawperks_referral_activity_inventory a
  left join lateral (
    select count(distinct c.owner_profile_id) as matching_owner_count
    from pg_temp.pawperks_legacy_codes c
    where c.referral_code_normalized = a.referral_code_normalized
      and c.owner_profile_id is not null
  ) m on true
  where (a.owner_profile_id is null
     or a.referred_profile_id is null
     or coalesce(m.matching_owner_count, 0) <> 1)
    and not exists (
      select 1 from public.pawperks_referral_conflicts existing
      where existing.conflict_type = 'unresolved_referral_activity'
        and existing.conflict_key = 'unresolved_referral_activity:' || a.legacy_source || ':' || a.legacy_record_id
        and existing.conflicting_table = a.legacy_source
        and existing.conflicting_record_id = a.legacy_record_id
        and existing.metadata->>'migration_name' = v_migration_name
    );
  get diagnostics v_activity_count = row_count;

  insert into public.pawperks_referral_backfill_audit (backfill_name, legacy_source, legacy_record_id, action, status, notes, metadata)
  select v_migration_name, 'pawperks_referral_conflicts', v_batch_id, 'flag_conflicts', 'flagged',
    'Recorded read-only PawPerks referral conflict inventory for admin review. No canonical codes, aliases, events, profiles, or legacy referral tables were changed.',
    jsonb_build_object(
      'batch_id', v_batch_id,
      'migration_name', v_migration_name,
      'missing_legacy_referral_code_conflicts', v_missing_count,
      'multiple_legacy_referral_codes_conflicts', v_multi_count,
      'duplicate_legacy_referral_code_conflicts', v_duplicate_count,
      'unresolved_referral_activity_conflicts', v_activity_count
    )
  where not exists (
    select 1 from public.pawperks_referral_backfill_audit existing
    where existing.backfill_name = v_migration_name
      and existing.legacy_source = 'pawperks_referral_conflicts'
      and existing.legacy_record_id = v_batch_id
      and existing.action = 'flag_conflicts'
  );
end $$;
