-- SitGuru Community Events — single source of truth for partner events across web + mobile.

CREATE TABLE IF NOT EXISTS public.community_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  created_by uuid,

  title text NOT NULL,
  slug text NOT NULL,
  short_description text,
  description text,

  event_type text DEFAULT 'community',
  categories text[] DEFAULT '{}'::text[],

  image_original_url text,
  image_hero_url text,
  image_card_url text,
  image_mobile_url text,
  social_square_url text,
  social_story_url text,
  social_landscape_url text,
  image_storage_bucket text,
  image_storage_path text,

  start_at timestamptz NOT NULL,
  end_at timestamptz,
  timezone text DEFAULT 'America/Denver',

  venue_name text,
  address_line_1 text,
  address_line_2 text,
  city text,
  state text,
  postal_code text,
  country text DEFAULT 'US',
  latitude double precision,
  longitude double precision,

  pet_friendly boolean NOT NULL DEFAULT true,
  family_friendly boolean NOT NULL DEFAULT false,
  outdoor boolean NOT NULL DEFAULT false,
  is_free boolean NOT NULL DEFAULT true,
  registration_required boolean NOT NULL DEFAULT false,

  ticket_url text,
  event_url text,
  contact_email text,

  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft',
      'pending_review',
      'changes_requested',
      'approved',
      'published',
      'cancelled',
      'completed',
      'archived'
    )),

  featured_status text NOT NULL DEFAULT 'none'
    CHECK (featured_status IN ('none', 'homepage', 'community', 'market')),
  featured_priority integer NOT NULL DEFAULT 0,
  featured_start_at timestamptz,
  featured_end_at timestamptz,
  featured_market_city text,
  featured_market_state text,

  moderation_note text,
  moderated_by uuid,
  moderated_at timestamptz,

  published_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS community_events_slug_uidx
  ON public.community_events (slug);

CREATE INDEX IF NOT EXISTS community_events_partner_id_idx
  ON public.community_events (partner_id);

CREATE INDEX IF NOT EXISTS community_events_status_idx
  ON public.community_events (status);

CREATE INDEX IF NOT EXISTS community_events_start_at_idx
  ON public.community_events (start_at);

CREATE INDEX IF NOT EXISTS community_events_published_idx
  ON public.community_events (status, start_at)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS community_events_featured_idx
  ON public.community_events (featured_status, featured_priority, featured_start_at)
  WHERE featured_status <> 'none';

-- Best-effort FK to partners
DO $$
BEGIN
  IF to_regclass('public.partners') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'community_events_partner_id_fkey'
     ) THEN
    ALTER TABLE public.community_events
      ADD CONSTRAINT community_events_partner_id_fkey
      FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'community_events partner FK skipped: %', SQLERRM;
END $$;

