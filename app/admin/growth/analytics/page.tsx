import {
  BarChart3,
  CheckCircle2,
  Megaphone,
  MousePointerClick,
  PawPrint,
  Users,
} from "lucide-react";
import { AdminThemeCard } from "@/components/admin/AdminThemeCard";
import { requireGrowthPortal } from "@/lib/admin/growth/access";
import { submitFridayReportAction } from "@/lib/admin/growth/actions";
import { getGrowthHomeStats, listGrowthCampaigns } from "@/lib/admin/growth/data";
import {
  GrowthCard,
  GrowthPageFrame,
  StatusPill,
} from "@/components/admin/growth/GrowthPageFrame";

export const dynamic = "force-dynamic";

export default async function GrowthAnalyticsPage() {
  const access = await requireGrowthPortal();
  if (!access.ok) return access.ui;

  const [stats, campaigns] = await Promise.all([
    getGrowthHomeStats(),
    listGrowthCampaigns(),
  ]);

  const kpis = [
    { label: "Pet Parents +", value: String(stats.petParents), helper: "New this week", tone: "emerald" as const, icon: <PawPrint size={18} /> },
    { label: "Gurus +", value: String(stats.gurus), helper: "New this week", tone: "sky" as const, icon: <Users size={18} /> },
    { label: "Referral clicks", value: String(stats.referrals), helper: "Links used", tone: "violet" as const, icon: <MousePointerClick size={18} /> },
    { label: "Social visits", value: String(stats.visits), helper: "Clicks + views", tone: "sky" as const, icon: <Megaphone size={18} /> },
    { label: "Social signups", value: String(stats.signups), helper: "Attributed", tone: "emerald" as const, icon: <CheckCircle2 size={18} /> },
    { label: "Conversion", value: String(stats.conversion), helper: "Signups ÷ visits", tone: "slate" as const, icon: <BarChart3 size={18} /> },
  ];

  return (
    <GrowthPageFrame
      title="Analytics"
      detail="County density still lives on the Market Growth map. This page is the Friday scoreboard: signups, not followers."
    >
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {kpis.map((tile) => (
          <AdminThemeCard
            key={tile.label}
            label={tile.label}
            value={tile.value}
            helper={tile.helper}
            tone={tile.tone}
            icon={tile.icon}
          />
        ))}
      </section>

      <GrowthCard>
        <h2 className="text-lg font-black text-slate-950">Campaigns</h2>
        <div className="mt-3 space-y-2">
          {campaigns.slice(0, 8).map((campaign) => (
            <div
              key={campaign.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-3"
            >
              <div>
                <p className="font-black text-slate-950">{campaign.name}</p>
                <p className="text-xs font-semibold text-slate-500">
                  {campaign.channelLabel}
                </p>
              </div>
              <StatusPill value={campaign.status} />
            </div>
          ))}
        </div>
      </GrowthCard>

      <GrowthCard>
        <h2 className="text-lg font-black text-slate-950">Friday report</h2>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          One page. Posts, what worked, what did not, and three bullets for next week.
        </p>
        <form action={submitFridayReportAction} className="mt-4 space-y-3">
          <input
            name="weekLabel"
            defaultValue="This week"
            className="min-h-12 w-full rounded-2xl border border-emerald-100 px-4 text-sm font-semibold"
          />
          <textarea
            name="posts"
            required
            rows={3}
            placeholder="Posts / Reels / Stories this week"
            className="w-full rounded-2xl border border-emerald-100 px-4 py-3 text-sm font-semibold"
          />
          <textarea
            name="best"
            rows={2}
            placeholder="Best campaign"
            className="w-full rounded-2xl border border-emerald-100 px-4 py-3 text-sm font-semibold"
          />
          <textarea
            name="worst"
            rows={2}
            placeholder="Worst campaign / blocker"
            className="w-full rounded-2xl border border-emerald-100 px-4 py-3 text-sm font-semibold"
          />
          <textarea
            name="next"
            required
            rows={3}
            placeholder="Next week — 3 bullets"
            className="w-full rounded-2xl border border-emerald-100 px-4 py-3 text-sm font-semibold"
          />
          <button
            type="submit"
            className="min-h-12 w-full rounded-2xl text-sm font-black text-white sm:w-auto sm:px-6"
            style={{ background: "#0D5C3A" }}
          >
            Send Friday report
          </button>
        </form>
      </GrowthCard>
    </GrowthPageFrame>
  );
}
