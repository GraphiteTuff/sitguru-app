/**
 * Pet Events marketing + host FAQs for Delilah (Pet Event Coordinator).
 * Exact-match pattern like Scout/Taco; cheerful Delilah voice in answers.
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
import {
  buildCompanionGrowthFaqs,
  matchCompanionGrowthSoftIntent,
} from "@/lib/ai/companion-growth-faqs";
import {
  COMPANION_BENEFITS_RESPONSE,
  COMPANION_BENEFITS_USER_PROMPT,
} from "@/lib/companions/companion-benefits";

export type CommunityEventCompanionContext = {
  slug?: string;
  eventId?: string;
  title?: string;
  city?: string;
  state?: string;
};

/** Guest + planner chips shown in Delilah's chat dock. */
export const COMMUNITY_EVENT_FAQ_CHIPS = [
  { label: "What's on?", question: "What pet events are coming up?" },
  { label: "Host an event", question: "How do Pet Event Planners and Managers publish Partner Events on SitGuru?" },
  { label: "Manage event", question: "How do I edit and manage a Partner Event after it is published?" },
  { label: "Track RSVPs", question: "How do I track Yes Maybe No attendance on my event?" },
  { label: "Attending?", question: "How does Attending Yes Maybe No work?" },
  { label: "Need account?", question: "Do I need a SitGuru account to RSVP?" },
  { label: "Places", question: "How do I find pet-friendly places near me?" },
  { label: "Vet ER", question: "Where is the nearest emergency vet?" },
  { label: "Free events?", question: "Are SitGuru pet events free?" },
  { label: "Partner vs Pet", question: "What is the difference between a Partner Event and a Pet Event?" },
  { label: "Share event", question: "How do I share an event?" },
  { label: "Features", question: "What features does SitGuru offer?" },
  { label: "Follow us", question: "Where can I follow SitGuru on social media?" },
  { label: "Email updates", question: "How do I subscribe for email updates?" },
  { label: "Why join?", question: "Why should I join SitGuru?" },
  { label: "Pet Parent", question: "How do I join as a Pet Parent?" },
  { label: "Pet Guru", question: "How do I join as a Pet Guru?" },
  { label: "Ambassador", question: "How do I join as an Ambassador?" },
] as const;

function cta(role: CommunitySignupRole) {
  if (role === "guru") return "[[cta:community_guru]]";
  if (role === "ambassador") return "[[cta:community_ambassador]]";
  return "[[cta:community_parent]]";
}

/**
 * Canonical Pet Events FAQ copy — cheerful Delilah voice.
 * Prefer verbatim answers on match; keep punchy and scannable.
 */
