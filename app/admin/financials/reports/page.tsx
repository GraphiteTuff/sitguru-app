import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Landmark,
  LineChart,
  Sparkles,
} from "lucide-react";
import { getFinanceAdminIdentity } from "@/lib/admin/financials/access";
import {
  getFinancialReportsDashboardData,
  type FinancialReportsRecentItem,
} from "@/lib/admin/financials/reports-dashboard";

export const dynamic = "force-dynamic";

const routes = {
  financials: "/admin/financials",
  hub: "/admin/financials/reports",
  daily: "/admin/financials/reports/daily",
  weekly: "/admin/financials/reports/weekly",
  custom: "/admin/financials/reports/custom",
  exports: "/admin/financials/exports",
  adminReports: "/admin/reports",
  generateDailyHtml: "/api/admin/reports/generate?reportType=daily&format=html",
  generateDailyCsv: "/api/admin/reports/generate?reportType=daily&format=csv",
  generateWeeklyHtml: "/api/admin/reports/generate?reportType=weekly&format=html",
  generateWeeklyCsv: "/api/admin/reports/generate?reportType=weekly&format=csv",
  cpaHandoff: "/admin/financials/cpa-handoff",
  reconciliation: "/admin/financials/reconciliation",
  paymentGateway: "/admin/financials/payment-gateway",
  taxReports: "/admin/financials/tax-reports",
  analytics: "/admin/analytics",
};

type ModuleCard = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  wiring: "live" | "next";
  value?: string;
  icon: ReactNode;
};

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0,
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function MetricTile({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-emerald-100 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
    </div>
  );
}

