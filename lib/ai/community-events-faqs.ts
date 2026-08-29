/**
 * Pet Events marketing FAQs for Rogue (exact-match pattern like Scout/Taco).
 */

import {
  buildCommunityEventSignupHref,
  buildCommunityJoinHref,
  type CommunitySignupRole,
} from "@/lib/community/pet-parent-signup";
import {
  buildMarketingFaqSnapshot,
  matchMarketingFaq,
  type MarketingFaqEntry,
} from "@/lib/ai/officer-marketing-faqs";

export type CommunityEventCompanionContext = {
  slug?: string;
  eventId?: string;
  title?: string;
  city?: string;
  state?: string;
};

export const COMMUNITY_EVENT_FAQ_CHIPS = [
  { label: "I'm Going?", question: "How does I'm Going work?" },
  { label: "Need account?", question: "Do I need a SitGuru account to RSVP?" },
  { label: "Pet friendly?", question: "Are pet events pet friendly?" },
  { label: "Free events?", question: "Are SitGuru pet events free?" },
  { label: "Meet Gurus", question: "Can I meet local Gurus at events?" },
  { label: "Pet Parent", question: "How do I join as a Pet Parent?" },
  { label: "Pet Guru", question: "How do I join as a Pet Guru?" },
  { label: "Ambassador", question: "How do I join as an Ambassador?" },
] as const;

function cta(role: CommunitySignupRole) {
  if (role === "guru") return "[[cta:community_guru]]";
  if (role === "ambassador") return "[[cta:community_ambassador]]";
  return "[[cta:community_parent]]";
}

/** Canonical Pet Events FAQ copy — keep answers concise for Rogue voice. */
export const COMMUNITY_EVENTS_MARKETING_FAQS: readonly MarketingFaqEntry[] = [
  {
    question: "What are SitGuru pet events?",
    answer:
      "SitGuru Pet Events are local pet-friendly gatherings — adoption days, meetups, fundraisers, partner activations, and pack socials listed in one place on SitGuru. Browse what's near you, say **I'm Going**, and meet Gurus, partners, and pet parents in your area. [[cta:community_parent]]",
  },
  {
    question: "What are SitGuru community events?",
    answer:
      "SitGuru Pet Events are local pet-friendly gatherings — adoption days, meetups, fundraisers, partner activations, and pack socials listed in one place on SitGuru. Browse what's near you, say **I'm Going**, and meet Gurus, partners, and pet parents in your area. [[cta:community_parent]]",
  },
  {
    question: "How does I'm Going work?",
    answer:
      "Tap **I'm Going** on an event to RSVP. You'll see who's coming — Pet Parents, Gurus, and Ambassadors — and get ready for the day. Free SitGuru accounts take about a minute; we'll bring you right back to finish your RSVP. [[cta:community_parent]]",
  },
  {
    question: "Do I need a SitGuru account to RSVP?",
    answer:
      "Yes — a free SitGuru account lets you RSVP, get updates, and connect with the community before and after the event. Pick **Pet Parent**, **Pet Guru**, or **Ambassador** — whichever fits you. [[cta:community_parent]]",
  },
  {
    question: "How do I join as a Pet Parent?",
    answer:
      "Create a **free Pet Parent account** in minutes — then RSVP, find trusted local Gurus, and keep pet care in one place. I'll bring you back to your event after signup. [[cta:community_parent]]",
  },
  {
    question: "How do I join as a Pet Guru?",
    answer:
      "Future Gurus can join SitGuru for free, build a profile, and show up at pet events where pet parents are already gathering. Great way to meet local clients! [[cta:community_guru]]",
  },
  {
    question: "How do I join as an Ambassador?",
    answer:
      "Ambassadors grow the SitGuru pack — share events, invite pet parents and Gurus, and represent SitGuru locally. Pet events are perfect meetup spots. [[cta:community_ambassador]]",
  },
  {
    question: "Are pet events pet friendly?",
    answer:
      "Many are! Look for the **Pet Friendly** badge on event cards. Always check the event description for leash, vaccine, or breed notes from the host. [[cta:community_parent]]",
  },
  {
    question: "Are community events pet friendly?",
    answer:
      "Many are! Look for the **Pet Friendly** badge on event cards. Always check the event description for leash, vaccine, or breed notes from the host. [[cta:community_parent]]",
  },
  {
    question: "Are SitGuru pet events free?",
    answer:
      "Many listings are **free** gatherings — others link to tickets or registration on the partner's site. The event page shows **Free** or **Tickets** so you know before you go. [[cta:community_parent]]",
  },
  {
    question: "Are SitGuru community events free?",
    answer:
      "Many listings are **free** gatherings — others link to tickets or registration on the partner's site. The event page shows **Free** or **Tickets** so you know before you go. [[cta:community_parent]]",
  },
  {
    question: "Can I meet local Gurus at events?",
    answer:
      "Absolutely! Pet events are one of the best ways to meet **local SitGuru Gurus** and pet parents near you — then book care on SitGuru when you're ready. [[cta:community_parent]]",
  },
  {
    question: "Who hosts these events?",
    answer:
      "Events are hosted by **SitGuru Partners** and local organizations — pet businesses, rescues, trainers, and pet-friendly venues. SitGuru reviews listings before they're published. [[cta:community_parent]]",
  },
  {
    question: "How do I find events near me?",
    answer:
      "Open **Pet Events**, search by city or keyword, or use **Happening Near You** on the homepage. Save your area and we'll surface local happenings. [[cta:community_parent]]",
  },
  {
    question: "What's the difference between RSVP and tickets?",
    answer:
      "**I'm Going** on SitGuru is your RSVP so hosts know you're coming. If an event needs paid tickets or external registration, the event page links out — do both when required. [[cta:community_parent]]",
  },
  {
    question: "Can Gurus RSVP to events?",
    answer:
      "Yes! Gurus say **I'm Going** too — your RSVP shows up in the Guru count so pet parents know trusted sitters will be there. [[cta:community_guru]]",
  },
  {
    question: "Can Ambassadors RSVP to events?",
    answer:
      "Yes — Ambassadors are encouraged to show up, represent SitGuru, and grow the local pack. Your RSVP counts toward Ambassador attendance. [[cta:community_ambassador]]",
  },
  {
    question: "What happens after I sign up?",
    answer:
      "After your free signup, you'll land back on the event to finish **I'm Going**, explore more Pet Events listings, and optionally find Gurus near you on SitGuru. [[cta:community_parent]]",
  },
  {
    question: "Are events on the SitGuru mobile app?",
    answer:
      "Yes — browse Pet Events in the **SitGuru mobile app**, RSVP when signed in, and share events with friends. Same pack, pocket-sized. [[cta:community_parent]]",
  },
  {
    question: "How do I share an event?",
    answer:
      "Use **Share Event** on the listing — copy the link, grab branded graphics, or post to social. Follow **@SitGuruOfficial** for pack highlights too! [[cta:social]]",
  },
  {
    question: "What if an event is cancelled?",
    answer:
      "Hosts can cancel on SitGuru — the listing updates and RSVP'd members can be notified. Always check the event page closer to the date for the latest status. [[cta:community_parent]]",
  },
] as const;

