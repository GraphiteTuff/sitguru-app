-- Backfill base rates/services/availability for Cassidy, Crystal, Destiny, Genesta
-- so admin "Missing" clears and public booking stays fully enabled.

BEGIN;

-- Crystal: already has services + service rates; sync base rate from enabled rates
UPDATE public.gurus
SET
  hourly_rate = 20,
  rate = 20,
  price = 20,
  is_accepting_bookings = true,
  accepting_bookings = true,
  booking_status = 'bookable',
  is_bookable = true,
  availability_notes = coalesce(nullif(trim(availability_notes), ''), 'Open for bookings — message for scheduling.'),
  updated_at = now()
WHERE id = 'caaca844-af3c-43cc-971e-c0cbe767db51';

-- Destiny
UPDATE public.gurus
SET
  hourly_rate = 30,
  rate = 30,
  price = 30,
  is_accepting_bookings = true,
  accepting_bookings = true,
  booking_status = 'bookable',
  is_bookable = true,
  availability_notes = coalesce(nullif(trim(availability_notes), ''), 'Open for bookings — message for scheduling.'),
  updated_at = now()
WHERE id = '7384e5d7-97c6-4f0e-a386-8aaa0a3d9f34';

-- Genesta
UPDATE public.gurus
SET
  hourly_rate = 25,
  rate = 25,
  price = 25,
  is_accepting_bookings = true,
  accepting_bookings = true,
  booking_status = 'bookable',
  is_bookable = true,
  availability_notes = coalesce(nullif(trim(availability_notes), ''), 'Open for bookings — message for scheduling.'),
  updated_at = now()
WHERE id = '241cc5cf-a858-4818-bcd2-ee09acc367ef';

-- Cassidy: needs services + base rate + service rate rows
UPDATE public.gurus
SET
  services = ARRAY[
    'Drop-In Visits',
    'Pet Sitting',
    'Dog Walking',
    'House Sitting'
  ]::text[],
  hourly_rate = 25,
  rate = 25,
  price = 25,
  is_accepting_bookings = true,
  accepting_bookings = true,
  booking_status = 'bookable',
  is_bookable = true,
  is_public = true,
  is_public_visible = true,
  is_active = true,
  admin_status = 'approved',
  public_status = 'public',
  profile_quality_status = 'bookable',
  application_status = 'bookable',
  status = 'active',
  availability_notes = coalesce(nullif(trim(availability_notes), ''), 'Open for bookings — message for scheduling.'),
  updated_at = now()
WHERE id = '9b4c09d3-50ca-40d9-81df-b6d6ca58326e';

-- Seed Cassidy service rates if missing
INSERT INTO public.guru_service_rates (
  guru_id, service_key, service_label, is_enabled, rate_amount, rate_unit, updated_at
)
SELECT
  v.guru_id,
  v.service_key,
  v.service_label,
  v.is_enabled,
  v.rate_amount,
  v.rate_unit,
  now()
FROM (
  VALUES
    ('9b4c09d3-50ca-40d9-81df-b6d6ca58326e'::uuid, 'drop_in_visits', 'Drop-In Visits', true, 25.00, 'visit'),
    ('9b4c09d3-50ca-40d9-81df-b6d6ca58326e'::uuid, 'pet_sitting', 'Pet Sitting', true, 30.00, 'visit'),
    ('9b4c09d3-50ca-40d9-81df-b6d6ca58326e'::uuid, 'dog_walking', 'Dog Walking', true, 20.00, 'walk'),
    ('9b4c09d3-50ca-40d9-81df-b6d6ca58326e'::uuid, 'house_sitting', 'House Sitting', true, 50.00, 'night'),
    ('9b4c09d3-50ca-40d9-81df-b6d6ca58326e'::uuid, 'boarding', 'Boarding', false, 60.00, 'night'),
    ('9b4c09d3-50ca-40d9-81df-b6d6ca58326e'::uuid, 'doggy_day_care', 'Doggy Day Care', false, 45.00, 'day'),
    ('9b4c09d3-50ca-40d9-81df-b6d6ca58326e'::uuid, 'medication_help', 'Medication Help', false, 10.00, 'add_on'),
    ('9b4c09d3-50ca-40d9-81df-b6d6ca58326e'::uuid, 'pet_taxi', 'Pet Taxi', false, 25.00, 'visit'),
    ('9b4c09d3-50ca-40d9-81df-b6d6ca58326e'::uuid, 'training_support', 'Training Support', false, 45.00, 'session'),
    ('9b4c09d3-50ca-40d9-81df-b6d6ca58326e'::uuid, 'custom_care', 'Custom Care', false, null, 'custom')
) AS v(guru_id, service_key, service_label, is_enabled, rate_amount, rate_unit)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.guru_service_rates existing
  WHERE existing.guru_id = v.guru_id
    AND existing.service_key = v.service_key
);

-- Availability settings (publish on)
INSERT INTO public.guru_availability_settings (
  user_id, publish_availability, same_day_booking, instant_booking, updated_at
)
SELECT g.user_id, true, true, false, now()
FROM public.gurus g
WHERE g.id IN (
  'caaca844-af3c-43cc-971e-c0cbe767db51',
  '9b4c09d3-50ca-40d9-81df-b6d6ca58326e',
  '7384e5d7-97c6-4f0e-a386-8aaa0a3d9f34',
  '241cc5cf-a858-4818-bcd2-ee09acc367ef'
)
AND g.user_id IS NOT NULL
ON CONFLICT (user_id) DO UPDATE
SET
  publish_availability = true,
  updated_at = now();

COMMIT;

SELECT
  coalesce(display_name, full_name, name) AS name,
  id::text,
  services,
  hourly_rate,
  rate,
  is_bookable,
  booking_status,
  is_accepting_bookings,
  accepting_bookings,
  availability_notes
FROM public.gurus
WHERE id IN (
  'caaca844-af3c-43cc-971e-c0cbe767db51',
  '9b4c09d3-50ca-40d9-81df-b6d6ca58326e',
  '7384e5d7-97c6-4f0e-a386-8aaa0a3d9f34',
  '241cc5cf-a858-4818-bcd2-ee09acc367ef'
)
ORDER BY name;
