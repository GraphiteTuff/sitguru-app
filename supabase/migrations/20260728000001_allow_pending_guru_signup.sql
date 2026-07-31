-- SitGuru migration: allow immediate private Guru registration
--
-- Save as:
--   supabase/migrations/20260728_allow_pending_guru_signup.sql
--
-- Purpose:
--   New Gurus must be able to receive a private SitGuru workspace immediately.
--   Email, service city, service state, and service ZIP are required only before
--   a Guru becomes approved, active, public, listed, visible, or bookable.
--
-- This migration replaces the body of the existing trigger function.
-- The existing trigger attached to public.gurus will automatically use it.

create or replace function public.enforce_new_guru_contact_location_required()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_activation_requested boolean := false;
  v_missing text[] := array[]::text[];
begin
  -- Keep signup-created records private and incomplete until onboarding is done.
  -- Do not invent contact or location values.
  new.email := nullif(trim(coalesce(new.email, '')), '');
  new.service_city := nullif(trim(coalesce(new.service_city, '')), '');
  new.service_state := nullif(trim(coalesce(new.service_state, '')), '');
  new.service_zip := nullif(trim(coalesce(new.service_zip, '')), '');
  new.zip_code := nullif(trim(coalesce(new.zip_code, '')), '');
  new.postal_code := nullif(trim(coalesce(new.postal_code, '')), '');

  -- Reuse any ZIP value already collected during signup.
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

  -- Only enforce full contact/location requirements when the row is being
  -- activated, approved, published, listed, made visible, or made bookable.
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

  -- Private draft/setup Gurus are allowed into SitGuru immediately.
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
      'Guru cannot become public, approved, active, listed, or bookable. Missing: %',
      array_to_string(v_missing, ', ')
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_new_guru_contact_location_required()
  from public, anon, authenticated;

grant execute on function public.enforce_new_guru_contact_location_required()
  to service_role;

comment on function public.enforce_new_guru_contact_location_required()
is
  'Allows immediate private pending Guru workspace creation. Requires email, service city, service state, and service ZIP only before activation, approval, publishing, listing, visibility, or booking.';

-- ---------------------------------------------------------------------------
-- After this migration succeeds, rerun the SitGuru signup provisioning
-- migration or call the repair RPC for the affected account.
--
-- Samantha phone-verified account repair:
--
-- select public.provision_sitguru_account(
--   '59a4b42b-a91a-4baf-932c-656aa516398a'::uuid,
--   'guru',
--   'Samantha Nunez',
--   null,
--   '+19087642719',
--   null,
--   null,
--   null,
--   'admin_signup_repair'
-- );
--
-- Expected:
--   "ok": true
--   "workspace_ready": true
--   "guru_ready": true
--
-- Do not repair the separate email-only Samantha account unless you
-- intentionally want a second Guru profile.