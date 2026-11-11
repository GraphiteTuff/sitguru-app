import type { Metadata } from "next";
import RecommendationBrowseShell from "@/components/reads/RecommendationBrowseShell";
import { READS_CATEGORY_CONFIG } from "@/lib/reads/category-config";
import { readSearchParam } from "@/lib/reads/page-search";
import { fetchCommunityRecommendations } from "@/lib/reads/queries";
import type { ReadsContentType } from "@/lib/reads/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Guru Picks | SitGuru Reads & Listen",
  description:
    "Recommendations from registered Gurus. Each submission shows who shared it and requires SitGuru review before publication.",
  alternates: { canonical: "https://www.sitguru.com/reads/guru-picks" },
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function contentHref(type?: string, slug?: string) {
  if (!type || !slug) return "/reads";
  const map: Record<string, string> = {
    book: "books",
    magazine: "magazines",
    podcast: "podcasts",
    video: "videos",
    author: "authors",
  };
  return `/reads/${map[type] || "books"}/${slug}`;
}

export default async function GuruPicksPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const q = readSearchParam(params, "q");
  const format = readSearchParam(params, "format") as ReadsContentType | undefined;

  const rows = await fetchCommunityRecommendations({
    source: "guru",
    format,
    q,
  });

  const communityPicks = rows.map((row) => ({
    id: row.id,
    quote: row.quote,
    submitterDisplayName: row.submitter_display_name,
    submitterRoleLabel: row.submitter_role_label,
    contentTitle: row.content?.title || "Recommendation",
    contentHref: contentHref(row.content?.content_type, row.content?.slug),
    contentType: row.content?.content_type || "content",
    status: row.status,
  }));

  return (
    <RecommendationBrowseShell
      config={READS_CATEGORY_CONFIG["guru-picks"]}
      source="guru"
      communityPicks={communityPicks}
      searchParams={{ q, format }}
    />
  );
}
