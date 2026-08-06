UPDATE public.gurus
SET
  is_public = true,
  is_public_visible = true,
  is_active = true,
  public_status = 'visible',
  booking_status = 'listed_only',
  service_city = 'Suffolk',
  service_state = 'VA',
  service_latitude = 36.7284,
  service_longitude = -76.5850
WHERE profile_id = '96f46272-6672-4c27-8d82-4e5799256e20'
   OR user_id = '96f46272-6672-4c27-8d82-4e5799256e20'
   OR full_name ILIKE '%Hazel Cronister%';
