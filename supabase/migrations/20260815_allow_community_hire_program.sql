-- Allow Community Hire applications on program_applications.program.
-- If a restrictive CHECK already lists program keys, expand it to include community-hire.

DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT con.conname
  INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'program_applications'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%student-hire%'
  LIMIT 1;

  IF constraint_name IS NOT NULL THEN
    EXECUTE format(
      'ALTER TABLE public.program_applications DROP CONSTRAINT %I',
      constraint_name
    );

    ALTER TABLE public.program_applications
      ADD CONSTRAINT program_applications_program_check
      CHECK (
        program IS NULL
        OR program IN (
          'student-hire',
          'community-hire',
          'veterans-hire',
          'ambassador-program',
          'skillbridge-interest',
          'military-hire'
        )
      );
  END IF;
END $$;
