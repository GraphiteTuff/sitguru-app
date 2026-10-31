/**
 * Grounded product map for Rogue, Scout, Taco, and Delilah.
 * Facts only — companions say them in their own voice. No invented balances.
 */

import type { MarketingFaqEntry } from "@/lib/ai/officer-marketing-faqs";

export const COMPANION_PRODUCT_PARTS = `
SITGURU PARTS (answer the part they asked about, on the page they are on):
- Finding care: Pet Parents search Gurus on SitGuru and book there. Walks, drop-ins, sitting, boarding, day care, and training are Guru services. Never send payment or booking off SitGuru.
- Messages: care talk stays in SitGuru messages. Do not suggest texting a Guru outside the app.
- PawReport Live: during an active visit, Pet Parents can follow the walk. Gurus run the visit from their walk tools. If no visit is live, say so.
- PawPerks: rewards follow current SitGuru terms. Never invent a balance, discount, or payout.
- Pets: Pet Parents keep pet details on their account so Gurus know who they are caring for.
- Payments: checkout and Guru payouts stay on SitGuru. Sales tax can apply at checkout. Never quote a rate that was not returned by a tool or snapshot.
- Rebooking: Pet Parents can return to a favorite Guru and book again on SitGuru.
- Guru profile: signup is free. Gurus set services, rates, hours, and service area, then finish trust steps before Pet Parents can book.
- Guru visits: Gurus review requests, message in the app, and start PawReport Live when the visit is underway. Academy is optional training.
- Ambassadors: they share SitGuru with people they know, use a referral link and QR code, and track results on the Ambassador dashboard. PetPerks are not guaranteed.
- Pet Events: guests RSVP Yes, Maybe, or No. Partners and hosts create, edit, share, and cancel events. Delilah owns event how-tos. Rogue can point Pet Parents at upcoming events.
- Admin HQ: Live Walks, bookings, Human Resources, Ambassadors, the Performance Ledger, Internship Program, and payouts are separate admin screens. Name the screen. Never invent a count that is not in the snapshot.
- If they are already on a screen, talk about that screen first, then the next click. One next step.
`.trim();

export const ROGUE_PRODUCT_PART_FAQS: readonly MarketingFaqEntry[] = [
  {
    question: "How does PawReport Live work?",
    aliases: [
      "what is pawreport",
      "what is pawreport live",
      "can i watch the walk",
      "live walk updates",
      "how do i see the walk",
    ],
    answer:
      "PawReport Live is the in-visit update for an active SitGuru booking. Open it from that booking while the Guru is on the visit. If nothing is live, there is no walk to follow yet.",
  },
  {
    question: "How do SitGuru messages work?",
    aliases: [
      "how do i message my guru",
      "can i text my guru",
      "where do i chat with my guru",
    ],
    answer:
      "Message your Guru inside SitGuru on that booking. Care plans stay in the app, and payment stays on SitGuru too.",
  },
  {
    question: "How do I rebook my Guru?",
    aliases: [
      "book my favorite guru again",
      "rebook",
      "book the same guru",
    ],
    answer:
      "Open your Guru and book the next visit on SitGuru. You do not need a new search if you already know who you want.",
  },
];

export const SCOUT_PRODUCT_PART_FAQS: readonly MarketingFaqEntry[] = [
  {
    question: "How do Guru payouts work?",
    aliases: [
      "when do gurus get paid",
      "how do i get paid",
      "guru payout",
      "stripe payout",
    ],
    answer:
      "Pet Parents pay on SitGuru. Your payout follows the completed booking and your payout setup. Scout will not invent an amount that is not on your dashboard.",
  },
  {
    question: "How does a Guru run a live visit?",
    aliases: [
      "how do i start a walk",
      "pawreport for gurus",
      "start pawreport",
      "live walk as a guru",
    ],
    answer:
      "When the booking is underway, start the visit from your Guru walk tools so the Pet Parent can follow PawReport Live. Messaging about the visit stays in SitGuru.",
  },
];

export const TACO_PRODUCT_PART_FAQS: readonly MarketingFaqEntry[] = [
  {
    question: "Where do I see Ambassador results?",
    aliases: [
      "ambassador dashboard",
      "referral tracking",
      "where are my link clicks",
      "how do i track referrals",
    ],
    answer:
      "Your Ambassador dashboard shows the referral link, QR code, and the results SitGuru has recorded. Taco will not guess a click count that is not on that dashboard.",
  },
  {
    question: "Do Ambassador rewards always pay out?",
    aliases: [
      "are petperks guaranteed",
      "guaranteed commission",
      "will i get paid for every referral",
    ],
    answer:
      "PetPerks and referral rewards follow current SitGuru terms. They are an opportunity, not a promise, and they are not paid off-platform.",
  },
];

export const DELILAH_PRODUCT_PART_FAQS: readonly MarketingFaqEntry[] = [
  {
    question: "How do I RSVP to a Pet Event?",
    aliases: [
      "how do i rsvp",
      "yes maybe no",
      "can i bring my pet to an event",
    ],
    answer:
      "Open the Pet Event and choose Yes, Maybe, or No. Your RSVP stays on that SitGuru event page.",
  },
  {
    question: "How does a Partner host a Pet Event?",
    aliases: [
      "how do i host an event",
      "create a pet event",
      "edit or cancel an event",
      "share a pet event",
    ],
    answer:
      "Partners host from SitGuru: create the event, then edit, share, or cancel it from the event tools. Guests RSVP on the event page.",
  },
];

export function matchProductPartFaq(
  faqs: readonly MarketingFaqEntry[],
  question: string,
): MarketingFaqEntry | null {
  const needle = question.trim().toLowerCase().replace(/\s+/g, " ");
  if (needle.length < 8) return null;
  return (
    faqs.find((faq) => {
      const phrases = [faq.question, ...(faq.aliases || [])].map((phrase) =>
        phrase.toLowerCase(),
      );
      return phrases.some(
        (phrase) =>
          phrase.length >= 12 &&
          (needle.includes(phrase) || phrase.includes(needle)),
      );
    }) || null
  );
}
