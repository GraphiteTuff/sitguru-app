/**
 * Pet Events FAQ chips for Delilah on mobile event screens.
 * Keep aligned with web `lib/ai/community-events-faqs.ts` chip set.
 */

export const COMMUNITY_EVENT_FAQ_CHIPS = [
  { label: "What's on?", question: 'What pet events are coming up?' },
  {
    label: 'Attending?',
    question: 'How does Attending Yes Maybe No work?',
  },
  { label: 'Need account?', question: 'Do I need a SitGuru account to RSVP?' },
  { label: 'Pet friendly?', question: 'Are pet events pet friendly?' },
  { label: 'Free events?', question: 'Are SitGuru pet events free?' },
  { label: 'Host an event', question: 'How do Pet Event Planners and Managers publish Partner Events on SitGuru?' },
  { label: 'Track RSVPs', question: 'How do I track Yes Maybe No attendance on my event?' },
  { label: 'Features', question: 'What features does SitGuru offer?' },
  { label: 'Follow us', question: 'Where can I follow SitGuru on social media?' },
  { label: 'Email updates', question: 'How do I subscribe for email updates?' },
  { label: 'Pet Parent', question: 'How do I join as a Pet Parent?' },
] as const;

export const COMMUNITY_EVENT_FAQ_ANSWERS: Record<string, string> = {
  'What pet events are coming up?':
    "I've got the live upcoming list in my pack notes — ask about a city, date, or named event, or open Pet Events to browse the full map!",
  'How does Attending Yes Maybe No work?':
    'On each event card, tap Yes, Maybe, or No — hosts see live counts. Change your mind anytime.',
  "How does I'm Going work?":
    'On each event card, use Attending? and tap Yes, Maybe, or No — hosts see live counts so they know who is excited!',
  'Do I need a SitGuru account to RSVP?':
    'Nope — you can tap Yes / Maybe / No as a guest! A free SitGuru account still helps you save favorites and meet Gurus.',
  'Are pet events pet friendly?':
    'Many are! Look for the Pet Friendly badge and check the host notes for leash or vaccine details.',
  'Are community events pet friendly?':
    'Many are! Look for the Pet Friendly badge and check the host notes for leash or vaccine details.',
  'Are SitGuru pet events free?':
    'Many listings are free pack gathers — others link to tickets on the partner site.',
  'Are SitGuru community events free?':
    'Many listings are free pack gathers — others link to tickets on the partner site.',
  'How do Pet Event Planners and Managers publish Partner Events on SitGuru?':
    'Become a Pet Event Planner or Manager, then publish Partner Events from the host tools so they stay first in the feed.',
  'How do I track Yes Maybe No attendance on my event?':
    'Open your event listing — live Yes / Maybe / No counters update as guests tap Attending.',
  'What features does SitGuru offer?':
    'SitGuru brings Guru matching, in-app booking, PawReport Live, PawPerks, and Pet Events together. Join free, follow @SitGuruOfficial, and subscribe for updates.',
  'Where can I follow SitGuru on social media?':
    'Follow @SitGuruOfficial on Facebook, Instagram, TikTok, X, and YouTube — same handle everywhere.',
  'How do I subscribe for email updates?':
    'Subscribe with your email for SitGuru news, offers, and event updates — unsubscribe anytime.',
  'How do I join as a Pet Parent?':
    'Create a free Pet Parent account in minutes — then RSVP, find trusted local Gurus, and keep pet care in one place.',
};

export function matchCommunityEventFaq(question: string) {
  const normalized = question.trim().toLowerCase();
  for (const [key, answer] of Object.entries(COMMUNITY_EVENT_FAQ_ANSWERS)) {
    if (key.toLowerCase() === normalized) {
      return { question: key, answer };
    }
  }
  return null;
}
