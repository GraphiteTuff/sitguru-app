import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

const FINANCE_ROLES = [
  "owner",
  "super_admin",
  "admin",
  "finance_admin",
  "finance",
  "accounting",
  "bookkeeper",
];

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
      console.warn(`Export package query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Export package query skipped for ${label}:`, error);
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
      "admin_users_package_access",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("profiles")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "profiles_package_access",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("users")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "users_package_access",
    ),
  ]);

  const profile = profileChecks.flat().find(Boolean) || {};
  const role = asTrimmedString(profile.role) || "admin";
  const active =
    profile.is_active === undefined
      ? true
      : getOptionalBoolean(profile.is_active);
  const explicitFinanceAccess = getOptionalBoolean(
    profile.can_access_financials,
  );
  const envAllowed = envAdminEmails.includes(userEmail);

  return {
    id: user.id,
    email: userEmail,
    role,
    canAccessFinancials:
      active && (hasFinancialRole(role) || explicitFinanceAccess || envAllowed),
  };
}

async function requireFinancialAdmin() {
  const actor = await getAdminIdentity();

  if (!actor?.canAccessFinancials) return null;

  return actor;
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

function buildDownloadLinks({
  record,
  included,
  format,
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

    if (normalized.includes("weekly") || normalized.includes("summary")) {
      addUnique({
        label: "Weekly Admin Report",
        description: "Open the weekly management report preview.",
        href: "/api/admin/reports/generate?reportType=weekly&format=html",
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
        href: "/admin/reports",
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
        href: `/api/admin/financials/pro-forma/export?format=${format}`,
        format,
        included: true,
        source: "pro-forma",
      });
      continue;
    }

    if (normalized.includes("ledger")) {
      addUnique({
        label: "General Ledger",
        description: "Open ledger and financial report support.",
        href: "/admin/financials/general-ledger",
        format,
        included: true,
        source: "general-ledger",
      });
      continue;
    }

    if (normalized.includes("stripe")) {
      addUnique({
        label: "Stripe Reconciliation",
        description: "Open Stripe payout, fee, refund, and dispute reconciliation support.",
        href: "/admin/financials/cash-flow",
        format,
        included: true,
        source: "stripe-reconciliation",
      });
      continue;
    }

    if (normalized.includes("bank") || normalized.includes("navy federal")) {
      addUnique({
        label: "Bank Reconciliation",
        description: "Open Navy Federal checking/savings cash reconciliation support.",
        href: "/admin/financials/cash-flow",
        format,
        included: true,
        source: "bank-reconciliation",
      });
      continue;
    }

    if (normalized.includes("guru") || normalized.includes("payout")) {
      addUnique({
        label: "Guru Payouts",
        description: "Open Guru payout support records.",
        href: "/admin/payouts",
        format,
        included: true,
        source: "guru-payouts",
      });
      continue;
    }

    if (normalized.includes("partner") || normalized.includes("commission")) {
      addUnique({
        label: "Partner Commissions",
        description: "Open partner commission support records.",
        href: "/admin/commissions",
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

  const packageMetadata = {
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
  const startDate = getDateParam("startDate", url.searchParams.get("startDate"));
  const endDate = getDateParam("endDate", url.searchParams.get("endDate"));

  const record = await getExportRecord(exportId);
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
      "CPA package links prepared. ZIP storage generation is the next upgrade.",
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
  const startDate = getDateParam("startDate", body.startDate);
  const endDate = getDateParam("endDate", body.endDate);
  const record = await getExportRecord(exportId);
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
      "CPA package prepared with linked statement exports. ZIP storage generation is the next upgrade.",
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
