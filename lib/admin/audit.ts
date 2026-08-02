import { supabaseAdmin } from "@/lib/supabase/admin";

export type AuditSource =
  | "admin_audit_logs"
  | "financial_audit_logs"
  | "analytics_events";

export type AuditSeverity = "info" | "success" | "warning" | "critical";

export type AuditEntry = {
  id: string;
  source: AuditSource;
  action: string;
  area: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  targetType: string;
  targetId: string;
  severity: AuditSeverity;
  pagePath: string;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type AuditSourceHealth = {
  source: AuditSource;
  label: string;
  available: boolean;
  count: number;
  message: string;
};

export type AuditTrailResult = {
  entries: AuditEntry[];
  health: AuditSourceHealth[];
  totalBeforeFilter: number;
};

export type AuditSearchParams = {
  q?: string;
  category?: string;
  severity?: string;
  source?: string;
  from?: string;
  to?: string;
  page?: string;
};

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

const MONEY_KEYS = new Set([
  "amount",
  "gross",
  "net",
  "fee",
  "total",
  "revenue",
  "expense",
  "payout",
  "commission",
  "liability",
  "balance",
]);

export function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function safeMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function getMetadataString(metadata: Record<string, unknown>, key: string) {
  return asTrimmedString(metadata[key]);
}

export function getSeverity(
  value: unknown,
  metadata: Record<string, unknown>,
): AuditSeverity {
  const normalized = (
    asTrimmedString(value) ||
    getMetadataString(metadata, "severity") ||
    getMetadataString(metadata, "level")
  ).toLowerCase();

  if (normalized === "success") return "success";
  if (normalized === "warning" || normalized === "warn") return "warning";
  if (
    normalized === "critical" ||
    normalized === "error" ||
    normalized === "danger" ||
    normalized === "failed"
  ) {
    return "critical";
  }

  return "info";
}

export function sourceLabel(source: AuditSource) {
  const labels: Record<AuditSource, string> = {
    admin_audit_logs: "Admin Audit",
    financial_audit_logs: "Financial Audit",
    analytics_events: "Analytics",
  };

  return labels[source];
}

export function formatMoneyExact(value: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value || 0));

  return value < 0 ? `(${formatted})` : formatted;
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[$,()]/g, "").trim();
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) {
      return value.includes("(") && value.includes(")") ? -parsed : parsed;
    }
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatMetadataValue(key: string, value: unknown) {
  if (value === null || value === undefined || value === "") return "—";

  if (typeof value === "object") {
    return JSON.stringify(value).slice(0, 120);
  }

  const lowerKey = key.toLowerCase();
  const numeric = toNumber(value);

  if (numeric !== null) {
    if (lowerKey.includes("cent") || lowerKey.endsWith("_cents")) {
      return formatMoneyExact(numeric / 100);
    }

    if (
      [...MONEY_KEYS].some((token) => lowerKey.includes(token)) &&
      !lowerKey.includes("count") &&
      !lowerKey.includes("percent") &&
      !lowerKey.includes("rate")
    ) {
      // Heuristic: values >= 1000 with no decimal often arrive as cents from ledger writers.
      if (Number.isInteger(numeric) && Math.abs(numeric) >= 1000) {
        return formatMoneyExact(numeric / 100);
      }

      return formatMoneyExact(numeric);
    }
  }

  return String(value).slice(0, 120);
}

export function normalizeAdminAuditRow(
  row: Record<string, unknown>,
  source: AuditSource,
): AuditEntry {
  const metadata = safeMetadata(row.metadata);

  return {
    id:
      asTrimmedString(row.id) ||
      `${source}-${asTrimmedString(row.created_at)}-${asTrimmedString(row.action)}`,
    source,
    action: asTrimmedString(row.action) || "admin_action",
    area: asTrimmedString(row.area) || "admin",
    actorId: asTrimmedString(row.actor_id),
    actorEmail: asTrimmedString(row.actor_email),
    actorRole: asTrimmedString(row.actor_role),
    targetType: asTrimmedString(row.target_type),
    targetId: asTrimmedString(row.target_id),
    severity: getSeverity(row.severity, metadata),
    pagePath: getMetadataString(metadata, "pagePath"),
    createdAt: asTrimmedString(row.created_at) || new Date().toISOString(),
    metadata,
  };
}

