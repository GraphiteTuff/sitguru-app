-- Last-attempt tracking makes automatic Meta post imports idempotent and rate-controlled.
-- Read and write only through authorized server-side code; no client Data API grants.
create table if not exists public.growth_social_meta_sync_status (
  platform text primary key check (platform in ('facebook','instagram')),
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  imported_posts integer not null default 0 check(imported_posts >= 0),
  status text not null default 'never' check(status in ('never','attempted','success','error')),
  updated_at timestamptz not null default now()
);
alter table public.growth_social_meta_sync_status enable row level security;
revoke all on public.growth_social_meta_sync_status from anon, authenticated;
grant select, insert, update, delete on public.growth_social_meta_sync_status to service_role;
