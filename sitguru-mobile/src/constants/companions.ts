export type CompanionId = 'rogue' | 'taco' | 'scout';

/** Role that unlocks the officer `dashboard` surface for Scout / Taco. */
export type CompanionDashboardRole = 'guru' | 'ambassador' | null;

export type CompanionSuggestion = {
  id: string;
  label: string;
  prompt: string;
};

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
  /** Streaming endpoint on the SitGuru web app. */
  streamPath: '/api/chat/send' | '/api/ai/officer-stream';
  /** `pagePath` reported to the server for chat insight attribution. */
  pagePath: string;
  /** Round portrait served by the SitGuru web origin. */
  avatarPath: string;
  /** Opening assistant turn shown before the visitor types anything. */
  greeting: string;
  composerPlaceholder: string;
  /** Only Scout and Taco have a role-gated dashboard surface. */
  dashboardRole: CompanionDashboardRole;
  /** Prompt chips, copy matched to the web companion components. */
  suggestions: CompanionSuggestion[];
};

/**
 * Mobile mirror of sitguru.com AI Pet Companions (Rogue / Taco / Scout).
 *
 * Chip copy is ported from the web surfaces so both platforms offer the same
 * entry points: `components/messaging/HomepageChatBubble.tsx` (Rogue),
 * `components/officers/AIScoutCompanion.tsx`, and
 * `components/officers/AITacoCompanion.tsx`.
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
    streamPath: '/api/chat/send',
    pagePath: '/',
    avatarPath: '/images/rogue-avatar.png',
    greeting:
      "Rogue here, Chief Treat Officer. Tell me what your pack needs and I'll point you at the right care.",
    composerPlaceholder: 'Ask Rogue about care…',
    dashboardRole: null,
    suggestions: [
      {
        id: 'drop_in_visits',
        label: 'Drop-in Visits',
        prompt: 'Looking for Drop-in Visits',
      },
      { id: 'dog_walks', label: 'Dog Walks', prompt: 'Looking for Dog Walks' },
      {
        id: 'overnight',
        label: 'Overnight',
        prompt: 'Looking for Overnight Stays',
      },
      { id: 'boarding', label: 'Boarding', prompt: 'Looking for Boarding' },
      {
        id: 'companion_benefits',
        label: 'Pet Parent Benefits',
        prompt: 'Tell me about Pet Parent Benefits',
      },
      {
        id: 'become_sitter',
        label: 'Sitter',
        prompt: 'Want to register as a Sitter',
      },
      {
        id: 'become_walker',
        label: 'Dog Walker',
        prompt: 'Want to register as a Dog Walker',
      },
      {
        id: 'become_trainer',
        label: 'Trainer',
        prompt: 'Want to register as a Trainer',
      },
    ],
  },
  {
    id: 'taco',
    name: 'Taco',
    title: 'Ambassador Advocate',
    audience: 'Ambassadors',
    helper:
      'Community growth, creator perks, and Ambassador onboarding with main-character energy.',
    benefitsLabel: 'Ambassador Benefits',
    deepDiveRoute: '/ai-companion',
    ctaLabel: 'Chat with Taco',
    setupRoute: '/ambassador-setup',
    streamPath: '/api/ai/officer-stream',
    pagePath: '/ambassadors',
    avatarPath: '/images/taco-avatar.png',
    greeting:
      "Taco here, your Ambassador Advocate. Referrals, PetPerks, link drops — what are we building today?",
    composerPlaceholder: 'Ask Taco about the pack…',
    dashboardRole: 'ambassador',
    suggestions: [
      {
        id: 'join_pack',
        label: 'Join the Pack',
        prompt:
          'I want to become a SitGuru Ambassador. What are the first steps to apply and get my referral tools?',
      },
      {
        id: 'companion_benefits',
        label: 'Ambassador Benefits',
        prompt: 'Tell me about Ambassador Benefits',
      },
      {
        id: 'what_ambassadors_do',
        label: 'What you do',
        prompt: 'What do Ambassadors do?',
      },
      {
        id: 'petperks_rewards',
        label: 'PetPerks',
        prompt: 'What is PetPerks for Ambassadors?',
      },
      {
        id: 'referral_link',
        label: 'Referral Link',
        prompt: 'How do I get my referral link and QR code?',
      },
      {
        id: 'who_can_apply',
        label: 'Who can apply?',
        prompt: 'Who can become a SitGuru Ambassador?',
      },
      {
        id: 'followers',
        label: 'Need followers?',
        prompt: 'Do I need a huge social following?',
      },
      {
        id: 'track_metrics',
        label: 'Track Metrics',
        prompt: 'What metrics can I track as an Ambassador?',
      },
    ],
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
    ctaLabel: 'Chat with Scout',
    setupRoute: '/guru-setup',
    streamPath: '/api/ai/officer-stream',
    pagePath: '/become-a-guru',
    avatarPath: '/images/scout-avatar.png',
    greeting:
      "Scout here, Guru Matching Officer. I'll guide your setup, checks, and earnings path — where do you want to start?",
    composerPlaceholder: 'Ask Scout about your Guru path…',
    dashboardRole: 'guru',
    suggestions: [
      {
        id: 'start_profile',
        label: 'Start Free Profile',
        prompt:
          'I want to start my free Guru profile. Walk me through the first setup steps so I can get bookable.',
      },
      {
        id: 'free_to_apply',
        label: 'Free to apply?',
        prompt: 'Is it free to apply?',
      },
      {
        id: 'companion_benefits',
        label: 'Guru Benefits',
        prompt: 'Tell me about Guru Benefits',
      },
      {
        id: 'payments_work',
        label: 'Payments',
        prompt: 'How do payments work?',
      },
      {
        id: 'services_offer',
        label: 'Services',
        prompt: 'What services can I offer?',
      },
      {
        id: 'schedule',
        label: 'My Schedule',
        prompt:
          'Help me review my dashboard schedule for today — what visits or walks need attention?',
      },
      {
        id: 'pawreport',
        label: 'PawReport',
        prompt: 'What is PawReport Live?',
      },
    ],
  },
];

export function getCompanionWebChatUrl(id: CompanionId) {
  if (id === 'scout') return 'https://www.sitguru.com/become-a-guru?chat=scout';
  if (id === 'taco') return 'https://www.sitguru.com/ambassadors?chat=taco';
  return 'https://www.sitguru.com/?chat=rogue#ai-companions';
}

export function getCompanion(id: string | null | undefined) {
  const key = String(id || '').toLowerCase();
  return AI_COMPANIONS.find((item) => item.id === key) ?? AI_COMPANIONS[0];
}
