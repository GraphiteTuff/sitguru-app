begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_sitguru_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and lower(ur.role::text) in ('admin', 'super_admin')
  );
$$;

create or replace function public.set_ambassador_command_center_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Optional templates used by the Ambassador Command Center quick-add menu.
-- Global templates have owner_ambassador_id = null. Ambassadors may also create
-- their own private templates.
-- ---------------------------------------------------------------------------

create table if not exists public.ambassador_activity_templates (
  id uuid primary key default gen_random_uuid(),
  owner_ambassador_id uuid null references public.ambassadors(id) on delete cascade,
  title text not null,
  description text null,
  category text not null default 'other',
  activity_type text not null default 'other',
  engagement_mode text not null default 'digital',
  default_duration_minutes integer not null default 30,
  default_day_of_week integer null,
  default_target_audience text null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint ambassador_activity_templates_category_check
    check (
      category in (
        'planning',
        'content',
        'outreach',
        'partnerships',
        'community',
        'event',
        'expo',
        'flyer_qr_distribution',
        'lead_follow_up',
        'proof_collection',
        'training',
        'review',
        'admin',
        'other'
      )
    ),

  constraint ambassador_activity_templates_type_check
    check (
      activity_type in (
        'face_to_face',
        'event',
        'expo',
        'business_visit',
        'community_outreach',
        'partnership_meeting',
        'phone_outreach',
        'email_outreach',
        'social_media',
        'content_creation',
        'flyer_distribution',
        'lead_follow_up',
        'training',
        'planning',
        'weekly_review',
        'other'
      )
    ),

  constraint ambassador_activity_templates_mode_check
    check (engagement_mode in ('in_person', 'virtual', 'hybrid', 'phone', 'email', 'digital')),

  constraint ambassador_activity_templates_duration_check
    check (default_duration_minutes between 5 and 2880),

  constraint ambassador_activity_templates_day_check
    check (default_day_of_week is null or default_day_of_week between 0 and 6)
);

create unique index if not exists ambassador_activity_templates_global_title_unique
  on public.ambassador_activity_templates (lower(title))
  where owner_ambassador_id is null;

create index if not exists ambassador_activity_templates_owner_idx
  on public.ambassador_activity_templates (owner_ambassador_id, is_active, sort_order);

-- ---------------------------------------------------------------------------
-- Calendar, schedule, and completed activity log.
-- Hours are accountability and activity evidence only. They do not create an
-- Ambassador reward automatically.
-- ---------------------------------------------------------------------------

create table if not exists public.ambassador_activity_log (
  id uuid primary key default gen_random_uuid(),
  ambassador_id uuid not null references public.ambassadors(id) on delete cascade,
  ambassador_user_id uuid null references auth.users(id) on delete set null,
  template_id uuid null references public.ambassador_activity_templates(id) on delete set null,

  title text not null,
  description text null,
  category text not null default 'other',
  activity_type text not null default 'other',
  engagement_mode text not null default 'digital',
  status text not null default 'planned',
  priority text not null default 'medium',

  activity_date date not null,
  starts_at timestamptz null,
  ends_at timestamptz null,
  all_day boolean not null default false,
  estimated_minutes integer null,
  actual_minutes integer null,
  reminder_minutes_before integer null default 60,

  series_id uuid null,
  parent_activity_id uuid null references public.ambassador_activity_log(id) on delete set null,
  recurrence_rule text null,

  event_name text null,
  venue_name text null,
  organization_name text null,
  address_line_1 text null,
  address_line_2 text null,
  city text null,
  state text null,
  zip_code text null,
  virtual_url text null,

  campaign_name text null,
  target_audience text null,
  goal text null,
  expected_contacts integer not null default 0,

  actual_contacts integer not null default 0,
  conversations integer not null default 0,
  qr_scans integer not null default 0,
  referral_links_shared integer not null default 0,
  materials_distributed integer not null default 0,
  leads_generated integer not null default 0,
  pet_parent_leads integer not null default 0,
  guru_leads integer not null default 0,
  ambassador_leads integer not null default 0,
  partner_leads integer not null default 0,
  verified_signups integer not null default 0,
  completed_bookings integer not null default 0,

  travel_miles numeric(10,2) not null default 0,
  out_of_pocket_cost numeric(12,2) not null default 0,

  outcome_summary text null,
  notes text null,
  blocker_notes text null,
  proof_urls jsonb not null default '[]'::jsonb,
  attachments jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,

  needs_admin_help boolean not null default false,
  admin_help_reason text null,
  admin_review_status text not null default 'not_reviewed',
  reviewed_by uuid null references auth.users(id) on delete set null,
  reviewed_at timestamptz null,
  admin_notes text null,

  payout_review_status text not null default 'not_applicable',
  payout_review_note text null,
  linked_reward_id uuid null,
  linked_referral_id uuid null,

  source_surface text not null default 'ambassador_command_center',
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint ambassador_activity_log_category_check
    check (
      category in (
        'planning',
        'content',
        'outreach',
        'partnerships',
        'community',
        'event',
        'expo',
        'flyer_qr_distribution',
        'lead_follow_up',
        'proof_collection',
        'training',
        'review',
        'admin',
        'other'
      )
    ),

  constraint ambassador_activity_log_type_check
    check (
      activity_type in (
        'face_to_face',
        'event',
        'expo',
        'business_visit',
        'community_outreach',
        'partnership_meeting',
        'phone_outreach',
        'email_outreach',
        'social_media',
        'content_creation',
        'flyer_distribution',
        'lead_follow_up',
        'training',
        'planning',
        'weekly_review',
        'other'
      )
    ),

  constraint ambassador_activity_log_mode_check
    check (engagement_mode in ('in_person', 'virtual', 'hybrid', 'phone', 'email', 'digital')),

  constraint ambassador_activity_log_status_check
    check (status in ('planned', 'confirmed', 'in_progress', 'completed', 'deferred', 'cancelled', 'no_show')),

  constraint ambassador_activity_log_priority_check
    check (priority in ('low', 'medium', 'high', 'urgent')),

  constraint ambassador_activity_log_review_check
    check (admin_review_status in ('not_reviewed', 'reviewed', 'needs_follow_up', 'approved', 'rejected')),

  constraint ambassador_activity_log_payout_review_check
    check (
      payout_review_status in (
        'not_applicable',
        'supporting_evidence',
        'needs_review',
        'linked_to_reward',
        'excluded'
      )
    ),

  constraint ambassador_activity_log_minutes_check
    check (
      (estimated_minutes is null or estimated_minutes between 0 and 10080)
      and (actual_minutes is null or actual_minutes between 0 and 10080)
      and (reminder_minutes_before is null or reminder_minutes_before between 0 and 10080)
    ),

  constraint ambassador_activity_log_nonnegative_metrics_check
    check (
      expected_contacts >= 0
      and actual_contacts >= 0
      and conversations >= 0
      and qr_scans >= 0
      and referral_links_shared >= 0
      and materials_distributed >= 0
      and leads_generated >= 0
      and pet_parent_leads >= 0
      and guru_leads >= 0
      and ambassador_leads >= 0
      and partner_leads >= 0
      and verified_signups >= 0
      and completed_bookings >= 0
      and travel_miles >= 0
      and out_of_pocket_cost >= 0
    ),

  constraint ambassador_activity_log_time_order_check
    check (starts_at is null or ends_at is null or ends_at >= starts_at)
);

