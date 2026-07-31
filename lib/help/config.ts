// lib/help/config.ts
/**
 * Production Help Center / Knowledge Base configuration.
 * Keeps search UX and SEO settings in one place.
 */

import { HELP_ARTICLES, HELP_CATEGORIES } from "@/lib/help/articles";

/** Client search UX — keep dropdown fluid on mobile viewports */
export const HELP_SEARCH_CONFIG = {
  /** Max height of autocomplete results panel */
  resultsMaxHeightClass: "max-h-[min(60vh,22rem)]",
  /** Line clamp for result summaries */
  summaryLineClamp: 2,
  /** Show sticky “Showing N of M” footer in results */
  showResultCount: true,
  placeholderHero: "Search articles, tags, and topics…",
  placeholderHeader: "Search help…",
} as const;

/** Sitemap / SEO priorities for Help surfaces */
export const HELP_SEO_CONFIG = {
  indexPriority: 0.85,
  hubPriority: 0.8,
  articlePriority: 0.7,
  changeFrequency: "weekly" as const,
};

/** Hub routes that should appear in sitemap (category landing pages) */
export function helpHubPaths(): string[] {
  const hubs = new Set<string>(["/help"]);
  for (const category of HELP_CATEGORIES) {
    hubs.add(category.hubHref);
  }
  return Array.from(hubs);
}

/** All article paths for sitemap + link audits */
export function helpArticlePaths(): string[] {
  return HELP_ARTICLES.map((article) => article.href);
}

/** Full public path list for Help Center SEO */
export function allHelpPaths(): string[] {
  return [...helpHubPaths(), ...helpArticlePaths()];
}
