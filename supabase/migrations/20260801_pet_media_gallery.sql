-- Pet media gallery rows + storage bucket scaffolding.
-- Relational rows track assets in pet-photos / pet-videos buckets.

CREATE TABLE IF NOT EXISTS public.pet_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL,
  user_id uuid,
  media_kind text NOT NULL CHECK (media_kind IN ('photo', 'video')),
  file_url text NOT NULL,
  file_type text,
  file_name text,
  storage_bucket text,
  storage_path text,
  visibility text DEFAULT 'private',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Legacy-compatible columns if table already existed with a thinner schema
ALTER TABLE public.pet_media ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.pet_media ADD COLUMN IF NOT EXISTS media_kind text;
ALTER TABLE public.pet_media ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE public.pet_media ADD COLUMN IF NOT EXISTS file_type text;
ALTER TABLE public.pet_media ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE public.pet_media ADD COLUMN IF NOT EXISTS storage_bucket text;
ALTER TABLE public.pet_media ADD COLUMN IF NOT EXISTS storage_path text;
ALTER TABLE public.pet_media ADD COLUMN IF NOT EXISTS visibility text;
ALTER TABLE public.pet_media ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.pet_media ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.pet_media ADD COLUMN IF NOT EXISTS pet_id uuid;

-- Infer media_kind for legacy rows
UPDATE public.pet_media
SET media_kind = CASE
  WHEN COALESCE(file_type, '') ILIKE 'image%' THEN 'photo'
  WHEN COALESCE(file_type, '') ILIKE 'video%' THEN 'video'
  ELSE media_kind
END
WHERE media_kind IS NULL;

CREATE INDEX IF NOT EXISTS pet_media_pet_id_idx ON public.pet_media (pet_id);
CREATE INDEX IF NOT EXISTS pet_media_user_id_idx ON public.pet_media (user_id);
CREATE INDEX IF NOT EXISTS pet_media_kind_idx ON public.pet_media (media_kind);

-- Best-effort FK (skip if pets.id type mismatch)
DO $$
BEGIN
  IF to_regclass('public.pets') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'pet_media_pet_id_fkey'
     ) THEN
    ALTER TABLE public.pet_media
      ADD CONSTRAINT pet_media_pet_id_fkey
      FOREIGN KEY (pet_id) REFERENCES public.pets(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'pet_media FK skipped: %', SQLERRM;
END $$;

ALTER TABLE public.pet_media ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'pet_media' AND policyname = 'pet_media_select_own'
  ) THEN
    CREATE POLICY pet_media_select_own ON public.pet_media
      FOR SELECT TO authenticated
      USING (user_id = auth.uid() OR pet_id IN (
        SELECT id FROM public.pets
        WHERE user_id = auth.uid() OR owner_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'pet_media' AND policyname = 'pet_media_insert_own'
  ) THEN
    CREATE POLICY pet_media_insert_own ON public.pet_media
      FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'pet_media' AND policyname = 'pet_media_delete_own'
  ) THEN
    CREATE POLICY pet_media_delete_own ON public.pet_media
      FOR DELETE TO authenticated
      USING (user_id = auth.uid());
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'pet_media RLS policies skipped: %', SQLERRM;
END $$;

-- Storage buckets (public read; authenticated write under own folder)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'pet-photos',
    'pet-photos',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png']::text[]
  ),
  (
    'pet-videos',
    'pet-videos',
    true,
    31457280,
    ARRAY['video/mp4', 'video/quicktime']::text[]
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
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'pet_photos_public_read'
  ) THEN
    CREATE POLICY pet_photos_public_read ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'pet-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'pet_videos_public_read'
  ) THEN
    CREATE POLICY pet_videos_public_read ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'pet-videos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'pet_photos_owner_write'
  ) THEN
    CREATE POLICY pet_photos_owner_write ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'pet-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'pet_videos_owner_write'
  ) THEN
    CREATE POLICY pet_videos_owner_write ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'pet-videos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'pet_photos_owner_delete'
  ) THEN
    CREATE POLICY pet_photos_owner_delete ON storage.objects
      FOR DELETE TO authenticated
      USING (
        bucket_id = 'pet-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'pet_videos_owner_delete'
  ) THEN
    CREATE POLICY pet_videos_owner_delete ON storage.objects
      FOR DELETE TO authenticated
      USING (
        bucket_id = 'pet-videos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'storage pet media policies skipped: %', SQLERRM;
END $$;
