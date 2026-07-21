begin;

create extension if not exists pgcrypto;

create table if not exists public.booking_payments (
  id uuid primary key default gen_random_uuid(),

  booking_id text not null,

  payer_user_id uuid null references auth.users(id) on delete set null,
  payee_user_id uuid null references auth.users(id) on delete set null,
  customer_id uuid null references auth.users(id) on delete set null,
  pet_parent_id uuid null references auth.users(id) on delete set null,

  guru_id text null,
  guru_profile_id uuid null,

  provider text not null default 'stripe',
  currency text not null default 'usd',

  status text not null default 'pending',
  payment_method_type text null,
  payment_method_label text null,
  card_brand text null,
  card_last4 text null,

  stripe_checkout_session_id text null,
  stripe_payment_intent_id text null,
  stripe_charge_id text null,

  receipt_url text null,

  subtotal_cents bigint not null default 0,
  marketplace_support_cents bigint not null default 0,
  tax_cents bigint not null default 0,
  tip_cents bigint not null default 0,
  amount_cents bigint not null default 0,

  refund_amount_cents bigint not null default 0,
  refund_status text null,

  dispute_status text null,
  dispute_reason text null,
  dispute_amount_cents bigint not null default 0,

  failure_code text null,
  failure_message text null,

  processing_at timestamptz null,
  paid_at timestamptz null,
  failed_at timestamptz null,
  canceled_at timestamptz null,
  refunded_at timestamptz null,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint booking_payments_nonnegative_amounts check (
    subtotal_cents >= 0
    and marketplace_support_cents >= 0
    and tax_cents >= 0
    and tip_cents >= 0
    and amount_cents >= 0
    and refund_amount_cents >= 0
    and dispute_amount_cents >= 0
  )
);

alter table public.booking_payments
  add column if not exists booking_id text,
  add column if not exists payer_user_id uuid,
  add column if not exists payee_user_id uuid,
  add column if not exists customer_id uuid,
  add column if not exists pet_parent_id uuid,
  add column if not exists guru_id text,
  add column if not exists guru_profile_id uuid,
  add column if not exists provider text default 'stripe',
  add column if not exists currency text default 'usd',
  add column if not exists status text default 'pending',
  add column if not exists payment_method_type text,
  add column if not exists payment_method_label text,
  add column if not exists card_brand text,
  add column if not exists card_last4 text,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists stripe_charge_id text,
  add column if not exists receipt_url text,
  add column if not exists subtotal_cents bigint default 0,
  add column if not exists marketplace_support_cents bigint default 0,
  add column if not exists tax_cents bigint default 0,
  add column if not exists tip_cents bigint default 0,
  add column if not exists amount_cents bigint default 0,
  add column if not exists refund_amount_cents bigint default 0,
  add column if not exists refund_status text,
  add column if not exists dispute_status text,
  add column if not exists dispute_reason text,
  add column if not exists dispute_amount_cents bigint default 0,
  add column if not exists failure_code text,
  add column if not exists failure_message text,
  add column if not exists processing_at timestamptz,
  add column if not exists paid_at timestamptz,
  add column if not exists failed_at timestamptz,
  add column if not exists canceled_at timestamptz,
  add column if not exists refunded_at timestamptz,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.booking_payments
set
  provider = coalesce(nullif(provider, ''), 'stripe'),
  currency = coalesce(nullif(currency, ''), 'usd'),
  status = coalesce(nullif(status, ''), 'pending'),
  subtotal_cents = greatest(coalesce(subtotal_cents, 0), 0),
  marketplace_support_cents = greatest(coalesce(marketplace_support_cents, 0), 0),
  tax_cents = greatest(coalesce(tax_cents, 0), 0),
  tip_cents = greatest(coalesce(tip_cents, 0), 0),
  amount_cents = greatest(coalesce(amount_cents, 0), 0),
  refund_amount_cents = greatest(coalesce(refund_amount_cents, 0), 0),
  dispute_amount_cents = greatest(coalesce(dispute_amount_cents, 0), 0),
  metadata = coalesce(metadata, '{}'::jsonb),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now());

create unique index if not exists booking_payments_payment_intent_unique
  on public.booking_payments (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null
    and stripe_payment_intent_id <> '';

create unique index if not exists booking_payments_checkout_session_unique
  on public.booking_payments (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null
    and stripe_checkout_session_id <> '';

create index if not exists booking_payments_booking_id_idx
  on public.booking_payments (booking_id);

create index if not exists booking_payments_payer_user_id_idx
  on public.booking_payments (payer_user_id);

create index if not exists booking_payments_payee_user_id_idx
  on public.booking_payments (payee_user_id);

create index if not exists booking_payments_status_idx
  on public.booking_payments (status);

create index if not exists booking_payments_created_at_idx
  on public.booking_payments (created_at desc);

create or replace function public.set_booking_payments_updated_at()
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

drop trigger if exists set_booking_payments_updated_at
  on public.booking_payments;

create trigger set_booking_payments_updated_at
before update on public.booking_payments
for each row
execute function public.set_booking_payments_updated_at();

alter table public.booking_payments enable row level security;

drop policy if exists "Users can view their booking payments"
  on public.booking_payments;

create policy "Users can view their booking payments"
on public.booking_payments
for select
to authenticated
using (
  auth.uid() = payer_user_id
  or auth.uid() = payee_user_id
  or auth.uid() = customer_id
  or auth.uid() = pet_parent_id
);

drop policy if exists "Admins can view all booking payments"
  on public.booking_payments;

create policy "Admins can view all booking payments"
on public.booking_payments
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and lower(ur.role::text) = 'admin'
  )
);

drop policy if exists "Admins can update booking payments"
  on public.booking_payments;

create policy "Admins can update booking payments"
on public.booking_payments
for update
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

grant select on public.booking_payments to authenticated;
grant all on public.booking_payments to service_role;

create or replace view public.my_booking_payments
with (security_invoker = true)
as
select *
from public.booking_payments
where
  auth.uid() = payer_user_id
  or auth.uid() = payee_user_id
  or auth.uid() = customer_id
  or auth.uid() = pet_parent_id;

grant select on public.my_booking_payments to authenticated;

comment on table public.booking_payments is
  'Canonical SitGuru payment ledger for booking charges, processing states, receipts, refunds, disputes, and payout-related payment references.';

comment on column public.booking_payments.status is
  'Payment lifecycle status such as pending, processing, paid, failed, canceled, refunded, partially_refunded, disputed, or chargeback.';

comment on column public.booking_payments.amount_cents is
  'Total customer amount represented in the smallest currency unit.';

comment on column public.booking_payments.marketplace_support_cents is
  'SitGuru marketplace support amount represented in the smallest currency unit.';

commit;