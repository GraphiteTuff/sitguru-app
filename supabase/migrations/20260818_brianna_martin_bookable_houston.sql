-- Make Brianna Martin (bri.martin322@gmail.com) bookable + Find Care visible
-- Houston, TX 77068 map pin
-- Sync Google OAuth avatar onto profiles/gurus (admin already showed it via auth metadata)

UPDATE public.profiles
SET
  role = 'guru',
  is_bookable = true,
  is_public = true,
  is_public_visible = true,
  is_active = true,
  admin_status = 'approved',
  city = 'Houston',
  state = 'TX',
  zip_code = '77068',
  service_city = 'Houston',
  service_state = 'TX',
  service_zip = '77068',
  service_zip_code = '77068',
  service_area = 'Houston, TX, US 77068',
  service_latitude = 30.0062,
  service_longitude = -95.4879,
  avatar_url = COALESCE(
    NULLIF(TRIM(avatar_url), ''),
    'https://lh3.googleusercontent.com/a/ACg8ocIQVEwUxa2rP9V9trQA-9o6wuQacCVGhGX5pgRbOQg0boyvxA6U=s512-c'
  ),
  profile_photo_url = COALESCE(
    NULLIF(TRIM(profile_photo_url), ''),
    'https://lh3.googleusercontent.com/a/ACg8ocIQVEwUxa2rP9V9trQA-9o6wuQacCVGhGX5pgRbOQg0boyvxA6U=s512-c'
  ),
  photo_url = COALESCE(
    NULLIF(TRIM(photo_url), ''),
    'https://lh3.googleusercontent.com/a/ACg8ocIQVEwUxa2rP9V9trQA-9o6wuQacCVGhGX5pgRbOQg0boyvxA6U=s512-c'
  ),
  bio = COALESCE(NULLIF(TRIM(bio), ''), 'Friendly Houston-area Pet Guru ready to care for local pets with reliable walks, drop-ins, and sitting support.'),
  updated_at = NOW()
WHERE lower(email) = 'bri.martin322@gmail.com';

UPDATE public.gurus
SET
  status = 'active',
  application_status = 'bookable',
  admin_status = 'approved',
  public_status = 'public',
  profile_quality_status = 'bookable',
  booking_status = 'bookable',
  is_bookable = true,
  is_public = true,
  is_public_visible = true,
  is_active = true,
  is_accepting_bookings = true,
  accepting_bookings = true,
  has_availability = true,
  city = 'Houston',
  state = 'TX',
  zip_code = '77068',
  service_city = 'Houston',
  service_state = 'TX',
  service_zip = '77068',
  service_zip_code = '77068',
  service_area = 'Houston, TX, US 77068',
  service_latitude = 30.0062,
  service_longitude = -95.4879,
  avatar_url = COALESCE(
    NULLIF(TRIM(avatar_url), ''),
    'https://lh3.googleusercontent.com/a/ACg8ocIQVEwUxa2rP9V9trQA-9o6wuQacCVGhGX5pgRbOQg0boyvxA6U=s512-c'
  ),
  profile_photo_url = COALESCE(
    NULLIF(TRIM(profile_photo_url), ''),
    'https://lh3.googleusercontent.com/a/ACg8ocIQVEwUxa2rP9V9trQA-9o6wuQacCVGhGX5pgRbOQg0boyvxA6U=s512-c'
  ),
  photo_url = COALESCE(
    NULLIF(TRIM(photo_url), ''),
    'https://lh3.googleusercontent.com/a/ACg8ocIQVEwUxa2rP9V9trQA-9o6wuQacCVGhGX5pgRbOQg0boyvxA6U=s512-c'
  ),
  image_url = COALESCE(
    NULLIF(TRIM(image_url), ''),
    'https://lh3.googleusercontent.com/a/ACg8ocIQVEwUxa2rP9V9trQA-9o6wuQacCVGhGX5pgRbOQg0boyvxA6U=s512-c'
  ),
  services = COALESCE(NULLIF(services, '[]'::jsonb), '["Dog Walking","Drop-In Visits","Pet Sitting"]'::jsonb),
  bio = COALESCE(NULLIF(TRIM(bio), ''), 'Friendly Houston-area Pet Guru ready to care for local pets with reliable walks, drop-ins, and sitting support.'),
  hourly_rate = COALESCE(hourly_rate, 25),
  bookable_at = COALESCE(bookable_at, NOW()),
  approved_at = COALESCE(approved_at, NOW()),
  updated_at = NOW()
WHERE lower(email) = 'bri.martin322@gmail.com'
   OR user_id = (
     SELECT id FROM public.profiles WHERE lower(email) = 'bri.martin322@gmail.com' LIMIT 1
   );