-- Compatibility upgrade for the legacy ambassador_activity_log table.
-- Earlier SitGuru versions used activity_title/activity_notes and did not have
-- calendar, result, Admin-review, or payout-evidence columns. CREATE TABLE IF
-- NOT EXISTS does not add missing columns, so upgrade the existing table before
-- creating indexes and views.
alter table public.ambassador_activity_log
  add column if not exists ambassador_user_id uuid references auth.users(id) on delete set null,
  add column if not exists template_id uuid references public.ambassador_activity_templates(id) on delete set null,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists category text default 'other',
  add column if not exists engagement_mode text default 'digital',
  add column if not exists status text default 'planned',
  add column if not exists priority text default 'medium',
  add column if not exists activity_date date,
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz,
  add column if not exists all_day boolean default false,
  add column if not exists estimated_minutes integer,
  add column if not exists actual_minutes integer,
  add column if not exists reminder_minutes_before integer default 60,
  add column if not exists series_id uuid,
  add column if not exists parent_activity_id uuid references public.ambassador_activity_log(id) on delete set null,
  add column if not exists recurrence_rule text,
  add column if not exists event_name text,
  add column if not exists venue_name text,
  add column if not exists organization_name text,
  add column if not exists address_line_1 text,
  add column if not exists address_line_2 text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists zip_code text,
  add column if not exists virtual_url text,
  add column if not exists campaign_name text,
  add column if not exists target_audience text,
  add column if not exists goal text,
  add column if not exists expected_contacts integer default 0,
  add column if not exists actual_contacts integer default 0,
  add column if not exists conversations integer default 0,
  add column if not exists qr_scans integer default 0,
  add column if not exists referral_links_shared integer default 0,
  add column if not exists materials_distributed integer default 0,
  add column if not exists leads_generated integer default 0,
  add column if not exists pet_parent_leads integer default 0,
  add column if not exists guru_leads integer default 0,
  add column if not exists ambassador_leads integer default 0,
  add column if not exists partner_leads integer default 0,
  add column if not exists verified_signups integer default 0,
  add column if not exists completed_bookings integer default 0,
  add column if not exists travel_miles numeric(10,2) default 0,
  add column if not exists out_of_pocket_cost numeric(12,2) default 0,
  add column if not exists outcome_summary text,
  add column if not exists notes text,
  add column if not exists blocker_notes text,
  add column if not exists proof_urls jsonb default '[]'::jsonb,
  add column if not exists attachments jsonb default '[]'::jsonb,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists needs_admin_help boolean default false,
  add column if not exists admin_help_reason text,
  add column if not exists admin_review_status text default 'not_reviewed',
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists admin_notes text,
  add column if not exists payout_review_status text default 'not_applicable',
  add column if not exists payout_review_note text,
  add column if not exists linked_reward_id uuid,
  add column if not exists linked_referral_id uuid,
  add column if not exists source_surface text default 'ambassador_command_center',
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ambassador_activity_log'
      and column_name = 'activity_title'
  ) then
    execute $sql$
      update public.ambassador_activity_log
      set title = coalesce(nullif(trim(title), ''), nullif(trim(activity_title), ''))
      where title is null or trim(title) = ''
    $sql$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ambassador_activity_log'
      and column_name = 'activity_notes'
  ) then
    execute $sql$
      update public.ambassador_activity_log
      set notes = coalesce(notes, activity_notes)
      where notes is null
    $sql$;
  end if;
end;
$$;

update public.ambassador_activity_log
set
  title = coalesce(nullif(trim(title), ''), 'Ambassador activity'),
  category = coalesce(nullif(trim(category), ''), 'other'),
  activity_type = coalesce(nullif(trim(activity_type), ''), 'other'),
  engagement_mode = coalesce(nullif(trim(engagement_mode), ''), 'digital'),
  status = coalesce(nullif(trim(status), ''), 'planned'),
  priority = coalesce(nullif(trim(priority), ''), 'medium'),
  activity_date = coalesce(activity_date, starts_at::date, created_at::date, current_date),
  all_day = coalesce(all_day, false),
  expected_contacts = greatest(coalesce(expected_contacts, 0), 0),
  actual_contacts = greatest(coalesce(actual_contacts, 0), 0),
  conversations = greatest(coalesce(conversations, 0), 0),
  qr_scans = greatest(coalesce(qr_scans, 0), 0),
  referral_links_shared = greatest(coalesce(referral_links_shared, 0), 0),
  materials_distributed = greatest(coalesce(materials_distributed, 0), 0),
  leads_generated = greatest(coalesce(leads_generated, 0), 0),
  pet_parent_leads = greatest(coalesce(pet_parent_leads, 0), 0),
  guru_leads = greatest(coalesce(guru_leads, 0), 0),
  ambassador_leads = greatest(coalesce(ambassador_leads, 0), 0),
  partner_leads = greatest(coalesce(partner_leads, 0), 0),
  verified_signups = greatest(coalesce(verified_signups, 0), 0),
  completed_bookings = greatest(coalesce(completed_bookings, 0), 0),
  travel_miles = greatest(coalesce(travel_miles, 0), 0),
  out_of_pocket_cost = greatest(coalesce(out_of_pocket_cost, 0), 0),
  proof_urls = coalesce(proof_urls, '[]'::jsonb),
  attachments = coalesce(attachments, '[]'::jsonb),
  metadata = coalesce(metadata, '{}'::jsonb),
  needs_admin_help = coalesce(needs_admin_help, false),
  admin_review_status = coalesce(nullif(trim(admin_review_status), ''), 'not_reviewed'),
  payout_review_status = coalesce(nullif(trim(payout_review_status), ''), 'not_applicable'),
  source_surface = coalesce(nullif(trim(source_surface), ''), 'ambassador_command_center'),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, created_at, now()),
  ambassador_user_id = coalesce(
    ambassador_user_id,
    (select a.user_id from public.ambassadors a where a.id = ambassador_activity_log.ambassador_id limit 1)
  );

