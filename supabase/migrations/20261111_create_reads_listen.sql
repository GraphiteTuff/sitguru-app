-- SitGuru Reads & Listen — curated books, magazines, podcasts, videos, authors,
-- team picks, partnerships, and editorial workflow (Intern → Manager → Admin).

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Taxonomy
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reads_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  audience text[] NOT NULL DEFAULT '{}'::text[],
  display_order integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Core content
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reads_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  title text NOT NULL,
  subtitle text,
  description text,
  editorial_summary text,
  why_recommended text,
  content_type text NOT NULL
    CHECK (content_type IN (
      'book', 'magazine', 'podcast', 'video', 'author', 'expert', 'publication'
    )),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft', 'submitted', 'changes_requested', 'approved',
      'scheduled', 'published', 'archived'
    )),
  visibility text NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'unlisted', 'private')),
  featured boolean NOT NULL DEFAULT false,
  feature_type text
    CHECK (feature_type IS NULL OR feature_type IN (
      'book_of_the_month', 'magazine_spotlight', 'featured_podcast',
      'featured_author', 'featured_video', 'homepage', 'none'
    )),
  disclosure_label text NOT NULL DEFAULT 'sitguru_recommended'
    CHECK (disclosure_label IN (
      'sitguru_recommended', 'partner_feature', 'sponsored', 'none'
    )),
  image_url text,
  thumbnail_url text,
  external_url text,
  affiliate_disclosure text,
  audience text[] NOT NULL DEFAULT '{}'::text[],
  tags text[] NOT NULL DEFAULT '{}'::text[],
  created_by uuid,
  assigned_manager_id uuid,
  assigned_intern_id uuid,
  published_at timestamptz,
  scheduled_at timestamptz,
  archived_at timestamptz,
  review_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  search_document tsvector,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_type, slug)
);

CREATE INDEX IF NOT EXISTS reads_content_status_idx
  ON public.reads_content (status);
CREATE INDEX IF NOT EXISTS reads_content_type_status_idx
  ON public.reads_content (content_type, status);
CREATE INDEX IF NOT EXISTS reads_content_featured_idx
  ON public.reads_content (featured, feature_type)
  WHERE featured = true;
CREATE INDEX IF NOT EXISTS reads_content_published_idx
  ON public.reads_content (published_at DESC)
  WHERE status = 'published';
CREATE INDEX IF NOT EXISTS reads_content_created_by_idx
  ON public.reads_content (created_by);
CREATE INDEX IF NOT EXISTS reads_content_search_idx
  ON public.reads_content USING gin (search_document);

CREATE TABLE IF NOT EXISTS public.reads_books (
  content_id uuid PRIMARY KEY REFERENCES public.reads_content(id) ON DELETE CASCADE,
  author_name text,
  publisher text,
  publication_date date,
  isbn text,
  page_count integer,
  language text DEFAULT 'en',
  cover_image_url text,
  purchase_url text
);

CREATE TABLE IF NOT EXISTS public.reads_publications (
  content_id uuid PRIMARY KEY REFERENCES public.reads_content(id) ON DELETE CASCADE,
  publication_name text NOT NULL,
  publication_type text
    CHECK (publication_type IS NULL OR publication_type IN (
      'dog', 'cat', 'health', 'training', 'rescue', 'industry', 'general'
    )),
  logo_url text,
  website_url text,
  issue_label text,
  issue_date date,
  partnership_status text NOT NULL DEFAULT 'none'
    CHECK (partnership_status IN (
      'none', 'prospect', 'active', 'paused', 'ended'
    ))
);

