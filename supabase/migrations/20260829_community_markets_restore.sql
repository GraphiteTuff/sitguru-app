-- Restore discovery markets + allow budget_deferred sync status.
-- Markets are admin-configured; SerpApi pulls events into them.

-- Allow budget_deferred on last_sync_status (was blocking sync updates).
DO $$
DECLARE
  con_name text;
BEGIN
  SELECT c.conname INTO con_name
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  WHERE t.relname = 'community_markets'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%last_sync_status%';

  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.community_markets DROP CONSTRAINT %I', con_name);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'community_markets_last_sync_status_check'
  ) THEN
    ALTER TABLE public.community_markets
      ADD CONSTRAINT community_markets_last_sync_status_check
      CHECK (
        last_sync_status IS NULL OR last_sync_status IN (
          'success',
          'partial',
          'failed',
          'skipped',
          'cached',
          'budget_deferred'
        )
      );
  END IF;
END $$;

-- Ensure smart-growth columns exist (idempotent).
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
  ADD COLUMN IF NOT EXISTS pet_relevant_events_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.community_event_discoveries
  ADD COLUMN IF NOT EXISTS pet_relevance_score integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS pet_relevance_override integer,
  ADD COLUMN IF NOT EXISTS content_fingerprint text,
  ADD COLUMN IF NOT EXISTS qualifying_pet_event boolean NOT NULL DEFAULT true;

ALTER TABLE public.community_serp_usage_daily
  ADD COLUMN IF NOT EXISTS pet_relevant_upserted integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duplicates_prevented integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS markets_deferred integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.community_event_discovery_markets (
  discovery_id uuid NOT NULL
    REFERENCES public.community_event_discoveries(id) ON DELETE CASCADE,
  market_id uuid NOT NULL
    REFERENCES public.community_markets(id) ON DELETE CASCADE,
  linked_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  PRIMARY KEY (discovery_id, market_id)
);

