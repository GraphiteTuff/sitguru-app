-- Additive Community Studio. Apply to an isolated development project first.
-- No production data changes, external messages, or duplicate M365 resources.
create table if not exists public.community_studio_submissions (
  id uuid primary key default gen_random_uuid(),
  submitter_user_id uuid not null references auth.users(id) on delete restrict,
  submitter_name text not null default '',
  intern_id uuid references public.internship_interns(id) on delete set null,
  kind text not null check (kind in ('pack','pet_of_week','gallery','guru_spotlight')),
  title text not null check (char_length(title) between 1 and 160),
  pet_name text not null default '' check (char_length(pet_name) <= 100),
  story text not null default '' check (char_length(story) <= 5000),
  location text not null default '' check (char_length(location) <= 120),
  status text not null default 'draft' check (status in ('draft','pending','changes_requested','rejected','approved','scheduled','published','archived')),
  consent boolean not null default false,
  consent_at timestamptz,
  image_path text not null default '',
  image_mime text not null default '',
  content_id uuid references public.internship_content(id) on delete set null,
  task_id uuid references public.internship_tasks(id) on delete set null,
  feedback text not null default '' check (char_length(feedback) <= 3000),
  approved_by uuid references auth.users(id) on delete restrict,
  approved_at timestamptz,
  publish_at timestamptz,
  week_of date,
  updated_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_studio_publication_approved check (
    status not in ('approved','scheduled','published') or (consent and consent_at is not null and approved_by is not null and approved_at is not null)
  ),
  constraint community_studio_publication_date check (status not in ('scheduled','published') or publish_at is not null),
  constraint community_studio_week_edition check (kind <> 'pet_of_week' or status not in ('scheduled','published') or (week_of is not null and extract(isodow from week_of) = 1))
);

create index if not exists community_studio_owner_idx on public.community_studio_submissions(submitter_user_id,created_at desc);
create index if not exists community_studio_review_idx on public.community_studio_submissions(status,publish_at,created_at desc);
create index if not exists community_studio_intern_idx on public.community_studio_submissions(intern_id);
create unique index if not exists community_studio_pet_edition_idx on public.community_studio_submissions(week_of) where kind = 'pet_of_week' and status in ('scheduled','published');

create table if not exists public.community_studio_events (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.community_studio_submissions(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete restrict,
  from_status text,
  to_status text not null,
  feedback text not null default '',
  created_at timestamptz not null default now()
);

create or replace function public.community_studio_record_event() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
create or replace function public.community_studio_audit_event() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.community_studio_events(submission_id,actor_user_id,from_status,to_status,feedback)
  values(new.id,new.updated_by,case when TG_OP = 'UPDATE' then old.status else null end,new.status,new.feedback);
  return new;
end;
$$;
drop trigger if exists community_studio_timestamp on public.community_studio_submissions;
create trigger community_studio_timestamp before update on public.community_studio_submissions for each row execute function public.community_studio_record_event();
drop trigger if exists community_studio_audit on public.community_studio_submissions;
create trigger community_studio_audit after insert or update on public.community_studio_submissions for each row execute function public.community_studio_audit_event();

-- All access goes through the existing authenticated, role-scoped server layer.
-- No browser or anonymous direct reads: draft photos and submitter identities stay private.
alter table public.community_studio_submissions enable row level security;
alter table public.community_studio_events enable row level security;
revoke all on public.community_studio_submissions,public.community_studio_events from anon,authenticated;
grant all on public.community_studio_submissions,public.community_studio_events to service_role;
revoke all on function public.community_studio_record_event(),public.community_studio_audit_event() from public,anon,authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('sitguru-community-private','sitguru-community-private',false,4194304,array['image/png','image/jpeg','image/webp']::text[])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

-- A restrictive fence also protects this new bucket if an older installation
-- has broad permissive storage policies. Service role bypasses this fence.
drop policy if exists community_studio_private_fence on storage.objects;
create policy community_studio_private_fence on storage.objects as restrictive
  for all to anon,authenticated
  using (bucket_id <> 'sitguru-community-private')
  with check (bucket_id <> 'sitguru-community-private');
