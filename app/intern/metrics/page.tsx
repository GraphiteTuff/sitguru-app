import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { getGrowthHomeStats, listGrowthContent } from "@/lib/admin/growth/data";
import MetricsBoard from "@/components/portal/MetricsBoard";

export const dynamic = "force-dynamic";

export default async function InternMetricsPage() {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  const [stats, content] = await Promise.all([getGrowthHomeStats(), listGrowthContent()]);
  return (
    <MetricsBoard
      audience="intern"
      stats={stats}
      content={content.slice(0, 4).map((item) => ({
        title: item.title,
        detail: [item.platform, item.status].filter(Boolean).join(" · "),
      }))}
    />
  );
}
