-- SitGuru payout provider constraint alignment
-- Allows the shared Guru and Ambassador payout flows to save
-- Stripe, PayPal, Venmo, or a deferred setup choice.

begin;

alter table public.user_payout_preferences
  drop constraint if exists user_payout_preferences_provider_check;

alter table public.user_payout_preferences
  add constraint user_payout_preferences_provider_check
  check (
    preferred_provider is null
    or preferred_provider = any (
      array[
        'stripe'::text,
        'stripe_connect'::text,
        'paypal'::text,
        'venmo'::text,
        'set_up_later'::text
      ]
    )
  );

comment on constraint user_payout_preferences_provider_check
on public.user_payout_preferences
is 'Allows shared Guru and Ambassador payout choices while preserving legacy Stripe Connect values.';

notify pgrst, 'reload schema';

commit;