CREATE TABLE IF NOT EXISTS public.reads_podcasts (
  content_id uuid PRIMARY KEY REFERENCES public.reads_content(id) ON DELETE CASCADE,
  show_name text,
  guest_name text,
  guest_title text,
  episode_artwork_url text,
  duration_seconds integer,
  audio_embed_url text,
  youtube_video_id text,
  publish_date date,
  is_sitguru_original boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.reads_videos (
  content_id uuid PRIMARY KEY REFERENCES public.reads_content(id) ON DELETE CASCADE,
  youtube_video_id text,
  youtube_channel_id text,
  youtube_url text,
  duration_seconds integer,
  publish_date date,
  guest_name text,
  import_source text NOT NULL DEFAULT 'manual'
    CHECK (import_source IN ('manual', 'api', 'seed')),
  import_status text NOT NULL DEFAULT 'ready'
    CHECK (import_status IN ('needs_review', 'ready', 'rejected'))
);

CREATE TABLE IF NOT EXISTS public.reads_people (
  content_id uuid PRIMARY KEY REFERENCES public.reads_content(id) ON DELETE CASCADE,
  person_type text NOT NULL DEFAULT 'author'
    CHECK (person_type IN (
      'author', 'veterinarian', 'trainer', 'behaviorist', 'journalist',
      'podcaster', 'publisher_representative', 'rescue_expert',
      'pet_industry_expert', 'guest'
    )),
  credentials text,
  organization text,
  biography text,
  website_url text,
  headshot_url text,
  social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  partnership_status text NOT NULL DEFAULT 'none'
    CHECK (partnership_status IN (
      'none', 'prospect', 'active', 'paused', 'ended'
    )),
  upcoming_appearances text
);

CREATE TABLE IF NOT EXISTS public.reads_content_topics (
  content_id uuid NOT NULL REFERENCES public.reads_content(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.reads_topics(id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, topic_id)
);

CREATE TABLE IF NOT EXISTS public.reads_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_content_id uuid NOT NULL REFERENCES public.reads_content(id) ON DELETE CASCADE,
  to_content_id uuid NOT NULL REFERENCES public.reads_content(id) ON DELETE CASCADE,
  relationship_type text NOT NULL DEFAULT 'related'
    CHECK (relationship_type IN (
      'related', 'author_of', 'guest_on', 'mentions', 'companion',
      'based_on', 'sitguru_guide'
    )),
  display_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_content_id, to_content_id, relationship_type),
  CHECK (from_content_id <> to_content_id)
);

CREATE INDEX IF NOT EXISTS reads_relationships_from_idx
  ON public.reads_relationships (from_content_id);
CREATE INDEX IF NOT EXISTS reads_relationships_to_idx
  ON public.reads_relationships (to_content_id);

