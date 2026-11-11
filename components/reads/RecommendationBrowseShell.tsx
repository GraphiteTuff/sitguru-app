import Link from "next/link";
import CategoryIconNav from "@/components/reads/CategoryIconNav";
import PrimaryFormatPills from "@/components/reads/PrimaryFormatPills";
import ReadsNewsletterCta from "@/components/reads/ReadsNewsletterCta";
import TeamPickCard from "@/components/reads/TeamPickCard";
import TrackPageView from "@/components/reads/TrackPageView";
import {
  RECOMMENDATION_SOURCE_COPY,
  type ReadsCategoryConfig,
  type ReadsRecommendationSource,
} from "@/lib/reads/category-config";
import { buildTeamPickRoster } from "@/lib/reads/team-roster";
import type { ReadsTeamMember, ReadsTeamPick } from "@/lib/reads/types";

export type CommunityRecommendationCard = {
  id: string;
  quote: string;
  submitterDisplayName: string;
  submitterRoleLabel: string;
  contentTitle: string;
  contentHref: string;
  contentType: string;
  status: string;
};

export default function RecommendationBrowseShell({
  config,
  source,
  teamPicks = [],
  members = [],
  communityPicks = [],
  searchParams,
}: {
  config: ReadsCategoryConfig;
  source: ReadsRecommendationSource;
  teamPicks?: ReadsTeamPick[];
  members?: ReadsTeamMember[];
  communityPicks?: CommunityRecommendationCard[];
  searchParams?: Record<string, string | undefined>;
}) {
  const copy = RECOMMENDATION_SOURCE_COPY[source];
  const q = searchParams?.q || "";
  const format = searchParams?.format || "";
  const person = searchParams?.person || "";
  const roster = buildTeamPickRoster(members, teamPicks).filter((item) =>
    person ? item.member.slug === person : true,
  );

  return (
    <div>
      <PrimaryFormatPills />
      <CategoryIconNav />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <TrackPageView
          eventName={source === "team" ? "team_pick_view" : "page_view"}
          metadata={{ surface: "recommendation_lane", source }}
        />

        <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#0D5C3A]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#0D5C3A]">
              {copy.badge}
            </span>
            <span className="rounded-full bg-[#E86A17]/12 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#E86A17]">
              Review required
            </span>
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-[#163127]">
            {config.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-600 sm:text-base">
            {config.description}
          </p>
          <p className="mt-3 text-sm font-bold text-[#0D5C3A]">{copy.reviewNote}</p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {(
              [
                ["team", "Team Picks", "/reads/team-picks", "SitGuru staff"],
                ["guru", "Guru Picks", "/reads/guru-picks", "Registered Gurus"],
                [
                  "pet_parent",
                  "Pet Parent Picks",
                  "/reads/pet-parent-picks",
                  "Pet Parent community",
                ],
              ] as const
            ).map(([key, label, href, who]) => (
              <Link
                key={key}
                href={href}
                className={`rounded-2xl border p-4 transition ${
                  source === key
                    ? "border-[#0D5C3A] bg-[#0D5C3A] text-white"
                    : "border-emerald-100 bg-[#F4F7FB] text-[#163127] hover:border-[#0D5C3A]/35"
                }`}
              >
                <p className="text-sm font-black">{label}</p>
                <p
                  className={`mt-1 text-xs font-semibold ${
                    source === key ? "text-white/80" : "text-slate-500"
                  }`}
                >
                  From {who}
                </p>
              </Link>
            ))}
          </div>

          <form action={config.href} className="mt-6 flex flex-wrap gap-2">
            <label className="sr-only" htmlFor={`${config.key}-search`}>
              Search {config.label}
            </label>
            <input
              id={`${config.key}-search`}
              name="q"
              defaultValue={q}
              placeholder={config.searchPlaceholder}
              className="min-w-[220px] flex-1 rounded-full border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold"
            />
            {source === "team" ? (
              <select
                name="person"
                defaultValue={person}
                className="rounded-full border border-emerald-200 bg-white px-3 py-2.5 text-sm font-semibold"
                aria-label="Filter by teammate"
              >
                <option value="">All teammates</option>
                {members.map((member) => (
                  <option key={member.id} value={member.slug}>
                    {member.full_name.split(" ")[0]}
                  </option>
                ))}
              </select>
            ) : null}
            <select
              name="format"
              defaultValue={format}
              className="rounded-full border border-emerald-200 bg-white px-3 py-2.5 text-sm font-semibold"
              aria-label="Filter by format"
            >
              <option value="">All formats</option>
              <option value="book">Books</option>
              <option value="magazine">Magazines</option>
              <option value="podcast">Podcasts</option>
              <option value="video">Videos</option>
            </select>
            <button
              type="submit"
              className="rounded-full bg-[#0D5C3A] px-4 py-2.5 text-sm font-black text-white"
            >
              Filter
            </button>
          </form>
        </section>

        {source === "team" ? (
          <section className="mt-8">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-2xl font-black text-[#163127]">
                {config.featuredHeading}
              </h2>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                {roster.filter((item) => item.pick).length} live ·{" "}
                {roster.filter((item) => !item.pick).length} placeholders
              </p>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {roster.map((item) => (
                <TeamPickCard
                  key={item.member.id}
                  member={item.member}
                  pick={item.pick}
                  facing
                />
              ))}
            </div>
            {!roster.length ? (
              <p className="mt-8 rounded-2xl border border-dashed border-emerald-200 bg-white p-8 text-center text-sm font-semibold text-slate-600">
                {config.emptyHint}
              </p>
            ) : null}
          </section>
        ) : (
          <section className="mt-8">
            <h2 className="text-2xl font-black text-[#163127]">
              {config.featuredHeading}
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {communityPicks.map((pick) => (
                <article
                  key={pick.id}
                  className="flex h-full flex-col rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm"
                >
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#E86A17]">
                    {copy.submitterLabel}
                  </p>
                  <h3 className="mt-2 text-lg font-black text-[#163127]">
                    {pick.submitterDisplayName}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500">
                    {pick.submitterRoleLabel}
                  </p>
                  <p className="mt-4 text-base font-black text-[#163127]">
                    {pick.contentTitle}
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    {pick.contentType}
                  </p>
                  <blockquote className="mt-3 flex-1 rounded-2xl bg-[#f7f4ee] px-4 py-3 text-sm leading-6 text-slate-700">
                    “{pick.quote}”
                  </blockquote>
                  <Link
                    href={pick.contentHref}
                    className="mt-4 inline-flex rounded-full bg-[#0D5C3A] px-4 py-2 text-sm font-bold text-white"
                  >
                    View recommendation
                  </Link>
                </article>
              ))}
            </div>
            {!communityPicks.length ? (
              <div className="mt-8 rounded-[1.5rem] border border-dashed border-emerald-200 bg-white p-8 text-center">
                <p className="text-sm font-semibold text-slate-600">
                  {config.emptyHint}
                </p>
                <p className="mt-3 text-sm font-semibold text-slate-500">
                  Meanwhile, explore staff-curated{" "}
                  <Link
                    href="/reads/team-picks"
                    className="font-black text-[#0D5C3A] underline"
                  >
                    Team Picks
                  </Link>
                  .
                </p>
              </div>
            ) : null}
          </section>
        )}

        <ReadsNewsletterCta />
      </div>
    </div>
  );
}
