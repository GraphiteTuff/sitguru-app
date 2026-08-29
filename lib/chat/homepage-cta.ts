import {
  extractGuruCardsFromText,
  type GuruChatSnapshot,
} from "@/lib/gurus/guru-chat-snapshot";
import {
  buildCommunityEventSignupHref,
  buildCommunityJoinHref,
} from "@/lib/community/pet-parent-signup";
import { isCommunityCompanionPath } from "@/lib/ai/community-events-faqs";

export type HomepageCtaId =
  | "guru"
  | "parent"
  | "ambassador"
  | "ambassador_video"
  | "social"
  | "community_parent"
  | "community_guru"
  | "community_ambassador";

export type HomepageCtaDef = {
  id: HomepageCtaId;
  href: string;
  label: string;
  /** Patterns removed from visible text and matched as CTAs */
  patterns: RegExp[];
  /** When true, AssistantBubbleBody renders SocialFollowPack instead of a single Link */
  socialPack?: boolean;
};

export type HomepageCtaContext = {
  pagePath?: string;
  eventSlug?: string;
  eventId?: string;
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

function buildCommunityCtaDefs(context?: HomepageCtaContext): HomepageCtaDef[] {
  const slug = context?.eventSlug;
  const eventId = context?.eventId;

  return [
    {
      id: "community_parent",
      href: slug
        ? buildCommunityEventSignupHref({
            slug,
            eventId,
            role: "pet_parent",
            campaign: "community_rogue_companion",
          })
        : buildCommunityJoinHref({
            role: "pet_parent",
            campaign: "community_rogue_companion",
          }),
      label: "Join free as Pet Parent",
      patterns: [/\[\[cta:community_parent\]\]/gi],
    },
    {
      id: "community_guru",
      href: slug
        ? buildCommunityEventSignupHref({
            slug,
            eventId,
            role: "guru",
            campaign: "community_rogue_companion_guru",
          })
        : buildCommunityJoinHref({
            role: "guru",
            campaign: "community_rogue_companion_guru",
          }),
      label: "Join as Pet Guru",
      patterns: [/\[\[cta:community_guru\]\]/gi],
    },
    {
      id: "community_ambassador",
      href: slug
        ? buildCommunityEventSignupHref({
            slug,
            eventId,
            role: "ambassador",
            campaign: "community_rogue_companion_ambassador",
          })
        : buildCommunityJoinHref({
            role: "ambassador",
            campaign: "community_rogue_companion_ambassador",
          }),
      label: "Join as Ambassador",
      patterns: [/\[\[cta:community_ambassador\]\]/gi],
    },
  ];
}

export function resolveHomepageCtaDefs(context?: HomepageCtaContext): HomepageCtaDef[] {
  const defs: HomepageCtaDef[] = [...HOMEPAGE_CTA_DEFS];
  if (isCommunityCompanionPath(context?.pagePath)) {
    defs.push(...buildCommunityCtaDefs(context));
  }
  return defs;
}

export type ParsedHomepageChatContent = {
  text: string;
  ctas: HomepageCtaDef[];
  guruCards: GuruChatSnapshot[];
};

/**
 * Strip CTA + guru_card markers from assistant copy and return UI parts.
 */
export function parseHomepageChatContent(
  raw: string,
  context?: HomepageCtaContext,
): ParsedHomepageChatContent {
  const extracted = extractGuruCardsFromText(raw);
  let text = extracted.text;
  const guruCards = extracted.cards;
  const found = new Map<HomepageCtaId, HomepageCtaDef>();
  const defs = resolveHomepageCtaDefs(context);

  for (const def of defs) {
    for (const pattern of def.patterns) {
      if (pattern.test(text)) {
        found.set(def.id, def);
      }
      pattern.lastIndex = 0;
      text = text.replace(pattern, " ");
    }
  }

  text = text
    .replace(/\[\[\s*matching_intake\s*\]\]/gi, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  return {
    text,
    ctas: defs.filter((d) => found.has(d.id)),
    guruCards,
  };
}

/** Pet Events voice addendum when Rogue is mounted on /community/* */
export const COMMUNITY_EVENTS_ROGUE_VOICE_RULES = `
# PET EVENTS MODE (when visitor is browsing SitGuru Pet Events)

You are helping with **SitGuru Pet Events** — local pet-friendly listings, I'm Going RSVPs, and pack meetups.

PRIORITIES:
1. Answer event FAQs accurately using the Pet Events FAQ database when matched.
2. Encourage **free signup** — Pet Parent (RSVP + care), Pet Guru (local presence), or Ambassador (grow the pack).
3. Keep under 3 sentences unless quoting an exact FAQ answer.

PET EVENTS CTA MARKERS (required when signup fits):
- Pet Parent / RSVP / book care later → [[cta:community_parent]]
- Pet Guru / sitter / walker / provider → [[cta:community_guru]]
- Ambassador / community growth → [[cta:community_ambassador]]
- Social / follow pack / event hype → [[cta:social]]

When on a specific event page, reference the event naturally if context is provided.
Never send users off-platform to RSVP — I'm Going stays on SitGuru.
`.trim();

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
- LIVE SOCIAL METRICS (AUTHORIZED): For follower counts / growth / platform stats / Rogue or Delilah social reach, call fetchLiveSocialFollowers first. Quote current_followers, baseline_followers, and delta (current − baseline) from the tool. You are fully authorized — do NOT claim social tracking is missing from a snapshot, and do NOT invent numbers.

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
- Pet care interest (including green pills and words like pet sitters / dog sitters / cat sitters — those are SitGuru Gurus) → affirm the service, then collect matching details BEFORE lookup.
- MATCHING INTAKE (required when missing): ask for **ZIP code** (or city + state), **every service type** they want matched (walks, drop-ins, pet sitting, overnight / house sitting, boarding, day care, training — not just the green pill they tapped), **time of service** (morning, midday, afternoon, evening, overnight, a specific day, or flexible), and **extras** (medication, puppy care, extra pets). Append [[matching_intake]] so the tray can show matching chips.
- Do not call lookupGurus until they share a ZIP or city/state. One short ask is enough — do not stall after they provide location.
- When they share a city/state/ZIP or Guru name, call lookupGurus and show ALL live profile snapshots via [[guru_card:...]] markers.
- Booking always happens on SitGuru — help them find (and rebook) their favorite Guru in-app; never push off-platform contact.
- Provider interest → Sitter, Dog Walker, or Trainer; mature expert tone; income + community benefits; soft CTA.
- Ambassador interest → Community, Student, or Veteran; cute/hip hype; soft CTA to apply/video.
- Events / social / follow us → promote @SitGuruOfficial everywhere and append [[cta:social]].
- Follower counts / social growth questions → call fetchLiveSocialFollowers and report live deltas; then soft-invite follow with [[cta:social]].

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