-- ---------------------------------------------------------------------------
-- Team picks (database-driven; never hard-code recommendations in JSX)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reads_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  slug text NOT NULL UNIQUE,
  full_name text NOT NULL,
  role_label text NOT NULL,
  avatar_url text,
  display_order integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reads_team_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid NOT NULL REFERENCES public.reads_team_members(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES public.reads_content(id) ON DELETE CASCADE,
  recommendation_type text NOT NULL DEFAULT 'favorite'
    CHECK (recommendation_type IN (
      'favorite_book', 'favorite_magazine', 'favorite_podcast',
      'favorite_video', 'additional'
    )),
  quote text NOT NULL,
  display_order integer NOT NULL DEFAULT 100,
  featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  published_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reads_team_picks_member_idx
  ON public.reads_team_picks (team_member_id, is_active);
CREATE INDEX IF NOT EXISTS reads_team_picks_content_idx
  ON public.reads_team_picks (content_id);

-- ---------------------------------------------------------------------------
-- Partnership CRM
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reads_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  organization text,
  partner_type text NOT NULL DEFAULT 'other'
    CHECK (partner_type IN (
      'author', 'publisher', 'magazine', 'podcast', 'veterinarian',
      'trainer', 'behaviorist', 'pet_expert', 'rescue_nonprofit', 'other'
    )),
  email text,
  phone text,
  website text,
  social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN (
      'new', 'under_review', 'contacted', 'interested', 'interview_planned',
      'content_planned', 'content_created', 'published', 'active_partner',
      'declined', 'archived'
    )),
  topics text[] NOT NULL DEFAULT '{}'::text[],
  notes_private text,
  escalated_to_admin boolean NOT NULL DEFAULT false,
  escalation_reason text,
  assigned_manager_id uuid,
  content_id uuid REFERENCES public.reads_content(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reads_partners_status_idx
  ON public.reads_partners (status);
CREATE INDEX IF NOT EXISTS reads_partners_escalated_idx
  ON public.reads_partners (escalated_to_admin)
  WHERE escalated_to_admin = true;

CREATE TABLE IF NOT EXISTS public.reads_partner_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES public.reads_partners(id) ON DELETE SET NULL,
  name text NOT NULL,
  organization text,
  email text NOT NULL,
  phone text,
  partner_type text NOT NULL,
  website text,
  social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  work_title text,
  description text,
  topics text[] NOT NULL DEFAULT '{}'::text[],
  publication_date text,
  publisher text,
  isbn text,
  interested_interview boolean NOT NULL DEFAULT false,
  interested_giveaway boolean NOT NULL DEFAULT false,
  review_copy_available boolean NOT NULL DEFAULT false,
  interested_social boolean NOT NULL DEFAULT false,
  interested_partnership boolean NOT NULL DEFAULT false,
  message text,
  permission_agreed boolean NOT NULL DEFAULT false,
  privacy_acknowledged boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'new',
  ip_hash text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reads_partner_submissions_email_idx
  ON public.reads_partner_submissions (lower(email));
CREATE INDEX IF NOT EXISTS reads_partner_submissions_created_idx
  ON public.reads_partner_submissions (created_at DESC);

CREATE TABLE IF NOT EXISTS public.reads_partner_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.reads_partners(id) ON DELETE CASCADE,
  actor_id uuid,
  actor_email text,
  activity_type text NOT NULL,
  note text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Editorial workflow audit
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reads_content_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES public.reads_content(id) ON DELETE CASCADE,
  reviewer_id uuid,
  reviewer_email text,
  action text NOT NULL
    CHECK (action IN (
      'submit', 'request_changes', 'approve', 'schedule',
      'publish', 'archive', 'restore', 'feature', 'unfeature', 'override'
    )),
  note text,
  from_status text,
  to_status text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reads_content_reviews_content_idx
  ON public.reads_content_reviews (content_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.reads_content_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES public.reads_content(id) ON DELETE CASCADE,
  actor_id uuid,
  actor_email text,
  from_status text,
  to_status text NOT NULL,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reads_content_status_history_idx
  ON public.reads_content_status_history (content_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.reads_analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  content_id uuid REFERENCES public.reads_content(id) ON DELETE SET NULL,
  content_type text,
  session_id text,
  user_id uuid,
  page_path text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reads_analytics_events_name_idx
  ON public.reads_analytics_events (event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS reads_analytics_events_content_idx
  ON public.reads_analytics_events (content_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Search document maintenance
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reads_content_refresh_search()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_document :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.subtitle, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.editorial_summary, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'B');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reads_content_refresh_search ON public.reads_content;
CREATE TRIGGER reads_content_refresh_search
  BEFORE INSERT OR UPDATE OF title, subtitle, description, editorial_summary, tags
  ON public.reads_content
  FOR EACH ROW
  EXECUTE FUNCTION public.reads_content_refresh_search();

CREATE OR REPLACE FUNCTION public.reads_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reads_topics_touch ON public.reads_topics;
CREATE TRIGGER reads_topics_touch
  BEFORE UPDATE ON public.reads_topics
  FOR EACH ROW EXECUTE FUNCTION public.reads_touch_updated_at();

DROP TRIGGER IF EXISTS reads_team_members_touch ON public.reads_team_members;
CREATE TRIGGER reads_team_members_touch
  BEFORE UPDATE ON public.reads_team_members
  FOR EACH ROW EXECUTE FUNCTION public.reads_touch_updated_at();

DROP TRIGGER IF EXISTS reads_team_picks_touch ON public.reads_team_picks;
CREATE TRIGGER reads_team_picks_touch
  BEFORE UPDATE ON public.reads_team_picks
  FOR EACH ROW EXECUTE FUNCTION public.reads_touch_updated_at();

DROP TRIGGER IF EXISTS reads_partners_touch ON public.reads_partners;
CREATE TRIGGER reads_partners_touch
  BEFORE UPDATE ON public.reads_partners
  FOR EACH ROW EXECUTE FUNCTION public.reads_touch_updated_at();

-- ---------------------------------------------------------------------------
-- Roles for Manager (Ava) and Intern (Ryan / Lola) — extends HQ access
-- ---------------------------------------------------------------------------
INSERT INTO public.admin_departments (department_key, name, description, display_order)
VALUES
  ('content_growth', 'Content & Growth', 'Reads & Listen, Content Studio, and community growth workflows.', 55)
ON CONFLICT (department_key) DO NOTHING;

INSERT INTO public.admin_roles (
  role_key, department_key, name, description, access_level,
  is_super_user, can_manage_users, can_manage_roles, can_reset_passwords, can_reset_mfa,
  can_access_financials, can_access_admin, display_order
)
VALUES
  (
    'growth_manager', 'content_growth', 'Growth Manager',
    'Manages Reads & Listen review, publishing, partnerships, and intern assignments (Ava).',
    'full', false, false, false, false, false, false, true, 55
  ),
  (
    'content_intern', 'content_growth', 'Content Intern',
    'Researches and drafts Reads & Listen content for manager review (Ryan / Lola).',
    'editor', false, false, false, false, false, false, true, 56
  ),
  (
    'marketing_manager', 'sales_marketing', 'Marketing Manager',
    'Sales & Marketing manager with Reads & Listen publishing authority.',
    'full', false, false, false, false, false, false, true, 52
  )
ON CONFLICT (role_key) DO NOTHING;

INSERT INTO public.admin_role_permissions (role_key, permission_key, access_level)
VALUES
  ('growth_manager', 'reads_media', 'full'),
  ('growth_manager', 'reads_publish', 'full'),
  ('growth_manager', 'reads_partnerships', 'full'),
  ('growth_manager', 'reads_analytics', 'full'),
  ('marketing_manager', 'reads_media', 'full'),
  ('marketing_manager', 'reads_publish', 'full'),
  ('marketing_manager', 'reads_partnerships', 'full'),
  ('content_intern', 'reads_media', 'editor'),
  ('content_intern', 'reads_submit', 'editor'),
  ('content_intern', 'reads_own_analytics', 'viewer'),
  ('founder', 'reads_media', 'full'),
  ('owner', 'reads_media', 'full'),
  ('super_admin', 'reads_media', 'full'),
  ('marketing_admin', 'reads_media', 'full'),
  ('sales_admin', 'reads_media', 'full')
ON CONFLICT (role_key, permission_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Seed topics + team members (no fake endorsements / copyrighted covers)
-- ---------------------------------------------------------------------------
INSERT INTO public.reads_topics (slug, name, description, audience, display_order)
VALUES
  ('dog-training-behavior', 'Dog Training & Behavior', 'Training fundamentals and behavior support for dogs.', ARRAY['pet_parent','guru'], 10),
  ('cats-cat-behavior', 'Cats & Cat Behavior', 'Cat care, enrichment, and behavior guidance.', ARRAY['pet_parent','guru'], 20),
  ('pet-health-first-aid', 'Pet Health & First Aid', 'Health literacy and emergency readiness for pets.', ARRAY['pet_parent','guru'], 30),
  ('understanding-your-pet', 'Understanding Your Pet', 'Bonding, communication, and pet psychology.', ARRAY['pet_parent'], 40),
  ('enrichment-activities', 'Enrichment & Activities', 'Play, enrichment, and everyday activities.', ARRAY['pet_parent','guru'], 50),
  ('kids-pets', 'Kids & Pets', 'Helping families raise kids and pets together.', ARRAY['pet_parent'], 60),
  ('pet-loss-grief', 'Pet Loss & Grief', 'Support for pet loss and remembrance.', ARRAY['pet_parent'], 70),
  ('pet-stories-memoirs', 'Pet Stories & Memoirs', 'Stories that celebrate the human–animal bond.', ARRAY['pet_parent'], 80),
  ('rescue-adoption', 'Rescue & Adoption', 'Rescue, adoption, and second-chance pet stories.', ARRAY['pet_parent','guru'], 90),
  ('guru-professional-development', 'Guru Professional Development', 'Skills for professional pet caregivers.', ARRAY['guru'], 100),
  ('pet-industry-professional', 'Pet Industry & Professional Reads', 'Industry insights for pet professionals.', ARRAY['guru','partner'], 110)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.reads_team_members (slug, full_name, role_label, display_order)
VALUES
  ('jason-graff', 'Jason Graff', 'Co-Founder', 10),
  ('danette-graff', 'Danette Graff', 'Co-Founder', 20),
  ('ava-venezia', 'Ava Venezia', 'Social Media & Community Growth Manager', 30),
  ('ryan-manibo', 'Ryan Manibo', 'Intern — Penn State', 40),
  ('lola-uhl', 'Lola Uhl', 'Intern — Saint Joseph''s University', 50)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- RLS — public can only see published + public visibility; staff via service role / admin helpers
-- ---------------------------------------------------------------------------
ALTER TABLE public.reads_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reads_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reads_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reads_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reads_podcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reads_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reads_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reads_content_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reads_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reads_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reads_team_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reads_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reads_partner_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reads_partner_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reads_content_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reads_content_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reads_analytics_events ENABLE ROW LEVEL SECURITY;

-- Reuse is_sitguru_admin() when present; otherwise define a Reads-aware helper.
CREATE OR REPLACE FUNCTION public.is_reads_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_user_access a
    WHERE lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      AND a.is_active = true
      AND a.role_key IN (
        'founder', 'owner', 'super_admin', 'admin',
        'growth_manager', 'marketing_manager', 'marketing_admin',
        'sales_admin', 'content_intern'
      )
  )
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND lower(trim(coalesce(p.role::text, ''))) IN (
        'admin', 'founder', 'owner', 'super_admin', 'super_user',
        'growth_manager', 'marketing_manager', 'marketing_admin',
        'sales_admin', 'content_intern'
      )
  )
  OR (
    EXISTS (
      SELECT 1 FROM pg_proc WHERE proname = 'is_sitguru_admin'
    )
    AND public.is_sitguru_admin()
  );
$$;

DROP POLICY IF EXISTS reads_topics_public_read ON public.reads_topics;
CREATE POLICY reads_topics_public_read ON public.reads_topics
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS reads_topics_staff_all ON public.reads_topics;
CREATE POLICY reads_topics_staff_all ON public.reads_topics
  FOR ALL TO authenticated
  USING (public.is_reads_staff())
  WITH CHECK (public.is_reads_staff());

DROP POLICY IF EXISTS reads_content_public_read ON public.reads_content;
CREATE POLICY reads_content_public_read ON public.reads_content
  FOR SELECT TO anon, authenticated
  USING (status = 'published' AND visibility = 'public');

DROP POLICY IF EXISTS reads_content_staff_all ON public.reads_content;
CREATE POLICY reads_content_staff_all ON public.reads_content
  FOR ALL TO authenticated
  USING (public.is_reads_staff())
  WITH CHECK (public.is_reads_staff());

DROP POLICY IF EXISTS reads_books_public_read ON public.reads_books;
CREATE POLICY reads_books_public_read ON public.reads_books
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reads_content c
      WHERE c.id = content_id AND c.status = 'published' AND c.visibility = 'public'
    )
  );

DROP POLICY IF EXISTS reads_books_staff_all ON public.reads_books;
CREATE POLICY reads_books_staff_all ON public.reads_books
  FOR ALL TO authenticated
  USING (public.is_reads_staff())
  WITH CHECK (public.is_reads_staff());

DROP POLICY IF EXISTS reads_publications_public_read ON public.reads_publications;
CREATE POLICY reads_publications_public_read ON public.reads_publications
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reads_content c
      WHERE c.id = content_id AND c.status = 'published' AND c.visibility = 'public'
    )
  );

