/*
 * SitGuru PayPal Multiparty merchant connection records
 *
 * Stores the PayPal onboarding and capability status for each SitGuru Guru.
 *
 * Important:
 * - One user may have separate sandbox and live PayPal merchant records.
 * - Browser clients may read only their own connection record.
 * - All inserts and updates must be performed by trusted SitGuru server routes
 *   using the Supabase service-role client.
 * - PayPal credentials and access tokens are never stored in this table.
 */

create table if not exists public.paypal_merchant_accounts (
  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  environment text not null
    check (environment in ('sandbox', 'live')),

  /*
   * SitGuru-generated correlation ID supplied to PayPal as tracking_id.
   * This lets SitGuru resolve the PayPal merchant ID after onboarding.
   */
  tracking_id text not null,

  /*
   * PayPal Merchant ID returned after the Guru begins or completes onboarding.
   */
  paypal_merchant_id text,

  merchant_email text,

  /*
   * SitGuru's local interpretation of the seller's onboarding state.
   */
  status text not null default 'not_started'
    check (
      status in (
        'not_started',
        'referral_created',
        'pending',
        'connected',
        'limited',
        'disconnected',
        'error'
      )
    ),

  /*
   * PayPal-generated onboarding URL.
   * This can be replaced whenever a new Partner Referral is created.
   */
  onboarding_action_url text,

  /*
   * Merchant integration verification fields returned by PayPal.
   */
  payments_receivable boolean not null default false,
  primary_email_confirmed boolean not null default false,

  oauth_third_party_permissions jsonb not null default '[]'::jsonb,
  products jsonb not null default '[]'::jsonb,
  capabilities jsonb not null default '{}'::jsonb,

  vetting_status text,
  partner_consent_status text,

  /*
   * Full non-secret PayPal merchant-integration response.
   * This supports troubleshooting and future capability additions.
   */
  merchant_details jsonb not null default '{}'::jsonb,

  last_error_code text,
  last_error_message text,

  onboarding_started_at timestamptz,
  onboarding_completed_at timestamptz,
  last_synced_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  primary key (user_id, environment),

  constraint paypal_merchant_accounts_tracking_id_unique
    unique (environment, tracking_id),

  constraint paypal_merchant_accounts_merchant_id_unique
    unique (environment, paypal_merchant_id)
);

/*
 * Helpful indexes for admin reconciliation and webhook lookups.
 */
create index if not exists
  paypal_merchant_accounts_status_idx
on public.paypal_merchant_accounts (environment, status);

create index if not exists
  paypal_merchant_accounts_last_synced_idx
on public.paypal_merchant_accounts (last_synced_at desc);

/*
 * Keep updated_at accurate on all server-side changes.
 */
create or replace function
  public.set_paypal_merchant_accounts_updated_at()
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

drop trigger if exists
  set_paypal_merchant_accounts_updated_at
on public.paypal_merchant_accounts;

create trigger
  set_paypal_merchant_accounts_updated_at
before update
on public.paypal_merchant_accounts
for each row
execute function public.set_paypal_merchant_accounts_updated_at();

/*
 * Row Level Security
 *
 * Gurus can read their own PayPal connection status.
 * They cannot insert, update, or delete these records from the browser.
 * Trusted server routes use the service-role client for mutations.
 */
alter table public.paypal_merchant_accounts
enable row level security;

drop policy if exists
  "Users can view their PayPal merchant connection"
on public.paypal_merchant_accounts;

create policy
  "Users can view their PayPal merchant connection"
on public.paypal_merchant_accounts
for select
to authenticated
using (auth.uid() = user_id);

/*
 * Explicit privilege restrictions.
 */
revoke all
on table public.paypal_merchant_accounts
from anon;

revoke all
on table public.paypal_merchant_accounts
from authenticated;

grant select
on table public.paypal_merchant_accounts
to authenticated;

grant all
on table public.paypal_merchant_accounts
to service_role;

comment on table public.paypal_merchant_accounts is
  'PayPal Multiparty onboarding and merchant capability status for SitGuru users.';

comment on column public.paypal_merchant_accounts.tracking_id is
  'SitGuru-generated ID supplied to the PayPal Partner Referrals API.';

comment on column public.paypal_merchant_accounts.paypal_merchant_id is
  'PayPal Merchant ID used as the payee and for PayPal-Auth-Assertion requests.';

comment on column public.paypal_merchant_accounts.payments_receivable is
  'True only when PayPal reports that the merchant can receive payments.';

comment on column public.paypal_merchant_accounts.primary_email_confirmed is
  'True only when the merchant has confirmed their primary PayPal email.';