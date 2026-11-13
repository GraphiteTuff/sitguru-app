import type { Metadata } from "next";
import ContentCard from "@/components/reads/ContentCard";
import TrackPageView from "@/components/reads/TrackPageView";
import { searchReads } from "@/lib/reads/queries";
import type { ReadsContentType } from "@/lib/reads/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search | SitGuru Reads & Listens",
  description: "Search books, authors, podcasts, magazines, and topics.",
  alternates: { canonical: "https://www.sitguru.com/reads/search" },
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReadsSearchPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const q = typeof params.q === "string" ? params.q : "";
  const format =
    typeof params.format === "string"
      ? (params.format as ReadsContentType | "all")
      : "all";
  const topic = typeof params.topic === "string" ? params.topic : undefined;
  const featured = params.featured === "1";
  const newest = params.newest === "1";
  const teamPick = params.teamPick === "1";

  const { results, topics } = await searchReads({
    q: q || undefined,
    format,
    topic,
    featured: featured || undefined,
    newest: newest || undefined,
    teamPick: teamPick || undefined,
    limit: 48,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <TrackPageView
        eventName="search"
        metadata={{ q, format, topic, featured, newest, teamPick }}
      />
      <h1 className="text-4xl font-black tracking-tight text-[#0F2744]">
        Search Reads &amp; Listens
      </h1>
      <form className="mt-6 grid gap-3 rounded-[1.5rem] border border-slate-200/80 bg-white p-4 shadow-sm md:grid-cols-[1fr_auto_auto_auto]">
        <label className="sr-only" htmlFor="reads-search">
          Search books, authors, podcasts, magazines, topics
        </label>
        <input
          id="reads-search"
          name="q"
          defaultValue={q}
          placeholder="Search books, authors, podcasts, magazines, topics…"
          className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold"
        />
        <select
          name="format"
          defaultValue={format}
          className="rounded-full border border-slate-200 px-3 py-2.5 text-sm font-semibold"
          aria-label="Format"
        >
          <option value="all">All formats</option>
          <option value="book">Books</option>
          <option value="magazine">Magazines</option>
          <option value="podcast">Podcasts</option>
          <option value="video">Videos</option>
          <option value="author">Authors</option>
        </select>
        <select
          name="topic"
          defaultValue={topic || ""}
          className="rounded-full border border-slate-200 px-3 py-2.5 text-sm font-semibold"
          aria-label="Topic"
        >
          <option value="">All topics</option>
          {topics.map((t) => (
            <option key={t.id} value={t.slug}>
              {t.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-full bg-[#2563EB] px-4 py-2.5 text-sm font-black text-white"
        >
          Search
        </button>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input type="checkbox" name="featured" value="1" defaultChecked={featured} />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input type="checkbox" name="newest" value="1" defaultChecked={newest} />
          Newest
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input type="checkbox" name="teamPick" value="1" defaultChecked={teamPick} />
          Team Pick
        </label>
      </form>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {results.map((item) => (
          <ContentCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
