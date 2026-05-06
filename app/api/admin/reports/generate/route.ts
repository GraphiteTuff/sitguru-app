import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type AdminIdentity = {
  id: string;
  email: string;
  role: string;
  canAccessReports: boolean;
  canAccessFinancials: boolean;
};

type ReportType = "daily" | "weekly";
type ReportFormat = "json" | "html" | "csv";

type ReportRequestBody = {
  reportType?: ReportType | string;
  format?: ReportFormat | string;
  startDate?: string | null;
  endDate?: string | null;
  saveRecord?: boolean;
  emailTo?: string | null;
  notes?: string | null;
};

type SourceStatus = {
  table: string;
  ok: boolean;
  rowCount: number;
  message: string;
};

type Metric = {
  label: string;
  value: number;
  formattedValue: string;
  helper: string;
};

type ActionItem = {
  title: string;
  description: string;
  severity: "info" | "success" | "warning" | "critical";
  href: string;
};

type ReportPayload = {
  ok: boolean;
  reportType: ReportType;
  reportName: string;
  generatedAt: string;
  period: {
    label: string;
    startDate: string;
    endDate: string;
  };
  summary: {
    headline: string;
    narrative: string;
  };
  metrics: {
    operations: Metric[];
    financials: Metric[];
    growth: Metric[];
    risk: Metric[];
  };
  sections: {
    title: string;
    rows: Record<string, string | number>[];
  }[];
  actionItems: ActionItem[];
  sourceHealth: SourceStatus[];
  savedExportRecordId?: string | null;
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

const FINANCE_ROLES = [
  "owner",
  "super_admin",
  "admin",
  "finance_admin",
  "finance",
  "accounting",
  "bookkeeper",
];

const SOURCE_TABLES = [
  "bookings",
  "customer_bookings",
  "profiles",
  "users",
  "gurus",
  "launch_signups",
  "messages",
  "payments",
  "stripe_transactions",
  "stripe_balance_transactions",
  "bank_transactions",
  "payouts",
  "guru_payouts",
  "commissions",
  "partner_commissions",
  "financial_audit_logs",
  "admin_audit_logs",
  "analytics_events",
];

const DATE_KEYS = [
  "created_at",
  "updated_at",
  "booking_date",
  "service_date",
  "paid_at",
  "posted_at",
  "transaction_date",
  "payout_date",
  "available_on",
  "sent_at",
  "date",
];

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const cleaned = value.replace(/[$,%\s,()]/g, "");
    const parsed = Number(cleaned);

    if (Number.isFinite(parsed)) {
      return value.includes("(") && value.includes(")") ? -parsed : parsed;
    }
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function centsAwareAmount(value: unknown) {
  const raw = toNumber(value);

  if (Math.abs(raw) >= 10000 && Number.isInteger(raw)) {
    return raw / 100;
  }

  return raw;
}

function money(value: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.abs(value || 0));

  return value < 0 ? `(${formatted})` : formatted;
}

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function percent(value: number) {
  return `${Number.isFinite(value) ? value.toFixed(1) : "0.0"}%`;
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function htmlEscape(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

function normalizeReportType(value: unknown): ReportType {
  const normalized = asTrimmedString(value).toLowerCase();

  if (normalized === "weekly" || normalized === "week") return "weekly";

  return "daily";
}

function normalizeFormat(value: unknown): ReportFormat {
  const normalized = asTrimmedString(value).toLowerCase();

  if (normalized === "html" || normalized === "pdf" || normalized === "print") {
    return "html";
  }

  if (normalized === "csv" || normalized === "excel") return "csv";

  return "json";
}

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDateOrDefault(value: unknown, fallback: Date) {
  const text = asTrimmedString(value);

  if (!text) return dateOnly(fallback);

  const parsed = new Date(text);

  if (Number.isNaN(parsed.getTime())) return dateOnly(fallback);

  return text.slice(0, 10);
}

function getDefaultPeriod(reportType: ReportType) {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);

  if (reportType === "weekly") {
    start.setDate(start.getDate() - 6);
  }

  return {
    startDate: dateOnly(start),
    endDate: dateOnly(end),
  };
}

function periodLabel(reportType: ReportType, startDate: string, endDate: string) {
  const label = reportType === "weekly" ? "Weekly Admin Report" : "Daily Admin Report";

  if (startDate === endDate) {
    return `${label} • ${startDate}`;
  }

  return `${label} • ${startDate} to ${endDate}`;
}

function getRowDate(row: AnyRow) {
  for (const key of DATE_KEYS) {
    const value = asTrimmedString(row[key]);

    if (value) return value;
  }

  return "";
}

function withinPeriod(row: AnyRow, startDate: string, endDate: string) {
  const rawDate = getRowDate(row);

  if (!rawDate) return true;

  const date = new Date(rawDate);

  if (Number.isNaN(date.getTime())) return true;

  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T23:59:59.999Z`);

  return date >= start && date <= end;
}

function getStatus(row: AnyRow) {
  return (
    asTrimmedString(row.status) ||
    asTrimmedString(row.payment_status) ||
    asTrimmedString(row.payout_status) ||
    asTrimmedString(row.commission_status) ||
    asTrimmedString(row.state) ||
    ""
  ).toLowerCase();
}

function getText(row: AnyRow) {
  return Object.entries(row)
    .filter(([, value]) => typeof value === "string" || typeof value === "number")
    .map(([, value]) => String(value))
    .join(" ")
    .toLowerCase();
}

function rowIncludes(row: AnyRow, terms: string[]) {
  const text = `${getStatus(row)} ${getText(row)}`;

  return terms.some((term) => text.includes(term));
}

function getAmount(row: AnyRow) {
  return (
    centsAwareAmount(row.amount) ||
    centsAwareAmount(row.net) ||
    centsAwareAmount(row.gross) ||
    centsAwareAmount(row.total_amount) ||
    centsAwareAmount(row.booking_total) ||
    centsAwareAmount(row.price) ||
    centsAwareAmount(row.subtotal_amount) ||
    centsAwareAmount(row.payment_amount) ||
    centsAwareAmount(row.payout_amount) ||
    centsAwareAmount(row.commission_amount) ||
    centsAwareAmount(row.fee_amount)
  );
}

function sumRows(rows: AnyRow[]) {
  return rows.reduce((sum, row) => sum + Math.abs(getAmount(row)), 0);
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

function hasFinancialRole(role: string) {
  return FINANCE_ROLES.includes(role.trim().toLowerCase());
}

async function safeRows<T>(
  query: PromiseLike<{ data: unknown; error: unknown }>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Report generation query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Report generation query skipped for ${label}:`, error);
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
      "admin_users_report_access",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("profiles")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "profiles_report_access",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("users")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "users_report_access",
    ),
  ]);

  const profile = profileChecks.flat().find(Boolean) || {};
  const role = asTrimmedString(profile.role) || "admin";
  const active =
    profile.is_active === undefined
      ? true
      : getOptionalBoolean(profile.is_active);
  const explicitFinanceAccess = getOptionalBoolean(profile.can_access_financials);
  const envAllowed = envAdminEmails.includes(userEmail);

  return {
    id: user.id,
    email: userEmail,
    role,
    canAccessReports: active && (hasAdminRole(role) || envAllowed),
    canAccessFinancials:
      active && (hasFinancialRole(role) || explicitFinanceAccess || envAllowed),
  };
}

