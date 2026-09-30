-- Public cards do not expose the referral_codes primary key.
-- Click tracking resolves that id on the server from the public code.
-- Ordinary signed-in users cannot read raw referral_events.
-- This does not add creator_ambassador.

drop view if exists public.referral_code_public;

create view public.referral_code_public
with (security_invoker = false) as
select
  upper(btrim(c.code)) as code,
  c.slug,
  c.status,
  c.campaign_type,
  c.owner_type,
  coalesce(
    nullif(btrim(a.display_name), ''),
    nullif(btrim(a.full_name), ''),
    nullif(btrim(p.business_name), ''),
    'SitGuru'
  ) as display_name,
  coalesce(a.ambassador_type, p.partner_type, c.campaign_type) as public_type,
  coalesce(nullif(btrim(a.city), ''), nullif(btrim(p.city), '')) as city,
  coalesce(nullif(btrim(a.state), ''), nullif(btrim(p.state), '')) as state,
  nullif(btrim(a.territory), '') as territory,
  case
    when p.status = 'active' then nullif(btrim(p.website), '')
    else null
  end as website,
  case
    when p.status = 'active' then nullif(btrim(p.business_type), '')
    else null
  end as business_type,
  case
    when a.id is not null then 'ambassador'
    when p.id is not null then 'partner'
    else coalesce(c.owner_type, 'referral')
  end as entity_type
from public.referral_codes c
left join public.ambassadors a
  on a.id = c.ambassador_id
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
  )
left join public.partners p
  on p.id = c.partner_id
  and p.status = 'active'
where c.status = 'active'
  and c.deleted_at is null;

revoke all on public.referral_code_public from public;
revoke all on public.referral_code_public from anon, authenticated;
grant select on public.referral_code_public to anon, authenticated;

revoke select (id) on table public.referral_codes from anon;

drop policy if exists "Allow authenticated referral event reads" on public.referral_events;

revoke select on table public.referral_events from anon, authenticated;

notify pgrst, 'reload schema';
