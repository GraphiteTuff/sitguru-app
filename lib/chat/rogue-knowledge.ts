/**
 * Knowledge assembly for Rogue homepage / lead chat.
 * Combines marketing site context + Help Center catalog so live Claude
 * answers from SitGuru website truth — not improvisation.
 */

import { formatSitePageContextForPrompt } from "@/lib/ai/site-context";
import { HELP_ARTICLES } from "@/lib/help/articles";
import { buildHelpCatalogContext } from "@/lib/messaging/help-context";

export const ROGUE_CORE_SITE_CONTEXT = `
CORE CONTEXT: A Guru is an expert pet care provider on the SitGuru platform. This includes highly verified local sitters, dog walkers, pet trainers, groomers, boarding providers, and experienced neighborhood caregivers who lead with absolute reliability, communication, and deep respect for each pet's unique daily routine and personality.
Mission: Pet care should feel personal, local, and supported.
Care types: Drop-in Visits, Dog Walks, Overnight stays, Boarding, Doggy Day Care, Training Support.
PawPerks: earn on walks and redeem at checkout (~100 pts ≈ $1) — never invent a visitor's live balance.
PawReport Live: live GPS map, potty push alerts, and an email report when a walk ends.
Human help: pack@sitguru.com
`.trim();

/** Score help articles against the latest user message for focused injection. */
export function selectRelevantHelpSnippets(
  userText: string,
  limit = 6,
): string {
  const q = String(userText || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!q) return "";

  const tokens = q.split(" ").filter((t) => t.length > 2);
  const scored = HELP_ARTICLES.map((article) => {
    const hay = [
      article.title,
      article.summary,
      article.category,
      ...article.tags,
      ...article.keywords,
    ]
      .join(" ")
      .toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (hay.includes(token)) score += 2;
    }
    if (q.includes("pawreport") && hay.includes("pawreport")) score += 8;
    if (q.includes("pawperk") && hay.includes("pawperk")) score += 8;
    if (q.includes("ambassador") && hay.includes("ambassador")) score += 8;
    if (
      (q.includes("event") || q.includes("rsvp") || q.includes("community")) &&
      (hay.includes("community") || hay.includes("event"))
    ) {
      score += 6;
    }
    if (q.includes("refund") && hay.includes("refund")) score += 6;
    if (q.includes("cancel") && hay.includes("cancel")) score += 6;
    if ((q.includes("guru") || q.includes("sitter")) && hay.includes("guru")) {
      score += 4;
    }
    return { article, score };
  })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (scored.length === 0) return "";

  return [
    "# MOST RELEVANT HELP SNIPPETS FOR THIS TURN",
    ...scored.map(
      ({ article }) =>
        `- ${article.title} (${article.href}): ${article.summary}`,
    ),
  ].join("\n");
}

/**
 * Full Rogue knowledge block for Claude system prompts.
 * Prefer relevant snippets + compact catalog + site marketing context.
 */
export function buildRogueKnowledgeBlock(opts?: {
  lastUserText?: string;
  maxChars?: number;
}): string {
  const maxChars = opts?.maxChars ?? 18000;
  const relevant = selectRelevantHelpSnippets(opts?.lastUserText || "", 8);
  const site = formatSitePageContextForPrompt(7000);
  const help = buildHelpCatalogContext(9000);

  const digest = [
    "# ROGUE KNOWLEDGE — SCAN BEFORE ANSWERING",
    "Ground every factual answer in this SitGuru website + Help Center material.",
    "Never invent unpublished prices, insurance guarantees, or a visitor's live PawPerks balance.",
    "",
    ROGUE_CORE_SITE_CONTEXT,
    "",
    relevant || "(no keyword-matched help snippets for this turn — use full catalog below)",
    "",
    site,
    "",
    help,
  ].join("\n");

  if (digest.length <= maxChars) return digest;
  return `${digest.slice(0, maxChars - 40)}\n\n[…rogue knowledge truncated…]`;
}

/**
 * Lightweight knowledge-backed simulation line when Claude is unavailable.
 * Uses help summaries so fallback still feels informative, not identical every time.
 */
export function buildKnowledgeAwareSimulationBeat(userText: string): string {
  const relevant = selectRelevantHelpSnippets(userText, 2);
  if (!relevant) {
    return "i can help with finding a Pet Guru, bookings, PawReport Live tracking, PawPerks, becoming a provider, or ambassadors — what should we dig into?";
  }

  const lines = relevant
    .split("\n")
    .filter((line) => line.startsWith("- "))
    .map((line) => line.replace(/^- /, ""));
  const first = lines[0] || "";
  // Strip URL parenthetical for spoken tone
  const spoken = first.replace(/\s*\([^)]+\)\s*:/, ":");
  if (!spoken) {
    return "happy to help with that — SitGuru keeps care personal, local, and trackable. want the quick version or the step-by-step?";
  }
  return `here's the real SitGuru scoop: ${spoken} want me to walk you through the next step?`;
}
