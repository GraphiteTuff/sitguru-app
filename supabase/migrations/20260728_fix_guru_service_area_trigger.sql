-- SitGuru migration: fix the actual Guru service-area trigger
--
-- Save as:
--   supabase/migrations/20260728_fix_guru_service_area_trigger.sql
--
-- The existing trigger function was blocking every new Guru INSERT whenever
-- service_city and service_state were not present, even when the Guru was still
-- private, pending, unlisted, and not bookable.
--
-- This replacement allows SitGuru to create the private Guru workspace
-- immediately. Full contact/location fields are enforced only when the Guru is
-- being activated, approved, published, listed, visible, or made bookable.

create or replace function public.enforce_new_guru_service_area_required()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_activation_requested boolean := false;
  v_missing text[] := array[]::text[];
begin
  -- Normalize blank values.
  new.email := nullif(trim(coalesce(new.email, '')), '');
  new.service_city := nullif(trim(coalesce(new.service_city, '')), '');
  new.service_state := nullif(trim(coalesce(new.service_state, '')), '');
  new.service_zip := nullif(trim(coalesce(new.service_zip, '')), '');
  new.zip_code := nullif(trim(coalesce(new.zip_code, '')), '');
  new.postal_code := nullif(trim(coalesce(new.postal_code, '')), '');

  -- Reuse the ZIP already collected during signup.
  new.service_zip := coalesce(
    new.service_zip,
    new.zip_code,
    new.postal_code
  );

  new.zip_code := coalesce(
    new.zip_code,
    new.service_zip,
    new.postal_code
  );

  new.postal_code := coalesce(
    new.postal_code,
    new.service_zip,
    new.zip_code
  );

  -- A new Guru may be created immediately as a private pending workspace.
  -- Full contact/location data is required only when activation is requested.
  v_activation_requested :=
    coalesce(new.is_public, false)
    or coalesce(new.is_public_visible, false)
    or coalesce(new.is_bookable, false)

    or lower(trim(coalesce(new.status, ''))) in (
      'active',
      'approved',
      'public',
      'published',
      'live',
      'listed',
      'bookable',
      'available'
    )

    or lower(trim(coalesce(new.application_status, ''))) in (
      'active',
      'approved'
    )

    or lower(trim(coalesce(new.admin_status, ''))) in (
      'active',
      'approved'
    )

    or lower(trim(coalesce(new.booking_status, ''))) in (
      'active',
      'approved',
      'public',
      'published',
      'live',
      'listed',
      'bookable',
      'available',
      'open'
    );

  if not v_activation_requested then
    return new;
  end if;

  if new.email is null then
    v_missing := array_append(v_missing, 'email');
  end if;

  if new.service_city is null then
    v_missing := array_append(v_missing, 'service_city');
  end if;

  if new.service_state is null then
    v_missing := array_append(v_missing, 'service_state');
  end if;

  if new.service_zip is null then
    v_missing := array_append(v_missing, 'service_zip');
  end if;

  if cardinality(v_missing) > 0 then
    raise exception
      'Guru cannot become public, approved, active, listed, visible, or bookable. Missing: %',
      array_to_string(v_missing, ', ')
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_new_guru_service_area_required()
  from public, anon, authenticated;

grant execute on function public.enforce_new_guru_service_area_required()
  to service_role;

comment on function public.enforce_new_guru_service_area_required()
is
  'Allows immediate private pending Guru creation. Requires email, service city, service state, and service ZIP only before activation, approval, publishing, listing, visibility, or booking.';

-- ---------------------------------------------------------------------------
-- After this migration succeeds, rerun Samantha's provisioning repair:
--
-- select public.provision_sitguru_account(
--   '59a4b42b-a91a-4baf-932c-656aa516398a'::uuid,
--   'guru',
--   'Samantha Nunez',
--   null,
--   '+19087642719',
--   '32084',
--   '32084',
--   null,
--   'admin_signup_repair'
-- );
--
-- Then verify:
--
-- select
--   user_id,
--   full_name,
--   email,
--   phone,
--   status,
--   application_status,
--   booking_status,
--   is_public,
--   is_public_visible,
--   is_bookable,
--   profile_completed,
--   onboarding_completed,
--   service_city,
--   service_state,
--   service_zip
-- from public.gurus
-- where user_id = '59a4b42b-a91a-4baf-932c-656aa516398a'::uuid;