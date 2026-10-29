import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import InternCampusGrowthHome from "@/components/internship/InternCampusGrowthHome";
import { loadCampusGrowth } from "@/lib/internship/campus-growth-data";
import { findInternByAccount } from "@/lib/internship/queries";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function InternCampusEventPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  const params = searchParams ? await searchParams : {};
  const intern = await findInternByAccount({ userId: access.actor.id, email: access.actor.email });
  const data = await loadCampusGrowth({
    actor: "intern",
    actorUserId: access.actor.id,
    actorInternId: intern?.id,
  });
  return (
    <InternCampusGrowthHome
      card={data.cards[0] || null}
      opportunities={data.opportunities}
      leads={data.leads}
      links={data.links}
      missions={data.missions}
      eventMode
      notice={first(params.error) || first(params.ok)}
      error={Boolean(first(params.error))}
    />
  );
}
