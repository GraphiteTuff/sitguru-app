import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { ConversionPanel, GrowthFrame } from "@/components/manager/GrowthWorkPanels";
import { loadScorecard } from "@/lib/manager-growth/data";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function ConversionsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const params = searchParams ? await searchParams : {};
  const preset = first(params.range) || "week";
  const card = await loadScorecard(preset);
  return (
    <GrowthFrame title="Growth & Conversions" subtitle="What happened, what it means, and whether it changed a registration or a booking." notice={first(params.ok)}>
      <form className="flex flex-wrap gap-2" method="get">
        <select name="range" defaultValue={preset} className="min-h-11 rounded-full border border-slate-200 bg-white px-3 text-sm font-bold">
          <option value="week">This week</option>
          <option value="previous">Previous week</option>
          <option value="month">This month</option>
          <option value="previous-month">Previous month</option>
        </select>
        <button className="min-h-11 rounded-full bg-[#2563EB] px-4 text-sm font-bold !text-white">Update</button>
      </form>
      <ConversionPanel card={card} />
    </GrowthFrame>
  );
}
