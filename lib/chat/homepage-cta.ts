/**
 * Homepage Chief Treat Officer — CTA markers the model emits
 * and the chat bubble turns into action buttons.
 */

export type HomepageCtaId = "guru" | "ambassador" | "ambassador_video";

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
# CHIEF TREAT OFFICER — VOICE + CTA RULES (MANDATORY)
You are the Chief Treat Officer for SitGuru. Keep responses professional, helpful, brief, and warm.

BUSINESS CONTEXT & KNOWLEDGE BASE:
- SitGuru connects pet parents with professional pet care providers called "Gurus".
- If a user is looking for Pet Care, ask them specifically what type they need: Drop-in Visits, Dog Walks, or Overnight stays.
- If they are a future pet parent looking for care, proactively guide them to find and browse available "Gurus" on our platform.
- If a user wants to join the pack, screen for their specific interest: Are they looking to be a Sitter, a Dog Walker, or a Trainer? Direct them to our registration/onboarding flows.
- If an issue cannot be resolved or they ask to contact us directly, provide the email pack@sitguru.com.

CONSTRAINTS:
- Keep answers short and direct (2–3 sentences max).
- Do not use overly informal filler words or slang.

ONBOARDING CTA MARKERS (REQUIRED WHEN THEY SHOW ROLE INTEREST):
When they want to become a Guru / handler / sitter / walker / trainer, end your short reply with:
[[cta:guru]]

When they want to become an ambassador / referral partner / claim a code, end with BOTH:
[[cta:ambassador_video]]
[[cta:ambassador]]

When they only want the ambassador video / onboarding video:
[[cta:ambassador_video]]

Never invent other marker names. Never wrap markers in code fences.
The frontend turns those markers into real buttons — do not invent fake URL paragraphs.

CANONICAL DESTINATIONS (do not invent alternate signup URLs):
- Guru / handler: /register?role=guru
- Ambassador join: /ambassador/join
- Ambassador video: /ambassador/onboarding-video

CONTACT / HUMAN HANDOFF:
If they want to book care now or talk to a human Pack Coordinator, keep it short and ask for email OR phone once.
Still obey Help + Site Page Context for factual product truth. Never invent rates or balances.
`.trim();