export function isCommunityCompanionPath(pagePath?: string | null) {
  const path = String(pagePath || "").split("?")[0] || "";
  return (
    path === "/events" ||
    path.startsWith("/events/") ||
    path === "/community" ||
    path.startsWith("/community/")
  );
}

export function parseCommunityEventSlugFromPath(pagePath?: string | null) {
  const path = String(pagePath || "").split("?")[0] || "";
  const match =
    path.match(/^\/events\/([^/]+)$/) ||
    path.match(/^\/community\/events\/([^/]+)$/);
  // Hub/host are not event slugs
  if (match?.[1] === "host") return null;
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function matchCommunityEventsFaq(question: string) {
  return matchMarketingFaq(COMMUNITY_EVENTS_MARKETING_FAQS, question);
}

export function buildCommunityEventsFaqSnapshot(
  ctx: CommunityEventCompanionContext = {},
) {
  const signupParent = ctx.slug
    ? buildCommunityEventSignupHref({
        slug: ctx.slug,
        eventId: ctx.eventId,
        role: "pet_parent",
        campaign: "community_event_faq_companion",
      })
    : buildCommunityJoinHref({
        role: "pet_parent",
        campaign: "community_events_faq_companion",
      });

  const signupGuru = ctx.slug
    ? buildCommunityEventSignupHref({
        slug: ctx.slug,
        eventId: ctx.eventId,
        role: "guru",
        campaign: "community_event_faq_companion_guru",
      })
    : buildCommunityJoinHref({
        role: "guru",
        campaign: "community_events_faq_companion_guru",
      });

  const signupAmbassador = ctx.slug
    ? buildCommunityEventSignupHref({
        slug: ctx.slug,
        eventId: ctx.eventId,
        role: "ambassador",
        campaign: "community_event_faq_companion_ambassador",
      })
    : buildCommunityJoinHref({
        role: "ambassador",
        campaign: "community_events_faq_companion_ambassador",
      });

  const eventLine = ctx.title
    ? `\nCURRENT EVENT ON PAGE: "${ctx.title}" (${ctx.slug || "unknown slug"})`
    : ctx.slug
      ? `\nCURRENT EVENT SLUG ON PAGE: ${ctx.slug}`
      : "";

  const base = buildMarketingFaqSnapshot({
    officerLabel: "Delilah — Pet Event Coordinator",
    faqs: COMMUNITY_EVENTS_MARKETING_FAQS,
    signupPath: signupParent,
  });

  return [
    base,
    "",
    "# COMMUNITY SIGNUP PATHS (for CTA markers)",
    `Pet Parent signup: ${signupParent}`,
    `Pet Guru signup: ${signupGuru}`,
    `Ambassador signup: ${signupAmbassador}`,
    eventLine,
    "",
    "COMMUNITY CTA MARKERS (use when encouraging signup from events):",
    `- Pet Parent interest → append ${cta("pet_parent")}`,
    `- Guru / sitter / walker interest → append ${cta("guru")}`,
    `- Ambassador / community growth interest → append ${cta("ambassador")}`,
    "- Social / follow pack → append [[cta:social]]",
    "",
    "VOICE: Under 3 sentences unless FAQ answer is exact copy above. Warm Cocker Spaniel energy — organized, helpful, ready for the pack gather.",
  ]
    .filter(Boolean)
    .join("\n")
    .trim();
}

export function buildCommunityDelilahOpeningHint(ctx: CommunityEventCompanionContext) {
  if (ctx.title) {
    return `Ask me anything about **${ctx.title}** — RSVP, pet-friendly details, hosting tips, or how to join SitGuru as a Pet Parent, Guru, or Ambassador!`;
  }
  return "Ask me about SitGuru Pet Events — RSVP, hosting Partner Events, or joining as a Pet Parent, Guru, or Ambassador!";
}

/** @deprecated Prefer buildCommunityDelilahOpeningHint — Delilah owns Pet Events chat. */
export function buildCommunityRogueOpeningHint(ctx: CommunityEventCompanionContext) {
  return buildCommunityDelilahOpeningHint(ctx);
}
