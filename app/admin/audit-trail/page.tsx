import Link from "next/link";
import { getAdminIdentity } from "@/lib/admin/access";
import {
  asTrimmedString,
  classifyCategory,
  filterEntries,
  formatMetadataValue,
  getAuditTrail,
  sourceLabel,
  type AuditEntry,
  type AuditSearchParams,
  type AuditSeverity,
  type AuditSource,
  type AuditSourceHealth,
} from "@/lib/admin/audit";

export const dynamic = "force-dynamic";

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

function readinessClasses(available: boolean) {
  return available
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-amber-200 bg-amber-50 text-amber-800";
}

function buildFilterHref(
  searchParams: AuditSearchParams,
  updates: Partial<AuditSearchParams>,
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

function buildExportHref(searchParams: AuditSearchParams, format: "csv" | "json") {
  const params = new URLSearchParams();
  params.set("format", format);

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value && value !== "all") params.set(key, value);
  });

  return `/api/admin/audit-trail/export?${params.toString()}`;
}

function metadataPreview(metadata: Record<string, unknown>) {
  const entries = Object.entries(metadata)
    .filter(([key]) => !["userAgent", "ipAddress"].includes(key))
    .slice(0, 4);

  if (!entries.length) return "No extra metadata";

  return entries
    .map(([key, value]) => `${key}: ${formatMetadataValue(key, value)}`)
    .join(" • ");
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

function SourceHealthCard({ item }: { item: AuditSourceHealth }) {
  return (
    <div className="rounded-[1.35rem] border border-slate-100 bg-[#fbfefd] p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-black text-slate-950">{item.label}</p>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${readinessClasses(
            item.available,
          )}`}
        >
          {item.available ? "Live" : "Setup"}
        </span>
      </div>
      <p className="mt-2 text-2xl font-black text-slate-950">
        {item.count.toLocaleString()}
      </p>
      <p className="mt-2 text-xs font-bold leading-5 text-slate-600">
        {item.message}
      </p>
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
  searchParams?: Promise<AuditSearchParams>;
}) {
  const params = (await searchParams) || {};
  const actor = await getAdminIdentity();

  if (!actor?.canAccessAdmin) {
    return (
      <div className="min-h-screen bg-[#f7fbf8] px-6 py-10 text-slate-950">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-rose-100 bg-white p-8 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-rose-700">
            Access Restricted
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
            Admin access required.
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            Sign in with an admin account to open the SitGuru Audit Trail.
            Financial audit events also require finance-enabled access.
          </p>
        </div>
      </div>
    );
  }

  const trail = await getAuditTrail({
    canAccessFinancials: actor.canAccessFinancials,
  });
  const filteredEntries = filterEntries(trail.entries, params);

  const category = asTrimmedString(params.category) || "all";
  const severity = asTrimmedString(params.severity) || "all";
  const source = asTrimmedString(params.source) || "all";
  const query = asTrimmedString(params.q);
  const from = asTrimmedString(params.from);
  const to = asTrimmedString(params.to);

  const criticalCount = trail.entries.filter(
    (entry) => entry.severity === "critical",
  ).length;
  const warningCount = trail.entries.filter(
    (entry) => entry.severity === "warning",
  ).length;
  const financialCount = trail.entries.filter(
    (entry) => classifyCategory(entry) === "financials",
  ).length;
  const exportCount = trail.entries.filter(
    (entry) => classifyCategory(entry) === "exports",
  ).length;
  const liveSources = trail.health.filter((item) => item.available).length;

  const csvHref = buildExportHref(params, "csv");
  const jsonHref = buildExportHref(params, "json");

  return (
    <main className="min-h-screen bg-[#f7fbf8] px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-5xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                Admin / Analytics / Audit Trail
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  SitGuru Audit Trail.
                </h1>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${
                    liveSources > 0
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {liveSources > 0
                    ? `${liveSources}/3 Sources Live`
                    : "Sources Setup Needed"}
                </span>
                {!actor.canAccessFinancials ? (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-amber-700">
                    Finance Events Hidden
                  </span>
                ) : null}
              </div>

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
                href="/admin/financials/exports"
                className="rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm font-bold text-slate-950 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
              >
                Export Center
              </Link>
              <Link
                href={csvHref}
                className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-900 shadow-sm transition hover:bg-emerald-100"
              >
                Export CSV
              </Link>
              <Link
                href={jsonHref}
                className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-700/10 transition hover:bg-emerald-800"
              >
                Export JSON
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <AuditStatCard
              label="Total Events"
              value={trail.entries.length.toLocaleString()}
              detail="Deduped combined audit and analytics records."
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
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Wiring & Readiness
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Live audit source checks
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Service-role reads from admin audit, financial audit, and analytics
              event tables. Apply the audit-log migration if a source shows Setup.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {trail.health.map((item) => (
              <SourceHealthCard key={item.source} item={item} />
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Filters
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Find activity by category, severity, source, date, or keyword.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Search actor emails, actions, areas, targets, page paths, or
                metadata. Financial audit records stay hidden without finance
                access. Exports honor the active filters.
              </p>
            </div>

            <form action="/admin/audit-trail" className="w-full max-w-xl space-y-3">
              <input
                name="q"
                defaultValue={query}
                placeholder="Search audit trail..."
                className="w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                    From
                  </span>
                  <input
                    type="date"
                    name="from"
                    defaultValue={from}
                    className="w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                    To
                  </span>
                  <input
                    type="date"
                    name="to"
                    defaultValue={to}
                    className="w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>
              </div>
              <input type="hidden" name="category" value={category} />
              <input type="hidden" name="severity" value={severity} />
              <input type="hidden" name="source" value={source} />
              <div className="flex justify-end gap-2">
                <Link
                  href="/admin/audit-trail"
                  className="rounded-xl border border-slate-100 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Clear
                </Link>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/10 transition hover:bg-emerald-800"
                >
                  Apply
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
                    active={
                      category === filter.value ||
                      (!params.category && filter.value === "all")
                    }
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
                    active={
                      severity === filter.value ||
                      (!params.severity && filter.value === "all")
                    }
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
                    active={
                      source === filter.value ||
                      (!params.source && filter.value === "all")
                    }
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
                Newest first from admin audit, financial audit, and analytics
                tracking sources. Dual-written finance events are deduped.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={csvHref}
                className="inline-flex rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-900 shadow-sm transition hover:bg-emerald-100"
              >
                Download Filtered CSV
              </Link>
              <Link
                href="/admin/audit-trail"
                className="inline-flex rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm font-bold text-slate-950 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
              >
                Clear Filters
              </Link>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {filteredEntries.length ? (
              filteredEntries.map((entry) => (
                <AuditEntryCard
                  key={`${entry.source}-${entry.id}`}
                  entry={entry}
                />
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <p className="text-lg font-black text-slate-950">
                  No audit events found.
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {liveSources === 0
                    ? "Audit tables look unavailable. Apply supabase/migrations/20260802_create_admin_financial_audit_logs.sql, then generate exports or admin actions."
                    : "Adjust filters or generate admin activity such as exports, financial edits, approvals, settings changes, or analytics events."}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
