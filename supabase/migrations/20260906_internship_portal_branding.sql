-- Intern portal personalization, authorized school branding, and work-area evidence files.
-- School logos stay hidden until the university grants permission.

alter table public.internship_universities
  add column if not exists header_title text not null default '',
  add column if not exists header_program text not null default '',
  add column if not exists logo_url text not null default '',
  add column if not exists logo_storage_path text not null default '',
  add column if not exists logo_permission_granted boolean not null default false,
  add column if not exists logo_permission_notes text not null default '';

alter table public.internship_interns
  add column if not exists preferred_name text not null default '',
  add column if not exists headline text not null default '',
  add column if not exists bio text not null default '',
  add column if not exists linkedin_url text not null default '',
  add column if not exists portal_theme text not null default 'emerald',
  add column if not exists avatar_url text not null default '',
  add column if not exists avatar_storage_path text not null default '';

create table if not exists public.internship_work_attachments (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.internship_interns(id) on delete cascade,
  item_type text not null,
  item_id text not null,
  file_name text not null,
  file_url text not null,
  storage_bucket text not null default 'internship-assets',
  storage_path text not null,
  mime_type text not null default '',
  file_size integer not null default 0,
  caption text not null default '',
  contributes_to_final boolean not null default true,
  uploaded_by_role text not null default 'intern',
  created_at timestamptz not null default now()
);

create index if not exists internship_work_attachments_intern_idx
  on public.internship_work_attachments (intern_id, item_type, item_id, created_at desc);

alter table public.internship_work_attachments enable row level security;
revoke all on table public.internship_work_attachments from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'internship-assets',
  'internship-assets',
  true,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'internship_assets_public_read'
  ) then
    create policy internship_assets_public_read on storage.objects
      for select to public
      using (bucket_id = 'internship-assets');
  end if;
end $$;
