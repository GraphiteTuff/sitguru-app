import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContentCard from "@/components/reads/ContentCard";
import TrackPageView from "@/components/reads/TrackPageView";
import { fetchTopicBySlug, searchReads } from "@/lib/reads/queries";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const topic = await fetchTopicBySlug(slug);
  if (!topic) return { title: "Topic not found" };
  return {
    title: `${topic.name} | SitGuru Reads`,
    description: topic.description || undefined,
    alternates: {
      canonical: `https://www.sitguru.com/reads/topics/${topic.slug}`,
    },
  };
}

export default async function TopicDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const topic = await fetchTopicBySlug(slug);
  if (!topic) notFound();

  const { results } = await searchReads({ topic: slug, limit: 48 });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <TrackPageView
        eventName="topic_filter"
        metadata={{ topic: slug }}
      />
      <h1 className="text-4xl font-black tracking-tight text-[#163127]">
        {topic.name}
      </h1>
      <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-600">
        {topic.description}
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {results.map((item) => (
          <ContentCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
