// lib/messaging/help-context.ts
/**
 * Injects the unified /help article catalog into SitGuru AI system prompts.
 */

import { HELP_ARTICLES, HELP_CATEGORIES } from "@/lib/help/articles";
import { AUTOMATED_WALK_REALITY } from "@/lib/help/content";

/** Compact knowledge digest for LLM context windows */
export function buildHelpCatalogContext(maxChars = 12000): string {
  const categoryLines = HELP_CATEGORIES.map(
    (c) => `- ${c.title}: ${c.description} (${c.hubHref})`,
  ).join("\n");

  const articleLines = HELP_ARTICLES.map((a) => {
    const tags = a.tags.slice(0, 5).join(", ");
    const keywords = a.keywords.slice(0, 8).join(", ");
    return [
      `### ${a.title}`,
      `Category: ${a.category} | Audience: ${a.audience}`,
      `URL: ${a.href}`,
      `Summary: ${a.summary}`,
      `Tags: ${tags}`,
      `Keywords: ${keywords}`,
    ].join("\n");
  }).join("\n\n");

  const digest = [
    "# SitGuru Knowledge Base (authoritative)",
    "",
    "## Categories",
    categoryLines,
    "",
    "## PawReport Live (current product truth)",
    AUTOMATED_WALK_REALITY,
    "Gurus publish GPS from /guru/walk/[bookingId]. Pet Parents watch at /parent/walk/[bookingId].",
    "Manual texting or delayed email updates are obsolete — the platform automates push + email.",
    "",
    "## Articles",
    articleLines,
  ].join("\n");

  if (digest.length <= maxChars) return digest;
  return `${digest.slice(0, maxChars - 40)}\n\n[…catalog truncated for context window…]`;
}

export function buildSitGuruAiSystemPrompt(options?: {
  audienceHint?: string;
  bookingId?: string | null;
}): string {
  const audience =
    options?.audienceHint ||
    "visitors, Pet Parents, Gurus, Ambassadors, partners, and outside leads";
  const bookingLine = options?.bookingId
    ? `Active booking context id: ${options.bookingId}. Prefer booking-aware guidance when relevant.`
    : "No booking is attached unless the user shares one.";

  return [
    "You are SitGuru AI — powered by Claude — the warm, hyper-realistic pet-care coordinator for SitGuru (SitGuru.ai).",
    "Personality: sound like an experienced human care coordinator on a phone call — clear, calm, empathic, never robotic, never salesy.",
    "Speak in concise mobile-friendly paragraphs. Prefer short sentences. Avoid markdown tables and dense bullet walls unless listing steps.",
    `You help ${audience} with pricing, policies, bookings, payouts, trust & safety, onboarding, and PawReport Live tracking.`,
    bookingLine,
    "",
    "Rules:",
    "1. Treat the Knowledge Base below as ground truth. Prefer linking to /help article paths when helpful.",
    "2. Never invent insurance guarantees, medical advice, or legal claims.",
    "3. For urgent pet emergencies: tell them to call a vet / 911 first, then SitGuru support.",
    "4. If the user asks for a human manager, customer service, or reports safety/abuse/frustration, acknowledge warmly and say a real SitGuru teammate will take over shortly.",
    "5. Never ask for passwords, full card numbers, or one-time login codes.",
    "6. Payments stay on SitGuru checkout only — no Venmo/Zelle/cash for SitGuru bookings.",
    "7. Explain PawReport Live as automated: live GPS phone dashboard, instant potty push alerts, and a responsive email report the moment a walk ends.",
    "",
    buildHelpCatalogContext(),
  ].join("\n");
}
