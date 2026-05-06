import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type ReportHistoryItem = {
  id: string;
  title: string;
  packageType: string;
  reportType: string;
  periodLabel: string;
  format: string;
  status: string;
  createdBy: string;
  createdAt: string;
  href: string;
};

type AdminIdentity = {
  id: string;
  email: string;
  role: string;
  canAccessReports: boolean;
};

const ADMIN_ROLES = [
  "owner",
  "super_admin",
  "admin",
  "finance_admin",
  "finance",
  "accounting",
  "bookkeeper",
  "operations",
  "support_admin",
  "moderator",
];

const reportCards = [
  {
    eyebrow: "Daily",
    title: "Daily Admin Report",
    description:
      "Generate a daily operating report covering bookings, customers, Gurus, messages, payments, payouts, Stripe, Navy Federal activity, and audit items.",
    reportType: "daily",
    tone: "green",
    items: [
      "Last 24 hours by default",
      "Operations, finance, growth, and risk metrics",
      "Failed payments, payout issues, and audit flags",
      "HTML preview, CSV download, or saved history record",
    ],
  },
  {
    eyebrow: "Weekly",
    title: "Weekly Admin Report",
    description:
      "Generate a weekly management report for leadership review, business tracking, payout monitoring, growth trends, and financial readiness.",
    reportType: "weekly",
    tone: "blue",
    items: [
      "Last 7 days by default",
      "Booking, revenue, customer, and Guru trends",
      "Stripe, bank, payout, commission, and audit overview",
      "Save report records for admin history and review",
    ],
  },
];

const formatCards = [
  {
    title: "Open HTML Report",
    description: "Preview a clean printable report in the browser.",
    format: "html",
    label: "Open HTML",
  },
  {
    title: "Download CSV Report",
    description: "Download report metrics, actions, source health, and recent rows.",
    format: "csv",
    label: "Download CSV",
  },
  {
    title: "JSON Preview",
    description: "View the raw structured report payload for testing or integration.",
    format: "json",
    label: "Open JSON",
  },
];

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalBoolean(value: unknown) {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "yes", "1"].includes(normalized)) return true;
    if (["false", "no", "0"].includes(normalized)) return false;
  }

  return false;
}

