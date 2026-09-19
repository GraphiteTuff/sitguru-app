-- Apple Private Relay / auth email repair for profiles + gurus
-- Backwards compatible: adds optional contact_email; backfills login email
-- only when destination is null/blank. Never overwrites contact_email.

alter table if exists public.profiles
  add column if not exists contact_email text;

alter table if exists public.gurus
  add column if not exists contact_email text;

comment on column public.profiles.contact_email is
  'Optional contact email for SitGuru communications. Distinct from login/auth email (profiles.email), which may be an Apple Private Relay address.';

comment on column public.gurus.contact_email is
  'Optional contact email for SitGuru / Stripe outreach. Distinct from gurus.email (login/auth snapshot).';

-- Backfill profiles.email from auth.users when blank.
update public.profiles p
set
  email = lower(trim(au.email)),
  updated_at = coalesce(p.updated_at, now())
from auth.users au
where au.id = coalesce(p.user_id, p.id)
  and au.email is not null
  and length(trim(au.email)) > 0
  and (
    p.email is null
    or length(trim(p.email)) = 0
  );

-- Backfill gurus.email from auth.users when blank (via user_id).
update public.gurus g
set
  email = lower(trim(au.email)),
  updated_at = coalesce(g.updated_at, now())
from auth.users au
where au.id = g.user_id
  and au.email is not null
  and length(trim(au.email)) > 0
  and (
    g.email is null
    or length(trim(g.email)) = 0
  );

-- Also backfill gurus.email from profiles.email when still blank.
update public.gurus g
set
  email = lower(trim(p.email)),
  updated_at = coalesce(g.updated_at, now())
from public.profiles p
where coalesce(g.user_id, g.profile_id) = coalesce(p.user_id, p.id)
  and p.email is not null
  and length(trim(p.email)) > 0
  and (
    g.email is null
    or length(trim(g.email)) = 0
  );

-- Stripe status: if a connected account id exists but status is null/blank/
-- not_started, mark as onboarding started (not Ready). Live Stripe sync
-- still decides Ready / Action required.
update public.gurus
set
  stripe_connect_status = 'onboarding_started',
  updated_at = coalesce(updated_at, now())
where stripe_account_id is not null
  and length(trim(stripe_account_id)) > 0
  and (
    stripe_connect_status is null
    or length(trim(stripe_connect_status)) = 0
    or lower(trim(stripe_connect_status)) = 'not_started'
  )
  and coalesce(charges_enabled, false) = false
  and coalesce(payouts_enabled, false) = false;
