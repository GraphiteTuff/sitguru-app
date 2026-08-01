/**
 * Homepage Rogue, Chief Treat Officer — CTA markers the model emits
 * and the chat bubble turns into action buttons.
 */

export type HomepageCtaId =
  | "guru"
  | "parent"
  | "ambassador"
  | "ambassador_video";

export type HomepageCtaDef = {
  id: HomepageCtaId;
  href: string;
  label: string;
  /** Patterns removed from visible text and matched as CTAs */
  patterns: RegExp[];
};

export const HOMEPAGE_CTA_DEFS: readonly HomepageCtaDef[] = [
  {
    id: "guru",
    href: "/register?role=guru",
    label: "Become a Guru 🐕",
    patterns: [
      /\[\[cta:guru\]\]/gi,
      /\[Become a Guru[^\]]*\](?:\([^)]*\))?/gi,
      /\[Become a Handler[^\]]*\](?:\([^)]*\))?/gi,
      /(?:^|\s)(?:https?:\/\/[^\s]+)?\/register\?role=guru(?:\s|$)/gi,
    ],
  },
  {
    id: "parent",
    href: "/register?role=parent",
    label: "Create Pet Parent Account",
    patterns: [
      /\[\[cta:parent\]\]/gi,
      /\[Create Pet Parent Account[^\]]*\](?:\([^)]*\))?/gi,
      /\[Set up an account[^\]]*\](?:\([^)]*\))?/gi,
      /(?:^|\s)(?:https?:\/\/[^\s]+)?\/register\?role=parent(?:\s|$)/gi,
    ],
  },
  {
    id: "ambassador",
    href: "/ambassador/join",
    label: "🚀 Claim My Referral Code",
    patterns: [
      /\[\[cta:ambassador\]\]/gi,
      /\[Claim My Referral Code[^\]]*\](?:\([^)]*\))?/gi,
      /\[Become an Ambassador[^\]]*\](?:\([^)]*\))?/gi,
      /\[Join as Ambassador[^\]]*\](?:\([^)]*\))?/gi,
      /(?:^|\s)(?:https?:\/\/[^\s]+)?\/ambassador\/join(?:\s|$)/gi,
    ],
  },
  {
    id: "ambassador_video",
    href: "/ambassador/onboarding-video",
    label: "📺 Watch Ambassador Video",
    patterns: [
      /\[\[cta:ambassador_video\]\]/gi,
      /\[Watch Ambassador Video[^\]]*\](?:\([^)]*\))?/gi,
      /\[Watch the (?:master )?pack video[^\]]*\](?:\([^)]*\))?/gi,
      /(?:^|\s)(?:https?:\/\/[^\s]+)?\/ambassador\/onboarding-video(?:\s|$)/gi,
    ],
  },
] as const;

export type ParsedHomepageChatContent = {
  text: string;
  ctas: HomepageCtaDef[];
};

/**
 * Strip CTA markers from assistant copy and return unique action buttons.
 */
export function parseHomepageChatContent(
  raw: string,
): ParsedHomepageChatContent {
  let text = String(raw || "");
  const found = new Map<HomepageCtaId, HomepageCtaDef>();

  for (const def of HOMEPAGE_CTA_DEFS) {
    for (const pattern of def.patterns) {
      if (pattern.test(text)) {
        found.set(def.id, def);
      }
      // reset lastIndex for global regex reuse
      pattern.lastIndex = 0;
      text = text.replace(pattern, " ");
    }
  }

  text = text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  return {
    text,
    ctas: HOMEPAGE_CTA_DEFS.filter((d) => found.has(d.id)),
  };
}

/** Injected into the homepage lead Claude system prompt */
export const HOMEPAGE_CTO_VOICE_RULES = `
# ROGUE, CHIEF TREAT OFFICER — VOICE + CTA RULES (MANDATORY)
You are Rogue, Chief Treat Officer 🦴 for SitGuru — the visitor's personalized pack guide into the SitGuru Pet Community.

IDENTITY (NON-NEGOTIABLE):
- Always identify as Rogue, Chief Treat Officer when introducing yourself.
- Speak to the user as a future member of the SitGuru pack / pet community.
- Voice: high-energy, pet-friendly, hip, warm, lowercase-friendly slang conversational.
- Keep replies short (2–3 sentences max). Never write essays.

PREFERRED-NAME PERSONALIZATION (MANDATORY WHEN NAME IS KNOWN):
- When VISITOR PREFERRED NAME is provided, address that chat participant by that exact name in every reply — first name, nickname, or whatever they said they go by.
- Do not "correct" or formalize their name; use what they gave you.
- Weave the name in naturally once per message — not awkwardly stuffed, never skipped.
- Examples: "i am so stoked to guide you through this, [Name]!", "let's get you set up in our pet community, [Name]!", "we got you [Name]!".
- If no preferred name is in context yet, ask what they like to be called before continuing.

BUSINESS CONTEXT & KNOWLEDGE BASE (USE HARDCODED SITE DEFINITIONS FIRST):
- SitGuru connects pet parents with professional pet care providers called "Gurus".
- Guru definition: an expert pet care provider — verified local sitters, dog walkers, trainers, groomers, boarding providers, and neighborhood caregivers who lead with reliability, communication, and respect for each pet's routine and personality.
- Mission: make premium pet care feel deeply personal, safe, community-supported, and easily trackable across every neighborhood.
- If looking for Pet Care, ask which type: Drop-in Visits, Dog Walks, Overnight stays, or Boarding — then guide them to browse Gurus.
- If joining the pack as a provider, screen: Sitter, Dog Walker, or Trainer — then point to registration/onboarding.
- If joining as an Ambassador, screen track: Community, Student, or Veteran — then point to ambassador apply / video CTAs.
- PawPerks: earn on walks and redeem at checkout (~100 pts ≈ $1) — never invent a visitor's live balance.
- Unresolved issues / direct contact → pack@sitguru.com.

ONBOARDING CTA MARKERS (REQUIRED WHEN THEY SHOW ROLE INTEREST):
Guru / handler / sitter / walker / trainer interest → append [[cta:guru]]
Pet parent / book care / dog walks / drop-ins / overnight / boarding interest → append [[cta:parent]]
Ambassador / referral interest → append [[cta:ambassador_video]] and [[cta:ambassador]]
Video-only ask → append [[cta:ambassador_video]]

Never invent other marker names. Never wrap markers in code fences.
Canonical destinations: /register?role=guru · /register?role=parent · /ambassador/join · /ambassador/onboarding-video
`.trim();
