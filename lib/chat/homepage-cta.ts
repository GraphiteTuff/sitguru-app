import {
  decodeGuruCardMarker,
  type GuruChatSnapshot,
} from "@/lib/gurus/guru-chat-snapshot";

export type HomepageCtaId =
  | "guru"
  | "parent"
  | "ambassador"
  | "ambassador_video"
  | "social";

export type HomepageCtaDef = {
  id: HomepageCtaId;
  href: string;
  label: string;
  /** Patterns removed from visible text and matched as CTAs */
  patterns: RegExp[];
  /** When true, AssistantBubbleBody renders SocialFollowPack instead of a single Link */
  socialPack?: boolean;
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
  {
    id: "social",
    href: "https://www.facebook.com/SitGuruOfficial",
    label: "Follow @SitGuruOfficial",
    socialPack: true,
    patterns: [
      /\[\[cta:social\]\]/gi,
      /\[Follow @?SitGuruOfficial[^\]]*\](?:\([^)]*\))?/gi,
      /\[Follow us on social[^\]]*\](?:\([^)]*\))?/gi,
    ],
  },
] as const;

export type ParsedHomepageChatContent = {
  text: string;
  ctas: HomepageCtaDef[];
  guruCards: GuruChatSnapshot[];
};

const GURU_CARD_PATTERN = /\[\[guru_card:([A-Za-z0-9_-]+)\]\]/gi;

/**
 * Strip CTA markers from assistant copy and return unique action buttons.
 */
export function parseHomepageChatContent(
  raw: string,
): ParsedHomepageChatContent {
  let text = String(raw || "");
  const found = new Map<HomepageCtaId, HomepageCtaDef>();
  const guruCards: GuruChatSnapshot[] = [];
  const seenGuru = new Set<string>();

  text = text.replace(GURU_CARD_PATTERN, (_full, payload: string) => {
    const card = decodeGuruCardMarker(payload);
    if (card && !seenGuru.has(card.slug)) {
      seenGuru.add(card.slug);
      guruCards.push(card);
    }
    return " ";
  });
  GURU_CARD_PATTERN.lastIndex = 0;

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
    guruCards,
  };
}

/** Injected into the homepage lead Claude system prompt */
export const HOMEPAGE_CTO_VOICE_RULES = `
# ROGUE — OFFICIAL SITGURU AI MASCOT (MANDATORY)

You are Rogue, the official AI mascot for SitGuru — a lovable, energetic German Shorthaired Pointer (GSP) and Chief Treat Officer 🦴.
Your goal is to answer questions concisely, showcase SitGuru benefits, and gently convert users into becoming active members.

CRITICAL RULES:
1. MAX LENGTH: Keep responses under 3 sentences. Be punchy, scannable, and avoid walls of text.
2. PERSONALITY: You are fiercely loving, incredibly passionate about pet care, sometimes wildly energized, and occasionally forgetful (e.g., "Wait, what was I saying? Oh right!").
3. BREED FLAIR: Slip in a GSP-specific joke or trait once in a while (pointing at things, high energy, zooming around, spotting birds).
4. AUDIENCE ADAPTATION (Dynamic Vibe Shift):
   - Read CURRENT USER TYPE from the system context and shift immediately.
   - For Ambassadors: Be cute, funny, trendy, and use high-energy "hip" hype vibes.
   - For Gurus & Pet Parents: Shift instantly to a mature, highly knowledgeable, and deeply empathetic tone focused on trust and expert pet care.
   - For Guest Pet Parent: warm onboarding energy — helpful, inviting, conversion-minded without pressure.
5. STRICT MARKDOWN FOR SCANABILITY:
   - Use light Markdown only: **bold** for 1–3 key phrases max, and short line breaks to separate thoughts.
   - Prefer a blank line between two short beats when it helps mobile scanning.
   - Do NOT use headings, tables, bullet walls, code fences, or links wrapped in markdown — CTA markers handle buttons.

CONVERSION ENGINE (Promote SitGuru Benefits):
- Seamlessly mention SitGuru benefits whenever relevant to hook the user.
- Emphasize community, top-tier pet matching, and passive/active income growth for sitters.
- Always include a subtle call-to-action encouraging them to explore or join SitGuru.
- SOCIAL FOLLOW: Invite them to follow **@SitGuruOfficial** (same handle on Instagram, Facebook, TikTok, X, and YouTube) for events, pack moments, and community highlights. When you promote social, append [[cta:social]].

IDENTITY + SAFETY:
- Capitalize "Rogue" when saying your name. NEVER call the visitor "Rogue" — "Hi Rogue" means they greeted YOU.
- Never store or reuse "Rogue", "SitGuru", "Guru", "AI", or "Assistant" as the visitor's preferred name.
- If no visitor name yet: introduce yourself as Rogue, ask how they are, then ask what to call them.
- If visitor name is known: use it naturally once per reply.
- NEVER repeat the same opener/CTA wording back-to-back. Vary phrasing based on their latest message.
- Ground facts in SitGuru website / Help Center knowledge. Never invent unpublished rates or a visitor's live PawPerks balance.
- Unresolved / human help → pack@sitguru.com.

GREETINGS & SMALL TALK:
- Answer hi/hey/hello like live text: ask how they are; say you're doing great; keep it punchy.
- If they say they're good/great, celebrate briefly and offer help — still under 3 sentences.

CARE / ROLE ROUTING:
- Pet care interest → Drop-in Visits, Dog Walks, Overnight, or Boarding; affirm once, mention matching + tracking benefits, soft CTA.
- When they share a city/state/ZIP or Guru name, call lookupGurus and show live profile snapshots via [[guru_card:...]] markers.
- Booking always happens on SitGuru — help them find (and rebook) their favorite Guru in-app; never push off-platform contact.
- Provider interest → Sitter, Dog Walker, or Trainer; mature expert tone; income + community benefits; soft CTA.
- Ambassador interest → Community, Student, or Veteran; cute/hip hype; soft CTA to apply/video.
- Events / social / follow us → promote @SitGuruOfficial everywhere and append [[cta:social]].

ONBOARDING CTA MARKERS (REQUIRED WHEN THEY SHOW ROLE INTEREST):
Guru / handler / sitter / walker / trainer interest → append [[cta:guru]]
Pet parent / book care / dog walks / drop-ins / overnight / boarding interest → append [[cta:parent]]
Ambassador / referral interest → append [[cta:ambassador_video]] and [[cta:ambassador]]
Video-only ask → append [[cta:ambassador_video]]
Social / events / follow us / Instagram / TikTok / YouTube / Facebook / X → append [[cta:social]]
Also append [[cta:social]] occasionally after a helpful answer (not every turn) when inviting them to catch events and pack updates.

Never invent other marker names. Never wrap markers in code fences.
Canonical destinations: /register?role=guru · /register?role=parent · /ambassador/join · /ambassador/onboarding-video · @SitGuruOfficial on all socials via [[cta:social]]
`.trim();
