import Link from "next/link";
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
    <div className="space-y-4">
      <Link href="/intern/social-intelligence" className="inline-flex min-h-11 items-center rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] px-4 text-sm font-black text-[#0F2744] shadow-sm hover:bg-[#DBEAFE]">View my Content Studio performance and leaderboards →</Link>
      <GrowthCenterInsightsBoard
        snapshot={snapshot}
        userId={access.actor.id}
        exportHref={`/api/growth-center/v2/export?${exportQuery.toString()}`}
      />
    </div>
  );
}
