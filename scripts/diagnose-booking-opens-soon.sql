-- Real admin-bookable gurus blocked on frontend by booking_status
WITH guru_base AS (
  SELECT
    g.id,
    g.user_id,
    coalesce(nullif(trim(g.email), ''), nullif(trim(p.email), '')) AS email,
    coalesce(
      nullif(trim(g.display_name), ''),
      nullif(trim(g.full_name), ''),
      nullif(trim(g.name), ''),
      nullif(trim(p.full_name), ''),
      'Unknown'
    ) AS name,
    g.is_bookable,
    g.application_status,
    g.status,
    g.booking_status,
    g.admin_status,
    g.public_status,
    g.profile_quality_status,
    g.is_public,
    g.is_public_visible,
    g.is_active,
    g.is_accepting_bookings,
    g.accepting_bookings,
    coalesce(g.is_test_account, false) OR coalesce(p.is_test_account, false) AS is_test_account
  FROM public.gurus g
  LEFT JOIN public.profiles p
    ON p.id = coalesce(g.profile_id, g.user_id)
),
classified AS (
  SELECT
    *,
    (
      coalesce(is_bookable, false) = true
      OR lower(coalesce(application_status, '')) = 'bookable'
    ) AS admin_bookable,
    (
      coalesce(is_test_account, false)
      OR lower(coalesce(email, '')) LIKE '%example.com%'
      OR lower(coalesce(email, '')) LIKE '%test.com%'
      OR lower(coalesce(email, '')) LIKE '%sitguru.local%'
      OR lower(coalesce(email, '')) LIKE '%placeholder%'
      OR lower(coalesce(admin_status, '')) = 'placeholder'
      OR lower(coalesce(profile_quality_status, '')) LIKE '%placeholder%'
      OR lower(coalesce(profile_quality_status, '')) LIKE '%demo%'
      OR lower(coalesce(profile_quality_status, '')) LIKE '%seed%'
      OR name ~* '(^|[^a-z])(test|dummy|demo|fake|sample|spam)([^a-z]|$)'
    ) AS is_dummy_or_test,
    lower(coalesce(booking_status, '')) IN ('listed_only', 'not_listed') AS blocked_by_booking_status
  FROM guru_base
),
affected AS (
  SELECT *
  FROM classified
  WHERE admin_bookable
    AND NOT is_dummy_or_test
    AND blocked_by_booking_status
)
SELECT 'counts' AS section, jsonb_build_object(
  'total_gurus', (SELECT count(*) FROM guru_base),
  'admin_bookable_real', (
    SELECT count(*) FROM classified
    WHERE admin_bookable AND NOT is_dummy_or_test
  ),
  'admin_bookable_is_bookable_true_real', (
    SELECT count(*) FROM classified
    WHERE coalesce(is_bookable, false) = true AND NOT is_dummy_or_test
  ),
  'affected_real_search_block', (SELECT count(*) FROM affected),
  'affected_is_bookable_true', (
    SELECT count(*) FROM affected WHERE coalesce(is_bookable, false) = true
  ),
  'booking_status_breakdown', (
    SELECT coalesce(jsonb_object_agg(status_key, cnt), '{}'::jsonb)
    FROM (
      SELECT coalesce(nullif(lower(booking_status), ''), '(null)') AS status_key,
             count(*) AS cnt
      FROM affected
      GROUP BY 1
    ) s
  ),
  'flag_gaps_for_is_bookable_true', (
    SELECT jsonb_build_object(
      'is_accepting_bookings_false_or_null',
        count(*) FILTER (WHERE coalesce(is_accepting_bookings, false) IS DISTINCT FROM true),
      'accepting_bookings_false_or_null',
        count(*) FILTER (WHERE coalesce(accepting_bookings, false) IS DISTINCT FROM true),
      'admin_status_not_approved',
        count(*) FILTER (WHERE lower(coalesce(admin_status, '')) IS DISTINCT FROM 'approved'),
      'public_status_not_public',
        count(*) FILTER (WHERE lower(coalesce(public_status, '')) IS DISTINCT FROM 'public'),
      'quality_not_bookable',
        count(*) FILTER (WHERE lower(coalesce(profile_quality_status, '')) IS DISTINCT FROM 'bookable'),
      'booking_status_not_bookable',
        count(*) FILTER (WHERE lower(coalesce(booking_status, '')) IS DISTINCT FROM 'bookable')
    )
    FROM affected
    WHERE coalesce(is_bookable, false) = true
  )
) AS payload

UNION ALL

SELECT 'examples' AS section, coalesce(jsonb_agg(to_jsonb(e)), '[]'::jsonb) AS payload
FROM (
  SELECT
    id::text AS id,
    user_id::text AS user_id,
    name,
    email,
    is_bookable,
    application_status,
    status,
    booking_status,
    admin_status,
    public_status,
    profile_quality_status,
    is_accepting_bookings,
    accepting_bookings,
    is_public,
    is_public_visible,
    is_active
  FROM affected
  WHERE coalesce(is_bookable, false) = true
  ORDER BY name
  LIMIT 10
) e;
