-- Smart geographic growth for Community Markets.
-- Partner-published SitGuru events remain separate (community_events).
-- This enhances discovery markets only.

-- ---------------------------------------------------------------------------
-- Market tiers, anchors, scheduling, yield
-- ---------------------------------------------------------------------------
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'community_markets_market_tier_check'
  ) THEN
    ALTER TABLE public.community_markets
      ADD CONSTRAINT community_markets_market_tier_check
      CHECK (market_tier IN ('core', 'growth', 'expansion', 'seasonal', 'paused'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'community_markets_market_health_check'
  ) THEN
    ALTER TABLE public.community_markets
      ADD CONSTRAINT community_markets_market_health_check
      CHECK (market_health IN (
        'excellent',
        'healthy',
        'low_yield',
        'needs_review',
        'budget_deferred',
        'api_error',
        'paused'
      ));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS community_markets_tier_enabled_idx
  ON public.community_markets (market_tier, enabled, sort_order);

-- ---------------------------------------------------------------------------
-- Discovery relevance + cross-market fingerprint
-- ---------------------------------------------------------------------------
ALTER TABLE public.community_event_discoveries
  ADD COLUMN IF NOT EXISTS pet_relevance_score integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS pet_relevance_override integer,
  ADD COLUMN IF NOT EXISTS content_fingerprint text,
  ADD COLUMN IF NOT EXISTS qualifying_pet_event boolean NOT NULL DEFAULT true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'community_event_discoveries_pet_score_check'
  ) THEN
    ALTER TABLE public.community_event_discoveries
      ADD CONSTRAINT community_event_discoveries_pet_score_check
      CHECK (pet_relevance_score BETWEEN 0 AND 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'community_event_discoveries_pet_override_check'
  ) THEN
    ALTER TABLE public.community_event_discoveries
      ADD CONSTRAINT community_event_discoveries_pet_override_check
      CHECK (
        pet_relevance_override IS NULL
        OR pet_relevance_override BETWEEN 0 AND 100
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS community_event_discoveries_fingerprint_idx
  ON public.community_event_discoveries (content_fingerprint)
  WHERE content_fingerprint IS NOT NULL;

CREATE INDEX IF NOT EXISTS community_event_discoveries_pet_score_idx
  ON public.community_event_discoveries (status, pet_relevance_score DESC, start_at ASC);

-- Many-to-many: one discovered event can belong to multiple markets
CREATE TABLE IF NOT EXISTS public.community_event_discovery_markets (
  discovery_id uuid NOT NULL
    REFERENCES public.community_event_discoveries(id) ON DELETE CASCADE,
  market_id uuid NOT NULL
    REFERENCES public.community_markets(id) ON DELETE CASCADE,
  linked_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  PRIMARY KEY (discovery_id, market_id)
);

CREATE INDEX IF NOT EXISTS community_event_discovery_markets_market_idx
  ON public.community_event_discovery_markets (market_id, linked_at DESC);

ALTER TABLE public.community_event_discovery_markets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_event_discovery_markets_public_read
  ON public.community_event_discovery_markets;
CREATE POLICY community_event_discovery_markets_public_read
  ON public.community_event_discovery_markets
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Daily usage extras
ALTER TABLE public.community_serp_usage_daily
  ADD COLUMN IF NOT EXISTS pet_relevant_upserted integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duplicates_prevented integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS markets_deferred integer NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------------------
-- Initial PA/NJ tier + city anchor configuration (do not delete markets)
-- ---------------------------------------------------------------------------
UPDATE public.community_markets SET
  market_tier = 'core',
  sync_frequency_hours = 24,
  sort_order = 10,
  city_anchors = ARRAY['Doylestown', 'Newtown', 'Quakertown', 'Yardley'],
  city = COALESCE(NULLIF(city, ''), 'Doylestown'),
  updated_at = now()
WHERE slug = 'bucks-county-pa';

UPDATE public.community_markets SET
  market_tier = 'core',
  sync_frequency_hours = 24,
  sort_order = 20,
  city_anchors = ARRAY['King of Prussia', 'Lansdale', 'Pottstown', 'Ambler'],
  city = COALESCE(NULLIF(city, ''), 'King of Prussia'),
  updated_at = now()
WHERE slug = 'montgomery-county-pa';

UPDATE public.community_markets SET
  market_tier = 'core',
  sync_frequency_hours = 24,
  sort_order = 30,
  city_anchors = ARRAY['Allentown', 'Bethlehem'],
  city = COALESCE(NULLIF(city, ''), 'Allentown'),
  updated_at = now()
WHERE slug = 'lehigh-county-pa';

UPDATE public.community_markets SET
  market_tier = 'core',
  sync_frequency_hours = 24,
  sort_order = 40,
  city_anchors = ARRAY['Bethlehem', 'Easton', 'Nazareth'],
  city = COALESCE(NULLIF(city, ''), 'Bethlehem'),
  updated_at = now()
WHERE slug = 'northampton-county-pa';

UPDATE public.community_markets SET
  market_tier = 'core',
  sync_frequency_hours = 24,
  sort_order = 25,
  city_anchors = ARRAY['West Chester', 'Exton', 'Downingtown', 'Phoenixville'],
  city = COALESCE(NULLIF(city, ''), 'West Chester'),
  updated_at = now()
WHERE slug = 'chester-county-pa';

UPDATE public.community_markets SET
  market_tier = 'core',
  sync_frequency_hours = 24,
  sort_order = 5,
  city_anchors = ARRAY['Philadelphia'],
  city = COALESCE(NULLIF(city, ''), 'Philadelphia'),
  updated_at = now()
WHERE slug = 'philadelphia-pa';

UPDATE public.community_markets SET
  market_tier = 'growth',
  sync_frequency_hours = 24,
  sort_order = 35,
  city_anchors = ARRAY['Reading', 'Wyomissing'],
  city = COALESCE(NULLIF(city, ''), 'Reading'),
  updated_at = now()
WHERE slug = 'berks-county-pa';

UPDATE public.community_markets SET
  market_tier = 'growth',
  sync_frequency_hours = 24,
  sort_order = 28,
  city_anchors = ARRAY['Media', 'Springfield'],
  city = COALESCE(NULLIF(city, ''), 'Media'),
  updated_at = now()
WHERE slug = 'delaware-county-pa';

UPDATE public.community_markets SET
  market_tier = 'growth',
  sync_frequency_hours = 24,
  sort_order = 45,
  city_anchors = ARRAY['Mount Holly', 'Mount Laurel', 'Burlington'],
  city = COALESCE(NULLIF(city, ''), 'Mount Laurel'),
  updated_at = now()
WHERE slug = 'burlington-county-nj';

UPDATE public.community_markets SET
  market_tier = 'growth',
  sync_frequency_hours = 24,
  sort_order = 48,
  city_anchors = ARRAY['Cherry Hill', 'Haddonfield', 'Voorhees'],
  city = COALESCE(NULLIF(city, ''), 'Cherry Hill'),
  updated_at = now()
WHERE slug = 'camden-county-nj';

UPDATE public.community_markets SET
  market_tier = 'growth',
  sync_frequency_hours = 24,
  sort_order = 70,
  city_anchors = ARRAY['Princeton', 'Trenton', 'Hamilton'],
  city = COALESCE(NULLIF(city, ''), 'Princeton'),
  updated_at = now()
WHERE slug = 'mercer-county-nj';

UPDATE public.community_markets SET
  market_tier = 'growth',
  sync_frequency_hours = 24,
  sort_order = 74,
  city_anchors = ARRAY['Bridgewater', 'Somerville'],
  city = COALESCE(NULLIF(city, ''), 'Bridgewater'),
  updated_at = now()
WHERE slug = 'somerset-county-nj';

UPDATE public.community_markets SET
  market_tier = 'growth',
  sync_frequency_hours = 24,
  sort_order = 60,
  city_anchors = ARRAY['Freehold', 'Red Bank', 'Asbury Park'],
  city = COALESCE(NULLIF(city, ''), 'Freehold'),
  updated_at = now()
WHERE slug = 'monmouth-county-nj';

UPDATE public.community_markets SET
  market_tier = 'growth',
  sync_frequency_hours = 24,
  sort_order = 62,
  city_anchors = ARRAY['Toms River', 'Point Pleasant', 'Brick'],
  city = COALESCE(NULLIF(city, ''), 'Toms River'),
  updated_at = now()
WHERE slug = 'ocean-county-nj';

UPDATE public.community_markets SET
  market_tier = 'growth',
  sync_frequency_hours = 24,
  sort_order = 50,
  city_anchors = ARRAY['Deptford', 'Washington Township'],
  city = COALESCE(NULLIF(city, ''), 'Sewell'),
  updated_at = now()
WHERE slug = 'gloucester-county-nj';

UPDATE public.community_markets SET
  market_tier = 'expansion',
  sync_frequency_hours = 60,
  sort_order = 72,
  city_anchors = ARRAY['New Brunswick', 'Edison', 'Metuchen'],
  updated_at = now()
WHERE slug = 'middlesex-county-nj';

UPDATE public.community_markets SET
  market_tier = 'expansion',
  sync_frequency_hours = 60,
  sort_order = 80,
  city_anchors = ARRAY['Paramus', 'Hackensack', 'Fort Lee'],
  updated_at = now()
WHERE slug = 'bergen-county-nj';

UPDATE public.community_markets SET
  market_tier = 'expansion',
  sync_frequency_hours = 60,
  sort_order = 82,
  city_anchors = ARRAY['Montclair', 'West Orange', 'Maplewood'],
  updated_at = now()
WHERE slug = 'essex-county-nj';

UPDATE public.community_markets SET
  market_tier = 'expansion',
  sync_frequency_hours = 60,
  sort_order = 84,
  city_anchors = ARRAY['Jersey City', 'Hoboken', 'Bayonne'],
  updated_at = now()
WHERE slug = 'hudson-county-nj';

UPDATE public.community_markets SET
  market_tier = 'expansion',
  sync_frequency_hours = 60,
  sort_order = 86,
  city_anchors = ARRAY['Westfield', 'Summit', 'Elizabeth'],
  updated_at = now()
WHERE slug = 'union-county-nj';

UPDATE public.community_markets SET
  market_tier = 'expansion',
  sync_frequency_hours = 60,
  sort_order = 88,
  city_anchors = ARRAY['Morristown', 'Madison', 'Parsippany'],
  updated_at = now()
WHERE slug = 'morris-county-nj';

UPDATE public.community_markets SET
  market_tier = 'expansion',
  sync_frequency_hours = 60,
  sort_order = 90,
  city_anchors = ARRAY['Wayne', 'Clifton', 'Passaic'],
  updated_at = now()
WHERE slug = 'passaic-county-nj';

UPDATE public.community_markets SET
  market_tier = 'seasonal',
  sync_frequency_hours = 168,
  sort_order = 42,
  city_anchors = ARRAY['Phillipsburg', 'Washington'],
  updated_at = now()
WHERE slug = 'warren-county-nj';

UPDATE public.community_markets SET
  market_tier = 'seasonal',
  sync_frequency_hours = 168,
  sort_order = 64,
  city_anchors = ARRAY['Egg Harbor Township', 'Atlantic City', 'Ventnor'],
  updated_at = now()
WHERE slug = 'atlantic-county-nj';

UPDATE public.community_markets SET
  market_tier = 'seasonal',
  sync_frequency_hours = 168,
  sort_order = 66,
  city_anchors = ARRAY['Cape May', 'Wildwood', 'Ocean City'],
  updated_at = now()
WHERE slug = 'cape-may-county-nj';

-- Default pet-focused search terms for markets still on older generics
UPDATE public.community_markets
SET
  search_terms = ARRAY[
    'pet events',
    'dog adoption events',
    'pet adoption events',
    'animal rescue events',
    'pet expo',
    'dog festival',
    'pet friendly events',
    'dog walk fundraiser'
  ],
  updated_at = now()
WHERE cardinality(search_terms) = 0
   OR search_terms = ARRAY['pet friendly events', 'dog adoption events', 'pet festivals']
   OR search_terms = ARRAY['pet friendly events', 'dog adoption events', 'pet events']
   OR search_terms = ARRAY['pet friendly events', 'dog friendly events', 'adoption events']
   OR search_terms = ARRAY['pet friendly events', 'dog friendly beach events', 'adoption events']
   OR search_terms = ARRAY['pet friendly events', 'dog friendly beach events', 'pet festivals']
   OR search_terms = ARRAY['pet friendly events', 'dog friendly beach events', 'pet events'];

COMMENT ON COLUMN public.community_markets.market_tier IS
  'Discovery priority: core | growth | expansion | seasonal | paused. Independent of enabled.';
COMMENT ON COLUMN public.community_markets.city_anchors IS
  'Rotating city/search anchors for SerpApi discovery within the market.';
COMMENT ON COLUMN public.community_event_discoveries.pet_relevance_score IS
  '0-100 pet relevance. Admin may override via pet_relevance_override.';
COMMENT ON TABLE public.community_event_discovery_markets IS
  'Many-to-many link so one discovered event can belong to multiple Community Markets.';
