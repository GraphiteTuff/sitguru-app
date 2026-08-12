-- Backfill bookable Jewel Martinez with Jamaica, NY map coordinates
-- (copied from duplicate listed_only row / ZIP 11435).
UPDATE public.gurus
SET
  service_latitude = 40.7029,
  service_longitude = -73.8111,
  latitude = 40.7029,
  longitude = -73.8111,
  service_city = coalesce(nullif(trim(service_city), ''), 'Jamaica'),
  service_state = coalesce(nullif(trim(service_state), ''), 'NY'),
  service_zip = coalesce(nullif(trim(service_zip), ''), '11435'),
  city = coalesce(nullif(trim(city), ''), 'Jamaica'),
  state = coalesce(nullif(trim(state), ''), 'NY'),
  zip_code = coalesce(nullif(trim(zip_code), ''), '11435'),
  updated_at = now()
WHERE id = '39031fef-af24-4b21-b171-06f99f4faf5b';

SELECT
  id::text,
  coalesce(display_name, full_name, name) AS name,
  service_latitude,
  service_longitude,
  latitude,
  longitude,
  zip_code,
  booking_status,
  is_bookable
FROM public.gurus
WHERE id IN (
  '39031fef-af24-4b21-b171-06f99f4faf5b',
  'f82f9a9f-7310-4192-ab2f-f72fb3aa41ab'
)
ORDER BY is_bookable DESC NULLS LAST;
