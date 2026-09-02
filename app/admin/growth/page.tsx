import Link from "next/link";
import { requireGrowthPortal } from "@/lib/admin/growth/access";
import { getGrowthHomeStats, listGrowthCampaigns, listGrowthContent } from "@/lib/admin/growth/data";
import {
  GrowthCard,
  GrowthPageFrame,
  GrowthPrimaryLink,
  StatusPill,
} from "@/components/admin/growth/GrowthPageFrame";

export const dynamic = "force-dynamic";

export default async function AdminGrowthHomePage() {
  const access = await requireGrowthPortal();
  if (!access.ok) return access.ui;

  const [stats, campaigns, content] = await Promise.all([
    getGrowthHomeStats(),
    listGrowthCampaigns(),
    listGrowthContent(),
  ]);

  const tiles = [
    { label: "Pet Parents +", value: String(stats.petParents), helper: "New accounts this week" },
    { label: "Gurus +", value: String(stats.gurus), helper: "New Guru profiles this week" },
    { label: "Referral clicks", value: String(stats.referrals), helper: "Referral links used" },
    { label: "Social visits", value: String(stats.visits), helper: "Campaign clicks + views" },
    { label: "Social signups", value: String(stats.signups), helper: "Attributed through tracking" },
    { label: "Conversion", value: stats.conversion, helper: "Signups ÷ visits" },
  ];

  return (
    <GrowthPageFrame
      kicker={access.actor.isSuperUser ? "Super Admin · Growth Portal" : "Social & Community"}
      title="Turn SitGuru stories into Pet Parents."
      detail="Followers are not the scoreboard. Create a post, copy the tracking link, publish in Meta or TikTok, and watch signups here."
      action={<GrowthPrimaryLink href="/admin/growth/create">+ Create</GrowthPrimaryLink>}
    >
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="rounded-[1.35rem] border border-emerald-100 bg-white p-4 shadow-sm"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
              {tile.label}
            </p>
            <p className="mt-2 text-2xl font-black text-slate-950">{tile.value}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{tile.helper}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <GrowthCard>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-slate-950">Active campaigns</h2>
            <Link href="/admin/growth/campaigns" className="text-sm font-black text-emerald-800">
              All →
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {campaigns.slice(0, 4).map((campaign) => (
              <Link
                key={campaign.id}
                href={`/admin/growth/campaigns/${campaign.id}`}
                className="block rounded-2xl border border-slate-100 bg-slate-50 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-black text-slate-950">{campaign.name}</p>
                  <StatusPill value={campaign.status} />
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {campaign.channelLabel}
                  {campaign.market ? ` · ${campaign.market}` : ""}
                </p>
              </Link>
            ))}
            {campaigns.length === 0 ? (
              <p className="text-sm font-semibold text-slate-500">
                No campaigns yet. Create one and copy the tracking link.
              </p>
            ) : null}
          </div>
        </GrowthCard>

        <GrowthCard>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-slate-950">This week’s content</h2>
            <Link href="/admin/growth/content" className="text-sm font-black text-emerald-800">
              Calendar →
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {content.slice(0, 4).map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-black text-slate-950">{item.title}</p>
                  <StatusPill value={item.status} />
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {item.platform} · {item.audience}
                </p>
              </div>
            ))}
            {content.length === 0 ? (
              <p className="text-sm font-semibold text-slate-500">
                Draft a Guru, event, or Pet Parent post to fill the week.
              </p>
            ) : null}
          </div>
        </GrowthCard>
      </div>

      <GrowthCard>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
          Quick start
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {[
            ["/admin/growth/gurus", "Promote a Guru"],
            ["/admin/growth/events", "Promote an event"],
            ["/admin/growth/analytics", "Friday report"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-950"
            >
              {label}
            </Link>
          ))}
        </div>
      </GrowthCard>
    </GrowthPageFrame>
  );
}
