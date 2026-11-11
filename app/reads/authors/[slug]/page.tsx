import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DetailShell from "@/components/reads/DetailShell";
import { fetchContentBySlug } from "@/lib/reads/queries";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item =
    (await fetchContentBySlug("author", slug)) ||
    (await fetchContentBySlug("expert", slug));
  if (!item) return { title: "Author not found" };
  return {
    title: `${item.title} | SitGuru Reads`,
    description: item.person?.biography || item.description || undefined,
    alternates: {
      canonical: `https://www.sitguru.com/reads/authors/${item.slug}`,
    },
  };
}

export default async function AuthorDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const item =
    (await fetchContentBySlug("author", slug)) ||
    (await fetchContentBySlug("expert", slug));
  if (!item) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: item.title,
    description: item.person?.biography || item.description,
    jobTitle: item.person?.credentials || undefined,
    worksFor: item.person?.organization
      ? { "@type": "Organization", name: item.person.organization }
      : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DetailShell
        item={item}
        backHref="/reads/authors"
        backLabel="All authors"
        eventName="author_view"
      />
    </>
  );
}