async function requireReportAdmin() {
  const actor = await getAdminIdentity();

  if (!actor?.canAccessReports) return null;

  return actor;
}

async function readSourceTable(table: string, startDate: string, endDate: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error || !data) {
      return {
        rows: [] as AnyRow[],
        source: {
          table,
          ok: false,
          rowCount: 0,
          message: error?.message || "Table unavailable.",
        } satisfies SourceStatus,
      };
    }

    const rows = (data as AnyRow[]).filter((row) =>
      withinPeriod(row, startDate, endDate),
    );

    return {
      rows,
      source: {
        table,
        ok: true,
        rowCount: rows.length,
        message: `Loaded ${rows.length.toLocaleString()} rows.`,
      } satisfies SourceStatus,
    };
  } catch (error) {
    return {
      rows: [] as AnyRow[],
      source: {
        table,
        ok: false,
        rowCount: 0,
        message:
          error instanceof Error ? error.message : "Table unavailable.",
      } satisfies SourceStatus,
    };
  }
}

async function readReportSources(startDate: string, endDate: string) {
  const results = await Promise.all(
    SOURCE_TABLES.map((table) => readSourceTable(table, startDate, endDate)),
  );

  const rowsByTable = new Map<string, AnyRow[]>();

  SOURCE_TABLES.forEach((table, index) => {
    rowsByTable.set(table, results[index].rows);
  });

  return {
    rowsByTable,
    sourceHealth: results.map((result) => result.source),
  };
}

