/**
 * Randomized Rogue opening greetings — GSP energy, short & punchy.
 * Picked once per visit/session so the vibe stays fresh without flickering.
 */

export const ROGUE_OPENING_GREETINGS = [
  "Hey! *sniffs screen* I'm **Rogue**! Let's talk SitGuru!\n\nWhat should I call you?",
  "Ooh, a butterfly! Wait—**hi**! Rogue here, your resident GSP guru. What's up?\n\nAnd what do you like to be called?",
  "ZOOMIES activated 🦴 I'm **Rogue**, SitGuru's official mascot!\n\nQuick—what's your name (or nickname)?",
  "Point. Lock. Love. I'm **Rogue**!\n\nHow are you, and what should I call you?",
  "Wait—did you see that bird? Anyway, **hi**! I'm Rogue 🐾\n\nWhat do you go by?",
  "Tail-wagging hello! I'm **Rogue**, your high-energy SitGuru sidekick.\n\nWhat should I call you?",
] as const;

export const ROGUE_RETURNING_GREETINGS = [
  "Hey {name}! *sniffs happily* Rogue's back—ready to zoom into SitGuru with you. What's the move?",
  "Ooh {name}! Almost chased a squirrel—then I remembered you 🦴 What can I help with?",
  "{name}! Pointing right at you—let's find great SitGuru care or pack paths. What's up?",
] as const;

const SESSION_GREETING_KEY = "sitguru_rogue_opening_greeting_idx";

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

/** Stable per-tab opening greeting so remounts don't flicker mid-visit. */
export function pickRogueOpeningGreeting(forceNew = false): string {
  const list = ROGUE_OPENING_GREETINGS;
  try {
    if (!forceNew) {
      const saved = sessionStorage.getItem(SESSION_GREETING_KEY);
      const idx = Number(saved);
      if (Number.isFinite(idx) && idx >= 0 && idx < list.length) {
        return list[idx]!;
      }
    }
    const idx = randomIndex(list.length);
    sessionStorage.setItem(SESSION_GREETING_KEY, String(idx));
    return list[idx]!;
  } catch {
    return list[randomIndex(list.length)]!;
  }
}

export function pickRogueReturningGreeting(name: string): string {
  const clean = String(name || "").trim() || "friend";
  const template =
    ROGUE_RETURNING_GREETINGS[randomIndex(ROGUE_RETURNING_GREETINGS.length)]!;
  return template.replace(/\{name\}/g, clean);
}

export function isRogueOpeningGreeting(text: string): boolean {
  const value = String(text || "").trim();
  return ROGUE_OPENING_GREETINGS.some((g) => g === value);
}

/** Clear so the next fresh chat gets a new vibe. */
export function clearRogueOpeningGreetingSession() {
  try {
    sessionStorage.removeItem(SESSION_GREETING_KEY);
  } catch {
    // ignore
  }
}