alter table public.ambassador_activity_log
  alter column title set not null,
  alter column activity_date set not null,
  alter column title set default 'Ambassador activity',
  alter column category set default 'other',
  alter column engagement_mode set default 'digital',
  alter column status set default 'planned',
  alter column priority set default 'medium',
  alter column all_day set default false,
  alter column expected_contacts set default 0,
  alter column actual_contacts set default 0,
  alter column conversations set default 0,
  alter column qr_scans set default 0,
  alter column referral_links_shared set default 0,
  alter column materials_distributed set default 0,
  alter column leads_generated set default 0,
  alter column pet_parent_leads set default 0,
  alter column guru_leads set default 0,
  alter column ambassador_leads set default 0,
  alter column partner_leads set default 0,
  alter column verified_signups set default 0,
  alter column completed_bookings set default 0,
  alter column travel_miles set default 0,
  alter column out_of_pocket_cost set default 0,
  alter column proof_urls set default '[]'::jsonb,
  alter column attachments set default '[]'::jsonb,
  alter column metadata set default '{}'::jsonb,
  alter column needs_admin_help set default false,
  alter column admin_review_status set default 'not_reviewed',
  alter column payout_review_status set default 'not_applicable',
  alter column source_surface set default 'ambassador_command_center',
  alter column created_at set default now(),
  alter column updated_at set default now();

create index if not exists ambassador_activity_log_calendar_idx
  on public.ambassador_activity_log (ambassador_id, activity_date, starts_at);

create index if not exists ambassador_activity_log_status_idx
  on public.ambassador_activity_log (ambassador_id, status, activity_date);

create index if not exists ambassador_activity_log_admin_review_idx
  on public.ambassador_activity_log (admin_review_status, needs_admin_help, activity_date desc);

create index if not exists ambassador_activity_log_payout_review_idx
  on public.ambassador_activity_log (payout_review_status, activity_date desc);

-- ---------------------------------------------------------------------------
-- Marketing effort detail. One calendar activity can contain multiple efforts,
-- such as a Facebook post, flyer distribution, and a follow-up email.
-- ---------------------------------------------------------------------------

create table if not exists public.ambassador_marketing_efforts (
  id uuid primary key default gen_random_uuid(),
  ambassador_id uuid not null references public.ambassadors(id) on delete cascade,
  ambassador_user_id uuid null references auth.users(id) on delete set null,
  activity_id uuid null references public.ambassador_activity_log(id) on delete set null,

  effort_date date not null,
  effort_type text not null,
  platform text null,
  campaign_name text null,
  target_audience text null,
  target_location text null,
  title text not null,
  description text null,
  content_url text null,
  call_to_action text null,

  minutes_spent integer not null default 0,
  spend_amount numeric(12,2) not null default 0,
  impressions integer not null default 0,
  reach integer not null default 0,
  engagements integer not null default 0,
  clicks integer not null default 0,
  messages_received integer not null default 0,
  qr_scans integer not null default 0,
  materials_distributed integer not null default 0,
  leads_generated integer not null default 0,
  verified_signups integer not null default 0,
  completed_bookings integer not null default 0,

  status text not null default 'planned',
  outcome_summary text null,
  notes text null,
  proof_urls jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,

  needs_admin_help boolean not null default false,
  admin_review_status text not null default 'not_reviewed',
  admin_notes text null,

  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint ambassador_marketing_efforts_type_check
    check (
      effort_type in (
        'organic_social',
        'paid_social',
        'email',
        'sms',
        'phone',
        'direct_message',
        'community_group',
        'flyer',
        'qr_code',
        'event_promotion',
        'partner_outreach',
        'local_business_outreach',
        'content_creation',
        'other'
      )
    ),

  constraint ambassador_marketing_efforts_status_check
    check (status in ('planned', 'in_progress', 'published', 'completed', 'deferred', 'cancelled')),

  constraint ambassador_marketing_efforts_review_check
    check (admin_review_status in ('not_reviewed', 'reviewed', 'needs_follow_up', 'approved', 'rejected')),

  constraint ambassador_marketing_efforts_nonnegative_check
    check (
      minutes_spent >= 0
      and spend_amount >= 0
      and impressions >= 0
      and reach >= 0
      and engagements >= 0
      and clicks >= 0
      and messages_received >= 0
      and qr_scans >= 0
      and materials_distributed >= 0
      and leads_generated >= 0
      and verified_signups >= 0
      and completed_bookings >= 0
    )
);

-- Compatibility protection for any partially-created marketing effort table.
alter table public.ambassador_marketing_efforts
  add column if not exists ambassador_id uuid references public.ambassadors(id) on delete cascade,
  add column if not exists ambassador_user_id uuid references auth.users(id) on delete set null,
  add column if not exists activity_id uuid references public.ambassador_activity_log(id) on delete set null,
  add column if not exists effort_date date,
  add column if not exists effort_type text default 'other',
  add column if not exists platform text,
  add column if not exists campaign_name text,
  add column if not exists target_audience text,
  add column if not exists target_location text,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists content_url text,
  add column if not exists call_to_action text,
  add column if not exists minutes_spent integer default 0,
  add column if not exists spend_amount numeric(12,2) default 0,
  add column if not exists impressions integer default 0,
  add column if not exists reach integer default 0,
  add column if not exists engagements integer default 0,
  add column if not exists clicks integer default 0,
  add column if not exists messages_received integer default 0,
  add column if not exists qr_scans integer default 0,
  add column if not exists materials_distributed integer default 0,
  add column if not exists leads_generated integer default 0,
  add column if not exists verified_signups integer default 0,
  add column if not exists completed_bookings integer default 0,
  add column if not exists status text default 'planned',
  add column if not exists outcome_summary text,
  add column if not exists notes text,
  add column if not exists proof_urls jsonb default '[]'::jsonb,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists needs_admin_help boolean default false,
  add column if not exists admin_review_status text default 'not_reviewed',
  add column if not exists admin_notes text,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.ambassador_marketing_efforts
set
  effort_date = coalesce(effort_date, created_at::date, current_date),
  effort_type = coalesce(nullif(trim(effort_type), ''), 'other'),
  title = coalesce(nullif(trim(title), ''), 'Marketing effort'),
  status = coalesce(nullif(trim(status), ''), 'planned'),
  minutes_spent = greatest(coalesce(minutes_spent, 0), 0),
  spend_amount = greatest(coalesce(spend_amount, 0), 0),
  impressions = greatest(coalesce(impressions, 0), 0),
  reach = greatest(coalesce(reach, 0), 0),
  engagements = greatest(coalesce(engagements, 0), 0),
  clicks = greatest(coalesce(clicks, 0), 0),
  messages_received = greatest(coalesce(messages_received, 0), 0),
  qr_scans = greatest(coalesce(qr_scans, 0), 0),
  materials_distributed = greatest(coalesce(materials_distributed, 0), 0),
  leads_generated = greatest(coalesce(leads_generated, 0), 0),
  verified_signups = greatest(coalesce(verified_signups, 0), 0),
  completed_bookings = greatest(coalesce(completed_bookings, 0), 0),
  proof_urls = coalesce(proof_urls, '[]'::jsonb),
  metadata = coalesce(metadata, '{}'::jsonb),
  needs_admin_help = coalesce(needs_admin_help, false),
  admin_review_status = coalesce(nullif(trim(admin_review_status), ''), 'not_reviewed'),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, created_at, now()),
  ambassador_user_id = coalesce(
    ambassador_user_id,
    (select a.user_id from public.ambassadors a where a.id = ambassador_marketing_efforts.ambassador_id limit 1)
  );

