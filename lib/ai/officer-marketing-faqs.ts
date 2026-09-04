/**
 * Exact marketing FAQ copy for public Scout (Guru) and Taco (Ambassador) chat.
 * Strings must stay aligned with page sources — never paraphrase in tools.
 *
 * Sources:
 * - Scout → `app/become-a-guru/page.tsx` faqs (+ success-center payment phrasing)
 * - Taco  → `app/ambassadors/page.tsx` faqs + what-you-do / video / PetPerks section
 * - Rogue → Help Center booking / trust phrasing (Pet Parent)
 */

import {
  COMPANION_BENEFITS_RESPONSE,
  COMPANION_BENEFITS_USER_PROMPT,
  type CompanionId,
} from "@/lib/companions/companion-benefits";
import {
  buildCompanionGrowthFaqs,
  matchCompanionGrowthSoftIntent,
} from "@/lib/ai/companion-growth-faqs";

export type MarketingFaqEntry = {
  question: string;
  answer: string;
  /** Extra phrasings that should resolve to the same exact answer. */
  aliases?: readonly string[];
};

/** Marker rendered by Officer chat as an embedded Ambassador promo video card. */
export const AMBASSADOR_VIDEO_CARD_MARKER = "[[ambassador_video_card]]";

/**
 * Canonical "What do Ambassadors do?" reply grounded in /ambassadors page copy.
 * Always appends the video card marker so Taco embeds the promo in-chat.
 */
export const TACO_WHAT_AMBASSADORS_DO_ANSWER = [
  "Ambassadors help people discover SitGuru — share on campus, online, at events, or with people you already know.",
  "",
  "**What you do:** share the vibe, refer Pet Parents & future Gurus, show up locally, and grow real community experience.",
  "",
  "Hit play below for the quick tour.",
  "",
  AMBASSADOR_VIDEO_CARD_MARKER,
].join("\n");

