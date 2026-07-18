begin;

create extension if not exists pgcrypto;

create table if not exists public.user_payout_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_role text not null,
  preferred_provider text null,
  setup_timing text not null default 'deferred',
  allow_setup_later boolean not null default true,
  setup_required boolean not null default false,
  setup_completed boolean not null default false,
  setup_completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_payout_preferences_role_check
    check (workspace_role in ('guru', 'ambassador')),
  constraint user_payout_preferences_provider_check
    check (
      preferred_provider is null
      or preferred_provider in ('stripe_connect', 'paypal')
    ),
  constraint user_payout_preferences_timing_check
    check (
      setup_timing in (
        'deferred',
        'before_first_paid_booking',
        'before_first_payout'
      )
    ),
  constraint user_payout_preferences_user_role_unique
    unique (user_id, workspace_role)
);

create table if not exists public.user_payout_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_role text not null,
  provider text not null,
  provider_account_id text null,
  provider_merchant_id text null,
  status text not null default 'not_started',
  details_submitted boolean not null default false,
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  is_primary boolean not null default false,
  onboarding_started_at timestamptz null,
  onboarding_completed_at timestamptz null,
  last_checked_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_payout_accounts_role_check
    check (workspace_role in ('guru', 'ambassador')),
  constraint user_payout_accounts_provider_check
    check (provider in ('stripe_connect', 'paypal')),
  constraint user_payout_accounts_status_check
    check (
      status in (
        'not_started',
        'pending',
        'ready',
        'restricted',
        'disabled'
      )
    ),
  constraint user_payout_accounts_user_role_provider_unique
    unique (user_id, workspace_role, provider)
);

create unique index if not exists user_payout_accounts_primary_unique
  on public.user_payout_accounts (user_id, workspace_role)
  where is_primary = true;

create unique index if not exists user_payout_accounts_provider_id_unique
  on public.user_payout_accounts (provider, provider_account_id)
  where provider_account_id is not null
    and provider_account_id <> '';

create index if not exists user_payout_accounts_user_role_idx
  on public.user_payout_accounts (user_id, workspace_role);

create index if not exists user_payout_accounts_status_idx
  on public.user_payout_accounts (status);

create table if not exists public.user_payout_destinations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_role text not null default 'ambassador',
  provider text not null default 'paypal_payouts',
  channel text not null,
  recipient_type text not null,
  recipient_value text not null,
  masked_value text null,
  status text not null default 'unverified',
  is_primary boolean not null default false,
  verified_at timestamptz null,
  disabled_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_payout_destinations_role_check
    check (workspace_role = 'ambassador'),
  constraint user_payout_destinations_provider_check
    check (provider = 'paypal_payouts'),
  constraint user_payout_destinations_channel_check
    check (channel in ('paypal', 'venmo')),
  constraint user_payout_destinations_recipient_type_check
    check (recipient_type in ('email', 'mobile', 'paypal_id')),
  constraint user_payout_destinations_status_check
    check (status in ('unverified', 'verified', 'disabled'))
);

create unique index if not exists user_payout_destinations_primary_unique
  on public.user_payout_destinations (user_id, workspace_role)
  where is_primary = true
    and status <> 'disabled';

create index if not exists user_payout_destinations_user_idx
  on public.user_payout_destinations (user_id);

create index if not exists user_payout_destinations_status_idx
  on public.user_payout_destinations (status);

alter table public.booking_payments
  add column if not exists payment_provider text default 'stripe',
  add column if not exists payout_provider text,
  add column if not exists provider_order_id text,
  add column if not exists provider_payment_id text,
  add column if not exists provider_capture_id text,
  add column if not exists provider_refund_id text,
  add column if not exists provider_payer_id text,
  add column if not exists provider_seller_id text,
  add column if not exists paypal_order_id text,
  add column if not exists paypal_capture_id text,
  add column if not exists paypal_refund_id text,
  add column if not exists paypal_payer_id text,
  add column if not exists paypal_seller_merchant_id text,
  add column if not exists payout_account_id uuid
    references public.user_payout_accounts(id) on delete set null;

update public.booking_payments
set payment_provider = coalesce(
  nullif(payment_provider, ''),
  nullif(provider, ''),
  'stripe'
);

create unique index if not exists booking_payments_provider_order_unique
  on public.booking_payments (payment_provider, provider_order_id)
  where provider_order_id is not null
    and provider_order_id <> '';

create unique index if not exists booking_payments_provider_capture_unique
  on public.booking_payments (payment_provider, provider_capture_id)
  where provider_capture_id is not null
    and provider_capture_id <> '';

create unique index if not exists booking_payments_paypal_order_unique
  on public.booking_payments (paypal_order_id)
  where paypal_order_id is not null
    and paypal_order_id <> '';

create unique index if not exists booking_payments_paypal_capture_unique
  on public.booking_payments (paypal_capture_id)
  where paypal_capture_id is not null
    and paypal_capture_id <> '';

