-- Link SitGuru messaging threads to Community Events for partner ↔ admin coordination.

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS community_event_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'conversations_community_event_id_fkey'
  ) THEN
    ALTER TABLE public.conversations
      ADD CONSTRAINT conversations_community_event_id_fkey
      FOREIGN KEY (community_event_id) REFERENCES public.community_events(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'conversations or community_events table missing — skipping FK';
END $$;

CREATE INDEX IF NOT EXISTS conversations_community_event_id_idx
  ON public.conversations (community_event_id)
  WHERE community_event_id IS NOT NULL;

COMMENT ON COLUMN public.conversations.community_event_id IS
  'When set with topic community_event, thread coordinates a specific Community Event between partner managers and SitGuru admin.';