alter table public.ambassador_marketing_efforts
  alter column effort_date set not null,
  alter column title set not null,
  alter column effort_date set default current_date,
  alter column effort_type set default 'other',
  alter column title set default 'Marketing effort',
  alter column status set default 'planned',
  alter column minutes_spent set default 0,
  alter column spend_amount set default 0,
  alter column impressions set default 0,
  alter column reach set default 0,
  alter column engagements set default 0,
  alter column clicks set default 0,
  alter column messages_received set default 0,
  alter column qr_scans set default 0,
  alter column materials_distributed set default 0,
  alter column leads_generated set default 0,
  alter column verified_signups set default 0,
  alter column completed_bookings set default 0,
  alter column proof_urls set default '[]'::jsonb,
  alter column metadata set default '{}'::jsonb,
  alter column needs_admin_help set default false,
  alter column admin_review_status set default 'not_reviewed',
  alter column created_at set default now(),
  alter column updated_at set default now();

create index if not exists ambassador_marketing_efforts_date_idx
  on public.ambassador_marketing_efforts (ambassador_id, effort_date desc);

create index if not exists ambassador_marketing_efforts_campaign_idx
  on public.ambassador_marketing_efforts (campaign_name, platform, effort_date desc);

create index if not exists ambassador_marketing_efforts_review_idx
  on public.ambassador_marketing_efforts (admin_review_status, needs_admin_help, effort_date desc);

-- ---------------------------------------------------------------------------
-- Ambassador lead generator. Every saved lead is also synchronized to the
-- existing Admin Sales & Marketing lead pipeline.
-- ---------------------------------------------------------------------------

create table if not exists public.ambassador_leads (
  id uuid primary key default gen_random_uuid(),
  ambassador_id uuid not null references public.ambassadors(id) on delete cascade,
  ambassador_user_id uuid null references auth.users(id) on delete set null,
  activity_id uuid null references public.ambassador_activity_log(id) on delete set null,
  marketing_effort_id uuid null references public.ambassador_marketing_efforts(id) on delete set null,

  lead_type text not null,
  lead_status text not null default 'new',
  lead_temperature text not null default 'warm',
  priority text not null default 'medium',

  first_name text null,
  last_name text null,
  full_name text null,
  email text null,
  phone text null,
  business_name text null,
  organization_name text null,
  website_url text null,
  social_handle text null,

  city text null,
  state text null,
  zip_code text null,
  market_area text null,

  source_type text not null default 'ambassador_outreach',
  source_detail text null,
  campaign_name text null,
  target_audience text null,
  referral_code text null,

  consent_to_contact boolean not null default false,
  preferred_contact_method text null,
  next_follow_up timestamptz null,
  next_action text null,
  outcome_goal text null,
  notes text null,

  admin_assistance_requested boolean not null default false,
  admin_assistance_reason text null,
  admin_owner_name text null,
  admin_notes text null,

  converted_user_id uuid null references auth.users(id) on delete set null,
  converted_at timestamptz null,
  conversion_type text null,

  payout_review_status text not null default 'not_eligible',
  payout_review_note text null,
  linked_reward_id uuid null,
  linked_referral_id uuid null,

  admin_marketing_signup_lead_id uuid null,
  source_surface text not null default 'ambassador_command_center',
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint ambassador_leads_type_check
    check (lead_type in ('pet_parent', 'guru', 'ambassador', 'partner', 'business', 'general')),

  constraint ambassador_leads_status_check
    check (
      lead_status in (
        'new',
        'contacted',
        'follow_up_needed',
        'qualified',
        'converted',
        'needs_admin',
        'closed_not_now'
      )
    ),

  constraint ambassador_leads_temperature_check
    check (lead_temperature in ('hot', 'warm', 'cold', 'reactivation')),

  constraint ambassador_leads_priority_check
    check (priority in ('low', 'medium', 'high', 'urgent')),

  constraint ambassador_leads_source_check
    check (
      source_type in (
        'face_to_face',
        'event',
        'expo',
        'social_media',
        'email',
        'phone',
        'direct_message',
        'flyer_qr',
        'partner',
        'referral',
        'ambassador_outreach',
        'other'
      )
    ),

  constraint ambassador_leads_contact_method_check
    check (
      preferred_contact_method is null
      or preferred_contact_method in ('email', 'phone', 'text', 'direct_message', 'in_person')
    ),

  constraint ambassador_leads_payout_review_check
    check (
      payout_review_status in (
        'not_eligible',
        'pending_verification',
        'eligible',
        'linked_to_reward',
        'ineligible'
      )
    ),

  constraint ambassador_leads_contact_check
    check (
      coalesce(nullif(trim(full_name), ''), nullif(trim(email), ''), nullif(trim(phone), ''), nullif(trim(business_name), ''), nullif(trim(organization_name), '')) is not null
    )
);

