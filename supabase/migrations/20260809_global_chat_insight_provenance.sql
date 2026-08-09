-- Capture which AI companion avatar and which page produced each chat insight.

alter table public.global_chat_insights
  add column if not exists companion_hits jsonb not null default '{}'::jsonb;

alter table public.global_chat_insights
  add column if not exists page_hits jsonb not null default '{}'::jsonb;

alter table public.global_chat_insights
  add column if not exists last_companion_key text;

alter table public.global_chat_insights
  add column if not exists last_source_page_path text;

comment on column public.global_chat_insights.companion_hits is
  'Per-avatar ask tallies, e.g. {"rogue":3,"scout":1}.';
comment on column public.global_chat_insights.page_hits is
  'Per-page ask tallies, e.g. {"/":4,"/become-a-guru":2}.';
comment on column public.global_chat_insights.last_companion_key is
  'Most recent companion avatar key (rogue|taco|scout|admin).';
comment on column public.global_chat_insights.last_source_page_path is
  'Most recent page path where this question was asked.';

create or replace function public.upsert_global_chat_insight(
  p_text_hash text,
  p_summary text,
  p_category text,
  p_channel text,
  p_is_friction boolean default false,
  p_companion text default null,
  p_page_path text default null
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
  v_companion text;
  v_page text;
begin
  v_hash := left(trim(coalesce(p_text_hash, '')), 128);
  v_summary := left(trim(coalesce(p_summary, '')), 2000);
  v_category := left(trim(coalesce(nullif(p_category, ''), 'General Inquiry')), 120);
  v_channel := upper(trim(coalesce(p_channel, '')));
  v_companion := lower(left(trim(coalesce(p_companion, '')), 40));
  v_page := left(trim(coalesce(p_page_path, '')), 300);

  if v_hash = '' or v_summary = '' then
    raise exception 'text hash and summary required';
  end if;

  if v_channel not in ('HOMEPAGE_LEAD', 'ACTIVE_WALK', 'ADMIN_SUPPORT') then
    raise exception 'invalid channel_source_enum';
  end if;

  if v_companion = '' then
    v_companion := case v_channel
      when 'ADMIN_SUPPORT' then 'admin'
      when 'ACTIVE_WALK' then 'rogue'
      else 'rogue'
    end;
  end if;

  if v_page = '' then
    v_page := case v_channel
      when 'ADMIN_SUPPORT' then '/admin/messages'
      when 'ACTIVE_WALK' then '/pawreport'
      else '/'
    end;
  end if;

  insert into public.global_chat_insights (
    text_string_hash,
    core_question_summary,
    ai_assigned_category,
    channel_source_enum,
    frequency_tally_count,
    is_friction_flag,
    companion_hits,
    page_hits,
    last_companion_key,
    last_source_page_path,
    updated_at
  )
  values (
    v_hash,
    v_summary,
    v_category,
    v_channel,
    1,
    coalesce(p_is_friction, false),
    jsonb_build_object(v_companion, 1),
    jsonb_build_object(v_page, 1),
    v_companion,
    v_page,
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
    core_question_summary = public.global_chat_insights.core_question_summary,
    last_companion_key = v_companion,
    last_source_page_path = v_page,
    companion_hits =
      coalesce(public.global_chat_insights.companion_hits, '{}'::jsonb)
      || jsonb_build_object(
        v_companion,
        coalesce(
          (public.global_chat_insights.companion_hits ->> v_companion)::integer,
          0
        ) + 1
      ),
    page_hits =
      coalesce(public.global_chat_insights.page_hits, '{}'::jsonb)
      || jsonb_build_object(
        v_page,
        coalesce(
          (public.global_chat_insights.page_hits ->> v_page)::integer,
          0
        ) + 1
      )
  returning * into v_row;

  return v_row;
end;
$$;
