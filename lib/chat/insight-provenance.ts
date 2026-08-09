/**
 * Companion + page provenance helpers for Chat Insights ledger.
 */

export type InsightCompanionKey = "rogue" | "taco" | "scout" | "admin" | "unknown";

export type CompanionHitMap = Record<string, number>;
export type PageHitMap = Record<string, number>;

export const INSIGHT_COMPANION_META: Record<
  InsightCompanionKey,
  {
    label: string;
    title: string;
    avatarSrc: string | null;
    objectPosition?: string;
  }
> = {
  rogue: {
    label: "Rogue",
    title: "Chief Treat Officer",
    avatarSrc: "/images/rogue-avatar.png",
    objectPosition: "50% 28%",
  },
  taco: {
    label: "Taco",
    title: "Ambassador Advocate",
    avatarSrc: "/images/taco-avatar.png",
    objectPosition: "50% 28%",
  },
  scout: {
    label: "Scout",
    title: "Guru Matching Officer",
    avatarSrc: "/images/scout-avatar.png",
    objectPosition: "50% 28%",
  },
  admin: {
    label: "Admin",
    title: "Human support",
    avatarSrc: "/images/sitguru-message-avatar.jpg",
  },
  unknown: {
    label: "Unknown",
    title: "Source not tagged yet",
    avatarSrc: null,
  },
};

export function normalizeCompanionKey(
  value: unknown,
): InsightCompanionKey {
  const key = String(value || "")
    .trim()
    .toLowerCase();
  if (key === "rogue" || key === "taco" || key === "scout" || key === "admin") {
    return key;
  }
  return "unknown";
}

export function normalizePagePath(value: unknown): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      const url = new URL(raw);
      return `${url.pathname}${url.search}`.slice(0, 300) || "/";
    }
  } catch {
    /* keep raw */
  }
  return raw.startsWith("/") ? raw.slice(0, 300) : `/${raw}`.slice(0, 300);
}

export function defaultCompanionForChannel(channel: string): InsightCompanionKey {
  if (channel === "ADMIN_SUPPORT") return "admin";
  if (channel === "ACTIVE_WALK") return "rogue";
  return "rogue";
}

export function defaultPageForChannel(channel: string): string {
  if (channel === "ADMIN_SUPPORT") return "/admin/messages";
  if (channel === "ACTIVE_WALK") return "/pawreport";
  return "/";
}

export function parseHitMap(value: unknown): CompanionHitMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: CompanionHitMap = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const count = Number(raw);
    if (!key || !Number.isFinite(count) || count <= 0) continue;
    out[key] = Math.round(count);
  }
  return out;
}

export function rankedHits(map: CompanionHitMap): Array<{ key: string; count: number }> {
  return Object.entries(map)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

export function primaryCompanionKey(params: {
  channel: string;
  lastCompanion?: string | null;
  companionHits?: CompanionHitMap | null;
}): InsightCompanionKey {
  const ranked = rankedHits(params.companionHits || {});
  if (ranked[0]) return normalizeCompanionKey(ranked[0].key);
  if (params.lastCompanion) return normalizeCompanionKey(params.lastCompanion);
  return defaultCompanionForChannel(params.channel);
}

export function primaryPagePath(params: {
  channel: string;
  lastPage?: string | null;
  pageHits?: PageHitMap | null;
}): string {
  const ranked = rankedHits(params.pageHits || {});
  if (ranked[0]?.key) return ranked[0].key;
  if (params.lastPage) return normalizePagePath(params.lastPage);
  return defaultPageForChannel(params.channel);
}

export function pageLabel(path: string): string {
  const clean = normalizePagePath(path) || "/";
  if (clean === "/") return "Homepage (/)";
  if (clean.startsWith("/become-a-guru")) return `Become a Guru (${clean})`;
  if (clean.startsWith("/ambassadors") || clean.startsWith("/programs/ambassadors")) {
    return `Ambassadors (${clean})`;
  }
  if (clean.startsWith("/admin/messages")) return "Admin messages";
  if (clean.startsWith("/admin/insights")) return "Admin insights";
  if (clean.startsWith("/pawreport") || clean.startsWith("/guru-live")) {
    return `Live care (${clean})`;
  }
  if (clean.startsWith("/contact")) return `Contact (${clean})`;
  if (clean.startsWith("/partners")) return `Partners (${clean})`;
  if (clean.startsWith("/help")) return `Help Center (${clean})`;
  return clean;
}

export function bumpHitMap(
  current: CompanionHitMap,
  key: string,
  amount = 1,
): CompanionHitMap {
  const next = { ...current };
  next[key] = (next[key] || 0) + amount;
  return next;
}
