-- SitGuru team-member Timekeeper + Payment Periods (Ava / Growth managers).
-- Separate from internship_time_logs and marketplace Guru payouts.
-- Service-role writes; authenticated SELECT only via sitguru_live_signals sync.
-- No bank routing/account numbers stored.

begin;

create table if not exists public.staff_engagements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  email text not null default '',
  display_name text not null default '',
  title text not null default 'Social & Community Growth Manager',
  status text not null default 'active',
  expected_weekly_min_hours numeric(6,2) not null default 10,
  expected_weekly_max_hours numeric(6,2) not null default 15,
  payment_cadence text not null default 'biweekly',
  period_anchor_on date not null default date '2025-11-02',
  currency text not null default 'USD',
  w9_status text not null default 'not_requested',
  employment_classification text not null default 'contractor',
  start_on date null,
  end_on date null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_engagements_user_unique unique (user_id),
  constraint staff_engagements_weekly_range_check
    check (expected_weekly_min_hours >= 0 and expected_weekly_max_hours >= expected_weekly_min_hours)
);

create index if not exists staff_engagements_status_idx
  on public.staff_engagements (status, updated_at desc);

create table if not exists public.staff_compensation_rates (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references public.staff_engagements(id) on delete cascade,
  hourly_rate_cents integer not null,
  effective_on date not null,
  ended_on date null,
  created_by uuid null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  constraint staff_compensation_rates_positive check (hourly_rate_cents > 0)
);

create index if not exists staff_compensation_rates_engagement_eff_idx
  on public.staff_compensation_rates (engagement_id, effective_on desc);

create table if not exists public.staff_time_categories (
  slug text primary key,
  label text not null,
  sort_order integer not null default 100,
  is_active boolean not null default true
);

insert into public.staff_time_categories (slug, label, sort_order) values
  ('growth_strategy', 'Growth Strategy', 10),
  ('social_content', 'Social & Content', 20),
  ('community_events', 'Community / Events', 30),
  ('ambassador_program', 'Ambassador Program', 40),
  ('market_research', 'Market Research / Surveys', 50),
  ('analytics_reporting', 'Analytics & Reporting', 60),
  ('partnerships_outreach', 'Partnerships / Outreach', 70),
  ('intern_leadership', 'Intern Leadership', 80),
  ('meetings', 'Meetings', 90),
  ('administrative', 'Administrative', 100),
  ('other_approved', 'Other Approved Work', 110)
on conflict (slug) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  is_active = true;

create table if not exists public.staff_payment_periods (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references public.staff_engagements(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  status text not null default 'draft',
  total_hours numeric(8,2) not null default 0,
  amount_cents integer not null default 0,
  currency text not null default 'USD',
  submitted_at timestamptz null,
  submitted_by uuid null,
  approved_at timestamptz null,
  approved_by uuid null,
  ready_at timestamptz null,
  processing_at timestamptz null,
  paid_at timestamptz null,
  needs_correction_at timestamptz null,
  correction_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_payment_periods_range check (period_end >= period_start),
  constraint staff_payment_periods_unique unique (engagement_id, period_start, period_end)
);

create index if not exists staff_payment_periods_status_idx
  on public.staff_payment_periods (status, period_end desc);

create table if not exists public.staff_time_entries (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references public.staff_engagements(id) on delete cascade,
  user_id uuid not null,
  payment_period_id uuid null references public.staff_payment_periods(id) on delete set null,
  worked_on date not null,
  hours numeric(6,2) not null,
  category_slug text not null default 'other_approved'
    references public.staff_time_categories(slug),
  description text not null default '',
  growth_initiative_id uuid null,
  status text not null default 'draft',
  timer_started_at timestamptz null,
  timer_stopped_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_time_entries_hours_check check (hours > 0 and hours <= 24)
);

create index if not exists staff_time_entries_engagement_day_idx
  on public.staff_time_entries (engagement_id, worked_on desc);

create index if not exists staff_time_entries_period_idx
  on public.staff_time_entries (payment_period_id, status);

create table if not exists public.staff_payment_records (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references public.staff_engagements(id) on delete cascade,
  payment_period_id uuid not null references public.staff_payment_periods(id) on delete restrict,
  approved_hours numeric(8,2) not null,
  amount_cents integer not null,
  currency text not null default 'USD',
  rate_summary text not null default '',
  payment_method text not null default 'manual_bank_ach',
  provider text not null default 'graff_enterprises_llc',
  expense_category text not null default 'Contract Labor',
  initiated_on date null,
  paid_on date null,
  external_reference text not null default '',
  recorded_by uuid null,
  notes text not null default '',
  status text not null default 'paid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_payment_records_period_unique unique (payment_period_id)
);

create index if not exists staff_payment_records_paid_on_idx
  on public.staff_payment_records (paid_on desc nulls last);

-- RLS: deny client access to business tables (service-role only). Sync via sitguru_live_signals.
alter table public.staff_engagements enable row level security;
alter table public.staff_compensation_rates enable row level security;
alter table public.staff_time_categories enable row level security;
alter table public.staff_time_entries enable row level security;
alter table public.staff_payment_periods enable row level security;
alter table public.staff_payment_records enable row level security;

revoke all on table public.staff_engagements from anon, authenticated;
revoke all on table public.staff_compensation_rates from anon, authenticated;
revoke all on table public.staff_time_categories from anon, authenticated;
revoke all on table public.staff_time_entries from anon, authenticated;
revoke all on table public.staff_payment_periods from anon, authenticated;
revoke all on table public.staff_payment_records from anon, authenticated;

-- Categories are non-sensitive reference data; allow authenticated read for forms.
grant select on table public.staff_time_categories to authenticated;
drop policy if exists staff_time_categories_select on public.staff_time_categories;
create policy staff_time_categories_select
  on public.staff_time_categories
  for select
  to authenticated
  using (is_active = true);

commit;
