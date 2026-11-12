import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import CategoryBrowseShell from "@/components/reads/CategoryBrowseShell";
import YoutubeEmbed from "@/components/reads/YoutubeEmbed";
import { READS_CATEGORY_CONFIG } from "@/lib/reads/category-config";
import { featuredFirst, filterBySegment } from "@/lib/reads/browse-filters";
import { READS_PODCAST_HERO_IMAGE } from "@/lib/reads/constants";
import { readSearchParam } from "@/lib/reads/page-search";
import {
  fetchPublishedContent,
  fetchReadsTopics,
  fetchTeamPicks,
} from "@/lib/reads/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Podcasts | SitGuru Reads & Listen",
  description:
    "Featured episodes, embedded players, SitGuru originals, pet-care topics, and podcast partner spotlights.",
  alternates: { canonical: "https://www.sitguru.com/reads/podcasts" },
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const q = readSearchParam(params, "q");
  const audience = readSearchParam(params, "audience");
  const topic = readSearchParam(params, "topic");
  const featuredOnly = readSearchParam(params, "featured") === "1";
  const segment = readSearchParam(params, "segment");

  const [itemsRaw, topics, teamPicks] = await Promise.all([
    fetchPublishedContent({
      format: "podcast",
      q,
      audience,
      topic,
      featured: featuredOnly || undefined,
      limit: 48,
    }),
    fetchReadsTopics(),
    fetchTeamPicks({ format: "podcast" }),
  ]);

  const items = featuredFirst(filterBySegment(itemsRaw, segment));
  const featured = items.filter((item) => item.featured).slice(0, 8);
  const spotlight =
    items.find((item) => item.feature_type === "featured_podcast") ||
    featured[0] ||
    items[0] ||
    null;
  const originals = items.filter((item) => item.podcast?.is_sitguru_original);

  return (
    <CategoryBrowseShell
      config={READS_CATEGORY_CONFIG.podcasts}
      items={items}
      featured={featured.length ? featured : items.slice(0, 4)}
      topics={topics}
      teamPicks={teamPicks}
      spotlight={spotlight}
      cardVariant="episode"
      heroImage={READS_PODCAST_HERO_IMAGE}
      heroImageClassName="object-cover object-[center_35%] opacity-55"
      searchParams={{
        q,
        audience,
        topic,
        featured: featuredOnly ? "1" : undefined,
        segment,
      }}
      extras={
        <>
          {spotlight ? (
            <section className="mt-8 overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-white shadow-sm">
              <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="relative min-h-[240px] overflow-hidden bg-[#163127] lg:min-h-full">
                  <Image
                    src={READS_PODCAST_HERO_IMAGE}
                    alt=""
                    fill
                    className="object-cover object-[center_30%]"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D5C3A]/80 via-transparent to-transparent" />
                </div>
                <div
                  data-brand-green
                  className="public-dark-section bg-[#0D5C3A] px-6 py-8 !text-white sm:px-8"
                >
                  <p className="text-xs font-black uppercase tracking-[0.2em] !text-[#F6C39A]">
                    New episode
                  </p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight !text-white">
                    {spotlight.title}
                  </h2>
                  <p className="mt-3 text-sm font-semibold leading-6 !text-white/90">
                    {spotlight.editorial_summary || spotlight.description}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href={`/reads/podcasts/${spotlight.slug}`}
                      className="inline-flex items-center gap-2 rounded-full bg-[#B7F071] px-5 py-2.5 text-sm font-black !text-[#163127]"
                    >
                      <Play className="h-4 w-4" aria-hidden />
                      Start listening
                    </Link>
                    <Link
                      href="/reads/partner"
                      className="rounded-full border border-white/35 bg-white/10 px-5 py-2.5 text-sm font-black !text-white"
                    >
                      Podcast partner spotlight
                    </Link>
                  </div>
                  <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] !text-white/70">
                    {originals.length
                      ? `${originals.length} SitGuru original${originals.length === 1 ? "" : "s"}`
                      : "Local creators & approved shows"}
                  </p>
                </div>
                <div className="p-5 sm:p-6">
                  {spotlight.podcast?.youtube_video_id ? (
                    <YoutubeEmbed
                      videoId={spotlight.podcast.youtube_video_id}
                      title={spotlight.title}
                      contentId={spotlight.id}
                    />
                  ) : spotlight.podcast?.audio_embed_url ? (
                    <iframe
                      title={spotlight.title}
                      src={spotlight.podcast.audio_embed_url}
                      className="h-40 w-full rounded-2xl border border-emerald-100"
                      allow="autoplay"
                    />
                  ) : (
                    <div className="flex h-full min-h-40 flex-col justify-center rounded-2xl bg-[#F4F7FB] px-5 py-6">
                      <p className="text-sm font-black text-[#163127]">
                        {spotlight.podcast?.show_name || "SitGuru Podcasts"}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-600">
                        Open the episode page for the player and full show notes.
                      </p>
                      <Link
                        href={`/reads/podcasts/${spotlight.slug}`}
                        className="mt-4 inline-flex w-fit rounded-full bg-[#0D5C3A] px-4 py-2 text-sm font-black text-white"
                      >
                        Open episode
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </section>
          ) : null}
        </>
      }
    />
  );
}