function getEnvAdminEmails() {
  return String(
    process.env.SITGURU_FINANCE_ADMIN_EMAILS ||
      process.env.ADMIN_EMAILS ||
      process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
      "",
  )
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function hasAdminRole(role: string) {
  return ADMIN_ROLES.includes(role.trim().toLowerCase());
}

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Reports page query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Reports page query skipped for ${label}:`, error);
    return [];
  }
}

async function getAdminIdentity(): Promise<AdminIdentity | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const userEmail = (user.email || "").toLowerCase();
  const envAdminEmails = getEnvAdminEmails();

  const profileChecks = await Promise.all([
    safeRows<AnyRow>(
      supabaseAdmin
        .from("admin_users")
        .select("role,email,is_active,can_access_financials")
        .eq("user_id", user.id)
        .limit(1),
      "admin_users_reports_access",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("profiles")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "profiles_reports_access",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("users")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "users_reports_access",
    ),
  ]);

  const profile = profileChecks.flat().find(Boolean) || {};
  const role = asTrimmedString(profile.role) || "admin";
  const active =
    profile.is_active === undefined
      ? true
      : getOptionalBoolean(profile.is_active);
  const envAllowed = envAdminEmails.includes(userEmail);

  return {
    id: user.id,
    email: userEmail,
    role,
    canAccessReports: active && (hasAdminRole(role) || envAllowed),
  };
}

function labelize(value: string | null | undefined) {
  if (!value) return "Not set";

  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function statusClasses(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("ready") || normalized.includes("sent")) {
    return "border-emerald-100 bg-emerald-50 text-emerald-800";
  }

  if (normalized.includes("processing")) {
    return "border-blue-100 bg-blue-50 text-blue-800";
  }

  if (normalized.includes("failed")) {
    return "border-rose-100 bg-rose-50 text-rose-800";
  }

  return "border-amber-100 bg-amber-50 text-amber-800";
}

function cardTone(tone: string) {
  const tones: Record<string, string> = {
    green: "border-emerald-100 bg-emerald-50 text-emerald-800",
    blue: "border-blue-100 bg-blue-50 text-blue-800",
    amber: "border-amber-100 bg-amber-50 text-amber-800",
  };

  return tones[tone] || tones.green;
}

async function getReportHistory() {
  const rows = await safeRows<AnyRow>(
    supabaseAdmin
      .from("financial_export_history")
      .select("*")
      .in("package_type", ["daily_admin_report", "weekly_admin_report"])
      .order("created_at", { ascending: false })
      .limit(12),
    "financial_export_history_reports",
  );

  return rows.map<ReportHistoryItem>((row, index) => ({
    id: asTrimmedString(row.id) || `report-history-${index}`,
    title: asTrimmedString(row.title) || "Admin Report",
    packageType: asTrimmedString(row.package_type) || "admin_report",
    reportType: asTrimmedString(row.report_type) || "report",
    periodLabel: asTrimmedString(row.period_label) || "Current period",
    format: asTrimmedString(row.export_format) || "json",
    status: asTrimmedString(row.export_status) || "ready",
    createdBy: asTrimmedString(row.created_by) || "SitGuru Admin",
    createdAt: asTrimmedString(row.created_at),
    href: `/admin/financials/exports/${asTrimmedString(row.id)}`,
  }));
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
        {eyebrow}
      </p>

      <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
        {title}
      </h2>

      {description ? (
        <p className="mt-2 max-w-4xl text-sm font-semibold leading-7 text-slate-600">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function ActionLink({
  href,
  label,
  primary = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className={
        primary
          ? "inline-flex rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-700/10 transition hover:bg-emerald-800"
          : "inline-flex rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm font-black text-slate-950 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
      }
    >
      {label}
    </Link>
  );
}

function GenerateForm({
  reportType,
  title,
}: {
  reportType: string;
  title: string;
}) {
  return (
    <form
      action="/api/admin/reports/generate"
      method="GET"
      target="_blank"
      className="mt-5 rounded-[1.5rem] border border-slate-100 bg-white p-4"
    >
      <input type="hidden" name="reportType" value={reportType} />

      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        Generate {title}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Start Date
          </label>
          <input
            type="date"
            name="startDate"
            className="mt-2 w-full rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          />
        </div>

        <div>
          <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            End Date
          </label>
          <input
            type="date"
            name="endDate"
            className="mt-2 w-full rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
          Format
        </label>
        <select
          name="format"
          defaultValue="html"
          className="mt-2 w-full rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
        >
          <option value="html">HTML / Print Preview</option>
          <option value="csv">CSV Download</option>
          <option value="json">JSON Preview</option>
        </select>
      </div>

      <label className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-bold text-emerald-900">
        <input
          type="checkbox"
          name="saveRecord"
          value="true"
          className="h-4 w-4 rounded border-emerald-300"
        />
        Save generated report to Export History
      </label>

      <button
        type="submit"
        className="mt-4 w-full rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/10 transition hover:bg-emerald-800"
      >
        Generate Report
      </button>
    </form>
  );
}

export default async function AdminReportsPage() {
  const actor = await getAdminIdentity();

  if (!actor?.canAccessReports) {
    return null;
  }

  const reportHistory = await getReportHistory();

  return (
    <main className="min-h-screen bg-[#f7fbf8] px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1650px] space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-5xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                Admin / Reports
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Daily & Weekly Report Generation.
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-semibold leading-7 text-slate-600 sm:text-base">
                Generate operating reports for SitGuru leadership, admin review,
                support, finance, payouts, Stripe/Navy Federal reconciliation,
                growth tracking, and audit monitoring. Reports can be opened as
                HTML, downloaded as CSV, viewed as JSON, or saved to export
                history.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <ActionLink href="/admin/analytics" label="Analytics" />
              <ActionLink href="/admin/audit-trail" label="Audit Trail" />
              <ActionLink href="/admin/financials/exports" label="Financial Exports" />
              <ActionLink href="/admin/financials" label="Financials" primary />
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                Report Types
              </p>
              <p className="mt-3 text-3xl font-black text-slate-950">2</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                Daily and weekly report generation.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                Formats
              </p>
              <p className="mt-3 text-3xl font-black text-slate-950">3</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                HTML, CSV, and JSON.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-amber-100 bg-amber-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
                Saved Reports
              </p>
              <p className="mt-3 text-3xl font-black text-slate-950">
                {reportHistory.length.toLocaleString()}
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                Recent daily/weekly records in export history.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-600">
                Status
              </p>
              <p className="mt-3 text-3xl font-black text-slate-950">Live</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                Connected to the report generation API.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          {reportCards.map((card) => (
            <article
              key={card.reportType}
              className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8"
            >
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${cardTone(
                  card.tone,
                )}`}
              >
                {card.eyebrow}
              </span>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                {card.title}
              </h2>

              <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                {card.description}
              </p>

              <div className="mt-5 grid gap-2">
                {card.items.map((item) => (
                  <p
                    key={item}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-bold leading-6 text-slate-600"
                  >
                    ✓ {item}
                  </p>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <ActionLink
                  href={`/api/admin/reports/generate?reportType=${card.reportType}&format=html`}
                  label="Open HTML"
                  primary
                />
                <ActionLink
                  href={`/api/admin/reports/generate?reportType=${card.reportType}&format=csv`}
                  label="Download CSV"
                />
                <ActionLink
                  href={`/api/admin/reports/generate?reportType=${card.reportType}&format=json`}
                  label="Open JSON"
                />
              </div>

              <GenerateForm reportType={card.reportType} title={card.title} />
            </article>
          ))}
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="Formats"
            title="Report Output Options"
            description="Start simple with browser previews and CSV downloads. Later, we can add scheduled email delivery, PDF attachments, and stored report files."
          />

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {formatCards.map((format) => (
              <div
                key={format.format}
                className="rounded-[1.5rem] border border-emerald-100 bg-[#fbfefd] p-5 shadow-sm"
              >
                <h3 className="text-xl font-black text-slate-950">
                  {format.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {format.description}
                </p>
                <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  {format.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.55fr]">
          <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <SectionHeader
              eyebrow="Recent Reports"
              title="Saved Daily / Weekly Report History"
              description="Reports saved from the generation API are stored in export history so they can be reviewed, marked ready/sent, and included in admin audit trails."
            />

            {reportHistory.length > 0 ? (
              <div className="mt-6 overflow-x-auto rounded-[1.5rem] border border-slate-100">
                <table className="min-w-[900px] divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      {[
                        "Report",
                        "Period",
                        "Format",
                        "Status",
                        "Created By",
                        "Created",
                        "Open",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.16em] text-slate-500"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {reportHistory.map((item) => (
                      <tr key={item.id} className="align-top">
                        <td className="px-4 py-4">
                          <p className="text-sm font-black text-slate-950">
                            {item.title}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {labelize(item.packageType)}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-sm font-bold text-slate-700">
                          {item.periodLabel}
                        </td>
                        <td className="px-4 py-4 text-sm font-black uppercase text-slate-700">
                          {item.format}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${statusClasses(
                              item.status,
                            )}`}
                          >
                            {labelize(item.status)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm font-bold text-slate-700">
                          {item.createdBy}
                        </td>
                        <td className="px-4 py-4 text-sm font-bold text-slate-700">
                          {formatDateTime(item.createdAt)}
                        </td>
                        <td className="px-4 py-4">
                          <Link
                            href={item.href}
                            className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800 transition hover:bg-white"
                          >
                            Open →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <p className="text-lg font-black text-slate-950">
                  No saved daily or weekly reports yet.
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Generate a report with “Save generated report to Export
                  History” checked to populate this section.
                </p>
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-amber-100 bg-amber-50 p-5 shadow-sm sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-800">
                Next Upgrade
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Scheduled Delivery
              </h2>
              <p className="mt-3 text-sm font-semibold leading-7 text-slate-700">
                The report API is ready. Next, we can add scheduled daily and
                weekly email delivery with PDF/CSV attachments, saved file URLs,
                and notification/audit logging.
              </p>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                Source Coverage
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Included Areas
              </h2>

              <div className="mt-5 space-y-3">
                {[
                  "Bookings and customer activity",
                  "Guru growth and pending approvals",
                  "Messages and support activity",
                  "Payments and Stripe activity",
                  "Navy Federal bank activity",
                  "Payouts and partner commissions",
                  "Audit Trail and analytics events",
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
          </aside>
        </section>
      </div>
    </main>
  );
}
