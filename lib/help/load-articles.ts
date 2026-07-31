// lib/help/load-articles.ts
/**
 * Merge static HELP_ARTICLES with published DB help_center_articles rows.
 */

import { supabaseAdmin } from "@/utils/supabase/admin";
import {
  HELP_ARTICLES,
  type HelpArticle,
  type HelpAudience,
  type HelpCategory,
} from "@/lib/help/articles";

function mapDbArticle(row: Record<string, unknown>): HelpArticle | null {
  const slug = String(row.slug || "").trim();
  const title = String(row.title || "").trim();
  const summary = String(row.summary || "").trim();
  if (!slug || !title || !summary) return null;

  const category = String(row.category || "Pet Parent Support") as HelpCategory;
  const audience = String(row.audience || "all") as HelpAudience;

  return {
    slug,
    href: String(row.href || `/help/insights/${slug}`),
    title,
    summary,
    audience:
      audience === "parent" ||
      audience === "guru" ||
      audience === "ambassador" ||
      audience === "all"
        ? audience
        : "all",
    category: [
      "Pet Parent Support",
      "Guru Success & Training Hub",
      "Billing & Refunds",
      "Account & Profiles",
      "Booking & Cancellations",
      "Trust & Safety",
    ].includes(category)
      ? category
      : "Pet Parent Support",
    tags: Array.isArray(row.tags)
      ? row.tags.map((t) => String(t))
      : ["chat-insight"],
    keywords: Array.isArray(row.keywords)
      ? row.keywords.map((k) => String(k))
      : [],
  };
}

export async function loadMergedHelpArticles(): Promise<HelpArticle[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("help_center_articles")
      .select(
        "slug,href,title,summary,audience,category,tags,keywords,is_published",
      )
      .eq("is_published", true)
      .order("updated_at", { ascending: false })
      .limit(200);

    if (error || !data?.length) return [...HELP_ARTICLES];

    const dynamic = data
      .map((row) => mapDbArticle(row as Record<string, unknown>))
      .filter(Boolean) as HelpArticle[];

    const staticSlugs = new Set(HELP_ARTICLES.map((a) => a.slug));
    const extras = dynamic.filter((a) => !staticSlugs.has(a.slug));
    return [...HELP_ARTICLES, ...extras];
  } catch {
    return [...HELP_ARTICLES];
  }
}

export async function loadPublishedInsightArticle(slug: string) {
  const clean = String(slug || "").trim();
  if (!clean) return null;
  try {
    const { data } = await supabaseAdmin
      .from("help_center_articles")
      .select("*")
      .eq("slug", clean)
      .eq("is_published", true)
      .maybeSingle();
    return data as Record<string, unknown> | null;
  } catch {
    return null;
  }
}
