-- Global Omnichannel Communications Intelligence Ledger
-- Aggregates HOMEPAGE_LEAD + ACTIVE_WALK + ADMIN_SUPPORT question friction.

create table if not exists public.global_chat_insights (
  insight_id uuid primary key default gen_random_uuid(),
  text_string_hash text not null,
  core_question_summary text not null,
  ai_assigned_category text not null default 'General Inquiry',
  channel_source_enum text not null
    check (channel_source_enum in ('HOMEPAGE_LEAD', 'ACTIVE_WALK', 'ADMIN_SUPPORT')),
  frequency_tally_count integer not null default 1
    check (frequency_tally_count >= 1),
  is_converted_to_article boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  converted_article_slug text,
  converted_at timestamptz,
  is_friction_flag boolean not null default false
);

create unique index if not exists global_chat_insights_hash_channel_uidx
  on public.global_chat_insights (text_string_hash, channel_source_enum);

create index if not exists global_chat_insights_tally_idx
  on public.global_chat_insights (frequency_tally_count desc, updated_at desc);

create index if not exists global_chat_insights_channel_idx
  on public.global_chat_insights (channel_source_enum);

create index if not exists global_chat_insights_category_idx
  on public.global_chat_insights (ai_assigned_category);

create index if not exists global_chat_insights_friction_idx
  on public.global_chat_insights (is_friction_flag)
  where is_friction_flag = true;

create or replace function public.upsert_global_chat_insight(
  p_text_hash text,
  p_summary text,
  p_category text,
  p_channel text,
  p_is_friction boolean default false
)
returns public.global_chat_insights
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.global_chat_insights;
  v_hash text;
  v_summary text;
  v_category text;
  v_channel text;
begin
  v_hash := left(trim(coalesce(p_text_hash, '')), 128);
  v_summary := left(trim(coalesce(p_summary, '')), 2000);
  v_category := left(trim(coalesce(nullif(p_category, ''), 'General Inquiry')), 120);
  v_channel := upper(trim(coalesce(p_channel, '')));

  if v_hash = '' or v_summary = '' then
    raise exception 'text hash and summary required';
  end if;

  if v_channel not in ('HOMEPAGE_LEAD', 'ACTIVE_WALK', 'ADMIN_SUPPORT') then
    raise exception 'invalid channel_source_enum';
  end if;

  insert into public.global_chat_insights (
    text_string_hash,
    core_question_summary,
    ai_assigned_category,
    channel_source_enum,
    frequency_tally_count,
    is_friction_flag,
    updated_at
  )
  values (
    v_hash,
    v_summary,
    v_category,
    v_channel,
    1,
    coalesce(p_is_friction, false),
    now()
  )
  on conflict (text_string_hash, channel_source_enum)
  do update set
    frequency_tally_count = public.global_chat_insights.frequency_tally_count + 1,
    updated_at = now(),
    is_friction_flag = public.global_chat_insights.is_friction_flag or excluded.is_friction_flag,
    ai_assigned_category = case
      when public.global_chat_insights.ai_assigned_category = 'General Inquiry'
        and excluded.ai_assigned_category <> 'General Inquiry'
      then excluded.ai_assigned_category
      else public.global_chat_insights.ai_assigned_category
    end,
    core_question_summary = public.global_chat_insights.core_question_summary
  returning * into v_row;

  return v_row;
end;
$$;

alter table public.global_chat_insights enable row level security;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_admin_user'
  ) then
    execute $pol$
      drop policy if exists "Admins manage global chat insights"
        on public.global_chat_insights;
      create policy "Admins manage global chat insights"
        on public.global_chat_insights
        for all
        using (public.is_admin_user())
        with check (public.is_admin_user());
    $pol$;
  end if;
end $$;

comment on table public.global_chat_insights is
  'Omnichannel communications intelligence ledger across homepage, walk, and admin support channels.';
