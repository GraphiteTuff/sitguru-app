import { getGrowthHomeStats, listGrowthCampaigns } from "@/lib/admin/growth/data";
import {
  listGrowthInitiatives,
  listGrowthIntelligence,
} from "@/lib/admin/growth/outcomes";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import InternToolkitHome from "@/components/internship/InternToolkitHome";
import InternToolkitToolView from "@/components/internship/InternToolkitToolView";
import { loadInternSectionWorkspace } from "@/lib/internship/intern-section-data";
import { listInternPromoteEvents } from "@/lib/internship/intern-promote-events";
import { INTERN_HOME_TOOLS, type InternHomeToolId } from "@/lib/internship/intern-tools";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

function isTool(value: string): value is InternHomeToolId {
  return INTERN_HOME_TOOLS.some((tool) => tool.id === value);
}

function weekLabel(now = new Date()) {
  const start = new Date(now);
  start.setDate(now.getDate() - 6);
  const fmt = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `This Week (${fmt(start)} – ${fmt(now)}, ${now.getFullYear()})`;
}

export default async function InternToolkitPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  const params = searchParams ? await searchParams : {};
  const requested = first(params.tool);
  const section = await loadInternSectionWorkspace();

  if (isTool(requested)) {
    if (!section) {
      return (
        <div className="mx-auto max-w-lg rounded-[1.75rem] border border-amber-100 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-black text-slate-950">Toolkit needs an assigned intern</h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Brand kit, tracking links, and the market snapshot open on an assigned internship login.
          </p>
        </div>
      );
    }
    const events = await listInternPromoteEvents();
    return (
      <InternToolkitToolView
        data={section.workspace}
        events={events}
        tool={requested}
        preview={Boolean(first(params.view))}
      />
    );
  }

  const [stats, events, campaigns, initiatives, insights] = await Promise.all([
    getGrowthHomeStats(),
    listInternPromoteEvents(),
    listGrowthCampaigns(),
    listGrowthInitiatives(4),
    listGrowthIntelligence(1),
  ]);

  return (
    <InternToolkitHome
      stats={stats}
      weekLabel={weekLabel()}
      events={events}
      campaigns={campaigns}
      initiatives={initiatives}
      insight={insights[0] || null}
    />
  );
}
