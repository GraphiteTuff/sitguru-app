-- Private paid-team personal profile. Do not store SSNs, taxpayer IDs, dates of birth or banking details.
-- All reads/writes go through authenticated, authorization-checked server code.
create table if not exists public.staff_personal_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  legal_name text not null,
  preferred_name text not null default '',
  contact_email text not null,
  phone text not null,
  address_line1 text not null,
  address_line2 text not null default '',
  city text not null,
  state text not null,
  postal_code text not null,
  primary_work_state text not null,
  emergency_contact_name text not null default '',
  emergency_contact_phone text not null default '',
  emergency_contact_relationship text not null default '',
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_profile_state_code_check check (
    state ~ '^[A-Z]{2}$' and primary_work_state ~ '^[A-Z]{2}$'
  ),
  constraint staff_profile_postal_check check (postal_code ~ '^[0-9]{5}(-[0-9]{4})?$'),
  constraint staff_profile_required_nonblank check (
    char_length(trim(legal_name)) > 0 and char_length(trim(phone)) > 0
    and char_length(trim(address_line1)) > 0 and char_length(trim(city)) > 0
  )
);

comment on table public.staff_personal_profiles is
  'Private paid-team contact and emergency profile. No SSNs, taxpayer IDs, dates of birth or banking data. Only authorization-checked server flows may access.';

alter table public.staff_personal_profiles enable row level security;
revoke all on table public.staff_personal_profiles from public, anon, authenticated;
