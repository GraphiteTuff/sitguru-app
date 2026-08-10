-- Sync profiles.is_bookable for bookable gurus so search merge stays consistent
UPDATE public.profiles p
SET
  is_bookable = true,
  is_public_visible = true,
  updated_at = now()
FROM public.gurus g
WHERE p.id = coalesce(g.user_id, g.profile_id)
  AND coalesce(g.is_bookable, false) = true
  AND lower(coalesce(g.booking_status, '')) = 'bookable';
