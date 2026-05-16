import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ExportStatusActions from "./ExportStatusActions";
import ExportPackageActions from "./ExportPackageActions";

export const dynamic = "force-dynamic";

type ExportRecord = {
  id: string;
  title: string;
  package_type: string;
  report_type: string;
  period_label: string;
  period_start: string | null;
  period_end: string | null;
  export_format: string;
  export_status: string;
  created_by: string | null;
  created_by_user_id: string | null;
  sent_to_email: string | null;
  sent_to_phone: string | null;
  file_url: string | null;
  storage_path: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type GrowthSummaryRow = {
  financial_category?: string | null;
  financial_statement_section?: string | null;
  row_count?: number | null;
  total_amount?: number | null;
  first_activity_date?: string | null;
  last_activity_date?: string | null;
  source?: string | null;
};

type GrowthRoiRow = {
  campaign_id?: string | null;
  campaign_name?: string | null;
  campaign_slug?: string | null;
  channel?: string | null;
  campaign_type?: string | null;
  source?: string | null;
  clicks?: number | null;
  leads?: number | null;
  signups?: number | null;
  bookings?: number | null;
  attributed_revenue?: number | null;
  total_cost?: number | null;
  net_growth_return?: number | null;
  roi_percent?: number | null;
  signup_conversion_percent?: number | null;
  booking_conversion_percent?: number | null;
  cost_per_signup?: number | null;
  cost_per_booking?: number | null;
  growth_signal?: string | null;
  admin_recommendation?: string | null;
  last_event_at?: string | null;
  last_cost_date?: string | null;
};

type PageProps = {
  params: Promise<{
    exportId: string;
  }>;
};

type DownloadLink = {
  label: string;
  description: string;
  href: string;
  kind: "download" | "open" | "attached";
  badge: string;
};

const exportTables = [
  "financial_export_history",
  "admin_financial_exports",
  "financial_exports",
  "export_history",
];

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(Number(value) || 0));
}

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("en-US").format(Number(value) || 0);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not set";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Not set";

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function labelize(value: string | null | undefined) {
  if (!value) return "Not set";

  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusClasses(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "ready" || normalized === "sent") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (normalized === "processing") {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }

  if (normalized === "failed") {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }

  return "border-amber-200 bg-amber-50 text-amber-800";
}

