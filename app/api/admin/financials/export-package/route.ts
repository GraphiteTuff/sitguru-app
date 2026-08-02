import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireFinanceAdminApi } from "@/lib/admin/financials/access";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type AdminIdentity = {
  id: string;
  email: string;
  role: string;
  canAccessFinancials: boolean;
};

type PackageFormat = "csv" | "excel" | "word" | "pdf";

type PackageRequestBody = {
  exportId?: string;
  packageType?: string;
  format?: PackageFormat | "xlsx" | "doc" | "docx" | "html" | "print";
  startDate?: string | null;
  endDate?: string | null;
  emailTo?: string | null;
  message?: string | null;
};

type PackageDownloadLink = {
  label: string;
  description: string;
  href: string;
  format: PackageFormat;
  included: boolean;
  source: string;
};

const DEFAULT_MONTHLY_CPA_ITEMS = [
  "Profit & Loss",
  "Balance Sheet",
  "Cash Flow",
  "General Ledger",
  "Stripe Reconciliation",
  "Bank Reconciliation",
  "Guru Payouts",
  "Partner Commissions",
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

function safeMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function normalizeFormat(value: unknown): PackageFormat {
  const normalized = asTrimmedString(value).toLowerCase();

  if (normalized === "xlsx") return "excel";
  if (normalized === "xls") return "excel";
  if (normalized === "doc") return "word";
  if (normalized === "docx") return "word";
  if (normalized === "html") return "pdf";
  if (normalized === "print") return "pdf";
  if (normalized === "csv") return "csv";
  if (normalized === "word") return "word";
  if (normalized === "pdf") return "pdf";

  return "excel";
}

function normalizeIncludedLabel(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getDateParam(name: "startDate" | "endDate", value: unknown) {
  const text = asTrimmedString(value);

  if (!text) return null;

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) return null;

  return text.slice(0, 10);
}

function appendDateRange(href: string, startDate: string | null, endDate: string | null) {
  const params = new URLSearchParams();

  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);

  const query = params.toString();

  if (!query) return href;

  return `${href}${href.includes("?") ? "&" : "?"}${query}`;
}

