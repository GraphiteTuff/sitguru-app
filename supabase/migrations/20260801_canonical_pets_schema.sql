-- Canonical pet contract (aligned with app/pets/page.tsx):
-- species (not pet_type), size (not size_category), medical_notes (not medications),
-- plus per-pet behavior / feeding / potty routines bound via user_id.

DO $$
BEGIN
  IF to_regclass('public.pets') IS NULL THEN
    RAISE NOTICE 'public.pets does not exist — skipping canonical pets migration';
    RETURN;
  END IF;

  -- Identity / FK binding
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS user_id uuid;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS owner_id uuid;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS owner_profile_id uuid;

  -- Canonical core
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS species text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS size text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS medical_notes text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS breed text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS age text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS weight text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS temperament text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS notes text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS photo_url text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS video_url text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS care_instructions text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS story text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS is_public boolean;

  -- Behavior
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS personality text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS energy_level text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS good_with_people text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS good_with_pets text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS separation_anxiety text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS triggers text;

  -- Routines (migrated off household/profile care notes)
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS feeding_routine text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS potty_routine text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS walking_instructions text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS sleeping_location text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS crate_trained text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS favorite_things text;

  -- Medical / safety
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS allergies text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS medical_conditions text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS vet_name text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS vet_phone text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS emergency_contact_name text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS emergency_contact_phone text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS supplies_location text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS entry_notes text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS restricted_areas text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS safety_notes text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS bite_history text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS escape_risk text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS booking_notes text;

  -- Deprecated mirrors (kept for read compatibility)
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS pet_type text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS size_category text;
  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS medications text;

  ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS updated_at timestamptz;
END $$;

-- Backfill canonical columns from deprecated aliases
UPDATE public.pets
SET species = COALESCE(NULLIF(TRIM(species), ''), NULLIF(TRIM(pet_type), ''))
WHERE (species IS NULL OR TRIM(species) = '')
  AND pet_type IS NOT NULL
  AND TRIM(pet_type) <> '';

UPDATE public.pets
SET size = COALESCE(NULLIF(TRIM(size), ''), NULLIF(TRIM(size_category), ''))
WHERE (size IS NULL OR TRIM(size) = '')
  AND size_category IS NOT NULL
  AND TRIM(size_category) <> '';

UPDATE public.pets
SET medical_notes = COALESCE(NULLIF(TRIM(medical_notes), ''), NULLIF(TRIM(medications), ''))
WHERE (medical_notes IS NULL OR TRIM(medical_notes) = '')
  AND medications IS NOT NULL
  AND TRIM(medications) <> '';

-- Keep deprecated mirrors in sync when canonical is set
UPDATE public.pets
SET pet_type = species
WHERE species IS NOT NULL
  AND TRIM(species) <> ''
  AND (pet_type IS NULL OR TRIM(pet_type) = '');

UPDATE public.pets
SET size_category = size
WHERE size IS NOT NULL
  AND TRIM(size) <> ''
  AND (size_category IS NULL OR TRIM(size_category) = '');

UPDATE public.pets
SET medications = medical_notes
WHERE medical_notes IS NOT NULL
  AND TRIM(medical_notes) <> ''
  AND (medications IS NULL OR TRIM(medications) = '');

-- Bind owner_id / user_id when only one side is populated
UPDATE public.pets
SET user_id = owner_id
WHERE user_id IS NULL AND owner_id IS NOT NULL;

UPDATE public.pets
SET owner_id = user_id
WHERE owner_id IS NULL AND user_id IS NOT NULL;

-- Lift household profile care notes onto each linked pet when pet routines are empty
DO $$
BEGIN
  IF to_regclass('public.profiles') IS NULL OR to_regclass('public.pets') IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.pets p
  SET
    feeding_routine = COALESCE(
      NULLIF(TRIM(p.feeding_routine), ''),
      NULLIF(TRIM(pr.feeding_notes), '')
    ),
    potty_routine = COALESCE(
      NULLIF(TRIM(p.potty_routine), ''),
      NULLIF(TRIM(pr.house_rules), '')
    ),
    medical_notes = COALESCE(
      NULLIF(TRIM(p.medical_notes), ''),
      NULLIF(TRIM(pr.medication_notes), ''),
      NULLIF(TRIM(p.medications), '')
    ),
    temperament = COALESCE(
      NULLIF(TRIM(p.temperament), ''),
      NULLIF(TRIM(pr.behavior_notes), '')
    ),
    notes = COALESCE(
      NULLIF(TRIM(p.notes), ''),
      NULLIF(TRIM(pr.care_preferences), '')
    ),
    entry_notes = COALESCE(
      NULLIF(TRIM(p.entry_notes), ''),
      NULLIF(TRIM(pr.access_instructions), '')
    ),
    updated_at = COALESCE(p.updated_at, now())
  FROM public.profiles pr
  WHERE (
      p.user_id = pr.id
      OR p.owner_id = pr.id
      OR p.owner_profile_id = pr.id
    )
    AND (
      (p.feeding_routine IS NULL OR TRIM(p.feeding_routine) = '')
      OR (p.potty_routine IS NULL OR TRIM(p.potty_routine) = '')
      OR (p.medical_notes IS NULL OR TRIM(p.medical_notes) = '')
      OR (p.temperament IS NULL OR TRIM(p.temperament) = '')
      OR (p.notes IS NULL OR TRIM(p.notes) = '')
      OR (p.entry_notes IS NULL OR TRIM(p.entry_notes) = '')
    );
EXCEPTION
  WHEN undefined_column THEN
    RAISE NOTICE 'profiles care-note columns missing — skipped household → pets backfill';
END $$;

DO $$
BEGIN
  IF to_regclass('public.pets') IS NULL THEN
    RETURN;
  END IF;
  CREATE INDEX IF NOT EXISTS pets_user_id_idx ON public.pets (user_id);
  CREATE INDEX IF NOT EXISTS pets_owner_id_idx ON public.pets (owner_id);
  CREATE INDEX IF NOT EXISTS pets_species_idx ON public.pets (species);
  CREATE INDEX IF NOT EXISTS pets_breed_idx ON public.pets (breed);
  CREATE INDEX IF NOT EXISTS pets_size_idx ON public.pets (size);
END $$;
