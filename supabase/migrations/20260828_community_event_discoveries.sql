-- Daily Google-discovered pet events for Bucks & Montgomery County homepage previews.

CREATE TABLE IF NOT EXISTS public.community_event_discoveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text NOT NULL,
  source text NOT NULL DEFAULT 'google',
  county text NOT NULL CHECK (county IN ('bucks', 'montgomery')),
  search_query text,
  title text NOT NULL,
  short_description text,
  venue_name text,
  address_line text,
  city text,
  state text DEFAULT 'PA',
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  timezone text DEFAULT 'America/New_York',
  image_url text,
  event_url text NOT NULL,
  is_free boolean NOT NULL DEFAULT true,
  pet_friendly boolean NOT NULL DEFAULT true,
  raw_payload jsonb,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_event_discoveries_source_external_uidx
    UNIQUE (source, external_id)
);

CREATE INDEX IF NOT EXISTS community_event_discoveries_start_at_idx
  ON public.community_event_discoveries (start_at);

CREATE INDEX IF NOT EXISTS community_event_discoveries_county_start_idx
  ON public.community_event_discoveries (county, start_at);

ALTER TABLE public.community_event_discoveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_event_discoveries_public_read
  ON public.community_event_discoveries;

CREATE POLICY community_event_discoveries_public_read
  ON public.community_event_discoveries
  FOR SELECT
  TO anon, authenticated
  USING (start_at >= (now() - interval '1 day'));

COMMENT ON TABLE public.community_event_discoveries IS
  'External pet events synced daily from Google (SerpAPI) for Bucks & Montgomery County homepage previews.';
