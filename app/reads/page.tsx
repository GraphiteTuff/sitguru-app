import Image from "next/image";
import Link from "next/link";
import ContentCard from "@/components/reads/ContentCard";
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
import { fetchLandingBundle } from "@/lib/reads/queries";

export const dynamic = "force-dynamic";

export default async function ReadsLandingPage() {
  const data = await fetchLandingBundle();
  const relatedBook = data.bookOfTheMonth;
  const teamPreview = data.teamPicks.slice(0, 5);

  return (
    <>
      <TrackPageView eventName="page_view" metadata={{ surface: "landing" }} />

      {data.isDemo ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-amber-900">
          {READS_DEMO_BANNER}
        </div>
      ) : null}

      <section className="relative overflow-hidden bg-[#0D5C3A] public-dark-section" data-brand-green>
        <div className="absolute inset-0">
          <Image
            src={READS_HERO_IMAGE}
            alt=""
            fill
            priority
            className="object-cover object-[center_30%] opacity-45"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D5C3A] via-[#0D5C3A]/88 to-[#0D5C3A]/35" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <p className="text-sm font-black uppercase tracking-[0.22em] !text-emerald-100">
            SitGuru
          </p>
          <h1 className="mt-2 max-w-3xl text-4xl font-black tracking-tight !text-white sm:text-5xl lg:text-6xl">
            Reads{" "}
            <span className="italic" style={{ color: READS_BRAND.orange }}>
              &amp; Listen
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

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
        {data.featuredPodcast ? (
          <div className="rounded-[1.75rem] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">
              Featured Podcast Episode
            </p>
            <h2 className="mt-2 text-3xl font-black text-[#163127]">
              {data.featuredPodcast.title}
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              {data.featuredPodcast.podcast?.guest_name
                ? data.featuredPodcast.podcast.guest_name
                : "SitGuru Pet Podcast"}
              {data.featuredPodcast.podcast?.duration_seconds
                ? ` · ${Math.round(data.featuredPodcast.podcast.duration_seconds / 60)} min`
                : ""}
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              {data.featuredPodcast.editorial_summary ||
                data.featuredPodcast.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(data.featuredPodcast.tags || []).slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800"
                >
                  {tag}
                </span>
              ))}
            </div>
            <Link
              href={`/reads/podcasts/${data.featuredPodcast.slug}`}
              className="mt-5 inline-flex rounded-full px-4 py-2.5 text-sm font-black text-white"
              style={{ backgroundColor: READS_BRAND.purple }}
            >
              Listen / Watch
            </Link>
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-violet-100 bg-violet-50 p-6">
            <p className="text-sm font-bold text-violet-900">
              Featured podcast episodes will appear here once published.
            </p>
          </div>
        )}

        {relatedBook ? (
          <div className="rounded-[1.75rem] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">
              Related Reading
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-[140px_1fr]">
              <ContentCard item={relatedBook} compact />
              <div>
                <h2 className="text-2xl font-black text-[#163127]">
                  {relatedBook.title}
                </h2>
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  {relatedBook.book?.author_name}
                </p>
                <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-600">
                  {relatedBook.editorial_summary || relatedBook.description}
                </p>
                <Link
                  href={`/reads/books/${relatedBook.slug}`}
                  className="mt-5 inline-flex rounded-full px-4 py-2.5 text-sm font-black text-white"
                  style={{ backgroundColor: READS_BRAND.orange }}
                >
                  View Book
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <FormatNavCards variant="cards" />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#E86A17]">
              The SitGuru Team&apos;s Picks
            </p>
            <h2 className="mt-2 text-3xl font-black text-[#163127]">
              Recommendations from Jason, Danette, Ava, Ryan, and Lola
            </h2>
          </div>
          <Link
            href="/reads/team-picks"
            className="text-sm font-black text-[#0D5C3A] underline-offset-4 hover:underline"
          >
            View all
          </Link>
        </div>

        {/* Mobile / web-app facing: first names + avatars */}
        <div className="mb-6 grid grid-cols-3 gap-4 sm:hidden">
          {teamPreview.slice(0, 3).map((pick) => (
            <TeamPickCard key={`compact-${pick.id}`} pick={pick} facing compact />
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {teamPreview.map((pick) => (
            <TeamPickCard key={pick.id} pick={pick} facing />
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
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
              Authors, publishers, podcasters, magazines, and pet experts —
              bring your work to the SitGuru community.
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
