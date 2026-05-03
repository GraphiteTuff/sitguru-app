import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CpaHandoffStatus =
  | "not_started"
  | "in_progress"
  | "needs_review"
  | "ready"
  | "sent"
  | "completed"
  | "overdue";

type CpaHandoffPriority = "low" | "medium" | "high" | "critical";

type CpaHandoffFrequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "annual"
  | "tax"
  | "custom";

type CpaReminderRecord = {
  id: string;
  title?: string | null;
  description?: string | null;
  period_label?: string | null;
  period_start?: string | null;
  period_end?: string | null;
  due_date?: string | null;
  frequency?: string | null;
  status?: string | null;
  priority?: string | null;
  assigned_to?: string | null;
  sent_to_email?: string | null;
  sent_to_phone?: string | null;
  reminder_channel?: string | null;
  reminder_enabled?: boolean | null;
  completed_at?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type FinancialExportHistoryRecord = {
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
  sent_to_email: string | null;
  sent_to_phone: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type CpaHandoffItem = {
  id: string;
  title: string;
  description: string;
  periodLabel: string;
  periodStart: string | null;
  periodEnd: string | null;
  dueDate: string | null;
  dueDateLabel: string;
  frequency: CpaHandoffFrequency;
  status: CpaHandoffStatus;
  statusLabel: string;
  priority: CpaHandoffPriority;
  assignedTo: string;
  sentToEmail: string | null;
  sentToPhone: string | null;
  reminderChannel: string;
  reminderEnabled: boolean;
  completedAt: string | null;
  notes: string | null;
  source: "cpa_reminders" | "financial_export_history" | "fallback";
  href: string;
};

type CpaHandoffAlert = {
  id: string;
  title: string;
  description: string;
  severity: "success" | "info" | "warning" | "critical";
  href: string;
};

type CpaHandoffSummary = {
  total: number;
  notStarted: number;
  inProgress: number;
  needsReview: number;
  ready: number;
  sent: number;
  completed: number;
  overdue: number;
  upcomingDue: number;
};

type CpaHandoffResponse = {
  ok: boolean;
  isLive: boolean;
  generatedAt: string;
  sourceHealth: {
    table: string;
    ok: boolean;
    rowCount: number;
    message: string;
  }[];
  summary: CpaHandoffSummary;
  alerts: CpaHandoffAlert[];
  items: CpaHandoffItem[];
  exports: CpaHandoffItem[];
  fallbackUsed: boolean;
  message: string;
};

const allowedStatuses: CpaHandoffStatus[] = [
  "not_started",
  "in_progress",
  "needs_review",
  "ready",
  "sent",
  "completed",
  "overdue",
];

const allowedPriorities: CpaHandoffPriority[] = [
  "low",
  "medium",
  "high",
  "critical",
];

const allowedFrequencies: CpaHandoffFrequency[] = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "annual",
  "tax",
  "custom",
];

function getString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function getNullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getBoolean(value: unknown, fallback = true) {
  if (typeof value === "boolean") return value;
  return fallback;
}

function getObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function normalizeFrequency(value: unknown): CpaHandoffFrequency {
  const normalized = getString(value, "custom")
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (allowedFrequencies.includes(normalized as CpaHandoffFrequency)) {
    return normalized as CpaHandoffFrequency;
  }

  return "custom";
}

function normalizeStatus(value: unknown): CpaHandoffStatus {
  const normalized = getString(value, "not_started")
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (allowedStatuses.includes(normalized as CpaHandoffStatus)) {
    return normalized as CpaHandoffStatus;
  }

  if (normalized === "processing") return "in_progress";
  if (normalized === "failed") return "needs_review";

  return "not_started";
}

function normalizePriority(value: unknown): CpaHandoffPriority {
  const normalized = getString(value, "medium")
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (allowedPriorities.includes(normalized as CpaHandoffPriority)) {
    return normalized as CpaHandoffPriority;
  }

  return "medium";
}

function labelize(value: string | null | undefined) {
  if (!value) return "Not Set";

  return value
    .split(/[-_\s]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not scheduled";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    const fallbackDate = new Date(`${value}T00:00:00`);
    if (Number.isNaN(fallbackDate.getTime())) return "Not scheduled";

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(fallbackDate);
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function isPastDue(value: string | null | undefined) {
  if (!value) return false;

  const dueDate = new Date(`${value.slice(0, 10)}T23:59:59`);
  const now = new Date();

  if (Number.isNaN(dueDate.getTime())) return false;

  return dueDate.getTime() < now.getTime();
}

function isDueSoon(value: string | null | undefined) {
  if (!value) return false;

  const dueDate = new Date(`${value.slice(0, 10)}T23:59:59`);
  const now = new Date();
  const sevenDaysFromNow = new Date();

  sevenDaysFromNow.setDate(now.getDate() + 7);

  if (Number.isNaN(dueDate.getTime())) return false;

  return dueDate.getTime() >= now.getTime() && dueDate.getTime() <= sevenDaysFromNow.getTime();
}

function getFallbackDates() {
  const now = new Date();
  const monthlyDue = new Date(now);
  const quarterlyDue = new Date(now);
  const annualDue = new Date(now);
  const taxDue = new Date(now);

  monthlyDue.setDate(10);
  if (monthlyDue.getTime() < now.getTime()) {
    monthlyDue.setMonth(monthlyDue.getMonth() + 1);
  }

  quarterlyDue.setMonth(quarterlyDue.getMonth() + 1);
  quarterlyDue.setDate(15);

  annualDue.setMonth(0);
  annualDue.setDate(31);
  if (annualDue.getTime() < now.getTime()) {
    annualDue.setFullYear(annualDue.getFullYear() + 1);
  }

  taxDue.setMonth(3);
  taxDue.setDate(15);
  if (taxDue.getTime() < now.getTime()) {
    taxDue.setFullYear(taxDue.getFullYear() + 1);
  }

  return {
    monthlyDue: monthlyDue.toISOString().slice(0, 10),
    quarterlyDue: quarterlyDue.toISOString().slice(0, 10),
    annualDue: annualDue.toISOString().slice(0, 10),
    taxDue: taxDue.toISOString().slice(0, 10),
  };
}

function buildFallbackItems(): CpaHandoffItem[] {
  const dates = getFallbackDates();

  return [
    {
      id: "fallback-monthly-close",
      title: "Monthly CPA Close Package",
      description:
        "Complete monthly financial statements, export package, Stripe review, payouts review, partner commissions, and owner review.",
      periodLabel: "Monthly Close",
      periodStart: null,
      periodEnd: null,
      dueDate: dates.monthlyDue,
      dueDateLabel: formatDate(dates.monthlyDue),
      frequency: "monthly",
      status: "needs_review",
      statusLabel: "Needs Review",
      priority: "high",
      assignedTo: "Management",
      sentToEmail: "billing@sitguru.com",
      sentToPhone: "(855) 474-8738",
      reminderChannel: "popup_email_text",
      reminderEnabled: true,
      completedAt: null,
      notes:
        "Fallback reminder. Create cpa_reminders table to make this live.",
      source: "fallback",
      href: "/admin/financials/cpa-handoff",
    },
    {
      id: "fallback-quarterly-review",
      title: "Quarterly CPA Review Package",
      description:
        "Prepare quarterly financial review, estimated tax support, partner payout reporting, and CPA handoff readiness.",
      periodLabel: "Quarterly CPA Review",
      periodStart: null,
      periodEnd: null,
      dueDate: dates.quarterlyDue,
      dueDateLabel: formatDate(dates.quarterlyDue),
      frequency: "quarterly",
      status: "in_progress",
      statusLabel: "In Progress",
      priority: "high",
      assignedTo: "Management",
      sentToEmail: "billing@sitguru.com",
      sentToPhone: "(855) 474-8738",
      reminderChannel: "popup_email_text",
      reminderEnabled: true,
      completedAt: null,
      notes:
        "Fallback reminder. Quarterly CPA package will become live once cpa_reminders is connected.",
      source: "fallback",
      href: "/admin/financials/cpa-handoff",
    },
    {
      id: "fallback-annual-tax-package",
      title: "Annual Tax Package",
      description:
        "Prepare annual tax package, 1099 support, deductions, annual statements, payroll/contractor records, and export history.",
      periodLabel: "Annual Tax Package",
      periodStart: null,
      periodEnd: null,
      dueDate: dates.annualDue,
      dueDateLabel: formatDate(dates.annualDue),
      frequency: "annual",
      status: "not_started",
      statusLabel: "Not Started",
      priority: "critical",
      assignedTo: "Management",
      sentToEmail: "billing@sitguru.com",
      sentToPhone: "(855) 474-8738",
      reminderChannel: "popup_email_text",
      reminderEnabled: true,
      completedAt: null,
      notes:
        "Fallback reminder. Annual tax package tracking will become live once cpa_reminders is connected.",
      source: "fallback",
      href: "/admin/financials/cpa-handoff",
    },
    {
      id: "fallback-tax-deadline",
      title: "Tax Filing Readiness",
      description:
        "Track tax filing readiness, CPA delivery, owner approvals, deductions, contractor documents, and accounting-ready exports.",
      periodLabel: "Tax Readiness",
      periodStart: null,
      periodEnd: null,
      dueDate: dates.taxDue,
      dueDateLabel: formatDate(dates.taxDue),
      frequency: "tax",
      status: "not_started",
      statusLabel: "Not Started",
      priority: "critical",
      assignedTo: "Management",
      sentToEmail: "billing@sitguru.com",
      sentToPhone: "(855) 474-8738",
      reminderChannel: "popup_email_text",
      reminderEnabled: true,
      completedAt: null,
      notes:
        "Fallback reminder. Tax readiness tracking will become live once cpa_reminders is connected.",
      source: "fallback",
      href: "/admin/financials/cpa-handoff",
    },
  ];
}

function mapReminder(record: CpaReminderRecord): CpaHandoffItem {
  const status = normalizeStatus(record.status);
  const dueDate = record.due_date || null;
  const adjustedStatus =
    isPastDue(dueDate) &&
    !["completed", "sent", "ready"].includes(status)
      ? "overdue"
      : status;

  return {
    id: record.id,
    title: record.title || "CPA Handoff Reminder",
    description:
      record.description ||
      "Track CPA handoff readiness, close requirements, and management reminders.",
    periodLabel: record.period_label || labelize(record.frequency) || "Custom Period",
    periodStart: record.period_start || null,
    periodEnd: record.period_end || null,
    dueDate,
    dueDateLabel: formatDate(dueDate),
    frequency: normalizeFrequency(record.frequency),
    status: adjustedStatus,
    statusLabel: labelize(adjustedStatus),
    priority: normalizePriority(record.priority),
    assignedTo: record.assigned_to || "Management",
    sentToEmail: record.sent_to_email || null,
    sentToPhone: record.sent_to_phone || null,
    reminderChannel: record.reminder_channel || "popup_email_text",
    reminderEnabled: record.reminder_enabled !== false,
    completedAt: record.completed_at || null,
    notes: record.notes || null,
    source: "cpa_reminders",
    href: `/admin/financials/cpa-handoff?item=${encodeURIComponent(record.id)}`,
  };
}

function mapExport(record: FinancialExportHistoryRecord): CpaHandoffItem {
  const status = normalizeStatus(record.export_status);
  const frequency = normalizeFrequency(record.package_type);
  const priority: CpaHandoffPriority =
    status === "needs_review" ? "high" : status === "sent" ? "low" : "medium";

  return {
    id: record.id,
    title: record.title,
    description:
      record.notes ||
      "Financial export package connected to CPA handoff tracking.",
    periodLabel: record.period_label || labelize(record.package_type),
    periodStart: record.period_start,
    periodEnd: record.period_end,
    dueDate: null,
    dueDateLabel: "Export generated",
    frequency,
    status,
    statusLabel: labelize(status),
    priority,
    assignedTo: record.created_by || "Admin User",
    sentToEmail: record.sent_to_email,
    sentToPhone: record.sent_to_phone,
    reminderChannel: "export_history",
    reminderEnabled: false,
    completedAt: status === "sent" ? record.updated_at : null,
    notes: record.notes,
    source: "financial_export_history",
    href: `/admin/financials/exports/${encodeURIComponent(record.id)}`,
  };
}

function buildSummary(items: CpaHandoffItem[]): CpaHandoffSummary {
  return {
    total: items.length,
    notStarted: items.filter((item) => item.status === "not_started").length,
    inProgress: items.filter((item) => item.status === "in_progress").length,
    needsReview: items.filter((item) => item.status === "needs_review").length,
    ready: items.filter((item) => item.status === "ready").length,
    sent: items.filter((item) => item.status === "sent").length,
    completed: items.filter((item) => item.status === "completed").length,
    overdue: items.filter((item) => item.status === "overdue").length,
    upcomingDue: items.filter((item) => isDueSoon(item.dueDate)).length,
  };
}

function buildAlerts(items: CpaHandoffItem[]): CpaHandoffAlert[] {
  const overdue = items.filter((item) => item.status === "overdue");
  const needsReview = items.filter((item) => item.status === "needs_review");
  const dueSoon = items.filter((item) => isDueSoon(item.dueDate));
  const ready = items.filter((item) => item.status === "ready");

  const alerts: CpaHandoffAlert[] = [];

  if (overdue.length > 0) {
    alerts.push({
      id: "cpa-overdue",
      title: `${overdue.length} CPA handoff item${overdue.length === 1 ? "" : "s"} overdue`,
      description:
        "Review overdue CPA reminders immediately to avoid missing close, tax, or reporting deadlines.",
      severity: "critical",
      href: "/admin/financials/cpa-handoff",
    });
  }

  if (needsReview.length > 0) {
    alerts.push({
      id: "cpa-needs-review",
      title: `${needsReview.length} CPA item${needsReview.length === 1 ? "" : "s"} need review`,
      description:
        "Review CPA packages, export records, or close checklist items before marking them ready or sent.",
      severity: "warning",
      href: "/admin/financials/cpa-handoff",
    });
  }

  if (dueSoon.length > 0) {
    alerts.push({
      id: "cpa-due-soon",
      title: `${dueSoon.length} CPA reminder${dueSoon.length === 1 ? "" : "s"} due soon`,
      description:
        "Upcoming CPA reminders are due within the next seven days.",
      severity: "info",
      href: "/admin/financials/cpa-handoff",
    });
  }

  if (ready.length > 0) {
    alerts.push({
      id: "cpa-ready",
      title: `${ready.length} CPA package${ready.length === 1 ? "" : "s"} ready`,
      description:
        "Ready packages can be sent to the CPA, bookkeeper, or management.",
      severity: "success",
      href: "/admin/financials/exports",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "cpa-clear",
      title: "CPA handoff is clear",
      description:
        "No overdue, due soon, or review-blocked CPA handoff items were detected.",
      severity: "success",
      href: "/admin/financials/cpa-handoff",
    });
  }

  return alerts;
}

async function readCpaReminders() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cpa_reminders")
    .select("*")
    .order("due_date", { ascending: true })
    .limit(50);

  if (error || !data) {
    return {
      rows: [] as CpaReminderRecord[],
      ok: false,
      message: error?.message || "Unable to load cpa_reminders.",
    };
  }

  return {
    rows: data as CpaReminderRecord[],
    ok: true,
    message:
      data.length > 0
        ? "Loaded CPA reminder records."
        : "CPA reminder table connected but empty.",
  };
}

async function readExportHistory() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("financial_export_history")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(25);

  if (error || !data) {
    return {
      rows: [] as FinancialExportHistoryRecord[],
      ok: false,
      message: error?.message || "Unable to load financial_export_history.",
    };
  }

  return {
    rows: data as FinancialExportHistoryRecord[],
    ok: true,
    message:
      data.length > 0
        ? "Loaded financial export history records."
        : "Financial export history table connected but empty.",
  };
}

export async function GET() {
  const generatedAt = new Date().toISOString();

  try {
    const [reminderResult, exportResult] = await Promise.all([
      readCpaReminders(),
      readExportHistory(),
    ]);

    const reminderItems = reminderResult.rows.map(mapReminder);
    const exportItems = exportResult.rows.map(mapExport);
    const fallbackItems =
      reminderItems.length === 0 ? buildFallbackItems() : [];

    const items = [...reminderItems, ...fallbackItems, ...exportItems];

    const isLive = reminderResult.ok || exportResult.ok;
    const fallbackUsed = reminderItems.length === 0;

    return NextResponse.json({
      ok: true,
      isLive,
      generatedAt,
      sourceHealth: [
        {
          table: "cpa_reminders",
          ok: reminderResult.ok,
          rowCount: reminderResult.rows.length,
          message: reminderResult.message,
        },
        {
          table: "financial_export_history",
          ok: exportResult.ok,
          rowCount: exportResult.rows.length,
          message: exportResult.message,
        },
      ],
      summary: buildSummary(items),
      alerts: buildAlerts(items),
      items,
      exports: exportItems,
      fallbackUsed,
      message: fallbackUsed
        ? "CPA Handoff loaded with fallback reminders plus export history."
        : "CPA Handoff loaded from live reminder records and export history.",
    } satisfies CpaHandoffResponse);
  } catch (error) {
    const fallbackItems = buildFallbackItems();

    return NextResponse.json({
      ok: true,
      isLive: false,
      generatedAt,
      sourceHealth: [
        {
          table: "cpa_handoff_api",
          ok: false,
          rowCount: 0,
          message:
            error instanceof Error
              ? error.message
              : "Unable to load CPA handoff data.",
        },
      ],
      summary: buildSummary(fallbackItems),
      alerts: buildAlerts(fallbackItems),
      items: fallbackItems,
      exports: [],
      fallbackUsed: true,
      message:
        "CPA Handoff loaded with safe fallback reminders because live data was unavailable.",
    } satisfies CpaHandoffResponse);
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
          message: "A title is required to create a CPA handoff reminder.",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const payload = {
      title,
      description: getString(
        body.description,
        "CPA handoff reminder created from SitGuru Admin.",
      ),
      period_label: getString(body.periodLabel, "Custom Period"),
      period_start: getNullableString(body.periodStart),
      period_end: getNullableString(body.periodEnd),
      due_date: getNullableString(body.dueDate),
      frequency: normalizeFrequency(body.frequency),
      status: normalizeStatus(body.status),
      priority: normalizePriority(body.priority),
      assigned_to: getString(body.assignedTo, "Management"),
      sent_to_email: getNullableString(body.sentToEmail),
      sent_to_phone: getNullableString(body.sentToPhone),
      reminder_channel: getString(body.reminderChannel, "popup_email_text"),
      reminder_enabled: getBoolean(body.reminderEnabled, true),
      completed_at: getNullableString(body.completedAt),
      notes: getNullableString(body.notes),
      metadata: {
        ...getObject(body.metadata),
        createdFrom: "admin_financials_cpa_handoff_api",
        generatedAt: new Date().toISOString(),
      },
    };

    const { data, error } = await supabase
      .from("cpa_reminders")
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
            "Unable to create CPA reminder. Confirm cpa_reminders exists.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        record: mapReminder(data as CpaReminderRecord),
        message: "CPA handoff reminder created.",
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
            : "Unable to create CPA handoff reminder.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    const reminderId = getString(body.reminderId);
    const status = normalizeStatus(body.status);
    const notes = getNullableString(body.notes);

    if (!reminderId) {
      return NextResponse.json(
        {
          ok: false,
          record: null,
          message: "A reminderId is required to update a CPA handoff reminder.",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const updatePayload: Record<string, unknown> = {
      status,
      notes,
      updated_at: new Date().toISOString(),
    };

    if (status === "completed" || status === "sent") {
      updatePayload.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("cpa_reminders")
      .update(updatePayload)
      .eq("id", reminderId)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          ok: false,
          record: null,
          message:
            error?.message ||
            "Unable to update CPA reminder. Confirm cpa_reminders exists.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      record: mapReminder(data as CpaReminderRecord),
      message: "CPA handoff reminder updated.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        record: null,
        message:
          error instanceof Error
            ? error.message
            : "Unable to update CPA handoff reminder.",
      },
      { status: 500 },
    );
  }
}