export function normalizeAnalyticsRow(row: Record<string, unknown>): AuditEntry {
  const metadata = safeMetadata(row.metadata);
  const eventName = asTrimmedString(row.event_name) || "analytics_event";
  const eventType = asTrimmedString(row.event_type) || "interaction";

  return {
    id:
      asTrimmedString(row.id) ||
      `analytics-${asTrimmedString(row.created_at)}-${eventName}`,
    source: "analytics_events",
    action: getMetadataString(metadata, "auditAction") || eventName,
    area:
      getMetadataString(metadata, "auditArea") ||
      asTrimmedString(row.source) ||
      eventType ||
      "analytics",
    actorId: asTrimmedString(row.user_id),
    actorEmail: getMetadataString(metadata, "actorEmail"),
    actorRole: asTrimmedString(row.role),
    targetType: getMetadataString(metadata, "targetType"),
    targetId:
      getMetadataString(metadata, "targetId") ||
      asTrimmedString(row.booking_id) ||
      asTrimmedString(row.guru_id),
    severity: getSeverity(row.severity, metadata),
    pagePath: asTrimmedString(row.page_path),
    createdAt: asTrimmedString(row.created_at) || new Date().toISOString(),
    metadata,
  };
}

export function classifyCategory(entry: AuditEntry) {
  const text = [
    entry.action,
    entry.area,
    entry.targetType,
    entry.pagePath,
    JSON.stringify(entry.metadata),
  ]
    .join(" ")
    .toLowerCase();

  if (
    text.includes("financial") ||
    text.includes("profit") ||
    text.includes("balance") ||
    text.includes("cash_flow") ||
    text.includes("stripe") ||
    text.includes("plaid") ||
    text.includes("bank") ||
    text.includes("navy")
  ) {
    return "financials";
  }

  if (
    text.includes("export") ||
    text.includes("email") ||
    text.includes("csv") ||
    text.includes("excel") ||
    text.includes("pdf") ||
    text.includes("word")
  ) {
    return "exports";
  }

  if (
    text.includes("login") ||
    text.includes("security") ||
    text.includes("permission") ||
    text.includes("role") ||
    text.includes("access")
  ) {
    return "security";
  }

  if (
    text.includes("user") ||
    text.includes("customer") ||
    text.includes("profile") ||
    text.includes("guru")
  ) {
    return "users";
  }

  if (text.includes("booking") || text.includes("reservation")) {
    return "bookings";
  }

  if (
    text.includes("payout") ||
    text.includes("commission") ||
    text.includes("payable")
  ) {
    return "payouts";
  }

  if (text.includes("setting") || text.includes("config")) {
    return "settings";
  }

  return "all";
}

export function isFinancialSensitive(entry: AuditEntry) {
  if (entry.source === "financial_audit_logs") return true;

  const category = classifyCategory(entry);
  if (category === "financials" || category === "exports" || category === "payouts") {
    return true;
  }

  const text = `${entry.action} ${entry.area}`.toLowerCase();
  return (
    text.includes("financial") ||
    text.includes("export") ||
    text.includes("payout") ||
    text.includes("commission") ||
    text.includes("stripe") ||
    text.includes("plaid") ||
    text.includes("tax") ||
    text.includes("cpa")
  );
}

function dedupeKey(entry: AuditEntry) {
  return [
    entry.action,
    entry.actorId || entry.actorEmail,
    entry.targetId,
    entry.createdAt,
  ]
    .join("|")
    .toLowerCase();
}

export function dedupeEntries(entries: AuditEntry[]) {
  const seen = new Set<string>();
  const result: AuditEntry[] = [];

  for (const entry of entries) {
    const key = dedupeKey(entry);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(entry);
  }

  return result;
}

export function matchesSearch(entry: AuditEntry, query: string) {
  if (!query) return true;

  const normalized = query.toLowerCase();

  return [
    entry.action,
    entry.area,
    entry.actorEmail,
    entry.actorRole,
    entry.targetType,
    entry.targetId,
    entry.pagePath,
    sourceLabel(entry.source),
    JSON.stringify(entry.metadata),
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalized);
}