-- Compatibility upgrade for the existing Ambassador lead table.
-- Legacy rows and fields remain in place; the Command Center fields are added
-- and backfilled so Admin and Ambassador views share one lead record.
alter table public.ambassador_leads
  add column if not exists ambassador_id uuid references public.ambassadors(id) on delete cascade,
  add column if not exists ambassador_user_id uuid references auth.users(id) on delete set null,
  add column if not exists activity_id uuid references public.ambassador_activity_log(id) on delete set null,
  add column if not exists marketing_effort_id uuid references public.ambassador_marketing_efforts(id) on delete set null,
  add column if not exists lead_type text default 'general',
  add column if not exists lead_status text default 'new',
  add column if not exists lead_temperature text default 'warm',
  add column if not exists priority text default 'medium',
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists full_name text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists business_name text,
  add column if not exists organization_name text,
  add column if not exists website_url text,
  add column if not exists social_handle text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists zip_code text,
  add column if not exists market_area text,
  add column if not exists source_type text default 'ambassador_outreach',
  add column if not exists source_detail text,
  add column if not exists campaign_name text,
  add column if not exists target_audience text,
  add column if not exists referral_code text,
  add column if not exists consent_to_contact boolean default false,
  add column if not exists preferred_contact_method text,
  add column if not exists next_follow_up timestamptz,
  add column if not exists next_action text,
  add column if not exists outcome_goal text,
  add column if not exists notes text,
  add column if not exists admin_assistance_requested boolean default false,
  add column if not exists admin_assistance_reason text,
  add column if not exists admin_owner_name text,
  add column if not exists admin_notes text,
  add column if not exists converted_user_id uuid references auth.users(id) on delete set null,
  add column if not exists converted_at timestamptz,
  add column if not exists conversion_type text,
  add column if not exists payout_review_status text default 'not_eligible',
  add column if not exists payout_review_note text,
  add column if not exists linked_reward_id uuid,
  add column if not exists linked_referral_id uuid,
  add column if not exists admin_marketing_signup_lead_id uuid,
  add column if not exists source_surface text default 'ambassador_command_center',
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'ambassador_leads' and column_name = 'campaign'
  ) then
    execute $sql$
      update public.ambassador_leads
      set campaign_name = coalesce(nullif(trim(campaign_name), ''), nullif(trim(campaign), ''))
      where campaign_name is null or trim(campaign_name) = ''
    $sql$;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'ambassador_leads' and column_name = 'next_step'
  ) then
    execute $sql$
      update public.ambassador_leads
      set next_action = coalesce(nullif(trim(next_action), ''), nullif(trim(next_step), ''))
      where next_action is null or trim(next_action) = ''
    $sql$;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'ambassador_leads' and column_name = 'lead_stage'
  ) then
    execute $sql$
      update public.ambassador_leads
      set lead_status = case lower(trim(coalesce(lead_stage, '')))
        when 'new' then 'new'
        when 'contacted' then 'contacted'
        when 'follow-up' then 'follow_up_needed'
        when 'follow up' then 'follow_up_needed'
        when 'follow_up' then 'follow_up_needed'
        when 'qualified' then 'qualified'
        when 'converted' then 'converted'
        when 'closed' then 'closed_not_now'
        else coalesce(nullif(trim(lead_status), ''), 'new')
      end
    $sql$;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'ambassador_leads' and column_name = 'candidate_path'
  ) then
    execute $sql$
      update public.ambassador_leads
      set lead_type = case
        when lower(coalesce(candidate_path, '')) like '%guru%' then 'guru'
        when lower(coalesce(candidate_path, '')) like '%pet parent%' then 'pet_parent'
        when lower(coalesce(candidate_path, '')) like '%ambassador%' then 'ambassador'
        when lower(coalesce(candidate_path, '')) like '%partner%' then 'partner'
        else coalesce(nullif(trim(lead_type), ''), 'general')
      end
    $sql$;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'ambassador_leads' and column_name = 'contact_name'
  ) then
    execute $sql$
      update public.ambassador_leads
      set full_name = coalesce(nullif(trim(full_name), ''), nullif(trim(contact_name), ''))
      where full_name is null or trim(full_name) = ''
    $sql$;
  end if;
end;
$$;

update public.ambassador_leads
set
  ambassador_user_id = coalesce(
    ambassador_user_id,
    (select a.user_id from public.ambassadors a where a.id = ambassador_leads.ambassador_id limit 1)
  ),
  lead_type = coalesce(nullif(trim(lead_type), ''), 'general'),
  lead_status = coalesce(nullif(trim(lead_status), ''), 'new'),
  lead_temperature = coalesce(nullif(trim(lead_temperature), ''), 'warm'),
  priority = coalesce(nullif(trim(priority), ''), 'medium'),
  source_type = coalesce(nullif(trim(source_type), ''), 'ambassador_outreach'),
  consent_to_contact = coalesce(consent_to_contact, false),
  admin_assistance_requested = coalesce(admin_assistance_requested, false),
  payout_review_status = coalesce(nullif(trim(payout_review_status), ''), 'not_eligible'),
  source_surface = coalesce(nullif(trim(source_surface), ''), 'ambassador_command_center'),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, created_at, now());

alter table public.ambassador_leads
  alter column lead_type set default 'general',
  alter column lead_status set default 'new',
  alter column lead_temperature set default 'warm',
  alter column priority set default 'medium',
  alter column source_type set default 'ambassador_outreach',
  alter column consent_to_contact set default false,
  alter column admin_assistance_requested set default false,
  alter column payout_review_status set default 'not_eligible',
  alter column source_surface set default 'ambassador_command_center',
  alter column created_at set default now(),
  alter column updated_at set default now();

create index if not exists ambassador_leads_pipeline_idx
  on public.ambassador_leads (ambassador_id, lead_status, next_follow_up, created_at desc);

create index if not exists ambassador_leads_admin_help_idx
  on public.ambassador_leads (admin_assistance_requested, lead_status, priority, created_at desc);

create index if not exists ambassador_leads_activity_idx
  on public.ambassador_leads (activity_id, marketing_effort_id);

create unique index if not exists ambassador_leads_admin_pipeline_unique
  on public.ambassador_leads (admin_marketing_signup_lead_id)
  where admin_marketing_signup_lead_id is not null;

-- ---------------------------------------------------------------------------
-- Wire Ambassador-created leads into the existing Admin Sales & Marketing
-- signup lead table. The Admin remains the follow-up and assistance workspace.
-- ---------------------------------------------------------------------------

alter table if exists public.admin_marketing_signup_leads
  add column if not exists submitted_by_ambassador_id uuid references public.ambassadors(id) on delete set null,
  add column if not exists submitted_by_ambassador_user_id uuid references auth.users(id) on delete set null,
  add column if not exists ambassador_activity_id uuid references public.ambassador_activity_log(id) on delete set null,
  add column if not exists ambassador_marketing_effort_id uuid references public.ambassador_marketing_efforts(id) on delete set null,
  add column if not exists ambassador_lead_id uuid,
  add column if not exists source_surface text,
  add column if not exists admin_assistance_requested boolean not null default false,
  add column if not exists admin_assistance_reason text;

create unique index if not exists admin_marketing_signup_leads_ambassador_lead_unique
  on public.admin_marketing_signup_leads (ambassador_lead_id)
  where ambassador_lead_id is not null;

create or replace function public.sync_ambassador_lead_to_admin_pipeline()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ambassador_name text;
  v_ambassador_email text;
  v_referral_code text;
  v_admin_lead_id uuid;
  v_lead_type text;
  v_status text;
  v_signup_link text;
