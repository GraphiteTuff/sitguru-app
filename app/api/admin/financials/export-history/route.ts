import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ExportStatus = "ready" | "processing" | "sent" | "needs_review" | "failed";
type ExportFormat = "pdf" | "xlsx" | "csv" | "zip" | "word";

type FinancialExportHistoryRecord = {
  id: string;
  title: string;
  package_type: string;
  report_type: string;
  period_label: string;
  period_start: string | null;
  period_end: string | null;
  export_format: ExportFormat;
  export_status: ExportStatus;
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

const allowedFormats: ExportFormat[] = ["pdf", "xlsx", "csv", "zip", "word"];

const allowedStatuses: ExportStatus[] = [
  "ready",
  "processing",
  "sent",
  "needs_review",
  "failed",
];

const fallbackHistory = [
  {
    id: "preview-june-2026-monthly-cpa",
    title: "June 2026 Monthly CPA Package",
    period: "Jun 1–Jun 30, 2026",
    format: "PDF / Excel / CSV / ZIP",
    status: "Needs Review",
    createdBy: "Admin User",
    createdAt: "Pending first close",
    href: "/admin/financials/exports",
  },
  {
    id: "preview-q2-2026-partial-quarter",
    title: "Q2 2026 Partial Quarter Package",
    period: "Jun 1–Jun 30, 2026",
    format: "PDF / Excel / CSV / ZIP",
    status: "Processing",
    createdBy: "Admin User",
    createdAt: "Pending launch",
    href: "/admin/financials/exports",
  },
  {
    id: "preview-2026-annual-tax",
    title: "2026 Annual Tax Package",
    period: "Jun 1–Dec 31, 2026",
    format: "PDF / Excel / CSV / ZIP",
    status: "Processing",
    createdBy: "Admin User",
    createdAt: "Pending year-end",
    href: "/admin/financials/exports",
  },
];

function getString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function getNullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function getExportFormat(value: unknown): ExportFormat {
  const normalized = getString(value, "pdf").toLowerCase();

  if (allowedFormats.includes(normalized as ExportFormat)) {
    return normalized as ExportFormat;
  }

  return "pdf";
}

function getExportStatus(value: unknown): ExportStatus {
  const normalized = getString(value, "needs_review").toLowerCase();

  if (allowedStatuses.includes(normalized as ExportStatus)) {
    return normalized as ExportStatus;
  }

  return "needs_review";
}

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

function titleAlreadyIncludesPeriod(title: string, periodLabel: string) {
  if (!periodLabel) return true;

  const lowerTitle = title.toLowerCase();
  const lowerPeriod = periodLabel.toLowerCase();

  return lowerTitle.includes(lowerPeriod);
}

function shouldShowPeriodInTitle(record: FinancialExportHistoryRecord) {
  const genericPeriods = [
    "Export Format Request",
    "Statement / Operations Export",
    "Invoice Document",
    "Purchase Order Document",
    "Audit Backup Package",
    "Custom / YTD Period",
    "Daily / Weekly Management Review",
  ];

  if (!record.period_label) return false;
  if (genericPeriods.includes(record.period_label)) return false;
  if (titleAlreadyIncludesPeriod(record.title, record.period_label)) {
    return false;
  }

  return true;
}

function getDisplayTitle(record: FinancialExportHistoryRecord) {
  if (shouldShowPeriodInTitle(record)) {
    return `${record.title} — ${record.period_label}`;
  }

  return record.title;
}

function buildExportHref(record: FinancialExportHistoryRecord) {
  return `/admin/financials/exports/${encodeURIComponent(record.id)}`;
}

function mapRecord(record: FinancialExportHistoryRecord) {
  return {
    id: record.id,
    title: getDisplayTitle(record),
    period: record.period_label,
    format: normalizeFormat(record.export_format),
    status: normalizeStatus(record.export_status),
    createdBy: record.created_by || "Admin User",
    createdAt: formatCreatedAt(record.created_at),
    href: buildExportHref(record),
    raw: record,
  };
}

function getDuplicateWindowIso() {
  const duplicateWindowMs = 30_000;
  return new Date(Date.now() - duplicateWindowMs).toISOString();
}

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("financial_export_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(25);

    if (error || !data || data.length === 0) {
      return NextResponse.json({
        ok: true,
        isLive: false,
        history: fallbackHistory,
        message:
          error?.message ||
          "No export history records found yet. Showing preview history.",
      });
    }

    return NextResponse.json({
      ok: true,
      isLive: true,
      history: (data as FinancialExportHistoryRecord[]).map(mapRecord),
    });
  } catch (error) {
    return NextResponse.json({
      ok: true,
      isLive: false,
      history: fallbackHistory,
      message:
        error instanceof Error
          ? error.message
          : "Unable to load export history. Showing preview history.",
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    const title = getString(body.title);

    if (!title) {
      return NextResponse.json(
        {
          ok: false,
          record: null,
          message: "A title is required to create an export history record.",
        },
        { status: 400 },
      );
    }

    const packageType = getString(body.packageType, "custom");
    const reportType = getString(body.reportType, "financial");
    const periodLabel = getString(body.periodLabel, "Custom Period");
    const exportFormat = getExportFormat(body.exportFormat);
    const exportStatus = getExportStatus(body.exportStatus);
    const metadata = getMetadata(body.metadata);

    const payload = {
      title,
      package_type: packageType,
      report_type: reportType,
      period_label: periodLabel,
      period_start: getNullableString(body.periodStart),
      period_end: getNullableString(body.periodEnd),
      export_format: exportFormat,
      export_status: exportStatus,
      created_by: getString(body.createdBy, "Admin User"),
      created_by_user_id: getNullableString(body.createdByUserId),
      sent_to_email: getNullableString(body.sentToEmail),
      sent_to_phone: getNullableString(body.sentToPhone),
      file_url: getNullableString(body.fileUrl),
      storage_path: getNullableString(body.storagePath),
      notes: getNullableString(body.notes),
      metadata: {
        ...metadata,
        duplicateProtectionWindowSeconds: 30,
        generatedAt: new Date().toISOString(),
      },
    };

    const supabase = await createClient();

    const { data: duplicateData, error: duplicateError } = await supabase
      .from("financial_export_history")
      .select("*")
      .eq("title", payload.title)
      .eq("package_type", payload.package_type)
      .eq("report_type", payload.report_type)
      .eq("period_label", payload.period_label)
      .eq("export_format", payload.export_format)
      .gte("created_at", getDuplicateWindowIso())
      .order("created_at", { ascending: false })
      .limit(1);

    if (!duplicateError && duplicateData && duplicateData.length > 0) {
      const existingRecord = duplicateData[0] as FinancialExportHistoryRecord;

      return NextResponse.json(
        {
          ok: true,
          record: mapRecord(existingRecord),
          duplicatePrevented: true,
          message:
            "Duplicate click prevented. The existing recent export record was reused.",
        },
        { status: 200 },
      );
    }

    const { data, error } = await supabase
      .from("financial_export_history")
      .insert(payload)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          ok: false,
          record: null,
          message:
            error?.message ||
            "Unable to create financial export history record.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        record: mapRecord(data as FinancialExportHistoryRecord),
        duplicatePrevented: false,
        message: "Financial export history record created.",
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        record: null,
        message:
          error instanceof Error
            ? error.message
            : "Unable to create financial export history record.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    const exportId = getString(body.exportId);
    const exportStatus = getExportStatus(body.exportStatus);
    const statusNote = getNullableString(body.statusNote);

    if (!exportId) {
      return NextResponse.json(
        {
          ok: false,
          record: null,
          message: "An exportId is required to update export status.",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data: existingData, error: existingError } = await supabase
      .from("financial_export_history")
      .select("*")
      .eq("id", exportId)
      .maybeSingle();

    if (existingError || !existingData) {
      return NextResponse.json(
        {
          ok: false,
          record: null,
          message:
            existingError?.message ||
            "Unable to find the export history record to update.",
        },
        { status: 404 },
      );
    }

    const existingRecord = existingData as FinancialExportHistoryRecord;
    const existingMetadata = existingRecord.metadata || {};
    const existingStatusHistory = Array.isArray(
      existingMetadata.statusHistory,
    )
      ? existingMetadata.statusHistory
      : [];

    const updatedMetadata = {
      ...existingMetadata,
      lastStatusUpdate: {
        from: existingRecord.export_status,
        to: exportStatus,
        note: statusNote,
        updatedAt: new Date().toISOString(),
        updatedBy: "Admin User",
      },
      statusHistory: [
        ...existingStatusHistory,
        {
          from: existingRecord.export_status,
          to: exportStatus,
          note: statusNote,
          updatedAt: new Date().toISOString(),
          updatedBy: "Admin User",
        },
      ],
    };

    const { data, error } = await supabase
      .from("financial_export_history")
      .update({
        export_status: exportStatus,
        notes: statusNote || existingRecord.notes,
        metadata: updatedMetadata,
      })
      .eq("id", exportId)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          ok: false,
          record: null,
          message:
            error?.message || "Unable to update financial export status.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      record: mapRecord(data as FinancialExportHistoryRecord),
      message: "Financial export status updated.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        record: null,
        message:
          error instanceof Error
            ? error.message
            : "Unable to update financial export status.",
      },
      { status: 500 },
    );
  }
}