DROP POLICY IF EXISTS reads_publications_staff_all ON public.reads_publications;
CREATE POLICY reads_publications_staff_all ON public.reads_publications
  FOR ALL TO authenticated
  USING (public.is_reads_staff())
  WITH CHECK (public.is_reads_staff());

DROP POLICY IF EXISTS reads_podcasts_public_read ON public.reads_podcasts;
CREATE POLICY reads_podcasts_public_read ON public.reads_podcasts
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reads_content c
      WHERE c.id = content_id AND c.status = 'published' AND c.visibility = 'public'
    )
  );

DROP POLICY IF EXISTS reads_podcasts_staff_all ON public.reads_podcasts;
CREATE POLICY reads_podcasts_staff_all ON public.reads_podcasts
  FOR ALL TO authenticated
  USING (public.is_reads_staff())
  WITH CHECK (public.is_reads_staff());

DROP POLICY IF EXISTS reads_videos_public_read ON public.reads_videos;
CREATE POLICY reads_videos_public_read ON public.reads_videos
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reads_content c
      WHERE c.id = content_id AND c.status = 'published' AND c.visibility = 'public'
    )
  );

DROP POLICY IF EXISTS reads_videos_staff_all ON public.reads_videos;
CREATE POLICY reads_videos_staff_all ON public.reads_videos
  FOR ALL TO authenticated
  USING (public.is_reads_staff())
  WITH CHECK (public.is_reads_staff());

