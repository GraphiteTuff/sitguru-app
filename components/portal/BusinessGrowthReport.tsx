import Link from "next/link";
import { BarChart3, CalendarDays, Megaphone, PawPrint, Users } from "lucide-react";
import DeskPageHero from "@/components/manager/DeskPageHero";
import { DESK_UI } from "@/lib/portal/desk-ui";
import type { GrowthCampaign, GrowthHomeStats } from "@/lib/admin/growth/data";

export default function BusinessGrowthReport({
  stats,
  campaigns,
  audience,
  campus,
}: {
  stats: GrowthHomeStats;
  campaigns: GrowthCampaign[];
  audience: "manager" | "intern";
  campus?: {
    campuses: number;
    campaigns: number;
    visits: number;
    scans: number;
    leads: number;
    petParents: number;
    guruApplications: number;
    events: number;
    topCampus: string;
    topCampaign: string;
  } | null;
}) {
  const base = audience === "manager" ? "/manager" : "/intern";
  const cards = [
    { label: "Pet Parents", value: stats.petParents, trend: stats.trends.petParents.label, tone: "bg-[#ECFDF5] text-[#047857]", icon: Users },
    { label: "Gurus", value: stats.gurus, trend: stats.trends.gurus.label, tone: "bg-[#EFF6FF] text-[#1D4ED8]", icon: PawPrint },
    { label: "Ambassadors", value: stats.ambassadors, trend: stats.trends.ambassadors.label, tone: "bg-[#F5F3FF] text-[#6D28D9]", icon: Megaphone },
    { label: "Events", value: stats.campaigns, trend: stats.trends.campaigns.label, tone: "bg-[#FFF7ED] text-[#C2410C]", icon: CalendarDays },
    { label: "SitGuru Fees", value: 0, trend: "Not on this scoreboard", tone: "bg-[#FFF1F2] text-[#BE123C]", icon: PawPrint },
  ];
  const maxPeople = Math.max(stats.petParents, stats.gurus, stats.ambassadors, 1);

  return (
    <div className="space-y-4 pb-28 lg:pb-8">
      <DeskPageHero
        icon={<BarChart3 size={22} />}
        title="Business Growth Report"
        subtitle="See how SitGuru is growing, where we are making an impact, and what is next."
        banner={audience === "intern" ? "intern" : "manager"}
        quote={"Learn. Create.\nMake an impact.\nHappier pets.\nBrighter communities."}
      />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <article key={card.label} className={`rounded-2xl p-4 ${card.tone}`}>
            <card.icon size={18} />
            <p className="mt-2 text-3xl font-black text-[#0F2744]">{card.value}</p>
            <p className="text-sm font-black">{card.label}</p>
            <p className="text-xs font-semibold">{card.trend} · this week</p>
          </article>
        ))}
      </section>
      <section className="grid gap-4 xl:grid-cols-3">
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="text-lg font-black text-[#0F2744]">User Growth</h2>
          <div className="mt-4 flex h-40 items-end gap-3">
            {[
              ["Pet Parents", stats.petParents, "#22C55E"],
              ["Gurus", stats.gurus, "#3B82F6"],
              ["Ambassadors", stats.ambassadors, "#A855F7"],
            ].map(([label, value, color]) => (
              <div key={String(label)} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-28 w-full items-end"><div className="w-full rounded-t-lg" style={{ height: `${Math.max(8, (Number(value) / maxPeople) * 100)}%`, background: String(color) }} /></div>
                <span className="text-[10px] font-bold text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        </article>
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="text-lg font-black text-[#0F2744]">Events Growth</h2>
          <p className="mt-6 text-4xl font-black text-[#0F2744]">{stats.campaigns}</p>
          <p className="text-sm font-semibold text-slate-500">Active campaigns on the desk. {stats.trends.campaigns.label} versus last week.</p>
          <Link href={audience === "manager" ? "/manager/campaigns" : "/intern/growth"} className="mt-4 inline-flex text-sm font-bold text-[#2563EB]">View campaigns →</Link>
        </article>
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="text-lg font-black text-[#0F2744]">Scoreboard</h2>
          <ul className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
            <li>Visits {stats.visits} · {stats.trends.visits.label}</li>
            <li>Signups {stats.signups} · {stats.trends.signups.label}</li>
            <li>Referrals {stats.referrals} · {stats.trends.referrals.label}</li>
            <li>Conversion {stats.conversion}</li>
            <li>Waiting on review {stats.pendingReview}</li>
          </ul>
        </article>
      </section>
      {campus ? (
        <section className={`${DESK_UI.card} p-4`}>
          <h2 className="text-lg font-black text-[#0F2744]">Campus Growth</h2>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4 text-sm">
            {[
              ["Campuses active", campus.campuses],
              ["Campaigns", campus.campaigns],
              ["Tracked visits", campus.visits],
              ["QR scans", campus.scans],
              ["Leads", campus.leads],
              ["Pet Parent registrations", campus.petParents],
              ["Guru applications", campus.guruApplications],
              ["Events", campus.events],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl bg-[#F8FAFC] px-3 py-2">
                <dt className="text-xs font-semibold text-slate-500">{label}</dt>
                <dd className="font-black text-[#0F2744]">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm font-semibold text-slate-600">Top campus: {campus.topCampus || "None yet"}. Top campaign: {campus.topCampaign || "None yet"}.</p>
        </section>
      ) : null}
      <section className="grid gap-4 lg:grid-cols-3">
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="text-lg font-black text-[#0F2744]">Recent Milestones</h2>
          <ul className="mt-3 space-y-2">
            {(campaigns.length ? campaigns.slice(0, 5) : []).map((campaign) => (
              <li key={campaign.id} className="flex items-center justify-between text-sm">
                <span className="font-bold text-[#0F2744]">{campaign.name}</span>
                <span className="text-xs font-semibold text-slate-500">{campaign.status}</span>
              </li>
            ))}
            {!campaigns.length ? <li className="text-sm text-slate-500">Campaign milestones will list here.</li> : null}
          </ul>
        </article>
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="text-lg font-black text-[#0F2744]">What&apos;s Next</h2>
          <ol className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
            <li>1. Review this week&apos;s check-ins.</li>
            <li>2. Log and approve hours.</li>
            <li>3. Publish the next community post.</li>
            <li>4. Share one upcoming pet event.</li>
          </ol>
        </article>
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="text-lg font-black text-[#0F2744]">Quick Actions</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link href={`${base}/metrics`} className="rounded-2xl bg-[#ECFDF5] px-3 py-3 text-center text-sm font-bold text-[#047857]">View Metrics</Link>
            <Link href={`${base}/results`} className="rounded-2xl bg-[#EFF6FF] px-3 py-3 text-center text-sm font-bold text-[#1D4ED8]">Live Results</Link>
            <Link href={`${base}/calendar`} className="rounded-2xl bg-[#F5F3FF] px-3 py-3 text-center text-sm font-bold text-[#6D28D9]">Calendar</Link>
            <Link href={`${base}/messages`} className="rounded-2xl bg-[#FFF7ED] px-3 py-3 text-center text-sm font-bold text-[#C2410C]">Share Update</Link>
          </div>
        </article>
      </section>
    </div>
  );
}
