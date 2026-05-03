import { createClient } from "@/lib/supabase/server";

export type FinancialExportStatus =
  | "ready"
  | "processing"
  | "sent"
  | "needs_review"
  | "failed";

export type FinancialExportFormat = "pdf" | "xlsx" | "csv" | "zip" | "word";

export type FinancialExportHistoryRecord = {
  id: string;
  title: string;
  package_type: string;
  report_type: string;
  period_label: string;
  period_start: string | null;
  period_end: string | null;
  export_format: FinancialExportFormat;
  export_status: FinancialExportStatus;
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

export type CreateFinancialExportHistoryInput = {
  title: string;
  packageType?: string;
  reportType?: string;
  periodLabel?: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  exportFormat?: FinancialExportFormat;
  exportStatus?: FinancialExportStatus;
  createdBy?: string;
  createdByUserId?: string | null;
  sentToEmail?: string | null;
  sentToPhone?: string | null;
  fileUrl?: string | null;
  storagePath?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
};

export type ExportHistoryViewModel = {
  id: string;
  title: string;
  period: string;
  format: string;
  status: "Ready" | "Processing" | "Sent" | "Needs Review" | "Failed";
  createdBy: string;
  createdAt: string;
  href: string;
  raw: FinancialExportHistoryRecord;
};

const fallbackExportHistory: ExportHistoryViewModel[] = [
  {
    id: "preview-june-2026-monthly-cpa",
    title: "June 2026 Monthly CPA Package",
    period: "Jun 1–Jun 30, 2026",
    format: "PDF / Excel / CSV / ZIP",
    status: "Needs Review",
    createdBy: "Admin User",
    createdAt: "Pending first close",
    href: "/admin/financials/cpa-handoff?period=2026-06",
    raw: {
      id: "preview-june-2026-monthly-cpa",
      title: "June 2026 Monthly CPA Package",
      package_type: "monthly-cpa",
      report_type: "cpa",
      period_label: "Jun 1–Jun 30, 2026",
      period_start: "2026-06-01",
      period_end: "2026-06-30",
      export_format: "zip",
      export_status: "needs_review",
      created_by: "Admin User",
      created_by_user_id: null,
      sent_to_email: null,
      sent_to_phone: null,
      file_url: null,
      storage_path: null,
      notes: null,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: "preview-q2-2026-partial-quarter",
    title: "Q2 2026 Partial Quarter Package",
    period: "Jun 1–Jun 30, 2026",
    format: "PDF / Excel / CSV / ZIP",
    status: "Processing",
    createdBy: "Admin User",
    createdAt: "Pending launch",
    href: "/admin/financials/cpa-handoff?period=2026-q2",
    raw: {
      id: "preview-q2-2026-partial-quarter",
      title: "Q2 2026 Partial Quarter Package",
      package_type: "quarterly-cpa",
      report_type: "cpa",
      period_label: "Jun 1–Jun 30, 2026",
      period_start: "2026-06-01",
      period_end: "2026-06-30",
      export_format: "zip",
      export_status: "processing",
      created_by: "Admin User",
      created_by_user_id: null,
      sent_to_email: null,
      sent_to_phone: null,
      file_url: null,
      storage_path: null,
      notes: null,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: "preview-2026-annual-tax",
    title: "2026 Annual Tax Package",
    period: "Jun 1–Dec 31, 2026",
    format: "PDF / Excel / CSV / ZIP",
    status: "Processing",
    createdBy: "Admin User",
    createdAt: "Pending year-end",
    href: "/admin/financials/tax-reports?period=2026",
    raw: {
      id: "preview-2026-annual-tax",
      title: "2026 Annual Tax Package",
      package_type: "annual-tax",
      report_type: "tax",
      period_label: "Jun 1–Dec 31, 2026",
      period_start: "2026-06-01",
      period_end: "2026-12-31",
      export_format: "zip",
      export_status: "processing",
      created_by: "Admin User",
      created_by_user_id: null,
      sent_to_email: null,
      sent_to_phone: null,
      file_url: null,
      storage_path: null,
      notes: null,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
];

function normalizeStatus(status: string | null | undefined) {
  const value = String(status || "needs_review").toLowerCase();

  if (value === "ready") return "Ready";
  if (value === "processing") return "Processing";
  if (value === "sent") return "Sent";
  if (value === "failed") return "Failed";

  return "Needs Review";
}

function normalizeFormat(format: string | null | undefined) {
  const value = String(format || "pdf").toLowerCase();

  if (value === "xlsx") return "Excel";
  if (value === "csv") return "CSV";
  if (value === "zip") return "ZIP";
  if (value === "word") return "Word";

  return "PDF";
}

function formatCreatedAt(value: string | null | undefined) {
  if (!value) return "Unknown";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unknown";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function buildExportHref(record: FinancialExportHistoryRecord) {
  const packageType = encodeURIComponent(record.package_type || "custom");
  const exportId = encodeURIComponent(record.id);

  if (record.report_type === "tax") {
    return `/admin/financials/tax-reports?export=${exportId}`;
  }

  if (record.report_type === "cpa") {
    return `/admin/financials/cpa-handoff?export=${exportId}`;
  }

  return `/admin/financials/exports?package=${packageType}&export=${exportId}`;
}

export function mapExportHistoryRecord(
  record: FinancialExportHistoryRecord,
): ExportHistoryViewModel {
  return {
    id: record.id,
    title: record.title,
    period: record.period_label,
    format: normalizeFormat(record.export_format),
    status: normalizeStatus(record.export_status),
    createdBy: record.created_by || "Admin User",
    createdAt: formatCreatedAt(record.created_at),
    href: buildExportHref(record),
    raw: record,
  };
}

export async function getFinancialExportHistory(): Promise<{
  history: ExportHistoryViewModel[];
  isLive: boolean;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("financial_export_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(25);

    if (error || !data || data.length === 0) {
      return {
        history: fallbackExportHistory,
        isLive: false,
      };
    }

    return {
      history: (data as FinancialExportHistoryRecord[]).map(
        mapExportHistoryRecord,
      ),
      isLive: true,
    };
  } catch {
    return {
      history: fallbackExportHistory,
      isLive: false,
    };
  }
}

export async function createFinancialExportHistory(
  input: CreateFinancialExportHistoryInput,
): Promise<{
  record: ExportHistoryViewModel | null;
  ok: boolean;
  message: string;
}> {
  try {
    const supabase = await createClient();

    const insertPayload = {
      title: input.title,
      package_type: input.packageType || "custom",
      report_type: input.reportType || "financial",
      period_label: input.periodLabel || "Custom Period",
      period_start: input.periodStart || null,
      period_end: input.periodEnd || null,
      export_format: input.exportFormat || "pdf",
      export_status: input.exportStatus || "needs_review",
      created_by: input.createdBy || "Admin User",
      created_by_user_id: input.createdByUserId || null,
      sent_to_email: input.sentToEmail || null,
      sent_to_phone: input.sentToPhone || null,
      file_url: input.fileUrl || null,
      storage_path: input.storagePath || null,
      notes: input.notes || null,
      metadata: input.metadata || {},
    };

    const { data, error } = await supabase
      .from("financial_export_history")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error || !data) {
      return {
        record: null,
        ok: false,
        message:
          error?.message ||
          "Unable to create financial export history record.",
      };
    }

    return {
      record: mapExportHistoryRecord(data as FinancialExportHistoryRecord),
      ok: true,
      message: "Financial export history record created.",
    };
  } catch (error) {
    return {
      record: null,
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to create financial export history record.",
    };
  }
}