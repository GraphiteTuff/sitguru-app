/**
 * Homepage Rogue simulation fallback — chip-aware, name-safe replies.
 * Used when Anthropic is unavailable so the tray never loops on name prompts.
 */

export const SIMULATION_NAME_PROMPT =
  "hey! welcome to the pack 🐾 what's your first name (or what do you like to be called) so we can kick off your journey into our sitguru pet community?";

/** Active assistance greeting when preferred name is already known. */
export function buildActiveAssistanceGreeting(preferredName: string): string {
  const name = sanitizePreferredName(preferredName);
  if (!name) {
    return SIMULATION_NAME_PROMPT;
  }
  return `hey ${name}! Rogue here 🦴 so stoked you're here — drop-ins, dog walks, overnight, boarding, guru signup, ambassadors… tap a chip or tell me what's next.`;
}

function sanitizePreferredName(raw: unknown): string {
  return String(raw || "")
    .replace(/[^a-zA-Z0-9\s'.\-]/g, "")
    .trim()
    .slice(0, 40);
}

function normalizeIntent(raw: unknown): string {
  return String(raw || "")
    .toLowerCase()
    .replace(/[!.?,…]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** True for short social openers: hi, hey, hello, what's up, etc. */
export function isConversationalGreeting(raw: unknown): boolean {
  const text = normalizeIntent(raw);
  if (!text || text.length > 48) return false;
  return (
    /^(hi|hii+|hello|hey|heya|hiya|yo|sup|howdy|hola|morning|good morning|good afternoon|good evening|good night|gm|gn|whats up|what's up|what up|wassup|wazzup|how are you|how r you|how're you|how goes it|nice to meet you|pleased to meet you)(\s+(there|rogue|pack|friend|y'?all))?$/.test(
      text,
    ) || /^(hi|hey|hello)\s+(rogue|there)!*$/.test(text)
  );
}

function pickGreetingReply(preferred: string, seed: string): string {
  const named = preferred ? preferred : "";
  const withName = (line: string) =>
    named
      ? line.replace(/\{name\}/g, named)
      : line.replace(/,?\s*\{name\}/g, "");

  const options = preferred
    ? [
        "hey {name}! 👋 Rogue in the chat live with you — what's good? book care, join as a guru, or roll ambassador… i'm right here.",
        "hi {name}! 🦴 just caught that — i'm Rogue, your chief treat officer. talk to me like we're texting: what are we figuring out today?",
        "yo {name}! glad you hopped in. i'm listening in real time — dog walks, drop-ins, overnight, boarding, or joining the pack?",
        "hey {name}! what's up 🐾 drop whatever's on your mind and i'll guide you through it, step by step.",
        "hello {name}! Rogue here — live and locked in. tell me what you need and we'll move on it together.",
      ]
    : [
        "hey! 👋 Rogue here live in the chat — love the hello. what should i call you so we can keep this real-time?",
        "hi! 🦴 i'm Rogue, your chief treat officer. what's your first name (or what you go by) and we can dig in right away.",
        "yo! glad you said hi — i'm listening. what do you like to be called?",
      ];

  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % options.length;
  }
  return withName(options[hash] || options[0]!);
}

export type HomepageSimulationOpts = {
  clientFirstName?: string;
  lastUserText?: string;
};

/**
 * Build a simulation reply.
 * Chip intents are parsed BEFORE any name-ask so service clicks never re-loop.
 */
export function buildHomepageSimulationReply(
  opts: HomepageSimulationOpts,
): string {
  const preferred = sanitizePreferredName(opts.clientFirstName);
  const text = normalizeIntent(opts.lastUserText);
  const named = (body: string) =>
    preferred ? `hey ${preferred}! ${body}` : body;

  // Real-time social greetings — respond like a live chat, never re-loop name ask when known.
  if (isConversationalGreeting(opts.lastUserText)) {
    return pickGreetingReply(preferred, `${preferred}|${text}`);
  }

  /**
   * Prefer exact dog-walk copy from product spec when name is known —
   * avoid "hey Name! let's goooo" double greeting when copy already leads strong.
   */
  if (
    text.includes("looking for dog walks") ||
    text === "dog walks" ||
    /\bdog walks?\b/.test(text)
  ) {
    const dogWalkCopy =
      "great choice! we can help you find a Pet Guru to get you the care you need right away — we're fast, accurate, and right here with you. 🐕 dog walks with our local gurus include real-time live map tracking, potty alerts, and automated updates sent straight to your phone. want to set up an account to meet a nearby handler?";
    const lead = preferred ? `hey ${preferred}! ` : "";
    return `${lead}${dogWalkCopy} [[cta:parent]]`;
  }

  if (
    text.includes("looking for drop-in") ||
    text.includes("drop-in visits") ||
    text.includes("drop in visits")
  ) {
    return `${named(
      "great choice! we can help you find a Pet Guru to get you the care you need right away — fast, accurate matching, and i'm here to help. drop-in visits keep routines tight with feeding, potty, play, and photo updates. ready to meet someone nearby?",
    )} [[cta:parent]]`;
  }

  if (
    text.includes("looking for overnight") ||
    text.includes("overnight stays") ||
    text === "overnight"
  ) {
    return `${named(
      "great choice! we can help you find a Pet Guru to get you the care you need right away — we're fast, accurate, and on it with you. overnight stays mean a trusted guru stays close through the night so your pup keeps their bedtime vibe. want to set up an account to book?",
    )} [[cta:parent]]`;
  }

  if (text.includes("looking for boarding") || text === "boarding") {
    return `${named(
      "great choice! we can help you find a Pet Guru to get you the care you need right away — quick matching, clear updates, and real support from me. boarding with sitguru gurus is home-style care — not a chaotic kennel vibe. want to register and meet a nearby boarding guru?",
    )} [[cta:parent]]`;
  }

  // --- Provider chips ---
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

  // --- Ambassador chips ---
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

  // Soft platform Q&A (only after chip parsing)
  if (/\bwhat is a guru\b|\bguru\b/.test(text) && !text.includes("register")) {
    return named(
      "a guru is an expert pet care provider on sitguru — verified local sitters, dog walkers, trainers, groomers, boarding providers, and neighborhood caregivers who lead with reliability, communication, and respect for each pet's routine.",
    );
  }

  // Name gate — ONLY when we still have no preferred name and no chip/greeting intent
  if (!preferred) {
    return SIMULATION_NAME_PROMPT;
  }

  // Named visitor, open-ended turn → active assistance (never re-ask name)
  return buildActiveAssistanceGreeting(preferred);
}
