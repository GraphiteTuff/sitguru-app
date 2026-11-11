import type { Metadata } from "next";
import CatalogPage from "@/components/reads/CatalogPage";
import { fetchPublishedContent } from "@/lib/reads/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Videos | SitGuru Reads & Listen",
  description: "Curated YouTube learning — SitGuru as discovery layer.",
  alternates: { canonical: "https://www.sitguru.com/reads/videos" },
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const q = typeof params.q === "string" ? params.q : undefined;
  const audience = typeof params.audience === "string" ? params.audience : undefined;
  const items = await fetchPublishedContent({
    format: "video" as const,
    q,
    audience,
    limit: 48,
  });

  return (
    <CatalogPage
      title="Videos"
      description="Curated YouTube learning — SitGuru as discovery layer."
      format={"video" as const}
      items={items}
      searchParams={{ q, audience }}
    />
  );
}
