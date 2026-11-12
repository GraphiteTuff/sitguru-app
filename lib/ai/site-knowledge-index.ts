/**
 * Shared SitGuru knowledge retrieval for all public companions.
 * Keyword + tag hybrid over Help articles and maintained public page briefs.
 * Factual site claims require a retrieval hit with a source URL.
 */

import { HELP_ARTICLES } from "@/lib/help/articles";
import {
  accountFaqs,
  billingFaqs,
  bookingFaqs,
  findingGuruFaqs,
  gettingStartedFaqs,
  guruOpsFaqs,
  liveCareFaqs,
  programFaqs,
  reviewFaqs,
  safetyFaqs,
  type HelpFaqItem,
} from "@/lib/help/content";
import {
  AMBASSADOR_APPLICATION_PATH,
  BILLING_HELP_PATH,
  PARENT_SIGNUP_PATH,
  PETPERKS_PATH,
  SUPPORT_EMAIL,
} from "@/lib/companions/canonical";

const HELP_FAQ_GROUPS: Array<{ category: string; href: string; faqs: HelpFaqItem[] }> = [
  { category: "getting-started", href: "/help", faqs: gettingStartedFaqs },
  { category: "account", href: "/help", faqs: accountFaqs },
  { category: "billing", href: BILLING_HELP_PATH, faqs: billingFaqs },
  { category: "booking", href: "/help", faqs: bookingFaqs },
  { category: "live-care", href: "/help", faqs: liveCareFaqs },
  { category: "safety", href: "/help", faqs: safetyFaqs },
  { category: "reviews", href: "/help", faqs: reviewFaqs },
  { category: "programs", href: "/help", faqs: programFaqs },
  { category: "finding-guru", href: "/search", faqs: findingGuruFaqs },
  { category: "guru-ops", href: "/become-a-guru", faqs: guruOpsFaqs },
];

export type KnowledgeHit = {
  title: string;
  href: string;
  summary: string;
  score: number;
  source: "help_article" | "help_faq" | "site_brief";
};

type SiteBrief = {
  title: string;
  href: string;
  summary: string;
  keywords: string[];
};

const SITE_BRIEFS: SiteBrief[] = [
  {
    title: "Pet Parent signup",
    href: PARENT_SIGNUP_PATH,
    summary:
      "Pet Parents join SitGuru free. Create an account at the Pet Parent signup route, then search and book local Gurus.",
    keywords: ["signup", "sign up", "register", "pet parent", "free account", "join"],
  },
  {
    title: "Become a Guru",
    href: "/become-a-guru",
    summary:
      "Gurus apply free, set their own rates, services, availability, and service area. Identity, safety, account, and payout trust steps are required before bookable. Guru Academy / SitGuru University is optional.",
    keywords: [
      "become a guru",
      "apply",
      "free to apply",
      "rates",
      "availability",
      "service area",
      "academy",
      "university",
      "bookable",
    ],
  },
  {
    title: "Ambassador application",
    href: AMBASSADOR_APPLICATION_PATH,
    summary:
      "Apply as a SitGuru Ambassador at the canonical application path. Referral link and QR tools arrive after approval.",
    keywords: ["ambassador", "apply", "referral", "qr", "community growth"],
  },
  {
    title: "PetPerks",
    href: PETPERKS_PATH,
    summary:
      "Give $10 Get $10 after a friend's first eligible paid booking completes. Refer a Guru Earn $20 after approval plus first eligible paid booking. Credits only — not cash, not guaranteed.",
    keywords: ["petperks", "referral", "give 10", "get 10", "refer a guru", "reward"],
  },
  {
    title: "Marketplace Support / fees",
    href: BILLING_HELP_PATH,
    summary:
      "Booking currently shows Marketplace Support — Free during launch. No future per-booking fee amount, payer, or start date is published in Help.",
    keywords: ["fee", "fees", "marketplace support", "booking fee", "platform fee", "2.99"],
  },
  {
    title: "PawReport",
    href: "/help",
    summary:
      "PawReport means photos, notes, walk progress, and live updates during/after a booking — not available before a booking.",
    keywords: ["pawreport", "live updates", "gps", "photos", "walk progress"],
  },
  {
    title: "Pet Events",
    href: "/events",
    summary:
      "Browse the live SitGuru Pet Events catalog, filter by area, open event details, and use verified host/create-event flows on the site.",
    keywords: ["events", "pet events", "rsvp", "host", "create event"],
  },
  {
    title: "Support",
    href: "/contact",
    summary: `Human help: email ${SUPPORT_EMAIL} or use the contact page. Companions are AI and cannot transfer a live chat unless a real handoff ID is created.`,
    keywords: ["support", "contact", "help", "human", "email"],
  },
];

