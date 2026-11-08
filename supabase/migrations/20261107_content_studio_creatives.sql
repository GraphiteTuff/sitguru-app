-- Private intern creative drafts. Not the public internship file bucket
-- and not the Brand Kit master library.

alter table public.internship_content
  add column if not exists creative_path text not null default '',
  add column if not exists creative_mime text not null default '',
  add column if not exists creative_name text not null default '';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'sitguru-content-drafts',
  'sitguru-content-drafts',
  false,
  26214400,
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]::text[]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
