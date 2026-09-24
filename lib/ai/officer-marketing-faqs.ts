/**
 * Short chat FAQ answers for Scout, Taco, and Rogue.
 * Marketing pages may stay longer. Chat replies stay to one or two lines.
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
  "You help people discover SitGuru — share it with folks you know, online or around town, and refer Pet Parents and future Gurus.",
  "",
  "Hit play if you want the quick tour.",
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
      "Yep, signing up is free. You'll just need your profile and trust steps done before Pet Parents can book you.",
  },
  {
    question: "What services can I offer?",
    aliases: [
      "what services can gurus offer",
      "what kind of pet care can i provide",
      "can i offer dog walking",
    ],
    answer:
      "You can offer walks, drop-ins, sitting, boarding, day care, and training, as long as SitGuru approves them on your profile.",
  },
  {
    question: "Can I choose my schedule and service area?",
    aliases: [
      "can i set my own schedule",
      "do i choose my service area",
      "can i pick my availability",
    ],
    answer: "Totally. You pick your hours and the neighborhoods you want to cover.",
  },
  {
    question: "Can I set my own rates?",
    aliases: [
      "can i set my prices",
      "do i control pricing",
      "can gurus set rates",
    ],
    answer:
      "Yes, you set your own rates. Just peek at the fees on a booking before you accept it.",
  },
  {
    question: "How do payments and payouts work?",
    aliases: [
      "how do payments work",
      "how do payouts work",
      "when do i get paid",
      "how do guru payouts work",
    ],
    answer: "Once your payout setup is done, SitGuru pays you for eligible bookings.",
  },
  {
    question: "How do payments work?",
    answer: "Once your payout setup is done, SitGuru pays you for eligible bookings.",
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
      "We take care of sales tax at card checkout where it's required, including Minnesota. List your rate without tax. Tips aren't taxed, and you still handle your own income tax.",
  },
  {
    question: "Do I need professional pet care experience?",
    aliases: [
      "do i need experience",
      "can beginners become gurus",
      "do i need to be a professional",
    ],
    answer:
      "You don't need a license. Just be honest about your experience and finish the trust steps.",
  },
  {
    question: "What happens after I apply?",
    aliases: [
      "what are the next steps after applying",
      "what happens after signup",
      "how do i become bookable",
    ],
    answer:
      "You'll fill in your profile, services, rates, hours, trust, and payouts. We approve you before you're bookable, and Academy is optional if you want the badge later.",
  },
  {
    question: "How do I start my free Guru profile?",
    aliases: [
      "i want to start my free guru profile",
      "walk me through guru setup",
      "first setup steps to get bookable",
      "start free guru profile",
    ],
    answer:
      "It's free to start. Add your services, rates, hours, and photos, then finish trust and payouts. Academy can wait. [[cta:guru]]",
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
      "Academy is optional. You can do it anytime for the Certified Guru badge, but get your profile, trust, and payouts done first. [[cta:guru]]",
  },
  {
    question: "How do Pet Parents find me?",
    aliases: [
      "how do i get bookings",
      "how do clients find me",
      "will i show up in search",
    ],
    answer:
      "Pet Parents find you once your profile is approved and easy to read — photos, services, rates, and your area. [[cta:guru]]",
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
      "You can update it anytime under **Update Guru Profile** at `/guru/dashboard/profile`.",
  },
  {
    question: "Where do I see my bookings?",
    aliases: [
      "where are my bookings",
      "open my bookings",
      "guru bookings page",
    ],
    answer:
      "Your visits are under **Bookings** at `/guru/dashboard/bookings`. Open one for notes, messages, and PawReport.",
  },
  {
    question: "How do I set availability?",
    aliases: [
      "update my availability",
      "where is my calendar",
      "set my availability",
    ],
    answer:
      "Set the hours you're actually free in **Availability** at `/guru/dashboard/availability`.",
  },
  {
    question: "What is PawReport Live?",
    aliases: [
      "how do pawreports work",
      "what is a pawreport",
      "do i need to send photos",
    ],
    answer:
      "PawReport Live updates the Pet Parent for you — when you start, how the walk went, photos, and care notes.",
  },
  {
    question: "How do I get paid as a Guru?",
    aliases: [
      "check my payout setup",
      "is stripe ready",
      "how do guru payouts work on my dashboard",
    ],
    answer:
      "Finish Stripe or PayPal in **Earnings**, and SitGuru can pay you for eligible bookings.",
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
      "We take care of sales tax at card checkout where it's required, including Minnesota. List your rate without tax. Tips aren't taxed, and you still handle your own income tax.",
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
      "If you're a student, Guru, pet pro, rescue person, veteran, creator, or a trusted voice in your town, you can apply.",
  },
  {
    question: "Do I need a huge social following?",
    aliases: [
      "do i need lots of followers",
      "do i need to be an influencer",
      "is follower count required",
    ],
    answer: "Nope. A real circle of people beats a huge follower count.",
  },
  {
    question: "Is this the same as becoming a Guru?",
    aliases: [
      "is ambassador the same as guru",
      "can i be a guru and ambassador",
    ],
    answer:
      "They're different jobs. Gurus provide the care, and Ambassadors help people find SitGuru. You can do both.",
  },
  {
    question: "Are earnings or rewards guaranteed?",
    aliases: [
      "are commissions guaranteed",
      "am i guaranteed to get paid",
      "is ambassador income guaranteed",
    ],
    answer:
      "No, nothing is guaranteed. Rewards depend on the current terms and activity that qualifies.",
  },
  {
    question: "How do I become a SitGuru Ambassador?",
    aliases: [
      "i want to become a sitguru ambassador",
      "first steps to apply",
      "how do i apply as an ambassador",
      "join the pack",
    ],
    answer:
      "Apply, grab your link and QR, share SitGuru, then watch what comes back. [[cta:ambassador]]",
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
      "Once you're approved, your link, QR, and share tools show up in your Ambassador dashboard.",
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
      "PetPerks is how you share SitGuru and earn when activity qualifies. Rewards aren't guaranteed. The details are on `/petperks`.",
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
      "Your dashboard shows the referrals, activity, and rewards that qualify for you.",
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
      "Grab your link and QR from **Referrals**, share them, and the clicks show up there too.",
  },
  {
    question: "How do PetPerks rewards work for me?",
    aliases: [
      "how am i doing on petperks",
      "claim petperks rewards",
      "petperks",
    ],
    answer:
      "Only activity that qualifies counts, and nothing is guaranteed. Check Referrals and `/petperks`.",
  },
  {
    question: "Where do I see my referrals?",
    aliases: [
      "open my referrals",
      "ambassador referrals page",
      "where are my referrals",
    ],
    answer: "Open **Referrals** in your dashboard and I can help you read what's there.",
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
