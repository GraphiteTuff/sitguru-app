-- Backfill missing city/state from known ZIP codes so location displays
-- (admin, public cards, maps) show City, ST instead of ZIP-only.

WITH zip_map(zip, city, state, lat, lng) AS (
  VALUES
    ('18210', 'Albrightsville', 'PA', 40.9748::float8, -75.5842::float8),
    ('18951', 'Quakertown', 'PA', 40.4411::float8, -75.3507::float8),
    ('17702', 'Williamsport', 'PA', 41.1943::float8, -77.0547::float8),
    ('95616', 'Davis', 'CA', 38.5538::float8, -121.7418::float8),
    ('32084', 'Saint Augustine', 'FL', 29.9175::float8, -81.3668::float8),
    ('23323', 'Chesapeake', 'VA', 36.7634::float8, -76.3397::float8)
)
UPDATE gurus g
SET
  city = COALESCE(NULLIF(TRIM(g.city), ''), z.city),
  state = COALESCE(NULLIF(TRIM(g.state), ''), z.state),
  service_city = COALESCE(NULLIF(TRIM(g.service_city), ''), z.city),
  service_state = COALESCE(NULLIF(TRIM(g.service_state), ''), z.state),
  service_zip = COALESCE(NULLIF(TRIM(g.service_zip), ''), z.zip),
  service_latitude = COALESCE(g.service_latitude, z.lat),
  service_longitude = COALESCE(g.service_longitude, z.lng)
FROM zip_map z
WHERE COALESCE(
    NULLIF(TRIM(g.zip_code), ''),
    NULLIF(TRIM(g.service_zip), ''),
    NULLIF(TRIM(COALESCE(g.service_zip_code::text, '')), '')
  ) = z.zip
  AND (
    COALESCE(NULLIF(TRIM(g.city), ''), NULLIF(TRIM(g.service_city), '')) IS NULL
    OR COALESCE(NULLIF(TRIM(g.state), ''), NULLIF(TRIM(g.service_state), '')) IS NULL
  );

WITH zip_map(zip, city, state, lat, lng) AS (
  VALUES
    ('18210', 'Albrightsville', 'PA', 40.9748::float8, -75.5842::float8),
    ('18951', 'Quakertown', 'PA', 40.4411::float8, -75.3507::float8),
    ('17702', 'Williamsport', 'PA', 41.1943::float8, -77.0547::float8),
    ('95616', 'Davis', 'CA', 38.5538::float8, -121.7418::float8),
    ('32084', 'Saint Augustine', 'FL', 29.9175::float8, -81.3668::float8),
    ('23323', 'Chesapeake', 'VA', 36.7634::float8, -76.3397::float8)
)
UPDATE profiles p
SET
  city = COALESCE(NULLIF(TRIM(p.city), ''), z.city),
  state = COALESCE(NULLIF(TRIM(p.state), ''), z.state),
  service_city = COALESCE(NULLIF(TRIM(p.service_city), ''), z.city),
  service_state = COALESCE(NULLIF(TRIM(p.service_state), ''), z.state),
  service_zip = COALESCE(NULLIF(TRIM(p.service_zip), ''), z.zip),
  service_latitude = COALESCE(p.service_latitude, z.lat),
  service_longitude = COALESCE(p.service_longitude, z.lng)
FROM zip_map z
WHERE COALESCE(NULLIF(TRIM(p.zip_code), ''), NULLIF(TRIM(p.service_zip), '')) = z.zip
  AND (
    COALESCE(NULLIF(TRIM(p.city), ''), NULLIF(TRIM(p.service_city), '')) IS NULL
    OR COALESCE(NULLIF(TRIM(p.state), ''), NULLIF(TRIM(p.service_state), '')) IS NULL
  );
