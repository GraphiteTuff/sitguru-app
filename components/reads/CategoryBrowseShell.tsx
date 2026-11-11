import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import ContentCard from "@/components/reads/ContentCard";
import CategoryIconNav from "@/components/reads/CategoryIconNav";
import PrimaryFormatPills from "@/components/reads/PrimaryFormatPills";
import ReadsNewsletterCta from "@/components/reads/ReadsNewsletterCta";
import TeamPickCard from "@/components/reads/TeamPickCard";
import TrackPageView from "@/components/reads/TrackPageView";
import type { ReadsCategoryConfig } from "@/lib/reads/category-config";
import { READS_HERO_IMAGE } from "@/lib/reads/constants";
import type {
  ReadsContentDetail,
  ReadsTeamPick,
  ReadsTopic,
} from "@/lib/reads/types";

function hrefForContent(item: ReadsContentDetail) {
  const map: Record<string, string> = {
    book: "books",
    magazine: "magazines",
    publication: "magazines",
    podcast: "podcasts",
    video: "videos",
    author: "authors",
    expert: "authors",
  };
  return `/reads/${map[item.content_type] || "books"}/${item.slug}`;
}

function publisherUrl(item: ReadsContentDetail) {
  return (
    item.publication?.website_url ||
    item.external_url ||
    item.book?.purchase_url ||
    null
  );
}

