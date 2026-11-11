import type { Metadata } from "next";
import CatalogPage from "@/components/reads/CatalogPage";
import { fetchPublishedContent } from "@/lib/reads/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Authors & Experts | SitGuru Reads & Listen",
  description: "Authors, veterinarians, trainers, and pet experts.",
  alternates: { canonical: "https://www.sitguru.com/reads/authors" },
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AuthorsPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const q = typeof params.q === "string" ? params.q : undefined;
  const audience =
    typeof params.audience === "string" ? params.audience : undefined;

  const [authors, experts] = await Promise.all([
    fetchPublishedContent({ format: "author", q, audience, limit: 48 }),
    fetchPublishedContent({ format: "expert", q, audience, limit: 48 }),
  ]);

  const seen = new Set<string>();
  const items = [...authors, ...experts].filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  return (
    <CatalogPage
      title="Authors & Experts"
      description="Authors, veterinarians, trainers, and pet experts."
      format="author"
      items={items}
      searchParams={{ q, audience }}
    />
  );
}
