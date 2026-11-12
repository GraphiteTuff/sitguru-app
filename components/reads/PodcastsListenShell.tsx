import Image from "next/image";
import Link from "next/link";
import { Play, RotateCcw, RotateCw, Volume2 } from "lucide-react";
import CategoryIconNav from "@/components/reads/CategoryIconNav";
import ContentCard from "@/components/reads/ContentCard";
import PrimaryFormatPills from "@/components/reads/PrimaryFormatPills";
import ReadsNewsletterCta from "@/components/reads/ReadsNewsletterCta";
import TrackPageView from "@/components/reads/TrackPageView";
import YoutubeEmbed from "@/components/reads/YoutubeEmbed";
import { READS_CATEGORY_CONFIG } from "@/lib/reads/category-config";
import { READS_PODCAST_HERO_IMAGE } from "@/lib/reads/constants";
import type { ReadsContentDetail, ReadsTopic } from "@/lib/reads/types";

const LISTEN_ON = [
  { label: "Spotify", href: "/reads/partner" },
  { label: "Apple Podcasts", href: "/reads/partner" },
  { label: "SoundCloud", href: "/reads/partner" },
] as const;

function formatDuration(seconds?: number | null) {
  if (!seconds || seconds <= 0) return null;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function cover(item: ReadsContentDetail) {
  return (
    item.image_url ||
    item.thumbnail_url ||
    item.podcast?.episode_artwork_url ||
    READS_PODCAST_HERO_IMAGE
  );
}

export default function PodcastsListenShell({
  items,
  featured,
  spotlight,
  topics,
  searchParams,
}: {
  items: ReadsContentDetail[];
  featured: ReadsContentDetail[];
  spotlight: ReadsContentDetail | null;
  topics: ReadsTopic[];
  searchParams?: Record<string, string | undefined>;
}) {
  const config = READS_CATEGORY_CONFIG.podcasts;
  const q = searchParams?.q || "";
  const episodeHref = spotlight
    ? `/reads/podcasts/${spotlight.slug}`
    : "/reads/partner";
  const duration =
    formatDuration(spotlight?.podcast?.duration_seconds) || "24:16";
  const showName =
    spotlight?.podcast?.show_name || "Hosted by SitGuru";
  const episodeLabel = spotlight
    ? `${spotlight.podcast?.guest_name || "Featured episode"} · ${duration}`
    : "Episode · Dog & Cat Care";

  return (
    <div>
      <PrimaryFormatPills />
      <CategoryIconNav />

      <TrackPageView
        eventName="page_view"
        contentType="podcast"
        metadata={{ surface: "podcasts_listen_mockup" }}
      />

      <section
        data-brand-green
        className="public-dark-section relative overflow-hidden bg-[#0D5C3A] !text-white"
      >
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8 lg:py-14">
          <div className="relative z-10">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/80">
              Pet Podcasts
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight !text-white sm:text-5xl lg:text-6xl">
              New Episode
            </h1>
            <p className="mt-4 max-w-md text-base font-semibold leading-7 !text-white/90">
              Pet podcasts for Pet Parents and Gurus
              {spotlight?.title ? ` — ${spotlight.title}` : "."}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link
                href={episodeHref}
                className="inline-flex items-center gap-2 rounded-full bg-[#B7F071] px-6 py-3 text-sm font-black !text-[#163127] shadow-sm transition hover:bg-[#a6e05f]"
              >
                <Play className="h-4 w-4 fill-current" aria-hidden />
                Start Listening
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] !text-white/75">
              <span>Listen on:</span>
              {LISTEN_ON.map((platform) => (
                <Link
                  key={platform.label}
                  href={platform.href}
                  className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 !text-white transition hover:bg-white/20"
                >
                  {platform.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="relative mx-auto aspect-[4/3] w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/15 shadow-[0_30px_80px_rgba(0,0,0,0.35)] lg:max-w-none">
            <Image
              src={READS_PODCAST_HERO_IMAGE}
              alt=""
              fill
              priority
              className="object-cover object-[center_28%]"
              sizes="(max-width: 1024px) 90vw, 520px"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#0D5C3A]/25" />
          </div>
        </div>

        {/* Floating player */}
        <div className="relative z-20 mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="-mt-2 rounded-[1.5rem] border border-emerald-100 bg-white p-4 text-[#163127] shadow-[0_20px_50px_rgba(13,92,58,0.18)] sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#EEF6F1]">
                  <Image
                    src={spotlight ? cover(spotlight) : READS_PODCAST_HERO_IMAGE}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">
                    {spotlight?.title || "Happy Pets, Happier Homes"}
                  </p>
                  <p className="truncate text-xs font-semibold text-slate-500">
                    {showName}
                  </p>
                  <p className="truncate text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    {episodeLabel}
                  </p>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-2 lg:max-w-md">
                <div className="flex items-center justify-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF6F1] text-[#0D5C3A]">
                    <RotateCcw className="h-4 w-4" aria-hidden />
                  </span>
                  <Link
                    href={episodeHref}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#0D5C3A] text-white"
                    aria-label="Open episode player"
                  >
                    <Play className="h-4 w-4 fill-current" aria-hidden />
                  </Link>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF6F1] text-[#0D5C3A]">
                    <RotateCw className="h-4 w-4" aria-hidden />
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                  <span>0:00</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full w-[18%] rounded-full bg-[#E86A17]" />
                  </div>
                  <span>{duration}</span>
                </div>
              </div>

              <div className="hidden items-center gap-2 lg:flex">
                <Volume2 className="h-4 w-4 text-slate-400" aria-hidden />
                <div className="h-1.5 w-20 rounded-full bg-slate-200">
                  <div className="h-full w-2/3 rounded-full bg-slate-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-[#163127] sm:text-4xl">
              Expert pet insights for dog &amp; cat parents
            </h2>
            {spotlight ? (
              <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#0D5C3A] text-white">
                  <Play className="h-4 w-4 fill-current" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#E86A17]">
                    Featured episode
                  </p>
                  <p className="text-sm font-black text-[#163127]">
                    {spotlight.title}
                    {spotlight.podcast?.duration_seconds
                      ? ` · ${formatDuration(spotlight.podcast.duration_seconds)}`
                      : ""}
                  </p>
                </div>
                <Link
                  href={episodeHref}
                  className="rounded-full bg-[#163127] px-4 py-2.5 text-sm font-black text-white"
                >
                  Open Episode
                </Link>
              </div>
            ) : null}
            <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-slate-600">
              {spotlight?.editorial_summary ||
                spotlight?.description ||
                "SitGuru podcasts share expert advice for pet health, behavior, enrichment, and happier homes — with SitGuru originals and approved partner shows."}
            </p>
            <form
              action="/reads/podcasts"
              className="mt-6 flex flex-col gap-3 sm:flex-row"
            >
              <label className="sr-only" htmlFor="podcasts-search">
                Search podcasts
              </label>
              <input
                id="podcasts-search"
                name="q"
                defaultValue={q}
                placeholder={config.searchPlaceholder}
                className="min-h-12 flex-1 rounded-full border border-emerald-200 bg-white px-5 text-sm font-semibold outline-none"
              />
              <button
                type="submit"
                className="rounded-full bg-[#E86A17] px-6 py-3 text-sm font-black text-white"
              >
                Search
              </button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2">
              {config.filters.map((chip) => {
                const selected = searchParams?.[chip.param] === chip.value;
                const href = selected
                  ? "/reads/podcasts"
                  : `/reads/podcasts?${chip.param}=${encodeURIComponent(chip.value)}`;
                return (
                  <Link
                    key={`${chip.param}-${chip.value}`}
                    href={href}
                    className={`rounded-full px-3.5 py-2 text-xs font-black transition ${
                      selected
                        ? "bg-[#E86A17] text-white"
                        : "border border-emerald-200 bg-white text-[#163127] hover:border-[#0D5C3A]/40"
                    }`}
                  >
                    {chip.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
            <div className="relative col-span-2 aspect-[4/5] overflow-hidden rounded-[1.5rem] sm:col-span-1 sm:row-span-2 lg:col-span-2 lg:aspect-[5/4]">
              <Image
                src={READS_PODCAST_HERO_IMAGE}
                alt=""
                fill
                className="object-cover object-[center_20%]"
                sizes="(max-width: 1024px) 90vw, 420px"
              />
            </div>
            {topics.slice(0, 2).map((topic) => (
              <Link
                key={topic.id}
                href={`/reads/topics/${topic.slug}`}
                className="rounded-[1.35rem] border border-emerald-100 bg-white p-4 shadow-sm"
              >
                <p className="text-sm font-black text-[#163127]">{topic.name}</p>
                <p className="mt-2 line-clamp-3 text-xs font-semibold leading-5 text-slate-600">
                  {topic.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {spotlight?.podcast?.youtube_video_id ||
        spotlight?.podcast?.audio_embed_url ? (
          <section className="mt-10 overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-black text-[#163127]">Episode player</h3>
            <div className="mt-4">
              {spotlight.podcast?.youtube_video_id ? (
                <YoutubeEmbed
                  videoId={spotlight.podcast.youtube_video_id}
                  title={spotlight.title}
                  contentId={spotlight.id}
                />
              ) : (
                <iframe
                  title={spotlight.title}
                  src={spotlight.podcast!.audio_embed_url!}
                  className="h-40 w-full rounded-2xl border border-emerald-100"
                  allow="autoplay"
                />
              )}
            </div>
          </section>
        ) : null}

        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 className="text-2xl font-black text-[#163127]">
              Featured episodes
            </h2>
            <Link
              href="/reads/partner"
              className="text-sm font-black text-[#0D5C3A] underline-offset-4 hover:underline"
            >
              Podcast partners
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(featured.length ? featured : items).slice(0, 8).map((item) => (
              <ContentCard key={item.id} item={item} variant="episode" />
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-black text-[#163127]">All podcasts</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <ContentCard key={`all-${item.id}`} item={item} variant="episode" />
            ))}
          </div>
          {!items.length ? (
            <p className="mt-8 rounded-2xl border border-dashed border-emerald-200 bg-white p-8 text-center text-sm font-semibold text-slate-600">
              {config.emptyHint}{" "}
              <Link href="/reads/partner" className="text-[#0D5C3A] underline">
                Partner with SitGuru
              </Link>
              .
            </p>
          ) : null}
        </section>

        <ReadsNewsletterCta />
      </div>
    </div>
  );
}
