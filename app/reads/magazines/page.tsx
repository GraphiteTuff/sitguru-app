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
  title: "Magazines | SitGuru Reads & Listens",
  description:
    "Featured publications, dog and cat magazines, wellness titles, latest issues, and publisher links.",
  alternates: { canonical: "https://www.sitguru.com/reads/magazines" },
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const q = readSearchParam(params, "q");
  const audience = readSearchParam(params, "audience");
  const topic = readSearchParam(params, "topic");
  const featuredOnly = readSearchParam(params, "featured") === "1";
  const segment = readSearchParam(params, "segment");

  const [itemsRaw, topics, teamPicks] = await Promise.all([
    fetchPublishedContent({
      format: "magazine",
      q,
      audience,
      topic,
      featured: featuredOnly || undefined,
      limit: 48,
    }),
    fetchReadsTopics(),
    fetchTeamPicks({ format: "magazine" }),
  ]);

  const items = featuredFirst(filterBySegment(itemsRaw, segment));
  const featured = items.filter((item) => item.featured).slice(0, 8);
  const spotlight =
    items.find((item) => item.feature_type === "magazine_spotlight") ||
    featured[0] ||
    items[0] ||
    null;

  return (
    <CategoryBrowseShell
      config={READS_CATEGORY_CONFIG.magazines}
      items={items}
      featured={featured.length ? featured : items.slice(0, 4)}
      topics={topics.filter((t) =>
        ["dog-training-behavior", "cats-cat-behavior", "pet-health-first-aid", "enrichment-activities"].includes(
          t.slug,
        ),
      )}
      teamPicks={teamPicks}
      spotlight={spotlight}
      cardVariant="cover"
      searchParams={{
        q,
        audience,
        topic,
        featured: featuredOnly ? "1" : undefined,
        segment,
      }}
    />
  );
}
