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
  return `hey ${name}! rogue here 🦴 so stoked you're here — drop-ins, dog walks, overnight, boarding, guru signup, ambassadors… tap a chip or tell me what's next.`;
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
    .replace(/\s+/g, " ")
    .trim();
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
      "let's goooo! 🐕 dog walks with our local gurus include real-time live map tracking, potty alerts, and automated updates sent straight to your phone. want to set up an account to meet a nearby handler?";
    const lead = preferred ? `hey ${preferred}! ` : "";
    return `${lead}${dogWalkCopy} [[cta:parent]]`;
  }

  if (
    text.includes("looking for drop-in") ||
    text.includes("drop-in visits") ||
    text.includes("drop in visits")
  ) {
    return `${named(
      "drop-in visits keep routines tight — short in-home check-ins with feeding, potty, play, and photo updates from a local guru. ready to meet someone nearby?",
    )} [[cta:parent]]`;
  }

  if (
    text.includes("looking for overnight") ||
    text.includes("overnight stays") ||
    text === "overnight"
  ) {
    return `${named(
      "overnight stays mean a trusted guru stays close through the night so your pup keeps their bedtime vibe. want me to help you set up an account to book?",
    )} [[cta:parent]]`;
  }

  if (text.includes("looking for boarding") || text === "boarding") {
    return `${named(
      "boarding with sitguru gurus is home-style care with clear updates — not a chaotic kennel vibe. want to register and meet a nearby boarding guru?",
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

  // Name gate — ONLY when we still have no preferred name and no chip intent
  if (!preferred) {
    return SIMULATION_NAME_PROMPT;
  }

  // Named visitor, open-ended turn → active assistance (never re-ask name)
  return buildActiveAssistanceGreeting(preferred);
}
