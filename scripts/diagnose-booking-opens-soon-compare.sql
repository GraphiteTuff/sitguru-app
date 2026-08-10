WITH guru_base AS (
  SELECT
    g.id,
    coalesce(
      nullif(trim(g.display_name), ''),
      nullif(trim(g.full_name), ''),
      'Unknown'
    ) AS name,
    g.is_bookable,
    g.application_status,
    g.booking_status,
    g.admin_status,
    g.public_status,
    g.profile_quality_status,
    g.is_accepting_bookings,
    g.accepting_bookings,
    g.email,
    coalesce(g.is_test_account, false)
      OR coalesce(p.is_test_account, false) AS is_test_account
  FROM public.gurus g
  LEFT JOIN public.profiles p
    ON p.id = coalesce(g.profile_id, g.user_id)
),
real_admin AS (
  SELECT *
  FROM guru_base
  WHERE (
      coalesce(is_bookable, false) = true
      OR lower(coalesce(application_status, '')) = 'bookable'
    )
    AND NOT (
      is_test_account
      OR lower(coalesce(email, '')) LIKE '%example.com%'
      OR lower(coalesce(email, '')) LIKE '%test.com%'
      OR lower(coalesce(email, '')) LIKE '%sitguru.local%'
      OR lower(coalesce(email, '')) LIKE '%placeholder%'
      OR lower(coalesce(admin_status, '')) = 'placeholder'
      OR lower(coalesce(profile_quality_status, '')) LIKE '%placeholder%'
      OR lower(coalesce(profile_quality_status, '')) LIKE '%demo%'
      OR lower(coalesce(profile_quality_status, '')) LIKE '%seed%'
    )
)
SELECT
  CASE
    WHEN lower(coalesce(booking_status, '')) IN ('listed_only', 'not_listed')
      THEN 'blocked'
    ELSE 'bookable_ok'
  END AS kind,
  name,
  id::text AS id,
  is_bookable,
  application_status,
  booking_status,
  admin_status,
  public_status,
  profile_quality_status,
  is_accepting_bookings,
  accepting_bookings
FROM real_admin
ORDER BY 1, name;
