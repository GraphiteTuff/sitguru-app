/**
 * Shared growth / conversion FAQs for all Pet AIs (Rogue, Scout, Taco, Delilah).
 * Encourage signup, SitGuru feature awareness, @SitGuruOfficial social follow,
 * and email subscribe — with persona-flavored answers + CTA markers.
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
    "Follow **@SitGuruOfficial** on Facebook, Instagram, TikTok, X, and YouTube for events, pics, pack updates, and community highlights — same handle everywhere. Tap below to follow the pack! [[cta:social]]",
  scout:
    "Stay trail-ready: follow **@SitGuruOfficial** on Facebook, Instagram, TikTok, X, and YouTube for Guru tips, events, pics, and pack updates. Same handle on every platform. [[cta:social]]",
  taco:
    "Main-character energy lives on **@SitGuruOfficial** — Facebook, Instagram, TikTok, X, and YouTube. Same handle for events, pics, drops, and pack hype. Follow the squad! [[cta:social]]",
  delilah:
    "Yay — follow **@SitGuruOfficial** on Facebook, Instagram, TikTok, X, and YouTube for event pics, pack gathers, and community highlights! Same handle everywhere. [[cta:social]]",
};

const EMAIL_ANSWERS: Record<CompanionId, string> = {
  rogue:
    "Don’t miss out — subscribe with your email for SitGuru news, exclusive offers, event announcements, and pack updates. You can unsubscribe anytime. [[cta:email]]",
  scout:
    "Get upcoming Guru tips, product updates, and pack announcements by email. Subscribe below — manage preferences or unsubscribe anytime. [[cta:email]]",
  taco:
    "Don’t sleep on drops — subscribe with your email for SitGuru news, offers, Ambassador highlights, and upcoming pack announcements. Unsubscribe anytime. [[cta:email]]",
  delilah:
    "Don’t miss a pack gather — subscribe with your email for event news, offers, and SitGuru announcements. Unsubscribe anytime! [[cta:email]]",
};

const FEATURES_ANSWERS: Record<CompanionId, string> = {
  rogue: [
    "SitGuru keeps pet care **personal, local, and trackable**:",
    "- **Find verified Gurus** near you for walks, drop-ins, sitting, overnight, boarding, day care, and training support",
    "- **Book in-app** with messaging, care notes, and secure checkout",
    "- **PawReport Live** — GPS, photos, potty/food/med updates during care",
    "- **PawPerks** — earn on walks and redeem at checkout",
    "- **Pet Events** — local gathers with Attending? Yes / Maybe / No",
    "",
    "Create a free Pet Parent account to unlock the full pack — then follow **@SitGuruOfficial** and subscribe for updates! [[cta:parent]] [[cta:social]] [[cta:email]]",
  ].join("\n"),
  scout: [
    "SitGuru is built for Gurus who want **trusted bookings + clear logistics**:",
    "- **Free Guru profile** — services, rates, availability, and service area you control",
    "- **Bookings workspace** — pet notes, messaging, and day-of tools",
    "- **PawReport Live** — automated care updates parents love",
    "- **Secure payouts** via Stripe or PayPal after setup",
    "- **Guru Academy** (optional) for a Certified Guru badge",
    "- **Pet Events** to meet local Pet Parents in person",
    "",
    "Start free, then follow **@SitGuruOfficial** and subscribe for Guru tips! [[cta:guru]] [[cta:social]] [[cta:email]]",
  ].join("\n"),
  taco: [
    "SitGuru gives Ambassadors real growth tools:",
    "- **Referral link + QR** to introduce Pet Parents and future Gurus",
    "- **PetPerks** share-and-earn path under current program terms",
    "- **Dashboard metrics** — referrals, activity, and recognition opportunities",
    "- **Campus & community outreach** plus Pet Events for local pack energy",
    "- **Creator / social reach** amplified with **@SitGuruOfficial**",
    "",
    "Claim your Ambassador path, follow the pack on social, and subscribe for drops! [[cta:ambassador]] [[cta:social]] [[cta:email]]",
  ].join("\n"),
  delilah: [
    "SitGuru Pet Events + platform features, all in one happy place:",
    "- **Browse & RSVP** with Attending? Yes / Maybe / No",
    "- **Partner Events** that lead the feed for hosts and planners",
    "- **Share tools** — branded graphics, links, and QR",
    "- **Guru matching** — book trusted local care after you meet the pack",
    "- **Free accounts** for Pet Parents, Gurus, and Ambassadors",
    "",
    "Join free, follow **@SitGuruOfficial**, and subscribe so you never miss a gather! [[cta:community_parent]] [[cta:social]] [[cta:email]]",
  ].join("\n"),
};

const WHY_JOIN_ANSWERS: Record<CompanionId, string> = {
  rogue:
    "Join free to match with vetted local Gurus, book care on SitGuru, get PawReport Live updates, earn PawPerks, and tap into Pet Events. Follow **@SitGuruOfficial** and subscribe for pics and announcements! [[cta:parent]] [[cta:social]] [[cta:email]]",
  scout:
    "Join free as a Guru to set your services, rates, and schedule, get matched with Pet Parents, run PawReport Live, and get paid through SitGuru. Follow **@SitGuruOfficial** and subscribe for trail tips! [[cta:guru]] [[cta:social]] [[cta:email]]",
  taco:
    "Join as an Ambassador to grow the pack with referral tools, PetPerks opportunities, campus/community reach, and dashboard tracking. Follow **@SitGuruOfficial** and subscribe for hype drops! [[cta:ambassador]] [[cta:social]] [[cta:email]]",
  delilah:
    "Sign up free to RSVP with extras, host Partner Events, meet Gurus, and stay in the pack. Follow **@SitGuruOfficial** and subscribe so you never miss a gather! [[cta:community_parent]] [[cta:social]] [[cta:email]]",
};

const HOW_SIGNUP_ANSWERS: Record<CompanionId, string> = {
  rogue:
    "Tap **Create Pet Parent Account**, add your details, then search Gurus by ZIP and service. Booking stays on SitGuru — follow **@SitGuruOfficial** and subscribe for updates after you join! [[cta:parent]] [[cta:social]] [[cta:email]]",
  scout:
    "Tap **Start Free Guru Profile**, complete services/rates/availability, finish trust + payout setup, then go bookable. Follow **@SitGuruOfficial** and subscribe for onboarding tips! [[cta:guru]] [[cta:social]] [[cta:email]]",
  taco:
    "Apply as an Ambassador, get your referral link + QR, share SitGuru, and track impact in your dashboard. Watch the role video, follow **@SitGuruOfficial**, and subscribe for pack drops! [[cta:ambassador_video]] [[cta:ambassador]] [[cta:social]] [[cta:email]]",
  delilah:
    "Join free as a **Pet Parent** (RSVP + care), **Pet Guru** (local presence), or **Ambassador** (grow the pack) — I’ll cheer you on! Follow **@SitGuruOfficial** and subscribe for event news. [[cta:community_parent]] [[cta:community_guru]] [[cta:community_ambassador]] [[cta:social]] [[cta:email]]",
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
