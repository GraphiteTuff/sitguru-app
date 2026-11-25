import Link from "next/link";
import { Activity, BadgeCheck, CalendarDays, Handshake, MousePointerClick, QrCode, RefreshCw, UserPlus } from "lucide-react";
import type { ReferralGrowthReport } from "@/lib/referrals/growth-report";

const n = (value: number) => new Intl.NumberFormat("en-US").format(value);
function when(raw: string | null) {
  if (!raw) return "—";
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ReferralGrowthOverview({ report, audience = "admin" }: { report: ReferralGrowthReport; audience?: "admin" | "manager" | "intern" }) {
  const data = [
    { title: "Link Visits", value: report.totals.visits, label: "Tracked non-QR referral events", icon: MousePointerClick },
    { title: "QR Scans", value: report.totals.qr, label: "Recorded QR visits", icon: QrCode },
    { title: "Signups", value: report.totals.signups, label: "Attributed signup captures", icon: UserPlus },
    { title: "First Bookings", value: report.totals.bookings, label: "Attributed booking events", icon: BadgeCheck },
    { title: "Active Codes", value: report.totals.codes, label: "From SitGuru code registry", icon: Activity },
    { title: "Partner Campaigns", value: report.totals.partnerCampaigns, label: "Active partner campaigns", icon: Handshake },
  ];
  return (
    <section id="referral-growth-center" aria-label="Referral Growth Center" className="space-y-4 rounded-[28px] border border-emerald-100 bg-[linear-gradient(180deg,#f3fcf9_0%,#ffffff_45%)] p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">SitGuru Referral & Partner Growth Center</p>
          <h2 className="mt-1 text-2xl font-black !text-slate-950 sm:text-3xl">From shared card to actual care</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
            One operational view of linked referrals, QR scans, captured registrations, bookings and partner activity. Based on recorded events, not forecasts.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs font-black text-emerald-900">
          <CalendarDays size={16} aria-hidden="true" /> Last {report.dateWindowDays} days
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {data.map(item => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="min-w-0 rounded-2xl border border-emerald-100 bg-white p-3.5 shadow-sm">
              <div className="flex items-center gap-2">
                <Icon size={19} className="shrink-0 text-emerald-700" aria-hidden="true" />
                <p className="text-xs font-black text-slate-600">{item.title}</p>
              </div>
              <p className="mt-2 text-3xl font-black tabular-nums !text-emerald-950">{n(item.value)}</p>
              <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">{item.label}</p>
            </div>
          );
        })}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.6fr)]">
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-black !text-slate-950">Referral source performance</h3>
            <span className="text-xs font-bold text-slate-500">Ranked by captured signups</span>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="border-b border-slate-200 bg-emerald-50 text-[11px] font-black uppercase tracking-wider text-emerald-900">
                <tr><th className="p-3">Source / code</th><th className="p-3 text-right">Links</th><th className="p-3 text-right">QR</th><th className="p-3 text-right">Signups</th><th className="p-3 text-right">Bookings</th><th className="p-3 text-right">Last</th></tr>
              </thead>
              <tbody>
                {report.referrers.slice(0, 15).map(row => (
                  <tr key={row.code} className="border-b border-slate-100 last:border-b-0">
                    <td className="p-3"><span className="block font-black text-slate-950">{row.name}</span><span className="text-[11px] font-semibold text-slate-500">{row.type} · {row.code}</span></td>
                    <td className="p-3 text-right tabular-nums text-slate-700">{n(row.visits)}</td><td className="p-3 text-right tabular-nums text-slate-700">{n(row.qr)}</td>
                    <td className="p-3 text-right font-black tabular-nums text-emerald-800">{n(row.signups)}</td>
                    <td className="p-3 text-right font-black tabular-nums text-slate-700">{n(row.bookings)}</td>
                    <td className="p-3 text-right font-semibold text-slate-600">{when(row.lastActivity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {report.referrers.length === 0 ? <p className="p-4 text-sm font-semibold text-slate-600">No referral codes are available from the registry yet.</p> : null}
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-lg font-black !text-slate-950">Partner website & referral activity</h3>
          <p className="mt-1 text-xs font-semibold text-slate-600">Track each clinic or business without confusing visits with signups.</p>
          <div className="mt-3 space-y-2">
            {report.partnerSources.slice(0, 8).map(partner => (
              <div key={partner.code} className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                <p className="text-sm font-black text-emerald-950">{partner.name}</p>
                <p className="mt-1 text-xs font-semibold text-slate-600">{partner.code} · Last activity {when(partner.lastActivity)}</p>
                <p className="mt-2 text-sm font-black tabular-nums text-slate-900">
                  {n(partner.visits)} visits · {n(partner.qr)} QR · {n(partner.signups)} signups · {n(partner.bookings)} bookings
                </p>
              </div>
            ))}
            {!report.partnerSources.length ? <p className="text-sm font-semibold text-slate-600">No partner-linked referral codes yet.</p> : null}
          </div>
          <div className="mt-4 space-y-2">
            {audience === "admin" ? (
              <Link href="/admin/partners/active" className="inline-flex min-h-11 items-center text-sm font-black text-emerald-800 hover:underline">Manage partner marketing links →</Link>
            ) : (
              <Link href={audience === "intern" ? "/intern/growth" : "/manager/outreach"} className="inline-flex min-h-11 items-center text-sm font-black text-emerald-800 hover:underline">{audience === "intern" ? "Back to Growth Home" : "Open partner outreach"} →</Link>
            )}
          </div>
        </section>
      </div>
      <details className="rounded-2xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-black text-emerald-900">Recent referral activity ({report.recent.length})</summary>
        <div className="mt-3 max-h-[380px] space-y-2 overflow-y-auto">
          {report.recent.slice(0, 25).map((event, i) => (
            <div key={event.code+event.type+event.date+i} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-2 text-xs">
              <span className="font-black text-slate-950">{event.type} · {event.code}</span>
              <span className="font-semibold text-slate-600">{event.channel}</span>
              <time className="font-semibold text-slate-500">{when(event.date)}</time>
            </div>
          ))}
          {!report.recent.length ? <p className="text-sm text-slate-600">No recorded activity in this period.</p> : null}
        </div>
      </details>
      {report.warnings.length ? (
        <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-950">
          Some data sources require attention: {report.warnings.join(" · ")}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-600">
        <span>Link/QR counts represent recorded visits, not unique people. Financial rewards require separate verification.</span>
        <span className="flex items-center gap-1"><RefreshCw size={14} /> Updated {new Date(report.generatedAt).toLocaleString("en-US")}; refresh page for new records</span>
      </div>
    </section>
  );
}