async function safeRows<T>(
  query: PromiseLike<{ data: unknown; error: unknown }>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Export package query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Export package query skipped for ${label}:`, error);
    return [];
  }
}

async function requireFinancialAdmin() {
  const financeCheck = await requireFinanceAdminApi();
  if (!financeCheck.identity) return null;
  return {
    id: financeCheck.identity.id,
    email: financeCheck.identity.email,
    role: financeCheck.identity.role,
    canAccessFinancials: true,
  };
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
    area: "financials.export_packages",
    target_type: "financial_export_history",
    target_id: targetId || null,
    metadata: metadata || {},
    created_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabaseAdmin
      .from("financial_audit_logs")
      .insert(payload);

    if (!error) return;
  } catch {
    // Keep package creation from failing if audit tables are not ready.
  }

  try {
    await supabaseAdmin.from("admin_audit_logs").insert(payload);
  } catch (error) {
    console.warn("Export package audit log skipped:", error);
  }
}

async function getExportRecord(exportId: string) {
  if (!exportId) return null;

  const rows = await safeRows<AnyRow>(
    supabaseAdmin
      .from("financial_export_history")
      .select("*")
      .eq("id", exportId)
      .limit(1),
    "financial_export_history_record",
  );

  return rows[0] || null;
}

function normalizePackageFormat(format: PackageFormat | string): PackageFormat {
  const normalized = String(format || "").toLowerCase();
  if (normalized === "zip") return "excel";
  if (normalized === "xlsx" || normalized === "xls") return "excel";
  if (normalized === "doc" || normalized === "docx") return "word";
  if (normalized === "html" || normalized === "print") return "pdf";
  if (normalized === "csv") return "csv";
  if (normalized === "word") return "word";
  if (normalized === "pdf") return "pdf";
  return "excel";
}

function buildDownloadLinks({
  record,
  included,
  format: rawFormat,
  startDate,
  endDate,
}: {
  record: AnyRow | null;
  included: unknown[];
  format: PackageFormat;
  startDate: string | null;
  endDate: string | null;
}) {
  const labels = included.length ? included : DEFAULT_MONTHLY_CPA_ITEMS;
  const links: PackageDownloadLink[] = [];
  const format = normalizePackageFormat(rawFormat);

  function addUnique(link: PackageDownloadLink) {
    if (!links.some((existing) => existing.href === link.href && existing.label === link.label)) {
      links.push(link);
    }
  }

  for (const item of labels) {
    const normalized = normalizeIncludedLabel(item);

    if (normalized.includes("daily") || normalized.includes("snapshot")) {
      addUnique({
        label: "Daily Admin Report",
        description: "Open the daily operations, finance, growth, and risk report preview.",
        href: "/api/admin/reports/generate?reportType=daily&format=html",
        format,
        included: true,
        source: "daily-admin-report",
      });
      continue;
    }

    if (normalized.includes("weekly") || normalized === "weekly summary") {
      addUnique({
        label: "Weekly Admin Report",
        description: "Open the weekly management report preview.",
        href: "/admin/financials/reports/weekly",
        format,
        included: true,
        source: "weekly-admin-report",
      });
      continue;
    }

    if (normalized.includes("booking activity")) {
      addUnique({
        label: "Daily Booking Activity CSV",
        description: "Download daily report CSV with booking activity included.",
        href: "/api/admin/reports/generate?reportType=daily&format=csv",
        format,
        included: true,
        source: "daily-booking-activity",
      });
      continue;
    }

    if (normalized.includes("payment activity") || normalized.includes("payout watch") || normalized.includes("commission watch") || normalized.includes("exceptions") || normalized.includes("management notes")) {
      addUnique({
        label: String(item || "Management Report"),
        description: "Open the Daily / Weekly Reports page for this management package item.",
        href: "/admin/financials/reports/daily",
        format,
        included: true,
        source: "management-reporting",
      });
      continue;
    }

    if (
      normalized.includes("profit") ||
      normalized.includes("loss") ||
      normalized.includes("statement of operations")
    ) {
      addUnique({
        label: "Profit & Loss",
        description: "Statement of Operations export.",
        href: appendDateRange(
          `/api/admin/financials/profit-loss/export?format=${format}`,
          startDate,
          endDate,
        ),
        format,
        included: true,
        source: "profit-loss",
      });
      continue;
    }

    if (normalized.includes("balance")) {
      addUnique({
        label: "Balance Sheet",
        description: "Assets, liabilities, and equity export.",
        href: appendDateRange(
          `/api/admin/financials/balance-sheet/export?format=${format}`,
          startDate,
          endDate,
        ),
        format,
        included: true,
        source: "balance-sheet",
      });
      continue;
    }

    if (normalized.includes("cash flow") || normalized.includes("cashflow")) {
      addUnique({
        label: "Cash Flow",
        description: "Operating, investing, financing, and reconciliation cash flow export.",
        href: appendDateRange(
          `/api/admin/financials/cash-flow/export?format=${format}`,
          startDate,
          endDate,
        ),
        format,
        included: true,
        source: "cash-flow",
      });
      continue;
    }

    if (normalized.includes("pro forma") || normalized.includes("forecast")) {
      addUnique({
        label: "Pro Forma",
        description: "Forecast, runway, and scenario planning export.",
        href: appendDateRange(
          `/api/admin/financials/pro-forma/export?format=${format}`,
          startDate,
          endDate,
        ),
        format,
        included: true,
        source: "pro-forma",
      });
      continue;
    }

    if (normalized.includes("ledger")) {
      addUnique({
        label: "General Ledger",
        description: "General ledger export with growth and reward detail.",
        href: appendDateRange(
          `/api/admin/financials/general-ledger/export?format=${format}`,
          startDate,
          endDate,
        ),
        format,
        included: true,
        source: "general-ledger",
      });
      continue;
    }

    if (normalized.includes("stripe")) {
      addUnique({
        label: "Stripe Export",
        description: "Stripe payout and transaction CSV backup.",
        href: appendDateRange(
          "/api/admin/financials/stripe/export?format=csv",
          startDate,
          endDate,
        ),
        format: "csv",
        included: true,
        source: "stripe-reconciliation",
      });
      continue;
    }

    if (
      normalized.includes("bank") ||
      normalized.includes("navy federal") ||
      normalized.includes("reconciliation")
    ) {
      addUnique({
        label: "Reconciliation",
        description: "Bank, Stripe, payout, and reward reconciliation export.",
        href: appendDateRange(
          `/api/admin/financials/reconciliation/export?format=${format}`,
          startDate,
          endDate,
        ),
        format,
        included: true,
        source: "bank-reconciliation",
      });
      continue;
    }

    if (normalized.includes("tax") || normalized.includes("1099") || normalized.includes("deduction") || normalized.includes("estimated tax")) {
      addUnique({
        label: "Tax Center Export",
        description: "Tax support export for federal, quarterly, deduction, and 1099 backup.",
        href: appendDateRange(
          `/api/admin/financials/tax-reports/export?format=${format === "pdf" ? "pdf" : format}`,
          startDate,
          endDate,
        ),
        format,
        included: true,
        source: "tax-center",
      });
      continue;
    }

    if (
      normalized.includes("growth") ||
      normalized.includes("referral") ||
      normalized.includes("marketing") ||
      normalized.includes("campaign") ||
      normalized.includes("roi") ||
      normalized.includes("pawperks") ||
      normalized.includes("reward")
    ) {
      addUnique({
        label: "Growth & Referrals",
        description: "Open Growth & Referrals for campaign ROI and reward backup.",
        href: "/admin/referrals",
        format,
        included: true,
        source: "growth-referrals",
      });
      continue;
    }

    if (normalized.includes("guru") || normalized.includes("payout")) {
      addUnique({
        label: "Guru Payouts",
        description: "Payout analytics CSV export.",
        href: appendDateRange(
          "/api/admin/financials/payouts/export?format=csv",
          startDate,
          endDate,
        ),
        format: "csv",
        included: true,
        source: "guru-payouts",
      });
      continue;
    }

    if (normalized.includes("partner") || normalized.includes("commission") || normalized.includes("ambassador")) {
      addUnique({
        label: "Partner Commissions",
        description: "Commissions and referral rewards export.",
        href: appendDateRange(
          `/api/admin/commissions/export?format=${format === "word" || format === "excel" || format === "csv" ? format : "csv"}`,
          startDate,
          endDate,
        ),
        format,
        included: true,
        source: "partner-commissions",
      });
      continue;
    }
  }

  if (!links.some((link) => link.source === "profit-loss")) {
    addUnique({
      label: "Profit & Loss",
      description: "Statement of Operations export.",
      href: appendDateRange(
        `/api/admin/financials/profit-loss/export?format=${format}`,
        startDate,
        endDate,
      ),
      format,
      included: false,
      source: "profit-loss",
    });
  }

  if (!links.some((link) => link.source === "balance-sheet")) {
    addUnique({
      label: "Balance Sheet",
      description: "Assets, liabilities, and equity export.",
      href: appendDateRange(
        `/api/admin/financials/balance-sheet/export?format=${format}`,
        startDate,
        endDate,
      ),
      format,
      included: false,
      source: "balance-sheet",
    });
  }

  if (!links.some((link) => link.source === "cash-flow")) {
    addUnique({
      label: "Cash Flow",
      description: "Cash flow export.",
      href: appendDateRange(
        `/api/admin/financials/cash-flow/export?format=${format}`,
        startDate,
        endDate,
      ),
      format,
      included: false,
      source: "cash-flow",
    });
  }

  if (record?.file_url) {
    addUnique({
      label: "Attached Package File",
      description: "Open the package file already attached to this export record.",
      href: asTrimmedString(record.file_url),
      format,
      included: true,
      source: "attached-file",
    });
  }

  return links;
}

async function updateExportRecordWithPackage({
  exportId,
  packageLinks,
  format,
  startDate,
  endDate,
}: {
  exportId: string;
  packageLinks: PackageDownloadLink[];
  format: PackageFormat;
  startDate: string | null;
  endDate: string | null;
}) {
  if (!exportId) return;

  const existing = await getExportRecord(exportId);
  const existingMetadata = safeMetadata(existing?.metadata);

  const packageMetadata = {
    ...existingMetadata,
    packagePreparedAt: new Date().toISOString(),
    packageFormat: format,
    packageMode: "linked_exports",
    packageLinks,
    startDate,
    endDate,
    nextUpgrade:
      "Generate one ZIP/PDF bundle, upload it to storage, and attach file_url/storage_path.",
  };

  try {
    await supabaseAdmin
      .from("financial_export_history")
      .update({
        export_status: "processing",
        metadata: packageMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", exportId);
  } catch (error) {
    console.warn("Unable to update export record with package metadata:", error);
  }
}

export async function GET(request: Request) {
  const actor = await requireFinancialAdmin();

  if (!actor) {
    return NextResponse.json(
      { ok: false, message: "Not authorized to prepare export packages." },
      { status: 403 },
    );
  }

  const url = new URL(request.url);
  const exportId = asTrimmedString(url.searchParams.get("exportId"));
  const format = normalizeFormat(url.searchParams.get("format"));
  const record = await getExportRecord(exportId);
  const startDate =
    getDateParam("startDate", url.searchParams.get("startDate")) ||
    getDateParam("startDate", record?.period_start);
  const endDate =
    getDateParam("endDate", url.searchParams.get("endDate")) ||
    getDateParam("endDate", record?.period_end);

  const metadata = safeMetadata(record?.metadata);
  const included = Array.isArray(metadata.included) ? metadata.included : [];

  const packageLinks = buildDownloadLinks({
    record,
    included,
    format,
    startDate,
    endDate,
  });

  return NextResponse.json({
    ok: true,
    mode: "linked_exports",
    message:
      "CPA package links prepared. Linked statement downloads are ready. Multi-file ZIP storage is the next upgrade.",
    exportId: exportId || null,
    packageType:
      asTrimmedString(record?.package_type) ||
      asTrimmedString(url.searchParams.get("packageType")) ||
      "monthly_cpa",
    format,
    startDate,
    endDate,
    downloadLinks: packageLinks,
  });
}

export async function POST(request: Request) {
  const actor = await requireFinancialAdmin();

  if (!actor) {
    return NextResponse.json(
      { ok: false, message: "Not authorized to prepare export packages." },
      { status: 403 },
    );
  }

  let body: PackageRequestBody = {};

  try {
    body = (await request.json()) as PackageRequestBody;
  } catch {
    body = {};
  }

  const exportId = asTrimmedString(body.exportId);
  const format = normalizeFormat(body.format);
  const record = await getExportRecord(exportId);
  const startDate =
    getDateParam("startDate", body.startDate) ||
    getDateParam("startDate", record?.period_start);
  const endDate =
    getDateParam("endDate", body.endDate) ||
    getDateParam("endDate", record?.period_end);
  const metadata = safeMetadata(record?.metadata);
  const included = Array.isArray(metadata.included) ? metadata.included : [];

  const downloadLinks = buildDownloadLinks({
    record,
    included,
    format,
    startDate,
    endDate,
  });

  await updateExportRecordWithPackage({
    exportId,
    packageLinks: downloadLinks,
    format,
    startDate,
    endDate,
  });

  await writeAuditLog({
    actor,
    action: "prepare_financial_export_package",
    targetId: exportId || null,
    metadata: {
      packageType:
        asTrimmedString(body.packageType) ||
        asTrimmedString(record?.package_type) ||
        "monthly_cpa",
      format,
      startDate,
      endDate,
      linkCount: downloadLinks.length,
      mode: "linked_exports",
      emailTo: asTrimmedString(body.emailTo) || null,
    },
  });

  return NextResponse.json({
    ok: true,
    mode: "linked_exports",
    message:
      "CPA package prepared with linked statement exports. Multi-file ZIP storage is the next upgrade.",
    exportId: exportId || null,
    packageType:
      asTrimmedString(body.packageType) ||
      asTrimmedString(record?.package_type) ||
      "monthly_cpa",
    format,
    startDate,
    endDate,
    downloadLinks,
    detailHref: exportId ? `/admin/financials/exports/${exportId}` : null,
  });
}
