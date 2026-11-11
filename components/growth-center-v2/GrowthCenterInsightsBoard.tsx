"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Download,
  Lightbulb,
  LineChart,
  Link2,
  Megaphone,
  PawPrint,
  RefreshCw,
  Target,
  Users,
} from "lucide-react";
import DeskPageHero from "@/components/manager/DeskPageHero";
import { useWorkspaceLiveSync } from "@/hooks/useWorkspaceLiveSync";
import { DESK_UI } from "@/lib/portal/desk-ui";
import { GROWTH_CHART_COLORS, GROWTH_KPI_TONES } from "@/lib/growth-center-v2/colors";
import type { GrowthAudience, GrowthCenterSnapshot } from "@/lib/growth-center-v2/types";

const PRESETS = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "last_7", label: "Last 7 days" },
  { id: "last_28", label: "Last 28 days" },
  { id: "last_90", label: "Last 90 days" },
  { id: "this_month", label: "This month" },
  { id: "last_month", label: "Last month" },
] as const;

const VIEWS = [
  { id: "overview", label: "Overview" },
  { id: "insights", label: "Insights" },
  { id: "social", label: "Social" },
  { id: "campaigns", label: "Campaigns" },
  { id: "content", label: "Content" },
  { id: "community", label: "Community" },
  { id: "goals", label: "Weekly Goals" },
  { id: "reports", label: "Reports" },
] as const;

function toneFor(id: string) {
  if (id.includes("guru")) return GROWTH_KPI_TONES.guru;
  if (id.includes("pet_parent") || id.includes("booking")) return GROWTH_KPI_TONES.petParent;
  if (id.includes("ambassador") || id.includes("community")) return GROWTH_KPI_TONES.community;
  if (id.includes("social") || id.includes("referral")) return GROWTH_KPI_TONES.social;
  if (id.includes("campaign") || id.includes("visit") || id.includes("signup"))
    return GROWTH_KPI_TONES.campaign;
  if (id.includes("conversion")) return GROWTH_KPI_TONES.conversion;
  return GROWTH_KPI_TONES.goal;
}

function formatMetric(value: number | null, unit: string, availability: string) {
  if (availability === "unavailable" || value == null) return "—";
  if (unit === "percent") return `${value.toFixed(1)}%`;
  return value.toLocaleString("en-US");
}

function severityStyles(severity: string) {
  if (severity === "positive") return "border-emerald-200 bg-[#F0FDF4]";
  if (severity === "watch") return "border-amber-200 bg-[#FFFBEB]";
  if (severity === "opportunity") return "border-sky-200 bg-[#EFF6FF]";
  return "border-slate-200 bg-white";
}

