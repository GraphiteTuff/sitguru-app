-- Scalable Community Markets for SerpApi event discovery (Admin-managed).

CREATE TABLE IF NOT EXISTS public.community_markets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  county_name text,
  city text,
  state text NOT NULL DEFAULT 'PA',
  region text,
  location_query text NOT NULL,
  latitude double precision,
  longitude double precision,
  radius_miles integer NOT NULL DEFAULT 35
    CHECK (radius_miles > 0 AND radius_miles <= 150),
  search_terms text[] NOT NULL DEFAULT ARRAY[
    'pet friendly events',
    'dog adoption events',
    'pet events'
  ]::text[],
  event_categories text[] NOT NULL DEFAULT ARRAY[
    'Adoption',
    'Social',
    'Rescue',
    'Festival',
    'Community'
  ]::text[],
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 100,
  last_successful_sync_at timestamptz,
  last_sync_attempt_at timestamptz,
  last_sync_status text
    CHECK (last_sync_status IS NULL OR last_sync_status IN (
      'success', 'partial', 'failed', 'skipped', 'cached'
    )),
  last_sync_error text,
  last_sync_upserted integer NOT NULL DEFAULT 0,
  events_discovered_count integer NOT NULL DEFAULT 0,
  next_scheduled_sync_at timestamptz,
  serp_cache_ttl_hours integer NOT NULL DEFAULT 20
    CHECK (serp_cache_ttl_hours >= 1 AND serp_cache_ttl_hours <= 168),
  max_queries_per_sync integer NOT NULL DEFAULT 2
    CHECK (max_queries_per_sync >= 1 AND max_queries_per_sync <= 8),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_markets_enabled_sort_idx
  ON public.community_markets (enabled, sort_order, name);

CREATE TABLE IF NOT EXISTS public.community_market_serp_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid NOT NULL REFERENCES public.community_markets(id) ON DELETE CASCADE,
  query_hash text NOT NULL,
  search_query text NOT NULL,
  response_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  event_count integer NOT NULL DEFAULT 0,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_market_serp_cache_market_query_uidx
    UNIQUE (market_id, query_hash)
);

CREATE INDEX IF NOT EXISTS community_market_serp_cache_expires_idx
  ON public.community_market_serp_cache (expires_at);

CREATE TABLE IF NOT EXISTS public.community_serp_usage_daily (
  usage_date date PRIMARY KEY DEFAULT (timezone('utc', now()))::date,
  search_count integer NOT NULL DEFAULT 0,
  cache_hit_count integer NOT NULL DEFAULT 0,
  markets_synced integer NOT NULL DEFAULT 0,
  events_upserted integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Widen discoveries for scalable markets (drop hard-coded county check).
ALTER TABLE public.community_event_discoveries
  ADD COLUMN IF NOT EXISTS market_id uuid REFERENCES public.community_markets(id) ON DELETE SET NULL;

ALTER TABLE public.community_event_discoveries
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'community_event_discoveries_county_check'
  ) THEN
    ALTER TABLE public.community_event_discoveries
      DROP CONSTRAINT community_event_discoveries_county_check;
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Allow any county slug text going forward
ALTER TABLE public.community_event_discoveries
  ALTER COLUMN county DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'community_event_discoveries_status_check'
  ) THEN
    ALTER TABLE public.community_event_discoveries
      ADD CONSTRAINT community_event_discoveries_status_check
      CHECK (status IN ('active', 'archived', 'expired'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS community_event_discoveries_market_id_idx
  ON public.community_event_discoveries (market_id);

CREATE INDEX IF NOT EXISTS community_event_discoveries_status_start_idx
  ON public.community_event_discoveries (status, start_at);

-- Seed launch markets: Bucks, Montgomery, Lehigh, Northampton (PA)
INSERT INTO public.community_markets (
  slug, name, county_name, city, state, region, location_query,
  latitude, longitude, radius_miles, search_terms, event_categories,
  enabled, sort_order, next_scheduled_sync_at
) VALUES
(
  'bucks-county-pa',
  'Bucks County, PA',
  'Bucks County',
  'Doylestown',
  'PA',
  'Greater Philadelphia',
  'Bucks County, Pennsylvania',
  40.3101, -75.1310, 35,
  ARRAY['pet friendly events', 'dog adoption events', 'pet festivals'],
  ARRAY['Adoption', 'Social', 'Rescue', 'Festival', 'Community'],
  true, 10,
  timezone('utc', now()) + interval '1 day'
),
(
  'montgomery-county-pa',
  'Montgomery County, PA',
  'Montgomery County',
  'King of Prussia',
  'PA',
  'Greater Philadelphia',
  'Montgomery County, Pennsylvania',
  40.0892, -75.3397, 35,
  ARRAY['pet friendly events', 'dog friendly events', 'adoption events'],
  ARRAY['Adoption', 'Social', 'Rescue', 'Festival', 'Community'],
  true, 20,
  timezone('utc', now()) + interval '1 day'
),
(
  'lehigh-county-pa',
  'Lehigh County, PA',
  'Lehigh County',
  'Allentown',
  'PA',
  'Lehigh Valley',
  'Lehigh County, Pennsylvania',
  40.6084, -75.4902, 35,
  ARRAY['pet friendly events', 'dog adoption events', 'pet events'],
  ARRAY['Adoption', 'Social', 'Rescue', 'Festival', 'Community'],
  true, 30,
  timezone('utc', now()) + interval '1 day'
),
(
  'northampton-county-pa',
  'Northampton County, PA',
  'Northampton County',
  'Bethlehem',
  'PA',
  'Lehigh Valley',
  'Northampton County, Pennsylvania',
  40.6259, -75.3705, 35,
  ARRAY['pet friendly events', 'dog adoption events', 'pet events'],
  ARRAY['Adoption', 'Social', 'Rescue', 'Festival', 'Community'],
  true, 40,
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
  updated_at = now();

-- Backfill market_id for existing Bucks/Montgomery discoveries when possible
UPDATE public.community_event_discoveries d
SET market_id = m.id
FROM public.community_markets m
WHERE d.market_id IS NULL
  AND (
    (d.county = 'bucks' AND m.slug = 'bucks-county-pa')
    OR (d.county = 'montgomery' AND m.slug = 'montgomery-county-pa')
  );

ALTER TABLE public.community_markets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_markets_public_read ON public.community_markets;
CREATE POLICY community_markets_public_read
  ON public.community_markets
  FOR SELECT
  TO anon, authenticated
  USING (enabled = true);

COMMENT ON TABLE public.community_markets IS
  'Admin-managed geographic markets for SerpApi Community Event Discovery.';
COMMENT ON TABLE public.community_market_serp_cache IS
  'Server-side SerpApi response cache to limit monthly search usage.';
COMMENT ON TABLE public.community_serp_usage_daily IS
  'Daily SerpApi usage counters for Community Event Discovery.';
