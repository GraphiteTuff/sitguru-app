-- PawPerks canonical referral code backfill dry-run validation.
--
-- This migration is intentionally dry-run only. It calculates which profiles would
-- be eligible for a later canonical PawPerks code and alias backfill, records a
-- summary report, and flags newly detected review issues. It does not create
-- canonical codes, aliases, or referral events, and it does not update legacy
-- referral/profile data or application signup behavior.
--
-- Writes only to:
--   - public.pawperks_referral_backfill_audit
--   - public.pawperks_referral_conflicts

-- Guardrails: fail fast if a required audit table is missing, rather than
-- creating or mutating any non-audit PawPerks/legacy data.
do $$
declare
  v_migration_name constant text := '202606260003_dry_run_pawperks_canonical_code_backfill_validation';
  v_batch_id constant text := 'pawperks-canonical-code-backfill-validation-202606260003';
  v_safe_count integer := 0;
  v_missing_count integer := 0;
  v_multiple_count integer := 0;
  v_duplicate_count integer := 0;
  v_existing_canonical_count integer := 0;
  v_collision_count integer := 0;
  v_table text;
  v_record_id_col text;
  v_code_col text;
  v_owner_col text;
  v_sql text;
begin
  if to_regclass('public.pawperks_referral_backfill_audit') is null then
    raise exception 'Required dry-run audit table public.pawperks_referral_backfill_audit is missing';
  end if;

  if to_regclass('public.pawperks_referral_conflicts') is null then
    raise exception 'Required dry-run conflict table public.pawperks_referral_conflicts is missing';
  end if;

  create temp table pg_temp.pawperks_dry_run_profiles (
    profile_id uuid primary key,
    legacy_record_id text not null,
    metadata jsonb not null default '{}'::jsonb
  ) on commit drop;

  create temp table pg_temp.pawperks_dry_run_legacy_codes (
    legacy_source text not null,
    legacy_record_id text not null,
    owner_profile_id uuid,
    referral_code text not null,
    referral_code_normalized text not null,
    source_rank integer not null,
    metadata jsonb not null default '{}'::jsonb
  ) on commit drop;

  create temp table pg_temp.pawperks_dry_run_profile_rollup (
    profile_id uuid primary key,
    code_count integer not null default 0,
    canonical_code text,
    canonical_code_normalized text,
    canonical_source text,
    canonical_record_id text,
    duplicate_owner_count integer not null default 0,
    has_existing_canonical boolean not null default false,
    has_alias_or_canonical_collision boolean not null default false,
    skip_reason text,
    is_safe_candidate boolean not null default false
  ) on commit drop;

  create temp table pg_temp.pawperks_dry_run_alias_candidates (
    profile_id uuid not null,
    alias_source text not null,
    alias_record_id text not null,
    alias_code text not null,
    alias_code_normalized text not null
  ) on commit drop;

  if to_regclass('public.profiles') is not null then
    insert into pg_temp.pawperks_dry_run_profiles (profile_id, legacy_record_id, metadata)
    select p.id,
      p.id::text,
      jsonb_build_object('batch_id', v_batch_id, 'migration_name', v_migration_name, 'inspected_table', 'profiles')
    from public.profiles p
    where p.id is not null;
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
    v_record_id_col := null;
    v_code_col := null;
    v_owner_col := null;

    if to_regclass(format('public.%I', v_table)) is null then
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
      insert into pg_temp.pawperks_dry_run_legacy_codes (
        legacy_source,
        legacy_record_id,
        owner_profile_id,
        referral_code,
        referral_code_normalized,
        source_rank,
        metadata
      )
      select %L,
        coalesce(%s, md5(t::text)),
        case when %s is not null and %s ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then %s::uuid end,
        trim(t.%I::text),
        lower(trim(t.%I::text)),
        array_position(array['profiles', 'referral_profiles', 'pawperks_referrals', 'petperks_referrals', 'referral_codes', 'ambassadors', 'ambassador_referrals', 'guru_referral_campaigns', 'guru_referrals'], %L),
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
      v_table,
      v_batch_id,
      v_migration_name,
      v_owner_col,
      v_code_col,
      v_table,
      v_code_col
    );

    execute v_sql;
  end loop;

  insert into pg_temp.pawperks_dry_run_profile_rollup (
    profile_id,
    code_count,
    canonical_code,
    canonical_code_normalized,
    canonical_source,
    canonical_record_id,
    duplicate_owner_count,
    has_existing_canonical,
    has_alias_or_canonical_collision
  )
  select p.profile_id,
    count(distinct c.referral_code_normalized) as code_count,
    chosen.referral_code,
    chosen.referral_code_normalized,
    chosen.legacy_source,
    chosen.legacy_record_id,
    coalesce(dupes.owner_count, 0),
    existing_account.account_id is not null,
    coalesce(existing_code.has_collision, false) or coalesce(existing_alias.has_collision, false)
  from pg_temp.pawperks_dry_run_profiles p
  left join pg_temp.pawperks_dry_run_legacy_codes c
    on c.owner_profile_id = p.profile_id
  left join lateral (
    select lc.legacy_source, lc.legacy_record_id, lc.referral_code, lc.referral_code_normalized
    from pg_temp.pawperks_dry_run_legacy_codes lc
    where lc.owner_profile_id = p.profile_id
    order by lc.source_rank nulls last, lc.legacy_source, lc.legacy_record_id
    limit 1
  ) chosen on true
  left join lateral (
    select count(distinct other.owner_profile_id) as owner_count
    from pg_temp.pawperks_dry_run_legacy_codes other
    where other.referral_code_normalized = chosen.referral_code_normalized
      and other.owner_profile_id is not null
  ) dupes on true
  left join public.pawperks_account_referral_codes existing_account
    on existing_account.account_id = p.profile_id
  left join lateral (
    select true as has_collision
    from public.pawperks_account_referral_codes existing
    where existing.code_normalized = chosen.referral_code_normalized
      and existing.account_id <> p.profile_id
    limit 1
  ) existing_code on true
  left join lateral (
    select true as has_collision
    from public.pawperks_referral_code_aliases existing
    where existing.alias_code_normalized = chosen.referral_code_normalized
    limit 1
  ) existing_alias on true
  group by p.profile_id,
    chosen.referral_code,
    chosen.referral_code_normalized,
    chosen.legacy_source,
    chosen.legacy_record_id,
    dupes.owner_count,
    existing_account.account_id,
    existing_code.has_collision,
    existing_alias.has_collision;

  update pg_temp.pawperks_dry_run_profile_rollup
  set skip_reason = case
      when code_count = 0 then 'missing_code'
      when code_count > 1 then 'multiple_codes'
      when duplicate_owner_count > 1 then 'duplicate_ownership'
      when has_existing_canonical then 'canonical_code_already_exists'
      when has_alias_or_canonical_collision then 'alias_or_canonical_collision_exists'
    end;

  update pg_temp.pawperks_dry_run_profile_rollup
  set is_safe_candidate = skip_reason is null
  where code_count = 1;

  insert into pg_temp.pawperks_dry_run_alias_candidates (profile_id, alias_source, alias_record_id, alias_code, alias_code_normalized)
  select r.profile_id,
    c.legacy_source,
    c.legacy_record_id,
    c.referral_code,
    c.referral_code_normalized
  from pg_temp.pawperks_dry_run_profile_rollup r
  join pg_temp.pawperks_dry_run_legacy_codes c
    on c.owner_profile_id = r.profile_id
  where r.is_safe_candidate
    and (c.legacy_source, c.legacy_record_id) <> (r.canonical_source, r.canonical_record_id)
    and c.referral_code_normalized <> r.canonical_code_normalized
    and not exists (
      select 1
      from public.pawperks_account_referral_codes existing
      where existing.code_normalized = c.referral_code_normalized
    )
    and not exists (
      select 1
      from public.pawperks_referral_code_aliases existing
      where existing.alias_code_normalized = c.referral_code_normalized
    );

  select count(*) into v_safe_count
  from pg_temp.pawperks_dry_run_profile_rollup
  where is_safe_candidate;

  select count(*) into v_missing_count
  from pg_temp.pawperks_dry_run_profile_rollup
  where skip_reason = 'missing_code';

  select count(*) into v_multiple_count
  from pg_temp.pawperks_dry_run_profile_rollup
  where skip_reason = 'multiple_codes';

  select count(*) into v_duplicate_count
  from pg_temp.pawperks_dry_run_profile_rollup
  where skip_reason = 'duplicate_ownership';

  select count(*) into v_existing_canonical_count
  from pg_temp.pawperks_dry_run_profile_rollup
  where skip_reason = 'canonical_code_already_exists';

  select count(*) into v_collision_count
  from pg_temp.pawperks_dry_run_profile_rollup
  where skip_reason = 'alias_or_canonical_collision_exists';

  insert into public.pawperks_referral_conflicts (conflict_type, conflict_key, conflicting_table, conflicting_record_id, metadata)
  select 'dry_run_canonical_backfill_skip',
    'dry_run_canonical_backfill_skip:' || r.skip_reason || ':' || r.profile_id::text,
    'profiles',
    r.profile_id::text,
    jsonb_build_object(
      'batch_id', v_batch_id,
      'migration_name', v_migration_name,
      'profile_id', r.profile_id,
      'skip_reason', r.skip_reason,
      'candidate_code', r.canonical_code,
      'candidate_code_normalized', r.canonical_code_normalized,
      'candidate_source', r.canonical_source,
      'candidate_record_id', r.canonical_record_id,
      'legacy_distinct_code_count', r.code_count,
      'duplicate_owner_count', r.duplicate_owner_count,
      'recommended_action', 'Review before any later write-enabled PawPerks canonical code backfill.'
    )
  from pg_temp.pawperks_dry_run_profile_rollup r
  where r.skip_reason is not null
    and r.skip_reason in ('multiple_codes', 'duplicate_ownership', 'alias_or_canonical_collision_exists')
    and not exists (
      select 1
      from public.pawperks_referral_conflicts existing
      where existing.conflict_type = 'dry_run_canonical_backfill_skip'
        and existing.conflict_key = 'dry_run_canonical_backfill_skip:' || r.skip_reason || ':' || r.profile_id::text
        and existing.metadata->>'migration_name' = v_migration_name
    );

  insert into public.pawperks_referral_backfill_audit (backfill_name, legacy_source, legacy_record_id, action, status, notes, metadata)
  select v_migration_name,
    'pawperks_canonical_code_backfill_validation',
    v_batch_id,
    'dry_run_validation_report',
    'recorded',
    'Dry-run only: calculated proposed PawPerks canonical code and alias backfill eligibility without creating codes, aliases, events, or mutating profiles/referral legacy data.',
    jsonb_build_object(
      'batch_id', v_batch_id,
      'migration_name', v_migration_name,
      'dry_run_only', true,
      'profiles_with_one_safe_canonical_candidate', v_safe_count,
      'profiles_skipped_for_missing_code', v_missing_count,
      'profiles_skipped_for_multiple_codes', v_multiple_count,
      'profiles_skipped_for_duplicate_ownership', v_duplicate_count,
      'profiles_skipped_because_canonical_code_already_exists', v_existing_canonical_count,
      'profiles_skipped_because_alias_canonical_collision_exists', v_collision_count,
      'proposed_canonical_source_distribution_by_table', coalesce((
        select jsonb_object_agg(canonical_source, source_count order by canonical_source)
        from (
          select canonical_source, count(*) as source_count
          from pg_temp.pawperks_dry_run_profile_rollup
          where is_safe_candidate
          group by canonical_source
        ) canonical_sources
      ), '{}'::jsonb),
      'proposed_alias_source_distribution_by_table', coalesce((
        select jsonb_object_agg(alias_source, source_count order by alias_source)
        from (
          select alias_source, count(*) as source_count
          from pg_temp.pawperks_dry_run_alias_candidates
          group by alias_source
        ) alias_sources
      ), '{}'::jsonb)
    )
  where not exists (
    select 1
    from public.pawperks_referral_backfill_audit existing
    where existing.backfill_name = v_migration_name
      and existing.legacy_source = 'pawperks_canonical_code_backfill_validation'
      and existing.legacy_record_id = v_batch_id
      and existing.action = 'dry_run_validation_report'
  );
end $$;