/** Guru onboarding FAQs — exact copy from become-a-guru marketing page + aliases. */
export const SCOUT_PUBLIC_MARKETING_FAQS: readonly MarketingFaqEntry[] = [
  {
    question: "Is it free to apply?",
    aliases: [
      "is guru signup free",
      "is it free to become a guru",
      "does it cost money to apply",
      "free guru profile",
    ],
    answer:
      "Yes. Creating your Guru account and submitting your profile is free. You will complete the required profile and trust steps before becoming fully bookable.",
  },
  {
    question: "What services can I offer?",
    aliases: [
      "what services can gurus offer",
      "what kind of pet care can i provide",
      "can i offer dog walking",
    ],
    answer:
      "Available services may include dog walking, drop-in visits, pet sitting, boarding, doggy day care, training support, and other approved pet care services.",
  },
  {
    question: "Can I choose my schedule and service area?",
    aliases: [
      "can i set my own schedule",
      "do i choose my service area",
      "can i pick my availability",
    ],
    answer:
      "Yes. You choose the availability and local service areas shown through your Guru profile.",
  },
  {
    question: "Can I set my own rates?",
    aliases: [
      "can i set my prices",
      "do i control pricing",
      "can gurus set rates",
    ],
    answer:
      "Yes. You can enter rates for the services you offer. Booking details and applicable platform charges should be reviewed before you accept a request.",
  },
  {
    question: "How do payments and payouts work?",
    aliases: [
      "how do payments work",
      "how do payouts work",
      "when do i get paid",
      "how do guru payouts work",
    ],
    answer:
      "Eligible paid bookings and Guru payouts are handled through SitGuru after the required payout setup is completed.",
  },
  {
    question: "How do payments work?",
    answer:
      "Eligible paid bookings and Guru payouts are handled through SitGuru after the required payout setup is completed.",
  },
  {
    question: "Does SitGuru collect sales tax for me?",
    aliases: [
      "does guru collect sales tax",
      "does sitguru collect sales tax",
      "do i collect sales tax",
      "do i need to charge sales tax",
      "sales tax on my behalf",
      "does sitguru remit sales tax",
      "minnesota sales tax",
    ],
    answer:
      "Yes. SitGuru collects sales tax on card bookings at checkout in states that tax pet-care marketplace services, including Minnesota. List your rates without tax — SitGuru remits it. Tips are not taxed and go to you. You still handle your own income taxes.",
  },
  {
    question: "Do I need professional pet care experience?",
    aliases: [
      "do i need experience",
      "can beginners become gurus",
      "do i need to be a professional",
    ],
    answer:
      "You should describe your experience honestly. SitGuru welcomes experienced providers and responsible local pet lovers who are prepared to complete all required profile and trust steps.",
  },
  {
    question: "What happens after I apply?",
    aliases: [
      "what are the next steps after applying",
      "what happens after signup",
      "how do i become bookable",
    ],
    answer:
      "You will complete your profile, services, pricing, availability, trust requirements, and payout setup. Your profile must be approved and active before Pet Parents can fully book you. Guru Academy is optional and unlocks a Certified Guru badge.",
  },
  {
    question: "How do I start my free Guru profile?",
    aliases: [
      "i want to start my free guru profile",
      "walk me through guru setup",
      "first setup steps to get bookable",
      "start free guru profile",
    ],
    answer: [
      "Start free — Guru signup costs nothing.",
      "",
      "**First trail:** create your account → add services, rates, availability, photos → finish trust + payout setup → stay approved and bookable.",
      "",
      "Guru Academy is optional for a Certified Guru badge. Tap **Start Free Guru Profile** when ready. [[cta:guru]]",
    ].join("\n"),
  },
  {
    question: "What is Guru Academy?",
    aliases: [
      "certified guru badge",
      "do i need guru academy",
      "guru university",
      "guru certification",
    ],
    answer:
      "Guru Academy is **optional**. Complete it anytime for a **Certified Guru** badge — it is not required to become bookable. Finish profile, trust, and payout setup first. [[cta:guru]]",
  },
  {
    question: "How do Pet Parents find me?",
    aliases: [
      "how do i get bookings",
      "how do clients find me",
      "will i show up in search",
    ],
    answer:
      "Complete and activate your Guru profile with clear services, photos, rates, availability, and service area. Verified, bookable profiles are easier for Pet Parents to discover and request. [[cta:guru]]",
  },
  {
    question: COMPANION_BENEFITS_USER_PROMPT.scout,
    aliases: [
      "guru benefits",
      "tell me about guru benefits",
      "what are the guru benefits",
    ],
    answer: COMPANION_BENEFITS_RESPONSE.scout,
  },
  ...buildCompanionGrowthFaqs("scout"),
] as const;

/**
 * Signed-in Guru logistics FAQs — short deterministic replies while Scout also
 * uses the live provider snapshot for schedule/payout digests.
 */