DROP POLICY IF EXISTS reads_people_public_read ON public.reads_people;
CREATE POLICY reads_people_public_read ON public.reads_people
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reads_content c
      WHERE c.id = content_id AND c.status = 'published' AND c.visibility = 'public'
    )
  );

DROP POLICY IF EXISTS reads_people_staff_all ON public.reads_people;
CREATE POLICY reads_people_staff_all ON public.reads_people
  FOR ALL TO authenticated
  USING (public.is_reads_staff())
  WITH CHECK (public.is_reads_staff());

DROP POLICY IF EXISTS reads_content_topics_public_read ON public.reads_content_topics;
CREATE POLICY reads_content_topics_public_read ON public.reads_content_topics
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reads_content c
      WHERE c.id = content_id AND c.status = 'published' AND c.visibility = 'public'
    )
  );

DROP POLICY IF EXISTS reads_content_topics_staff_all ON public.reads_content_topics;
CREATE POLICY reads_content_topics_staff_all ON public.reads_content_topics
  FOR ALL TO authenticated
  USING (public.is_reads_staff())
  WITH CHECK (public.is_reads_staff());

DROP POLICY IF EXISTS reads_relationships_public_read ON public.reads_relationships;
CREATE POLICY reads_relationships_public_read ON public.reads_relationships
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reads_content c
      WHERE c.id = from_content_id AND c.status = 'published' AND c.visibility = 'public'
    )
    AND EXISTS (
      SELECT 1 FROM public.reads_content c2
      WHERE c2.id = to_content_id AND c2.status = 'published' AND c2.visibility = 'public'
    )
  );

