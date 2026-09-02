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
    ["Pet Parents +", stats.petParents],
    ["Gurus +", stats.gurus],
    ["Referral clicks", stats.referrals],
    ["Social visits", stats.visits],
    ["Social signups", stats.signups],
    ["Conversion", stats.conversion],
  ] as const;

  return (
    <GrowthPageFrame
      title="Analytics"
      detail="County density still lives on the Market Growth map. This page is the Friday scoreboard: signups, not followers."
    >
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {kpis.map(([label, value]) => (
          <div
            key={label}
            className="rounded-[1.35rem] border border-emerald-100 bg-white p-4 shadow-sm"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
              {label}
            </p>
            <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
          </div>
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
