import Image from "next/image";
import Link from "next/link";
import FormatNavCards from "@/components/reads/FormatNavCards";
import ServiceCtas from "@/components/reads/ServiceCtas";
import TeamPickCard from "@/components/reads/TeamPickCard";
import TrackPageView from "@/components/reads/TrackPageView";
import {
  READS_BRAND,
  READS_HERO_IMAGE,
  READS_SUPPORTING,
} from "@/lib/reads/constants";
import { READS_DEMO_BANNER } from "@/lib/reads/demo-data";
import { fetchLandingBundle, fetchPublishedContent } from "@/lib/reads/queries";
import { buildTeamPickRoster } from "@/lib/reads/team-roster";

export const dynamic = "force-dynamic";

const HERO_SUBNAV = [
  { href: "/reads/books", label: "Books" },
  { href: "/reads/magazines", label: "Magazines" },
  { href: "/reads/podcasts", label: "Podcasts" },
  { href: "/reads/authors", label: "Authors" },
] as const;

function coverUrl(item: {
  image_url?: string | null;
  thumbnail_url?: string | null;
  book?: { cover_image_url?: string | null } | null;
  podcast?: { episode_artwork_url?: string | null } | null;
}) {
  return (
    item.image_url ||
    item.thumbnail_url ||
    item.book?.cover_image_url ||
    item.podcast?.episode_artwork_url ||
    null
  );
}