function parseIsoDate(value: string | undefined, endOfDay = false) {
  const text = asTrimmedString(value);
  if (!text) return null;

  const parsed = new Date(
    text.length <= 10
      ? `${text}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`
      : text,
  );

  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function filterEntries(
  entries: AuditEntry[],
  searchParams: AuditSearchParams,
) {
  const query = asTrimmedString(searchParams.q).toLowerCase();
  const category = asTrimmedString(searchParams.category) || "all";
  const severity = asTrimmedString(searchParams.severity) || "all";
  const source = asTrimmedString(searchParams.source) || "all";
  const from = parseIsoDate(searchParams.from, false);
  const to = parseIsoDate(searchParams.to, true);

  return entries.filter((entry) => {
    if (source !== "all" && entry.source !== source) return false;
    if (severity !== "all" && entry.severity !== severity) return false;
    if (category !== "all" && classifyCategory(entry) !== category) return false;
    if (!matchesSearch(entry, query)) return false;

    const created = new Date(entry.createdAt).getTime();
    if (from && created < from.getTime()) return false;
    if (to && created > to.getTime()) return false;

    return true;
  });
}

async function safeQuery(
  query: PromiseLike<SafeQueryResponse>,
  label: string,
): Promise<{ rows: Record<string, unknown>[]; available: boolean; message: string }> {
  try {
    const result = await query;

    if (result.error) {
      const message =
        typeof result.error === "object" &&
        result.error &&
        "message" in result.error
          ? String((result.error as { message?: unknown }).message || label)
          : `${label} unavailable`;

      console.warn(`Audit trail query skipped for ${label}:`, result.error);
      return {
        rows: [],
        available: false,
        message,
      };
    }

    const rows = Array.isArray(result.data)
      ? (result.data as Record<string, unknown>[])
      : [];

    return {
      rows,
      available: true,
      message: rows.length
        ? `${rows.length} recent row${rows.length === 1 ? "" : "s"}`
        : "Connected · no rows yet",
    };
  } catch (error) {
    console.warn(`Audit trail query skipped for ${label}:`, error);
    return {
      rows: [],
      available: false,
      message: error instanceof Error ? error.message : `${label} unavailable`,
    };
  }
}

export async function getAuditTrail(options: {
  canAccessFinancials: boolean;
  limitPerSource?: number;
}): Promise<AuditTrailResult> {
  const limit = options.limitPerSource ?? 250;

  const [adminResult, financialResult, analyticsResult] = await Promise.all([
    safeQuery(
      supabaseAdmin
        .from("admin_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit),
      "admin_audit_logs",
    ),
    options.canAccessFinancials
      ? safeQuery(
          supabaseAdmin
            .from("financial_audit_logs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(limit),
          "financial_audit_logs",
        )
      : Promise.resolve({
          rows: [] as Record<string, unknown>[],
          available: false,
          message: "Hidden · finance access required",
        }),
    safeQuery(
      supabaseAdmin
        .from("analytics_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit),
      "analytics_events",
    ),
  ]);

  const health: AuditSourceHealth[] = [
    {
      source: "admin_audit_logs",
      label: "Admin Audit",
      available: adminResult.available,
      count: adminResult.rows.length,
      message: adminResult.message,
    },
    {
      source: "financial_audit_logs",
      label: "Financial Audit",
      available: financialResult.available,
      count: financialResult.rows.length,
      message: financialResult.message,
    },
    {
      source: "analytics_events",
      label: "Analytics Events",
      available: analyticsResult.available,
      count: analyticsResult.rows.length,
      message: analyticsResult.message,
    },
  ];

  let entries = [
    ...adminResult.rows.map((row) =>
      normalizeAdminAuditRow(row, "admin_audit_logs"),
    ),
    ...financialResult.rows.map((row) =>
      normalizeAdminAuditRow(row, "financial_audit_logs"),
    ),
    ...analyticsResult.rows.map(normalizeAnalyticsRow),
  ];

  if (!options.canAccessFinancials) {
    entries = entries.filter((entry) => !isFinancialSensitive(entry));
  }

  entries = dedupeEntries(entries).sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime() || 0;
    const bTime = new Date(b.createdAt).getTime() || 0;
    return bTime - aTime;
  });

  return {
    entries: entries.slice(0, 500),
    health,
    totalBeforeFilter: entries.length,
  };
}

export function buildAuditExportRows(entries: AuditEntry[]) {
  return entries.map((entry) => ({
    created_at: entry.createdAt,
    source: entry.source,
    severity: entry.severity,
    category: classifyCategory(entry),
    action: entry.action,
    area: entry.area,
    actor_email: entry.actorEmail,
    actor_role: entry.actorRole,
    actor_id: entry.actorId,
    target_type: entry.targetType,
    target_id: entry.targetId,
    page_path: entry.pagePath,
    metadata: JSON.stringify(entry.metadata),
  }));
}
