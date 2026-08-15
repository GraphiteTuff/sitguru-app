// lib/help/articles.ts
/**
 * SitGuru Help Center article catalog — used by client search + category hubs.
 */

import { VETERANS_MILITARY_FAMILIES_PROGRAM } from "@/lib/programs/veterans-military-families";

export type HelpAudience = "parent" | "guru" | "ambassador" | "all";

export type HelpCategory =
  | "Pet Parent Support"
  | "Guru Success & Training Hub"
  | "Billing & Refunds"
  | "Account & Profiles"
  | "Booking & Cancellations"
  | "Trust & Safety";

export type HelpArticle = {
  slug: string;
  href: string;
  title: string;
  summary: string;
  audience: HelpAudience;
  category: HelpCategory;
  tags: string[];
  /** Extra searchable body snippets */
  keywords: string[];
};

export const HELP_ARTICLES: HelpArticle[] = [
  /* —— Pet Parent Support —— */
  {
    slug: "pawreport-guide",
    href: "/help/parents/pawreport-guide",
    title: "PawReport Live Guide for Pet Parents",
    summary:
      "Watch your dog’s live polyline, get instant push alerts for potty breaks, and receive a responsive email report the moment a walk ends.",
    audience: "parent",
    category: "Pet Parent Support",
    tags: ["pawreport", "live tracking", "map", "potty", "email", "push alerts"],
    keywords: [
      "polyline",
      "route",
      "poop",
      "pee",
      "water break",
      "resend",
      "receipt",
      "visit history",
      "parent walk",
      "automated",
      "instant notification",
    ],
  },
  {
    slug: "finding-a-guru",
    href: "/help/parents/finding-a-guru",
    title: "Finding the Right Guru",
    summary:
      "Search by service and location, read real reviews, and match a Guru to your pet’s routine and care needs.",
    audience: "parent",
    category: "Pet Parent Support",
    tags: ["search", "guru profile", "reviews", "pet care"],
    keywords: ["service area", "pricing", "care style", "local guru", "match"],
  },
  {
    slug: "home-wifi-access",
    href: "/help/parents/home-wifi-access",
    title: "Can’t Open SitGuru on Home Wi‑Fi?",
    summary:
      "If SitGuru opens on cellular but not at home, your internet provider’s Wi‑Fi security may be pausing access. Here’s how to allow the site and contact support.",
    audience: "all",
    category: "Pet Parent Support",
    tags: [
      "wifi",
      "network",
      "access",
      "advanced security",
      "blocked site",
      "support",
    ],
    keywords: [
      "xfinity",
      "cox",
      "spectrum",
      "frontier",
      "verizon",
      "quantum",
      "allow access",
      "approved sites",
      "safe browsing",
      "cellular",
      "support@sitguru.com",
      "can't open",
      "cannot open",
      "home wifi",
    ],
  },

  /* —— Guru Success & Training Hub —— */
  {
    slug: "tracking-mastery",
    href: "/help/gurus/tracking-mastery",
    title: "Guru Tracking Mastery — Smartphone Walk Training",
    summary:
      "Publish walks from your high-accuracy phone dashboard: keep the screen awake, tap potty cleanly, and send automated push alerts plus the end-of-walk email report.",
    audience: "guru",
    category: "Guru Success & Training Hub",
    tags: ["guru", "gps", "battery", "training", "potty", "push alerts"],
    keywords: [
      "watchPosition",
      "screen lock",
      "background",
      "leash",
      "action grid",
      "ping",
      "12 seconds",
      "throttle",
      "publisher",
      "phone dashboard",
    ],
  },
  {
    slug: "guru-pricing-calendar",
    href: "/help/gurus/pricing-and-calendar",
    title: "Pricing, Availability & My Calendar",
    summary:
      "Set service rates, peak-time pricing, multi-pet rules, and availability so Pet Parents can book with clear expectations.",
    audience: "guru",
    category: "Guru Success & Training Hub",
    tags: ["pricing", "calendar", "availability", "peak rates"],
    keywords: [
      "my calendar",
      "multi-pet",
      "multi-day discount",
      "holiday surge",
      "service rates",
    ],
  },

  /* —— Billing & Refunds —— */
  {
    slug: "payments-and-payouts",
    href: "/help/billing/payments-and-payouts",
    title: "Payments, Payouts, Tips & Credits",
    summary:
      "SitGuru-only checkout for Pet Parents, Stripe payouts for Gurus and Ambassadors, tips, promo codes, and when to contact support about refunds.",
    audience: "all",
    category: "Billing & Refunds",
    tags: ["payouts", "stripe", "tipping", "refunds", "pricing"],
    keywords: [
      "checkout",
      "receipts",
      "venmo",
      "zelle",
      "off-platform",
      "promo codes",
      "gift cards",
      "pawperks",
      "credits",
      "commission",
    ],
  },
  {
    slug: "parent-payment-guide",
    href: "/help/billing/parent-payment-guide",
    title: "Pet Parent Payment Guide",
    summary:
      "Pay securely through SitGuru checkout with cards, wallets, Link, credits, promo codes, and optional tips — then track receipts and PawReports in your dashboard.",
    audience: "parent",
    category: "Billing & Refunds",
    tags: ["payouts", "stripe", "tipping", "refunds", "pricing"],
    keywords: [
      "apple pay",
      "google pay",
      "link by stripe",
      "ach",
      "checkout only",
      "receipt",
    ],
  },
  {
    slug: "guru-stripe-setup",
    href: "/help/billing/guru-stripe-setup",
    title: "Guru Stripe Setup Guide",
    summary:
      "Connect Stripe so eligible booking payouts, tips, commission, and referral earnings route correctly — never accept off-platform payments for SitGuru bookings.",
    audience: "guru",
    category: "Billing & Refunds",
    tags: ["payouts", "stripe", "tipping", "refunds", "pricing"],
    keywords: [
      "bank account",
      "earnings tab",
      "business type",
      "payout account",
      "tips routed",
    ],
  },
  {
    slug: "ambassador-stripe-setup",
    href: "/help/billing/ambassador-stripe-setup",
    title: "Ambassador Stripe Setup Guide",
    summary:
      "Complete Stripe payout setup for eligible ambassador, commission, and referral earnings, and keep users on SitGuru checkout and referral links.",
    audience: "ambassador",
    category: "Billing & Refunds",
    tags: ["payouts", "stripe", "tipping", "refunds", "pricing"],
    keywords: ["referral payout", "commission", "ambassador earnings"],
  },

  /* —— Account & Profiles —— */
  {
    slug: "profiles-and-login",
    href: "/help/account/profiles-and-login",
    title: "Accounts, Login & Profile Setup",
    summary:
      "Create your SitGuru account, use phone login codes, update passwords and profile photos, and keep pet bios and Guru details current.",
    audience: "all",
    category: "Account & Profiles",
    tags: ["password", "guru approval", "pet bio", "profile photo"],
    keywords: [
      "phone code",
      "otp",
      "one access",
      "signup",
      "email access",
      "notification preferences",
    ],
  },
  {
    slug: "onboarding-guides",
    href: "/help/account/onboarding",
    title: "Onboarding for Gurus, Ambassadors & Pet Parents",
    summary:
      "Step-by-step setup for each role — profiles, trust screening, onboarding packets, Stripe, and what “submitted” means during Guru approval.",
    audience: "all",
    category: "Account & Profiles",
    tags: ["password", "guru approval", "pet bio", "profile photo"],
    keywords: [
      "onboarding packet",
      "trust screening",
      "service area",
      "become a guru",
      "ambassador referral",
      "pet details",
    ],
  },
  {
    slug: "getting-started",
    href: "/help/account/getting-started",
    title: "Getting Started with SitGuru",
    summary:
      "What SitGuru is, who it’s for, free signup, and which dashboards Pet Parents, Gurus, and Ambassadors use.",
    audience: "all",
    category: "Account & Profiles",
    tags: ["password", "guru approval", "pet bio", "profile photo"],
    keywords: [
      "what is sitguru",
      "pet guru",
      "free to join",
      "dashboard",
      "marketplace",
    ],
  },

  /* —— Booking & Cancellations —— */
  {
    slug: "booking-requests",
    href: "/help/booking/requests-and-cancellations",
    title: "Bookings, Schedules & Cancellations",
    summary:
      "How requests, schedules, holiday surge pricing, cancellations, and rebooking keep care organized for Pet Parents and Gurus.",
    audience: "all",
    category: "Booking & Cancellations",
    tags: ["schedule", "holiday surge", "cancel visit", "rebook"],
    keywords: [
      "care request",
      "timing",
      "access instructions",
      "message early",
      "repeat care",
      "service notes",
    ],
  },
  {
    slug: "live-care-during-visits",
    href: "/help/booking/live-care-updates",
    title: "Live Care Updates During Visits",
    summary:
      "Gurus track walks live via the high-accuracy phone dashboard, sending instant push alerts for potty breaks and a beautiful responsive email report the moment a walk ends.",
    audience: "all",
    category: "Booking & Cancellations",
    tags: ["schedule", "holiday surge", "cancel visit", "rebook"],
    keywords: [
      "pawreport live",
      "push alerts",
      "email report",
      "potty",
      "automated",
      "no manual text",
      "walk status",
    ],
  },

  /* —— Trust & Safety —— */
  {
    slug: "trust-and-safety",
    href: "/help/safety/trust-and-safety",
    title: "Trust, Safety & Reporting Concerns",
    summary:
      "How SitGuru supports safer care with records, PawReport history, compliance steps, emergency guidance, and incident reporting.",
    audience: "all",
    category: "Trust & Safety",
    tags: ["insurance", "emergency phone", "incident report", "compliance"],
    keywords: [
      "vet",
      "911",
      "urgent pet safety",
      "support records",
      "platform rules",
      "user reports",
    ],
  },
  {
    slug: "reviews-and-ratings",
    href: "/help/safety/reviews-and-ratings",
    title: "Reviews, Ratings & Trust Signals",
    summary:
      "Leave honest booking-based reviews, understand New Guru badges, and use feedback to build marketplace trust — never inflated ratings.",
    audience: "all",
    category: "Trust & Safety",
    tags: ["insurance", "emergency phone", "incident report", "compliance"],
    keywords: [
      "star rating",
      "book again",
      "new guru",
      "public profile",
      "ambassador reviews",
    ],
  },
  {
    slug: "programs-and-ambassadors",
    href: "/help/safety/programs-and-ambassadors",
    title: "Ambassadors, Student Hire & Community Pathways",
    summary:
      `How Ambassadors grow SitGuru locally, and what Student Hire, Community Hire, and ${VETERANS_MILITARY_FAMILIES_PROGRAM.shortName} pathways mean.`,
    audience: "ambassador",
    category: "Trust & Safety",
    tags: ["insurance", "emergency phone", "incident report", "compliance"],
    keywords: [
      "student hire",
      "community hire",
      "military hire",
      "referral link",
      "outreach",
    ],
  },
];

