-- Sync profiles.is_bookable / is_public_visible for every bookable Guru.
-- Search merges gurus+profiles and previously let profiles.is_bookable=false
-- poison gurus.is_bookable=true (false-wins merge).

UPDATE public.profiles p
SET
  is_bookable = true,
  is_public_visible = true,
  updated_at = now()
FROM public.gurus g
WHERE p.id = coalesce(g.user_id, g.profile_id)
  AND coalesce(g.is_bookable, false) = true
  AND lower(coalesce(g.booking_status, '')) = 'bookable';

-- Ensure the four Newport News / Norfolk gurus stay fully bookable on gurus too
UPDATE public.gurus
SET
  is_bookable = true,
  is_accepting_bookings = true,
  accepting_bookings = true,
  booking_status = 'bookable',
  admin_status = 'approved',
  public_status = 'public',
  profile_quality_status = 'bookable',
  application_status = 'bookable',
  status = 'active',
  is_public = true,
  is_public_visible = true,
  is_active = true,
  updated_at = now()
WHERE id IN (
  'caaca844-af3c-43cc-971e-c0cbe767db51',
  '9b4c09d3-50ca-40d9-81df-b6d6ca58326e',
  '7384e5d7-97c6-4f0e-a386-8aaa0a3d9f34',
  '241cc5cf-a858-4818-bcd2-ee09acc367ef'
);

SELECT
  g.display_name AS name,
  g.is_bookable AS guru_bookable,
  g.booking_status,
  p.is_bookable AS profile_bookable,
  p.is_public_visible AS profile_visible
FROM public.gurus g
JOIN public.profiles p ON p.id = coalesce(g.user_id, g.profile_id)
WHERE g.id IN (
  'caaca844-af3c-43cc-971e-c0cbe767db51',
  '9b4c09d3-50ca-40d9-81df-b6d6ca58326e',
  '7384e5d7-97c6-4f0e-a386-8aaa0a3d9f34',
  '241cc5cf-a858-4818-bcd2-ee09acc367ef'
)
ORDER BY name;
