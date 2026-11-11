/**
 * Future-ready authorized data access for SitGuru AI companions
 * (Scout / Rogue / etc.). V1 exposes query helpers only — no autonomous behavior.
 */

import {
  fetchPublishedContent,
  fetchTeamPicks,
  fetchReadsTopics,
  searchReads,
} from "./queries";
import type { ReadsContentType } from "./types";

export type ReadsAiQuery = {
  intent:
    | "books_by_topic"
    | "podcasts_by_topic"
    | "magazines_recommended"
    | "team_favorite"
    | "search";
  topic?: string;
  teamMemberSlug?: string;
  format?: ReadsContentType;
  q?: string;
  limit?: number;
};

/**
 * Authorized public Reads lookup for companion prompts.
 * Only returns published + public content.
 */
export async function queryReadsForCompanion(query: ReadsAiQuery) {
  const limit = Math.min(query.limit || 5, 10);

  switch (query.intent) {
    case "books_by_topic": {
      const { results } = await searchReads({
        format: "book",
        topic: query.topic,
        limit,
      });
      return {
        ok: true as const,
        items: results.map(summarizeForAi),
      };
    }
    case "podcasts_by_topic": {
      const { results } = await searchReads({
        format: "podcast",
        topic: query.topic,
        limit,
      });
      return {
        ok: true as const,
        items: results.map(summarizeForAi),
      };
    }
    case "magazines_recommended": {
      const rows = await fetchPublishedContent({
        format: "magazine",
        featured: true,
        limit,
      });
      return {
        ok: true as const,
        items: rows.map(summarizeForAi),
      };
    }
    case "team_favorite": {
      const picks = await fetchTeamPicks({
        memberSlug: query.teamMemberSlug,
        format: query.format,
      });
      return {
        ok: true as const,
        items: picks.slice(0, limit).map((pick) => ({
          pickId: pick.id,
          quote: pick.quote,
          member: pick.team_member?.full_name,
          role: pick.team_member?.role_label,
          content: pick.content ? summarizeForAi(pick.content) : null,
        })),
      };
    }
    case "search":
    default: {
      const { results } = await searchReads({
        q: query.q,
        format: query.format || "all",
        topic: query.topic,
        limit,
      });
      const topics = await fetchReadsTopics();
      return {
        ok: true as const,
        items: results.map(summarizeForAi),
        topics: topics.slice(0, 12).map((t) => ({
          slug: t.slug,
          name: t.name,
        })),
      };
    }
  }
}

function summarizeForAi(item: {
  id: string;
  slug: string;
  title: string;
  content_type: string;
  editorial_summary?: string | null;
  description?: string | null;
  disclosure_label?: string;
}) {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    contentType: item.content_type,
    summary: item.editorial_summary || item.description || "",
    disclosure: item.disclosure_label || "sitguru_recommended",
    href: `/reads/${item.content_type === "magazine" ? "magazines" : item.content_type === "author" || item.content_type === "expert" ? "authors" : `${item.content_type}s`}/${item.slug}`,
  };
}