export default function CategoryBrowseShell({
  config,
  items,
  featured,
  topics = [],
  teamPicks = [],
  spotlight = null,
  searchParams,
  cardVariant = "default",
  extras,
}: {
  config: ReadsCategoryConfig;
  items: ReadsContentDetail[];
  featured: ReadsContentDetail[];
  topics?: ReadsTopic[];
  teamPicks?: ReadsTeamPick[];
  spotlight?: ReadsContentDetail | null;
  searchParams?: Record<string, string | undefined>;
  cardVariant?: "default" | "cover" | "episode";
  extras?: ReactNode;
}) {
  const q = searchParams?.q || "";
  const activeFilter = config.filters.find((chip) => {
    const current = searchParams?.[chip.param];
    return current === chip.value;
  });

  return (
    <div>
      <PrimaryFormatPills />
      <CategoryIconNav />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <TrackPageView
          eventName="page_view"
          contentType={config.format === "author" ? "author" : config.format}
          metadata={{ surface: "category_browse", category: config.key }}
        />

        <section
          data-brand-green
          className="public-dark-section relative overflow-hidden rounded-[1.75rem] bg-[#0D5C3A] !text-white shadow-[0_24px_60px_rgba(13,92,58,0.28)]"
        >
          <div className="absolute inset-0">
            <Image
              src={READS_HERO_IMAGE}
              alt=""
              fill
              priority
              className="object-cover opacity-35"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#09462C] via-[#0D5C3A]/92 to-[#0D5C3A]/55" />
          </div>
          <div className="relative grid gap-8 px-6 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:px-10 lg:py-12">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] !text-[#F6C39A]">
                {config.eyebrow}
              </p>
              <h1 className="mt-3 max-w-2xl text-4xl font-black tracking-tight !text-white sm:text-5xl">
                {config.title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 !text-white/90 sm:text-base">
                {config.description}
              </p>
              <form action={config.href} className="mt-6 flex flex-col gap-3 sm:flex-row">
                <label className="sr-only" htmlFor={`${config.key}-search`}>
                  Search {config.label}
                </label>
                <input
                  id={`${config.key}-search`}
                  name="q"
                  defaultValue={q}
                  placeholder={config.searchPlaceholder}
                  className="min-h-12 flex-1 rounded-full border-0 bg-white px-5 text-sm font-semibold text-[#163127] outline-none ring-0 placeholder:text-slate-400"
                />
                {Object.entries(searchParams || {}).map(([key, value]) =>
                  key !== "q" && value ? (
                    <input key={key} type="hidden" name={key} value={value} />
                  ) : null,
                )}
                <button
                  type="submit"
                  className="rounded-full bg-[#E86A17] px-6 py-3 text-sm font-black text-white transition hover:bg-[#cf5c12]"
                >
                  Search
                </button>
              </form>
              <div className="mt-4 flex flex-wrap gap-2">
                {config.filters.map((chip) => {
                  const selected =
                    activeFilter?.param === chip.param &&
                    activeFilter?.value === chip.value;
                  const href = selected
                    ? config.href
                    : `${config.href}?${chip.param}=${encodeURIComponent(chip.value)}`;
                  return (
                    <Link
                      key={`${chip.param}-${chip.value}`}
                      href={href}
                      className={`rounded-full px-3.5 py-2 text-xs font-black transition ${
                        selected
                          ? "bg-[#E86A17] !text-white"
                          : "bg-white/15 !text-white hover:bg-white/25"
                      }`}
                    >
                      {chip.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {spotlight ? (
              <aside className="rounded-[1.5rem] border border-white/15 bg-[#163127]/70 p-5 backdrop-blur">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] !text-[#F6C39A]">
                  Featured spotlight
                </p>
                <h2 className="mt-2 text-2xl font-black leading-snug !text-white">
                  {spotlight.title}
                </h2>
                <p className="mt-3 line-clamp-4 text-sm font-semibold leading-6 !text-white/85">
                  {spotlight.editorial_summary ||
                    spotlight.description ||
                    spotlight.why_recommended}
                </p>
                <dl className="mt-4 space-y-1 text-xs font-bold uppercase tracking-[0.12em] !text-white/70">
                  {spotlight.book?.author_name ? (
                    <div>Authors · {spotlight.book.author_name}</div>
                  ) : null}
                  {spotlight.publication?.publication_name ? (
                    <div>
                      Publisher · {spotlight.publication.publication_name}
                    </div>
                  ) : null}
                  {spotlight.podcast?.show_name ? (
                    <div>Show · {spotlight.podcast.show_name}</div>
                  ) : null}
                  {spotlight.person?.person_type ? (
                    <div>Role · {spotlight.person.person_type}</div>
                  ) : null}
                </dl>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href={hrefForContent(spotlight)}
                    className="rounded-full bg-[#E86A17] px-4 py-2.5 text-sm font-black !text-white"
                  >
                    View details
                  </Link>
                  {publisherUrl(spotlight) ? (
                    <a
                      href={publisherUrl(spotlight)!}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-white/35 bg-white/10 px-4 py-2.5 text-sm font-black !text-white"
                    >
                      Visit publisher
                    </a>
                  ) : null}
                </div>
              </aside>
            ) : null}
          </div>
        </section>

        {extras}

        {featured.length ? (
          <section className="mt-10">
            <div className="mb-4 flex items-end justify-between gap-3">
              <h2 className="text-2xl font-black text-[#163127]">
                {config.featuredHeading}
              </h2>
              <Link
                href="/reads/team-picks"
                className="text-sm font-black text-[#0D5C3A] underline-offset-4 hover:underline"
              >
                Team Picks
              </Link>
            </div>
            <div
              className={`grid gap-4 ${
                cardVariant === "cover"
                  ? "sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
                  : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              }`}
            >
              {featured.slice(0, 8).map((item) => (
                <ContentCard
                  key={`feat-${item.id}`}
                  item={item}
                  variant={cardVariant}
                />
              ))}
            </div>
          </section>
        ) : null}

        {topics.length ? (
          <section className="mt-10">
            <h2 className="text-2xl font-black text-[#163127]">
              Browse by category
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {topics.slice(0, 8).map((topic) => (
                <Link
                  key={topic.id}
                  href={`/reads/topics/${topic.slug}`}
                  className="rounded-[1.35rem] border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <p className="text-lg font-black text-[#163127]">
                    {topic.name}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-600">
                    {topic.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {teamPicks.length ? (
          <section className="mt-10">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#E86A17]">
                  Staff curated
                </p>
                <h2 className="mt-1 text-2xl font-black text-[#163127]">
                  Team Picks in this format
                </h2>
              </div>
              <div className="flex flex-wrap gap-3 text-sm font-black">
                <Link
                  href="/reads/guru-picks"
                  className="text-[#0D5C3A] underline-offset-4 hover:underline"
                >
                  Guru Picks
                </Link>
                <Link
                  href="/reads/pet-parent-picks"
                  className="text-[#0D5C3A] underline-offset-4 hover:underline"
                >
                  Pet Parent Picks
                </Link>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {teamPicks.slice(0, 3).map((pick) => (
                <TeamPickCard key={pick.id} pick={pick} facing />
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-black text-[#163127]">
              All {config.label.toLowerCase()}
            </h2>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              {items.length} result{items.length === 1 ? "" : "s"}
            </p>
          </div>
          <div
            className={`grid gap-4 ${
              cardVariant === "cover"
                ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
                : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            }`}
          >
            {items.map((item) => (
              <ContentCard key={item.id} item={item} variant={cardVariant} />
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
