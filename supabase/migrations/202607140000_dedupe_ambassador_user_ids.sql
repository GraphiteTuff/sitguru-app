-- Resolve duplicate ambassadors.user_id values before the signup provisioning RPC
-- creates the ambassadors_user_id_key unique index.
--
-- This migration does not delete Ambassador records. It keeps the strongest
-- row connected to the Auth user and detaches only the duplicate rows by
-- setting their user_id to null. Every detached row is recorded for review.

create extension if not exists pgcrypto;

alter table if exists public.ambassadors
  add column if not exists user_id uuid,
  add column if not exists status text,
  add column if not exists referral_code text,
  add column if not exists dashboard_enabled boolean default false,
  add column if not exists login_enabled boolean default false,
  add column if not exists updated_at timestamptz;

create table if not exists public.ambassador_user_id_dedup_audit (
  id uuid primary key default gen_random_uuid(),
  duplicated_user_id uuid not null,
  kept_ambassador_id uuid,
  detached_ambassador_id uuid,
  kept_row_reference text not null,
  detached_row_reference text not null,
  reason text not null default 'duplicate_user_id_before_unique_index',
  created_at timestamptz not null default now()
);

create unique index if not exists ambassador_user_id_dedup_audit_row_key
  on public.ambassador_user_id_dedup_audit(
    duplicated_user_id,
    detached_row_reference
  );

-- Record exactly which row will remain connected and which rows will be
-- detached. ctid is used as the row reference so this also works if an older
-- ambassadors table contains a missing or duplicated id value.
with ranked as (
  select
    a.ctid as row_reference,
    a.id,
    a.user_id,
    row_number() over (
      partition by a.user_id
      order by
        case
          when lower(coalesce(a.status, '')) = 'active' then 0
          when lower(coalesce(a.status, '')) not in (
            'archived',
            'inactive',
            'suspended',
            'not_a_fit'
          ) then 1
          else 2
        end,
        case when a.dashboard_enabled is true then 0 else 1 end,
        case when a.login_enabled is true then 0 else 1 end,
        case
          when nullif(trim(coalesce(a.referral_code, '')), '') is not null then 0
          else 1
        end,
        a.updated_at desc nulls last,
        a.id nulls last,
        a.ctid
    ) as row_rank
  from public.ambassadors a
  where a.user_id is not null
), duplicate_pairs as (
  select
    duplicate_row.user_id as duplicated_user_id,
    kept_row.id as kept_ambassador_id,
    duplicate_row.id as detached_ambassador_id,
    kept_row.row_reference::text as kept_row_reference,
    duplicate_row.row_reference::text as detached_row_reference
  from ranked duplicate_row
  join ranked kept_row
    on kept_row.user_id = duplicate_row.user_id
   and kept_row.row_rank = 1
  where duplicate_row.row_rank > 1
)
insert into public.ambassador_user_id_dedup_audit (
  duplicated_user_id,
  kept_ambassador_id,
  detached_ambassador_id,
  kept_row_reference,
  detached_row_reference,
  reason
)
select
  duplicated_user_id,
  kept_ambassador_id,
  detached_ambassador_id,
  kept_row_reference,
  detached_row_reference,
  'Detached duplicate Ambassador row before enforcing one workspace per Auth user.'
from duplicate_pairs
on conflict (duplicated_user_id, detached_row_reference) do nothing;

-- Detach all but the strongest row for each duplicated Auth user.
with ranked as (
  select
    a.ctid as row_reference,
    a.user_id,
    row_number() over (
      partition by a.user_id
      order by
        case
          when lower(coalesce(a.status, '')) = 'active' then 0
          when lower(coalesce(a.status, '')) not in (
            'archived',
            'inactive',
            'suspended',
            'not_a_fit'
          ) then 1
          else 2
        end,
        case when a.dashboard_enabled is true then 0 else 1 end,
        case when a.login_enabled is true then 0 else 1 end,
        case
          when nullif(trim(coalesce(a.referral_code, '')), '') is not null then 0
          else 1
        end,
        a.updated_at desc nulls last,
        a.id nulls last,
        a.ctid
    ) as row_rank
  from public.ambassadors a
  where a.user_id is not null
), rows_to_detach as (
  select row_reference
  from ranked
  where row_rank > 1
)
update public.ambassadors a
set
  user_id = null,
  updated_at = now()
from rows_to_detach duplicate_row
where a.ctid = duplicate_row.row_reference;

-- Stop with a clear diagnostic if a database trigger or other constraint kept
-- any duplicate user_id values in place.
do $$
declare
  remaining_duplicate record;
begin
  select
    a.user_id,
    count(*) as duplicate_count
  into remaining_duplicate
  from public.ambassadors a
  where a.user_id is not null
  group by a.user_id
  having count(*) > 1
  order by count(*) desc
  limit 1;

  if found then
    raise exception
      'Duplicate ambassadors.user_id remains after cleanup. user_id: %, rows: %',
      remaining_duplicate.user_id,
      remaining_duplicate.duplicate_count;
  end if;
end;
$$;

create unique index if not exists ambassadors_user_id_key
  on public.ambassadors(user_id)
  where user_id is not null;

comment on table public.ambassador_user_id_dedup_audit is
  'Audit record of duplicate Ambassador rows detached before enforcing one connected Ambassador workspace per Auth user.';