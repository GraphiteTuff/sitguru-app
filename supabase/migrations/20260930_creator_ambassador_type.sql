-- Additive Creator Ambassador subtype.
-- Does not delete Ambassador rows, referral codes, or bookings.
-- Apply only after review. Not executed by this change.

alter table public.ambassadors
  drop constraint if exists ambassadors_ambassador_type_check;

alter table public.ambassadors
  add constraint ambassadors_ambassador_type_check
  check (
    ambassador_type = any (
      array[
        'community_ambassador'::text,
        'local_partner_ambassador'::text,
        'city_captain'::text,
        'campus_ambassador'::text,
        'neighborhood_ambassador'::text,
        'creator_ambassador'::text
      ]
    )
  );

alter table public.ambassadors
  add column if not exists primary_platform text,
  add column if not exists instagram_handle text,
  add column if not exists tiktok_handle text,
  add column if not exists youtube_handle text,
  add column if not exists facebook_handle text,
  add column if not exists website_url text,
  add column if not exists market text,
  add column if not exists content_niche text,
  add column if not exists disclosure_required boolean not null default true;

comment on column public.ambassadors.ambassador_type is
  'Ambassador subtype. creator_ambassador uses the same login, referral code, and /r/{code} URL.';
