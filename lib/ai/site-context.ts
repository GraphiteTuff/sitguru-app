// lib/ai/site-context.ts
/**
 * Unified site-wide marketing context for SitGuru AI (Chief Treat Officer).
 * High-fidelity copies of public marketing pages — inject into system prompts
 * alongside the Help Center catalog so Claude can answer brand / About questions
 * (e.g. "What is a Guru?") from verified layout copy, not improvisation.
 */

export type SitePageContextEntry = {
  /** Stable page key */
  id: string;
  /** Public path */
  path: string;
  /** Human title */
  title: string;
  /** Full narrative copy for AI grounding */
  body: string;
  /** Searchable topic tags */
  topics: string[];
};

/**
 * Canonical About Page excerpts — must stay aligned with `app/about/page.tsx`.
 */
export const ABOUT_PAGE_CORE = {
  mission: "Pet care should feel personal, local, and supported.",
  guruDefinition:
    "A Guru is an expert pet care provider. On SitGuru, a Guru can be a sitter, walker, trainer, groomer, boarding provider, drop-in caregiver, or experienced pet person who helps Pet Parents care for their pets. Gurus are more than available helpers. They are people who lead with reliability, communication, compassion, and respect for each pet's routine, personality, and needs.",
  coreVibe:
    "Wherever care happens, SitGuru is built to support it across every state, city, town, township, and community.",
  headline: "Built by Pet Parents. Made for trusted local pet care.",
  marketplaceSummary:
    "SitGuru is a pet care marketplace helping Pet Parents connect with trusted local Gurus — expert pet care providers who lead with care, communication, reliability, and heart. We support Pet Parents and Gurus no matter which state, community, city, town, or township they call home. Because at the heart of SitGuru, we are local Pet Parents too.",
} as const;

/**
 * Complete marketing page context array scanned by homepage / lead AI.
 */
export const SITE_PAGE_CONTEXT: SitePageContextEntry[] = [
  {
    id: "about",
    path: "/about",
    title: "About SitGuru",
    topics: [
      "about",
      "mission",
      "guru definition",
      "what is a guru",
      "where we operate",
      "values",
      "local care",
    ],
    body: [
      ABOUT_PAGE_CORE.headline,
      ABOUT_PAGE_CORE.marketplaceSummary,
      "",
      `Mission: ${ABOUT_PAGE_CORE.mission}`,
      "Choosing care for a beloved pet should never feel rushed, confusing, or disconnected. Pet Parents deserve to feel confident in who they choose, and Gurus deserve a place where real care, professionalism, and communication can stand out.",
      "SitGuru was built from a Pet Parent perspective. We know what it feels like to love pets deeply, worry about their routine, and want someone dependable nearby who will treat them with genuine care.",
      "",
      `Guru definition: ${ABOUT_PAGE_CORE.guruDefinition}`,
      "",
      `Core vibe / footprint: ${ABOUT_PAGE_CORE.coreVibe}`,
      "Pet care is local. It happens between real people in real communities. SitGuru supports Pet Parents and Gurus across the places they live, work, walk, visit, and provide care — every state, every community, every city, every town, every township, every trusted local care connection.",
      "",
      "Pillars:",
      "- Local Care, Wherever You Are — Whether care happens in a city, small town, suburb, neighborhood, or township, SitGuru is built to support trusted local pet care connections.",
      "- Pet Parents Helping Pet Parents — We are local Pet Parents too. SitGuru is shaped around the same concerns families have when choosing someone to care for a pet they love.",
      "- Trust Before Transactions — Pet care should feel personal, clear, and reassuring. SitGuru is built to help Pet Parents choose with confidence and help Gurus stand out through trust.",
      "",
      "How SitGuru works:",
      "01 Find local care — Pet Parents discover Gurus nearby and compare services, profiles, and care options.",
      "02 Connect with confidence — Clear profiles, helpful details, and trust-focused tools help Pet Parents feel better about who they choose.",
      "03 Build trusted relationships — Better communication, repeat care, and stronger long-term pet care connections.",
      "",
      "Values: Trust, Care, Community, Clarity, Connection.",
      "Technology should make pet care feel more human, not less. The heart of care will always be human connection.",
      "Founding pets featured on About: Scout & Rogue (German Shorthaired Pointers), Delilah (American Cocker Spaniel), Taco & Belle (cats).",
    ].join("\n"),
  },
  {
    id: "home",
    path: "/",
    title: "SitGuru Homepage",
    topics: ["homepage", "join the pack", "services", "pet parents", "gurus"],
    body: [
      "SitGuru | Trusted Pet Care. Simplified.",
      "SitGuru helps Pet Parents find trusted local Gurus for walks, sitting, boarding, training, drop-in visits, doggy day care, and more.",
      "Public visitors can Join the Pack as Pet Parents, become a Guru, explore Ambassadors / partners, and chat with The Chief Treat Officer AI for tail-wagging support.",
      "Core product promises on the landing surface: trusted local matching, PawReport Live walk tracking, PawPerks loyalty, and Brand Ambassador rewards.",
    ].join("\n"),
  },
  {
    id: "pet-parents",
    path: "/pet-parents",
    title: "For Pet Parents",
    topics: ["pet parents", "find care", "booking", "peace of mind"],
    body: [
      "Find trusted local pet care with SitGuru. Connect with Pet Gurus for dog walking, pet sitting, boarding, drop-in visits, training, and more.",
      "SitGuru makes it easier to find local pet care when you need a walk, sit, boarding, or last-minute help during workdays, weekends, or travel.",
      "Pet Parents get clearer profiles, easier booking conversations, live care updates (PawReport Live), and pathways to build repeat relationships with Gurus they trust.",
      "Create a free SitGuru account to start connecting with local Gurus.",
    ].join("\n"),
  },
  {
    id: "become-a-guru",
    path: "/become-a-guru",
    title: "Become a Guru",
    topics: ["become a guru", "handler", "sitter", "walker", "earn", "onboarding"],
    body: [
      "Become a Guru on SitGuru — grow a trusted local pet-care presence.",
      "A Guru is an expert pet care provider (sitter, walker, trainer, groomer, boarding provider, drop-in caregiver, or experienced pet person).",
      "SitGuru helps nearby Pet Parents discover, book, and rebook you.",
      "Profile building: show experience, photos, care style, services, rates, neighborhoods, and schedule.",
      "Stay organized: booking conversations, PawReports, reviews, and rebooking stay connected in SitGuru.",
      "Eligible paid bookings and Guru payouts are handled through SitGuru after required payout setup.",
      "SitGuru welcomes experienced providers and responsible local pet lovers prepared to complete profile and trust steps.",
      "Student, community, or military-connected applicants can explore SitGuru programs.",
    ].join("\n"),
  },
  {
    id: "partners",
    path: "/partners",
    title: "Partners & Affiliates",
    topics: ["partners", "affiliates", "brand ambassadors", "referrals"],
    body: [
      "SitGuru partners with local and national pet brands, content creators, and community advocates.",
      "Affiliate / Ambassador pathways let supporters share SitGuru with personalized links, QR codes, and tracked rewards for verified signups and bookings.",
      "Apply, promote unique links, track clicks/signups/bookings, and receive approved rewards through SitGuru Admin review.",
    ].join("\n"),
  },
  {
    id: "find-care",
    path: "/find-care",
    title: "Find Care",
    topics: ["search", "find care", "local gurus", "services"],
    body: [
      "Pet Parents can search for local Gurus by service type (dog walking, pet sitting, boarding, drop-in visits, training support, and more) and location.",
      "Compare Guru profiles, services, and care options that fit each pet's needs, then connect with confidence.",
    ].join("\n"),
  },
  {
    id: "help",
    path: "/help",
    title: "Help Center overview",
    topics: ["help", "support", "pawreport", "billing", "safety"],
    body: [
      "The SitGuru Help Center covers Pet Parent support, Guru success & training, billing & refunds, account & profiles, booking & cancellations, and trust & safety.",
      "For deep technical how-tos, Prefer the Help Center article catalog injected alongside this marketing context.",
      "PawReport Live: live GPS polyline on parent phone dashboards, instant potty push alerts, and a responsive email report when a walk ends. Offline parents may receive Twilio SMS fallback updates.",
    ].join("\n"),
  },
];

