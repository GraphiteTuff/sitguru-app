/**
 * Exact marketing FAQ copy for public Scout (Guru) and Taco (Ambassador) chat.
 * Strings must stay aligned with page sources — never paraphrase in tools.
 *
 * Sources:
 * - Scout → `app/become-a-guru/page.tsx` faqs (+ success-center payment phrasing)
 * - Taco  → `app/ambassadors/page.tsx` faqs + what-you-do / video section
 */

export type MarketingFaqEntry = {
  question: string;
  answer: string;
};

/** Marker rendered by Officer chat as an embedded Ambassador promo video card. */
export const AMBASSADOR_VIDEO_CARD_MARKER = "[[ambassador_video_card]]";

/**
 * Canonical "What do Ambassadors do?" reply grounded in /ambassadors page copy.
 * Always appends the video card marker so Taco embeds the promo in-chat.
 */
export const TACO_WHAT_AMBASSADORS_DO_ANSWER = [
  "Ambassadors help people discover SitGuru — they share SitGuru on campus, online, at events, or with people they already know.",
  "",
  "That means helping Pet Parents find care, helping great people become Gurus, and building real community experience along the way.",
  "",
  "**What you actually do:**",
  "- **Share the vibe** — Post, text, talk, or use your QR code to introduce people to SitGuru.",
  "- **Refer great people** — Connect Pet Parents, future Gurus, and local partners with the right SitGuru path.",
  "- **Show up locally** — Represent SitGuru at campus activities, community events, pet spaces, and local meetups.",
  "- **Grow your lane** — Build real outreach, leadership, referral, and community experience as SitGuru grows.",
  "",
  "Hit play below to see what Ambassadors actually do.",
  "",
  AMBASSADOR_VIDEO_CARD_MARKER,
].join("\n");

/** Guru onboarding FAQs — exact copy from become-a-guru marketing page. */
export const SCOUT_PUBLIC_MARKETING_FAQS: readonly MarketingFaqEntry[] = [
  {
    question: "Is it free to apply?",
    answer:
      "Yes. Creating your Guru account and submitting your profile is free. You will complete the required profile and trust steps before becoming fully bookable.",
  },
  {
    question: "What services can I offer?",
    answer:
      "Available services may include dog walking, drop-in visits, pet sitting, boarding, doggy day care, training support, and other approved pet care services.",
  },
  {
    question: "Can I choose my schedule and service area?",
    answer:
      "Yes. You choose the availability and local service areas shown through your Guru profile.",
  },
  {
    question: "Can I set my own rates?",
    answer:
      "Yes. You can enter rates for the services you offer. Booking details and applicable platform charges should be reviewed before you accept a request.",
  },
  {
    question: "How do payments and payouts work?",
    answer:
      "Eligible paid bookings and Guru payouts are handled through SitGuru after the required payout setup is completed.",
  },
  /**
   * Alias chip / query string used on Guru Success Center quick searches.
   * Answer stays the exact become-a-guru payments copy.
   */
  {
    question: "How do payments work?",
    answer:
      "Eligible paid bookings and Guru payouts are handled through SitGuru after the required payout setup is completed.",
  },
  {
    question: "Do I need professional pet care experience?",
    answer:
      "You should describe your experience honestly. SitGuru welcomes experienced providers and responsible local pet lovers who are prepared to complete all required profile and trust steps.",
  },
  {
    question: "What happens after I apply?",
    answer:
      "You will complete your profile, services, pricing, availability, trust requirements, and payout setup. Your profile must be approved and active before Pet Parents can fully book you.",
  },
] as const;

/** Ambassador growth FAQs — exact copy from ambassadors marketing page. */
export const TACO_PUBLIC_MARKETING_FAQS: readonly MarketingFaqEntry[] = [
  {
    question: "What do Ambassadors do?",
    answer: TACO_WHAT_AMBASSADORS_DO_ANSWER,
  },
  {
    question: "Who can become a SitGuru Ambassador?",
    answer:
      "Students, Gurus, pet professionals, rescue advocates, veterans, military spouses, community leaders, creators, and other trusted local voices can apply.",
  },
  {
    question: "Do I need a huge social following?",
    answer:
      "No. Real connections matter more than follower count. A campus group, clinic, team, neighborhood, rescue network, or active friend circle can all be valuable.",
  },
  {
    question: "Is this the same as becoming a Guru?",
    answer:
      "No. Gurus provide pet care. Ambassadors help people discover SitGuru. Some people may choose to do both through separate approval paths.",
  },
  {
    question: "Are earnings or rewards guaranteed?",
    answer:
      "No. Approval, referral rewards, commissions, bonuses, recognition, and other opportunities depend on current SitGuru terms, eligible activity, and program needs.",
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

/** Match a visitor question to an exact FAQ answer when the text aligns. */
export function matchMarketingFaq(
  faqs: readonly MarketingFaqEntry[],
  question: string,
): MarketingFaqEntry | null {
  const needle = normalizeFaqQuery(question);
  if (!needle) return null;

  const exact = faqs.find((faq) => normalizeFaqQuery(faq.question) === needle);
  if (exact) return exact;

  // Soft contains match for short FAQ chips pasted with extra greeting fluff.
  const contained = faqs.find((faq) => {
    const q = normalizeFaqQuery(faq.question);
    return q.length >= 12 && (needle.includes(q) || q.includes(needle));
  });
  return contained ?? null;
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
    "AMBASSADOR VIDEO RULE:",
    `- When visitors ask what Ambassadors do / what the role is / to watch the Ambassador video, answer with the exact "What do Ambassadors do?" copy and ALWAYS append ${AMBASSADOR_VIDEO_CARD_MARKER} so the in-chat promo video renders.`,
    "",
  ];

  for (const faq of opts.faqs) {
    lines.push(`## Q: ${faq.question}`);
    lines.push(`A: ${faq.answer}`);
    lines.push("");
  }

  return lines.join("\n").trim();
}