export const SCOUT_DASHBOARD_FAQS: readonly MarketingFaqEntry[] = [
  {
    question: "How do I update my Guru profile?",
    aliases: [
      "where do i edit my profile",
      "update guru profile",
      "edit my guru profile",
    ],
    answer:
      "Open **Update Guru Profile** from your Guru dashboard menu (`/guru/dashboard/profile`). Keep services, rates, photos, bio, and service area current so Pet Parents see the real you.",
  },
  {
    question: "Where do I see my bookings?",
    aliases: [
      "where are my bookings",
      "open my bookings",
      "guru bookings page",
    ],
    answer:
      "Your live work queue lives under **Bookings** (`/guru/dashboard/bookings`). Tap a booking for pet notes, timing, messaging, and PawReport tools — I’ll also help with Trail Checks from your live snapshot.",
  },
  {
    question: "How do I set availability?",
    aliases: [
      "update my availability",
      "where is my calendar",
      "set my availability",
    ],
    answer:
      "Use **Availability** in your Guru dashboard (`/guru/dashboard/availability`) to control when you’re open for bookings. Keep it honest so requests match your real trail time.",
  },
  {
    question: "What is PawReport Live?",
    aliases: [
      "how do pawreports work",
      "what is a pawreport",
      "do i need to send photos",
    ],
    answer:
      "PawReport Live is SitGuru’s automated care update system on a booking — start/finish signals, walk activity, photos, potty/food/med notes, and a final summary so Pet Parents aren’t waiting on a manual text later.",
  },
  {
    question: "How do I get paid as a Guru?",
    aliases: [
      "check my payout setup",
      "is stripe ready",
      "how do guru payouts work on my dashboard",
    ],
    answer:
      "Eligible paid bookings pay out through SitGuru after you complete payout setup (Stripe or PayPal). Review **Earnings** on your dashboard and finish any incomplete payout steps before you expect transfers.",
  },
  {
    question: "Does SitGuru collect sales tax for me?",
    aliases: [
      "does guru collect sales tax",
      "do i charge sales tax",
      "do i file sales tax",
      "sales tax on my behalf",
      "minnesota sales tax",
    ],
    answer:
      "Yes. SitGuru collects sales tax on card bookings at checkout in states that tax pet-care marketplace services, including Minnesota. List your rates without tax — SitGuru remits it. Tips are not taxed and go to you. You still handle your own income taxes.",
  },
  {
    question: COMPANION_BENEFITS_USER_PROMPT.scout,
    aliases: ["guru benefits", "tell me about guru benefits"],
    answer: COMPANION_BENEFITS_RESPONSE.scout,
  },
] as const;

/**
 * Pet Parent / homepage Rogue FAQs — grounded in Help Center booking, finding,
 * live care, and Trust & Safety copy (keep answers factual; do not invent policy).
 */
export const ROGUE_PUBLIC_MARKETING_FAQS: readonly MarketingFaqEntry[] = [
  {
    question: "How do I find a Guru?",
    answer:
      "Search by service and location, review profiles and reviews, then pick the Guru who fits your pet’s routine. [[cta:parent]]",
  },
  {
    question: "How do bookings work on SitGuru?",
    answer:
      "Book through SitGuru — service, timing, pet, Guru, payment, messages, and PawReport stay in one place. [[cta:parent]]",
  },
  {
    question: "Will I pay sales tax?",
    aliases: [
      "is there sales tax",
      "does sitguru charge sales tax",
      "are tips taxed",
    ],
    answer:
      "Card checkout may add sales tax on the service and SitGuru fee based on the care address. Optional tips are not taxed. [[cta:parent]]",
  },
  {
    question: "What is PawReport Live?",
    answer:
      "PawReport Live sends automated care updates on a booking — start/finish, walk activity, photos, potty/food/med notes, and a final summary.",
  },
  {
    question: "How does SitGuru support trust and safety?",
    answer:
      "SitGuru uses profile reviews, trust steps, in-app messaging, PawReport history, and community reporting to help protect the pack.",
  },
  {
    question: "Is SitGuru free to join as a Pet Parent?",
    answer:
      "Pet Parent signup is free — you only pay when you book care. [[cta:parent]]",
  },
  {
    question: "Can I message my Guru?",
    answer:
      "Yes — use SitGuru messaging so care details stay organized with the booking.",
  },
  {
    question: "What services can I book on SitGuru?",
    aliases: [
      "what services does sitguru offer",
      "dog walking drop-ins overnight",
      "what care can i book",
      "pet sitting boarding day care",
    ],
    answer:
      "Book drop-ins, dog walks, overnight / house sitting, boarding, day care, and training support with local Gurus. [[cta:parent]]",
  },
  {
    question: "How do PawPerks work?",
    aliases: [
      "what are pawperks",
      "pawperks points",
      "earn pawperks",
      "redeem pawperks",
    ],
    answer:
      "Earn PawPerks on eligible walks and redeem at checkout (~**100 pts ≈ $1**). Check your balance in-account after signup. [[cta:parent]]",
  },
  {
    question: "Is booking on SitGuru safe?",
    aliases: [
      "is sitguru safe",
      "trust and safety",
      "are gurus vetted",
      "vetted sitters",
    ],
    answer:
      "Yes — booking stays on SitGuru with vetted Gurus, messaging, and PawReport history so care details stay organized. [[cta:parent]]",
  },
  {
    question: "How do I rebook my favorite Guru?",
    aliases: [
      "rebook a guru",
      "book the same sitter again",
      "favorite guru",
    ],
    answer:
      "Open their profile or a past booking on SitGuru and book again — an account makes favorites easier. [[cta:parent]]",
  },
  {
    question: COMPANION_BENEFITS_USER_PROMPT.rogue,
    aliases: [
      "pet parent benefits",
      "tell me about pet parent benefits",
      "what are the pet parent benefits",
    ],
    answer: COMPANION_BENEFITS_RESPONSE.rogue,
  },
  ...buildCompanionGrowthFaqs("rogue"),
] as const;

