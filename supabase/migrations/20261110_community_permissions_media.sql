-- Additive refinement. Apply only to isolated infrastructure until approved.
alter table public.community_studio_submissions
  add column if not exists public_consent boolean not null default false,
  add column if not exists social_consent boolean not null default false,
  add column if not exists social_consent_at timestamptz,
  add column if not exists media_safe boolean not null default false,
  add column if not exists features_client_pet boolean not null default false,
  add column if not exists booking_id uuid references public.bookings(id),
  add column if not exists parent_user_id uuid references auth.users(id),
  add column if not exists parent_permission_status text not null default 'not_required'
    check (parent_permission_status in ('not_required','pending','approved','declined','revoked')),
  add column if not exists parent_social_consent boolean not null default false,
  add column if not exists parent_decided_at timestamptz;
-- Legacy combined consent is deliberately NOT migrated into either new grant.
create table if not exists public.community_studio_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  raw_path text not null,
  safe_path text,
  mime text not null,
  size_bytes integer not null check(size_bytes between 1 and 26214400),
  created_at timestamptz not null default now(),
  verified_at timestamptz
);
alter table public.community_studio_uploads enable row level security;
revoke all on public.community_studio_uploads from anon,authenticated;
grant all on public.community_studio_uploads to service_role;
create index if not exists community_parent_queue on public.community_studio_submissions(parent_user_id,parent_permission_status);
create or replace function public.community_studio_rights_guard() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.status in ('approved','scheduled','published') and (
    not new.public_consent or (new.image_path <> '' and not new.media_safe) or
    (new.features_client_pet and (new.parent_user_id is null or new.parent_permission_status <> 'approved'))
  ) then raise exception 'Verified media and publication rights are required'; end if;
  return new;
end; $$;
drop trigger if exists community_studio_rights on public.community_studio_submissions;
create trigger community_studio_rights before insert or update on public.community_studio_submissions
  for each row execute function public.community_studio_rights_guard();
revoke all on function public.community_studio_rights_guard() from public,anon,authenticated;
update storage.buckets set file_size_limit=26214400,
  allowed_mime_types=array['image/png','image/jpeg','image/webp','video/mp4','video/quicktime']
  where id='sitguru-community-private';