begin
  select
    coalesce(nullif(trim(a.full_name), ''), 'SitGuru Ambassador'),
    coalesce(nullif(trim(a.contact_email), ''), nullif(trim(a.login_email), ''), nullif(trim(a.email), '')),
    nullif(trim(a.referral_code), '')
  into v_ambassador_name, v_ambassador_email, v_referral_code
  from public.ambassadors a
  where a.id = new.ambassador_id
  limit 1;

  v_lead_type := case new.lead_type
    when 'pet_parent' then 'Pet Parent Lead'
    when 'guru' then 'Guru Lead'
    when 'ambassador' then 'Ambassador Lead'
    when 'partner' then 'Partner Lead'
    when 'business' then 'Partner Lead'
    else 'General Contact'
  end;

  v_status := case new.lead_status
    when 'new' then 'New'
    when 'contacted' then 'Contacted'
    when 'follow_up_needed' then 'Follow-Up'
    when 'qualified' then 'Warm'
    when 'converted' then 'Converted'
    when 'needs_admin' then 'Needs CEO Review'
    else 'Waiting'
  end;

  v_signup_link := case new.lead_type
    when 'guru' then 'https://www.sitguru.com/guru/signup'
    when 'ambassador' then 'https://www.sitguru.com/ambassadors'
    when 'partner' then 'https://www.sitguru.com/partners'
    when 'business' then 'https://www.sitguru.com/partners'
    when 'pet_parent' then 'https://www.sitguru.com/signup'
    else 'https://www.sitguru.com'
  end;

  insert into public.admin_marketing_signup_leads (
    lead_type,
    lead_status,
    first_name,
    last_name,
    full_name,
    email,
    phone,
    zip_code,
    city,
    state,
    market_area,
    business_name,
    website_url,
    social_handle,
    relationship_category,
    growth_channel,
    interested_as,
    campaign_source,
    source_contact_name,
    referral_source_name,
    referral_source_type,
    signup_link,
    priority_level,
    referral_potential,
    ceo_priority,
    next_follow_up,
    next_action,
    outcome_goal,
    notes,
    owner_name,
    created_by_name,
    created_by_email,
    submitted_by_ambassador_id,
    submitted_by_ambassador_user_id,
    ambassador_activity_id,
    ambassador_marketing_effort_id,
    ambassador_lead_id,
    source_surface,
    admin_assistance_requested,
    admin_assistance_reason
  )
  values (
    v_lead_type,
    v_status,
    new.first_name,
    new.last_name,
    coalesce(nullif(trim(new.full_name), ''), nullif(trim(concat_ws(' ', new.first_name, new.last_name)), ''), new.business_name, new.organization_name, 'Ambassador lead'),
    new.email,
    new.phone,
    new.zip_code,
    new.city,
    new.state,
    coalesce(new.market_area, nullif(trim(concat_ws(', ', new.city, new.state)), '')),
    coalesce(new.business_name, new.organization_name),
    new.website_url,
    new.social_handle,
    v_lead_type,
    'Ambassador Program',
    v_lead_type,
    new.campaign_name,
    v_ambassador_name,
    v_ambassador_name,
    'Ambassador',
    v_signup_link,
    initcap(new.priority),
    case new.lead_temperature when 'hot' then 'High' when 'cold' then 'Low' else 'Medium' end,
    new.admin_assistance_requested or new.lead_status = 'needs_admin',
    new.next_follow_up::date,
    new.next_action,
    new.outcome_goal,
    concat_ws(
      E'\n\n',
      nullif(trim(new.notes), ''),
      nullif(trim(new.source_detail), ''),
      case when new.consent_to_contact then 'Ambassador recorded consent to contact.' else 'Consent to contact was not confirmed by the Ambassador.' end,
      case when v_referral_code is not null then 'Ambassador referral code: ' || v_referral_code else null end
    ),
    'Sales & Marketing',
    v_ambassador_name,
    v_ambassador_email,
    new.ambassador_id,
    new.ambassador_user_id,
    new.activity_id,
    new.marketing_effort_id,
    new.id,
    new.source_surface,
    new.admin_assistance_requested,
    new.admin_assistance_reason
  )
  on conflict (ambassador_lead_id)
  do update set
    lead_type = excluded.lead_type,
    lead_status = excluded.lead_status,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    full_name = excluded.full_name,
    email = excluded.email,
    phone = excluded.phone,
    zip_code = excluded.zip_code,
    city = excluded.city,
    state = excluded.state,
    market_area = excluded.market_area,
    business_name = excluded.business_name,
    website_url = excluded.website_url,
    social_handle = excluded.social_handle,
    campaign_source = excluded.campaign_source,
    priority_level = excluded.priority_level,
    referral_potential = excluded.referral_potential,
    ceo_priority = excluded.ceo_priority,
    next_follow_up = excluded.next_follow_up,
    next_action = excluded.next_action,
    outcome_goal = excluded.outcome_goal,
    notes = excluded.notes,
    admin_assistance_requested = excluded.admin_assistance_requested,
    admin_assistance_reason = excluded.admin_assistance_reason,
    updated_at = now()
  returning id into v_admin_lead_id;

  new.admin_marketing_signup_lead_id := v_admin_lead_id;
  return new;
end;
$$;

drop trigger if exists sync_ambassador_lead_to_admin_pipeline_trigger
  on public.ambassador_leads;

create trigger sync_ambassador_lead_to_admin_pipeline_trigger
before insert or update of
  lead_type,
  lead_status,
  lead_temperature,
  priority,
  first_name,
  last_name,
  full_name,
  email,
  phone,
  business_name,
  organization_name,
  website_url,
  social_handle,
  city,
  state,
  zip_code,
  market_area,
  source_detail,
  campaign_name,
  consent_to_contact,
  next_follow_up,
  next_action,
  outcome_goal,
  notes,
  admin_assistance_requested,
  admin_assistance_reason
on public.ambassador_leads
for each row
execute function public.sync_ambassador_lead_to_admin_pipeline();

-- ---------------------------------------------------------------------------
-- Keep role ownership and timestamps accurate.
-- ---------------------------------------------------------------------------

create or replace function public.set_ambassador_command_center_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  select a.user_id
  into v_user_id
  from public.ambassadors a
  where a.id = new.ambassador_id
  limit 1;

  if new.ambassador_user_id is null then
    new.ambassador_user_id := v_user_id;
  end if;

  if new.created_by is null then
    new.created_by := auth.uid();
  end if;

  return new;
end;
$$;

drop trigger if exists set_ambassador_activity_log_owner
  on public.ambassador_activity_log;
create trigger set_ambassador_activity_log_owner
before insert on public.ambassador_activity_log
for each row execute function public.set_ambassador_command_center_owner();

drop trigger if exists set_ambassador_marketing_efforts_owner
  on public.ambassador_marketing_efforts;
create trigger set_ambassador_marketing_efforts_owner
before insert on public.ambassador_marketing_efforts
for each row execute function public.set_ambassador_command_center_owner();

drop trigger if exists set_ambassador_leads_owner
  on public.ambassador_leads;
create trigger set_ambassador_leads_owner
before insert on public.ambassador_leads
for each row execute function public.set_ambassador_command_center_owner();

drop trigger if exists set_ambassador_activity_templates_updated_at
  on public.ambassador_activity_templates;
create trigger set_ambassador_activity_templates_updated_at
before update on public.ambassador_activity_templates
for each row execute function public.set_ambassador_command_center_updated_at();

drop trigger if exists set_ambassador_activity_log_updated_at
  on public.ambassador_activity_log;
create trigger set_ambassador_activity_log_updated_at
before update on public.ambassador_activity_log
for each row execute function public.set_ambassador_command_center_updated_at();

drop trigger if exists set_ambassador_marketing_efforts_updated_at
  on public.ambassador_marketing_efforts;
create trigger set_ambassador_marketing_efforts_updated_at
before update on public.ambassador_marketing_efforts
for each row execute function public.set_ambassador_command_center_updated_at();

drop trigger if exists set_ambassador_leads_updated_at
  on public.ambassador_leads;
create trigger set_ambassador_leads_updated_at
before update on public.ambassador_leads
for each row execute function public.set_ambassador_command_center_updated_at();

