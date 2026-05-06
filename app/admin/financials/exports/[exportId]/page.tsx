import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ExportStatusActions from "./ExportStatusActions";
import ExportPackageActions from "./ExportPackageActions";

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

type PageProps = {
  params: Promise<{
    exportId: string;
  }>;
};

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

function getMetadataArray(metadata: Record<string, unknown>) {
  return Object.entries(metadata || {}).map(([key, value]) => ({
    key,
    value,
  }));
}

function renderMetadataValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (value === null || value === undefined || value === "") {
    return "Not set";
  }

  return String(value);
}

type DownloadLink = {
  label: string;
  description: string;
  href: string;
  kind: "download" | "open" | "attached";
  badge: string;
};

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
  if (normalized === "word") return "word";
  if (normalized === "pdf") return "pdf";
  if (normalized === "csv") return "csv";

  return "excel";
}

function getReportDownloadLink(label: unknown, record: ExportRecord): DownloadLink | null {
  const normalized = normalizeIncludedLabel(label);
  const statementFormat = getStatementFormat(record);

  if (normalized.includes("daily") || normalized.includes("snapshot")) {
    return {
      label: "Daily Admin Report",
      description: "Open the daily operations, finance, growth, and risk report preview.",
      href: "/api/admin/reports/generate?reportType=daily&format=html",
      kind: "download",
      badge: "HTML",
    };
  }

  if (normalized.includes("weekly") || normalized.includes("summary")) {
    return {
      label: "Weekly Admin Report",
      description: "Open the weekly management report preview.",
      href: "/api/admin/reports/generate?reportType=weekly&format=html",
      kind: "download",
      badge: "HTML",
    };
  }

  if (normalized.includes("booking activity")) {
    return {
      label: "Daily Booking Activity CSV",
      description: "Download the daily report dataset with booking activity included.",
      href: "/api/admin/reports/generate?reportType=daily&format=csv",
      kind: "download",
      badge: "CSV",
    };
  }

  if (normalized.includes("payment activity") || normalized.includes("payout watch") || normalized.includes("commission watch") || normalized.includes("exceptions") || normalized.includes("management notes")) {
    return {
      label: String(label || "Management Report"),
      description: "Open the daily/weekly reporting center for this management package item.",
      href: "/admin/reports",
      kind: "open",
      badge: "REPORTS",
    };
  }

  if (normalized.includes("profit") || normalized.includes("loss") || normalized.includes("statement of operations")) {
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
      description: "Download the assets, liabilities, and equity statement export.",
      href: `/api/admin/financials/balance-sheet/export?format=${statementFormat}`,
      kind: "download",
      badge: statementFormat.toUpperCase(),
    };
  }

  if (normalized.includes("cash flow") || normalized.includes("cashflow")) {
    return {
      label: "Cash Flow",
      description: "Download the operating, investing, financing, and reconciliation cash flow export.",
      href: `/api/admin/financials/cash-flow/export?format=${statementFormat}`,
      kind: "download",
      badge: statementFormat.toUpperCase(),
    };
  }

  if (normalized.includes("pro forma") || normalized.includes("forecast")) {
    return {
      label: "Pro Forma",
      description: "Download the forecast, runway, and scenario planning export.",
      href: `/api/admin/financials/pro-forma/export?format=${statementFormat}`,
      kind: "download",
      badge: statementFormat.toUpperCase(),
    };
  }

  if (normalized.includes("general ledger") || normalized.includes("ledger")) {
    return {
      label: "General Ledger",
      description: "Open financial reports for ledger review and supporting detail.",
      href: "/admin/financials/general-ledger",
      kind: "open",
      badge: "OPEN",
    };
  }

  if (normalized.includes("stripe")) {
    return {
      label: "Stripe Reconciliation",
      description: "Open cash flow and reconciliation tools for Stripe fees, disputes, and payouts.",
      href: "/admin/financials/cash-flow",
      kind: "open",
      badge: "RECON",
    };
  }

  if (normalized.includes("bank") || normalized.includes("navy federal")) {
    return {
      label: "Bank Reconciliation",
      description: "Open cash flow tools for Navy Federal checking/savings reconciliation.",
      href: "/admin/financials/cash-flow",
      kind: "open",
      badge: "RECON",
    };
  }

  if (normalized.includes("guru") || normalized.includes("payout")) {
    return {
      label: "Guru Payouts",
      description: "Open payout records and contractor payout support.",
      href: "/admin/payouts",
      kind: "open",
      badge: "OPEN",
    };
  }

  if (normalized.includes("partner") || normalized.includes("commission")) {
    return {
      label: "Partner Commissions",
      description: "Open commission records and partner payout support.",
      href: "/admin/commissions",
      kind: "open",
      badge: "OPEN",
    };
  }

  if (normalized.includes("tax") || normalized.includes("1099") || normalized.includes("deduction")) {
    return {
      label: String(label || "Tax Report"),
      description: "Open tax reports and CPA tax-prep support.",
      href: "/admin/financials/tax-reports",
      kind: "open",
      badge: "TAX",
    };
  }

  if (normalized.includes("invoice")) {
    return {
      label: "Invoice Documents",
      description: "Open invoice records and generated invoice support.",
      href: "/admin/financials/exports",
      kind: "open",
      badge: "OPEN",
    };
  }

  if (normalized.includes("purchase") || normalized.includes("order")) {
    return {
      label: "Purchase Orders",
      description: "Open purchase order records and generated purchase-order support.",
      href: "/admin/financials/exports",
      kind: "open",
      badge: "OPEN",
    };
  }

  return {
    label: String(label || "Supporting Report"),
    description: "Open the relevant SitGuru admin section for this supporting report.",
    href: "/admin/financials/exports",
    kind: "open",
    badge: "SUPPORT",
  };
}

