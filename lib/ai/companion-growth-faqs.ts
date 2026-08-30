/**
 * Shared growth / conversion FAQs for all Pet AIs (Rogue, Scout, Taco, Delilah).
 * Punchy answers only — under ~2 short sentences + CTA markers.
 */

import type { CompanionId } from "@/lib/companions/companion-benefits";

/** Mirrors MarketingFaqEntry — kept local to avoid circular imports. */
export type GrowthFaqEntry = {
  question: string;
  answer: string;
  aliases?: readonly string[];
};

const SOCIAL_ALIASES = [
  "follow sitguru",
  "follow @sitguruofficial",
  "sitguru social media",
  "instagram facebook tiktok",
  "where to follow sitguru",
  "sitguru on instagram",
  "sitguru on facebook",
  "sitguru on tiktok",
  "sitguru on youtube",
  "sitguru on x",
  "sitguru twitter",
  "social media links",
  "follow us on social",
] as const;

const EMAIL_ALIASES = [
  "email updates",
  "newsletter",
  "subscribe with email",
  "sign up for emails",
  "email list",
  "dont miss out",
  "don't miss out",
  "email announcements",
  "get email updates",
] as const;

const FEATURES_ALIASES = [
  "sitguru features",
  "what can sitguru do",
  "what does sitguru offer",
  "platform features",
  "highlight features",
  "what is sitguru",
] as const;

const WHY_JOIN_ALIASES = [
  "why join sitguru",
  "why sign up",
  "why use sitguru",
  "should i join",
  "benefits of sitguru",
] as const;

const SOCIAL_ANSWERS: Record<CompanionId, string> = {
  rogue:
    "Follow **@SitGuruOfficial** on Facebook, Instagram, TikTok, X, and YouTube — same handle for events, pics, and pack updates. [[cta:social]]",
  scout:
    "Follow **@SitGuruOfficial** on Facebook, Instagram, TikTok, X, and YouTube for Guru tips and pack updates. [[cta:social]]",
  taco:
    "Follow **@SitGuruOfficial** on Facebook, Instagram, TikTok, X, and YouTube — same handle for drops and pack hype. [[cta:social]]",
  delilah:
    "Follow **@SitGuruOfficial** on Facebook, Instagram, TikTok, X, and YouTube for event pics and pack highlights! [[cta:social]]",
};

const EMAIL_ANSWERS: Record<CompanionId, string> = {
  rogue:
    "Subscribe for SitGuru news, offers, and event updates — unsubscribe anytime. [[cta:email]]",
  scout:
    "Subscribe for Guru tips and pack announcements — unsubscribe anytime. [[cta:email]]",
  taco:
    "Subscribe for SitGuru drops and Ambassador news — unsubscribe anytime. [[cta:email]]",
  delilah:
    "Subscribe for event news and SitGuru announcements — unsubscribe anytime! [[cta:email]]",
};

const FEATURES_ANSWERS: Record<CompanionId, string> = {
  rogue:
    "SitGuru is **local Guru matching**, in-app booking, **PawReport Live**, **PawPerks**, and **Pet Events** — personal care you can track. Join free to unlock it. [[cta:parent]] [[cta:social]] [[cta:email]]",
  scout:
    "Gurus get a **free profile**, bookings tools, **PawReport Live**, secure payouts, and optional **Guru Academy** — plus Pet Events to meet Pet Parents. [[cta:guru]] [[cta:social]] [[cta:email]]",
  taco:
    "Ambassadors get **referral link + QR**, PetPerks under current terms, dashboard metrics, and local pack reach — grow SitGuru with style. [[cta:ambassador]] [[cta:social]] [[cta:email]]",
  delilah:
    "Pet Events with **Yes / Maybe / No**, Partner Event priority, share tools, and free signup paths for Parents, Gurus, and Ambassadors. [[cta:community_parent]] [[cta:social]] [[cta:email]]",
};

const WHY_JOIN_ANSWERS: Record<CompanionId, string> = {
  rogue:
    "Join free to match vetted Gurus, book on SitGuru, and get live care updates — then follow and subscribe for more. [[cta:parent]] [[cta:social]] [[cta:email]]",
  scout:
    "Join free to set services, rates, and schedule, get matched, and get paid through SitGuru. [[cta:guru]] [[cta:social]] [[cta:email]]",
  taco:
    "Join to grow the pack with referral tools, PetPerks opportunities, and dashboard tracking. [[cta:ambassador]] [[cta:social]] [[cta:email]]",
  delilah:
    "Sign up free to RSVP, host, meet Gurus, and stay in the pack. [[cta:community_parent]] [[cta:social]] [[cta:email]]",
};

