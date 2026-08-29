-- Allow Attending? Yes / Maybe / No without a SitGuru account (guest RSVPs).

ALTER TABLE public.community_event_attendance
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.community_event_attendance
  ADD COLUMN IF NOT EXISTS guest_key text;

-- One response per signed-in user per event
ALTER TABLE public.community_event_attendance
  DROP CONSTRAINT IF EXISTS community_event_attendance_event_id_user_id_key;

DROP INDEX IF EXISTS community_event_attendance_event_id_user_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS community_event_attendance_event_user_uidx
  ON public.community_event_attendance (event_id, user_id)
  WHERE user_id IS NOT NULL;

-- One response per guest browser key per event
CREATE UNIQUE INDEX IF NOT EXISTS community_event_attendance_event_guest_uidx
  ON public.community_event_attendance (event_id, guest_key)
  WHERE guest_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS community_event_attendance_guest_idx
  ON public.community_event_attendance (guest_key)
  WHERE guest_key IS NOT NULL;

ALTER TABLE public.community_event_attendance
  DROP CONSTRAINT IF EXISTS community_event_attendance_actor_chk;

ALTER TABLE public.community_event_attendance
  ADD CONSTRAINT community_event_attendance_actor_chk
  CHECK (
    (user_id IS NOT NULL AND guest_key IS NULL)
    OR (user_id IS NULL AND guest_key IS NOT NULL)
  );

COMMENT ON COLUMN public.community_event_attendance.guest_key IS
  'Browser guest id for RSVPs without login. Mutually exclusive with user_id.';
