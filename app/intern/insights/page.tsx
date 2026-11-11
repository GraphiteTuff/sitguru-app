import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { parseFiltersFromSearch } from "@/lib/growth-center-v2/date-range";
import { loadGrowthCenterSnapshot } from "@/lib/growth-center-v2/snapshot";
import GrowthCenterInsightsBoard from "@/components/growth-center-v2/GrowthCenterInsightsBoard";

export const dynamic = "force-dynamic";

export default async function InternInsightsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  const params = searchParams ? await searchParams : {};
  const filters = parseFiltersFromSearch(params);
  const snapshot = await loadGrowthCenterSnapshot({
    audience: "intern",
    filters,
    internUserId: access.actor.id,
  });
  const exportQuery = new URLSearchParams();
  exportQuery.set("preset", filters.preset);
  exportQuery.set("platform", filters.platform);
  exportQuery.set("audience", filters.audience);

  return (
    <GrowthCenterInsightsBoard
      snapshot={snapshot}
      userId={access.actor.id}
      exportHref={`/api/growth-center/v2/export?${exportQuery.toString()}`}
    />
  );
}
