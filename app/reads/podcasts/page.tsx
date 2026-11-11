import type { Metadata } from "next";
import CatalogPage from "@/components/reads/CatalogPage";
import { fetchPublishedContent } from "@/lib/reads/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Podcasts | SitGuru Reads & Listen",
  description: "SitGuru episodes and approved third-party shows.",
  alternates: { canonical: "https://www.sitguru.com/reads/podcasts" },
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const q = typeof params.q === "string" ? params.q : undefined;
  const audience = typeof params.audience === "string" ? params.audience : undefined;
  const items = await fetchPublishedContent({
    format: "podcast" as const,
    q,
    audience,
    limit: 48,
  });

  return (
    <CatalogPage
      title="Podcasts"
      description="SitGuru episodes and approved third-party shows."
      format={"podcast" as const}
      items={items}
      searchParams={{ q, audience }}
    />
  );
}
