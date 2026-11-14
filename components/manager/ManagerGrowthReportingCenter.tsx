import Link from "next/link";
import { BarChart3, CalendarDays, CheckCircle2, FileText, Info, Link2, ShieldCheck } from "lucide-react";
import DeskPageHero from "@/components/manager/DeskPageHero";
import { DESK_UI } from "@/lib/portal/desk-ui";
import { saveManagerGrowthReport } from "@/lib/growth-center-v2/report-actions";
import {
  ANALYTICS_RESULTS_SHAREPOINT_URL,
  ANALYTICS_RESULTS_TEAMS_URL,
} from "@/lib/growth-center-v2/report-sharepoint";
import { EMPTY_REPORT_REVIEW } from "@/lib/growth-center-v2/report-document";
import type { SavedGrowthReport } from "@/lib/growth-center-v2/report-document";
import type { GrowthReportPeriod } from "@/lib/growth-center-v2/report-periods";
import type { GrowthCenterSnapshot, MetricValue } from "@/lib/growth-center-v2/types";

function valueOf(kpi: MetricValue | undefined, prior = false) {
  if (!kpi) return "Unavailable";
  const value = prior ? kpi.prior : kpi.value;
  if (value === null || (!prior && kpi.availability === "unavailable")) return "Unavailable";
  return kpi.unit === "percent" ? value.toFixed(1) + "%" : value.toLocaleString("en-US");
}

function field(label: string, name: string, value: string, description: string, editable: boolean) {
  return (
    <label key={name} className="block space-y-1.5">
      <span className="block text-sm font-black text-[#0F2744]">{label}</span>
      <span className="block text-xs font-medium leading-5 text-slate-500">{description}</span>
      <textarea
        name={name}
        defaultValue={value}
        readOnly={!editable}
        rows={3}
        maxLength={6000}
        placeholder={editable ? "Add your observation or recommendation here..." : "Not yet provided by Ava"}
        className="min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 read-only:bg-slate-50"
      />
    </label>
  );
}

