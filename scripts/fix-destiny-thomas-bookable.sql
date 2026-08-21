-- Destiny Thomas: approve packet + sync Stripe payout-ready + keep bookable

update public.gurus
set
  stripe_account_id = 'acct_1U374dJQIvJeJ1Tv',
  stripe_connect_status = 'ready',
  stripe_onboarding_complete = true,
  charges_enabled = true,
  payouts_enabled = true,
  is_bookable = true,
  is_public = true,
  is_active = true,
  is_public_visible = true,
  is_accepting_bookings = true,
  accepting_bookings = true,
  application_status = 'bookable',
  admin_status = 'approved',
  booking_status = 'bookable',
  public_status = 'public',
  profile_quality_status = 'bookable',
  status = 'active',
  updated_at = now()
where id = '7384e5d7-97c6-4f0e-a386-8aaa0a3d9f34';

update public.guru_onboarding_packets
set
  status = 'approved',
  reviewed_at = now(),
  admin_notes = 'Approved by admin — packet complete; Stripe payouts confirmed active.',
  updated_at = now()
where user_id = '3b8eba2f-162e-4e53-9cdc-7cbc604dfb99';

select
  g.id::text as guru_id,
  coalesce(g.display_name, g.full_name, g.name) as name,
  g.stripe_account_id,
  g.stripe_connect_status,
  g.stripe_onboarding_complete,
  g.charges_enabled,
  g.payouts_enabled,
  g.is_bookable,
  g.application_status,
  g.admin_status,
  g.booking_status,
  p.status as packet_status,
  p.reviewed_at
from public.gurus g
left join public.guru_onboarding_packets p
  on p.user_id = g.user_id
where g.id = '7384e5d7-97c6-4f0e-a386-8aaa0a3d9f34';
