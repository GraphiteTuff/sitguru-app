-- Company Brand Kit. Files stay in a private bucket and are served
-- only after a server-side role check. Intern draft files remain on
-- internship_work_attachments.

create table if not exists public.growth_brand_assets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null,
  tags text[] not null default '{}',
  approval_status text not null default 'draft',
  file_name text not null,
  mime_type text not null,
  file_size bigint not null,
  storage_bucket text not null default 'sitguru-brand-kit',
  storage_path text not null,
  version integer not null default 1,
  version_group uuid not null,
  replaces_id uuid references public.growth_brand_assets(id) on delete set null,
  verified boolean not null default false,
  uploaded_by uuid not null,
  uploaded_by_name text not null default '',
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint growth_brand_assets_category_check check (
    category in (
      'official_logos',
      'header_footer_logos',
      'seasonal',
      'social_graphics',
      'flyers',
      'videos',
      'guidelines',
      'templates',
      'campaign_materials'
    )
  ),
  constraint growth_brand_assets_status_check check (
    approval_status in ('draft', 'pending_review', 'approved', 'archived')
  )
);

create index if not exists growth_brand_assets_library_idx
  on public.growth_brand_assets (approval_status, category, created_at desc);

create table if not exists public.growth_brand_asset_events (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references public.growth_brand_assets(id) on delete set null,
  asset_title text not null default '',
  actor_id uuid not null,
  action text not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists growth_brand_asset_events_asset_idx
  on public.growth_brand_asset_events (asset_id, created_at desc);

alter table public.growth_brand_assets enable row level security;
alter table public.growth_brand_asset_events enable row level security;
revoke all on table public.growth_brand_assets from anon, authenticated;
revoke all on table public.growth_brand_asset_events from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'sitguru-brand-kit',
  'sitguru-brand-kit',
  false,
  26214400,
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
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
