-- SitGuru workspace live signals — authorized realtime sync bus.
-- Internship/Growth business tables stay service-role only.
-- Clients subscribe only to their own signal rows (RLS), never to private records.
-- Payloads are sync metadata only (no W-9 contents, compensation, or tax docs).

begin;

create table if not exists public.sitguru_live_signals (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  recipient_user_id uuid not null,
  event_type text not null,
  resource_type text not null default '',
  resource_id text not null default '',
  scope text not null default '',
  paths text[] not null default '{}',
  actor_user_id uuid null,
  actor_label text not null default '',
  resource_version text not null default '',
  created_at timestamptz not null default now(),
  constraint sitguru_live_signals_event_recipient_unique unique (event_id, recipient_user_id)
);

create index if not exists sitguru_live_signals_recipient_created_idx
  on public.sitguru_live_signals (recipient_user_id, created_at desc);

create index if not exists sitguru_live_signals_created_idx
  on public.sitguru_live_signals (created_at desc);

alter table public.sitguru_live_signals enable row level security;

revoke all on table public.sitguru_live_signals from anon, authenticated;
grant select on table public.sitguru_live_signals to authenticated;

drop policy if exists sitguru_live_signals_select_own on public.sitguru_live_signals;
create policy sitguru_live_signals_select_own
  on public.sitguru_live_signals
  for select
  to authenticated
  using (recipient_user_id = auth.uid());

do $$
begin
  alter publication supabase_realtime add table public.sitguru_live_signals;
exception
  when duplicate_object then null;
  when undefined_table then null;
  when undefined_object then null;
end $$;

commit;
