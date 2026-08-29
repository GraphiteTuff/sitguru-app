-- 1) Add smart-growth columns if missing (fixes: column "market_tier" does not exist)
-- 2) Upsert Montgomery County + other major PA markets

ALTER TABLE public.community_markets
  ADD COLUMN IF NOT EXISTS market_tier text NOT NULL DEFAULT 'expansion',
  ADD COLUMN IF NOT EXISTS city_anchors text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS city_anchor_index integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sync_frequency_hours integer NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS market_health text NOT NULL DEFAULT 'healthy',
  ADD COLUMN IF NOT EXISTS searches_performed_total integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS events_discovered_total integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pet_relevant_events_total integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS events_rejected_total integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS events_inserted_total integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS events_updated_total integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duplicates_detected_total integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS zero_result_searches_total integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS consecutive_zero_yield_syncs integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_pet_yield_per_search numeric(8,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_pet_yield_per_search numeric(8,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pet_relevant_events_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_queries_per_sync integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS county_name text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS location_query text,
  ADD COLUMN IF NOT EXISTS next_scheduled_sync_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'community_markets_market_tier_check'
  ) THEN
    ALTER TABLE public.community_markets
      ADD CONSTRAINT community_markets_market_tier_check
      CHECK (market_tier IN ('core', 'growth', 'expansion', 'seasonal', 'paused'));
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'market_tier check skipped: %', SQLERRM;
END $$;

INSERT INTO public.community_markets (
  slug, name, county_name, city, state, region, location_query,
  latitude, longitude, radius_miles, search_terms, event_categories,
  enabled, sort_order, market_tier, city_anchors, sync_frequency_hours,
  max_queries_per_sync, next_scheduled_sync_at
) VALUES
(
  'montgomery-county-pa',
  'Montgomery County, PA',
  'Montgomery County',
  'Norristown',
  'PA',
  'Greater Philadelphia',
  'Montgomery County, Pennsylvania',
  40.1215,
  -75.3399,
  35,
  ARRAY['pet events','dog adoption events','pet adoption events','pet friendly events'],
  ARRAY['Adoption','Social','Rescue','Festival','Community'],
  true,
  12,
  'core',
  ARRAY['Norristown','King of Prussia','Lansdale','Pottstown','Ambler','Conshohocken','Ardmore','Blue Bell'],
  24,
  2,
  timezone('utc', now())
),
(
  'delaware-county-pa',
  'Delaware County, PA',
  'Delaware County',
  'Media',
  'PA',
  'Greater Philadelphia',
  'Delaware County, Pennsylvania',
  39.9187,
  -75.3877,
  30,
  ARRAY['pet events','dog adoption events','pet adoption events','pet friendly events'],
  ARRAY['Adoption','Social','Rescue','Festival','Community'],
  true,
  18,
  'core',
  ARRAY['Media','Springfield','Upper Darby','Chester'],
  24,
  1,
  timezone('utc', now())
),
(
  'lancaster-county-pa',
  'Lancaster County, PA',
  'Lancaster County',
  'Lancaster',
  'PA',
  'Central Pennsylvania',
  'Lancaster County, Pennsylvania',
  40.0379,
  -76.3055,
  35,
  ARRAY['pet events','dog adoption events','pet adoption events','pet friendly events'],
  ARRAY['Adoption','Social','Rescue','Festival','Community'],
  true,
  45,
  'growth',
  ARRAY['Lancaster','Lititz','Ephrata','Columbia'],
  36,
  1,
  timezone('utc', now())
),
(
  'york-county-pa',
  'York County, PA',
  'York County',
  'York',
  'PA',
  'Central Pennsylvania',
  'York County, Pennsylvania',
  39.9626,
  -76.7277,
  35,
  ARRAY['pet events','dog adoption events','pet adoption events','pet friendly events'],
  ARRAY['Adoption','Social','Rescue','Festival','Community'],
  true,
  46,
  'growth',
  ARRAY['York','Hanover','Red Lion'],
  36,
  1,
  timezone('utc', now())
),
(
  'dauphin-county-pa',
  'Dauphin County, PA',
  'Dauphin County',
  'Harrisburg',
  'PA',
  'Central Pennsylvania',
  'Dauphin County, Pennsylvania',
  40.2732,
  -76.8867,
  30,
  ARRAY['pet events','dog adoption events','pet adoption events','pet friendly events'],
  ARRAY['Adoption','Social','Rescue','Festival','Community'],
  true,
  47,
  'growth',
  ARRAY['Harrisburg','Hershey','Hummelstown'],
  36,
  1,
  timezone('utc', now())
),
(
  'allegheny-county-pa',
  'Allegheny County, PA',
  'Allegheny County',
  'Pittsburgh',
  'PA',
  'Western Pennsylvania',
  'Allegheny County, Pennsylvania',
  40.4406,
  -79.9959,
  30,
  ARRAY['pet events','dog adoption events','pet adoption events','pet friendly events'],
  ARRAY['Adoption','Social','Rescue','Festival','Community'],
  true,
  48,
  'growth',
  ARRAY['Pittsburgh','Monroeville','Cranberry Township'],
  36,
  1,
  timezone('utc', now())
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
  enabled = true,
  sort_order = EXCLUDED.sort_order,
  market_tier = EXCLUDED.market_tier,
  city_anchors = EXCLUDED.city_anchors,
  sync_frequency_hours = EXCLUDED.sync_frequency_hours,
  max_queries_per_sync = EXCLUDED.max_queries_per_sync,
  updated_at = timezone('utc', now());
