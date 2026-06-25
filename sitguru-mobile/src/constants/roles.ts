import type { SitGuruIconName } from '@/components/SitGuruIconBadge';

export type SitGuruRoleId = 'petParent' | 'guru' | 'ambassador';

export type SitGuruRole = {
  id: SitGuruRoleId;
  dashboardHref:
    | '/pet-parent-dashboard'
    | '/guru-dashboard'
    | '/ambassador-dashboard';
  description: string;
  icon: SitGuruIconName;
  label: string;
  meta: string;
  tone: 'petParent' | 'guru' | 'ambassador';
};

export const sitGuruRoles: SitGuruRole[] = [
  {
    id: 'petParent',
    dashboardHref: '/pet-parent-dashboard',
    description:
      'Message local Gurus, request care, manage pets, and pay securely after care is accepted.',
    icon: 'care',
    label: 'Pet Parent',
    meta: 'Book care',
    tone: 'petParent',
  },
  {
    id: 'guru',
    dashboardHref: '/guru-dashboard',
    description:
      'Manage requests, message pet parents, confirm visits, and prepare Stripe Connect payouts.',
    icon: 'service',
    label: 'Guru',
    meta: 'Earn locally',
    tone: 'guru',
  },
  {
    id: 'ambassador',
    dashboardHref: '/ambassador-dashboard',
    description:
      'Grow local trust, support referrals, track leads, and keep community outreach organized.',
    icon: 'community',
    label: 'Ambassador',
    meta: 'Grow SitGuru',
    tone: 'ambassador',
  },
];

export const registeredRoleIds: SitGuruRoleId[] = [
  'petParent',
  'guru',
  'ambassador',
];

export const registeredRoles = sitGuruRoles.filter((role) =>
  registeredRoleIds.includes(role.id)
);

export const stripeMarketplaceModel = {
  checkout:
    'Pet parents pay through Stripe Checkout after a Guru accepts a booking request.',
  connect:
    'Gurus complete Stripe Connect onboarding before payouts are released to their connected account.',
  chargeType:
    'Marketplace payments are designed around destination charges for one parent, one Guru bookings.',
};