create index if not exists booking_payments_payment_provider_idx
  on public.booking_payments (payment_provider);

create index if not exists booking_payments_payout_provider_idx
  on public.booking_payments (payout_provider);

alter table public.bookings
  add column if not exists payment_provider text,
  add column if not exists payout_provider text,
  add column if not exists payout_account_id uuid
    references public.user_payout_accounts(id) on delete set null;

create or replace function public.set_financial_model_updated_at()
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

drop trigger if exists set_user_payout_preferences_updated_at
  on public.user_payout_preferences;

create trigger set_user_payout_preferences_updated_at
before update on public.user_payout_preferences
for each row
execute function public.set_financial_model_updated_at();

drop trigger if exists set_user_payout_accounts_updated_at
  on public.user_payout_accounts;

create trigger set_user_payout_accounts_updated_at
before update on public.user_payout_accounts
for each row
execute function public.set_financial_model_updated_at();

drop trigger if exists set_user_payout_destinations_updated_at
  on public.user_payout_destinations;

create trigger set_user_payout_destinations_updated_at
before update on public.user_payout_destinations
for each row
execute function public.set_financial_model_updated_at();

insert into public.user_payout_preferences (
  user_id,
  workspace_role,
  preferred_provider,
  setup_timing,
  allow_setup_later,
  setup_required,
  setup_completed
)
select distinct
  ur.user_id,
  'guru',
  null,
  'before_first_paid_booking',
  true,
  false,
  false
from public.user_roles ur
where lower(ur.role::text) = 'guru'
on conflict (user_id, workspace_role) do nothing;

insert into public.user_payout_preferences (
  user_id,
  workspace_role,
  preferred_provider,
  setup_timing,
  allow_setup_later,
  setup_required,
  setup_completed
)
select distinct
  ur.user_id,
  'ambassador',
  'paypal',
  'before_first_payout',
  true,
  false,
  false
from public.user_roles ur
where lower(ur.role::text) = 'ambassador'
on conflict (user_id, workspace_role) do nothing;

alter table public.user_payout_preferences enable row level security;
alter table public.user_payout_accounts enable row level security;
alter table public.user_payout_destinations enable row level security;

drop policy if exists "Users can view own payout preferences"
  on public.user_payout_preferences;

create policy "Users can view own payout preferences"
on public.user_payout_preferences
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own payout preferences"
  on public.user_payout_preferences;

create policy "Users can create own payout preferences"
on public.user_payout_preferences
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own payout preferences"
  on public.user_payout_preferences;

create policy "Users can update own payout preferences"
on public.user_payout_preferences
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can view own payout accounts"
  on public.user_payout_accounts;

create policy "Users can view own payout accounts"
on public.user_payout_accounts
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view own payout destinations"
  on public.user_payout_destinations;

create policy "Users can view own payout destinations"
on public.user_payout_destinations
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins can manage payout preferences"
  on public.user_payout_preferences;

create policy "Admins can manage payout preferences"
on public.user_payout_preferences
for all
to authenticated
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and lower(ur.role::text) = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and lower(ur.role::text) = 'admin'
  )
);

drop policy if exists "Admins can manage payout accounts"
  on public.user_payout_accounts;

create policy "Admins can manage payout accounts"
on public.user_payout_accounts
for all
to authenticated
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and lower(ur.role::text) = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and lower(ur.role::text) = 'admin'
  )
);

drop policy if exists "Admins can manage payout destinations"
  on public.user_payout_destinations;

create policy "Admins can manage payout destinations"
on public.user_payout_destinations
for all
to authenticated
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and lower(ur.role::text) = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and lower(ur.role::text) = 'admin'
  )
);

grant select, insert, update
  on public.user_payout_preferences
  to authenticated;

grant select
  on public.user_payout_accounts
  to authenticated;

grant select
  on public.user_payout_destinations
  to authenticated;

grant all
  on public.user_payout_preferences,
     public.user_payout_accounts,
     public.user_payout_destinations
  to service_role;

comment on table public.user_payout_preferences is
  'Role-specific payout preference and deferred setup timing. Financial onboarding is not required during initial signup.';

comment on table public.user_payout_accounts is
  'Connected Stripe Connect or PayPal payout accounts for Guru and Ambassador workspaces. Processor readiness fields are server-managed.';

comment on table public.user_payout_destinations is
  'Lightweight PayPal or Venmo payout destinations for Ambassador rewards without merchant onboarding.';

comment on column public.user_payout_preferences.setup_timing is
  'Gurus complete payout setup before accepting their first paid booking; Ambassadors complete payout setup before their first payout.';

comment on column public.booking_payments.payment_provider is
  'Processor used for the customer payment, such as stripe or paypal.';

comment on column public.booking_payments.payout_provider is
  'Processor used for the connected Guru payout for this transaction.';

commit;