-- Make Crystal + peer listed_only bookables fully bookable; restore Olivia email
UPDATE public.gurus
SET
  booking_status = 'bookable',
  is_accepting_bookings = true,
  accepting_bookings = true,
  admin_status = 'approved',
  public_status = 'public',
  profile_quality_status = 'bookable',
  is_bookable = true,
  is_public = true,
  is_public_visible = true,
  is_active = true,
  application_status = 'bookable',
  status = 'active',
  updated_at = now()
WHERE id IN (
  'caaca844-af3c-43cc-971e-c0cbe767db51', -- Crystal
  '9b4c09d3-50ca-40d9-81df-b6d6ca58326e', -- Cassidy Dimmitt
  '7384e5d7-97c6-4f0e-a386-8aaa0a3d9f34', -- Destiny Thomas
  '241cc5cf-a858-4818-bcd2-ee09acc367ef', -- Genesta Humphrey
  '3c272af0-45a8-4551-af93-09ec14831c53', -- Monica Grau
  '6304261d-f0e6-431b-ad9b-7f4693c6aaa6'  -- Olivia Goode
);

UPDATE public.gurus
SET
  email = 'pawfectperfections@gmail.com',
  updated_at = now()
WHERE id = '6304261d-f0e6-431b-ad9b-7f4693c6aaa6';

UPDATE public.profiles
SET
  email = 'pawfectperfections@gmail.com',
  updated_at = now()
WHERE id = '85c39cee-af7f-40f4-9c78-0c70664da13b'
  AND (
    email IS NULL
    OR lower(trim(email)) IN ('', 'paste_olivia_email_here')
    OR email NOT LIKE '%@%.%'
  );
