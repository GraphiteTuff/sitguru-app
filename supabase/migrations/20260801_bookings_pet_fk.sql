-- Relational booking → pet link.
-- Bookings keep pet_id as the source of truth; pet_name / pet_photo_url remain
-- optional display fallbacks for deleted pets / receipts. Live profile fields
-- (name, species, size, medical_notes, photo) come from public.pets via FK.

DO $$
BEGIN
  IF to_regclass('public.bookings') IS NULL OR to_regclass('public.pets') IS NULL THEN
    RAISE NOTICE 'bookings or pets missing — skipping booking pet FK migration';
    RETURN;
  END IF;

  -- Prefer uuid pet_id; if column is text, backfill into a staging uuid column.
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bookings'
      AND column_name = 'pet_id'
  ) THEN
    ALTER TABLE public.bookings ADD COLUMN pet_id uuid;
  END IF;
END $$;

-- Normalize empty strings to NULL (text or uuid-compatible)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'pet_id'
      AND data_type IN ('text', 'character varying')
  ) THEN
    UPDATE public.bookings
    SET pet_id = NULL
    WHERE pet_id IS NOT NULL AND btrim(pet_id::text) = '';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'pet_id empty cleanup skipped: %', SQLERRM;
END $$;

-- Backfill pet_id from owner + name when unique-ish match exists
DO $$
BEGIN
  UPDATE public.bookings b
  SET pet_id = p.id
  FROM public.pets p
  WHERE (b.pet_id IS NULL OR btrim(COALESCE(b.pet_id::text, '')) = '')
    AND b.pet_name IS NOT NULL
    AND btrim(b.pet_name) <> ''
    AND lower(btrim(p.name)) = lower(btrim(b.pet_name))
    AND (
      p.user_id = b.customer_id
      OR p.owner_id = b.customer_id
      OR p.user_id = b.user_id
      OR p.owner_id = b.user_id
      OR p.user_id = b.pet_owner_id
      OR p.owner_id = b.pet_owner_id
      OR p.user_id = b.pet_parent_id
      OR p.owner_id = b.pet_parent_id
    );
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'pet_id name backfill skipped: %', SQLERRM;
END $$;

-- Clear orphaned pet_id values that would block the FK
DO $$
BEGIN
  UPDATE public.bookings b
  SET pet_id = NULL
  WHERE b.pet_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.pets p WHERE p.id::text = b.pet_id::text
    );
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'orphan pet_id cleanup skipped: %', SQLERRM;
END $$;

-- Add FK (ON DELETE SET NULL so booking history survives pet deletion)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_pet_id_fkey'
  ) THEN
    RETURN;
  END IF;

  -- Cast text pet_id → uuid column if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bookings'
      AND column_name = 'pet_id'
      AND data_type IN ('text', 'character varying')
  ) THEN
    ALTER TABLE public.bookings
      ADD COLUMN IF NOT EXISTS pet_id_uuid uuid;

    UPDATE public.bookings
    SET pet_id_uuid = pet_id::uuid
    WHERE pet_id IS NOT NULL
      AND pet_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

    ALTER TABLE public.bookings DROP COLUMN pet_id;
    ALTER TABLE public.bookings RENAME COLUMN pet_id_uuid TO pet_id;
  END IF;

  ALTER TABLE public.bookings
    ADD CONSTRAINT bookings_pet_id_fkey
    FOREIGN KEY (pet_id) REFERENCES public.pets(id)
    ON DELETE SET NULL;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'bookings_pet_id_fkey skipped: %', SQLERRM;
END $$;

CREATE INDEX IF NOT EXISTS bookings_pet_id_idx ON public.bookings (pet_id);

-- Live join view for admin/reporting (past + present + future)
CREATE OR REPLACE VIEW public.bookings_with_live_pet AS
SELECT
  b.*,
  p.name AS live_pet_name,
  COALESCE(p.species, p.pet_type) AS live_pet_species,
  p.breed AS live_pet_breed,
  COALESCE(p.size, p.size_category) AS live_pet_size,
  COALESCE(p.medical_notes, p.medications) AS live_pet_medical_notes,
  p.photo_url AS live_pet_photo_url,
  p.video_url AS live_pet_video_url,
  p.temperament AS live_pet_temperament,
  p.feeding_routine AS live_pet_feeding_routine,
  p.potty_routine AS live_pet_potty_routine,
  b.user_id AS live_pet_user_id,
  COALESCE(p.name, b.pet_name, 'Pet') AS display_pet_name,
  COALESCE(p.photo_url, b.pet_photo_url) AS display_pet_photo_url
FROM public.bookings b
LEFT JOIN public.pets p ON p.id = b.pet_id;

COMMENT ON VIEW public.bookings_with_live_pet IS
  'Bookings joined to live pet profiles via pet_id FK. Prefer display_pet_* over denormalized snapshots.';
