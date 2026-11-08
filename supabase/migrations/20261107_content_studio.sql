-- Content Studio fields on the existing intern content records.
-- Does not create a second content system or publish to social networks.

alter table public.internship_content
  add column if not exists caption text not null default '',
  add column if not exists content_type text not null default 'social_post',
  add column if not exists planned_at timestamptz,
  add column if not exists task_id uuid references public.internship_tasks(id) on delete set null,
  add column if not exists campaign_id uuid references public.internship_campaigns(id) on delete set null,
  add column if not exists published_at timestamptz,
  add column if not exists published_by uuid,
  add column if not exists approved_snapshot text not null default '';

create table if not exists public.internship_content_assets (
  content_id uuid not null references public.internship_content(id) on delete cascade,
  asset_id uuid not null references public.growth_brand_assets(id) on delete restrict,
  primary key (content_id, asset_id)
);

alter table public.internship_content_assets enable row level security;
revoke all on table public.internship_content_assets from anon, authenticated;

create index if not exists internship_content_review_idx
  on public.internship_content (intern_id, review_stage, created_at desc);