-- ---------------------------------------------------------------------------
-- Default quick-add templates based on the daily/weekly operating rhythm.
-- ---------------------------------------------------------------------------

insert into public.ambassador_activity_templates (
  owner_ambassador_id,
  title,
  description,
  category,
  activity_type,
  engagement_mode,
  default_duration_minutes,
  default_day_of_week,
  default_target_audience,
  sort_order
)
values
  (null, 'Plan and organize the week', 'Review priorities, calendar, outreach goals, and follow-ups.', 'planning', 'planning', 'digital', 30, 1, 'All growth audiences', 10),
  (null, 'Create or schedule marketing content', 'Prepare a post, Story, Reel, flyer, or campaign asset with one clear audience and call to action.', 'content', 'content_creation', 'digital', 45, 2, 'Pet Parents, Gurus, Ambassadors, or Partners', 20),
  (null, 'Local outreach and partnerships', 'Contact local businesses, pet professionals, schools, apartments, community groups, or partners and record the next step.', 'outreach', 'business_visit', 'in_person', 60, 3, 'Local partners and prospects', 30),
  (null, 'Community engagement', 'Reply to messages and comments, engage with local pet audiences, and capture recurring questions.', 'community', 'community_outreach', 'digital', 30, 4, 'Local pet community', 40),
  (null, 'Weekly review and optimization', 'Review activities, hours, leads, signups, blockers, proof, and next-week priorities.', 'review', 'weekly_review', 'digital', 30, 5, 'Ambassador and SitGuru Admin', 50),
  (null, 'Event, expo, or face-to-face outreach', 'Schedule or record an event, expo, vendor table, business visit, or community conversation.', 'event', 'event', 'in_person', 120, null, 'Event attendees and local prospects', 60),
  (null, 'Flyer and QR code distribution', 'Place approved flyers or cards and record locations, quantity, QR activity, and follow-up.', 'flyer_qr_distribution', 'flyer_distribution', 'in_person', 45, null, 'Local Pet Parents and Gurus', 70),
  (null, 'Lead follow-up block', 'Contact warm or hot leads, update status, set the next action, and request Admin help when needed.', 'lead_follow_up', 'lead_follow_up', 'phone', 30, null, 'Active leads', 80),
  (null, 'Capture proof and reusable assets', 'Save approved photos, testimonials, screenshots, event proof, and marketing results.', 'proof_collection', 'content_creation', 'digital', 30, 6, 'All audiences', 90),
  (null, 'Sunday reset and preparation', 'Move deferred activities, review the coming week, and prepare Monday priorities.', 'planning', 'planning', 'digital', 20, 0, 'Ambassador', 100)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Admin reporting views.
-- ---------------------------------------------------------------------------

create or replace view public.admin_ambassador_activity_summary
with (security_invoker = true)
as
select
  a.id as ambassador_id,
  a.user_id as ambassador_user_id,
  a.full_name as ambassador_name,
  a.referral_code,
  count(al.id) as total_activities,
  count(al.id) filter (where al.status = 'completed') as completed_activities,
  count(al.id) filter (where al.activity_date = current_date) as activities_today,
  count(al.id) filter (where al.activity_date >= date_trunc('week', current_date)::date) as activities_this_week,
  round(coalesce(sum(al.actual_minutes), 0)::numeric / 60, 2) as total_hours,
  coalesce(sum(al.actual_contacts), 0) as contacts,
  coalesce(sum(al.conversations), 0) as conversations,
  coalesce(sum(al.qr_scans), 0) as qr_scans,
  coalesce(sum(al.leads_generated), 0) as reported_leads,
  coalesce(sum(al.verified_signups), 0) as verified_signups,
  coalesce(sum(al.completed_bookings), 0) as completed_bookings,
  count(al.id) filter (where al.needs_admin_help) as needs_admin_help,
  max(al.updated_at) as last_activity_update,
  min(al.starts_at) filter (
    where al.status in ('planned', 'confirmed')
      and coalesce(al.starts_at::date, al.activity_date) >= current_date
  ) as next_scheduled_activity
from public.ambassadors a
left join public.ambassador_activity_log al
  on al.ambassador_id = a.id
group by a.id, a.user_id, a.full_name, a.referral_code;

create or replace view public.admin_ambassador_lead_pipeline
with (security_invoker = true)
as
select
  l.id,
  l.ambassador_id,
  l.ambassador_user_id,
  a.full_name as ambassador_name,
  a.referral_code as ambassador_referral_code,
  l.activity_id,
  l.marketing_effort_id,
  l.admin_marketing_signup_lead_id,
  l.lead_type,
  l.lead_status,
  l.lead_temperature,
  l.priority,
  l.full_name,
  l.email,
  l.phone,
  l.business_name,
  l.organization_name,
  l.city,
  l.state,
  l.zip_code,
  l.source_type,
  l.source_detail,
  l.campaign_name,
  l.next_follow_up,
  l.next_action,
  l.admin_assistance_requested,
  l.admin_assistance_reason,
  l.payout_review_status,
  l.converted_at,
  l.conversion_type,
  l.created_at,
  l.updated_at
from public.ambassador_leads l
join public.ambassadors a
  on a.id = l.ambassador_id;

-- ---------------------------------------------------------------------------
-- Row-level security.
-- ---------------------------------------------------------------------------

alter table public.ambassador_activity_templates enable row level security;
alter table public.ambassador_activity_log enable row level security;
alter table public.ambassador_marketing_efforts enable row level security;
alter table public.ambassador_leads enable row level security;

-- Template policies

drop policy if exists "Ambassadors can view command center templates"
  on public.ambassador_activity_templates;
create policy "Ambassadors can view command center templates"
on public.ambassador_activity_templates
for select
to authenticated
using (
  owner_ambassador_id is null
  or exists (
    select 1
    from public.ambassadors a
    where a.id = owner_ambassador_id
      and a.user_id = auth.uid()
  )
  or public.is_sitguru_admin_user()
);

drop policy if exists "Ambassadors can create own activity templates"
  on public.ambassador_activity_templates;
create policy "Ambassadors can create own activity templates"
on public.ambassador_activity_templates
for insert
to authenticated
with check (
  owner_ambassador_id is not null
  and exists (
    select 1
    from public.ambassadors a
    where a.id = owner_ambassador_id
      and a.user_id = auth.uid()
  )
);

drop policy if exists "Ambassadors can update own activity templates"
  on public.ambassador_activity_templates;
create policy "Ambassadors can update own activity templates"
on public.ambassador_activity_templates
for update
to authenticated
using (
  exists (
    select 1
    from public.ambassadors a
    where a.id = owner_ambassador_id
      and a.user_id = auth.uid()
  )
  or public.is_sitguru_admin_user()
)
with check (
  exists (
    select 1
    from public.ambassadors a
    where a.id = owner_ambassador_id
      and a.user_id = auth.uid()
  )
  or public.is_sitguru_admin_user()
);

