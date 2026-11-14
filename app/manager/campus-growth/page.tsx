import { randomUUID } from "node:crypto";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import ManagerCampusGrowthHome from "@/components/internship/ManagerCampusGrowthHome";
import { loadCampusGrowth } from "@/lib/internship/campus-growth-data";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function ManagerCampusGrowthPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const params = searchParams ? await searchParams : {};
  const error = first(params.error);
  const ok = first(params.ok);
  const actor = access.actor.isSuperUser ? "supervisor" : "manager";
  const data = await loadCampusGrowth({ actor, actorUserId: access.actor.id });
  const requestedCampus=first(params.campus);
  const requestedTab=first(params.tab);
  const missionRequestIds=Object.fromEntries(data.cards.map(card=>[card.internId,randomUUID()]));
  return (
    <ManagerCampusGrowthHome
      cards={data.cards}
      opportunities={data.opportunities}
      leads={data.leads}
      links={data.links}
      results={data.results}
      missions={data.missions}
      sourceHealth={data.sourceHealth}
      sourceIssues={data.sourceIssues}
      notice={error || ok}
      error={Boolean(error)}
      initialCampus={requestedCampus}
      initialTab={requestedTab}
      missionRequestIds={missionRequestIds}
    />
  );
}
