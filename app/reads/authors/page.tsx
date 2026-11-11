import type { Metadata } from "next";
import CategoryBrowseShell from "@/components/reads/CategoryBrowseShell";
import { READS_CATEGORY_CONFIG } from "@/lib/reads/category-config";
import { featuredFirst, filterBySegment } from "@/lib/reads/browse-filters";
import { readSearchParam } from "@/lib/reads/page-search";
import {
  fetchPublishedContent,
  fetchReadsTopics,
  fetchTeamPicks,
} from "@/lib/reads/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Authors & Experts | SitGuru Reads & Listen",
  description:
    "Authors, veterinarians, trainers, and pet experts with credentials and related works.",
  alternates: { canonical: "https://www.sitguru.com/reads/authors" },
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AuthorsPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const q = readSearchParam(params, "q");
  const audience = readSearchParam(params, "audience");
  const featuredOnly = readSearchParam(params, "featured") === "1";
  const segment = readSearchParam(params, "segment");

  const [authors, experts, topics, teamPicks] = await Promise.all([
    fetchPublishedContent({
      format: "author",
      q,
      audience,
      featured: featuredOnly || undefined,
      limit: 48,
    }),
    fetchPublishedContent({
      format: "expert",
      q,
      audience,
      featured: featuredOnly || undefined,
      limit: 48,
    }),
    fetchReadsTopics(),
    fetchTeamPicks(),
  ]);

  const seen = new Set<string>();
  const merged = [...authors, ...experts].filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
  const items = featuredFirst(filterBySegment(merged, segment));
  const featured = items.filter((item) => item.featured).slice(0, 8);
  const spotlight =
    items.find((item) => item.feature_type === "featured_author") ||
    featured[0] ||
    items[0] ||
    null;

  return (
    <CategoryBrowseShell
      config={READS_CATEGORY_CONFIG.authors}
      items={items}
      featured={featured.length ? featured : items.slice(0, 4)}
      topics={topics}
      teamPicks={teamPicks.slice(0, 3)}
      spotlight={spotlight}
      searchParams={{
        q,
        audience,
        featured: featuredOnly ? "1" : undefined,
        segment,
      }}
    />
  );
}
