import type { Metadata } from "next";
import TeamPickCard from "@/components/reads/TeamPickCard";
import TrackPageView from "@/components/reads/TrackPageView";
import { fetchTeamMembers, fetchTeamPicks } from "@/lib/reads/queries";
import type { ReadsContentType } from "@/lib/reads/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Team Picks | SitGuru Reads & Listen",
  description:
    "Database-driven recommendations from Jason, Danette, Ava, Ryan, and Lola.",
  alternates: { canonical: "https://www.sitguru.com/reads/team-picks" },
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TeamPicksPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const person = typeof params.person === "string" ? params.person : undefined;
  const format =
    typeof params.format === "string"
      ? (params.format as ReadsContentType)
      : undefined;
  const topic = typeof params.topic === "string" ? params.topic : undefined;

  const [members, picks] = await Promise.all([
    fetchTeamMembers(),
    fetchTeamPicks({ memberSlug: person, format, topic }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <TrackPageView eventName="team_pick_view" metadata={{ surface: "index" }} />
      <h1 className="text-4xl font-black tracking-tight text-[#163127]">
        SitGuru Team Picks
      </h1>
      <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
        Recommendations from Jason Graff, Danette Graff, Ava Venezia, Ryan Manibo,
        and Lola Uhl — stored in the database, not hard-coded in the page.
      </p>

      <form className="mt-6 flex flex-wrap gap-2">
        <select
          name="person"
          defaultValue={person || ""}
          className="rounded-full border border-emerald-200 bg-white px-3 py-2.5 text-sm font-semibold"
          aria-label="Filter by person"
        >
          <option value="">All team members</option>
          {members.map((member) => (
            <option key={member.id} value={member.slug}>
              {member.full_name}
            </option>
          ))}
        </select>
        <select
          name="format"
          defaultValue={format || ""}
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

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {picks.map((pick) => (
          <TeamPickCard key={pick.id} pick={pick} />
        ))}
      </div>
    </div>
  );
}