export default function GrowthCenterInsightsBoard({
  snapshot,
  userId,
  exportHref,
}: {
  snapshot: GrowthCenterSnapshot;
  userId?: string | null;
  exportHref: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [filterOpen, setFilterOpen] = useState(false);
  const view = searchParams.get("view") || "overview";
  const sync = useWorkspaceLiveSync({
    userId,
    scopes: ["growth", "workspace"],
    showStatus: true,
    debounceMs: 800,
  });

  const audience: GrowthAudience = snapshot.audience;
  const maxBar = Math.max(
    ...snapshot.kpis
      .filter((k) => k.unit === "count" && k.value != null)
      .map((k) => k.value || 0),
    1,
  );

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all" || (key === "preset" && value === "last_7")) {
      if (key === "preset" && value === "last_7") params.set("preset", value);
      else if (key === "view" && value === "overview") params.delete(key);
      else if (value === "all") params.delete(key);
      else params.set(key, value);
    } else {
      params.set(key, value);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const visibleSections = useMemo(() => {
    if (view === "overview") return new Set(["kpis", "funnel", "insights", "social", "goals"]);
    if (view === "insights") return new Set(["insights"]);
    if (view === "social") return new Set(["social"]);
    if (view === "campaigns") return new Set(["campaigns"]);
    if (view === "content") return new Set(["content"]);
    if (view === "community") return new Set(["community"]);
    if (view === "goals") return new Set(["goals"]);
    if (view === "reports") return new Set(["reports", "kpis"]);
    return new Set(["kpis"]);
  }, [view]);

  return (
    <div className="space-y-4 pb-28 lg:pb-8">
      <DeskPageHero
        icon={<LineChart size={22} />}
        title="Growth Center Insights"
        subtitle="First-party SitGuru growth intelligence — registrations, campaigns, community, and honest social status."
        banner={audience === "intern" ? "intern" : "manager"}
        quote={"People grow.\nPets bring us together.\nMeasure what matters."}
      />

      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
        <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 shadow-sm ring-1 ring-slate-200">
          <RefreshCw size={12} className={pending ? "animate-spin" : ""} />
          {sync.statusLabel || snapshot.freshnessLabel}
        </span>
        <span className="rounded-full bg-white px-3 py-1.5 shadow-sm ring-1 ring-slate-200">
          Sync: {sync.syncMode}
        </span>
        {!snapshot.flagEnabled ? (
          <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-800 ring-1 ring-amber-200">
            growth_center_v2 disabled
          </span>
        ) : null}
      </div>

      <div className={`${DESK_UI.card} p-3 sm:p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {VIEWS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setParam("view", item.id)}
                className={`min-h-10 rounded-full px-3 text-xs font-black transition ${
                  view === item.id
                    ? "bg-[#0F2744] text-white"
                    : "bg-[#EEF2F6] text-[#0F2744] hover:bg-[#E2E8F0]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="min-h-10 rounded-full bg-[#EEF2F6] px-3 text-xs font-black text-[#0F2744] lg:hidden"
            onClick={() => setFilterOpen((v) => !v)}
          >
            Filters
          </button>
        </div>

        <div
          className={`mt-3 grid gap-2 lg:grid-cols-[1.4fr_1fr_1fr_auto] ${
            filterOpen ? "grid" : "hidden lg:grid"
          }`}
        >
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setParam("preset", preset.id)}
                className={`min-h-9 rounded-full px-3 text-[11px] font-bold ${
                  snapshot.filters.preset === preset.id
                    ? "bg-[#2563EB] text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <select
            className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#0F2744]"
            value={snapshot.filters.platform}
            onChange={(e) => setParam("platform", e.target.value)}
          >
            <option value="all">All platforms</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="x">X</option>
            <option value="sitguru">SitGuru first-party</option>
          </select>
          <select
            className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#0F2744]"
            value={snapshot.filters.audience}
            onChange={(e) => setParam("audience", e.target.value)}
          >
            <option value="all">All audiences</option>
            <option value="guru">Gurus</option>
            <option value="pet_parent">Pet Parents</option>
            <option value="ambassador">Ambassadors</option>
            <option value="community">Community</option>
          </select>
          <a
            href={exportHref}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0D5C3A] px-4 text-sm font-black !text-white"
          >
            <Download size={16} />
            CSV
          </a>
        </div>
      </div>

      {visibleSections.has("kpis") ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {snapshot.kpis.slice(0, 10).map((kpi) => (
            <article
              key={kpi.id}
              className={`rounded-2xl border p-4 ${toneFor(kpi.id)}`}
            >
              <p className="text-[11px] font-black uppercase tracking-wide opacity-80">
                {kpi.label}
              </p>
              <p className="mt-2 text-3xl font-black text-[#0F2744]">
                {formatMetric(kpi.value, kpi.unit, kpi.availability)}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-600">
                {kpi.availability === "unavailable"
                  ? "Unavailable — not shown as zero"
                  : kpi.prior == null
                    ? kpi.source
                    : `Prior ${formatMetric(kpi.prior, kpi.unit, "available")}`}
              </p>
              {kpi.note ? (
                <p className="mt-2 text-[11px] font-medium leading-4 text-slate-500">
                  {kpi.note}
                </p>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}

      {visibleSections.has("funnel") ? (
        <section className={`${DESK_UI.card} p-4`}>
          <h2 className="text-lg font-black text-[#0F2744]">Acquisition funnel</h2>
          <p className="text-xs font-semibold text-slate-500">
            Social / campaign → visit → registration → booking (observed counts only)
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {snapshot.funnel.map((step, index) => (
              <div key={step.id} className="rounded-2xl bg-[#F8FAFC] p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Step {index + 1}
                </p>
                <p className="mt-1 text-sm font-bold text-[#0F2744]">{step.label}</p>
                <p className="mt-2 text-3xl font-black text-[#0F2744]">
                  {step.count == null ? "—" : step.count.toLocaleString("en-US")}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  {step.conversionFromPrior == null
                    ? step.source
                    : `${step.conversionFromPrior}% from prior step · ${step.source}`}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex h-36 items-end gap-3">
            {snapshot.kpis
              .filter((k) =>
                ["pet_parent_registrations", "guru_registrations", "campaign_visits", "campaign_signups"].includes(
                  k.id,
                ),
              )
              .map((kpi, index) => {
                const colors = [
                  GROWTH_CHART_COLORS.petParent,
                  GROWTH_CHART_COLORS.guru,
                  GROWTH_CHART_COLORS.campaign,
                  GROWTH_CHART_COLORS.conversion,
                ];
                const height =
                  kpi.value == null ? 6 : Math.max(6, ((kpi.value || 0) / maxBar) * 100);
                return (
                  <div key={kpi.id} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-28 w-full items-end">
                      <div
                        className="w-full rounded-t-lg"
                        style={{ height: `${height}%`, background: colors[index] }}
                        title={`${kpi.label}: ${formatMetric(kpi.value, kpi.unit, kpi.availability)}`}
                      />
                    </div>
                    <span className="text-center text-[10px] font-bold text-slate-500">
                      {kpi.label}
                    </span>
                  </div>
                );
              })}
          </div>
        </section>
      ) : null}

      {visibleSections.has("insights") ? (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb size={18} className="text-[#CA8A04]" />
            <h2 className="text-lg font-black text-[#0F2744]">Insights & opportunities</h2>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {snapshot.insights.map((insight) => (
              <article
                key={insight.id}
                className={`rounded-2xl border p-4 ${severityStyles(insight.severity)}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-black text-[#0F2744]">{insight.title}</h3>
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-black uppercase text-slate-600">
                    {insight.confidence}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-700">{insight.observation}</p>
                <p className="mt-2 text-xs font-medium text-slate-500">{insight.reason}</p>
                <p className="mt-3 text-sm font-bold text-[#0F2744]">Next: {insight.nextAction}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {insight.dateRangeLabel} · {insight.sources.join(", ")}
                  </span>
                  <Link href={insight.actionHref} className={`${DESK_UI.link} text-xs font-black`}>
                    Open workflow →
                  </Link>
                </div>
                {insight.limitations ? (
                  <p className="mt-2 text-[11px] font-medium text-slate-500">
                    Limitation: {insight.limitations}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {visibleSections.has("social") ? (
        <section className={`${DESK_UI.card} p-4`}>
          <div className="flex items-center gap-2">
            <Megaphone size={18} className="text-[#DB2777]" />
            <h2 className="text-lg font-black text-[#0F2744]">Social performance status</h2>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Official APIs only when authorized. Manual/seeded follower rows are labeled — never fabricated.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {snapshot.social.map((item) => (
              <article key={item.platform} className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-black text-[#0F2744]">{item.label}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                      item.status === "connected"
                        ? "bg-emerald-100 text-emerald-800"
                        : item.status === "manual"
                          ? "bg-amber-100 text-amber-800"
                          : item.status === "error"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {item.status.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-2 text-2xl font-black text-[#0F2744]">
                  {item.followers == null ? "—" : item.followers.toLocaleString("en-US")}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  {item.accountLabel || "No account connected"}
                </p>
                <p className="mt-2 text-[11px] font-medium leading-4 text-slate-500">
                  {item.setupHint}
                </p>
                <p className="mt-2 text-[11px] font-semibold text-slate-400">
                  {item.lastSyncedAt
                    ? `Last update ${new Date(item.lastSyncedAt).toLocaleString()}`
                    : "No sync yet"}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {visibleSections.has("campaigns") ? (
        <section className={`${DESK_UI.card} overflow-hidden`}>
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 p-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-[#EA580C]" />
              <h2 className="text-lg font-black text-[#0F2744]">Campaign performance</h2>
            </div>
            <Link href={audience === "intern" ? "/intern/growth/campaigns" : "/manager/campaigns"} className={`${DESK_UI.link} text-xs font-black`}>
              Manage campaigns →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#F8FAFC] text-xs font-black uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Campaign</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">Visits</th>
                  <th className="px-4 py-3">Signups</th>
                  <th className="px-4 py-3">Conv.</th>
                  <th className="px-4 py-3">Link</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.campaigns.length ? (
                  snapshot.campaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-bold text-[#0F2744]">{campaign.name}</td>
                      <td className="px-4 py-3 text-slate-600">{campaign.channel}</td>
                      <td className="px-4 py-3">{campaign.visits.toLocaleString("en-US")}</td>
                      <td className="px-4 py-3">{campaign.signups.toLocaleString("en-US")}</td>
                      <td className="px-4 py-3">
                        {campaign.conversionRate == null
                          ? "—"
                          : `${campaign.conversionRate.toFixed(1)}%`}
                      </td>
                      <td className="px-4 py-3">
                        <a href={campaign.trackingUrl} className={`${DESK_UI.link} inline-flex items-center gap-1 text-xs font-bold`}>
                          <Link2 size={12} /> Track
                        </a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-8 text-sm font-semibold text-slate-500" colSpan={6}>
                      No campaign-attributed events in this window.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {visibleSections.has("content") ? (
        <section className={`${DESK_UI.card} p-4`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-black text-[#0F2744]">Content Studio analytics</h2>
            <Link
              href={audience === "intern" ? "/intern/content" : "/manager/campaigns-content"}
              className={`${DESK_UI.link} text-xs font-black`}
            >
              Open Content Studio →
            </Link>
          </div>
          <ul className="mt-3 space-y-2">
            {snapshot.content.length ? (
              snapshot.content.slice(0, 12).map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#F8FAFC] px-3 py-2"
                >
                  <div>
                    <p className="font-bold text-[#0F2744]">{item.title}</p>
                    <p className="text-xs font-semibold text-slate-500">
                      {[item.platform, item.audience, item.campaign, item.owner]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase text-slate-600 ring-1 ring-slate-200">
                    {item.status}
                  </span>
                </li>
              ))
            ) : (
              <li className="text-sm font-semibold text-slate-500">
                No Content Studio rows yet.
              </li>
            )}
          </ul>
        </section>
      ) : null}

      {visibleSections.has("community") ? (
        <section className="grid gap-3 md:grid-cols-2">
          <article className={`${DESK_UI.card} p-4`}>
            <div className="flex items-center gap-2">
              <Users size={18} className="text-[#7C3AED]" />
              <h2 className="text-lg font-black text-[#0F2744]">Community growth</h2>
            </div>
            <p className="mt-3 text-3xl font-black text-[#0F2744]">
              {snapshot.community.submissions == null
                ? "—"
                : snapshot.community.submissions.toLocaleString("en-US")}
            </p>
            <p className="text-sm font-semibold text-slate-600">Community Studio submissions</p>
            <p className="mt-2 text-xs font-medium text-slate-500">{snapshot.community.note}</p>
            <Link
              href={audience === "intern" ? "/intern/community-studio" : "/manager/community-studio"}
              className={`${DESK_UI.link} mt-3 inline-flex text-xs font-black`}
            >
              Community Studio →
            </Link>
          </article>
          <article className={`${DESK_UI.card} p-4`}>
            <div className="flex items-center gap-2">
              <PawPrint size={18} className="text-[#0D5C3A]" />
              <h2 className="text-lg font-black text-[#0F2744]">Campus growth</h2>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div>
                <p className="text-2xl font-black text-[#0F2744]">{snapshot.campus.profiles}</p>
                <p className="text-[11px] font-bold text-slate-500">Profiles</p>
              </div>
              <div>
                <p className="text-2xl font-black text-[#0F2744]">{snapshot.campus.visits}</p>
                <p className="text-[11px] font-bold text-slate-500">Visits</p>
              </div>
              <div>
                <p className="text-2xl font-black text-[#0F2744]">{snapshot.campus.leads}</p>
                <p className="text-[11px] font-bold text-slate-500">Leads</p>
              </div>
            </div>
            <p className="mt-2 text-xs font-medium text-slate-500">{snapshot.campus.note}</p>
            <Link
              href={audience === "intern" ? "/intern/campus-growth" : "/manager/campus-growth"}
              className={`${DESK_UI.link} mt-3 inline-flex text-xs font-black`}
            >
              Campus Growth →
            </Link>
          </article>
        </section>
      ) : null}

      {visibleSections.has("goals") ? (
        <section className={`${DESK_UI.card} p-4`}>
          <div className="flex items-center gap-2">
            <Target size={18} className="text-[#CA8A04]" />
            <h2 className="text-lg font-black text-[#0F2744]">Weekly goals</h2>
          </div>
          <div className="mt-4 space-y-3">
            {snapshot.goals.map((goal) => {
              const pct = goal.percentComplete == null ? 0 : Math.min(100, goal.percentComplete);
              return (
                <div key={goal.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-[#0F2744]">{goal.label}</p>
                      <p className="text-xs font-semibold text-slate-500">
                        {goal.ownerLabel} · {goal.periodLabel} · {goal.source}
                      </p>
                    </div>
                    <p className="text-sm font-black text-[#0F2744]">
                      {goal.actual == null ? "—" : goal.actual} / {goal.target}
                      {goal.percentComplete != null ? ` (${goal.percentComplete}%)` : ""}
                    </p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#22C55E]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500">
                    Status: {goal.status.replace("_", " ")}
                    {goal.remaining != null ? ` · ${goal.remaining} remaining` : ""}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {visibleSections.has("reports") ? (
        <section className={`${DESK_UI.card} p-4`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-[#0D5C3A]" />
            <h2 className="text-lg font-black text-[#0F2744]">Weekly report package</h2>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Export uses the same metric definitions as this dashboard. Generating a report never
            changes operational records.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={exportHref}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0D5C3A] px-4 text-sm font-black !text-white"
            >
              <Download size={16} /> Download CSV
            </a>
            <Link
              href={audience === "admin" ? "/admin/growth/analytics" : audience === "intern" ? "/intern/growth" : "/manager/reports"}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#EEF2F6] px-4 text-sm font-black text-[#0F2744]"
            >
              Business Growth Report
            </Link>
          </div>
          <ul className="mt-4 space-y-2">
            {snapshot.coverageNotes.map((note) => (
              <li key={note} className="flex gap-2 text-xs font-medium text-slate-500">
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" />
                {note}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
