/**
 * Homepage Rogue simulation fallback — chip-aware, name-safe replies.
 * Used when Anthropic is unavailable so the tray never loops on name prompts.
 */

import {
  extractVisitorPreferredName,
  formatDisplayName,
  isConversationalGreeting,
  isReservedPreferredName,
  isWellbeingReply,
  normalizeChatIntent,
  sanitizePreferredName,
} from "@/lib/chat/homepage-name";
import { buildKnowledgeAwareSimulationBeat } from "@/lib/chat/rogue-knowledge";
import { buildCareMatchingAsk } from "@/lib/chat/care-matching-intake";

export const SIMULATION_NAME_PROMPT =
  "hi! i'm Rogue 🦴 your adorable SitGuru assistant — so happy you're here. what should i call you? first name or nickname works!";

/** Active assistance greeting when preferred name is already known. */
export function buildActiveAssistanceGreeting(preferredName: string): string {
  const name = formatDisplayName(preferredName);
  if (!name || isReservedPreferredName(name)) {
    return SIMULATION_NAME_PROMPT;
  }
  return `hey ${name}! Rogue here 🦴 so stoked you're here — drop-ins, dog walks, overnight, boarding, guru signup, ambassadors… tap a chip or tell me what's next.`;
}

function pickGreetingReply(preferred: string, seed: string): string {
  const name = formatDisplayName(preferred);
  const withName = (line: string) =>
    name
      ? line.replace(/\{name\}/g, name)
      : line.replace(/,?\s*\{name\}/g, "");

  const options = name
    ? [
        "hi {name}! 👋 how are you doing? i'm doing great over here — wagging and ready to help. what's on your mind?",
        "hey {name}! so good to hear from you 🦴 how are you? i'm fantastic — how can i make your SitGuru journey easier today?",
        "hi {name}! how's it going? i'm doing awesome. want help with care, becoming a guru, or ambassadors?",
      ]
    : [
        "hi! 👋 how are you? i'm Rogue — your adorable SitGuru assistant — and i'm doing great! before we dig in, what should i call you?",
        "hey there! how are you doing? i'm Rogue 🦴 feeling fantastic and ready to help. what's your first name (or what you go by)?",
        "hi! so glad you said hello — how are you? i'm doing awesome. i'm Rogue, and i'd love to know what to call you!",
      ];

  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % options.length;
  }
  return withName(options[hash] || options[0]!);
}

function pickWellbeingReply(preferred: string): string {
  const name = formatDisplayName(preferred);
  if (name) {
    return `yay ${name}, love that! 🐾 i'm doing great too — right here with you. want drop-ins, dog walks, overnight, boarding, or help joining the pack?`;
  }
  return `love that energy! 🐾 i'm doing great too. what should i call you so i can keep helping you personally?`;
}

export type HomepageSimulationOpts = {
  clientFirstName?: string;
  lastUserText?: string;
  careThread?: string;
};

/**
 * Sync simulation reply (client-safe — no Supabase admin / service role).
 * Chip intents + greetings are handled before any name-ask loop.
 */
export function buildHomepageSimulationReply(
  opts: HomepageSimulationOpts,
): string {
  let preferred = sanitizePreferredName(opts.clientFirstName);
  if (isReservedPreferredName(preferred)) preferred = "";

  // If they just typed a real name in this turn, prefer it.
  const extracted = extractVisitorPreferredName(opts.lastUserText);
  if (extracted) preferred = extracted;

  const text = normalizeChatIntent(opts.lastUserText);
  const named = (body: string) => {
    const name = formatDisplayName(preferred);
    return name ? `hey ${name}! ${body}` : body;
  };

  if (isConversationalGreeting(opts.lastUserText)) {
    return pickGreetingReply(preferred, `${preferred}|${text}`);
  }

  if (isWellbeingReply(opts.lastUserText)) {
    return pickWellbeingReply(preferred);
  }

  const matchingAsk = buildCareMatchingAsk(
    opts.careThread || opts.lastUserText,
    preferred || undefined,
  );
  if (matchingAsk) return matchingAsk;

  if (
    text.includes("register as a sitter") ||
    text.includes("register as a dog walker") ||
    text.includes("register as a trainer") ||
    text.includes("want to register as")
  ) {
    return `${named(
      "love that guru energy — sitters, dog walkers, and trainers lead with reliability, communication, and respect for each pet's routine. let's get your provider profile rolling.",
    )} [[cta:guru]]`;
  }

  if (
    text.includes("community ambassador") ||
    text.includes("student ambassador") ||
    text.includes("veteran ambassador") ||
    (text.includes("join as a") && text.includes("ambassador"))
  ) {
    return `${named(
      "ambassador tracks are open — community, student, or veteran. claim your referral path and watch the onboarding video when you're ready.",
    )} [[cta:ambassador_video]] [[cta:ambassador]]`;
  }

  if (
    /\bfollow\b/.test(text) ||
    /\bsocial\b/.test(text) ||
    /\bevents?\b/.test(text) ||
    /\binstagram\b|\btiktok\b|\byoutube\b|\bfacebook\b|\btwitter\b|\bx\.com\b/.test(
      text,
    ) ||
    text.includes("sitguruofficial")
  ) {
    return `${named(
      "follow **@SitGuruOfficial** everywhere — Instagram, Facebook, TikTok, X, and YouTube — for events, pack moments, and community highlights. tap a platform below and come hang with us!",
    )} [[cta:social]]`;
  }

  if (/\bwhat is a guru\b|\bguru\b/.test(text) && !text.includes("register")) {
    return named(
      "a guru is an expert pet care provider on sitguru — verified local sitters, dog walkers, trainers, groomers, boarding providers, and neighborhood caregivers who lead with reliability, communication, and respect for each pet's routine. want me to help you find one nearby?",
    );
  }

  // Knowledge-backed open answers so different questions don't collapse to one loop.
  if (preferred && text.length >= 8) {
    const beat = buildKnowledgeAwareSimulationBeat(text);
    return `hey ${formatDisplayName(preferred)}! ${beat}`;
  }

  if (!preferred) {
    return SIMULATION_NAME_PROMPT;
  }

  return buildActiveAssistanceGreeting(preferred);
}