export default function ManagerGrowthReportingCenter({
  period,
  snapshot,
  saved,
  storeState,
  canEdit,
  flash,
}: {
  period: GrowthReportPeriod;
  snapshot: GrowthCenterSnapshot;
  saved: SavedGrowthReport | null;
  storeState: "connected" | "not_configured" | "unavailable";
  canEdit: boolean;
  flash: { ok?: string; error?: string };
}) {
  const review = saved?.review || EMPTY_REPORT_REVIEW;
  const isSubmitted = saved?.status === "submitted";
  const editable = canEdit && !isSubmitted;
  const topMetrics = [
    "pet_parent_registrations",
    "guru_registrations",
    "ambassador_registrations",
    "booking_requests",
    "referral_clicks",
    "campaign_visits",
    "campaign_signups",
    "registration_conversion_rate",
  ];
  const metrics = topMetrics.map((id) => snapshot.kpis.find((item) => item.id === id)).filter(
    (item): item is MetricValue => Boolean(item),
  );
  const formatTime = (iso: string) => new Date(iso).toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
  const reportLink = saved?.sharePointUrl || ANALYTICS_RESULTS_SHAREPOINT_URL;
  const socialUnavailable = snapshot.social.filter((platform) => platform.status !== "connected");
  const csvHref = "/api/growth-center/v2/export?preset=custom&start=" +
    encodeURIComponent(period.startDate) + "&end=" + encodeURIComponent(period.endDate);

  return (
    <div className="space-y-5">
      <DeskPageHero
        icon={<BarChart3 size={22} />}
        title="Growth & Performance Reports"
        subtitle="Daily, weekly and monthly reporting connected to SitGuru Growth Insights and Microsoft 365."
        banner="manager"
        quote={"Measure. Learn.\nImprove. Repeat.\nGrow together."}
      />
      <section className={"rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6"}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-blue-700">Reporting period</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-[#0F2744] sm:text-3xl">{period.label}</h1>
            <p className="mt-2 text-sm font-semibold text-slate-600">{period.startDate} through {period.endDate} · Eastern Time</p>
            <p className="mt-1 text-xs text-slate-500">Measured at {formatTime(snapshot.capturedAt)} · {period.completed ? "Period complete" : "Period in progress"}</p>
          </div>
          <span className={"rounded-full px-3 py-2 text-xs font-black " +
            (isSubmitted ? "bg-emerald-100 text-emerald-800" : saved ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-700")}>
            {isSubmitted ? "Submitted to CEO" : saved ? "Draft in Microsoft 365" : "Live preview · not saved"}
          </span>
        </div>
        <form method="get" className="mt-5 grid gap-3 rounded-2xl bg-[#F1F5FA] p-4 sm:grid-cols-[1fr_1fr_auto]">
          <label className="block">
            <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">Report type</span>
            <select name="period" defaultValue={period.cadence} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900">
              <option value="daily">Daily snapshot</option>
              <option value="weekly">Weekly growth report</option>
              <option value="monthly">Monthly performance report</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">Ending date (weekly dates align to Sunday)</span>
            <input type="date" name="end" defaultValue={period.endDate} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900" />
          </label>
          <button type="submit" className="min-h-11 self-end rounded-xl bg-[#0F2744] px-5 py-2 text-sm font-black text-white">View report</button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
          <Link href="/manager/metrics" className="rounded-full border border-slate-200 bg-white px-3 py-2 text-blue-800">Metrics</Link>
          <Link href="/manager/insights" className="rounded-full border border-slate-200 bg-white px-3 py-2 text-blue-800">Growth Insights</Link>
          <Link href="/manager/results" className="rounded-full border border-slate-200 bg-white px-3 py-2 text-blue-800">Live Results</Link>
          <a href={csvHref} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-blue-800">Download KPI CSV</a>
          <a href={reportLink} target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 bg-white px-3 py-2 text-blue-800">Microsoft 365 reports</a>
        </div>
      </section>

      {flash.ok ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">{flash.ok}</p> : null}
      {flash.error ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-900">{flash.error}</p> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Business outcomes and activity">
        {metrics.map((kpi) => (
          <article key={kpi.id} className={"rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"}>
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">{kpi.label}</p>
            <p className="mt-2 text-3xl font-black text-[#0F2744]">{valueOf(kpi)}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Previous comparable period: {valueOf(kpi, true)}</p>
            <p className="mt-2 text-xs text-slate-500">Source: {kpi.source}</p>
            {kpi.note ? <p className="mt-1 text-xs text-amber-800">{kpi.note}</p> : null}
          </article>
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className={DESK_UI.card + " p-5"}>
          <h2 className="text-lg font-black text-[#0F2744]">Campaign performance</h2>
          <p className="mt-1 text-xs text-slate-500">Tracked visits and attributed registrations, not assumed marketing impact.</p>
          <div className="mt-4 space-y-2">
            {snapshot.campaigns.slice(0, 6).map((campaign) => (
              <div key={campaign.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-3">
                <div><p className="text-sm font-bold text-[#0F2744]">{campaign.name}</p><p className="text-xs text-slate-500">{campaign.channel}</p></div>
                <p className="text-xs font-black text-slate-700">{campaign.visits} visits · {campaign.signups} signups</p>
              </div>
            ))}
            {!snapshot.campaigns.length ? <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">No attributed campaigns for this period.</p> : null}
          </div>
        </section>
        <section className={DESK_UI.card + " p-5"}>
          <h2 className="text-lg font-black text-[#0F2744]">Team & community signals</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              ["Community submissions", snapshot.community.submissions],
              ["Campus leads", snapshot.campus.leads],
              ["Campus visits", snapshot.campus.visits],
              ["Content calendar items", snapshot.content.length],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-500">{label}</p>
                <p className="mt-1 text-xl font-black text-[#0F2744]">{value == null ? "Unavailable" : value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-blue-50 p-3">
            <p className="text-xs font-black text-blue-900">Evidence-based recommendations</p>
            {snapshot.insights.slice(0, 3).map((insight) => (
              <p key={insight.id} className="mt-2 text-xs leading-5 text-blue-900">
                <strong>{insight.title}.</strong> {insight.nextAction}
              </p>
            ))}
          </div>
        </section>
      </div>

      <section className={DESK_UI.card + " p-5"}>
        <h2 className="text-lg font-black text-[#0F2744]">Social analytics source health</h2>
        <p className="mt-1 text-xs font-semibold text-slate-600">
          Official API data, manual metrics and unavailable data are labeled separately. Missing data never counts as zero.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {snapshot.social.map((platform) => (
            <div key={platform.platform} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-black text-[#0F2744]">{platform.label}</p>
              <p className={"mt-1 text-xs font-black " + (platform.status === "connected" ? "text-emerald-700" : "text-amber-800")}>{platform.status.replace(/_/g, " ")}</p>
              <p className="mt-2 text-xs text-slate-600">{platform.followers === null ? "Followers: unavailable" : "Tracked followers: " + platform.followers}</p>
              <p className="mt-1 text-[11px] text-slate-500">{platform.lastSyncedAt ? "Updated " + formatTime(platform.lastSyncedAt) : "No verified sync timestamp"}</p>
            </div>
          ))}
        </div>
        {socialUnavailable.length > 0 ? (
          <p className="mt-3 flex items-start gap-2 text-xs font-semibold text-amber-900">
            <Info size={16} className="shrink-0" /> Some social metrics are manual or disconnected. These figures are not verified API engagement totals.
          </p>
        ) : null}
      </section>

      <section className={DESK_UI.card + " p-5 sm:p-6"}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-[#0F2744]">Ava's assessment & leadership submission</h2>
            <p className="mt-1 text-sm text-slate-600">SitGuru measures outcomes; Ava explains what happened, what was learned, and what happens next.</p>
          </div>
          {isSubmitted ? <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700"><CheckCircle2 size={16} /> Finalized</span> : null}
        </div>
        <form action={saveManagerGrowthReport} className="mt-5 space-y-4">
          <input type="hidden" name="period" value={period.cadence} />
          <input type="hidden" name="end" value={period.endDate} />
          <div className="grid gap-4 lg:grid-cols-2">
            {field("What worked?", "worked", review.worked, "Campaigns, outreach, or content supported by observed results.", editable)}
            {field("What did not work, and why?", "didntWork", review.didntWork, "Challenges, failed experiments, missing attribution, or blockers.", editable)}
            {field("What did we learn?", "learned", review.learned, "Explain your interpretation separately from measured facts.", editable)}
            {field("What should we do next?", "nextSteps", review.nextSteps, "Specific actions, owners, target dates, and decisions needed.", editable)}
            {field("Interns & team progress", "internProgress", review.internProgress, "Assignments, review status, milestones, and team accomplishments.", editable)}
            {field("Additional notes for CEO", "additionalNotes", review.additionalNotes, "Risks, partnership updates, and requests for support.", editable)}
          </div>
          {editable ? (
            <div className="flex flex-wrap gap-3">
              <button type="submit" name="intent" value="save" className="min-h-11 rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-black text-white">
                Save draft to Microsoft 365
              </button>
              <button type="submit" name="intent" value="submit" disabled={!period.completed} className="min-h-11 rounded-xl bg-[#0D5C3A] px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
                Submit final report to CEO
              </button>
            </div>
          ) : (
            <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
              {isSubmitted ? "Submitted " + formatTime(saved!.submittedAt || saved!.updatedAt) + " by " + (saved!.submittedBy || "Growth Manager") + ". Locked from further automated changes." :
              "CEO view is read-only. The Growth Manager can save and submit the report from her account."}
            </p>
          )}
          {!period.completed ? <p className="text-xs font-semibold text-amber-800">The period is still in progress. Ava can save drafts now and submit the final after the ending date.</p> : null}
        </form>
      </section>

      <section className={DESK_UI.card + " p-5"}>
        <h2 className="text-lg font-black text-[#0F2744]">Microsoft 365 and report archive</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <FileText size={20} className="text-blue-700" />
            <p className="mt-2 text-sm font-black text-[#0F2744]">SharePoint filing</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">{period.folderSegments.join(" / ")}</p>
            <a href={reportLink} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-black text-blue-700 underline">Open saved report or library</a>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <Link2 size={20} className="text-blue-700" />
            <p className="mt-2 text-sm font-black text-[#0F2744]">Analytics and Results in Teams</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">Weekly discussion and lessons learned. Channel notifications require a separate authorized workflow.</p>
            <a href={ANALYTICS_RESULTS_TEAMS_URL} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-black text-blue-700 underline">Open Teams channel</a>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <ShieldCheck size={20} className="text-blue-700" />
            <p className="mt-2 text-sm font-black text-[#0F2744]">Storage health</p>
            <p className={"mt-1 text-xs font-bold " + (storeState === "connected" ? "text-emerald-700" : "text-amber-800")}>
              {storeState === "connected" ? "SharePoint connection configured" : storeState === "not_configured" ? "Microsoft Graph not configured" : "Microsoft 365 status needs attention"}
            </p>
            <p className="mt-2 text-xs text-slate-600">{saved ? "Last file update: " + formatTime(saved.updatedAt) : "This period has no saved report yet."}</p>
          </div>
        </div>
        {snapshot.coverageNotes.length > 0 ? (
          <details className="mt-4 rounded-xl border border-slate-200 p-3">
            <summary className="cursor-pointer text-xs font-black text-slate-700">View data limitations & source notes</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-slate-600">
              {snapshot.coverageNotes.map((note, i) => <li key={i}>{note}</li>)}
            </ul>
          </details>
        ) : null}
        <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <CalendarDays size={14} /> Reports are filed using consistent Eastern-time period-end dates. Automatic drafts never overwrite submitted reports.
        </p>
      </section>
    </div>
  );
}
