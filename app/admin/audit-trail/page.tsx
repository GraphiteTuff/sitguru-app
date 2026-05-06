import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AuditSource = "admin_audit_logs" | "financial_audit_logs" | "analytics_events";

type AuditSeverity = "info" | "success" | "warning" | "critical";

type AuditEntry = {
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

type AdminIdentity = {
  id: string;
  email: string;
  role: string;
  canAccessAdmin: boolean;
  canAccessFinancials: boolean;
};

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type SearchParams = {
  q?: string;
  category?: string;
  severity?: string;
  source?: string;
};

const CATEGORY_FILTERS = [
  { label: "All Activity", value: "all" },
  { label: "Financials", value: "financials" },
  { label: "Exports", value: "exports" },
  { label: "Security", value: "security" },
  { label: "Users", value: "users" },
  { label: "Bookings", value: "bookings" },
  { label: "Payouts", value: "payouts" },
  { label: "Settings", value: "settings" },
];

const SEVERITY_FILTERS = [
  { label: "All Severity", value: "all" },
  { label: "Info", value: "info" },
  { label: "Success", value: "success" },
  { label: "Warning", value: "warning" },
  { label: "Critical", value: "critical" },
];

const SOURCE_FILTERS = [
  { label: "All Sources", value: "all" },
  { label: "Admin Audit", value: "admin_audit_logs" },
  { label: "Financial Audit", value: "financial_audit_logs" },
  { label: "Analytics Events", value: "analytics_events" },
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

const ADMIN_ROLES = [
  ...FINANCE_ROLES,
  "support_admin",
  "operations",
  "moderator",
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

function getMetadataString(metadata: Record<string, unknown>, key: string) {
  return asTrimmedString(metadata[key]);
}

function getSeverity(value: unknown, metadata: Record<string, unknown>): AuditSeverity {
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

function hasAdminRole(role: string) {
  return ADMIN_ROLES.includes(role.trim().toLowerCase());
}

function hasFinancialRole(role: string) {
  return FINANCE_ROLES.includes(role.trim().toLowerCase());
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

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Audit trail query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Audit trail query skipped for ${label}:`, error);
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
    safeRows<Record<string, unknown>>(
      supabaseAdmin
        .from("admin_users")
        .select("role,email,is_active,can_access_financials")
        .eq("user_id", user.id)
        .limit(1),
      "admin_users_audit_access",
    ),
    safeRows<Record<string, unknown>>(
      supabaseAdmin
        .from("profiles")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "profiles_audit_access",
    ),
    safeRows<Record<string, unknown>>(
      supabaseAdmin
        .from("users")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "users_audit_access",
    ),
  ]);

  const profile = profileChecks.flat().find(Boolean) || {};
  const role = asTrimmedString(profile.role) || "admin";
  const active =
    profile.is_active === undefined
      ? true
      : getOptionalBoolean(profile.is_active);
  const envAllowed = envAdminEmails.includes(userEmail);
  const explicitFinanceAccess = getOptionalBoolean(
    profile.can_access_financials,
  );

  return {
    id: user.id,
    email: userEmail,
    role,
    canAccessAdmin: active && (hasAdminRole(role) || envAllowed),
    canAccessFinancials:
      active && (hasFinancialRole(role) || explicitFinanceAccess || envAllowed),
  };
}

function formatDateTime(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "Unknown time";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function getRelativeTime(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "Unknown";

  const diffMs = Date.now() - parsed.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  return formatDateTime(value);
}

function sourceLabel(source: AuditSource) {
  const labels: Record<AuditSource, string> = {
    admin_audit_logs: "Admin Audit",
    financial_audit_logs: "Financial Audit",
    analytics_events: "Analytics",
  };

  return labels[source];
}

function severityClasses(severity: AuditSeverity) {
  const classes: Record<AuditSeverity, string> = {
    info: "border-blue-100 bg-blue-50 text-blue-800",
    success: "border-emerald-100 bg-emerald-50 text-emerald-800",
    warning: "border-amber-100 bg-amber-50 text-amber-800",
    critical: "border-rose-100 bg-rose-50 text-rose-800",
  };

  return classes[severity];
}

function sourceClasses(source: AuditSource) {
  const classes: Record<AuditSource, string> = {
    admin_audit_logs: "border-slate-200 bg-slate-50 text-slate-700",
    financial_audit_logs: "border-emerald-100 bg-emerald-50 text-emerald-800",
    analytics_events: "border-violet-100 bg-violet-50 text-violet-800",
  };

  return classes[source];
}

function normalizeAdminAuditRow(row: Record<string, unknown>, source: AuditSource): AuditEntry {
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

function normalizeAnalyticsRow(row: Record<string, unknown>): AuditEntry {
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

function classifyCategory(entry: AuditEntry) {
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

function matchesSearch(entry: AuditEntry, query: string) {
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

function filterEntries(entries: AuditEntry[], searchParams: SearchParams) {
  const query = asTrimmedString(searchParams.q).toLowerCase();
  const category = asTrimmedString(searchParams.category) || "all";
  const severity = asTrimmedString(searchParams.severity) || "all";
  const source = asTrimmedString(searchParams.source) || "all";

  return entries.filter((entry) => {
    if (source !== "all" && entry.source !== source) return false;
    if (severity !== "all" && entry.severity !== severity) return false;
    if (category !== "all" && classifyCategory(entry) !== category) return false;
    if (!matchesSearch(entry, query)) return false;

    return true;
  });
}

function buildFilterHref(
  searchParams: SearchParams,
  updates: Partial<SearchParams>,
) {
  const params = new URLSearchParams();

  const next = {
    ...searchParams,
    ...updates,
  };

  Object.entries(next).forEach(([key, value]) => {
    if (value && value !== "all") params.set(key, value);
  });

  const query = params.toString();

  return query ? `/admin/audit-trail?${query}` : "/admin/audit-trail";
}

function metadataPreview(metadata: Record<string, unknown>) {
  const entries = Object.entries(metadata)
    .filter(([key]) => !["userAgent", "ipAddress"].includes(key))
    .slice(0, 4);

  if (!entries.length) return "No extra metadata";

  return entries
    .map(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        return `${key}: —`;
      }

      if (typeof value === "object") {
        return `${key}: ${JSON.stringify(value).slice(0, 80)}`;
      }

      return `${key}: ${String(value).slice(0, 80)}`;
    })
    .join(" • ");
}

async function getAuditEntries(canAccessFinancials: boolean) {
  const [adminRows, financialRows, analyticsRows] = await Promise.all([
    safeRows<Record<string, unknown>>(
      supabaseAdmin
        .from("admin_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(250),
      "admin_audit_logs",
    ),
    canAccessFinancials
      ? safeRows<Record<string, unknown>>(
          supabaseAdmin
            .from("financial_audit_logs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(250),
          "financial_audit_logs",
        )
      : Promise.resolve([]),
    safeRows<Record<string, unknown>>(
      supabaseAdmin
        .from("analytics_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(250),
      "analytics_events",
    ),
  ]);

  return [
    ...adminRows.map((row) => normalizeAdminAuditRow(row, "admin_audit_logs")),
    ...financialRows.map((row) =>
      normalizeAdminAuditRow(row, "financial_audit_logs"),
    ),
    ...analyticsRows.map(normalizeAnalyticsRow),
  ]
    .sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime() || 0;
      const bTime = new Date(b.createdAt).getTime() || 0;
      return bTime - aTime;
    })
    .slice(0, 500);
}

function FilterPill({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-2 text-xs font-black shadow-sm transition ${
        active
          ? "border-emerald-700 bg-emerald-700 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
      }`}
    >
      {label}
    </Link>
  );
}

function AuditStatCard({
  label,
  value,
  detail,
  tone = "emerald",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "emerald" | "blue" | "amber" | "rose";
}) {
  const toneClass = {
    emerald: "border-emerald-100 bg-emerald-50",
    blue: "border-blue-100 bg-blue-50",
    amber: "border-amber-100 bg-amber-50",
    rose: "border-rose-100 bg-rose-50",
  }[tone];

  return (
    <div className={`rounded-[1.5rem] border p-5 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
}

function AuditEntryCard({ entry }: { entry: AuditEntry }) {
  return (
    <article className="rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${severityClasses(
                entry.severity,
              )}`}
            >
              {entry.severity}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${sourceClasses(
                entry.source,
              )}`}
            >
              {sourceLabel(entry.source)}
            </span>
            <span className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
              {classifyCategory(entry)}
            </span>
          </div>

          <h3 className="mt-3 text-xl font-black tracking-tight text-slate-950">
            {entry.action.replaceAll("_", " ")}
          </h3>

          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            {entry.area || "admin"}{" "}
            {entry.pagePath ? (
              <span className="text-slate-400">• {entry.pagePath}</span>
            ) : null}
          </p>
        </div>

        <div className="shrink-0 text-left lg:text-right">
          <p className="text-sm font-black text-slate-950">
            {formatDateTime(entry.createdAt)}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {getRelativeTime(entry.createdAt)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-[#fbfefd] p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Actor
          </p>
          <p className="mt-2 truncate text-sm font-black text-slate-950">
            {entry.actorEmail || entry.actorId || "System / Unknown"}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {entry.actorRole || "role unavailable"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-[#fbfefd] p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Target
          </p>
          <p className="mt-2 truncate text-sm font-black text-slate-950">
            {entry.targetType || "No target type"}
          </p>
          <p className="mt-1 truncate text-xs font-semibold text-slate-500">
            {entry.targetId || "No target ID"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-[#fbfefd] p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Request Context
          </p>
          <p className="mt-2 truncate text-sm font-black text-slate-950">
            {asTrimmedString(entry.metadata.ipAddress) || "IP unavailable"}
          </p>
          <p className="mt-1 truncate text-xs font-semibold text-slate-500">
            {asTrimmedString(entry.metadata.userAgent) || "User agent unavailable"}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
          Metadata Preview
        </p>
        <p className="mt-2 break-words text-sm font-semibold leading-6 text-slate-600">
          {metadataPreview(entry.metadata)}
        </p>
      </div>
    </article>
  );
}

export default async function AdminAuditTrailPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) || {};
  const actor = await getAdminIdentity();

  if (!actor?.canAccessAdmin) {
    return null;
  }

  const entries = await getAuditEntries(actor.canAccessFinancials);
  const filteredEntries = filterEntries(entries, params);

  const category = asTrimmedString(params.category) || "all";
  const severity = asTrimmedString(params.severity) || "all";
  const source = asTrimmedString(params.source) || "all";
  const query = asTrimmedString(params.q);

  const criticalCount = entries.filter((entry) => entry.severity === "critical").length;
  const warningCount = entries.filter((entry) => entry.severity === "warning").length;
  const financialCount = entries.filter((entry) => classifyCategory(entry) === "financials").length;
  const exportCount = entries.filter((entry) => classifyCategory(entry) === "exports").length;

  return (
    <main className="min-h-screen bg-[#f7fbf8] px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-5xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                Admin / Analytics / Audit Trail
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                SitGuru Audit Trail.
              </h1>

              <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600 sm:text-base">
                Review admin actions, financial exports, emailed reports,
                security-sensitive events, analytics activity, statement changes,
                payout updates, Stripe/Navy Federal activity, and system events
                in one CPA/security-ready trail.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/analytics"
                className="rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm font-bold text-slate-950 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
              >
                Analytics
              </Link>
              <Link
                href="/admin/reports"
                className="rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm font-bold text-slate-950 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
              >
                Reports & Exports
              </Link>
              <Link
                href="/admin/financials"
                className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-700/10 transition hover:bg-emerald-800"
              >
                Financial Overview
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <AuditStatCard
              label="Total Events"
              value={entries.length.toLocaleString()}
              detail="Latest combined audit and analytics records."
              tone="emerald"
            />
            <AuditStatCard
              label="Critical"
              value={criticalCount.toLocaleString()}
              detail="Failed, blocked, or high-risk events."
              tone={criticalCount > 0 ? "rose" : "emerald"}
            />
            <AuditStatCard
              label="Warnings"
              value={warningCount.toLocaleString()}
              detail="Items that may need admin review."
              tone={warningCount > 0 ? "amber" : "emerald"}
            />
            <AuditStatCard
              label="Finance / Exports"
              value={(financialCount + exportCount).toLocaleString()}
              detail="Financial statement, export, email, and CPA trail events."
              tone="blue"
            />
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Filters
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Find activity by category, severity, source, or keyword.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Search actor emails, actions, areas, targets, page paths, or
                metadata. Financial audit records are visible to finance-enabled
                admins.
              </p>
            </div>

            <form action="/admin/audit-trail" className="w-full max-w-xl">
              <input
                name="q"
                defaultValue={query}
                placeholder="Search audit trail..."
                className="w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
              <input type="hidden" name="category" value={category} />
              <input type="hidden" name="severity" value={severity} />
              <input type="hidden" name="source" value={source} />
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/10 transition hover:bg-emerald-800"
                >
                  Search
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Category
              </p>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_FILTERS.map((filter) => (
                  <FilterPill
                    key={filter.value}
                    href={buildFilterHref(params, { category: filter.value })}
                    label={filter.label}
                    active={category === filter.value || (!params.category && filter.value === "all")}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Severity
              </p>
              <div className="flex flex-wrap gap-2">
                {SEVERITY_FILTERS.map((filter) => (
                  <FilterPill
                    key={filter.value}
                    href={buildFilterHref(params, { severity: filter.value })}
                    label={filter.label}
                    active={severity === filter.value || (!params.severity && filter.value === "all")}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Source
              </p>
              <div className="flex flex-wrap gap-2">
                {SOURCE_FILTERS.map((filter) => (
                  <FilterPill
                    key={filter.value}
                    href={buildFilterHref(params, { source: filter.value })}
                    label={filter.label}
                    active={source === filter.value || (!params.source && filter.value === "all")}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Results
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                {filteredEntries.length.toLocaleString()} matching audit events
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Showing the newest events first from admin audit, financial
                audit, and analytics tracking sources.
              </p>
            </div>

            <Link
              href="/admin/audit-trail"
              className="inline-flex w-fit rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm font-bold text-slate-950 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
            >
              Clear Filters
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {filteredEntries.length ? (
              filteredEntries.map((entry) => (
                <AuditEntryCard key={`${entry.source}-${entry.id}`} entry={entry} />
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <p className="text-lg font-black text-slate-950">
                  No audit events found.
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Adjust filters or generate admin activity such as exports,
                  financial edits, approvals, settings changes, or analytics
                  events.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