export const HELP_CATEGORIES = [
  {
    id: "parents",
    title: "Pet Parent Support",
    description:
      "Live tracking, push alerts, PawReport emails, visit history, and home Wi‑Fi access help for Pet Parents.",
    href: "/help/parents/pawreport-guide",
    hubHref: "/help/parents",
    category: "Pet Parent Support" as HelpCategory,
  },
  {
    id: "gurus",
    title: "Guru Success & Training Hub",
    description:
      "Phone-first walk publishing, GPS tips, pricing, and battery-safe tracking.",
    href: "/help/gurus/tracking-mastery",
    hubHref: "/help/gurus",
    category: "Guru Success & Training Hub" as HelpCategory,
  },
  {
    id: "billing",
    title: "Billing & Refunds",
    description:
      "Checkout, Stripe payouts, tips, credits, promo codes, and refund questions.",
    href: "/help/billing/payments-and-payouts",
    hubHref: "/help/billing",
    category: "Billing & Refunds" as HelpCategory,
  },
  {
    id: "account",
    title: "Account & Profiles",
    description:
      "Signup, login codes, pet bios, profile photos, and Guru approval onboarding.",
    href: "/help/account/profiles-and-login",
    hubHref: "/help/account",
    category: "Account & Profiles" as HelpCategory,
  },
  {
    id: "booking",
    title: "Booking & Cancellations",
    description:
      "Schedules, holiday surge, cancellations, rebooking, and live care updates.",
    href: "/help/booking/requests-and-cancellations",
    hubHref: "/help/booking",
    category: "Booking & Cancellations" as HelpCategory,
  },
  {
    id: "safety",
    title: "Trust & Safety",
    description:
      "Compliance, emergency guidance, incident reports, reviews, and programs.",
    href: "/help/safety/trust-and-safety",
    hubHref: "/help/safety",
    category: "Trust & Safety" as HelpCategory,
  },
] as const;

export function articlesByCategory(category: HelpCategory): HelpArticle[] {
  return HELP_ARTICLES.filter((a) => a.category === category);
}

export function searchHelpArticles(query: string): HelpArticle[] {
  const q = query.trim().toLowerCase();
  if (!q) return HELP_ARTICLES;

  const parts = q.split(/\s+/).filter(Boolean);

  return HELP_ARTICLES.filter((article) => {
    const haystack = [
      article.title,
      article.summary,
      article.category,
      ...article.tags,
      ...article.keywords,
    ]
      .join(" ")
      .toLowerCase();

    if (haystack.includes(q)) return true;
    return parts.every((part) => haystack.includes(part));
  });
}