drop policy if exists "Ambassadors can delete own activity templates"
  on public.ambassador_activity_templates;
create policy "Ambassadors can delete own activity templates"
on public.ambassador_activity_templates
for delete
to authenticated
using (
  exists (
    select 1
    from public.ambassadors a
    where a.id = owner_ambassador_id
      and a.user_id = auth.uid()
  )
  or public.is_sitguru_admin_user()
);

-- Activity policies

drop policy if exists "Ambassadors can view own activities"
  on public.ambassador_activity_log;
create policy "Ambassadors can view own activities"
on public.ambassador_activity_log
for select
to authenticated
using (
  exists (
    select 1
    from public.ambassadors a
    where a.id = ambassador_id
      and a.user_id = auth.uid()
  )
  or public.is_sitguru_admin_user()
);

drop policy if exists "Ambassadors can create own activities"
  on public.ambassador_activity_log;
create policy "Ambassadors can create own activities"
on public.ambassador_activity_log
for insert
to authenticated
with check (
  exists (
    select 1
    from public.ambassadors a
    where a.id = ambassador_id
      and a.user_id = auth.uid()
  )
  or public.is_sitguru_admin_user()
);

drop policy if exists "Ambassadors can update own activities"
  on public.ambassador_activity_log;
create policy "Ambassadors can update own activities"
on public.ambassador_activity_log
for update
to authenticated
using (
  exists (
    select 1
    from public.ambassadors a
    where a.id = ambassador_id
      and a.user_id = auth.uid()
  )
  or public.is_sitguru_admin_user()
)
with check (
  exists (
    select 1
    from public.ambassadors a
    where a.id = ambassador_id
      and a.user_id = auth.uid()
  )
  or public.is_sitguru_admin_user()
);

drop policy if exists "Ambassadors can delete own planned activities"
  on public.ambassador_activity_log;
create policy "Ambassadors can delete own planned activities"
on public.ambassador_activity_log
for delete
to authenticated
using (
  (
    status in ('planned', 'deferred', 'cancelled')
    and exists (
      select 1
      from public.ambassadors a
      where a.id = ambassador_id
        and a.user_id = auth.uid()
    )
  )
  or public.is_sitguru_admin_user()
);

-- Marketing effort policies

drop policy if exists "Ambassadors can view own marketing efforts"
  on public.ambassador_marketing_efforts;
create policy "Ambassadors can view own marketing efforts"
on public.ambassador_marketing_efforts
for select
to authenticated
using (
  exists (
    select 1
    from public.ambassadors a
    where a.id = ambassador_id
      and a.user_id = auth.uid()
  )
  or public.is_sitguru_admin_user()
);

drop policy if exists "Ambassadors can create own marketing efforts"
  on public.ambassador_marketing_efforts;
create policy "Ambassadors can create own marketing efforts"
on public.ambassador_marketing_efforts
for insert
to authenticated
with check (
  exists (
    select 1
    from public.ambassadors a
    where a.id = ambassador_id
      and a.user_id = auth.uid()
  )
  or public.is_sitguru_admin_user()
);

drop policy if exists "Ambassadors can update own marketing efforts"
  on public.ambassador_marketing_efforts;
create policy "Ambassadors can update own marketing efforts"
on public.ambassador_marketing_efforts
for update
to authenticated
using (
  exists (
    select 1
    from public.ambassadors a
    where a.id = ambassador_id
      and a.user_id = auth.uid()
  )
  or public.is_sitguru_admin_user()
)
with check (
  exists (
    select 1
    from public.ambassadors a
    where a.id = ambassador_id
      and a.user_id = auth.uid()
  )
  or public.is_sitguru_admin_user()
);

drop policy if exists "Ambassadors can delete own marketing efforts"
  on public.ambassador_marketing_efforts;
create policy "Ambassadors can delete own marketing efforts"
on public.ambassador_marketing_efforts
for delete
to authenticated
using (
  exists (
    select 1
    from public.ambassadors a
    where a.id = ambassador_id
      and a.user_id = auth.uid()
  )
  or public.is_sitguru_admin_user()
);

-- Lead policies

drop policy if exists "Ambassadors can view own generated leads"
  on public.ambassador_leads;
create policy "Ambassadors can view own generated leads"
on public.ambassador_leads
for select
to authenticated
using (
  exists (
    select 1
    from public.ambassadors a
    where a.id = ambassador_id
      and a.user_id = auth.uid()
  )
  or public.is_sitguru_admin_user()
);

drop policy if exists "Ambassadors can create own generated leads"
  on public.ambassador_leads;
create policy "Ambassadors can create own generated leads"
on public.ambassador_leads
for insert
to authenticated
with check (
  exists (
    select 1
    from public.ambassadors a
    where a.id = ambassador_id
      and a.user_id = auth.uid()
  )
  or public.is_sitguru_admin_user()
);

drop policy if exists "Ambassadors can update own generated leads"
  on public.ambassador_leads;
create policy "Ambassadors can update own generated leads"
on public.ambassador_leads
for update
to authenticated
using (
  exists (
    select 1
    from public.ambassadors a
    where a.id = ambassador_id
      and a.user_id = auth.uid()
  )
  or public.is_sitguru_admin_user()
)
with check (
  exists (
    select 1
    from public.ambassadors a
    where a.id = ambassador_id
      and a.user_id = auth.uid()
  )
  or public.is_sitguru_admin_user()
);

drop policy if exists "Admins can delete generated leads"
  on public.ambassador_leads;
create policy "Admins can delete generated leads"
on public.ambassador_leads
for delete
to authenticated
using (public.is_sitguru_admin_user());

-- Grants

grant select, insert, update, delete
  on public.ambassador_activity_templates,
     public.ambassador_activity_log,
     public.ambassador_marketing_efforts,
     public.ambassador_leads
  to authenticated;

grant select
  on public.admin_ambassador_activity_summary,
     public.admin_ambassador_lead_pipeline
  to authenticated;

grant all
  on public.ambassador_activity_templates,
     public.ambassador_activity_log,
     public.ambassador_marketing_efforts,
     public.ambassador_leads
  to service_role;

comment on table public.ambassador_activity_log is
  'Ambassador calendar, schedule, activity, event, expo, outreach, hours, proof, and result tracking. Activity hours do not automatically create a reward.';

comment on table public.ambassador_marketing_efforts is
  'Ambassador-entered marketing efforts and measurable results by platform, campaign, location, audience, time, and spend.';

comment on table public.ambassador_leads is
  'Ambassador-generated leads linked to activities and marketing efforts and synchronized into the Admin Sales & Marketing lead pipeline.';

comment on column public.ambassador_activity_log.payout_review_status is
  'Administrative evidence state only. A completed activity or logged hour does not independently qualify for payout.';

comment on column public.ambassador_leads.payout_review_status is
  'Lead evidence state only. Rewards remain controlled by canonical referral and reward qualification rules.';

commit;