export const COMMUNITY_EVENTS_MARKETING_FAQS: readonly MarketingFaqEntry[] = [
  {
    question: "What are SitGuru pet events?",
    answer:
      "SitGuru Pet Events are local pet-friendly gathers — browse nearby, tap **Attending?** Yes / Maybe / No, and meet the pack. [[cta:community_parent]]",
  },
  {
    question: "What are SitGuru community events?",
    answer:
      "SitGuru Pet Events are local pet-friendly gathers — browse nearby, tap **Attending?** Yes / Maybe / No, and meet the pack. [[cta:community_parent]]",
  },
  {
    question: "What pet events are coming up?",
    answer:
      "I've got the live upcoming list in my pack notes — ask me about a city, date, or a named event and I'll share the details from current SitGuru listings! Or open **/events** to browse the full map and cards. [[cta:community_parent]]",
  },
  {
    question: "What's happening near me?",
    answer:
      "Tell me your city or county and I'll cheer you toward matching upcoming Pet Events from the live SitGuru list — or hop to **/events** to search the map yourself! [[cta:community_parent]]",
  },
  {
    question: "How does I'm Going work?",
    answer:
      "On each event card, use **Attending?** and tap **Yes**, **Maybe**, or **No** — hosts see live counts so they know who's excited! Guests can RSVP without signup; a free SitGuru account unlocks more pack perks. [[cta:community_parent]]",
  },
  {
    question: "How does Attending Yes Maybe No work?",
    answer:
      "Tap **Yes**, **Maybe**, or **No** on an event card — your pick updates the live counters so Pet Event Planners & Managers can track interest. Change your mind anytime; guests can RSVP without creating an account. [[cta:community_parent]]",
  },
  {
    question: "Do I need a SitGuru account to RSVP?",
    answer:
      "Nope — you can tap **Yes / Maybe / No** as a guest! A free SitGuru account still helps you save favorites, meet Gurus, and stay in the pack long-term. [[cta:community_parent]]",
  },
  {
    question: "How do I join as a Pet Parent?",
    answer:
      "Create a **free Pet Parent account** in minutes — then RSVP with extras, find trusted local Gurus, and keep pet care in one cheerful place. I'll bring you back to your event after signup! [[cta:community_parent]]",
  },
  {
    question: "How do I join as a Pet Guru?",
    answer:
      "Future Gurus can join SitGuru for free, build a profile, and show up at pet events where Pet Parents are already gathering — such a fun way to meet local clients! [[cta:community_guru]]",
  },
  {
    question: "How do I join as an Ambassador?",
    answer:
      "Ambassadors grow the SitGuru pack — share events, invite Pet Parents and Gurus, and represent SitGuru locally. Pet events are perfect meetup spots — let's gooo! [[cta:community_ambassador]]",
  },
  {
    question: "Are pet events pet friendly?",
    answer:
      "Many are — look for the **Pet Friendly** badge on event cards! Always peek at the listing for leash, vaccine, or breed notes from the host so every pup has a great day. [[cta:community_parent]]",
  },
  {
    question: "Are community events pet friendly?",
    answer:
      "Many are — look for the **Pet Friendly** badge on event cards! Always peek at the listing for leash, vaccine, or breed notes from the host so every pup has a great day. [[cta:community_parent]]",
  },
  {
    question: "Are SitGuru pet events free?",
    answer:
      "Lots of listings are **free** gathers — others link to tickets or registration on the partner's site. The event page shows **Free** or ticket links so you know before you go! [[cta:community_parent]]",
  },
  {
    question: "Are SitGuru community events free?",
    answer:
      "Lots of listings are **free** gathers — others link to tickets or registration on the partner's site. The event page shows **Free** or ticket links so you know before you go! [[cta:community_parent]]",
  },
  {
    question: "Can I meet local Gurus at events?",
    answer:
      "Absolutely — Pet Events are one of the happiest ways to meet **local SitGuru Gurus** and Pet Parents near you, then book care on SitGuru when you're ready! [[cta:community_parent]]",
  },
  {
    question: "Who hosts these events?",
    answer:
      "Events are hosted by **SitGuru Partners** and local organizations — pet businesses, rescues, trainers, and pet-friendly venues. SitGuru reviews Partner listings before they publish. [[cta:community_parent]]",
  },
  {
    question: "How do I find events near me?",
    answer:
      "Open **/events**, search by city or keyword, or ask me what's coming up — I'll pull from the live upcoming list! Homepage **Happening Near You** also surfaces local energy. [[cta:community_parent]]",
  },
  {
    question: "How do I find pet-friendly places near me?",
    answer:
      "Stay on **/events** and switch **Events | Pet-Friendly Places** — same map! Then pick Eat & Drink, Stay, Play, or Pet Services. We only keep listings Google marks **allowsDogs**, except dedicated dog parks and pet services. [[cta:community_parent]]",
  },
  {
    question: "Where can I take my dog to eat?",
    answer:
      "Open **/events?view=places&lane=eat** for restaurants, breweries, bars, and cafés where Google says **dogs are allowed**. SitGuru then scores the visit — indoor welcome, patio, water — not generic restaurant stars. [[cta:community_parent]]",
  },
  {
    question: "Where are pet friendly hotels?",
    answer:
      "Switch Community search to **Stay** at **/events?view=places&lane=stay**. We look for hotels and motels that actually accept pets, then surface the details parents struggle to find — fees, limits, and whether it's truly welcoming. [[cta:community_parent]]",
  },
  {
    question: "Where are dog parks near me?",
    answer:
      "Tap **Play** then **Dog Parks** on the Community map: **/events?view=places&lane=play&category=dog_park**. A regular park that allows dogs is not the same as a dog park — we look for name signals like dog park, off-leash, or bark park. [[cta:community_parent]]",
  },
  {
    question: "Where is the nearest emergency vet?",
    answer:
      "Open **/events?view=places&lane=services&category=vet_er** — Pet Services includes veterinarians, pet hospitals, **Emergency / ER**, stores, and boarding. Call and Open now sit on the card. If it's an emergency, call the clinic and go. [[cta:community_parent]]",
  },
  {
    question: "How do I find a veterinarian near me?",
    answer:
      "Community → Pet-Friendly Places → **Pet Services**: veterinarians, hospitals, ER, pet stores, and boarding on the same map. Start at **/events?view=places&lane=services**. [[cta:community_parent]]",
  },
  {
    question: "What is the SitGuru pet friendliness rating?",
    answer:
      "It's **how good the visit is for someone bringing a pet**, not Google's food stars. Under the paws we show why — dogs indoors, no pet fee, water bowls, fenced park, emergency hours. [[cta:community_parent]]",
  },
  {
    question: "What's the difference between RSVP and tickets?",
    answer:
      "**Attending? Yes / Maybe / No** on SitGuru is your RSVP so hosts know you're coming. If an event needs paid tickets or external registration, the listing links out — do both when required! [[cta:community_parent]]",
  },
  {
    question: "Can Gurus RSVP to events?",
    answer:
      "Yes! Gurus tap **Yes / Maybe / No** too — your RSVP shows in the Guru count so Pet Parents know trusted sitters will be there. [[cta:community_guru]]",
  },
  {
    question: "Can Ambassadors RSVP to events?",
    answer:
      "Yes — Ambassadors are encouraged to show up, represent SitGuru, and grow the local pack. Your RSVP counts toward Ambassador attendance! [[cta:community_ambassador]]",
  },
  {
    question: "What happens after I sign up?",
    answer:
      "After your free signup, you'll land back on the event to finish **Attending?**, explore more Pet Events, and optionally find Gurus near you on SitGuru. Welcome to the pack! [[cta:community_parent]]",
  },
  {
    question: "Are events on the SitGuru mobile app?",
    answer:
      "Yes — browse Pet Events in the **SitGuru mobile app**, RSVP, and share events with friends. Same pack, pocket-sized joy! [[cta:community_parent]]",
  },
  {
    question: "How do I share an event?",
    answer:
      "Use **Share from SitGuru** on the listing — copy the link, grab branded graphics, or post to social. Follow **@SitGuruOfficial** for pack highlights too! [[cta:social]]",
  },
  {
    question: "What if an event is cancelled?",
    answer:
      "Hosts can cancel in the Pet Event Manager — the listing updates and RSVP'd members can be notified. Always check the event page closer to the date for the latest status! [[cta:community_parent]]",
  },

  /* —— Pet Event Planners & Managers —— */
  {
    question:
      "How do Pet Event Planners and Managers publish Partner Events on SitGuru?",
    answer:
      "Let's get your pack gather live! **1)** Apply or sign in as a Partner (`/partners/apply?intent=community_events` or **/events/host**). **2)** Open the Pet Event Manager at `/partners/dashboard/community/events`. **3)** Create a draft → fill Basics, Date & Time, Details (autosaves). **4)** Preview → **Submit for review**. SitGuru publishes it as a **Partner Event** that leads the feed!",
  },
  {
    question: "How do I set up a new pet event?",
    answer:
      "Start at **/events/host**, then open the Pet Event Manager (`/partners/dashboard/community/events`) and choose **Create / New draft**. Fill Basics → Date & Time → Details, preview the SitGuru card, and submit for review. Partner Events always stay first once published!",
  },
  {
    question: "How do I host an event on SitGuru?",
    answer:
      "Head to **/events/host** — apply as a Partner if needed, then use the Pet Event Manager to draft, submit for review, and publish. Once live, share with branded graphics and track **Yes / Maybe / No** attendance on your cards!",
  },
  {
    question: "How do I edit and manage a Partner Event after it is published?",
    answer:
      "Partner Dashboard → **Pet Events** → find your event → **Manage Event** (or Edit in ⋮). Update Basics, Date & Location, and Details (autosaves). Preview, then publish/submit if still a draft. Use **Share / Promotion Center** for posts, QR, and flyers — Cancel from ⋮ if needed.",
  },
  {
    question: "Where do I edit an event after it is published?",
    answer:
      "Partner Dashboard → Pet Events → Edit on that event. Published Partner Events keep SitGuru Partner Event priority on the Pet Events map and lists!",
  },
  {
    question: "How do I track Yes Maybe No attendance on my event?",
    answer:
      "On your published Partner Event cards, **Attending?** shows live **Yes / Maybe / No** counters — that's your interest pulse! Guests and members can tap without friction. Admins can also review the roster on the event's admin attendance panel.",
  },
  {
    question: "Can Pet Parents RSVP on event cards?",
    answer:
      "Yes! On Partner Event cards, **Attending?** offers **Yes**, **Maybe**, and **No** with live counters so planners can gauge interest — so helpful!",
  },
  {
    question: "What is the difference between a Partner Event and a Pet Event?",
    answer:
      "**SitGuru Partner Events** are created and updated by Pet Event Planners & Managers in the Partner Dashboard — they always lead visually. **Pet Events** (discoveries) fill the broader map and homepage gaps behind Partner listings.",
  },
  {
    question: "What fields are required to publish a Partner Event?",
    answer:
      "You'll need a clear **title**, **start date/time**, **short description**, a bright **hero image**, and a **venue or city**. Fill categories, free vs ticketed, and pet-friendly flags in Details — then preview and submit for review!",
  },
  {
    question: "How do I promote or share my Partner Event?",
    answer:
      "Open your event's **Promote / Share** workspace in the Partner Dashboard for branded SitGuru graphics, QR, and social posts — or use **Share from SitGuru** on the public card. Tag **@SitGuruOfficial** for pack highlights! [[cta:social]]",
  },
  {
    question: "How do I cancel a Partner Event?",
    answer:
      "In the Pet Event Manager, open the event's **⋮** menu and choose **Cancel**. The public listing updates so Pet Parents see the latest status — always double-check before the big day!",
  },
  {
    question: "Where is the Pet Event Manager?",
    answer:
      "Sign in as a Partner and open `/partners/dashboard/community/events` — or start from **/events/host** and tap **Host / manage events**. Tabs cover upcoming, published, drafts, pending, past, and cancelled!",
  },
  {
    question: "Do I need Partner access to host events?",
    answer:
      "Yes — Pet Event Planners & Managers host through a SitGuru Partner account. Apply via `/partners/apply?intent=community_events` (also linked from **/events/host**), then you'll get the Pet Event Manager!",
  },
  {
    question: COMPANION_BENEFITS_USER_PROMPT.delilah,
    aliases: [
      "event host benefits",
      "tell me about event host benefits",
      "what are the event host benefits",
    ],
    answer: COMPANION_BENEFITS_RESPONSE.delilah,
  },
  ...buildCompanionGrowthFaqs("delilah"),
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

/** Soft intents so cheerful Delilah still lands exact host / listing FAQs. */
export function matchDelilahSoftIntent(question: string): MarketingFaqEntry | null {
  const q = question.trim().toLowerCase();
  if (!q) return null;

  const find = (needle: string) =>
    COMMUNITY_EVENTS_MARKETING_FAQS.find((faq) =>
      faq.question.toLowerCase().includes(needle),
    ) || null;

  if (
    /\b(upcoming|coming up|what'?s on|what events|events near|happening)\b/.test(
      q,
    )
  ) {
    return find("what pet events are coming up");
  }
  if (
    /\b(publish|set up|create|new (partner )?event|host an event|how do i host)\b/.test(
      q,
    )
  ) {
    return find("how do pet event planners and managers publish");
  }
  if (/\b(edit|manage|update).*(event|listing)\b/.test(q) || /\bafter (it is )?published\b/.test(q)) {
    return find("how do i edit and manage");
  }
  if (/\b(track|attendance|rsvp counts?|yes.?maybe.?no)\b/.test(q) && /\b(host|manager|planner|my event)\b/.test(q)) {
    return find("how do i track yes maybe no");
  }
  if (/\b(partner event|pet event).*(difference|vs|versus)\b/.test(q) || /\bdifference between a partner\b/.test(q)) {
    return find("what is the difference between a partner event");
  }
  if (/\b(promote|share|graphics|qr)\b/.test(q) && /\b(event|listing|partner)\b/.test(q)) {
    return find("how do i promote or share");
  }
  if (/\bcancel\b/.test(q) && /\bevent\b/.test(q)) {
    return find("how do i cancel a partner event") || find("what if an event is cancelled");
  }
  if (/\bevent manager\b/.test(q) || /\bwhere.*(manage|host)\b/.test(q)) {
    return find("where is the pet event manager");
  }

  return matchCompanionGrowthSoftIntent("delilah", question);
}

export function resolveDelilahInstantFaqAnswer(question: string): string | null {
  const hit =
    matchCommunityEventsFaq(question) || matchDelilahSoftIntent(question);
  return hit?.answer || null;
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
    "# HOST / PLANNER PATHS",
    "Host hub: /events/host",
    "Partner apply: /partners/apply?intent=community_events",
    "Pet Event Manager: /partners/dashboard/community/events",
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
    "- Email / newsletter / subscribe → append [[cta:email]]",
    "",
    "VOICE: Very happy, outgoing, and cheerful golden Cocker Spaniel energy — punchy (1–2 sentences), encouraging, never invent listing details outside the LIVE EVENTS digest + FAQ.",
  ]
    .filter(Boolean)
    .join("\n")
    .trim();
}

export function buildCommunityDelilahOpeningHint(
  ctx: CommunityEventCompanionContext,
) {
  if (ctx.title) {
    return `Ask me anything about **${ctx.title}** — times, RSVPs, hosting tips, or how to join SitGuru. I'm so happy to help!`;
  }
  return "Ask me about upcoming Pet Events, RSVPs, or how Planners & Managers set up, manage, and track Partner Events — I've got the cheerful scoop!";
}

/** @deprecated Prefer buildCommunityDelilahOpeningHint — Delilah owns Pet Events chat. */
export function buildCommunityRogueOpeningHint(
  ctx: CommunityEventCompanionContext,
) {
  return buildCommunityDelilahOpeningHint(ctx);
}
