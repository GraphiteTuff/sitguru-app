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
  const item = await fetchContentBySlug("magazine", slug);
  if (!item) return { title: "Magazine not found" };
  return {
    title: `${item.title} | SitGuru Reads`,
    description: item.editorial_summary || item.description || undefined,
    alternates: {
      canonical: `https://www.sitguru.com/reads/magazines/${item.slug}`,
    },
  };
}

export default async function MagazineDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const item = await fetchContentBySlug("magazine", slug);
  if (!item) notFound();

  return (
    <DetailShell
      item={item}
      backHref="/reads/magazines"
      backLabel="All magazines"
      eventName="magazine_view"
    />
  );
}
