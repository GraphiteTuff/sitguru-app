/**
 * Deterministic parsing for explicit memory commands.
 * Prefer this over model interpretation for save / forget / list.
 */

import type { CompanionMemoryCategory } from "@/lib/companions/types";

export type MemoryIntent =
  | {
      type: "save";
      key: string;
      value: string;
      category: CompanionMemoryCategory;
      raw: string;
    }
  | {
      type: "update";
      key: string;
      value: string;
      category: CompanionMemoryCategory;
      raw: string;
    }
  | {
      type: "forget";
      /** null = forget all active memories */
      key: string | null;
      query: string;
      raw: string;
    }
  | {
      type: "list";
      raw: string;
    };

function clean(text: string) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

function slugKey(value: string) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "preference";
}

function inferCategory(value: string): CompanionMemoryCategory {
  const lower = value.toLowerCase();
  if (
    /\b(board|boarding|walk|walking|drop[- ]?in|overnight|sitting|day\s*care|training|care)\b/.test(
      lower,
    )
  ) {
    return "care";
  }
  if (
    /\b(mile|miles|km|zip|city|state|radius|distance|near|location|area|within)\b/.test(
      lower,
    )
  ) {
    return "location";
  }
  if (/\b(morning|evening|schedule|weekend|weekday|time)\b/.test(lower)) {
    return "schedule";
  }
  if (/\b(text|call|email|sms|notify|message)\b/.test(lower)) {
    return "communication";
  }
  return "preference";
}

function extractRememberedValue(text: string): string | null {
  const patterns = [
    /(?:remember(?:\s+that)?|please\s+remember(?:\s+that)?|save(?:\s+that)?|note(?:\s+that)?)\s+(.+)$/i,
    /(?:i\s+(?:would\s+)?(?:prefer|rather|like|want)|my\s+preference\s+is)\s+(.+)$/i,
    /(?:update(?:\s+that)?(?:\s+preference)?(?:\s+to)?)\s+(.+)$/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const value = clean(match[1]).replace(/[.?!]+$/, "");
      if (value.length >= 2) return value;
    }
  }
  return null;
}

function inferKey(value: string): string {
  const lower = value.toLowerCase();
  if (/\bboard/.test(lower)) return "preferred_care_type";
  if (/\bwalk/.test(lower)) return "preferred_care_type";
  if (/\bdrop/.test(lower)) return "preferred_care_type";
  if (/\bovernight|house\s*sit/.test(lower)) return "preferred_care_type";
  if (/\bmile|radius|within|distance/.test(lower)) return "search_radius";
  if (/\bzip|city|state|area|near/.test(lower)) return "preferred_location";
  if (/\bmorning|evening|schedule|time/.test(lower)) return "preferred_schedule";
  return slugKey(value).slice(0, 40) || "preference";
}

/**
 * Parse a user message for explicit memory intents.
 * Returns null when the message is a normal chat turn.
 */
export function parseMemoryIntent(rawText: string): MemoryIntent | null {
  const raw = clean(rawText);
  if (!raw) return null;
  const lower = raw.toLowerCase();

  if (
    /^(what do you remember|what can you remember|show (me )?my (memories|preferences)|list (my )?(memories|preferences))\b/.test(
      lower,
    ) ||
    /\bwhat do you remember about me\b/.test(lower)
  ) {
    return { type: "list", raw };
  }

  if (
    /\b(forget|delete|clear|remove)\b/.test(lower) &&
    /\b(memory|memories|preference|preferences|that|everything|all)\b/.test(
      lower,
    )
  ) {
    if (
      /\b(everything|all(\s+of)?(\s+my)?\s+(memories|preferences)|forget me)\b/.test(
        lower,
      )
    ) {
      return { type: "forget", key: null, query: raw, raw };
    }

    const forgetMatch = raw.match(
      /\b(?:forget|delete|clear|remove)\s+(?:that\s+)?(?:preference\s+)?(?:about\s+|for\s+)?(.+)$/i,
    );
    const query = clean(forgetMatch?.[1] || raw);
    return {
      type: "forget",
      key: inferKey(query),
      query,
      raw,
    };
  }

  const isUpdate = /\b(update|change|correct)\b/.test(lower);
  const isRemember =
    /\b(remember|save this|save that|note that|please remember)\b/.test(lower) ||
    /\bi (?:would )?(?:prefer|rather|like to)\b/.test(lower) ||
    /\bi would rather\b/.test(lower);

  if (!isRemember && !isUpdate) return null;

  const value = extractRememberedValue(raw);
  if (!value) return null;

  // Avoid treating "remember when we talked about…" as a memory write.
  if (/^when\b/i.test(value) || /\bwe (talked|spoke|chatted)\b/i.test(value)) {
    return null;
  }

  const key = inferKey(value);
  const category = inferCategory(value);
  if (isUpdate) {
    return { type: "update", key, value, category, raw };
  }
  return { type: "save", key, value, category, raw };
}

export function formatMemoriesForPrompt(
  memories: Array<{
    key: string;
    value: string;
    category: string;
    companion_id?: string | null;
    scope?: string;
  }>,
): string {
  if (!memories.length) {
    return "No explicit user-saved memories are active.";
  }
  return memories
    .map((memory, index) => {
      const scope =
        memory.scope === "companion" && memory.companion_id
          ? `companion:${memory.companion_id}`
          : "shared";
      return `${index + 1}. [${memory.category}/${scope}] ${memory.key}: ${memory.value}`;
    })
    .join("\n");
}

export function formatMemoriesForUserReply(
  memories: Array<{ key: string; value: string; category: string }>,
  companionName: string,
): string {
  if (!memories.length) {
    return `I don't have any saved preferences for you yet. Say something like "Remember that I prefer boarding" and I'll keep it for next time.`;
  }
  const lines = memories.map(
    (memory) => `• **${memory.key.replace(/_/g, " ")}**: ${memory.value}`,
  );
  return [
    `Here's what ${companionName} currently remembers (saved preferences only — not your full profile):`,
    ...lines,
    ``,
    `Say "Forget that preference" or open Account → Companion memories to correct or clear them.`,
  ].join("\n");
}