/** Flatten SITE_PAGE_CONTEXT into a prompt-ready digest (defensive). */
export function formatSitePageContextForPrompt(maxChars = 14000): string {
  const pages = Array.isArray(SITE_PAGE_CONTEXT) ? SITE_PAGE_CONTEXT : [];
  const blocks = pages
    .filter((page) => page && typeof page.body === "string" && page.body.trim())
    .map((page) =>
      [
        `## ${page.title || "Untitled"} (${page.path || "/"})`,
        `Topics: ${Array.isArray(page.topics) ? page.topics.join(", ") : ""}`,
        page.body,
      ].join("\n"),
    )
    .join("\n\n");

  const digest = [
    "# SITGURU MARKETING SITE PAGE CONTEXT (authoritative brand copy)",
    "Source of truth for mission, Guru definition, footprint, and public marketing narratives.",
    "If a visitor asks what a Guru is, what SitGuru's mission is, or where we operate, answer from this copy first.",
    "",
    `Quick facts:`,
    `- Mission: ${ABOUT_PAGE_CORE.mission}`,
    `- Guru: ${ABOUT_PAGE_CORE.guruDefinition}`,
    `- Footprint: ${ABOUT_PAGE_CORE.coreVibe}`,
    "",
    blocks || "(no additional page bodies available)",
  ].join("\n");

  if (digest.length <= maxChars) return digest;
  return `${digest.slice(0, maxChars - 40)}\n\n[…site context truncated…]`;
}

export const SITE_CONTEXT_SCAN_INSTRUCTION = [
  "You are the Chief Treat Officer.",
  "Before answering any user query, you must scan BOTH the technical Help Center catalog AND the marketing Site Page Context array.",
  "If a user asks what a Guru is, what SitGuru's mission is, or where we operate, pull directly from the verified Site Page Context copy text to deliver an ultra-accurate, warm, pet-loving response.",
  "Never invent a different definition of Guru than the About page definition above.",
].join(" ");
