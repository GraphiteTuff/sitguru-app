-- Public card for /r/{code}. Anonymous visitors can read only these columns.
-- security_invoker is false so the view owner can read ambassadors while
-- anon and authenticated still cannot select the base table.
-- Does not add creator_ambassador or change existing Ambassador rows.

create or replace view public.ambassador_public_referrals
with (security_invoker = false) as
select
  upper(btrim(a.referral_code)) as referral_code,
  coalesce(
    nullif(btrim(a.display_name), ''),
    nullif(btrim(a.full_name), ''),
    'a SitGuru Ambassador'
  ) as display_name,
  a.ambassador_type,
  nullif(btrim(a.city), '') as city,
  nullif(btrim(a.state), '') as state,
  nullif(btrim(a.territory), '') as territory,
  case
    when a.photo_approved is true
      and nullif(btrim(a.ambassador_photo_url), '') is not null
      then a.ambassador_photo_url
    else null
  end as photo_url
from public.ambassadors a
where a.referral_code is not null
  and btrim(a.referral_code) <> ''
  and coalesce(a.is_archived, false) = false
  and a.archived_at is null
  and lower(coalesce(a.status, '')) not in (
    'archived',
    'paused',
    'suspended',
    'inactive',
    'disabled',
    'declined',
    'not_a_fit',
    'rejected'
  );

comment on view public.ambassador_public_referrals is
  'Explicit public Ambassador card for /r/{code}. Columns are display name, code, type, city, state, territory, and an approved photo. No email, phone, notes, payout, or user id.';

revoke all on public.ambassador_public_referrals from public;
revoke all on public.ambassador_public_referrals from anon, authenticated;
grant select on public.ambassador_public_referrals to anon, authenticated;

create unique index if not exists ambassador_referrals_one_acquisition_per_user
  on public.ambassador_referrals (referred_user_id)
  where referred_user_id is not null;
