/**
 * Mobile conversion hierarchy
 *
 * PRIMARY (always visible, never buried):
 * - Book / Find Care / Join / Pay / Accept booking
 *
 * SECONDARY (discoverable via chips & carousels, not competing tabs):
 * - Pet Events, AI companions, PawPerks, Pet Passports
 *
 * Tabs stay at 5 max: Home · Explore · Bookings/Join · Messages · Profile
 * Experiences use SitGuruFeatureChips — never replace the sticky book CTA.
 */

export const MOBILE_CONVERT = {
  bookLabel: 'Book care near you',
  bookHelper: 'Free to browse · Nothing charged until a Guru accepts',
  exploreHref: '/find-care',
  joinHref: '/signup',
  joinParams: { role: 'parent' as const },
} as const;

export type ExperienceIconKey =
  | 'events'
  | 'rogue'
  | 'delilah'
  | 'passports'
  | 'pawperks'
  | 'explore';

export type MobileExperience = {
  id: string;
  label: string;
  href: string;
  params?: Record<string, string>;
  icon: ExperienceIconKey;
};

/** Signed-out marketing home & explore-adjacent surfaces */
export const VISITOR_EXPERIENCES: MobileExperience[] = [
  {
    id: 'events',
    label: 'Pet Events',
    icon: 'events',
    href: '/community-events',
  },
  {
    id: 'rogue',
    label: 'Ask Rogue',
    icon: 'rogue',
    href: '/ai-companion',
    params: { id: 'rogue' },
  },
  {
    id: 'delilah',
    label: 'Pet Events AI',
    icon: 'delilah',
    href: '/ai-companion',
    params: { id: 'delilah' },
  },
];

/** Signed-in pet parent — booking-first; extras as chips only */
export const PET_PARENT_EXPERIENCES: MobileExperience[] = [
  {
    id: 'events',
    label: 'Pet Events',
    icon: 'events',
    href: '/community-events',
  },
  {
    id: 'passports',
    label: 'Pet Passports',
    icon: 'passports',
    href: '/pet-passports',
  },
  {
    id: 'pawperks',
    label: 'PawPerks',
    icon: 'pawperks',
    href: '/pawperks',
  },
  {
    id: 'rogue',
    label: 'Ask Rogue',
    icon: 'rogue',
    href: '/ai-companion',
    params: { id: 'rogue' },
  },
];

/** On event screens — always tie back to booking */
export const EVENT_SCREEN_EXPERIENCES: MobileExperience[] = [
  {
    id: 'explore',
    label: 'Find a Guru',
    icon: 'explore',
    href: '/find-care',
  },
  {
    id: 'delilah',
    label: 'Ask Delilah',
    icon: 'delilah',
    href: '/ai-companion',
    params: { id: 'delilah' },
  },
];
