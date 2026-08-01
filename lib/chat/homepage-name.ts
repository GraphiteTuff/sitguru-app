/**
 * Preferred-name helpers for Rogue homepage chat.
 * Prevents "Hi Rogue" / reserved bot names from being treated as the visitor.
 */

const RESERVED_NAME_TOKENS = new Set([
  "rogue",
  "sitguru",
  "sit",
  "guru",
  "assistant",
  "ai",
  "bot",
  "chatgpt",
  "claude",
  "pack",
  "chief",
  "treat",
  "officer",
]);

export function sanitizePreferredName(raw: unknown): string {
  return String(raw || "")
    .replace(/[^a-zA-Z0-9\s'.\-]/g, "")
    .trim()
    .slice(0, 40);
}

export function isReservedPreferredName(raw: unknown): boolean {
  const clean = sanitizePreferredName(raw).toLowerCase();
  if (!clean) return true;
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return true;
  if (parts.every((p) => RESERVED_NAME_TOKENS.has(p))) return true;
  // Block "Rogue" alone or greeting-shaped "Hi Rogue"
  if (parts.includes("rogue") && parts.length <= 2) return true;
  return false;
}

export function normalizeChatIntent(raw: unknown): string {
  return String(raw || "")
    .toLowerCase()
    .replace(/[!.?,…]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** True for short social openers, including "hi rogue" / "hey rogue". */
export function isConversationalGreeting(raw: unknown): boolean {
  const text = normalizeChatIntent(raw);
  if (!text || text.length > 56) return false;
  return (
    /^(hi|hii+|hello|hey|heya|hiya|yo|sup|howdy|hola|morning|good morning|good afternoon|good evening|good night|gm|gn|whats up|what's up|what up|wassup|wazzup|how are you|how r you|how're you|how's it going|hows it going|how goes it|nice to meet you|pleased to meet you)(\s+(there|rogue|pack|friend|y'?all|buddy))?[!?.]*$/.test(
      text,
    ) ||
    /^(hi|hey|hello)\s+rogue\b/.test(text) ||
    /^rogue[!?.]*$/.test(text)
  );
}

/** Soft small-talk replies like "i'm good", "doing great", etc. */
export function isWellbeingReply(raw: unknown): boolean {
  const text = normalizeChatIntent(raw);
  if (!text || text.length > 64) return false;
  return /^(i'?m\s+)?(good|great|fine|okay|ok|awesome|amazing|well|doing\s+(good|great|fine|well|ok|okay)|pretty\s+good|not\s+bad|can'?t\s+complain|hanging\s+in|same|same here)(\s+(thanks|thank you|too))?[!?.]*$/.test(
    text,
  );
}

/**
 * Pull a real visitor name from free text.
 * Returns "" if the message is a greeting, reserved, or not a name.
 */
export function extractVisitorPreferredName(raw: unknown): string {
  const original = String(raw || "").trim();
  if (!original) return "";

  if (isConversationalGreeting(original) || isWellbeingReply(original)) {
    return "";
  }

  const lowered = original.toLowerCase();

  const patterns = [
    /(?:my name is|i am|i'm|call me|it'?s)\s+([a-zA-Z0-9'.\-]+(?:\s+[a-zA-Z0-9'.\-]+)?)/i,
    /(?:name'?s)\s+([a-zA-Z0-9'.\-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = original.match(pattern);
    if (match?.[1]) {
      const candidate = sanitizePreferredName(match[1]);
      if (candidate && !isReservedPreferredName(candidate)) return candidate;
    }
  }

  // Strip leading greeting words: "hi jason" → jason (but not "hi rogue")
  const stripped = sanitizePreferredName(
    original.replace(
      /^(hi|hey|hello|yo|sup|howdy)\s+/i,
      "",
    ),
  );
  if (
    stripped &&
    !isReservedPreferredName(stripped) &&
    stripped.split(/\s+/).length <= 3 &&
    stripped.length <= 40 &&
    !/looking for|want to|register|dog walk|drop-?in|overnight|boarding|ambassador/i.test(
      lowered,
    )
  ) {
    // Single-token or short name-like reply while onboarding
    if (/^[a-zA-Z0-9'.\-]+(?:\s+[a-zA-Z0-9'.\-]+){0,2}$/.test(stripped)) {
      return stripped;
    }
  }

  return "";
}

export function formatDisplayName(name: string): string {
  const clean = sanitizePreferredName(name);
  if (!clean) return "";
  return clean
    .split(/\s+/)
    .map((part) =>
      part
        ? part.charAt(0).toUpperCase() + part.slice(1)
        : part,
    )
    .join(" ");
}
