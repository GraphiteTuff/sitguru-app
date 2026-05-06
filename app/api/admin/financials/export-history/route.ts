import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type ExportStatus = "ready" | "processing" | "sent" | "needs_review" | "failed";

type AdminIdentity = {
  id: string;
  email: string;
  role: string;
  canAccessFinancials: boolean;
};

type ExportHistoryItem = {
  id: string;
  title: string;
  period: string;
  format: string;
  status: "Ready" | "Processing" | "Sent" | "Needs Review" | "Failed";
  createdBy: string;
  createdAt: string;
  href: string;
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

const VALID_STATUSES: ExportStatus[] = [
  "ready",
  "processing",
  "sent",
  "needs_review",
  "failed",
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

function normalizeStatus(value: unknown): ExportStatus {
  const normalized = asTrimmedString(value).toLowerCase();

  if (VALID_STATUSES.includes(normalized as ExportStatus)) {
    return normalized as ExportStatus;
  }

  if (normalized.includes("review")) return "needs_review";
  if (normalized.includes("process") || normalized.includes("pending")) {
    return "processing";
  }
  if (normalized.includes("sent") || normalized.includes("email")) return "sent";
  if (normalized.includes("fail") || normalized.includes("error")) return "failed";

  return "ready";
}

function displayStatus(value: unknown): ExportHistoryItem["status"] {
  const status = normalizeStatus(value);

  const labels: Record<ExportStatus, ExportHistoryItem["status"]> = {
    ready: "Ready",
    processing: "Processing",
    sent: "Sent",
    needs_review: "Needs Review",
    failed: "Failed",
  };

  return labels[status];
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
      console.warn(`Export history query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Export history query skipped for ${label}:`, error);
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
      "admin_users_finance_access",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("profiles")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "profiles_finance_access",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("users")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "users_finance_access",
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
  const identity = await getAdminIdentity();

  if (!identity?.canAccessFinancials) {
    return null;
  }

  return identity;
}

function getCreatedAt(row: AnyRow) {
  const raw =
    asTrimmedString(row.created_at) ||
    asTrimmedString(row.generated_at) ||
    asTrimmedString(row.updated_at);

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getHistoryHref(row: AnyRow) {
  const id = asTrimmedString(row.id);

  if (id) return `/admin/financials/exports/${id}`;

  const metadata = safeMetadata(row.metadata);
  const area = asTrimmedString(row.area) || asTrimmedString(metadata.area);
  const action = asTrimmedString(row.action);

  if (area.includes("profit_loss") || action.includes("profit_loss")) {
    return "/admin/financials/profit-loss";
  }

  if (area.includes("balance_sheet") || action.includes("balance_sheet")) {
    return "/admin/financials/balance-sheet";
  }

  if (area.includes("cash_flow") || action.includes("cash_flow")) {
    return "/admin/financials/cash-flow";
  }

  if (area.includes("pro_forma") || action.includes("pro_forma")) {
    return "/admin/financials/pro-forma";
  }

  return "/admin/financials/exports";
}

function normalizeFormat(row: AnyRow) {
  const metadata = safeMetadata(row.metadata);

  return (
    asTrimmedString(row.export_format) ||
    asTrimmedString(row.format) ||
    asTrimmedString(row.file_format) ||
    asTrimmedString(metadata.format) ||
    "export"
  ).toUpperCase();
}

function rowToHistoryItem(row: AnyRow, index: number): ExportHistoryItem {
  const metadata = safeMetadata(row.metadata);
  const action = asTrimmedString(row.action);
  const area = asTrimmedString(row.area);

  const title =
    asTrimmedString(row.title) ||
    asTrimmedString(row.report_name) ||
    asTrimmedString(metadata.reportName) ||
    asTrimmedString(metadata.filename) ||
    (area.includes("profit_loss") || action.includes("profit_loss")
      ? "Profit & Loss Export"
      : area.includes("balance_sheet") || action.includes("balance_sheet")
        ? "Balance Sheet Export"
        : area.includes("cash_flow") || action.includes("cash_flow")
          ? "Cash Flow Export"
          : area.includes("pro_forma") || action.includes("pro_forma")
            ? "Pro Forma Export"
            : action.includes("email")
              ? "Financial Statement Email"
              : "Financial Export");

  const period =
    asTrimmedString(row.period_label) ||
    asTrimmedString(row.period) ||
    [
      asTrimmedString(row.period_start) || asTrimmedString(metadata.startDate),
      asTrimmedString(row.period_end) || asTrimmedString(metadata.endDate),
    ]
      .filter(Boolean)
      .join(" to ") ||
    "Current period";

  return {
    id: asTrimmedString(row.id) || `export-history-${index}`,
    title,
    period,
    format: normalizeFormat(row),
    status: displayStatus(row.export_status || row.status || row.action),
    createdBy:
      asTrimmedString(row.created_by) ||
      asTrimmedString(row.created_by_email) ||
      asTrimmedString(row.actor_email) ||
      "SitGuru Admin",
    createdAt: getCreatedAt(row),
    href: asTrimmedString(row.href) || getHistoryHref(row),
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
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  const payload = {
    actor_id: actor.id,
    actor_email: actor.email,
    actor_role: actor.role,
    action,
    area: "financials.export_history",
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
    // Keep export-history updates from failing if audit table is not ready.
  }

  try {
    await supabaseAdmin.from("admin_audit_logs").insert(payload);
  } catch (error) {
    console.warn("Export history audit log skipped:", error);
  }
}

export async function GET() {
  const actor = await requireFinancialAdmin();

  if (!actor) {
    return NextResponse.json(
      { ok: false, message: "Not authorized to view export history." },
      { status: 403 },
    );
  }

  const [exportRows, auditRows] = await Promise.all([
    safeRows<AnyRow>(
      supabaseAdmin
        .from("financial_export_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(25),
      "financial_export_history",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("financial_audit_logs")
        .select("*")
        .or("action.ilike.%export%,action.ilike.%email%")
        .order("created_at", { ascending: false })
        .limit(25),
      "financial_audit_logs",
    ),
  ]);

  const rows = [...exportRows, ...auditRows]
    .sort((a, b) => {
      const aTime = new Date(asTrimmedString(a.created_at)).getTime() || 0;
      const bTime = new Date(asTrimmedString(b.created_at)).getTime() || 0;
      return bTime - aTime;
    })
    .slice(0, 25);

  return NextResponse.json({
    ok: true,
    isLive: rows.length > 0,
    history: rows.map(rowToHistoryItem),
    message:
      rows.length > 0
        ? "Live export history connected."
        : "No export history rows found yet. Generate an export to populate this feed.",
  });
}

export async function POST(request: Request) {
  const actor = await requireFinancialAdmin();

  if (!actor) {
    return NextResponse.json(
      { ok: false, message: "Not authorized to create export records." },
      { status: 403 },
    );
  }

  let body: AnyRow = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const title = asTrimmedString(body.title);
  const packageType = asTrimmedString(body.packageType || body.package_type);
  const reportType = asTrimmedString(body.reportType || body.report_type);
  const periodLabel =
    asTrimmedString(body.periodLabel || body.period_label) || "Current period";
  const exportFormat = asTrimmedString(
    body.exportFormat || body.export_format || body.format,
  ).toLowerCase();
  const exportStatus = normalizeStatus(
    body.exportStatus || body.export_status || "ready",
  );
  const metadata = safeMetadata(body.metadata);

  if (!title) {
    return NextResponse.json(
      { ok: false, message: "Export title is required." },
      { status: 400 },
    );
  }

  const payload = {
    title,
    package_type: packageType || "financial",
    report_type: reportType || "general",
    period_label: periodLabel,
    period_start: asTrimmedString(body.periodStart || body.period_start) || null,
    period_end: asTrimmedString(body.periodEnd || body.period_end) || null,
    export_format: exportFormat || "pdf",
    export_status: exportStatus,
    created_by: actor.email,
    created_by_user_id: actor.id,
    sent_to_email: asTrimmedString(body.sentToEmail || body.sent_to_email) || null,
    sent_to_phone: asTrimmedString(body.sentToPhone || body.sent_to_phone) || null,
    file_url: asTrimmedString(body.fileUrl || body.file_url) || null,
    storage_path: asTrimmedString(body.storagePath || body.storage_path) || null,
    notes: asTrimmedString(body.notes) || null,
    metadata,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("financial_export_history")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    console.error("Create export history error:", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          "Unable to create export record. Confirm financial_export_history exists.",
      },
      { status: 500 },
    );
  }

  const createdRow = data as AnyRow;

  await writeAuditLog({
    actor,
    action: "create_financial_export_record",
    targetId: asTrimmedString(createdRow.id),
    metadata: {
      title,
      packageType: payload.package_type,
      reportType: payload.report_type,
      exportFormat: payload.export_format,
      exportStatus: payload.export_status,
    },
  });

  return NextResponse.json({
    ok: true,
    export: createdRow,
    historyItem: rowToHistoryItem(createdRow, 0),
  });
}

export async function PATCH(request: Request) {
  const actor = await requireFinancialAdmin();

  if (!actor) {
    return NextResponse.json(
      { ok: false, message: "Not authorized to update export records." },
      { status: 403 },
    );
  }

  let body: AnyRow = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const exportId = asTrimmedString(body.exportId || body.id);

  if (!exportId) {
    return NextResponse.json(
      { ok: false, message: "exportId is required." },
      { status: 400 },
    );
  }

  const nextStatus = normalizeStatus(body.status || body.exportStatus);
  const notes = asTrimmedString(body.notes);

  const updatePayload: AnyRow = {
    export_status: nextStatus,
    updated_at: new Date().toISOString(),
  };

  if (notes) {
    updatePayload.notes = notes;
  }

  const { data, error } = await supabaseAdmin
    .from("financial_export_history")
    .update(updatePayload)
    .eq("id", exportId)
    .select("*")
    .single();

  if (error) {
    console.error("Update export history status error:", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          "Unable to update export status. Confirm the export record exists.",
      },
      { status: 500 },
    );
  }

  const updatedRow = data as AnyRow;

  await writeAuditLog({
    actor,
    action: "update_financial_export_status",
    targetId: exportId,
    metadata: {
      status: nextStatus,
      notes: notes || null,
      title: asTrimmedString(updatedRow.title),
    },
  });

  return NextResponse.json({
    ok: true,
    export: updatedRow,
    historyItem: rowToHistoryItem(updatedRow, 0),
  });
}
