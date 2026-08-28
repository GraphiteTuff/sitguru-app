-- Phase 3: Community Events attendance RLS, recurring fields, and count helpers.

-- Recurring event columns
ALTER TABLE public.community_events
  ADD COLUMN IF NOT EXISTS series_id uuid,
  ADD COLUMN IF NOT EXISTS parent_event_id uuid,
  ADD COLUMN IF NOT EXISTS recurrence_rule text DEFAULT 'none'
    CHECK (recurrence_rule IN ('none', 'weekly', 'biweekly', 'monthly')),
  ADD COLUMN IF NOT EXISTS recurrence_count integer DEFAULT 1
    CHECK (recurrence_count >= 1 AND recurrence_count <= 26),
  ADD COLUMN IF NOT EXISTS is_series_parent boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS community_events_series_id_idx
  ON public.community_events (series_id)
  WHERE series_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'community_events_parent_event_id_fkey'
  ) THEN
    ALTER TABLE public.community_events
      ADD CONSTRAINT community_events_parent_event_id_fkey
      FOREIGN KEY (parent_event_id) REFERENCES public.community_events(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'parent_event_id FK skipped: %', SQLERRM;
END $$;

-- Attendance: allow authenticated users to manage their own RSVP
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'community_event_attendance'
      AND policyname = 'community_event_attendance_select_own'
  ) THEN
    CREATE POLICY community_event_attendance_select_own
      ON public.community_event_attendance
      FOR SELECT TO authenticated
      USING (user_id = auth.uid() OR public.is_sitguru_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'community_event_attendance'
      AND policyname = 'community_event_attendance_insert_own'
  ) THEN
    CREATE POLICY community_event_attendance_insert_own
      ON public.community_event_attendance
      FOR INSERT TO authenticated
      WITH CHECK (
        user_id = auth.uid()
        AND attendance_role IN ('pet_parent', 'guru', 'ambassador')
        AND status IN ('going', 'interested', 'cancelled')
        AND EXISTS (
          SELECT 1
          FROM public.community_events e
          WHERE e.id = event_id
            AND e.status = 'published'
            AND e.cancelled_at IS NULL
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'community_event_attendance'
      AND policyname = 'community_event_attendance_update_own'
  ) THEN
    CREATE POLICY community_event_attendance_update_own
      ON public.community_event_attendance
      FOR UPDATE TO authenticated
      USING (user_id = auth.uid() OR public.is_sitguru_admin())
      WITH CHECK (user_id = auth.uid() OR public.is_sitguru_admin());
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'attendance user RLS skipped: %', SQLERRM;
END $$;

-- Public aggregate counts for published events (security definer)
CREATE OR REPLACE FUNCTION public.get_community_event_attendance_counts(p_event_id uuid)
RETURNS TABLE (
  pet_parents bigint,
  gurus bigint,
  ambassadors bigint,
  total_going bigint
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
    COUNT(*) FILTER (WHERE a.status = 'going') AS total_going
  FROM public.community_event_attendance a
  JOIN public.community_events e ON e.id = a.event_id
  WHERE a.event_id = p_event_id
    AND e.status = 'published'
    AND e.cancelled_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION public.get_community_event_attendance_counts(uuid) TO anon, authenticated;

COMMENT ON FUNCTION public.get_community_event_attendance_counts(uuid) IS
  'Public attendance counts for published Community Events (I''m Going).';
