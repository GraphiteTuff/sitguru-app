import type { Metadata } from "next";
import RecommendationBrowseShell from "@/components/reads/RecommendationBrowseShell";
import { READS_CATEGORY_CONFIG } from "@/lib/reads/category-config";
import { readSearchParam } from "@/lib/reads/page-search";
import { fetchTeamMembers, fetchTeamPicks } from "@/lib/reads/queries";
import type { ReadsContentType } from "@/lib/reads/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Team Picks | SitGuru Reads & Listens",
  description:
    "Staff-curated recommendations from Jason, Danette, Ava, Ryan, and Lola — reviewed before publication.",
  alternates: { canonical: "https://www.sitguru.com/reads/team-picks" },
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TeamPicksPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const person = readSearchParam(params, "person");
  const format = readSearchParam(params, "format") as ReadsContentType | undefined;
  const q = readSearchParam(params, "q");

  const [members, picks] = await Promise.all([
    fetchTeamMembers(),
    fetchTeamPicks({ memberSlug: person, format }),
  ]);

  const filtered = q
    ? picks.filter((pick) => {
        const hay = `${pick.quote} ${pick.content?.title || ""} ${pick.team_member?.full_name || ""}`.toLowerCase();
        return hay.includes(q.toLowerCase());
      })
    : picks;

  return (
    <RecommendationBrowseShell
      config={READS_CATEGORY_CONFIG["team-picks"]}
      source="team"
      teamPicks={filtered}
      members={members}
      searchParams={{ q, person, format }}
    />
  );
}
