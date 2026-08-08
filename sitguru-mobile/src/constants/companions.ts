export type CompanionId = 'rogue' | 'taco' | 'scout';

export type AiCompanionProfile = {
  id: CompanionId;
  name: string;
  title: string;
  audience: string;
  helper: string;
  benefitsLabel: string;
  deepDiveRoute: '/ai-companion';
  ctaLabel: string;
  setupRoute: '/pet-parent-setup' | '/guru-setup' | '/ambassador-setup';
};

/**
 * Mobile mirror of sitguru.com AI Pet Companions (Rogue / Taco / Scout).
 */
export const AI_COMPANIONS: AiCompanionProfile[] = [
  {
    id: 'rogue',
    name: 'Rogue',
    title: 'Chief Treat Officer',
    audience: 'Pet Parents',
    helper:
      'Book care, understand Pet Parent benefits, and keep your pack matched with trusted Gurus.',
    benefitsLabel: 'Pet Parent Benefits',
    deepDiveRoute: '/ai-companion',
    ctaLabel: 'Chat with Rogue',
    setupRoute: '/pet-parent-setup',
  },
  {
    id: 'taco',
    name: 'Taco',
    title: 'Ambassador Hype Officer',
    audience: 'Ambassadors',
    helper:
      'Community growth, creator perks, and Ambassador onboarding with main-character energy.',
    benefitsLabel: 'Ambassador Benefits',
    deepDiveRoute: '/ai-companion',
    ctaLabel: 'Meet Taco',
    setupRoute: '/ambassador-setup',
  },
  {
    id: 'scout',
    name: 'Scout',
    title: 'Guru Matching Officer',
    audience: 'Gurus',
    helper:
      'Profile setup, background checks, earnings windows, and schedule coaching for Gurus.',
    benefitsLabel: 'Guru Benefits',
    deepDiveRoute: '/ai-companion',
    ctaLabel: 'Ask Scout',
    setupRoute: '/guru-setup',
  },
];

export function getCompanion(id: string | null | undefined) {
  const key = String(id || '').toLowerCase();
  return AI_COMPANIONS.find((item) => item.id === key) ?? AI_COMPANIONS[0];
}
