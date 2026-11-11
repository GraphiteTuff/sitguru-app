import Link from "next/link";
import ContentCard from "@/components/reads/ContentCard";
import FormatNavCards from "@/components/reads/FormatNavCards";
import ServiceCtas from "@/components/reads/ServiceCtas";
import TeamPickCard from "@/components/reads/TeamPickCard";
import TrackPageView from "@/components/reads/TrackPageView";
import {
  READS_BRAND,
  READS_DESCRIPTOR,
  READS_HEADLINE,
  READS_PRIMARY_CTAS,
  READS_SUPPORTING,
} from "@/lib/reads/constants";
import { READS_DEMO_BANNER } from "@/lib/reads/demo-data";
import { fetchLandingBundle } from "@/lib/reads/queries";

export const dynamic = "force-dynamic";

export default async function ReadsLandingPage() {
  const data = await fetchLandingBundle();

  return (
    <>
      <TrackPageView eventName="page_view" metadata={{ surface: "landing" }} />

      {data.isDemo ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-amber-900">
          {READS_DEMO_BANNER}
        </div>
      ) : null}

      <section className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-14">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-700">
            SitGuru Reads &amp; Listen
          </p>
          <p className="mt-2 text-sm font-bold text-[#0D5C3A]">
            {READS_DESCRIPTOR}
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-[#163127] sm:text-5xl">
            {READS_HEADLINE}
          </h1>
          <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-slate-600">
            {READS_SUPPORTING}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {READS_PRIMARY_CTAS.map((cta) => (
              <Link
                key={cta.href}
                href={cta.href}
                className="rounded-full px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:brightness-105"
                style={{ backgroundColor: READS_BRAND.green }}
              >
                {cta.label}
              </Link>
            ))}
          </div>
        </div>

        <div
          className="relative min-h-[280px] overflow-hidden rounded-[2rem] border border-emerald-100 shadow-xl sm:min-h-[360px]"
          style={{
            background: `radial-gradient(circle at 20% 20%, #ffe8d6, transparent 45%), linear-gradient(145deg, ${READS_BRAND.green} 0%, ${READS_BRAND.navy} 100%)`,
          }}
        >
          <div className="absolute inset-0 public-dark-section p-6 sm:p-8" data-brand-green>
            <p className="text-sm font-black uppercase tracking-[0.18em] !text-orange-200">
              Discover · Learn · Listen · Connect
            </p>
            <p className="mt-6 max-w-sm text-3xl font-black leading-tight !text-white">
              Pet books, magazines, podcasts, and expert voices — curated for the
              SitGuru community.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 text-sm font-bold !text-white/90">
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">Books</div>
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">Magazines</div>
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">Podcasts</div>
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">Authors</div>
            </div>
          </div>
        </div>
      </section>

      <FormatNavCards />

      {data.featuredPodcast ? (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-700">
            Featured Podcast
          </p>
          <div className="mt-3 grid gap-6 rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h2 className="text-3xl font-black text-[#163127]">
                {data.featuredPodcast.title}
              </h2>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                {data.featuredPodcast.podcast?.guest_name
                  ? `Guest: ${data.featuredPodcast.podcast.guest_name}`
                  : null}
                {data.featuredPodcast.podcast?.duration_seconds
                  ? ` · ${Math.round(data.featuredPodcast.podcast.duration_seconds / 60)} min`
                  : null}
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                {data.featuredPodcast.editorial_summary ||
                  data.featuredPodcast.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(data.featuredPodcast.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Link
                href={`/reads/podcasts/${data.featuredPodcast.slug}`}
                className="mt-5 inline-flex rounded-full bg-[#0D5C3A] px-4 py-2.5 text-sm font-black text-white"
              >
                Listen / Watch
              </Link>
            </div>
            <ContentCard item={data.featuredPodcast} />
          </div>
        </section>
      ) : null}

      {data.bookOfTheMonth ? (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-700">
            Book of the Month
          </p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[280px_1fr]">
            <ContentCard item={data.bookOfTheMonth} />
            <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
              <h2 className="text-3xl font-black text-[#163127]">
                {data.bookOfTheMonth.title}
              </h2>
              <p className="mt-2 font-semibold text-slate-600">
                {data.bookOfTheMonth.book?.author_name}
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                {data.bookOfTheMonth.editorial_summary ||
                  data.bookOfTheMonth.description}
              </p>
              {data.bookOfTheMonth.why_recommended ? (
                <p className="mt-4 rounded-2xl bg-[#f7f4ee] p-4 text-sm font-semibold leading-6 text-slate-700">
                  Why SitGuru recommends it: {data.bookOfTheMonth.why_recommended}
                </p>
              ) : null}
              <Link
                href={`/reads/books/${data.bookOfTheMonth.slug}`}
                className="mt-5 inline-flex rounded-full bg-[#E86A17] px-4 py-2.5 text-sm font-black text-white"
              >
                View book
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {data.magazineSpotlight ? (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-700">
            Magazine Spotlight
          </p>
          <div className="mt-3 rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
            <h2 className="text-3xl font-black text-[#163127]">
              {data.magazineSpotlight.title}
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              {data.magazineSpotlight.publication?.issue_label}
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
              {data.magazineSpotlight.description ||
                data.magazineSpotlight.editorial_summary}
            </p>
            <Link
              href={`/reads/magazines/${data.magazineSpotlight.slug}`}
              className="mt-5 inline-flex rounded-full border border-emerald-200 px-4 py-2.5 text-sm font-black text-[#0D5C3A]"
            >
              Explore Publication
            </Link>
          </div>
        </section>
      ) : null}

      {data.featuredAuthor ? (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-700">
            Featured Author / Expert
          </p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[280px_1fr]">
            <ContentCard item={data.featuredAuthor} />
            <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
              <h2 className="text-3xl font-black text-[#163127]">
                {data.featuredAuthor.title}
              </h2>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                {data.featuredAuthor.person?.credentials}
                {data.featuredAuthor.person?.organization
                  ? ` · ${data.featuredAuthor.person.organization}`
                  : ""}
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                {data.featuredAuthor.person?.biography ||
                  data.featuredAuthor.description}
              </p>
              <Link
                href={`/reads/authors/${data.featuredAuthor.slug}`}
                className="mt-5 inline-flex rounded-full bg-[#0D5C3A] px-4 py-2.5 text-sm font-black text-white"
              >
                Meet the Author
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-700">
              SitGuru Team Picks
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.teamPicks.slice(0, 6).map((pick) => (
            <TeamPickCard key={pick.id} pick={pick} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-700">
          Explore by Topic
        </p>
        <h2 className="mt-2 text-3xl font-black text-[#163127]">
          Learn what matters for your pets and your craft
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/reads/topics/${topic.slug}`}
              className="rounded-2xl border border-emerald-100 bg-white px-4 py-4 text-sm font-black text-[#163127] shadow-sm transition hover:border-emerald-300"
            >
              {topic.name}
            </Link>
          ))}
        </div>
        <Link
          href="/reads/topics"
          className="mt-4 inline-flex text-sm font-black text-[#0D5C3A] underline-offset-4 hover:underline"
        >
          Browse all topics
        </Link>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-8 shadow-sm">
          <h2 className="text-3xl font-black text-[#163127]">
            Partner with SitGuru
          </h2>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-600">
            Are you an author, publisher, podcaster, magazine, or pet expert? Bring
            your work to the SitGuru community.
          </p>
          <Link
            href="/reads/partner"
            className="mt-5 inline-flex rounded-full bg-[#E86A17] px-5 py-3 text-sm font-black text-white"
          >
            Become a Featured Partner
          </Link>
        </div>
        <ServiceCtas source="reads_landing" />
      </section>
    </>
  );
}
