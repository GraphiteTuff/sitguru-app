-- Repair misplaced Guru service coordinates after PA map-centering bug
-- Kayla Keeter (Rich Square, NC), Hazel Cronister (Suffolk, VA), Makayla Hinsley (Oklahoma City, OK)

UPDATE public.profiles
SET
  service_latitude = 36.2739,
  service_longitude = -77.2839,
  service_city = 'Rich Square',
  service_state = 'NC'
WHERE id = 'f7706ea3-5d9c-43b2-a67f-cb684217033e';

-- Note: Hazel's live UUID is 96f46272-6672-4c27-... (not ...-43c2-...)
UPDATE public.profiles
SET
  service_latitude = 36.7284,
  service_longitude = -76.5850,
  service_city = 'Suffolk',
  service_state = 'VA'
WHERE id = '96f46272-6672-4c27-8d82-4e5799256e20'
   OR full_name ILIKE '%Hazel Cronister%';

UPDATE public.profiles
SET
  service_latitude = 35.4676,
  service_longitude = -97.5164,
  service_city = 'Oklahoma City',
  service_state = 'OK'
WHERE full_name ILIKE '%Makayla Hinsley%';
