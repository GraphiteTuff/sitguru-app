import type { Metadata } from "next";
import PodcastsListenShell from "@/components/reads/PodcastsListenShell";
import { featuredFirst, filterBySegment } from "@/lib/reads/browse-filters";
import { readSearchParam } from "@/lib/reads/page-search";
import {
  fetchPublishedContent,
  fetchReadsTopics,
} from "@/lib/reads/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Podcasts | SitGuru Reads & Listens",
  description:
    "Featured episodes, embedded players, SitGuru originals, pet-care topics, and podcast partner spotlights.",
  alternates: { canonical: "https://www.sitguru.com/reads/podcasts" },
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

  const [itemsRaw, topics] = await Promise.all([
    fetchPublishedContent({
      format: "podcast",
      q,
      audience,
      topic,
      featured: featuredOnly || undefined,
      limit: 48,
    }),
    fetchReadsTopics(),
  ]);

  const items = featuredFirst(filterBySegment(itemsRaw, segment));
  const featured = items.filter((item) => item.featured).slice(0, 8);
  const spotlight =
    items.find((item) => item.feature_type === "featured_podcast") ||
    featured[0] ||
    items[0] ||
    null;

  return (
    <PodcastsListenShell
      items={items}
      featured={featured.length ? featured : items.slice(0, 4)}
      spotlight={spotlight}
      topics={topics}
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
