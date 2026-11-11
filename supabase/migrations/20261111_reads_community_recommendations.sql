-- Community recommendation lanes (Guru + Pet Parent).
-- Public can only read approved/published rows. Submissions require staff review.

CREATE TABLE IF NOT EXISTS public.reads_community_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL
    CHECK (source IN ('guru', 'pet_parent')),
  content_id uuid NOT NULL REFERENCES public.reads_content(id) ON DELETE CASCADE,
  submitter_user_id uuid,
  submitter_display_name text NOT NULL,
  submitter_role_label text NOT NULL,
  quote text NOT NULL,
  status text NOT NULL DEFAULT 'submitted'
    CHECK (status IN (
      'submitted', 'changes_requested', 'approved', 'published', 'rejected', 'archived'
    )),
  review_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reads_community_recs_source_status_idx
  ON public.reads_community_recommendations (source, status, published_at DESC);

CREATE INDEX IF NOT EXISTS reads_community_recs_content_idx
  ON public.reads_community_recommendations (content_id);

ALTER TABLE public.reads_community_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reads_community_recs_public_read ON public.reads_community_recommendations;
CREATE POLICY reads_community_recs_public_read
  ON public.reads_community_recommendations
  FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS reads_community_recs_staff_all ON public.reads_community_recommendations;
CREATE POLICY reads_community_recs_staff_all
  ON public.reads_community_recommendations
  FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.reads_community_recommendations IS
  'Guru and Pet Parent recommendations. Must be reviewed/approved before public publish. Team Picks remain in reads_team_picks.';