function metric(label: string, value: number, helper: string, formatter: "number" | "money" | "percent" = "number"): Metric {
  const formattedValue =
    formatter === "money" ? money(value) : formatter === "percent" ? percent(value) : number(value);

  return {
    label,
    value,
    formattedValue,
    helper,
  };
}

function recentRows(rows: AnyRow[], limit = 8) {
  return rows.slice(0, limit).map((row, index) => ({
    id:
      asTrimmedString(row.id) ||
      asTrimmedString(row.transaction_id) ||
      asTrimmedString(row.payment_intent_id) ||
      `row-${index + 1}`,
    date: getRowDate(row) || "No date",
    status: getStatus(row) || "recorded",
    description:
      asTrimmedString(row.description) ||
      asTrimmedString(row.title) ||
      asTrimmedString(row.name) ||
      asTrimmedString(row.email) ||
      asTrimmedString(row.type) ||
      "Record",
    amount: getAmount(row) ? money(getAmount(row)) : "—",
  }));
}

async function saveReportRecord({
  actor,
  report,
  format,
  notes,
}: {
  actor: AdminIdentity;
  report: ReportPayload;
  format: ReportFormat;
  notes?: string | null;
}) {
  const payload = {
    title: report.reportName,
    package_type: `${report.reportType}_admin_report`,
    report_type: report.reportType,
    period_label: report.period.label,
    period_start: report.period.startDate,
    period_end: report.period.endDate,
    export_format: format,
    export_status: "ready",
    created_by: actor.email,
    created_by_user_id: actor.id,
    notes:
      notes ||
      `${report.reportName} generated from SitGuru Daily/Weekly Report Generation.`,
    metadata: {
      source: "admin_reports_generate_api",
      generatedAt: report.generatedAt,
      reportType: report.reportType,
      metrics: report.metrics,
      actionItems: report.actionItems,
      sourceHealth: report.sourceHealth,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("financial_export_history")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    console.warn("Unable to save generated report record:", error);
    return null;
  }

  await writeAuditLog({
    actor,
    action: `generate_${report.reportType}_admin_report`,
    targetId: asTrimmedString((data as AnyRow).id),
    metadata: {
      reportType: report.reportType,
      format,
      period: report.period,
      metricGroups: Object.keys(report.metrics),
    },
  });

  return asTrimmedString((data as AnyRow).id);
}

async function writeAuditLog({
  actor,
  action,
  targetId,
  metadata,
}: {
  actor: AdminIdentity;
  action: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const payload = {
    actor_id: actor.id,
    actor_email: actor.email,
    actor_role: actor.role,
    action,
    area: "admin.reports",
    target_type: "financial_export_history",
    target_id: targetId || null,
    metadata: metadata || {},
    created_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabaseAdmin
      .from("admin_audit_logs")
      .insert(payload);

    if (!error) return;
  } catch {
    // Fall through to financial audit log fallback.
  }

  try {
    await supabaseAdmin.from("financial_audit_logs").insert(payload);
  } catch (error) {
    console.warn("Generated report audit log skipped:", error);
  }
}

async function buildReport({
  reportType,
  startDate,
  endDate,
}: {
  reportType: ReportType;
  startDate: string;
  endDate: string;
}): Promise<ReportPayload> {
  const { rowsByTable, sourceHealth } = await readReportSources(startDate, endDate);

  const bookings = [
    ...(rowsByTable.get("bookings") || []),
    ...(rowsByTable.get("customer_bookings") || []),
  ];
  const users = [
    ...(rowsByTable.get("profiles") || []),
    ...(rowsByTable.get("users") || []),
  ];
  const gurus = rowsByTable.get("gurus") || [];
  const launchSignups = rowsByTable.get("launch_signups") || [];
  const messages = rowsByTable.get("messages") || [];
  const payments = [
    ...(rowsByTable.get("payments") || []),
    ...(rowsByTable.get("stripe_transactions") || []),
    ...(rowsByTable.get("stripe_balance_transactions") || []),
  ];
  const bankRows = rowsByTable.get("bank_transactions") || [];
  const payoutRows = [
    ...(rowsByTable.get("payouts") || []),
    ...(rowsByTable.get("guru_payouts") || []),
  ];
  const commissionRows = [
    ...(rowsByTable.get("commissions") || []),
    ...(rowsByTable.get("partner_commissions") || []),
  ];
  const auditRows = [
    ...(rowsByTable.get("financial_audit_logs") || []),
    ...(rowsByTable.get("admin_audit_logs") || []),
    ...(rowsByTable.get("analytics_events") || []),
  ];

  const completedBookings = bookings.filter((row) =>
    rowIncludes(row, ["completed", "complete", "paid", "confirmed"]),
  );
  const canceledBookings = bookings.filter((row) =>
    rowIncludes(row, ["cancel", "void", "refund"]),
  );
  const pendingGuruApprovals = gurus.filter((row) =>
    rowIncludes(row, ["pending", "review", "new"]),
  );
  const failedPayments = payments.filter((row) =>
    rowIncludes(row, ["failed", "dispute", "chargeback", "refund"]),
  );
  const payoutIssues = payoutRows.filter((row) =>
    rowIncludes(row, ["failed", "returned", "pending", "review"]),
  );
  const criticalAudit = auditRows.filter((row) =>
    rowIncludes(row, ["critical", "failed", "delete", "void", "permission", "security"]),
  );

  const grossBookingVolume = sumRows(bookings);
  const paymentVolume = sumRows(payments.filter((row) => !rowIncludes(row, ["fee", "refund"])));
  const refundsAndDisputes = sumRows(failedPayments);
  const payoutVolume = sumRows(payoutRows);
  const commissionVolume = sumRows(commissionRows);
  const bankVolume = sumRows(bankRows);

  const actionItems: ActionItem[] = [];

  if (failedPayments.length > 0) {
    actionItems.push({
      title: `${failedPayments.length} payment/refund/dispute item${failedPayments.length === 1 ? "" : "s"} need review`,
      description:
        "Review failed payments, refunds, disputes, or chargebacks before the next close.",
      severity: "critical",
      href: "/admin/financials/cash-flow",
    });
  }

  if (payoutIssues.length > 0) {
    actionItems.push({
      title: `${payoutIssues.length} payout item${payoutIssues.length === 1 ? "" : "s"} need review`,
      description:
        "Review pending, returned, failed, or exception payout activity.",
      severity: "warning",
      href: "/admin/payouts",
    });
  }

  if (pendingGuruApprovals.length > 0) {
    actionItems.push({
      title: `${pendingGuruApprovals.length} Guru approval item${pendingGuruApprovals.length === 1 ? "" : "s"}`,
      description:
        "Review pending Guru onboarding, approval, or profile-completion items.",
      severity: "info",
      href: "/admin/gurus",
    });
  }

  if (criticalAudit.length > 0) {
    actionItems.push({
      title: `${criticalAudit.length} audit/security item${criticalAudit.length === 1 ? "" : "s"} flagged`,
      description:
        "Review critical admin, financial, security, delete, permission, or void events.",
      severity: "warning",
      href: "/admin/audit-trail",
    });
  }

  if (actionItems.length === 0) {
    actionItems.push({
      title: "No critical report issues detected",
      description:
        "No failed payments, payout blockers, security events, or approval blockers were found in this report period.",
      severity: "success",
      href: "/admin/reports",
    });
  }

  const generatedAt = new Date().toISOString();
  const reportName = reportType === "weekly" ? "Weekly Admin Report" : "Daily Admin Report";
  const period = {
    label: periodLabel(reportType, startDate, endDate),
    startDate,
    endDate,
  };

  return {
    ok: true,
    reportType,
    reportName,
    generatedAt,
    period,
    summary: {
      headline:
        reportType === "weekly"
          ? "Weekly SitGuru operations, growth, finance, and risk summary."
          : "Daily SitGuru operations, finance, growth, and admin summary.",
      narrative: `${reportName} generated for ${period.label}. It includes bookings, users, Gurus, signups, messages, payments, Stripe/Navy Federal activity, payouts, commissions, audit events, and review items.`,
    },
    metrics: {
      operations: [
        metric("Bookings", bookings.length, "Bookings created or updated in period."),
        metric("Completed Bookings", completedBookings.length, "Completed/confirmed/paid booking rows."),
        metric("Canceled / Refund Related", canceledBookings.length, "Canceled, voided, or refund-related booking rows."),
        metric("Messages", messages.length, "Admin/customer/Guru messages in period."),
      ],
      financials: [
        metric("Gross Booking Volume", grossBookingVolume, "Booking amount activity.", "money"),
        metric("Payments / Stripe Volume", paymentVolume, "Payment and Stripe amount activity.", "money"),
        metric("Refunds / Disputes", refundsAndDisputes, "Refund, failed payment, dispute, or chargeback activity.", "money"),
        metric("Bank Activity", bankVolume, "Navy Federal/checking/savings transaction activity.", "money"),
        metric("Guru Payouts", payoutVolume, "Guru payout activity.", "money"),
        metric("Partner Commissions", commissionVolume, "Partner or affiliate commission activity.", "money"),
      ],
      growth: [
        metric("New / Updated Users", users.length, "Profiles and user rows in period."),
        metric("Guru Activity", gurus.length, "Guru rows in period."),
        metric("Pending Guru Reviews", pendingGuruApprovals.length, "Guru rows with pending/review status."),
        metric("Launch Signups", launchSignups.length, "Launch signup rows in period."),
      ],
      risk: [
        metric("Failed / Dispute Items", failedPayments.length, "Payments, disputes, refunds, and chargebacks needing review."),
        metric("Payout Issues", payoutIssues.length, "Pending, returned, failed, or review payout rows."),
        metric("Audit Events", auditRows.length, "Admin, financial, and analytics audit events."),
        metric("Critical Audit Flags", criticalAudit.length, "Audit/security rows with elevated terms."),
      ],
    },
    sections: [
      {
        title: "Recent Bookings",
        rows: recentRows(bookings),
      },
      {
        title: "Recent Payments / Stripe",
        rows: recentRows(payments),
      },
      {
        title: "Recent Bank Activity",
        rows: recentRows(bankRows),
      },
      {
        title: "Recent Payouts",
        rows: recentRows(payoutRows),
      },
      {
        title: "Recent Audit Events",
        rows: recentRows(auditRows),
      },
    ],
    actionItems,
    sourceHealth,
  };
}

function buildCsv(report: ReportPayload) {
  const rows: unknown[][] = [
    ["Report", report.reportName],
    ["Generated At", report.generatedAt],
    ["Period", report.period.label],
    [],
    ["Metric Group", "Metric", "Value", "Helper"],
  ];

  Object.entries(report.metrics).forEach(([group, metrics]) => {
    metrics.forEach((item) => {
      rows.push([group, item.label, item.formattedValue, item.helper]);
    });
  });

  rows.push([]);
  rows.push(["Action Items"]);
  rows.push(["Severity", "Title", "Description", "Href"]);
  report.actionItems.forEach((item) => {
    rows.push([item.severity, item.title, item.description, item.href]);
  });

  rows.push([]);
  rows.push(["Source Health"]);
  rows.push(["Table", "OK", "Rows", "Message"]);
  report.sourceHealth.forEach((source) => {
    rows.push([source.table, source.ok ? "yes" : "no", source.rowCount, source.message]);
  });

  report.sections.forEach((section) => {
    rows.push([]);
    rows.push([section.title]);

    if (section.rows.length > 0) {
      rows.push(Object.keys(section.rows[0]));
      section.rows.forEach((row) => rows.push(Object.values(row)));
    } else {
      rows.push(["No rows"]);
    }
  });

  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

function buildHtml(report: ReportPayload) {
  const metricSections = Object.entries(report.metrics)
    .map(
      ([group, metrics]) => `
        <section class="card">
          <h2>${htmlEscape(group)}</h2>
          <div class="metrics">
            ${metrics
              .map(
                (metricItem) => `
                  <div class="metric">
                    <p class="label">${htmlEscape(metricItem.label)}</p>
                    <p class="value">${htmlEscape(metricItem.formattedValue)}</p>
                    <p class="helper">${htmlEscape(metricItem.helper)}</p>
                  </div>
                `,
              )
              .join("")}
          </div>
        </section>
      `,
    )
    .join("");

  const actionItems = report.actionItems
    .map(
      (item) => `
        <div class="action ${htmlEscape(item.severity)}">
          <strong>${htmlEscape(item.title)}</strong>
          <p>${htmlEscape(item.description)}</p>
          <small>${htmlEscape(item.href)}</small>
        </div>
      `,
    )
    .join("");

  const sourceHealth = report.sourceHealth
    .map(
      (source) => `
        <tr>
          <td>${htmlEscape(source.table)}</td>
          <td>${source.ok ? "Connected" : "Unavailable"}</td>
          <td>${htmlEscape(source.rowCount)}</td>
          <td>${htmlEscape(source.message)}</td>
        </tr>
      `,
    )
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${htmlEscape(report.reportName)}</title>
  <style>
    body {
      margin: 0;
      background: #f7fbf8;
      color: #0f172a;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .page {
      max-width: 1180px;
      margin: 0 auto;
      padding: 32px;
    }
    .hero, .card {
      background: white;
      border: 1px solid #d1fae5;
      border-radius: 28px;
      padding: 28px;
      margin-bottom: 18px;
    }
    .eyebrow {
      color: #047857;
      text-transform: uppercase;
      letter-spacing: .22em;
      font-size: 12px;
      font-weight: 900;
    }
    h1 {
      margin: 10px 0;
      font-size: 42px;
      line-height: 1;
    }
    h2 {
      margin: 0 0 18px;
      font-size: 24px;
    }
    .muted {
      color: #64748b;
      font-weight: 650;
      line-height: 1.6;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }
    .metric {
      border-radius: 18px;
      background: #ecfdf5;
      border: 1px solid #d1fae5;
      padding: 16px;
    }
    .label {
      color: #047857;
      font-size: 11px;
      font-weight: 900;
      letter-spacing: .14em;
      margin: 0;
      text-transform: uppercase;
    }
    .value {
      font-size: 24px;
      font-weight: 900;
      margin: 8px 0;
    }
    .helper {
      color: #64748b;
      font-size: 12px;
      font-weight: 700;
      line-height: 1.5;
      margin: 0;
    }
    .action {
      border-radius: 18px;
      border: 1px solid #e2e8f0;
      padding: 16px;
      margin: 10px 0;
      background: #f8fafc;
    }
    .critical { border-color: #fecdd3; background: #fff1f2; }
    .warning { border-color: #fde68a; background: #fffbeb; }
    .success { border-color: #bbf7d0; background: #f0fdf4; }
    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      overflow: hidden;
      border-radius: 18px;
    }
    th, td {
      border-top: 1px solid #e2e8f0;
      padding: 12px;
      text-align: left;
      font-size: 12px;
      vertical-align: top;
    }
    th {
      background: #f1f5f9;
      text-transform: uppercase;
      letter-spacing: .12em;
      font-size: 11px;
    }
    @media print {
      body { background: white; }
      .page { max-width: none; padding: 0; }
      .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
  </style>
</head>
<body>
  <div class="page">
    <section class="hero">
      <p class="eyebrow">SitGuru Admin Report</p>
      <h1>${htmlEscape(report.reportName)}</h1>
      <p class="muted">${htmlEscape(report.period.label)}</p>
      <p class="muted">${htmlEscape(report.summary.narrative)}</p>
    </section>

    ${metricSections}

    <section class="card">
      <h2>Action Items</h2>
      ${actionItems}
    </section>

    <section class="card">
      <h2>Source Health</h2>
      <table>
        <thead>
          <tr><th>Table</th><th>Status</th><th>Rows</th><th>Message</th></tr>
        </thead>
        <tbody>${sourceHealth}</tbody>
      </table>
    </section>
  </div>
</body>
</html>`;
}

async function respondWithReport({
  actor,
  reportType,
  format,
  startDate,
  endDate,
  saveRecord,
  notes,
}: {
  actor: AdminIdentity;
  reportType: ReportType;
  format: ReportFormat;
  startDate: string;
  endDate: string;
  saveRecord: boolean;
  notes?: string | null;
}) {
  const report = await buildReport({
    reportType,
    startDate,
    endDate,
  });

  if (saveRecord) {
    report.savedExportRecordId = await saveReportRecord({
      actor,
      report,
      format,
      notes,
    });
  } else {
    await writeAuditLog({
      actor,
      action: `preview_${reportType}_admin_report`,
      metadata: {
        reportType,
        format,
        period: report.period,
      },
    });
  }

  if (format === "csv") {
    return new NextResponse(buildCsv(report), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="sitguru-${reportType}-admin-report.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  if (format === "html") {
    return new NextResponse(buildHtml(report), {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json(report, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: Request) {
  const actor = await requireReportAdmin();

  if (!actor) {
    return NextResponse.json(
      { ok: false, message: "Not authorized to generate reports." },
      { status: 403 },
    );
  }

  const url = new URL(request.url);
  const reportType = normalizeReportType(url.searchParams.get("reportType"));
  const format = normalizeFormat(url.searchParams.get("format"));
  const defaults = getDefaultPeriod(reportType);
  const startDate = getDateOrDefault(url.searchParams.get("startDate"), new Date(defaults.startDate));
  const endDate = getDateOrDefault(url.searchParams.get("endDate"), new Date(defaults.endDate));
  const saveRecord = getOptionalBoolean(url.searchParams.get("saveRecord"));

  return respondWithReport({
    actor,
    reportType,
    format,
    startDate,
    endDate,
    saveRecord,
  });
}

export async function POST(request: Request) {
  const actor = await requireReportAdmin();

  if (!actor) {
    return NextResponse.json(
      { ok: false, message: "Not authorized to generate reports." },
      { status: 403 },
    );
  }

  let body: ReportRequestBody = {};

  try {
    body = (await request.json()) as ReportRequestBody;
  } catch {
    body = {};
  }

  const reportType = normalizeReportType(body.reportType);
  const format = normalizeFormat(body.format);
  const defaults = getDefaultPeriod(reportType);
  const startDate = getDateOrDefault(body.startDate, new Date(defaults.startDate));
  const endDate = getDateOrDefault(body.endDate, new Date(defaults.endDate));
  const saveRecord = body.saveRecord === undefined ? true : getOptionalBoolean(body.saveRecord);

  return respondWithReport({
    actor,
    reportType,
    format,
    startDate,
    endDate,
    saveRecord,
    notes: body.notes,
  });
}
