-- Publish Kayla Keeter's public Guru profile and sync service location
UPDATE public.gurus
SET
  is_public = true,
  is_public_visible = true,
  is_active = true,
  public_status = 'visible',
  booking_status = 'listed_only',
  service_city = 'Rich Square',
  service_state = 'NC',
  service_latitude = 36.2739,
  service_longitude = -77.2839
WHERE profile_id = 'f7706ea3-5d9c-43b2-a67f-cb684217033e'
   OR user_id = 'f7706ea3-5d9c-43b2-a67f-cb684217033e'
   OR slug = 'kayla-keeter-f7706ea3'
   OR full_name ILIKE '%Kayla Keeter%';
