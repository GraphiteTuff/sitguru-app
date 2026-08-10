SELECT
  g.id::text,
  g.user_id::text,
  coalesce(g.display_name, g.full_name, g.name) AS name,
  g.email AS guru_email,
  p.email AS profile_email,
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
  g.service_city,
  g.service_state,
  g.zip_code,
  g.city,
  g.state,
  g.slug
FROM public.gurus g
LEFT JOIN public.profiles p ON p.id = coalesce(g.profile_id, g.user_id)
WHERE
  g.id IN (
    'caaca844-af3c-43cc-971e-c0cbe767db51',
    '6304261d-f0e6-431b-ad9b-7f4693c6aaa6',
    'af4c59db-1a71-45e0-8e4f-98bd4187847b'
  )
  OR coalesce(g.display_name, g.full_name, g.name) ILIKE '%olivia%goode%'
  OR coalesce(g.display_name, g.full_name, g.name) ILIKE 'crystal'
ORDER BY name;
