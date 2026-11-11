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
  const item = await fetchContentBySlug("podcast", slug);
  if (!item) return { title: "Podcast not found" };
  return {
    title: `${item.title} | SitGuru Reads`,
    description: item.editorial_summary || item.description || undefined,
    alternates: {
      canonical: `https://www.sitguru.com/reads/podcasts/${item.slug}`,
    },
  };
}

export default async function PodcastDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const item = await fetchContentBySlug("podcast", slug);
  if (!item) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    name: item.title,
    description: item.editorial_summary || item.description,
    duration: item.podcast?.duration_seconds
      ? `PT${Math.round(item.podcast.duration_seconds / 60)}M`
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
        backHref="/reads/podcasts"
        backLabel="All podcasts"
        eventName="podcast_view"
      >
        {item.podcast?.audio_embed_url ? (
          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white p-3">
            <iframe
              title={`${item.title} audio player`}
              src={item.podcast.audio_embed_url}
              className="h-[180px] w-full"
              loading="lazy"
              allow="autoplay * ; encrypted-media *; fullscreen *; clipboard-write"
            />
          </div>
        ) : null}
      </DetailShell>
    </>
  );
}