function tokenize(text: string): string[] {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function scoreHaystack(queryTokens: string[], hay: string, boost = 0): number {
  let score = boost;
  for (const token of queryTokens) {
    if (hay.includes(token)) score += 2;
  }
  return score;
}

/** Retrieve top-k knowledge hits for the current user question. */
export function retrieveSiteKnowledge(
  userText: string,
  limit = 6,
): KnowledgeHit[] {
  const q = String(userText || "").trim();
  const tokens = tokenize(q);
  if (!tokens.length) return [];

  const hits: KnowledgeHit[] = [];

  for (const brief of SITE_BRIEFS) {
    const hay = [brief.title, brief.summary, ...brief.keywords]
      .join(" ")
      .toLowerCase();
    let score = scoreHaystack(tokens, hay);
    for (const kw of brief.keywords) {
      if (q.toLowerCase().includes(kw.toLowerCase())) score += 6;
    }
    if (score > 0) {
      hits.push({
        title: brief.title,
        href: brief.href,
        summary: brief.summary,
        score,
        source: "site_brief",
      });
    }
  }

  for (const article of HELP_ARTICLES) {
    const hay = [
      article.title,
      article.summary,
      article.category,
      ...article.tags,
      ...article.keywords,
    ]
      .join(" ")
      .toLowerCase();
    const score = scoreHaystack(tokens, hay);
    if (score > 0) {
      hits.push({
        title: article.title,
        href: article.href,
        summary: article.summary,
        score,
        source: "help_article",
      });
    }
  }

  for (const group of HELP_FAQ_GROUPS) {
    for (const faq of group.faqs) {
      const hay = `${faq.question} ${faq.answer} ${group.category}`.toLowerCase();
      const score = scoreHaystack(tokens, hay);
      if (score > 0) {
        hits.push({
          title: faq.question,
          href: group.href,
          summary: faq.answer,
          score,
          source: "help_faq",
        });
      }
    }
  }

  return hits
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.min(limit, 12)));
}

/** Prompt block requiring source links for factual claims. */
export function formatKnowledgeHitsForPrompt(hits: KnowledgeHit[]): string {
  if (!hits.length) {
    return [
      "# RETRIEVAL RESULT",
      "No matching Help/site hit for this turn.",
      `If the user asked a SitGuru-specific fact, say you could not verify it and give ${SUPPORT_EMAIL} plus the closest public page.`,
      "Ordinary greetings, empathy, and general pet-care education do not require a citation.",
    ].join("\n");
  }

  return [
    "# RETRIEVAL HITS (use these for SitGuru-specific facts; cite href)",
    ...hits.map(
      (hit, index) =>
        `${index + 1}. [${hit.source}] ${hit.title} (${hit.href}) — ${hit.summary}`,
    ),
  ].join("\n");
}

export function buildRetrievalPromptBlock(userText: string, limit = 6): string {
  return formatKnowledgeHitsForPrompt(retrieveSiteKnowledge(userText, limit));
}

/** Approved no-hit fallback. */
export function buildUnverifiedFactFallback(closestHref?: string): string {
  const link = closestHref || "/help";
  return `I could not verify that on SitGuru from the published Help and site pages. See **${link}** or email **${SUPPORT_EMAIL}** for confirmation.`;
}
