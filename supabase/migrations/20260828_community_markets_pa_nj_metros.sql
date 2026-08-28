-- Expand Community Markets: Philly suburbs, Lehigh Valley depth, Jersey Shore + dense NJ metros.
-- Keep SerpApi spend controlled: new markets default to 1 query/sync; Admin can raise later.

INSERT INTO public.community_markets (
  slug, name, county_name, city, state, region, location_query,
  latitude, longitude, radius_miles, search_terms, event_categories,
  enabled, sort_order, max_queries_per_sync, next_scheduled_sync_at
) VALUES
-- Greater Philadelphia PA suburbs
(
  'philadelphia-pa',
  'Philadelphia, PA',
  'Philadelphia County',
  'Philadelphia',
  'PA',
  'Greater Philadelphia',
  'Philadelphia, Pennsylvania',
  39.9526, -75.1652, 25,
  ARRAY['pet friendly events', 'dog adoption events', 'pet festivals'],
  ARRAY['Adoption', 'Social', 'Rescue', 'Festival', 'Community'],
  true, 5, 1,
  timezone('utc', now()) + interval '1 day'
),
(
  'chester-county-pa',
  'Chester County, PA',
  'Chester County',
  'West Chester',
  'PA',
  'Greater Philadelphia',
  'Chester County, Pennsylvania',
  39.9601, -75.6060, 35,
  ARRAY['pet friendly events', 'dog adoption events', 'pet events'],
  ARRAY['Adoption', 'Social', 'Rescue', 'Festival', 'Community'],
  true, 25, 1,
  timezone('utc', now()) + interval '1 day'
),
(
  'delaware-county-pa',
  'Delaware County, PA',
  'Delaware County',
  'Media',
  'PA',
  'Greater Philadelphia',
  'Delaware County, Pennsylvania',
  39.9187, -75.3877, 30,
  ARRAY['pet friendly events', 'dog adoption events', 'pet events'],
  ARRAY['Adoption', 'Social', 'Rescue', 'Festival', 'Community'],
  true, 28, 1,
  timezone('utc', now()) + interval '1 day'
),
-- Philly suburbs NJ
(
  'burlington-county-nj',
  'Burlington County, NJ',
  'Burlington County',
  'Mount Laurel',
  'NJ',
  'Greater Philadelphia',
  'Burlington County, New Jersey',
  39.9520, -74.9030, 30,
  ARRAY['pet friendly events', 'dog adoption events', 'pet events'],
  ARRAY['Adoption', 'Social', 'Rescue', 'Festival', 'Community'],
  true, 45, 1,
  timezone('utc', now()) + interval '1 day'
),
(
  'camden-county-nj',
  'Camden County, NJ',
  'Camden County',
  'Cherry Hill',
  'NJ',
  'Greater Philadelphia',
  'Camden County, New Jersey',
  39.9348, -75.0307, 30,
  ARRAY['pet friendly events', 'dog adoption events', 'pet festivals'],
  ARRAY['Adoption', 'Social', 'Rescue', 'Festival', 'Community'],
  true, 48, 1,
  timezone('utc', now()) + interval '1 day'
),
(
  'gloucester-county-nj',
  'Gloucester County, NJ',
  'Gloucester County',
  'Sewell',
  'NJ',
  'Greater Philadelphia',
  'Gloucester County, New Jersey',
  39.7465, -75.1113, 30,
  ARRAY['pet friendly events', 'dog adoption events', 'pet events'],
  ARRAY['Adoption', 'Social', 'Rescue', 'Festival', 'Community'],
  true, 50, 1,
  timezone('utc', now()) + interval '1 day'
),
-- Jersey Shore metros
(
  'monmouth-county-nj',
  'Monmouth County, NJ',
  'Monmouth County',
  'Freehold',
  'NJ',
  'Jersey Shore',
  'Monmouth County, New Jersey',
  40.2601, -74.2735, 35,
  ARRAY['pet friendly events', 'dog friendly beach events', 'adoption events'],
  ARRAY['Adoption', 'Social', 'Rescue', 'Festival', 'Community'],
  true, 60, 1,
  timezone('utc', now()) + interval '1 day'
),
(
  'ocean-county-nj',
  'Ocean County, NJ',
  'Ocean County',
  'Toms River',
  'NJ',
  'Jersey Shore',
  'Ocean County, New Jersey',
  39.9537, -74.1979, 35,
  ARRAY['pet friendly events', 'dog friendly beach events', 'pet festivals'],
  ARRAY['Adoption', 'Social', 'Rescue', 'Festival', 'Community'],
  true, 62, 1,
  timezone('utc', now()) + interval '1 day'
),
(
  'atlantic-county-nj',
  'Atlantic County, NJ',
  'Atlantic County',
  'Egg Harbor Township',
  'NJ',
  'Jersey Shore',
  'Atlantic County, New Jersey',
  39.4024, -74.5626, 35,
  ARRAY['pet friendly events', 'dog adoption events', 'pet festivals'],
  ARRAY['Adoption', 'Social', 'Rescue', 'Festival', 'Community'],
  true, 64, 1,
  timezone('utc', now()) + interval '1 day'
),
(
  'cape-may-county-nj',
  'Cape May County, NJ',
  'Cape May County',
  'Cape May',
  'NJ',
  'Jersey Shore',
  'Cape May County, New Jersey',
  38.9351, -74.9060, 30,
  ARRAY['pet friendly events', 'dog friendly beach events', 'pet events'],
  ARRAY['Adoption', 'Social', 'Rescue', 'Festival', 'Community'],
  true, 66, 1,
  timezone('utc', now()) + interval '1 day'
),
-- Dense NJ metros (high pet population)
(
  'mercer-county-nj',
  'Mercer County, NJ',
  'Mercer County',
  'Princeton',
  'NJ',
  'Central Jersey',
  'Mercer County, New Jersey',
  40.3573, -74.6672, 30,
  ARRAY['pet friendly events', 'dog adoption events', 'pet events'],
  ARRAY['Adoption', 'Social', 'Rescue', 'Festival', 'Community'],
  true, 70, 1,
  timezone('utc', now()) + interval '1 day'
),
(
  'middlesex-county-nj',
  'Middlesex County, NJ',
  'Middlesex County',
  'New Brunswick',
  'NJ',
  'Central Jersey',
  'Middlesex County, New Jersey',
  40.4862, -74.4518, 30,
  ARRAY['pet friendly events', 'dog adoption events', 'pet festivals'],
  ARRAY['Adoption', 'Social', 'Rescue', 'Festival', 'Community'],
  true, 72, 1,
  timezone('utc', now()) + interval '1 day'
),
(
  'bergen-county-nj',
  'Bergen County, NJ',
  'Bergen County',
  'Paramus',
  'NJ',
  'North Jersey',
  'Bergen County, New Jersey',
  40.9445, -74.0754, 30,
  ARRAY['pet friendly events', 'dog adoption events', 'pet festivals'],
  ARRAY['Adoption', 'Social', 'Rescue', 'Festival', 'Community'],
  true, 80, 1,
  timezone('utc', now()) + interval '1 day'
),
-- Dense North / Central Jersey suburbs (high pet household density)
(
  'essex-county-nj',
  'Essex County, NJ',
  'Essex County',
  'Montclair',
  'NJ',
  'North Jersey',
  'Essex County, New Jersey',
  40.8259, -74.2090, 25,
  ARRAY['pet friendly events', 'dog adoption events', 'pet festivals'],
  ARRAY['Adoption', 'Social', 'Rescue', 'Festival', 'Community'],
  true, 82, 1,
  timezone('utc', now()) + interval '1 day'
),
(
  'hudson-county-nj',
  'Hudson County, NJ',
  'Hudson County',
  'Jersey City',
  'NJ',
  'North Jersey',
  'Hudson County, New Jersey',
  40.7178, -74.0431, 20,
  ARRAY['pet friendly events', 'dog friendly events', 'adoption events'],
  ARRAY['Adoption', 'Social', 'Rescue', 'Festival', 'Community'],
  true, 84, 1,
  timezone('utc', now()) + interval '1 day'
),
(
  'union-county-nj',
  'Union County, NJ',
  'Union County',
  'Westfield',
  'NJ',
  'North Jersey',
  'Union County, New Jersey',
  40.6590, -74.3474, 25,
  ARRAY['pet friendly events', 'dog adoption events', 'pet events'],
  ARRAY['Adoption', 'Social', 'Rescue', 'Festival', 'Community'],
  true, 86, 1,
  timezone('utc', now()) + interval '1 day'
),
(
  'morris-county-nj',
  'Morris County, NJ',
  'Morris County',
  'Morristown',
  'NJ',
  'North Jersey',
  'Morris County, New Jersey',
  40.7968, -74.4815, 30,
  ARRAY['pet friendly events', 'dog adoption events', 'pet festivals'],
  ARRAY['Adoption', 'Social', 'Rescue', 'Festival', 'Community'],
  true, 88, 1,
  timezone('utc', now()) + interval '1 day'
),
(
  'somerset-county-nj',
  'Somerset County, NJ',
  'Somerset County',
  'Bridgewater',
  'NJ',
  'Central Jersey',
  'Somerset County, New Jersey',
  40.5934, -74.6049, 30,
  ARRAY['pet friendly events', 'dog adoption events', 'pet events'],
  ARRAY['Adoption', 'Social', 'Rescue', 'Festival', 'Community'],
  true, 74, 1,
  timezone('utc', now()) + interval '1 day'
),
(
  'passaic-county-nj',
  'Passaic County, NJ',
  'Passaic County',
  'Wayne',
  'NJ',
  'North Jersey',
  'Passaic County, New Jersey',
  40.9254, -74.2765, 25,
  ARRAY['pet friendly events', 'dog adoption events', 'pet events'],
  ARRAY['Adoption', 'Social', 'Rescue', 'Festival', 'Community'],
  true, 90, 1,
  timezone('utc', now()) + interval '1 day'
),
-- Lehigh Valley spillover + Reading metro (pet-dense suburbs)
(
  'warren-county-nj',
  'Warren County, NJ',
  'Warren County',
  'Phillipsburg',
  'NJ',
  'Lehigh Valley',
  'Warren County, New Jersey',
  40.6937, -75.1902, 30,
  ARRAY['pet friendly events', 'dog adoption events', 'pet events'],
  ARRAY['Adoption', 'Social', 'Rescue', 'Festival', 'Community'],
  true, 42, 1,
  timezone('utc', now()) + interval '1 day'
),
(
  'berks-county-pa',
  'Berks County, PA',
  'Berks County',
  'Reading',
  'PA',
  'Reading / Lehigh Valley',
  'Berks County, Pennsylvania',
  40.3356, -75.9269, 35,
  ARRAY['pet friendly events', 'dog adoption events', 'pet festivals'],
  ARRAY['Adoption', 'Social', 'Rescue', 'Festival', 'Community'],
  true, 35, 1,
  timezone('utc', now()) + interval '1 day'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  county_name = EXCLUDED.county_name,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  region = EXCLUDED.region,
  location_query = EXCLUDED.location_query,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  radius_miles = EXCLUDED.radius_miles,
  search_terms = EXCLUDED.search_terms,
  event_categories = EXCLUDED.event_categories,
  enabled = EXCLUDED.enabled,
  sort_order = EXCLUDED.sort_order,
  max_queries_per_sync = EXCLUDED.max_queries_per_sync,
  updated_at = now();

-- Keep launch markets labeled + SerpApi spend capped at 1 query/sync.
UPDATE public.community_markets
SET
  region = CASE slug
    WHEN 'lehigh-county-pa' THEN 'Lehigh Valley'
    WHEN 'northampton-county-pa' THEN 'Lehigh Valley'
    WHEN 'bucks-county-pa' THEN 'Greater Philadelphia'
    WHEN 'montgomery-county-pa' THEN 'Greater Philadelphia'
    ELSE region
  END,
  max_queries_per_sync = LEAST(COALESCE(max_queries_per_sync, 1), 1),
  updated_at = now()
WHERE slug IN (
  'lehigh-county-pa',
  'northampton-county-pa',
  'bucks-county-pa',
  'montgomery-county-pa'
);