const HOW_SIGNUP_ANSWERS: Record<CompanionId, string> = {
  rogue:
    "Tap **Create Pet Parent Account**, then search Gurus by ZIP and service — booking stays on SitGuru. [[cta:parent]] [[cta:social]] [[cta:email]]",
  scout:
    "Tap **Start Free Guru Profile**, add services and rates, finish trust + payout setup, then go bookable. [[cta:guru]] [[cta:social]] [[cta:email]]",
  taco:
    "Apply, grab your referral link + QR, share SitGuru, and track impact — watch the role video if you want the vibe. [[cta:ambassador_video]] [[cta:ambassador]] [[cta:social]] [[cta:email]]",
  delilah:
    "Join free as Pet Parent, Pet Guru, or Ambassador — I’ll cheer you on! [[cta:community_parent]] [[cta:community_guru]] [[cta:community_ambassador]] [[cta:social]] [[cta:email]]",
};

/**
 * Persona-flavored growth FAQs to merge into each companion's marketing catalog.
 */
export function buildCompanionGrowthFaqs(
  companion: CompanionId,
): readonly GrowthFaqEntry[] {
  return [
    {
      question: "Where can I follow SitGuru on social media?",
      aliases: [...SOCIAL_ALIASES],
      answer: SOCIAL_ANSWERS[companion],
    },
    {
      question: "How do I subscribe for email updates?",
      aliases: [...EMAIL_ALIASES],
      answer: EMAIL_ANSWERS[companion],
    },
    {
      question: "What features does SitGuru offer?",
      aliases: [...FEATURES_ALIASES],
      answer: FEATURES_ANSWERS[companion],
    },
    {
      question: "Why should I join SitGuru?",
      aliases: [...WHY_JOIN_ALIASES],
      answer: WHY_JOIN_ANSWERS[companion],
    },
    {
      question: "How do I sign up for SitGuru?",
      aliases: [
        "how do i sign up",
        "how do i create an account",
        "how to register",
        "create an account",
        "sign up for sitguru",
      ],
      answer: HOW_SIGNUP_ANSWERS[companion],
    },
  ] as const;
}

/** Soft-intent match for social / email / features / why-join / signup asks. */
export function matchCompanionGrowthSoftIntent(
  companion: CompanionId,
  question: string,
): GrowthFaqEntry | null {
  const needle = String(question || "")
    .trim()
    .toLowerCase()
    .replace(/[?!.,'"]+/g, "")
    .replace(/\s+/g, " ");
  if (!needle) return null;

  const faqs = buildCompanionGrowthFaqs(companion);

  const exact = faqs.find((faq) => {
    const candidates = [faq.question, ...(faq.aliases || [])].map((value) =>
      String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[?!.,'"]+/g, "")
        .replace(/\s+/g, " "),
    );
    return candidates.some((q) => q === needle);
  });
  if (exact) return exact;

  if (
    /follow|instagram|facebook|tiktok|youtube|\bx\b|twitter|social media|@sitguruofficial/.test(
      needle,
    )
  ) {
    return faqs.find((f) => f.question.startsWith("Where can I follow")) || null;
  }
  if (
    /email|newsletter|subscribe|dont miss|don't miss|announcements/.test(needle) &&
    !/ambassador|guru profile|pet parent account/.test(needle)
  ) {
    return (
      faqs.find((f) => f.question.startsWith("How do I subscribe")) || null
    );
  }
  if (/feature|what (can|does) sitguru|what is sitguru|platform offer/.test(needle)) {
    return (
      faqs.find((f) => f.question.startsWith("What features")) || null
    );
  }
  if (/why (join|sign up|use)|should i join|benefits of sitguru/.test(needle)) {
    return faqs.find((f) => f.question.startsWith("Why should I join")) || null;
  }
  if (
    /how (do i |to )?(sign up|register|create (an )?account)|create an account/.test(
      needle,
    )
  ) {
    return faqs.find((f) => f.question.startsWith("How do I sign up")) || null;
  }

  return null;
}

/** Instant answer for growth FAQ chips / typed asks (client or server). */
export function resolveCompanionGrowthFaqAnswer(
  companion: CompanionId,
  question: string,
): string | null {
  return matchCompanionGrowthSoftIntent(companion, question)?.answer || null;
}
