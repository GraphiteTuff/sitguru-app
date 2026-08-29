-- Extend public attendance counts for Attending? Yes / Maybe / No on event cards.
-- Must DROP first: Postgres cannot change OUT/return columns via CREATE OR REPLACE.
DROP FUNCTION IF EXISTS public.get_community_event_attendance_counts(uuid);

CREATE FUNCTION public.get_community_event_attendance_counts(p_event_id uuid)
RETURNS TABLE (
  pet_parents bigint,
  gurus bigint,
  ambassadors bigint,
  total_going bigint,
  total_maybe bigint,
  total_no bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*) FILTER (
      WHERE a.attendance_role = 'pet_parent' AND a.status = 'going'
    ) AS pet_parents,
    COUNT(*) FILTER (
      WHERE a.attendance_role = 'guru' AND a.status = 'going'
    ) AS gurus,
    COUNT(*) FILTER (
      WHERE a.attendance_role = 'ambassador' AND a.status = 'going'
    ) AS ambassadors,
    COUNT(*) FILTER (WHERE a.status = 'going') AS total_going,
    COUNT(*) FILTER (WHERE a.status = 'interested') AS total_maybe,
    COUNT(*) FILTER (WHERE a.status = 'cancelled') AS total_no
  FROM public.community_event_attendance a
  JOIN public.community_events e ON e.id = a.event_id
  WHERE a.event_id = p_event_id
    AND e.status = 'published'
    AND e.cancelled_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION public.get_community_event_attendance_counts(uuid) TO anon, authenticated;

COMMENT ON FUNCTION public.get_community_event_attendance_counts(uuid) IS
  'Public Yes/Maybe/No RSVP aggregates for published community events.';