/** Ambassador growth FAQs — exact copy from ambassadors marketing page + aliases. */
export const TACO_PUBLIC_MARKETING_FAQS: readonly MarketingFaqEntry[] = [
  {
    question: "What do Ambassadors do?",
    aliases: [
      "what is an ambassador",
      "what does an ambassador do",
      "ambassador role",
      "see what ambassadors do",
    ],
    answer: TACO_WHAT_AMBASSADORS_DO_ANSWER,
  },
  {
    question: "Who can become a SitGuru Ambassador?",
    aliases: [
      "who can apply to be an ambassador",
      "am i eligible to be an ambassador",
    ],
    answer:
      "Students, Gurus, pet professionals, rescue advocates, veterans, military spouses, community leaders, creators, and other trusted local voices can apply.",
  },
  {
    question: "Do I need a huge social following?",
    aliases: [
      "do i need lots of followers",
      "do i need to be an influencer",
      "is follower count required",
    ],
    answer:
      "No. Real connections matter more than follower count. A campus group, clinic, team, neighborhood, rescue network, or active friend circle can all be valuable.",
  },
  {
    question: "Is this the same as becoming a Guru?",
    aliases: [
      "is ambassador the same as guru",
      "can i be a guru and ambassador",
    ],
    answer:
      "No. Gurus provide pet care. Ambassadors help people discover SitGuru. Some people may choose to do both through separate approval paths.",
  },
  {
    question: "Are earnings or rewards guaranteed?",
    aliases: [
      "are commissions guaranteed",
      "am i guaranteed to get paid",
      "is ambassador income guaranteed",
    ],
    answer:
      "No. Approval, referral rewards, commissions, bonuses, recognition, and other opportunities depend on current SitGuru terms, eligible activity, and program needs.",
  },
  {
    question: "How do I become a SitGuru Ambassador?",
    aliases: [
      "i want to become a sitguru ambassador",
      "first steps to apply",
      "how do i apply as an ambassador",
      "join the pack",
    ],
    answer: [
      "Apply in four steps: **Apply** → get referral link/QR → **Share SitGuru** → track impact.",
      "",
      "Ready? Head to apply and I’ll cheer you on. [[cta:ambassador]]",
    ].join("\n"),
  },
  {
    question: "How do I get my referral link and QR code?",
    aliases: [
      "personalized referral link",
      "how do i get my qr code",
      "referral tools",
      "where is my referral link",
    ],
    answer:
      "After you’re approved as an Ambassador, SitGuru gives you shareable referral tools — including your personalized referral link, QR code, and simple sharing materials — from your Ambassador experience so you can introduce people to SitGuru.",
  },
  {
    question: "What is PetPerks for Ambassadors?",
    aliases: [
      "tell me about petperks",
      "petperks rewards",
      "$10 to $20 petperks",
      "how do petperks work",
    ],
    answer:
      "Ambassadors use referral tools built for outreach. PetPerks is the public share-and-earn path for friends, future Gurus, and eligible rewards under current terms — rewards are not guaranteed and depend on SitGuru program rules and eligible activity. See `/petperks` for the public share path.",
  },
  {
    question: "What metrics can I track as an Ambassador?",
    aliases: [
      "track metrics",
      "ambassador dashboard metrics",
      "what can i track",
      "referral activity",
    ],
    answer:
      "From your Ambassador workspace you can follow eligible referrals, activity, rewards, and recognition opportunities — plus outreach progress from your referral tools. Open your Ambassador dashboard after signup to see live metrics for your lane.",
  },
  {
    question: COMPANION_BENEFITS_USER_PROMPT.taco,
    aliases: [
      "ambassador benefits",
      "tell me about ambassador benefits",
      "what are the ambassador benefits",
    ],
    answer: COMPANION_BENEFITS_RESPONSE.taco,
  },
  ...buildCompanionGrowthFaqs("taco"),
] as const;

