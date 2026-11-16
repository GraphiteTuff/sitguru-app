-- SitGuru TikTok Content Studio / Community Studio export audit.
-- Keep third-party credentials out of this table and access via service role only.
create table if not exists public.tiktok_content_transfers (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('internship_content','community_studio_submissions')),
  source_id uuid not null,
  source_revision text not null,
  requested_by uuid not null,
  reviewed_by uuid not null,
  operation text not null default 'inbox_upload' check (operation = 'inbox_upload'),
  environment text not null check (environment in ('sandbox','production')),
  status text not null default 'initiating' check (
    status in ('initiating','uploading','sent_to_tiktok','inbox_delivered','published','failed')
  ),
  publish_id text unique,
  error_code text,
  provider_status text,
  public_post_id text,
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  checked_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint tiktok_content_transfer_idempotency unique (source_type, source_id, source_revision)
);
create index if not exists tiktok_content_transfers_status_idx on public.tiktok_content_transfers(status,updated_at);
create index if not exists tiktok_content_transfers_source_idx on public.tiktok_content_transfers(source_type,source_id,created_at desc);
alter table public.tiktok_content_transfers enable row level security;
revoke all on public.tiktok_content_transfers from anon, authenticated;
grant select, insert, update, delete on public.tiktok_content_transfers to service_role;
comment on table public.tiktok_content_transfers is
  'Server-only TikTok export audit. An inbox draft does not mean a published post. Media/parent consent must be checked again before export.';