DROP POLICY IF EXISTS reads_relationships_staff_all ON public.reads_relationships;
CREATE POLICY reads_relationships_staff_all ON public.reads_relationships
  FOR ALL TO authenticated
  USING (public.is_reads_staff())
  WITH CHECK (public.is_reads_staff());

DROP POLICY IF EXISTS reads_team_members_public_read ON public.reads_team_members;
CREATE POLICY reads_team_members_public_read ON public.reads_team_members
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS reads_team_members_staff_all ON public.reads_team_members;
CREATE POLICY reads_team_members_staff_all ON public.reads_team_members
  FOR ALL TO authenticated
  USING (public.is_reads_staff())
  WITH CHECK (public.is_reads_staff());

DROP POLICY IF EXISTS reads_team_picks_public_read ON public.reads_team_picks;
CREATE POLICY reads_team_picks_public_read ON public.reads_team_picks
  FOR SELECT TO anon, authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.reads_content c
      WHERE c.id = content_id AND c.status = 'published' AND c.visibility = 'public'
    )
  );

DROP POLICY IF EXISTS reads_team_picks_staff_all ON public.reads_team_picks;
CREATE POLICY reads_team_picks_staff_all ON public.reads_team_picks
  FOR ALL TO authenticated
  USING (public.is_reads_staff())
  WITH CHECK (public.is_reads_staff());