/** Signed-in Ambassador workspace FAQs. */
export const TACO_DASHBOARD_FAQS: readonly MarketingFaqEntry[] = [
  {
    question: "What do Ambassadors do?",
    aliases: ["role refresh", "remind me what ambassadors do"],
    answer: TACO_WHAT_AMBASSADORS_DO_ANSWER,
  },
  {
    question: "How do I share my referral link?",
    aliases: [
      "share my referral link",
      "where is my qr code in the dashboard",
      "how do i share my qr",
    ],
    answer:
      "Grab your personalized referral link and QR tools from your Ambassador dashboard/referrals area, then share them with campus, community, pet networks, or social circles. Track clicks and eligible referrals from the same workspace.",
  },
  {
    question: "How do PetPerks rewards work for me?",
    aliases: [
      "how am i doing on petperks",
      "claim petperks rewards",
      "petperks",
    ],
    answer:
      "PetPerks is SitGuru’s share-and-earn path. Eligible rewards depend on current terms and qualified activity — they are not guaranteed. Review your Ambassador referrals/rewards views and `/petperks` for the public share path.",
  },
  {
    question: "Where do I see my referrals?",
    aliases: [
      "open my referrals",
      "ambassador referrals page",
      "where are my referrals",
    ],
    answer:
      "Open **Referrals** in your Ambassador dashboard to review activity and focus areas. I’ll also help summarize your live snapshot when you ask for a pack-growth check.",
  },
  {
    question: COMPANION_BENEFITS_USER_PROMPT.taco,
    aliases: ["ambassador benefits", "tell me about ambassador benefits"],
    answer: COMPANION_BENEFITS_RESPONSE.taco,
  },
] as const;

