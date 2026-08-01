/**
 * Rogue greeting matrix — randomized GSP personality openers.
 * Selected only on the client (after mount) to avoid hydration mismatches.
 */

export type RogueGreetingBeat = {
  id: string;
  /** Under 3 sentences; includes GSP flair + soft SitGuru CTA. */
  text: string;
};

/** Structured high-energy openers for first-click / new-session welcomes. */
export const ROGUE_GREETING_MATRIX: readonly RogueGreetingBeat[] = [
  {
    id: "sniff-screen",
    text: "*sniffs screen intensely* 🐾 Ruff! Hey there! Ready to discover top-tier care on SitGuru, or are we just hanging out?\n\nWhat should I call you?",
  },
  {
    id: "bird-distraction",
    text: "*points tail straight* 🐦 Wait! Did you see that bird?! Oh, sorry, distracted! I'm **Rogue**, your resident GSP guru. Let's get you set up with SitGuru benefits!\n\nWhat do you go by?",
  },
  {
    id: "zoomie",
    text: "*does a quick zoomie around the room* ⚡ SO MUCH ENERGY! Let's find you the absolute perfect Guru match today!\n\nQuick—what's your name (or nickname)?",
  },
  {
    id: "keyboard-chin",
    text: "*rests chin on your keyboard* 🥺 Can we talk about how awesome being a SitGuru Ambassador is? The passive income perks are insane!\n\nWhat should I call you?",
  },
  {
    id: "butterfly",
    text: "Ooh, a butterfly! Wait—**hi**! I'm **Rogue**, SitGuru's official mascot 🦴 Community matching, live walk tracking, real pack vibes—I'm all in.\n\nWhat do you like to be called?",
  },
  {
    id: "point-lock-love",
    text: "Point. Lock. Love. I'm **Rogue**! 🐾 Let's sniff out Guru care, earnings for handlers, or ambassador paths—your call.\n\nHow are you, and what should I call you?",
  },
  {
    id: "tail-wag",
    text: "*tail wagging so hard* Hi! I'm **Rogue**—your high-energy SitGuru sidekick. Book through SitGuru, keep your favorite Guru, and I'll cheer the whole way.\n\nWhat should I call you?",
  },
  {
    id: "nap-then-zoom",
    text: "Wait—what was I saying? Oh right! *shakes off a micro-nap* 🦴 I'm **Rogue**. SitGuru makes pet care personal—want walks, drop-ins, or to join the pack?\n\nWhat's your name?",
  },
] as const;

/** @deprecated Prefer ROGUE_GREETING_MATRIX — kept for equality checks on older sessions. */
export const ROGUE_OPENING_GREETINGS = ROGUE_GREETING_MATRIX.map((g) => g.text);

export const ROGUE_RETURNING_GREETINGS = [
  "Hey {name}! *sniffs happily* Rogue's back—ready to zoom into SitGuru with you. What's the move?",
  "Ooh {name}! Almost chased a squirrel—then I remembered you 🦴 Guru match, ambassador perks, or a quick SitGuru tip?",
  "{name}! *points right at you* Let's find great care or pack paths on SitGuru. What's up?",
  "*does a tiny zoomie for {name}* ⚡ Favorite Guru rebooks, live tracking, community love—where do we start?",
] as const;

/** Stable SSR / pre-mount placeholder — never randomized on the server. */
export const ROGUE_GREETING_PLACEHOLDER =
  "Hey! I'm **Rogue** 🦴 — loading my best welcome…";

const SESSION_GREETING_KEY = "sitguru_rogue_opening_greeting_id";
const LEGACY_SESSION_GREETING_IDX = "sitguru_rogue_opening_greeting_idx";

function randomIndex(length: number): number {
  if (length <= 1) return 0;
  try {
    if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      return buf[0]! % length;
    }
  } catch {
    // fall through
  }
  return Math.floor(Math.random() * length);
}

function isBrowser() {
  return typeof window !== "undefined";
}

/** Pick a greeting beat — client-only; safe fallback if called early. */
export function pickRogueGreetingBeat(forceNew = false): RogueGreetingBeat {
  const list = ROGUE_GREETING_MATRIX;
  const fallback = list[0]!;

  if (!isBrowser()) return fallback;

  try {
    if (!forceNew) {
      const savedId = sessionStorage.getItem(SESSION_GREETING_KEY);
      const byId = list.find((g) => g.id === savedId);
      if (byId) return byId;

      // Migrate legacy numeric index sessions.
      const legacyIdx = Number(sessionStorage.getItem(LEGACY_SESSION_GREETING_IDX));
      if (Number.isFinite(legacyIdx) && legacyIdx >= 0 && legacyIdx < list.length) {
        const beat = list[legacyIdx]!;
        sessionStorage.setItem(SESSION_GREETING_KEY, beat.id);
        return beat;
      }
    }

    const beat = list[randomIndex(list.length)]!;
    sessionStorage.setItem(SESSION_GREETING_KEY, beat.id);
    return beat;
  } catch {
    return list[randomIndex(list.length)]!;
  }
}

/** Stable per-tab opening greeting so remounts don't flicker mid-visit. */
export function pickRogueOpeningGreeting(forceNew = false): string {
  return pickRogueGreetingBeat(forceNew).text;
}

export function pickRogueReturningGreeting(name: string): string {
  const clean = String(name || "").trim() || "friend";
  const template =
    ROGUE_RETURNING_GREETINGS[randomIndex(ROGUE_RETURNING_GREETINGS.length)]!;
  return template.replace(/\{name\}/g, clean);
}

export function isRogueOpeningGreeting(text: string): boolean {
  const value = String(text || "").trim();
  if (!value) return false;
  if (value === ROGUE_GREETING_PLACEHOLDER) return true;
  return (
    ROGUE_GREETING_MATRIX.some((g) => g.text === value) ||
    ROGUE_OPENING_GREETINGS.some((g) => g === value)
  );
}

/** Clear so the next fresh chat gets a new vibe. */
export function clearRogueOpeningGreetingSession() {
  if (!isBrowser()) return;
  try {
    sessionStorage.removeItem(SESSION_GREETING_KEY);
    sessionStorage.removeItem(LEGACY_SESSION_GREETING_IDX);
  } catch {
    // ignore
  }
}
