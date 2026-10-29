-- Ava's own growth work. Existing campaigns, bookings, and profiles stay the source of verified results.

begin;

create table if not exists manager_work_initiatives (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  title text not null,
  objective text not null default '',
  audience text not null default '',
  idea text not null default '',
  channel text not null default '',
  call_to_action text not null default '',
  measurement text not null default '',
  category text not null default 'Other',
  status text not null default 'Idea',
  start_on date,
  due_on date,
  notes text not null default '',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists manager_work_reviews (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  week_start date not null,
  happened text not null default '',
  why text not null default '',
  learning text not null default '',
  next_step text not null default '',
  hours_note text not null default '',
  ceo_note text not null default '',
  created_at timestamptz not null default now(),
  unique (owner_user_id, week_start)
);

create table if not exists manager_work_goals (
  owner_user_id uuid primary key,
  goals jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists manager_work_content (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  title text not null,
  caption text not null default '',
  channel text not null default 'Instagram',
  planned_on date,
  status text not null default 'Draft',
  published_url text not null default '',
  activity_note text not null default '',
  happened text not null default '',
  learning text not null default '',
  next_step text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists manager_work_outreach (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  partner_name text not null,
  contact_name text not null default '',
  partner_kind text not null default 'Community event',
  opportunity text not null default '',
  sitguru_benefit text not null default '',
  partner_benefit text not null default '',
  who_benefits text not null default '',
  proposed_activity text not null default '',
  commitment text not null default 'Conversation',
  leadership_approved boolean not null default false,
  status text not null default 'Identified',
  follow_up_on date,
  next_action text not null default '',
  lesson text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists manager_work_surveys (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  code text not null unique,
  title text not null,
  question text not null,
  audience text not null default 'Public visitors',
  choices jsonb not null default '[]'::jsonb,
  start_on date,
  end_on date,
  status text not null default 'Draft',
  learning text not null default '',
  next_step text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists manager_work_responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references manager_work_surveys(id) on delete cascade,
  respondent_key text not null,
  choice text not null default '',
  note text not null default '',
  created_at timestamptz not null default now(),
  unique (survey_id, respondent_key)
);

create index if not exists manager_work_initiatives_owner_idx on manager_work_initiatives (owner_user_id, updated_at desc);
create index if not exists manager_work_outreach_owner_idx on manager_work_outreach (owner_user_id, follow_up_on);
create index if not exists manager_work_responses_survey_idx on manager_work_responses (survey_id);

alter table manager_work_initiatives enable row level security;
alter table manager_work_reviews enable row level security;
alter table manager_work_goals enable row level security;
alter table manager_work_content enable row level security;
alter table manager_work_outreach enable row level security;
alter table manager_work_surveys enable row level security;
alter table manager_work_responses enable row level security;

revoke all on table manager_work_initiatives from anon, authenticated;
revoke all on table manager_work_reviews from anon, authenticated;
revoke all on table manager_work_goals from anon, authenticated;
revoke all on table manager_work_content from anon, authenticated;
revoke all on table manager_work_outreach from anon, authenticated;
revoke all on table manager_work_surveys from anon, authenticated;
revoke all on table manager_work_responses from anon, authenticated;

commit;