export default async function ReadsLandingPage() {
  const data = await fetchLandingBundle();
  const [books, magazines, podcasts] = await Promise.all([
    fetchPublishedContent({ format: "book", limit: 4 }),
    fetchPublishedContent({ format: "magazine", limit: 4 }),
    fetchPublishedContent({ format: "podcast", limit: 4 }),
  ]);
  const relatedBook = data.bookOfTheMonth || books[0] || null;
  const teamPreview = buildTeamPickRoster(data.team, data.teamPicks).slice(0, 5);
  const featured = data.featuredPodcast;
  const featuredCover = featured ? coverUrl(featured) : null;
  const relatedCover = relatedBook ? coverUrl(relatedBook) : null;

  return (
    <>
      <TrackPageView eventName="page_view" metadata={{ surface: "landing" }} />

      {data.isDemo ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-amber-900">
          {READS_DEMO_BANNER}
        </div>
      ) : null}

      <section
        className="relative overflow-hidden bg-[#0D5C3A] public-dark-section"
        data-brand-green
      >
        <div className="absolute inset-0">
          <Image
            src={READS_HERO_IMAGE}
            alt=""
            fill
            priority
            className="object-cover object-[70%_center] opacity-50 sm:object-[center_30%]"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D5C3A] via-[#0D5C3A]/90 to-[#0D5C3A]/25" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="flex flex-wrap gap-2">
            {HERO_SUBNAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold !text-white backdrop-blur transition hover:bg-white/20"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight !text-white sm:text-5xl lg:text-6xl">
            SitGuru{" "}
            <span
              className="italic"
              style={{ color: READS_BRAND.orange, fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Reads &amp; Listen
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-emerald-50">
            {READS_SUPPORTING}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/reads/books"
              className="rounded-full px-5 py-3 text-sm font-black text-white shadow-sm"
              style={{ backgroundColor: READS_BRAND.orange }}
            >
              Browse Books
            </Link>
            <Link
              href="/reads/magazines"
              className="rounded-full bg-[#09462C] px-5 py-3 text-sm font-black text-white shadow-sm ring-1 ring-white/20"
            >
              Browse Magazines
            </Link>
            <Link
              href="/reads/podcasts"
              className="rounded-full px-5 py-3 text-sm font-black text-white shadow-sm"
              style={{ backgroundColor: READS_BRAND.purple }}
            >
              Listen to Podcasts
            </Link>
          </div>
        </div>
      </section>

      <FormatNavCards variant="icons" />

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
        {featured ? (
          <article className="overflow-hidden rounded-[1.75rem] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-white shadow-sm">
            <div className="grid gap-0 sm:grid-cols-[160px_1fr]">
              <div className="relative min-h-[180px] bg-violet-100 sm:min-h-full">
                {featuredCover ? (
                  <Image
                    src={featuredCover}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="200px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-4 text-center text-sm font-black text-violet-800">
                    SitGuru Pet Podcast
                  </div>
                )}
              </div>
              <div className="p-5 sm:p-6">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">
                  Featured Podcast Episode
                </p>
                <h2 className="mt-2 text-2xl font-black text-[#163127] sm:text-3xl">
                  {featured.title}
                </h2>
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  {featured.podcast?.guest_name || "SitGuru Pet Podcast"}
                  {featured.podcast?.duration_seconds
                    ? ` · ${Math.round(featured.podcast.duration_seconds / 60)} min`
                    : ""}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(featured.tags || []).slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-5 flex items-center gap-3 rounded-2xl bg-violet-100/80 px-4 py-3">
                  <Link
                    href={`/reads/podcasts/${featured.slug}`}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: READS_BRAND.purple }}
                    aria-label={`Play ${featured.title}`}
                  >
                    ▶
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-white/80">
                      <div className="h-full w-1/3 rounded-full bg-violet-500" />
                    </div>
                    <p className="mt-1 text-[11px] font-bold text-violet-900">
                      Tap play to open the episode player
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ) : (
          <div className="rounded-[1.75rem] border border-violet-100 bg-violet-50 p-6">
            <p className="text-sm font-bold text-violet-900">
              Featured podcast episodes will appear here once published.
            </p>
          </div>
        )}

        {relatedBook ? (
          <article className="overflow-hidden rounded-[1.75rem] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-white shadow-sm">
            <p className="px-5 pt-5 text-xs font-black uppercase tracking-[0.18em] text-orange-700">
              Related Reading
            </p>
            <div className="grid gap-4 p-5 sm:grid-cols-[110px_1fr]">
              <div className="relative mx-auto aspect-[3/4] w-[110px] overflow-hidden rounded-xl bg-orange-100">
                {relatedCover ? (
                  <Image
                    src={relatedCover}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="110px"
                  />
                ) : null}
              </div>
              <div>
                <h2 className="text-xl font-black text-[#163127]">
                  {relatedBook.title}
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  {relatedBook.book?.author_name}
                </p>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                  {relatedBook.editorial_summary || relatedBook.description}
                </p>
                <Link
                  href={`/reads/books/${relatedBook.slug}`}
                  className="mt-4 inline-flex rounded-full px-4 py-2.5 text-sm font-black text-white"
                  style={{ backgroundColor: READS_BRAND.orange }}
                >
                  View Book
                </Link>
              </div>
            </div>
          </article>
        ) : null}
      </section>

      <FormatNavCards
        variant="cards"
        samples={{ book: books, magazine: magazines, podcast: podcasts }}
      />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#E86A17]">
              The SitGuru Team&apos;s Picks
            </p>
            <h2 className="mt-2 text-3xl font-black text-[#163127]">
              First-name recommendations from the pack
            </h2>
          </div>
          <Link
            href="/reads/team-picks"
            className="text-sm font-black text-[#0D5C3A] underline-offset-4 hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="mb-6 flex gap-4 overflow-x-auto pb-2 md:hidden">
          {teamPreview.map((item) => (
            <div key={`m-${item.member.id}`} className="min-w-[96px]">
              <TeamPickCard
                member={item.member}
                pick={item.pick}
                facing
                compact
              />
            </div>
          ))}
        </div>

        <div className="hidden gap-4 md:grid md:grid-cols-3 xl:grid-cols-5">
          {teamPreview.map((item) => (
            <TeamPickCard
              key={item.member.id}
              member={item.member}
              pick={item.pick}
              facing
            />
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-10 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
        <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#E86A17]">
            Explore by Topic
          </p>
          <h2 className="mt-2 text-3xl font-black text-[#163127]">
            Learn what matters for your pets
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {data.topics.slice(0, 6).map((topic) => (
              <Link
                key={topic.id}
                href={`/reads/topics/${topic.slug}`}
                className="rounded-2xl border border-emerald-100 bg-[#f7fbf8] px-4 py-4 text-sm font-black text-[#163127] transition hover:border-emerald-300"
              >
                {topic.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.75rem] border border-orange-200 bg-gradient-to-br from-orange-50 to-white shadow-sm">
          <div className="relative h-40">
            <Image
              src={READS_HERO_IMAGE}
              alt=""
              fill
              className="object-cover"
              sizes="400px"
            />
          </div>
          <div className="p-6">
            <h2 className="text-2xl font-black text-[#163127]">
              Partner With SitGuru
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Authors, publishers, podcasters, magazines, and pet experts — bring
              your work to the SitGuru community.
            </p>
            <Link
              href="/reads/partner"
              className="mt-5 inline-flex rounded-full px-5 py-3 text-sm font-black text-white"
              style={{ backgroundColor: READS_BRAND.orange }}
            >
              Become a Featured Partner
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <ServiceCtas source="reads_landing" />
      </section>
    </>
  );
}
