import Link from "next/link";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { parseFiltersFromSearch } from "@/lib/growth-center-v2/date-range";
import { loadGrowthCenterSnapshot } from "@/lib/growth-center-v2/snapshot";
import GrowthCenterInsightsBoard from "@/components/growth-center-v2/GrowthCenterInsightsBoard";

export const dynamic = "force-dynamic";

export default async function InternMetricsPage({
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
      <nav aria-label="Intern social reporting" className="flex flex-wrap gap-2 rounded-2xl border border-[#D1EADD] bg-[#F0FDF4] p-4">
        <span aria-current="page" className="inline-flex min-h-11 items-center rounded-xl bg-[#0F2744] px-4 text-sm font-black text-white">My Metrics</span>
        <Link href="/intern/social-intelligence" className="inline-flex min-h-11 items-center rounded-xl bg-[#2563EB] px-4 text-sm font-black text-white">My Social Intelligence</Link>
        <Link href="/intern/community-studio/guru-match" className="inline-flex min-h-11 items-center rounded-xl border border-[#D1EADD] bg-white px-4 text-sm font-black text-[#0D5C3A]">Guru Match &amp; Share</Link>
        <Link href="/intern/content" className="inline-flex min-h-11 items-center rounded-xl border border-[#DBEAFE] bg-white px-4 text-sm font-black text-[#0F2744]">Create Content</Link>
      </nav>
      <GrowthCenterInsightsBoard
      snapshot={snapshot}
      userId={access.actor.id}
      exportHref={`/api/growth-center/v2/export?${exportQuery.toString()}`}
      />
    </div>
  );
}
