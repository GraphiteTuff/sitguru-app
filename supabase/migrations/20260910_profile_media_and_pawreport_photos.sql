-- PawReport photo bucket + profile cover/gallery/video for Gurus and Pet Parents.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pawreport-photos',
  'pawreport-photos',
  true,
  8388608,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[]
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
      AND policyname = 'pawreport_photos_public_read'
  ) THEN
    CREATE POLICY pawreport_photos_public_read ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'pawreport-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'pawreport_photos_owner_insert'
  ) THEN
    CREATE POLICY pawreport_photos_owner_insert ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'pawreport-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'pawreport_photos_owner_update'
  ) THEN
    CREATE POLICY pawreport_photos_owner_update ON storage.objects
      FOR UPDATE TO authenticated
      USING (
        bucket_id = 'pawreport-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
      WITH CHECK (
        bucket_id = 'pawreport-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'pawreport_photos_owner_delete'
  ) THEN
    CREATE POLICY pawreport_photos_owner_delete ON storage.objects
      FOR DELETE TO authenticated
      USING (
        bucket_id = 'pawreport-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'pawreport-photos storage policies skipped: %', SQLERRM;
END $$;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cover_url text;
ALTER TABLE public.gurus ADD COLUMN IF NOT EXISTS cover_url text;

CREATE TABLE IF NOT EXISTS public.profile_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('cover', 'gallery', 'video')),
  file_url text NOT NULL,
  file_type text,
  storage_bucket text,
  storage_path text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profile_media_user_id_idx
  ON public.profile_media (user_id, kind, sort_order);

ALTER TABLE public.profile_media ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.profile_media TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profile_media TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profile_media'
      AND policyname = 'profile_media_public_read'
  ) THEN
    CREATE POLICY profile_media_public_read ON public.profile_media
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profile_media'
      AND policyname = 'profile_media_insert_own'
  ) THEN
    CREATE POLICY profile_media_insert_own ON public.profile_media
      FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profile_media'
      AND policyname = 'profile_media_update_own'
  ) THEN
    CREATE POLICY profile_media_update_own ON public.profile_media
      FOR UPDATE TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profile_media'
      AND policyname = 'profile_media_delete_own'
  ) THEN
    CREATE POLICY profile_media_delete_own ON public.profile_media
      FOR DELETE TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;
