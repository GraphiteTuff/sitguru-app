-- Nationwide searchable geographies (counties) for Community / Find Care suggest+resolve.
-- SerpApi discovery stays gated by community_markets.enabled + market_tier — NOT by
-- searchable alone. discovery_enabled / homepage_eligible default false nationwide.

CREATE TABLE IF NOT EXISTS public.community_geographies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  geoid text NOT NULL,
  fips text NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  county_name text NOT NULL,
  state text NOT NULL,
  state_fips text,
  latitude double precision,
  longitude double precision,
  aliases text[] NOT NULL DEFAULT '{}'::text[],
  searchable boolean NOT NULL DEFAULT true,
  discovery_enabled boolean NOT NULL DEFAULT false,
  homepage_eligible boolean NOT NULL DEFAULT false,
  market_id uuid REFERENCES public.community_markets(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 1000,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_geographies_geoid_uidx UNIQUE (geoid),
  CONSTRAINT community_geographies_slug_uidx UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS community_geographies_searchable_name_idx
  ON public.community_geographies (searchable, state, county_name);

CREATE INDEX IF NOT EXISTS community_geographies_slug_idx
  ON public.community_geographies (slug);

CREATE INDEX IF NOT EXISTS community_geographies_market_id_idx
  ON public.community_geographies (market_id)
  WHERE market_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS community_geographies_homepage_eligible_idx
  ON public.community_geographies (homepage_eligible)
  WHERE homepage_eligible = true;

CREATE INDEX IF NOT EXISTS community_geographies_discovery_enabled_idx
  ON public.community_geographies (discovery_enabled)
  WHERE discovery_enabled = true;

-- Case-insensitive prefix / contains search for suggest API
CREATE INDEX IF NOT EXISTS community_geographies_county_name_lower_idx
  ON public.community_geographies (lower(county_name) text_pattern_ops);

CREATE INDEX IF NOT EXISTS community_geographies_name_lower_idx
  ON public.community_geographies (lower(name) text_pattern_ops);

ALTER TABLE public.community_geographies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_geographies_public_read ON public.community_geographies;
CREATE POLICY community_geographies_public_read
  ON public.community_geographies
  FOR SELECT
  TO anon, authenticated
  USING (searchable = true);

COMMENT ON TABLE public.community_geographies IS
  'Nationwide county catalog for search suggest/resolve. searchable ≠ discovery_enabled.';
COMMENT ON COLUMN public.community_geographies.searchable IS
  'Appears in /api/search/suggest when true.';
COMMENT ON COLUMN public.community_geographies.discovery_enabled IS
  'Eligible for SerpApi sync linkage; keep false outside intentional markets.';
COMMENT ON COLUMN public.community_geographies.homepage_eligible IS
  'Discoveries from linked markets may appear on homepage featured surfaces.';
