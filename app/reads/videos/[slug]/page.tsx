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
  const item = await fetchContentBySlug("video", slug);
  if (!item) return { title: "Video not found" };
  return {
    title: `${item.title} | SitGuru Reads`,
    description: item.editorial_summary || item.description || undefined,
    alternates: {
      canonical: `https://www.sitguru.com/reads/videos/${item.slug}`,
    },
  };
}

export default async function VideoDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const item = await fetchContentBySlug("video", slug);
  if (!item) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: item.title,
    description: item.editorial_summary || item.description,
    embedUrl: item.video?.youtube_video_id
      ? `https://www.youtube.com/embed/${item.video.youtube_video_id}`
      : undefined,
    thumbnailUrl: item.thumbnail_url || undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DetailShell
        item={item}
        backHref="/reads/videos"
        backLabel="All videos"
        eventName="video_play"
      />
    </>
  );
}
