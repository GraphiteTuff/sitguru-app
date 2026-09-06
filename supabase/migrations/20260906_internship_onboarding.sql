-- Intern onboarding acknowledgments and private wet-ink scans.
-- Portal and Growth workplace stay locked until electronic sign + uploaded signed page.

create table if not exists public.internship_onboarding_acknowledgments (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null unique references public.internship_interns(id) on delete cascade,
  policy_version text not null default '',
  typed_legal_name text not null default '',
  access_rules_accepted_at timestamptz,
  electronic_signed_at timestamptz,
  signer_user_id uuid,
  signer_email text not null default '',
  wet_ink_file_name text not null default '',
  wet_ink_storage_path text not null default '',
  wet_ink_mime_type text not null default '',
  wet_ink_file_size integer not null default 0,
  wet_ink_uploaded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists internship_onboarding_intern_idx
  on public.internship_onboarding_acknowledgments (intern_id);

alter table public.internship_onboarding_acknowledgments enable row level security;
revoke all on table public.internship_onboarding_acknowledgments from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'internship-confidential',
  'internship-confidential',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]::text[]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
