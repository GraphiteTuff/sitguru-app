export const COMMUNITY_EVENT_FAQ_CHIPS = [
  { label: "I'm Going?", question: "How does I'm Going work?" },
  { label: "Need account?", question: "Do I need a SitGuru account to RSVP?" },
  { label: "Pet friendly?", question: "Are community events pet friendly?" },
  { label: "Free events?", question: "Are SitGuru community events free?" },
  { label: "Meet Gurus", question: "Can I meet local Gurus at events?" },
  { label: "Features", question: "What features does SitGuru offer?" },
  { label: "Follow us", question: "Where can I follow SitGuru on social media?" },
  { label: "Email updates", question: "How do I subscribe for email updates?" },
  { label: "Pet Parent", question: "How do I join as a Pet Parent?" },
] as const;

export const COMMUNITY_EVENT_FAQ_ANSWERS: Record<string, string> = {
  "How does I'm Going work?":
    "Tap I'm Going to RSVP. You'll see who's coming — Pet Parents, Gurus, and Ambassadors — and get ready for the day. Free accounts take about a minute.",
  "Do I need a SitGuru account to RSVP?":
    "Yes — a free SitGuru account lets you RSVP, get updates, and connect with the community before and after the event.",
  "Are community events pet friendly?":
    "Many are! Look for the Pet Friendly badge. Always check the event description for leash or vaccine notes from the host.",
  "Are SitGuru community events free?":
    "Many listings are free community gatherings — others link to tickets on the partner's site.",
  "Can I meet local Gurus at events?":
    "Absolutely! Community events are one of the best ways to meet local SitGuru Gurus and pet parents near you.",
  "What features does SitGuru offer?":
    "SitGuru brings Guru matching, in-app booking, PawReport Live, PawPerks, and Pet Events together. Join free, follow @SitGuruOfficial, and subscribe for updates.",
  "Where can I follow SitGuru on social media?":
    "Follow @SitGuruOfficial on Facebook, Instagram, TikTok, X, and YouTube — same handle everywhere.",
  "How do I subscribe for email updates?":
    "Subscribe with your email for SitGuru news, offers, and event updates — unsubscribe anytime.",
  "How do I join as a Pet Parent?":
    "Create a free Pet Parent account in minutes — then RSVP, find trusted local Gurus, and keep pet care in one place.",
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
