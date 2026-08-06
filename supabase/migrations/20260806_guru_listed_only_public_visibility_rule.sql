-- Publish Gurus stuck in the Hazel/Kayla public-profile 404 pattern when safe:
-- has a public slug, booking_status not_listed, visibility flags false,
-- not private/rejected, AND service_city + service_state present
-- (required by enforce_new_guru_service_area_required).
-- Sync location from profiles first when gurus service_* are empty.
-- Auto-maintain via trigger for future rows that meet the same rule.

-- 1) Prefer profiles.service_* / city/state onto gurus when empty.
UPDATE public.gurus AS g
SET
  service_city = coalesce(
    nullif(btrim(g.service_city), ''),
    nullif(btrim(p.service_city), ''),
    nullif(btrim(p.city), '')
  ),
  service_state = coalesce(
    nullif(btrim(g.service_state), ''),
    nullif(btrim(p.service_state), ''),
    nullif(btrim(p.state), '')
  ),
  service_latitude = coalesce(g.service_latitude, p.service_latitude),
  service_longitude = coalesce(g.service_longitude, p.service_longitude)
FROM public.profiles AS p
WHERE (
    g.profile_id = p.id
    OR g.user_id = p.id
  )
  AND nullif(btrim(coalesce(g.slug, '')), '') IS NOT NULL
  AND coalesce(g.booking_status, 'not_listed') = 'not_listed'
  AND (
    nullif(btrim(coalesce(g.service_city, '')), '') IS NULL
    OR nullif(btrim(coalesce(g.service_state, '')), '') IS NULL
    OR g.service_latitude IS NULL
    OR g.service_longitude IS NULL
  );

-- 2) Publish only rows that already satisfy the service-area gate.
UPDATE public.gurus
SET
  is_public = true,
  is_public_visible = true,
  is_active = true,
  public_status = 'visible',
  booking_status = 'listed_only'
WHERE nullif(btrim(coalesce(slug, '')), '') IS NOT NULL
  AND coalesce(is_public, false) = false
  AND coalesce(is_public_visible, false) = false
  AND coalesce(booking_status, 'not_listed') = 'not_listed'
  AND nullif(btrim(coalesce(service_city, '')), '') IS NOT NULL
  AND nullif(btrim(coalesce(service_state, '')), '') IS NOT NULL
  AND coalesce(lower(public_status), '') NOT IN ('private', 'hidden')
  AND coalesce(lower(status), '') NOT IN (
    'rejected',
    'suspended',
    'deleted',
    'archived',
    'inactive',
    'paused'
  )
  AND coalesce(lower(application_status), '') NOT IN (
    'rejected',
    'suspended',
    'not_approved'
  );

CREATE OR REPLACE FUNCTION public.apply_guru_listed_only_public_visibility()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF nullif(btrim(coalesce(NEW.slug, '')), '') IS NULL THEN
    RETURN NEW;
  END IF;

  IF coalesce(lower(NEW.public_status), '') IN ('private', 'hidden') THEN
    RETURN NEW;
  END IF;

  IF coalesce(lower(NEW.status), '') IN (
    'rejected',
    'suspended',
    'deleted',
    'archived',
    'inactive',
    'paused'
  ) THEN
    RETURN NEW;
  END IF;

  IF coalesce(lower(NEW.application_status), '') IN (
    'rejected',
    'suspended',
    'not_approved'
  ) THEN
    RETURN NEW;
  END IF;

  -- Service area is required before listed/public flags (DB enforce trigger).
  IF nullif(btrim(coalesce(NEW.service_city, '')), '') IS NULL
     OR nullif(btrim(coalesce(NEW.service_state, '')), '') IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only auto-lift the Hazel/Kayla 404 pattern (slug + not_listed + hidden flags).
  IF coalesce(NEW.booking_status, 'not_listed') = 'not_listed'
     AND coalesce(NEW.is_public, false) = false
     AND coalesce(NEW.is_public_visible, false) = false
  THEN
    NEW.is_public := true;
    NEW.is_public_visible := true;
    NEW.is_active := true;
    NEW.public_status := coalesce(nullif(btrim(NEW.public_status), ''), 'visible');
    NEW.booking_status := 'listed_only';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guru_listed_only_public_visibility ON public.gurus;

CREATE TRIGGER trg_guru_listed_only_public_visibility
BEFORE INSERT OR UPDATE OF slug, is_public, is_public_visible, booking_status, public_status, status, application_status, service_city, service_state
ON public.gurus
FOR EACH ROW
EXECUTE FUNCTION public.apply_guru_listed_only_public_visibility();

COMMENT ON FUNCTION public.apply_guru_listed_only_public_visibility() IS
  'Auto-publishes slug+not_listed Gurus with service area as listed_only/visible so /guru/[slug] does not 404 (Hazel/Kayla rule).';
