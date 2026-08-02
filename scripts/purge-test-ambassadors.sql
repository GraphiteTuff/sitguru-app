-- Purge automated journey / local test ambassador accounts.
--
-- Intent (Prisma-style source):
--   DELETE FROM "AmbassadorProfile"
--     WHERE "email" LIKE '%sitguru.local%' OR "id" LIKE '%journey.amb.%';
--   DELETE FROM "User"
--     WHERE "email" LIKE '%sitguru.local%';
--
-- Mapped to SitGuru Supabase tables. Run in the Supabase SQL editor.
-- Prefer `npm run cleanup-test-ambassadors` when service-role credentials
-- are available — that path also walks FK children via the Admin API.

DO $$
DECLARE
  test_email text := '%sitguru.local%';
  test_id text := '%journey.amb.%';
BEGIN
  -- Child rows first (ignore missing relations)
  BEGIN
    DELETE FROM ambassador_clicks c
    USING ambassadors a
    WHERE c.ambassador_id = a.id
      AND (
        coalesce(a.email, '') ILIKE test_email
        OR a.id::text ILIKE test_id
        OR coalesce(a.referral_code, '') ILIKE test_id
      );
  EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
  END;

  BEGIN
    DELETE FROM ambassador_clicks c
    USING ambassador_profiles p
    WHERE c.ambassador_profile_id = p.id
      AND (
        p.id::text ILIKE test_id
        OR coalesce(p.referral_code_slug, '') ILIKE test_id
        OR coalesce(p.display_name, '') ILIKE test_id
      );
  EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
  END;

  BEGIN
    DELETE FROM ambassador_referrals r
    USING ambassadors a
    WHERE r.ambassador_id = a.id
      AND (
        coalesce(a.email, '') ILIKE test_email
        OR a.id::text ILIKE test_id
        OR coalesce(a.referral_code, '') ILIKE test_id
      );
  EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
  END;

  BEGIN
    DELETE FROM ambassador_referrals r
    USING ambassador_profiles p
    WHERE r.ambassador_profile_id = p.id
      AND (
        p.id::text ILIKE test_id
        OR coalesce(p.referral_code_slug, '') ILIKE test_id
        OR coalesce(p.display_name, '') ILIKE test_id
      );
  EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
  END;

  BEGIN
    DELETE FROM ambassador_rewards r
    USING ambassadors a
    WHERE r.ambassador_id = a.id
      AND (
        coalesce(a.email, '') ILIKE test_email
        OR a.id::text ILIKE test_id
        OR coalesce(a.referral_code, '') ILIKE test_id
      );
  EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
  END;

  BEGIN
    DELETE FROM referral_clicks r
    USING ambassadors a
    WHERE r.ambassador_id = a.id
      AND (
        coalesce(a.email, '') ILIKE test_email
        OR a.id::text ILIKE test_id
        OR coalesce(a.referral_code, '') ILIKE test_id
      );
  EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
  END;

  BEGIN
    DELETE FROM commission_ledger l
    USING ambassadors a
    WHERE l.ambassador_id = a.id
      AND (
        coalesce(a.email, '') ILIKE test_email
        OR a.id::text ILIKE test_id
        OR coalesce(a.referral_code, '') ILIKE test_id
      );
  EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
  END;

  BEGIN
    DELETE FROM ambassador_training_progress t
    USING ambassadors a
    WHERE t.ambassador_id = a.id
      AND (
        coalesce(a.email, '') ILIKE test_email
        OR a.id::text ILIKE test_id
        OR coalesce(a.referral_code, '') ILIKE test_id
      );
  EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
  END;

  BEGIN
    DELETE FROM user_roles
    WHERE user_id IN (
      SELECT id FROM profiles WHERE email ILIKE test_email
    );
  EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
  END;

  -- AmbassadorProfile equivalent
  BEGIN
    DELETE FROM ambassador_profiles
    WHERE id::text ILIKE test_id
       OR coalesce(referral_code_slug, '') ILIKE test_id
       OR coalesce(display_name, '') ILIKE test_id
       OR user_id IN (SELECT id FROM profiles WHERE email ILIKE test_email)
       OR ambassador_record_id IN (
            SELECT id FROM ambassadors
            WHERE coalesce(email, '') ILIKE test_email
               OR id::text ILIKE test_id
               OR coalesce(referral_code, '') ILIKE test_id
          );
  EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
  END;

  BEGIN
    DELETE FROM ambassadors
    WHERE coalesce(email, '') ILIKE test_email
       OR id::text ILIKE test_id
       OR coalesce(referral_code, '') ILIKE test_id
       OR coalesce(full_name, '') ILIKE test_id
       OR user_id IN (SELECT id FROM profiles WHERE email ILIKE test_email);
  EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
  END;

  -- User equivalent (app profiles)
  BEGIN
    DELETE FROM profiles
    WHERE email ILIKE test_email;
  EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
  END;

  -- Auth users (requires privilege on auth schema)
  BEGIN
    DELETE FROM auth.users
    WHERE email ILIKE test_email;
  EXCEPTION WHEN insufficient_privilege OR undefined_table THEN
    RAISE NOTICE 'Skipped auth.users delete — run npm run cleanup-test-ambassadors instead';
  END;
END $$;