function ModuleLinkCard({ card }: { card: ModuleCard }) {
  return (
    <Link
      href={card.href}
      className="group flex h-full flex-col rounded-[1.6rem] border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-[#0D5C3A]">
          {card.icon}
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
            card.wiring === "live"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {card.wiring === "live" ? "Live" : "Next"}
        </span>
      </div>
      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
        {card.eyebrow}
      </p>
      <h3 className="mt-1 text-lg font-black text-slate-950">{card.title}</h3>
      {card.value ? (
        <p className="mt-2 text-2xl font-black text-[#0D5C3A]">{card.value}</p>
      ) : null}
      <p className="mt-2 flex-1 text-sm font-semibold leading-6 text-slate-600">
        {card.description}
      </p>
      <span className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-800">
        Open
        <ExternalLink
          size={14}
          className="transition group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );
}

function RecentList({
  title,
  subtitle,
  href,
  items,
  emptyTitle,
  emptyDetail,
}: {
  title: string;
  subtitle: string;
  href: string;
  items: FinancialReportsRecentItem[];
  emptyTitle: string;
  emptyDetail: string;
}) {
  return (
    <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-950">{title}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
        </div>
        <Link
          href={href}
          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-900 transition hover:bg-emerald-100"
        >
          Open
        </Link>
      </div>
      <div className="mt-4 grid gap-3">
        {items.length ? (
          items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-black text-slate-950">
                    {item.title}
                  </p>
                  <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                    {item.subtitle}
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
                  {item.status}
                </span>
              </div>
              <p className="mt-3 text-xs font-bold text-slate-500">
                {formatDate(item.date)}
              </p>
            </Link>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
            <p className="font-black text-slate-950">{emptyTitle}</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {emptyDetail}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default async function AdminFinancialReportsHubPage() {
  const actor = await getFinanceAdminIdentity();

  if (!actor) {
    return (
      <div className="min-h-screen bg-[#f7fbf8] px-6 py-10 text-slate-950">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-rose-100 bg-white p-8 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-rose-700">
            Access Restricted
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
            Financial access required.
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            Sign in with a finance-enabled admin account to open Financial
            Reports.
          </p>
        </div>
      </div>
    );
  }

  const data = await getFinancialReportsDashboardData();

  const modules: ModuleCard[] = [
    {
      eyebrow: "Daily",
      title: "Daily Financial Report",
      description:
        "Live owner snapshot for today’s bookings, payments, payouts, growth ROI, and exceptions.",
      href: routes.daily,
      wiring: "live",
      value: number(data.metrics.dailyPackages),
      icon: <CalendarDays size={20} />,
    },
    {
      eyebrow: "Weekly",
      title: "Weekly Financial Report",
      description:
        "Leadership weekly close view across cash, payouts, commissions, and growth.",
      href: routes.weekly,
      wiring: "live",
      value: number(data.metrics.weeklyPackages),
      icon: <LineChart size={20} />,
    },
    {
      eyebrow: "Custom",
      title: "Custom Report Builder",
      description:
        "Date-range and package selection for CPA, lender, and owner questions.",
      href: routes.custom,
      wiring: "live",
      icon: <ClipboardList size={20} />,
    },
    {
      eyebrow: "Generate",
      title: "Daily HTML Snapshot",
      description: "Open a generated daily admin report HTML preview.",
      href: routes.generateDailyHtml,
      wiring: "live",
      icon: <FileText size={20} />,
    },
    {
      eyebrow: "Generate",
      title: "Daily CSV Package",
      description: "Download daily booking and ops metrics as CSV.",
      href: routes.generateDailyCsv,
      wiring: "live",
      icon: <FileSpreadsheet size={20} />,
    },
    {
      eyebrow: "Generate",
      title: "Weekly HTML Snapshot",
      description: "Open a generated weekly management report HTML preview.",
      href: routes.generateWeeklyHtml,
      wiring: "live",
      icon: <FileText size={20} />,
    },
    {
      eyebrow: "Ops",
      title: "Admin Report Generator",
      description: "Daily/weekly generate form with save-to-history option.",
      href: routes.adminReports,
      wiring: "live",
      icon: <Sparkles size={20} />,
    },
    {
      eyebrow: "Packages",
      title: "Export Center",
      description: "CPA packages, ZIP archives, and export history records.",
      href: routes.exports,
      wiring: "live",
      value: number(data.metrics.exportHistory),
      icon: <Download size={20} />,
    },
    {
      eyebrow: "Close",
      title: "CPA Handoff",
      description: "Tracker for notes and items heading to CPA close.",
      href: routes.cpaHandoff,
      wiring: "live",
      icon: <ClipboardList size={20} />,
    },
    {
      eyebrow: "Bank",
      title: "Reconciliation",
      description: "Match expected cash movement to bank deposit timing.",
      href: routes.reconciliation,
      wiring: "live",
      icon: <Landmark size={20} />,
    },
    {
      eyebrow: "Payments",
      title: "Payment Gateway",
      description: "Stripe and adjacent payment activity for daily review.",
      href: routes.paymentGateway,
      wiring: "live",
      icon: <LineChart size={20} />,
    },
    {
      eyebrow: "Tax",
      title: "Tax Center",
      description: "Tax report packages that feed monthly and annual close.",
      href: routes.taxReports,
      wiring: "live",
      icon: <FileSpreadsheet size={20} />,
    },
  ];

  return (
    <main className="min-h-screen bg-[#f7fbf8] px-3 py-4 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1640px] space-y-6">
        <section className="rounded-[2rem] border border-emerald-100 bg-[radial-gradient(circle_at_top_left,rgba(13,92,58,0.12),transparent_34%),linear-gradient(135deg,#ffffff_0%,#ecfdf5_55%,#f8fafc_100%)] p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <Link
                href={routes.financials}
                className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50"
              >
                <ArrowLeft size={16} />
                Back to Financials
              </Link>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl xl:text-5xl">
                  Financial Reports
                </h1>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                  Close Command Center
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
                    data.isLive
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-amber-200 bg-amber-50 text-amber-800"
                  }`}
                >
                  {data.isLive ? "Live Sources" : "Preview Sources"}
                </span>
              </div>

              <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-600 sm:text-base sm:leading-7">
                Run daily close, weekly leadership review, custom CPA packages,
                and generated HTML/CSV snapshots from one finance-gated hub.
              </p>

              <p className="mt-3 text-xs font-bold text-slate-500">
                Signed in as {actor.email} · Role {actor.role}
              </p>
            </div>

            <div className="grid w-full shrink-0 gap-3 sm:grid-cols-2 xl:w-auto xl:grid-cols-4">
              <Link
                href={routes.daily}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-900"
              >
                <CalendarDays size={17} />
                Daily Report
              </Link>
              <Link
                href={routes.weekly}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
              >
                <LineChart size={17} />
                Weekly Report
              </Link>
              <Link
                href={routes.generateDailyHtml}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
              >
                <FileText size={17} />
                Generate HTML
              </Link>
              <Link
                href={routes.exports}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-100"
              >
                <Download size={17} />
                Export Center
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <MetricTile
            label="Saved Reports"
            value={number(data.metrics.savedReports)}
            helper="History rows loaded"
          />
          <MetricTile
            label="Daily Packages"
            value={number(data.metrics.dailyPackages)}
            helper="Daily-labeled exports"
          />
          <MetricTile
            label="Weekly Packages"
            value={number(data.metrics.weeklyPackages)}
            helper="Weekly-labeled exports"
          />
          <MetricTile
            label="Export History"
            value={number(data.metrics.exportHistory)}
            helper="Package archive count"
          />
          <MetricTile
            label="Source Status"
            value={data.isLive ? "Live" : "Next"}
            helper="Export history connectivity"
          />
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                Manage close from live modules
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Financial Reports command center
              </h2>
            </div>
            <p className="text-sm font-semibold text-slate-500">
              Live = readable ops + generate endpoints
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {modules.map((card) => (
              <ModuleLinkCard key={card.title} card={card} />
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <RecentList
            title="Recent export packages"
            subtitle="Newest saved financial report packages."
            href={routes.exports}
            items={data.recentExports}
            emptyTitle="No saved packages yet"
            emptyDetail="Generate a daily/weekly report or create an Export Center package."
          />

          <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-black text-slate-950">Source health</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Hub reads financial and admin export history tables.
            </p>
            <div className="mt-4 grid gap-3">
              {data.sourceHealth.map((source) => (
                <div
                  key={source.id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="min-w-0">
                    <p className="font-black text-slate-950">{source.label}</p>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                      {source.message}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                        source.ok
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-amber-200 bg-amber-50 text-amber-800"
                      }`}
                    >
                      {source.ok ? "Live" : "Next"}
                    </span>
                    <p className="mt-2 text-sm font-black text-slate-700">
                      {number(source.rowCount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
