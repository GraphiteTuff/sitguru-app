import type { Metadata } from "next";
import Link from "next/link";
import TrackPageView from "@/components/reads/TrackPageView";
import { fetchReadsTopics } from "@/lib/reads/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Topics | SitGuru Reads & Listens",
  description: "Explore SitGuru Reads & Listens by educational topic.",
  alternates: { canonical: "https://www.sitguru.com/reads/topics" },
};

export default async function TopicsPage() {
  const topics = await fetchReadsTopics();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <TrackPageView eventName="topic_filter" metadata={{ surface: "index" }} />
      <h1 className="text-4xl font-black tracking-tight text-[#0F2744]">
        Explore by Topic
      </h1>
      <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-600">
        Educational themes for Pet Parents, Gurus, and pet professionals.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic) => (
          <Link
            key={topic.id}
            href={`/reads/topics/${topic.slug}`}
            className="rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <h2 className="text-xl font-black text-[#2563EB]">{topic.name}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {topic.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