-- Future V2 attendance (optional extension point — not required for V1 reads)
CREATE TABLE IF NOT EXISTS public.community_event_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.community_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  attendance_role text NOT NULL DEFAULT 'pet_parent'
    CHECK (attendance_role IN ('pet_parent', 'guru', 'ambassador')),
  status text NOT NULL DEFAULT 'going'
    CHECK (status IN ('going', 'interested', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS community_event_attendance_event_idx
  ON public.community_event_attendance (event_id);

ALTER TABLE public.community_event_attendance ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.community_events IS
  'SitGuru Community Events — one record, multiple presentations (web, partner dashboard, admin, mobile).';

COMMENT ON TABLE public.community_event_attendance IS
  'V2 extension point for I''m Going / attendance counts. Not used in V1 UI.';

-- Admin helper (reuse pattern from chat insights when function already exists)
CREATE OR REPLACE FUNCTION public.is_sitguru_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND lower(trim(ur.role::text)) IN (
        'admin', 'founder', 'owner', 'super_admin', 'super_user',
        'operations', 'operations_admin', 'marketing_admin', 'partner_admin',
        'support_admin', 'moderator', 'trust_safety_admin'
      )
  )
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND lower(trim(coalesce(p.role::text, ''))) IN (
        'admin', 'founder', 'owner', 'super_admin', 'super_user',
        'operations', 'operations_admin', 'marketing_admin', 'partner_admin',
        'support_admin', 'moderator', 'trust_safety_admin'
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_community_event_partner_owner(p_partner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.partners p
    WHERE p.id = p_partner_id
      AND p.owner_user_id = auth.uid()
      AND coalesce(lower(trim(p.status::text)), 'active') IN ('active', 'paused')
  );
$$;

CREATE OR REPLACE FUNCTION public.community_events_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS community_events_touch_updated_at ON public.community_events;
CREATE TRIGGER community_events_touch_updated_at
  BEFORE UPDATE ON public.community_events
  FOR EACH ROW
  EXECUTE FUNCTION public.community_events_touch_updated_at();

-- Partners cannot self-feature or self-publish via direct client updates
CREATE OR REPLACE FUNCTION public.community_events_protect_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF public.is_sitguru_admin() THEN
    RETURN NEW;
  END IF;

  IF NOT public.is_community_event_partner_owner(OLD.partner_id) THEN
    RETURN NEW;
  END IF;

  NEW.featured_status := OLD.featured_status;
  NEW.featured_priority := OLD.featured_priority;
  NEW.featured_start_at := OLD.featured_start_at;
  NEW.featured_end_at := OLD.featured_end_at;
  NEW.featured_market_city := OLD.featured_market_city;
  NEW.featured_market_state := OLD.featured_market_state;
  NEW.published_at := OLD.published_at;
  NEW.moderated_by := OLD.moderated_by;
  NEW.moderated_at := OLD.moderated_at;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status NOT IN ('draft', 'pending_review', 'cancelled') THEN
      NEW.status := OLD.status;
    END IF;

    IF NEW.status = 'published' AND OLD.status <> 'published' THEN
      NEW.status := OLD.status;
    END IF;
  END IF;

  IF NEW.moderation_note IS DISTINCT FROM OLD.moderation_note
     AND OLD.status = 'changes_requested' THEN
    -- Partner may clear note when resubmitting
    NULL;
  ELSIF NEW.moderation_note IS DISTINCT FROM OLD.moderation_note THEN
    NEW.moderation_note := OLD.moderation_note;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS community_events_protect_admin_fields ON public.community_events;
CREATE TRIGGER community_events_protect_admin_fields
  BEFORE UPDATE ON public.community_events
  FOR EACH ROW
  EXECUTE FUNCTION public.community_events_protect_admin_fields();

ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'community_events'
      AND policyname = 'community_events_public_select'
  ) THEN
    CREATE POLICY community_events_public_select ON public.community_events
      FOR SELECT
      USING (
        status = 'published'
        AND published_at IS NOT NULL
        AND cancelled_at IS NULL
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'community_events'
      AND policyname = 'community_events_partner_select'
  ) THEN
    CREATE POLICY community_events_partner_select ON public.community_events
      FOR SELECT TO authenticated
      USING (public.is_community_event_partner_owner(partner_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'community_events'
      AND policyname = 'community_events_partner_insert'
  ) THEN
    CREATE POLICY community_events_partner_insert ON public.community_events
      FOR INSERT TO authenticated
      WITH CHECK (
        public.is_community_event_partner_owner(partner_id)
        AND created_by = auth.uid()
        AND status IN ('draft', 'pending_review')
        AND featured_status = 'none'
        AND featured_priority = 0
        AND published_at IS NULL
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'community_events'
      AND policyname = 'community_events_partner_update'
  ) THEN
    CREATE POLICY community_events_partner_update ON public.community_events
      FOR UPDATE TO authenticated
      USING (public.is_community_event_partner_owner(partner_id))
      WITH CHECK (public.is_community_event_partner_owner(partner_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'community_events'
      AND policyname = 'community_events_partner_delete'
  ) THEN
    CREATE POLICY community_events_partner_delete ON public.community_events
      FOR DELETE TO authenticated
      USING (
        public.is_community_event_partner_owner(partner_id)
        AND status = 'draft'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'community_events'
      AND policyname = 'community_events_admin_all'
  ) THEN
    CREATE POLICY community_events_admin_all ON public.community_events
      FOR ALL TO authenticated
      USING (public.is_sitguru_admin())
      WITH CHECK (public.is_sitguru_admin());
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'community_events RLS policies skipped: %', SQLERRM;
END $$;

-- Attendance RLS (V2-ready, locked down for V1)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'community_event_attendance'
      AND policyname = 'community_event_attendance_admin'
  ) THEN
    CREATE POLICY community_event_attendance_admin ON public.community_event_attendance
      FOR ALL TO authenticated
      USING (public.is_sitguru_admin())
      WITH CHECK (public.is_sitguru_admin());
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'community_event_attendance RLS skipped: %', SQLERRM;
END $$;

-- Storage bucket for event images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-media',
  'event-media',
  true,
  8388608,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'event_media_public_read'
  ) THEN
    CREATE POLICY event_media_public_read ON storage.objects
      FOR SELECT
      USING (bucket_id = 'event-media');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'event_media_partner_write'
  ) THEN
    CREATE POLICY event_media_partner_write ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'event-media'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'event_media_partner_update'
  ) THEN
    CREATE POLICY event_media_partner_update ON storage.objects
      FOR UPDATE TO authenticated
      USING (
        bucket_id = 'event-media'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'event_media_partner_delete'
  ) THEN
    CREATE POLICY event_media_partner_delete ON storage.objects
      FOR DELETE TO authenticated
      USING (
        bucket_id = 'event-media'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'event-media storage policies skipped: %', SQLERRM;
END $$;
