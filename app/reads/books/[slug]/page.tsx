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
  const item = await fetchContentBySlug("book", slug);
  if (!item) return { title: "Book not found" };
  return {
    title: `${item.title} | SitGuru Reads`,
    description: item.editorial_summary || item.description || undefined,
    alternates: {
      canonical: `https://www.sitguru.com/reads/books/${item.slug}`,
    },
    openGraph: {
      title: item.title,
      description: item.editorial_summary || item.description || undefined,
      type: "book",
    },
  };
}

export default async function BookDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const item = await fetchContentBySlug("book", slug);
  if (!item) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: item.title,
    description: item.editorial_summary || item.description,
    author: item.book?.author_name
      ? { "@type": "Person", name: item.book.author_name }
      : undefined,
    isbn: item.book?.isbn || undefined,
    publisher: item.book?.publisher
      ? { "@type": "Organization", name: item.book.publisher }
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
        backHref="/reads/books"
        backLabel="All books"
        eventName="book_view"
      />
    </>
  );
}
