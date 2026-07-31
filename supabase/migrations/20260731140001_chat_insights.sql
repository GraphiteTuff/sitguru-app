-- Chat insights tally + dynamic help articles published from admin conversion.
-- Safe for legacy-friendly deploys: IF NOT EXISTS throughout.

create table if not exists public.homepage_chat_insights (
  insight_id uuid primary key default gen_random_uuid(),
  raw_question_text text not null,
  question_key text
    generated always as (
      lower(trim(regexp_replace(raw_question_text, '\s+', ' ', 'g')))
    ) stored,
  clean_ai_topic_category text not null default 'General Inquiry',
  frequency_tally_count integer not null default 1
    check (frequency_tally_count >= 1),
  is_converted_to_help_article boolean not null default false,
  last_asked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  converted_article_slug text,
  converted_at timestamptz
);

create unique index if not exists homepage_chat_insights_question_key_uidx
  on public.homepage_chat_insights (question_key);

create index if not exists homepage_chat_insights_tally_idx
  on public.homepage_chat_insights (frequency_tally_count desc, last_asked_at desc);

create index if not exists homepage_chat_insights_topic_idx
  on public.homepage_chat_insights (clean_ai_topic_category);

create index if not exists homepage_chat_insights_converted_idx
  on public.homepage_chat_insights (is_converted_to_help_article);

-- Atomic frequency upsert for matching normalized questions
create or replace function public.upsert_homepage_chat_insight(
  p_raw_question text,
  p_topic text default 'General Inquiry'
)
returns public.homepage_chat_insights
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.homepage_chat_insights;
  v_clean text;
  v_topic text;
begin
  v_clean := left(trim(coalesce(p_raw_question, '')), 2000);
  if v_clean = '' then
    raise exception 'raw_question_text required';
  end if;

  v_topic := left(trim(coalesce(nullif(p_topic, ''), 'General Inquiry')), 120);

  insert into public.homepage_chat_insights (
    raw_question_text,
    clean_ai_topic_category,
    frequency_tally_count,
    last_asked_at
  )
  values (
    v_clean,
    v_topic,
    1,
    now()
  )
  on conflict (question_key)
  do update set
    frequency_tally_count = public.homepage_chat_insights.frequency_tally_count + 1,
    last_asked_at = now(),
    -- Keep first topic unless still general and a richer topic arrives
    clean_ai_topic_category = case
      when public.homepage_chat_insights.clean_ai_topic_category = 'General Inquiry'
        and excluded.clean_ai_topic_category <> 'General Inquiry'
      then excluded.clean_ai_topic_category
      else public.homepage_chat_insights.clean_ai_topic_category
    end
  returning * into v_row;

  return v_row;
end;
$$;

-- Dynamic Help Center articles promoted from chat insights
create table if not exists public.help_center_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  href text not null,
  title text not null,
  summary text not null,
  body text,
  audience text not null default 'all',
  category text not null default 'Pet Parent Support',
  tags text[] not null default '{}'::text[],
  keywords text[] not null default '{}'::text[],
  source_insight_id uuid references public.homepage_chat_insights(insight_id) on delete set null,
  published_by uuid,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists help_center_articles_slug_uidx
  on public.help_center_articles (slug);

create index if not exists help_center_articles_published_idx
  on public.help_center_articles (is_published, updated_at desc);

alter table public.homepage_chat_insights enable row level security;
alter table public.help_center_articles enable row level security;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_admin_user'
  ) then
    execute $pol$
      drop policy if exists "Admins manage homepage chat insights"
        on public.homepage_chat_insights;
      create policy "Admins manage homepage chat insights"
        on public.homepage_chat_insights
        for all
        using (public.is_admin_user())
        with check (public.is_admin_user());

      drop policy if exists "Admins manage help center articles"
        on public.help_center_articles;
      create policy "Admins manage help center articles"
        on public.help_center_articles
        for all
        using (public.is_admin_user())
        with check (public.is_admin_user());
    $pol$;
  end if;
end $$;

drop policy if exists "Anyone can read published help center articles"
  on public.help_center_articles;
create policy "Anyone can read published help center articles"
  on public.help_center_articles
  for select
  using (is_published = true);

comment on table public.homepage_chat_insights is
  'Aggregated public homepage AI questions for Admin Chat Insights tally.';
comment on table public.help_center_articles is
  'Help articles published from Admin insight conversion (merged with static catalog).';