-- Partners / submissions / reviews / history / analytics: staff only (no anon policies)
DROP POLICY IF EXISTS reads_partners_staff_all ON public.reads_partners;
CREATE POLICY reads_partners_staff_all ON public.reads_partners
  FOR ALL TO authenticated
  USING (public.is_reads_staff())
  WITH CHECK (public.is_reads_staff());

DROP POLICY IF EXISTS reads_partner_submissions_staff_all ON public.reads_partner_submissions;
CREATE POLICY reads_partner_submissions_staff_all ON public.reads_partner_submissions
  FOR ALL TO authenticated
  USING (public.is_reads_staff())
  WITH CHECK (public.is_reads_staff());

-- Public may INSERT partner submissions only (no SELECT of PII)
DROP POLICY IF EXISTS reads_partner_submissions_public_insert ON public.reads_partner_submissions;
CREATE POLICY reads_partner_submissions_public_insert ON public.reads_partner_submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    permission_agreed = true
    AND privacy_acknowledged = true
    AND email IS NOT NULL
    AND length(trim(email)) > 3
  );

DROP POLICY IF EXISTS reads_partner_activity_staff_all ON public.reads_partner_activity;
CREATE POLICY reads_partner_activity_staff_all ON public.reads_partner_activity
  FOR ALL TO authenticated
  USING (public.is_reads_staff())
  WITH CHECK (public.is_reads_staff());

DROP POLICY IF EXISTS reads_content_reviews_staff_all ON public.reads_content_reviews;
CREATE POLICY reads_content_reviews_staff_all ON public.reads_content_reviews
  FOR ALL TO authenticated
  USING (public.is_reads_staff())
  WITH CHECK (public.is_reads_staff());

DROP POLICY IF EXISTS reads_content_status_history_staff_all ON public.reads_content_status_history;
CREATE POLICY reads_content_status_history_staff_all ON public.reads_content_status_history
  FOR ALL TO authenticated
  USING (public.is_reads_staff())
  WITH CHECK (public.is_reads_staff());

DROP POLICY IF EXISTS reads_analytics_events_insert ON public.reads_analytics_events;
CREATE POLICY reads_analytics_events_insert ON public.reads_analytics_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS reads_analytics_events_staff_read ON public.reads_analytics_events;
CREATE POLICY reads_analytics_events_staff_read ON public.reads_analytics_events
  FOR SELECT TO authenticated
  USING (public.is_reads_staff());

COMMENT ON TABLE public.reads_content IS
  'SitGuru Reads & Listen curated media items (books, magazines, podcasts, videos, authors).';
COMMENT ON TABLE public.reads_partners IS
  'Private partnership CRM for Reads & Listen. Contact fields must never be exposed publicly.';
COMMENT ON TABLE public.reads_partner_submissions IS
  'Public partnership form submissions. Email/phone are private; staff-only SELECT.';
COMMENT ON TABLE public.reads_team_picks IS
  'Database-driven Team Picks for Jason, Danette, Ava, Ryan, and Lola.';

COMMIT;