function normalizeIncludedLabel(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getStatementFormat(record: ExportRecord) {
  const normalized = (record.export_format || "excel").toLowerCase();

  if (normalized === "xlsx") return "excel";
  if (normalized === "xls") return "excel";
  if (normalized === "doc") return "word";
  if (normalized === "docx") return "word";
  if (normalized === "word") return "word";
  if (normalized === "pdf") return "pdf";
  if (normalized === "csv") return "csv";
  if (normalized === "zip") return "zip";

  return "excel";
}

function metadataToArray(metadata: Record<string, unknown>) {
  return Object.entries(metadata || {}).map(([key, value]) => ({ key, value }));
}

function renderMetadataValue(value: unknown) {
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object") return JSON.stringify(value, null, 2);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === null || value === undefined || value === "") return "Not set";
  return String(value);
}

function getMetadataList(record: ExportRecord, keys: string[]) {
  for (const key of keys) {
    const value = record.metadata?.[key];

    if (Array.isArray(value)) {
      return value.filter(Boolean).map((item) => String(item));
    }

    if (typeof value === "string" && value.trim()) {
      return value
        .split(/[,|]/g)
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function getReportDownloadLink(label: unknown, record: ExportRecord): DownloadLink | null {
  const normalized = normalizeIncludedLabel(label);
  const statementFormat = getStatementFormat(record);

  if (normalized.includes("daily") || normalized.includes("snapshot")) {
    return {
      label: "Daily Admin Report",
      description: "Open the daily operations, finance, growth, and risk report preview.",
      href: "/admin/financials/reports/daily",
      kind: "open",
      badge: "DAILY",
    };
  }

  if (normalized.includes("weekly") || normalized.includes("summary")) {
    return {
      label: "Weekly Admin Report",
      description: "Open the weekly management report preview.",
      href: "/admin/financials/reports/weekly",
      kind: "open",
      badge: "WEEKLY",
    };
  }

  if (normalized.includes("custom") || normalized.includes("date range")) {
    return {
      label: "Custom Range Report",
      description: "Open the custom reporting center for date-range report building.",
      href: "/admin/financials/reports/custom",
      kind: "open",
      badge: "CUSTOM",
    };
  }

  if (normalized.includes("profit") || normalized.includes("loss") || normalized.includes("income") || normalized.includes("statement of operations")) {
    return {
      label: "Profit & Loss",
      description: "Download the Statement of Operations export for this package.",
      href: `/api/admin/financials/profit-loss/export?format=${statementFormat}`,
      kind: "download",
      badge: statementFormat.toUpperCase(),
    };
  }

  if (normalized.includes("balance")) {
    return {
      label: "Balance Sheet",
      description: "Download the assets, liabilities, equity, and reward liability statement export.",
      href: `/api/admin/financials/balance-sheet/export?format=${statementFormat}`,
      kind: "download",
      badge: statementFormat.toUpperCase(),
    };
  }

  if (normalized.includes("cash flow") || normalized.includes("cashflow")) {
    return {
      label: "Cash Flow",
      description: "Download operating cash movement, payout, Stripe, banking, and growth cash activity.",
      href: `/api/admin/financials/cash-flow/export?format=${statementFormat}`,
      kind: "download",
      badge: statementFormat.toUpperCase(),
    };
  }

  if (normalized.includes("pro forma") || normalized.includes("forecast")) {
    return {
      label: "Pro Forma",
      description: "Download forecast, runway, growth spend, and scenario planning support.",
      href: `/api/admin/financials/pro-forma/export?format=${statementFormat}`,
      kind: "download",
      badge: statementFormat.toUpperCase(),
    };
  }

  if (normalized.includes("general ledger") || normalized.includes("ledger")) {
    return {
      label: "General Ledger",
      description: "Open ledger detail, including campaign expenses and referral rewards.",
      href: "/admin/financials/general-ledger",
      kind: "open",
      badge: "LEDGER",
    };
  }

  if (normalized.includes("reconciliation") || normalized.includes("bank") || normalized.includes("stripe")) {
    return {
      label: "Reconciliation",
      description: "Open reconciliation support for bank, Stripe, payouts, campaign costs, and rewards.",
      href: "/admin/financials/reconciliation",
      kind: "open",
      badge: "RECON",
    };
  }

  if (normalized.includes("payout") || normalized.includes("guru")) {
    return {
      label: "Payout Analytics",
      description: "Open Guru, platform, and referral payout support.",
      href: "/admin/financials/payouts",
      kind: "open",
      badge: "PAYOUTS",
    };
  }

  if (normalized.includes("commission") || normalized.includes("partner") || normalized.includes("ambassador")) {
    return {
      label: "Commissions & Referral Rewards",
      description: "Open partner, ambassador, Guru referral, and PawPerks reward support.",
      href: "/admin/financials/commissions",
      kind: "open",
      badge: "REWARDS",
    };
  }

  if (normalized.includes("tax") || normalized.includes("1099") || normalized.includes("deduction")) {
    return {
      label: "Tax Center",
      description: "Open annual, quarterly, federal, state, local, and deduction support.",
      href: "/admin/financials/tax-reports",
      kind: "open",
      badge: "TAX",
    };
  }

  if (normalized.includes("cpa") || normalized.includes("handoff")) {
    return {
      label: "CPA Handoff",
      description: "Open the CPA handoff center for review status and checklist support.",
      href: "/admin/financials/cpa-handoff",
      kind: "open",
      badge: "CPA",
    };
  }

  if (normalized.includes("growth") || normalized.includes("referral") || normalized.includes("pawperks") || normalized.includes("marketing") || normalized.includes("roi") || normalized.includes("campaign")) {
    return {
      label: "Growth & Referrals ROI",
      description: "Open Growth & Referrals for campaign ROI, reward liability, issued rewards, and PawPerks backup.",
      href: "/admin/referrals",
      kind: "open",
      badge: "GROWTH",
    };
  }

  return null;
}

function getPackageLinks(record: ExportRecord) {
  const included = getMetadataList(record, [
    "includedReports",
    "included_reports",
    "reports",
    "included",
    "sections",
    "packageIncludes",
    "package_includes",
  ]);

  const packageDefaults = [
    "Profit & Loss",
    "Balance Sheet",
    "Cash Flow",
    "General Ledger",
    "Reconciliation",
    "Payouts",
    "Commissions",
    "Growth Referrals Marketing ROI",
    "Tax Center",
    "CPA Handoff",
  ];

  const sourceLabels = included.length ? included : packageDefaults;
  const mappedLinks = sourceLabels
    .map((label) => getReportDownloadLink(label, record))
    .filter(Boolean) as DownloadLink[];

  const attachedLinks: DownloadLink[] = [];

  if (record.file_url) {
    attachedLinks.push({
      label: "Stored export file",
      description: "Open the stored export file URL attached to this record.",
      href: record.file_url,
      kind: "attached",
      badge: "FILE",
    });
  }

  return [...attachedLinks, ...mappedLinks];
}

async function safeSelect<T>(table: string, query = "*") {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from(table).select(query).limit(500);

    if (error || !data) return [] as T[];
    return data as unknown as T[];
  } catch {
    return [] as T[];
  }
}

async function getExportRecord(exportId: string) {
  const supabase = await createClient();

  for (const table of exportTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("id", exportId)
        .maybeSingle();

      if (!error && data) {
        const row = data as Record<string, unknown>;

        return {
          id: String(row.id || exportId),
          title: String(row.title || row.name || "Financial Export Package"),
          package_type: String(row.package_type || row.packageType || row.type || "financial_package"),
          report_type: String(row.report_type || row.reportType || "financial_export"),
          period_label: String(row.period_label || row.periodLabel || row.period || "Current period"),
          period_start: typeof row.period_start === "string" ? row.period_start : typeof row.start_date === "string" ? row.start_date : null,
          period_end: typeof row.period_end === "string" ? row.period_end : typeof row.end_date === "string" ? row.end_date : null,
          export_format: String(row.export_format || row.exportFormat || row.format || "xlsx"),
          export_status: String(row.export_status || row.exportStatus || row.status || "needs_review"),
          created_by: typeof row.created_by === "string" ? row.created_by : null,
          created_by_user_id: typeof row.created_by_user_id === "string" ? row.created_by_user_id : null,
          sent_to_email: typeof row.sent_to_email === "string" ? row.sent_to_email : null,
          sent_to_phone: typeof row.sent_to_phone === "string" ? row.sent_to_phone : null,
          file_url: typeof row.file_url === "string" ? row.file_url : typeof row.href === "string" ? row.href : null,
          storage_path: typeof row.storage_path === "string" ? row.storage_path : null,
          notes: typeof row.notes === "string" ? row.notes : null,
          metadata:
            row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
              ? (row.metadata as Record<string, unknown>)
              : {},
          created_at: String(row.created_at || row.createdAt || new Date().toISOString()),
          updated_at: String(row.updated_at || row.updatedAt || row.created_at || new Date().toISOString()),
        } satisfies ExportRecord;
      }
    } catch {
      // Try the next known export-history table name.
    }
  }

  return null;
}

async function getGrowthSupport() {
  const [summaryRows, roiRows] = await Promise.all([
    safeSelect<GrowthSummaryRow>("admin_growth_financial_summary"),
    safeSelect<GrowthRoiRow>("admin_growth_campaign_roi"),
  ]);

  const marketingExpense = summaryRows
    .filter((row) => String(row.source || "").includes("growth") || String(row.financial_category || "").toLowerCase().includes("marketing"))
    .reduce((sum, row) => sum + (Number(row.total_amount) || 0), 0);

  const pendingRewardLiability = summaryRows
    .filter((row) => String(row.financial_statement_section || "").toLowerCase().includes("liabil"))
    .reduce((sum, row) => sum + (Number(row.total_amount) || 0), 0);

  const issuedRewards = summaryRows
    .filter((row) => String(row.financial_category || "").toLowerCase().includes("reward"))
    .reduce((sum, row) => sum + (Number(row.total_amount) || 0), 0);

  const revenue = roiRows.reduce((sum, row) => sum + (Number(row.attributed_revenue) || 0), 0);
  const cost = roiRows.reduce((sum, row) => sum + (Number(row.total_cost) || 0), 0);
  const bookings = roiRows.reduce((sum, row) => sum + (Number(row.bookings) || 0), 0);
  const signups = roiRows.reduce((sum, row) => sum + (Number(row.signups) || 0), 0);

  return {
    summaryRows,
    roiRows,
    totals: {
      marketingExpense,
      pendingRewardLiability,
      issuedRewards,
      revenue,
      cost,
      bookings,
      signups,
      roi: cost > 0 ? ((revenue - cost) / cost) * 100 : null,
    },
  };
}

function MissingExportRecord({ exportId }: { exportId: string }) {
  return (
    <main className="min-h-screen bg-[#f7fbf8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1100px] space-y-6">
        <section className="rounded-[2rem] border border-amber-100 bg-white p-6 shadow-sm lg:p-8">
          <Link
            href="/admin/financials/exports"
            className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800 transition hover:bg-emerald-100"
          >
            ← Back to Export Center
          </Link>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950">
            Export record not found
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            SitGuru could not find a saved export record for <span className="font-black text-slate-950">{exportId}</span>. You can return to the Export Center and create a fresh CPA, tax, growth, or financial package.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/admin/financials/exports"
              className="rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
            >
              Open Export Center
            </Link>
            <Link
              href="/admin/financials/cpa-handoff"
              className="rounded-full border border-emerald-100 bg-white px-5 py-3 text-sm font-black text-emerald-800 transition hover:bg-emerald-50"
            >
              Open CPA Handoff
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function DetailCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-[1.35rem] border border-emerald-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{helper}</p>
    </div>
  );
}

export default async function AdminFinancialExportDetailPage({ params }: PageProps) {
  const { exportId } = await params;
  const record = await getExportRecord(exportId);

  if (!record) {
    return <MissingExportRecord exportId={exportId} />;
  }

  const growthSupport = await getGrowthSupport();
  const packageLinks = getPackageLinks(record);
  const metadataRows = metadataToArray(record.metadata);
  const includedReports = getMetadataList(record, [
    "includedReports",
    "included_reports",
    "reports",
    "included",
    "sections",
    "packageIncludes",
    "package_includes",
  ]);

  const statusClass = statusClasses(record.export_status);

  return (
    <main className="min-h-screen bg-[#f7fbf8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <Link
                href="/admin/financials/exports"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800 transition hover:bg-emerald-100"
              >
                ← Back to Export Center
              </Link>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-black tracking-tight text-slate-950">
                  {record.title}
                </h1>
                <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${statusClass}`}>
                  {labelize(record.export_status)}
                </span>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-blue-800">
                  {record.export_format.toUpperCase()}
                </span>
              </div>

              <p className="mt-3 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
                Export detail package for CPA handoff, tax support, financial statements, Growth & Referrals ROI, PawPerks reward liabilities, payout backup, and reconciliation review.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[460px]">
              <Link
                href="/admin/financials/cpa-handoff"
                className="rounded-[1.25rem] border border-emerald-100 bg-emerald-50 p-4 transition hover:bg-emerald-100"
              >
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">CPA Handoff</p>
                <p className="mt-2 text-2xl font-black text-slate-950">Review →</p>
              </Link>

              <Link
                href="/admin/financials/tax-reports"
                className="rounded-[1.25rem] border border-blue-100 bg-blue-50 p-4 transition hover:bg-blue-100"
              >
                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Tax Center</p>
                <p className="mt-2 text-2xl font-black text-slate-950">Open →</p>
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailCard label="Package Type" value={labelize(record.package_type)} helper="Saved export workflow category." />
          <DetailCard label="Report Type" value={labelize(record.report_type)} helper="Report family or export package type." />
          <DetailCard label="Period" value={record.period_label || "Current period"} helper={`${formatDate(record.period_start)} through ${formatDate(record.period_end)}`} />
          <DetailCard label="Updated" value={formatDateTime(record.updated_at)} helper={`Created ${formatDateTime(record.created_at)}`} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.42fr]">
          <div className="space-y-6">
            <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">Package Download Map</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Linked Reports & Supporting Files</h2>
                  <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-600">
                    These links connect the saved package record to the statement exports, CPA support pages, tax center, Growth & Referrals ROI, PawPerks reward backup, and payout records that support the package.
                  </p>
                </div>

                {record.file_url ? (
                  <Link
                    href={record.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
                  >
                    Open Stored File →
                  </Link>
                ) : null}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {packageLinks.map((link) => (
                  <Link
                    key={`${link.label}-${link.href}`}
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                    className="group flex min-h-[185px] flex-col justify-between rounded-[1.5rem] border border-slate-100 bg-[#fbfefd] p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:bg-white hover:shadow-lg"
                  >
                    <div>
                      <span className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                        {link.badge}
                      </span>
                      <h3 className="mt-3 text-xl font-black text-slate-950">{link.label}</h3>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{link.description}</p>
                    </div>
                    <div className="mt-5 border-t border-slate-100 pt-4 text-sm font-black text-emerald-800">
                      {link.kind === "download" ? "Download" : "Open"} →
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">Growth, PawPerks & Tax Export Support</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Campaign ROI, Reward Liability & Marketing Backup</h2>
              <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
                Export detail now surfaces the same Growth & Referrals foundation used by Financials, Reports, Tax Center, CPA Handoff, Payouts, Reconciliation, and General Ledger.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <DetailCard label="Marketing Expense" value={formatCurrency(growthSupport.totals.marketingExpense)} helper="Campaign costs available for export support." />
                <DetailCard label="Reward Liability" value={formatCurrency(growthSupport.totals.pendingRewardLiability)} helper="Pending PawPerks/referral rewards." />
                <DetailCard label="Issued Rewards" value={formatCurrency(growthSupport.totals.issuedRewards)} helper="Issued referral reward expense support." />
                <DetailCard label="Attributed Revenue" value={formatCurrency(growthSupport.totals.revenue)} helper="Revenue tied to campaign activity." />
                <DetailCard label="Growth ROI" value={growthSupport.totals.roi === null ? "Need cost data" : `${Math.round(growthSupport.totals.roi)}%`} helper="Campaign return across ROI rows." />
              </div>

              <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white">
                <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Campaign ROI export rows</p>
                </div>

                {growthSupport.roiRows.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-100">
                          {[
                            "Campaign",
                            "Channel",
                            "Signups",
                            "Bookings",
                            "Revenue",
                            "Cost",
                            "ROI",
                            "Recommendation",
                          ].map((heading) => (
                            <th key={heading} className="px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {growthSupport.roiRows.slice(0, 8).map((row, index) => (
                          <tr key={`${row.campaign_slug || row.campaign_name || "campaign"}-${index}`} className="border-b border-slate-100 last:border-0">
                            <td className="px-5 py-4 font-black text-slate-950">{row.campaign_name || "Unnamed campaign"}</td>
                            <td className="px-5 py-4 font-bold text-slate-600">{row.channel || "Unknown"}</td>
                            <td className="px-5 py-4 font-bold text-slate-600">{formatNumber(row.signups)}</td>
                            <td className="px-5 py-4 font-bold text-slate-600">{formatNumber(row.bookings)}</td>
                            <td className="px-5 py-4 font-bold text-slate-600">{formatCurrency(row.attributed_revenue)}</td>
                            <td className="px-5 py-4 font-bold text-slate-600">{formatCurrency(row.total_cost)}</td>
                            <td className="px-5 py-4 font-black text-emerald-700">{row.roi_percent === null || row.roi_percent === undefined ? "Need cost" : `${Math.round(Number(row.roi_percent) || 0)}%`}</td>
                            <td className="px-5 py-4 text-xs font-bold leading-5 text-slate-500">{row.admin_recommendation || row.growth_signal || "Review campaign performance."}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-5 text-sm font-bold leading-6 text-slate-600">
                    No campaign ROI rows found yet. Add campaign events and costs for QR codes, flyers, paid ads, partner links, Ambassador links, and referral campaigns to populate export-ready ROI backup.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">Metadata & Notes</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Export Record Detail</h2>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Delivery</p>
                  <div className="mt-4 grid gap-3 text-sm font-bold text-slate-600">
                    <p className="flex justify-between gap-4"><span>Email</span><span className="text-slate-950">{record.sent_to_email || "Not sent"}</span></p>
                    <p className="flex justify-between gap-4"><span>Phone</span><span className="text-slate-950">{record.sent_to_phone || "Not sent"}</span></p>
                    <p className="flex justify-between gap-4"><span>Storage</span><span className="text-slate-950">{record.storage_path || "Not stored"}</span></p>
                    <p className="flex justify-between gap-4"><span>Created By</span><span className="text-slate-950">{record.created_by || "Admin"}</span></p>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Notes</p>
                  <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
                    {record.notes || "No notes saved yet. Use the status action panel to add review notes for CPA, tax, export, or management follow-up."}
                  </p>
                </div>
              </div>

              {includedReports.length > 0 ? (
                <div className="mt-5 rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Included sections</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {includedReports.map((item) => (
                      <span key={item} className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-black text-emerald-800">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {metadataRows.length > 0 ? (
                <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white">
                  <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Raw metadata</p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {metadataRows.map((item) => (
                      <div key={item.key} className="grid gap-2 px-5 py-4 text-sm lg:grid-cols-[220px_1fr]">
                        <p className="font-black text-slate-950">{labelize(item.key)}</p>
                        <pre className="whitespace-pre-wrap break-words text-xs font-semibold leading-5 text-slate-600">{renderMetadataValue(item.value)}</pre>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          </div>

          <aside className="space-y-6">
            <ExportStatusActions exportId={record.id} currentStatus={record.export_status} />

            <ExportPackageActions
              exportId={record.id}
              packageType={record.package_type}
              format={record.export_format}
              startDate={record.period_start}
              endDate={record.period_end}
            />

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">Quick Open</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Related Centers</h2>
              <div className="mt-5 grid gap-3">
                {[
                  ["Export Center", "/admin/financials/exports"],
                  ["CPA Handoff", "/admin/financials/cpa-handoff"],
                  ["Tax Center", "/admin/financials/tax-reports"],
                  ["Growth & Referrals", "/admin/referrals"],
                  ["Reconciliation", "/admin/financials/reconciliation"],
                  ["General Ledger", "/admin/financials/general-ledger"],
                ].map(([label, href]) => (
                  <Link key={href} href={href} className="rounded-[1.25rem] border border-slate-100 bg-[#fbfefd] p-4 text-sm font-black text-emerald-900 transition hover:border-emerald-300 hover:bg-white">
                    {label} →
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