function normalizeFaqQuery(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[?!.,'"]+/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Soft intent match for role-explain / promo-video asks so Taco can embed
 * the Ambassador video card even when wording varies.
 */
export function isAmbassadorRoleExplainQuery(question: string): boolean {
  const needle = normalizeFaqQuery(question);
  if (!needle) return false;

  return (
    /what (do|does) (an? )?ambassadors? do/.test(needle) ||
    /what (is|are) (an? )?ambassadors?/.test(needle) ||
    /what ambassadors? (actually )?do/.test(needle) ||
    /see what ambassadors/.test(needle) ||
    /ambassador (promo |onboarding )?video/.test(needle) ||
    /watch (the )?ambassador/.test(needle) ||
    needle === "what do ambassadors do"
  );
}

/** Soft intents for common Scout public asks beyond exact FAQ wording. */
export function matchScoutPublicSoftIntent(
  question: string,
): MarketingFaqEntry | null {
  const needle = normalizeFaqQuery(question);
  if (!needle) return null;

  if (
    /free (to )?apply|free (guru )?profile|cost (to )?(apply|sign ?up)|is it free/.test(
      needle,
    )
  ) {
    return (
      SCOUT_PUBLIC_MARKETING_FAQS.find((f) => f.question === "Is it free to apply?") ||
      null
    );
  }
  if (/payment|payout|get paid|when.*(paid|pay)/.test(needle)) {
    return (
      SCOUT_PUBLIC_MARKETING_FAQS.find(
        (f) => f.question === "How do payments and payouts work?",
      ) || null
    );
  }
  if (/what services|services can i|dog walking|pet sitting/.test(needle)) {
    return (
      SCOUT_PUBLIC_MARKETING_FAQS.find(
        (f) => f.question === "What services can I offer?",
      ) || null
    );
  }
  if (/after i apply|next steps|become bookable|after signup/.test(needle)) {
    return (
      SCOUT_PUBLIC_MARKETING_FAQS.find(
        (f) => f.question === "What happens after I apply?",
      ) || null
    );
  }
  if (/own rates|set (my )?(rates|prices)|pricing/.test(needle)) {
    return (
      SCOUT_PUBLIC_MARKETING_FAQS.find(
        (f) => f.question === "Can I set my own rates?",
      ) || null
    );
  }
  if (/schedule|availability|service area/.test(needle)) {
    return (
      SCOUT_PUBLIC_MARKETING_FAQS.find(
        (f) => f.question === "Can I choose my schedule and service area?",
      ) || null
    );
  }
  if (/start (my )?(free )?guru|first setup|get bookable/.test(needle)) {
    return (
      SCOUT_PUBLIC_MARKETING_FAQS.find(
        (f) => f.question === "How do I start my free Guru profile?",
      ) || null
    );
  }
  if (/guru benefits|benefits of (being|becoming) a guru/.test(needle)) {
    return (
      SCOUT_PUBLIC_MARKETING_FAQS.find(
        (f) => f.question === COMPANION_BENEFITS_USER_PROMPT.scout,
      ) || null
    );
  }
  if (/guru academy|certified guru|certification badge/.test(needle)) {
    return (
      SCOUT_PUBLIC_MARKETING_FAQS.find(
        (f) => f.question === "What is Guru Academy?",
      ) || null
    );
  }
  if (/how (do|will) (pet )?parents find|get bookings|show up in search/.test(needle)) {
    return (
      SCOUT_PUBLIC_MARKETING_FAQS.find(
        (f) => f.question === "How do Pet Parents find me?",
      ) || null
    );
  }

  return matchCompanionGrowthSoftIntent("scout", question);
}

/** Soft intents for common Taco public asks. */
export function matchTacoPublicSoftIntent(
  question: string,
): MarketingFaqEntry | null {
  const needle = normalizeFaqQuery(question);
  if (!needle) return null;

  if (isAmbassadorRoleExplainQuery(question)) {
    return (
      TACO_PUBLIC_MARKETING_FAQS.find(
        (f) => f.question === "What do Ambassadors do?",
      ) || null
    );
  }
  if (/who can (become|be|apply)|eligible.*(ambassador)/.test(needle)) {
    return (
      TACO_PUBLIC_MARKETING_FAQS.find(
        (f) => f.question === "Who can become a SitGuru Ambassador?",
      ) || null
    );
  }
  if (/followers?|influencer|social following/.test(needle)) {
    return (
      TACO_PUBLIC_MARKETING_FAQS.find(
        (f) => f.question === "Do I need a huge social following?",
      ) || null
    );
  }
  if (/same as.*(guru)|guru and ambassador|difference.*(guru|ambassador)/.test(needle)) {
    return (
      TACO_PUBLIC_MARKETING_FAQS.find(
        (f) => f.question === "Is this the same as becoming a Guru?",
      ) || null
    );
  }
  if (/guaranteed|guarantee.*(earn|reward|commission|pay)/.test(needle)) {
    return (
      TACO_PUBLIC_MARKETING_FAQS.find(
        (f) => f.question === "Are earnings or rewards guaranteed?",
      ) || null
    );
  }
  if (/petperks|share-and-earn|share and earn/.test(needle)) {
    return (
      TACO_PUBLIC_MARKETING_FAQS.find(
        (f) => f.question === "What is PetPerks for Ambassadors?",
      ) || null
    );
  }
  if (/referral link|qr code|referral tools/.test(needle)) {
    return (
      TACO_PUBLIC_MARKETING_FAQS.find(
        (f) => f.question === "How do I get my referral link and QR code?",
      ) || null
    );
  }
  if (/become.*(ambassador)|how (do|to) apply|join the pack|first steps/.test(needle)) {
    return (
      TACO_PUBLIC_MARKETING_FAQS.find(
        (f) => f.question === "How do I become a SitGuru Ambassador?",
      ) || null
    );
  }
  if (/metrics|track.*(referral|impact|dashboard)/.test(needle)) {
    return (
      TACO_PUBLIC_MARKETING_FAQS.find(
        (f) => f.question === "What metrics can I track as an Ambassador?",
      ) || null
    );
  }
  if (/ambassador benefits|benefits of (being|becoming) an ambassador/.test(needle)) {
    return (
      TACO_PUBLIC_MARKETING_FAQS.find(
        (f) => f.question === COMPANION_BENEFITS_USER_PROMPT.taco,
      ) || null
    );
  }

  return matchCompanionGrowthSoftIntent("taco", question);
}

function entryMatchesNeedle(faq: MarketingFaqEntry, needle: string) {
  const candidates = [faq.question, ...(faq.aliases || [])].map(normalizeFaqQuery);
  if (candidates.some((q) => q === needle)) return true;

  return candidates.some((q) => {
    if (q.length < 12) return false;
    return needle.includes(q) || q.includes(needle);
  });
}

/** Match a visitor question to an exact FAQ answer when the text aligns. */
export function matchMarketingFaq(
  faqs: readonly MarketingFaqEntry[],
  question: string,
): MarketingFaqEntry | null {
  const needle = normalizeFaqQuery(question);
  if (!needle) return null;

  const exact = faqs.find((faq) => entryMatchesNeedle(faq, needle));
  return exact ?? null;
}

/** Soft intents for common Rogue / Pet Parent asks. */
export function matchRoguePublicSoftIntent(
  question: string,
): MarketingFaqEntry | null {
  const needle = normalizeFaqQuery(question);
  if (!needle) return null;

  if (/find (a )?guru|search (for )?(a )?guru|how do i find/.test(needle)) {
    return (
      ROGUE_PUBLIC_MARKETING_FAQS.find(
        (f) => f.question === "How do I find a Guru?",
      ) || null
    );
  }
  if (/how (do )?bookings? work|book care|how (do i|to) book/.test(needle)) {
    return (
      ROGUE_PUBLIC_MARKETING_FAQS.find(
        (f) => f.question === "How do bookings work on SitGuru?",
      ) || null
    );
  }
  if (/pawreport|live (care|walk) update|gps (walk|track)/.test(needle)) {
    return (
      ROGUE_PUBLIC_MARKETING_FAQS.find(
        (f) => f.question === "What is PawReport Live?",
      ) || null
    );
  }
  if (/trust|safety|vetted|safe to (use|book)/.test(needle)) {
    return (
      ROGUE_PUBLIC_MARKETING_FAQS.find(
        (f) => f.question === "Is booking on SitGuru safe?",
      ) ||
      ROGUE_PUBLIC_MARKETING_FAQS.find(
        (f) => f.question === "How does SitGuru support trust and safety?",
      ) ||
      null
    );
  }
  if (/free to join|free (pet )?parent|cost to (sign ?up|join)/.test(needle)) {
    return (
      ROGUE_PUBLIC_MARKETING_FAQS.find(
        (f) => f.question === "Is SitGuru free to join as a Pet Parent?",
      ) || null
    );
  }
  if (/message (my )?guru|chat with (my )?guru/.test(needle)) {
    return (
      ROGUE_PUBLIC_MARKETING_FAQS.find(
        (f) => f.question === "Can I message my Guru?",
      ) || null
    );
  }
  if (/pawperk|points|redeem/.test(needle)) {
    return (
      ROGUE_PUBLIC_MARKETING_FAQS.find(
        (f) => f.question === "How do PawPerks work?",
      ) || null
    );
  }
  if (/what services|dog walk|drop-?in|boarding|day care|overnight/.test(needle)) {
    return (
      ROGUE_PUBLIC_MARKETING_FAQS.find(
        (f) => f.question === "What services can I book on SitGuru?",
      ) || null
    );
  }
  if (/rebook|favorite guru|same (sitter|guru)/.test(needle)) {
    return (
      ROGUE_PUBLIC_MARKETING_FAQS.find(
        (f) => f.question === "How do I rebook my favorite Guru?",
      ) || null
    );
  }
  if (/pet parent benefits|benefits of (being|becoming) a pet parent/.test(needle)) {
    return (
      ROGUE_PUBLIC_MARKETING_FAQS.find(
        (f) => f.question === COMPANION_BENEFITS_USER_PROMPT.rogue,
      ) || null
    );
  }

  return matchCompanionGrowthSoftIntent("rogue", question);
}

/**
 * Instant deterministic answer for Scout / Taco (public or dashboard) —
 * same responsiveness pattern as Rogue Pet Parent FAQ short-circuit.
 */
export function resolveOfficerInstantFaqAnswer(opts: {
  officer: "scout" | "taco";
  question: string;
  surface: "public" | "dashboard";
}): string | null {
  const { officer, question, surface } = opts;
  if (!normalizeFaqQuery(question)) return null;

  if (officer === "taco" && isAmbassadorRoleExplainQuery(question)) {
    return TACO_WHAT_AMBASSADORS_DO_ANSWER;
  }

  if (surface === "public") {
    const hit =
      matchMarketingFaq(
        officer === "scout" ? SCOUT_PUBLIC_MARKETING_FAQS : TACO_PUBLIC_MARKETING_FAQS,
        question,
      ) ||
      (officer === "scout"
        ? matchScoutPublicSoftIntent(question)
        : matchTacoPublicSoftIntent(question));
    return hit?.answer || null;
  }

  // Dashboard: exact/alias FAQ only — leave Trail Check / live digests to the model + snapshot.
  // Still allow growth soft intents (social / email) so companions can convert.
  const dashboardFaqs =
    officer === "scout" ? SCOUT_DASHBOARD_FAQS : TACO_DASHBOARD_FAQS;
  const hit =
    matchMarketingFaq(dashboardFaqs, question) ||
    matchCompanionGrowthSoftIntent(officer, question);
  return hit?.answer || null;
}

export function getOfficerFaqCatalog(opts: {
  officer: "scout" | "taco";
  surface: "public" | "dashboard";
}): readonly MarketingFaqEntry[] {
  if (opts.officer === "scout") {
    return opts.surface === "public"
      ? SCOUT_PUBLIC_MARKETING_FAQS
      : [...SCOUT_DASHBOARD_FAQS, ...SCOUT_PUBLIC_MARKETING_FAQS];
  }
  return opts.surface === "public"
    ? TACO_PUBLIC_MARKETING_FAQS
    : [...TACO_DASHBOARD_FAQS, ...TACO_PUBLIC_MARKETING_FAQS];
}

/** Markdown snapshot injected into public officer streams. */
export function buildMarketingFaqSnapshot(opts: {
  officerLabel: string;
  faqs: readonly MarketingFaqEntry[];
  signupPath: string;
}): string {
  const lines = [
    `# ${opts.officerLabel} Public Marketing FAQ Database`,
    `_Exact page copy — use these answer strings verbatim when the visitor asks the matching question._`,
    `Signup / apply path: ${opts.signupPath}`,
    "",
  ];

  if (opts.faqs.some((faq) => faq.answer.includes(AMBASSADOR_VIDEO_CARD_MARKER))) {
    lines.push("AMBASSADOR VIDEO RULE:");
    lines.push(
      `- When visitors ask what Ambassadors do / what the role is / to watch the Ambassador video, answer with the exact "What do Ambassadors do?" copy and ALWAYS append ${AMBASSADOR_VIDEO_CARD_MARKER} so the in-chat promo video renders.`,
    );
    lines.push("");
  }

  for (const faq of opts.faqs) {
    lines.push(`## Q: ${faq.question}`);
    if (faq.aliases?.length) {
      lines.push(`Aliases: ${faq.aliases.join(" | ")}`);
    }
    lines.push(`A: ${faq.answer}`);
    lines.push("");
  }

  return lines.join("\n").trim();
}

export function companionBenefitsFaqQuestion(companion: CompanionId) {
  return COMPANION_BENEFITS_USER_PROMPT[companion];
}