function getDefaultPackageLinks(record: ExportRecord): DownloadLink[] {
  const packageType = normalizeIncludedLabel(record.package_type);
  const reportType = normalizeIncludedLabel(record.report_type);

  if (packageType.includes("monthly") || reportType.includes("cpa")) {
    return [
      "Profit & Loss",
      "Balance Sheet",
      "Cash Flow",
      "General Ledger",
      "Stripe Reconciliation",
      "Bank Reconciliation",
      "Guru Payouts",
      "Partner Commissions",
    ]
      .map((label) => getReportDownloadLink(label, record))
      .filter(Boolean) as DownloadLink[];
  }

  if (packageType.includes("tax") || reportType.includes("tax")) {
    return [
      "Profit & Loss",
      "Balance Sheet",
      "Cash Flow",
      "Tax Summary",
      "Deduction Detail",
      "1099 Review",
      "General Ledger",
      "Stripe Fees",
    ]
      .map((label) => getReportDownloadLink(label, record))
      .filter(Boolean) as DownloadLink[];
  }

  return [
    "Profit & Loss",
    "Balance Sheet",
    "Cash Flow",
    "Pro Forma",
  ]
    .map((label) => getReportDownloadLink(label, record))
    .filter(Boolean) as DownloadLink[];
}

function getDownloadLinks(record: ExportRecord, includedReports: unknown[]) {
  const generatedLinks = includedReports
    .map((item) => getReportDownloadLink(item, record))
    .filter(Boolean) as DownloadLink[];

  const links = generatedLinks.length > 0 ? generatedLinks : getDefaultPackageLinks(record);

  if (record.file_url) {
    return [
      {
        label: "Attached Generated File",
        description: "Open the generated file attached to this export record.",
        href: record.file_url,
        kind: "attached",
        badge: "FILE",
      } satisfies DownloadLink,
      ...links,
    ];
  }

  return links;
}

function DownloadLinkCard({ link }: { link: DownloadLink }) {
  const isDownload = link.kind === "download" || link.kind === "attached";

  return (
    <Link
      href={link.href}
      target={link.href.startsWith("http") ? "_blank" : undefined}
      rel={link.href.startsWith("http") ? "noreferrer" : undefined}
      className="group flex min-h-[132px] flex-col justify-between rounded-[1.5rem] border border-emerald-100 bg-[#fbfefd] p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:bg-white hover:shadow-lg"
    >
      <div>
        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
          {link.badge}
        </span>

        <h3 className="mt-3 text-xl font-black tracking-tight text-slate-950">
          {isDownload ? "Download " : "Open "}
          {link.label}
        </h3>

        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          {link.description}
        </p>
      </div>

      <span className="mt-4 text-sm font-black text-emerald-800 transition group-hover:text-emerald-900">
        {isDownload ? "Download / Open file →" : "Open section →"}
      </span>
    </Link>
  );
}

function DetailCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string;
  tone?: "slate" | "green" | "blue" | "amber";
}) {
  const tones = {
    slate: "border-slate-100 bg-slate-50 text-slate-700",
    green: "border-emerald-100 bg-emerald-50 text-emerald-800",
    blue: "border-blue-100 bg-blue-50 text-blue-800",
    amber: "border-amber-100 bg-amber-50 text-amber-800",
  };

  return (
    <div className={`rounded-[1.25rem] border p-4 ${tones[tone]}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.16em] opacity-70">
        {label}
      </p>
      <p className="mt-2 text-base font-black leading-6">{value}</p>
    </div>
  );
}

function EmptyState({ exportId }: { exportId: string }) {
  return (
    <main className="min-h-screen bg-[#f7fbf8] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-rose-100 bg-white p-8 shadow-sm">
        <Link
          href="/admin/financials/exports"
          className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800"
        >
          ← Back to Export Center
        </Link>

        <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950">
          Export record not found
        </h1>

        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          No financial export history record was found for this ID:
        </p>

        <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-sm font-bold text-white">
          {exportId}
        </pre>
      </div>
    </main>
  );
}

export default async function AdminFinancialExportDetailPage({
  params,
}: PageProps) {
  const { exportId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("financial_export_history")
    .select("*")
    .eq("id", exportId)
    .maybeSingle();

  if (error || !data) {
    return <EmptyState exportId={exportId} />;
  }

  const record = data as ExportRecord;
  const metadataRows = getMetadataArray(record.metadata || {});
  const includedReports = Array.isArray(record.metadata?.included)
    ? (record.metadata.included as unknown[])
    : [];
  const downloadLinks = getDownloadLinks(record, includedReports);

  return (
    <main className="min-h-screen bg-[#f7fbf8] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <Link
                href="/admin/financials/exports"
                className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800 transition hover:bg-emerald-100"
              >
                ← Back to Export Center
              </Link>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ${statusClasses(
                    record.export_status,
                  )}`}
                >
                  {labelize(record.export_status)}
                </span>

                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-blue-800">
                  {labelize(record.export_format)}
                </span>

                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-slate-700">
                  Export Detail
                </span>
              </div>

              <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 lg:text-5xl">
                {record.title}
              </h1>

              <p className="mt-3 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
                Review this saved financial export record, update its workflow
                status, confirm CPA readiness, and track supporting export
                metadata.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[440px]">
              <DetailCard
                label="Created"
                value={formatDateTime(record.created_at)}
                tone="green"
              />
              <DetailCard
                label="Updated"
                value={formatDateTime(record.updated_at)}
                tone="blue"
              />
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
          <div className="space-y-6">
            <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
                Export Summary
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Package Information
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <DetailCard
                  label="Package Type"
                  value={labelize(record.package_type)}
                  tone="green"
                />
                <DetailCard
                  label="Report Type"
                  value={labelize(record.report_type)}
                  tone="blue"
                />
                <DetailCard
                  label="Period"
                  value={record.period_label || "Not set"}
                  tone="amber"
                />
                <DetailCard
                  label="Period Start"
                  value={formatDate(record.period_start)}
                />
                <DetailCard
                  label="Period End"
                  value={formatDate(record.period_end)}
                />
                <DetailCard
                  label="Created By"
                  value={record.created_by || "Admin User"}
                />
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
                Notes
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Export Notes
              </h2>

              <div className="mt-5 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
                <p className="text-sm font-semibold leading-7 text-slate-700">
                  {record.notes || "No notes have been added to this export."}
                </p>
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
                Included Records
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Included Files / Reports
              </h2>

              {includedReports.length > 0 ? (
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {includedReports.map((item, index) => (
                    <div
                      key={`${String(item)}-${index}`}
                      className="rounded-[1.25rem] border border-emerald-100 bg-emerald-50 p-4"
                    >
                      <p className="text-sm font-black text-emerald-900">
                        ✓ {String(item)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
                  <p className="text-sm font-semibold leading-7 text-slate-600">
                    This export does not list individual included files yet.
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
                Download Center
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Package Files and Supporting Reports
              </h2>

              <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                These links connect this saved package to the actual statement
                exports and supporting admin records already wired in SitGuru.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {downloadLinks.map((link) => (
                  <DownloadLinkCard
                    key={`${link.label}-${link.href}`}
                    link={link}
                  />
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <ExportPackageActions
              exportId={record.id}
              packageType={record.package_type}
              format={record.export_format}
              startDate={record.period_start}
              endDate={record.period_end}
            />

            <ExportStatusActions
              exportId={record.id}
              currentStatus={record.export_status}
            />

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
                CPA Readiness
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Review Checklist
              </h2>

              <div className="mt-5 space-y-3">
                {[
                  "Confirm reporting period is correct.",
                  "Review package status before sending.",
                  "Confirm included reports or files.",
                  "Check notes for CPA instructions.",
                  "Attach generated files when export storage is added.",
                ].map((item, index) => (
                  <div
                    key={item}
                    className="flex gap-3 rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-xs font-black text-white">
                      {index + 1}
                    </span>
                    <p className="text-sm font-bold leading-6 text-slate-700">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-blue-100 bg-blue-50 p-5 shadow-sm sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-700">
                Delivery
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Export Delivery
              </h2>

              <div className="mt-5 space-y-3">
                <DetailCard
                  label="Sent To Email"
                  value={record.sent_to_email || "Not sent"}
                  tone="blue"
                />
                <DetailCard
                  label="Sent To Phone"
                  value={record.sent_to_phone || "Not sent"}
                  tone="blue"
                />
                <DetailCard
                  label="File URL"
                  value={record.file_url || "Not attached yet"}
                  tone="blue"
                />
                <DetailCard
                  label="Storage Path"
                  value={record.storage_path || "Not attached yet"}
                  tone="blue"
                />
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                Package Downloads
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Download or open included files
              </h2>

              <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                Use these links to open the live statement exports and supporting
                records included in this package. A future ZIP generator can
                attach one combined file to this same export record.
              </p>

              <div className="mt-5 grid gap-3">
                {downloadLinks.slice(0, 5).map((link) => (
                  <Link
                    key={`${link.label}-${link.href}`}
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                    className="rounded-[1.25rem] border border-emerald-100 bg-emerald-50 p-4 text-sm font-black text-emerald-900 transition hover:border-emerald-300 hover:bg-white"
                  >
                    {link.kind === "download" || link.kind === "attached"
                      ? "Download "
                      : "Open "}
                    {link.label} →
                  </Link>
                ))}
              </div>

              <Link
                href="/admin/financials/exports"
                className="mt-5 inline-flex rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
              >
                Back to Export Center →
              </Link>
            </section>

          </aside>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
            Metadata
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Export Metadata
          </h2>

          {metadataRows.length > 0 ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {metadataRows.map((row) => (
                <div
                  key={row.key}
                  className="rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4"
                >
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                    {labelize(row.key)}
                  </p>
                  <pre className="mt-2 whitespace-pre-wrap break-words text-sm font-bold leading-6 text-slate-700">
                    {renderMetadataValue(row.value)}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
              <p className="text-sm font-semibold leading-7 text-slate-600">
                No metadata is stored for this export record yet.
              </p>
            </div>
          )}
        </section>

        <section className="rounded-[2rem] border border-slate-100 bg-slate-950 p-5 text-white shadow-sm sm:p-6 lg:p-8">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-300">
            Audit Reference
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-tight">
            Raw Export Record
          </h2>

          <pre className="mt-6 max-h-[520px] overflow-auto rounded-[1.5rem] border border-white/10 bg-black/30 p-5 text-xs font-bold leading-6 text-slate-100">
            {JSON.stringify(record, null, 2)}
          </pre>
        </section>
      </div>
    </main>
  );
}