-- Full PA/NJ market catalog upsert (SerpApi syncs events into these).
INSERT INTO public.community_markets (
  slug, name, county_name, city, state, region, location_query,
  latitude, longitude, radius_miles, search_terms, event_categories,
  enabled, sort_order, market_tier, city_anchors, sync_frequency_hours,
  max_queries_per_sync, next_scheduled_sync_at
) VALUES
('philadelphia-pa', 'Philadelphia, PA', 'Philadelphia County', 'Philadelphia', 'PA', 'Greater Philadelphia', 'Philadelphia, Pennsylvania', 39.9526, -75.1652, 25, ARRAY['pet events','dog adoption events','pet adoption events','pet friendly events'], ARRAY['Adoption','Social','Rescue','Festival','Community'], true, 5, 'core', ARRAY['Philadelphia'], 24, 1, timezone('utc', now())),
('bucks-county-pa', 'Bucks County, PA', 'Bucks County', 'Doylestown', 'PA', 'Greater Philadelphia', 'Bucks County, Pennsylvania', 40.3101, -75.1310, 35, ARRAY['pet events','dog adoption events','pet adoption events','pet friendly events'], ARRAY['Adoption','Social','Rescue','Festival','Community'], true, 10, 'core', ARRAY['Doylestown','Newtown','Quakertown','Yardley'], 24, 1, timezone('utc', now())),
('montgomery-county-pa', 'Montgomery County, PA', 'Montgomery County', 'King of Prussia', 'PA', 'Greater Philadelphia', 'Montgomery County, Pennsylvania', 40.0892, -75.3397, 35, ARRAY['pet events','dog adoption events','pet adoption events','pet friendly events'], ARRAY['Adoption','Social','Rescue','Festival','Community'], true, 20, 'core', ARRAY['King of Prussia','Lansdale','Pottstown','Ambler'], 24, 1, timezone('utc', now())),
('chester-county-pa', 'Chester County, PA', 'Chester County', 'West Chester', 'PA', 'Greater Philadelphia', 'Chester County, Pennsylvania', 39.9601, -75.6060, 35, ARRAY['pet events','dog adoption events','pet adoption events','pet friendly events'], ARRAY['Adoption','Social','Rescue','Festival','Community'], true, 25, 'core', ARRAY['West Chester','Exton','Downingtown','Phoenixville'], 24, 1, timezone('utc', now())),
('delaware-county-pa', 'Delaware County, PA', 'Delaware County', 'Media', 'PA', 'Greater Philadelphia', 'Delaware County, Pennsylvania', 39.9187, -75.3877, 30, ARRAY['pet events','dog adoption events','pet adoption events','pet friendly events'], ARRAY['Adoption','Social','Rescue','Festival','Community'], true, 28, 'growth', ARRAY['Media','Springfield'], 24, 1, timezone('utc', now())),
('lehigh-county-pa', 'Lehigh County, PA', 'Lehigh County', 'Allentown', 'PA', 'Lehigh Valley', 'Lehigh County, Pennsylvania', 40.6084, -75.4902, 35, ARRAY['pet events','dog adoption events','pet adoption events','pet friendly events'], ARRAY['Adoption','Social','Rescue','Festival','Community'], true, 30, 'core', ARRAY['Allentown','Bethlehem'], 24, 1, timezone('utc', now())),
('berks-county-pa', 'Berks County, PA', 'Berks County', 'Reading', 'PA', 'Reading / Lehigh Valley', 'Berks County, Pennsylvania', 40.3356, -75.9269, 35, ARRAY['pet events','dog adoption events','pet adoption events','pet friendly events'], ARRAY['Adoption','Social','Rescue','Festival','Community'], true, 35, 'growth', ARRAY['Reading','Wyomissing'], 24, 1, timezone('utc', now())),
('northampton-county-pa', 'Northampton County, PA', 'Northampton County', 'Bethlehem', 'PA', 'Lehigh Valley', 'Northampton County, Pennsylvania', 40.6259, -75.3705, 35, ARRAY['pet events','dog adoption events','pet adoption events','pet friendly events'], ARRAY['Adoption','Social','Rescue','Festival','Community'], true, 40, 'core', ARRAY['Bethlehem','Easton','Nazareth'], 24, 1, timezone('utc', now())),
('warren-county-nj', 'Warren County, NJ', 'Warren County', 'Phillipsburg', 'NJ', 'Lehigh Valley', 'Warren County, New Jersey', 40.6937, -75.1902, 30, ARRAY['pet events','dog adoption events','pet adoption events','pet friendly events'], ARRAY['Adoption','Social','Rescue','Festival','Community'], true, 42, 'seasonal', ARRAY['Phillipsburg','Washington'], 168, 1, timezone('utc', now())),
('burlington-county-nj', 'Burlington County, NJ', 'Burlington County', 'Mount Laurel', 'NJ', 'Greater Philadelphia', 'Burlington County, New Jersey', 39.9520, -74.9030, 30, ARRAY['pet events','dog adoption events','pet adoption events','pet friendly events'], ARRAY['Adoption','Social','Rescue','Festival','Community'], true, 45, 'growth', ARRAY['Mount Holly','Mount Laurel','Burlington'], 24, 1, timezone('utc', now())),
('camden-county-nj', 'Camden County, NJ', 'Camden County', 'Cherry Hill', 'NJ', 'Greater Philadelphia', 'Camden County, New Jersey', 39.9348, -75.0307, 30, ARRAY['pet events','dog adoption events','pet adoption events','pet friendly events'], ARRAY['Adoption','Social','Rescue','Festival','Community'], true, 48, 'growth', ARRAY['Cherry Hill','Haddonfield','Voorhees'], 24, 1, timezone('utc', now())),
('gloucester-county-nj', 'Gloucester County, NJ', 'Gloucester County', 'Sewell', 'NJ', 'Greater Philadelphia', 'Gloucester County, New Jersey', 39.7465, -75.1113, 30, ARRAY['pet events','dog adoption events','pet adoption events','pet friendly events'], ARRAY['Adoption','Social','Rescue','Festival','Community'], true, 50, 'growth', ARRAY['Deptford','Washington Township'], 24, 1, timezone('utc', now())),
('monmouth-county-nj', 'Monmouth County, NJ', 'Monmouth County', 'Freehold', 'NJ', 'Jersey Shore', 'Monmouth County, New Jersey', 40.2601, -74.2735, 35, ARRAY['pet events','dog adoption events','pet adoption events','pet friendly events'], ARRAY['Adoption','Social','Rescue','Festival','Community'], true, 60, 'growth', ARRAY['Freehold','Red Bank','Asbury Park'], 24, 1, timezone('utc', now())),
('ocean-county-nj', 'Ocean County, NJ', 'Ocean County', 'Toms River', 'NJ', 'Jersey Shore', 'Ocean County, New Jersey', 39.9537, -74.1979, 35, ARRAY['pet events','dog adoption events','pet adoption events','pet friendly events'], ARRAY['Adoption','Social','Rescue','Festival','Community'], true, 62, 'growth', ARRAY['Toms River','Point Pleasant','Brick'], 24, 1, timezone('utc', now())),
('atlantic-county-nj', 'Atlantic County, NJ', 'Atlantic County', 'Egg Harbor Township', 'NJ', 'Jersey Shore', 'Atlantic County, New Jersey', 39.4024, -74.5626, 35, ARRAY['pet events','dog adoption events','pet adoption events','pet friendly events'], ARRAY['Adoption','Social','Rescue','Festival','Community'], true, 64, 'seasonal', ARRAY['Egg Harbor Township','Atlantic City','Ventnor'], 168, 1, timezone('utc', now())),
('cape-may-county-nj', 'Cape May County, NJ', 'Cape May County', 'Cape May', 'NJ', 'Jersey Shore', 'Cape May County, New Jersey', 38.9351, -74.9060, 30, ARRAY['pet events','dog adoption events','pet adoption events','pet friendly events'], ARRAY['Adoption','Social','Rescue','Festival','Community'], true, 66, 'seasonal', ARRAY['Cape May','Wildwood','Ocean City'], 168, 1, timezone('utc', now())),
('mercer-county-nj', 'Mercer County, NJ', 'Mercer County', 'Princeton', 'NJ', 'Central Jersey', 'Mercer County, New Jersey', 40.3573, -74.6672, 30, ARRAY['pet events','dog adoption events','pet adoption events','pet friendly events'], ARRAY['Adoption','Social','Rescue','Festival','Community'], true, 70, 'growth', ARRAY['Princeton','Trenton','Hamilton'], 24, 1, timezone('utc', now())),
('middlesex-county-nj', 'Middlesex County, NJ', 'Middlesex County', 'New Brunswick', 'NJ', 'Central Jersey', 'Middlesex County, New Jersey', 40.4862, -74.4518, 30, ARRAY['pet events','dog adoption events','pet adoption events','pet friendly events'], ARRAY['Adoption','Social','Rescue','Festival','Community'], true, 72, 'expansion', ARRAY['New Brunswick','Edison','Metuchen'], 60, 1, timezone('utc', now())),
('somerset-county-nj', 'Somerset County, NJ', 'Somerset County', 'Bridgewater', 'NJ', 'Central Jersey', 'Somerset County, New Jersey', 40.5934, -74.6049, 30, ARRAY['pet events','dog adoption events','pet adoption events','pet friendly events'], ARRAY['Adoption','Social','Rescue','Festival','Community'], true, 74, 'growth', ARRAY['Bridgewater','Somerville'], 24, 1, timezone('utc', now())),
('bergen-county-nj', 'Bergen County, NJ', 'Bergen County', 'Paramus', 'NJ', 'North Jersey', 'Bergen County, New Jersey', 40.9445, -74.0754, 30, ARRAY['pet events','dog adoption events','pet adoption events','pet friendly events'], ARRAY['Adoption','Social','Rescue','Festival','Community'], true, 80, 'expansion', ARRAY['Paramus','Hackensack','Fort Lee'], 60, 1, timezone('utc', now())),
('essex-county-nj', 'Essex County, NJ', 'Essex County', 'Montclair', 'NJ', 'North Jersey', 'Essex County, New Jersey', 40.8259, -74.2090, 25, ARRAY['pet events','dog adoption events','pet adoption events','pet friendly events'], ARRAY['Adoption','Social','Rescue','Festival','Community'], true, 82, 'expansion', ARRAY['Montclair','West Orange','Maplewood'], 60, 1, timezone('utc', now())),
('hudson-county-nj', 'Hudson County, NJ', 'Hudson County', 'Jersey City', 'NJ', 'North Jersey', 'Hudson County, New Jersey', 40.7178, -74.0431, 20, ARRAY['pet events','dog adoption events','pet adoption events','pet friendly events'], ARRAY['Adoption','Social','Rescue','Festival','Community'], true, 84, 'expansion', ARRAY['Jersey City','Hoboken','Bayonne'], 60, 1, timezone('utc', now())),
('union-county-nj', 'Union County, NJ', 'Union County', 'Westfield', 'NJ', 'North Jersey', 'Union County, New Jersey', 40.6590, -74.3474, 25, ARRAY['pet events','dog adoption events','pet adoption events','pet friendly events'], ARRAY['Adoption','Social','Rescue','Festival','Community'], true, 86, 'expansion', ARRAY['Westfield','Summit','Elizabeth'], 60, 1, timezone('utc', now())),
('morris-county-nj', 'Morris County, NJ', 'Morris County', 'Morristown', 'NJ', 'North Jersey', 'Morris County, New Jersey', 40.7968, -74.4815, 30, ARRAY['pet events','dog adoption events','pet adoption events','pet friendly events'], ARRAY['Adoption','Social','Rescue','Festival','Community'], true, 88, 'expansion', ARRAY['Morristown','Madison','Parsippany'], 60, 1, timezone('utc', now())),
('passaic-county-nj', 'Passaic County, NJ', 'Passaic County', 'Wayne', 'NJ', 'North Jersey', 'Passaic County, New Jersey', 40.9254, -74.2765, 25, ARRAY['pet events','dog adoption events','pet adoption events','pet friendly events'], ARRAY['Adoption','Social','Rescue','Festival','Community'], true, 90, 'expansion', ARRAY['Wayne','Clifton','Passaic'], 60, 1, timezone('utc', now()))
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
  updated_at = now();
