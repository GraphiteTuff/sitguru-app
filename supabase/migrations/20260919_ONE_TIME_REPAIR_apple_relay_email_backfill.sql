-- ONE-TIME REPAIR / BACKFILL (optional administrative run)
--
-- Use only if the migration `20260919_apple_relay_email_and_stripe_status.sql`
-- has not been applied, or to re-run a safe null-only email backfill.
--
-- Safe guarantees:
-- - Does NOT hard-code any user id or email
-- - Does NOT overwrite non-empty profiles.email / gurus.email
-- - Does NOT overwrite contact_email
-- - Does NOT mark Stripe Ready from account id alone

-- 1) Ensure optional contact_email columns exist
alter table if exists public.profiles
  add column if not exists contact_email text;

alter table if exists public.gurus
  add column if not exists contact_email text;

-- 2) profiles.email <- auth.users.email (null/blank only)
update public.profiles p
set email = lower(trim(au.email))
from auth.users au
where au.id = coalesce(p.user_id, p.id)
  and nullif(trim(au.email), '') is not null
  and nullif(trim(coalesce(p.email, '')), '') is null;

-- 3) gurus.email <- auth.users.email (null/blank only)
update public.gurus g
set email = lower(trim(au.email))
from auth.users au
where au.id = g.user_id
  and nullif(trim(au.email), '') is not null
  and nullif(trim(coalesce(g.email, '')), '') is null;

-- 4) gurus.email <- profiles.email (null/blank only)
update public.gurus g
set email = lower(trim(p.email))
from public.profiles p
where coalesce(g.user_id, g.profile_id) = coalesce(p.user_id, p.id)
  and nullif(trim(p.email), '') is not null
  and nullif(trim(coalesce(g.email, '')), '') is null;

-- 5) Stripe: account exists + blank/not_started status -> Started (not Ready)
update public.gurus
set stripe_connect_status = 'onboarding_started'
where nullif(trim(coalesce(stripe_account_id, '')), '') is not null
  and (
    nullif(trim(coalesce(stripe_connect_status, '')), '') is null
    or lower(trim(stripe_connect_status)) = 'not_started'
  )
  and coalesce(charges_enabled, false) = false
  and coalesce(payouts_enabled, false) = false;
