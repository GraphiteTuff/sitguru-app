"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

type SourceHealth = {
  table: string;
  ok: boolean;
  rowCount: number;
  message: string;
};

type CpaHandoffResponse = {
  ok: boolean;
  isLive: boolean;
  generatedAt: string;
  sourceHealth: SourceHealth[];
  summary: CpaHandoffSummary;
  alerts: CpaHandoffAlert[];
  items: CpaHandoffItem[];
  exports: CpaHandoffItem[];
  fallbackUsed: boolean;
  message: string;
};

const fallbackResponse: CpaHandoffResponse = {
  ok: true,
  isLive: false,
  generatedAt: new Date().toISOString(),
  sourceHealth: [
    {
      table: "preview",
      ok: true,
      rowCount: 0,
      message: "Preview fallback loaded while CPA handoff data loads.",
    },
  ],
  summary: {
    total: 4,
    notStarted: 2,
    inProgress: 1,
    needsReview: 1,
    ready: 0,
    sent: 0,
    completed: 0,
    overdue: 0,
    upcomingDue: 0,
  },
  alerts: [
    {
      id: "preview-alert",
      title: "CPA Handoff is loading",
      description:
        "Safe fallback data is displayed until live CPA handoff data responds.",
      severity: "info",
      href: "/admin/financials/cpa-handoff",
    },
  ],
  items: [],
  exports: [],
  fallbackUsed: true,
  message: "Loading CPA handoff data...",
};

const filters = [
  { label: "All", value: "all" },
  { label: "Monthly", value: "monthly" },
  { label: "Quarterly", value: "quarterly" },
  { label: "Annual", value: "annual" },
  { label: "Tax", value: "tax" },
  { label: "Exports", value: "financial_export_history" },
  { label: "Needs Review", value: "needs_review" },
  { label: "Ready", value: "ready" },
  { label: "Overdue", value: "overdue" },
];

const statusActions: {
  label: string;
  value: CpaHandoffStatus;
  description: string;
}[] = [
  {
    label: "Not Started",
    value: "not_started",
    description: "Reset this reminder back to planning mode.",
  },
  {
    label: "In Progress",
    value: "in_progress",
    description: "Work has started and supporting records are being gathered.",
  },
  {
    label: "Needs Review",
    value: "needs_review",
    description: "Management, CPA, or bookkeeper review is needed.",
  },
  {
    label: "Ready",
    value: "ready",
    description: "Package is ready to send or complete.",
  },
  {
    label: "Sent",
    value: "sent",
    description: "Package was sent to CPA, bookkeeper, or management.",
  },
  {
    label: "Completed",
    value: "completed",
    description: "Reminder is fully complete.",
  },
];

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Updated just now";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function statusClasses(status: CpaHandoffStatus) {
  const classes = {
    not_started: "border-slate-200 bg-slate-50 text-slate-700",
    in_progress: "border-blue-200 bg-blue-50 text-blue-800",
    needs_review: "border-amber-200 bg-amber-50 text-amber-800",
    ready: "border-emerald-200 bg-emerald-50 text-emerald-800",
    sent: "border-emerald-200 bg-emerald-50 text-emerald-800",
    completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
    overdue: "border-rose-200 bg-rose-50 text-rose-800",
  };

  return classes[status];
}

function priorityClasses(priority: CpaHandoffPriority) {
  const classes = {
    low: "border-slate-200 bg-slate-50 text-slate-700",
    medium: "border-blue-200 bg-blue-50 text-blue-800",
    high: "border-amber-200 bg-amber-50 text-amber-800",
    critical: "border-rose-200 bg-rose-50 text-rose-800",
  };

  return classes[priority];
}

function alertClasses(severity: CpaHandoffAlert["severity"]) {
  const classes = {
    success: "border-emerald-100 bg-emerald-50 text-emerald-800",
    info: "border-blue-100 bg-blue-50 text-blue-800",
    warning: "border-amber-100 bg-amber-50 text-amber-800",
    critical: "border-rose-100 bg-rose-50 text-rose-800",
  };

  return classes[severity];
}

function sourceClasses(source: CpaHandoffItem["source"]) {
  const classes = {
    cpa_reminders: "border-emerald-200 bg-emerald-50 text-emerald-800",
    financial_export_history: "border-purple-200 bg-purple-50 text-purple-800",
    fallback: "border-amber-200 bg-amber-50 text-amber-800",
  };

  return classes[source];
}

function labelize(value: string) {
  return value
    .split(/[-_\s]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function SummaryCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: number;
  tone?: "green" | "blue" | "amber" | "rose" | "slate";
}) {
  const tones = {
    green: "border-emerald-100 bg-emerald-50 text-emerald-800",
    blue: "border-blue-100 bg-blue-50 text-blue-800",
    amber: "border-amber-100 bg-amber-50 text-amber-800",
    rose: "border-rose-100 bg-rose-50 text-rose-800",
    slate: "border-slate-100 bg-slate-50 text-slate-700",
  };

  return (
    <div className={`rounded-[1.25rem] border p-4 shadow-sm ${tones[tone]}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.16em] opacity-75">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function ArrowCircle() {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 bg-white text-emerald-700 shadow-sm transition group-hover:border-emerald-200 group-hover:bg-emerald-700 group-hover:text-white">
      →
    </span>
  );
}

function StatusActionButton({
  item,
  action,
  loadingStatus,
  onUpdate,
}: {
  item: CpaHandoffItem;
  action: (typeof statusActions)[number];
  loadingStatus: CpaHandoffStatus | null;
  onUpdate: (status: CpaHandoffStatus) => void;
}) {
  const isActive = item.status === action.value;
  const isLoading = loadingStatus === action.value;

  return (
    <button
      type="button"
      disabled={Boolean(loadingStatus) || item.source !== "cpa_reminders"}
      onClick={() => onUpdate(action.value)}
      className={`rounded-[1rem] border px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
        isActive
          ? action.value === "needs_review"
            ? "border-amber-200 bg-amber-500 text-white shadow-sm"
            : action.value === "not_started"
              ? "border-emerald-200 bg-emerald-700 text-white shadow-sm"
              : action.value === "in_progress"
                ? "border-blue-200 bg-blue-600 text-white shadow-sm"
                : "border-emerald-200 bg-emerald-700 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
      }`}
    >
      <span className="block text-xs font-black">
        {isLoading ? "Updating..." : action.label}
      </span>
      <span className="mt-1 block text-[11px] font-bold leading-4 opacity-80">
        {isActive ? "Current status. " : ""}
        {action.description}
      </span>
    </button>
  );
}

function CpaStatusActions({
  item,
  onUpdated,
}: {
  item: CpaHandoffItem;
  onUpdated: () => Promise<void>;
}) {
  const [loadingStatus, setLoadingStatus] = useState<CpaHandoffStatus | null>(
    null,
  );
  const [note, setNote] = useState("");
  const [message, setMessage] = useState(
    item.source === "cpa_reminders"
      ? "Update this reminder as it moves through CPA handoff workflow."
      : "Status actions are available for live CPA reminder records only.",
  );
  const [tone, setTone] = useState<"green" | "amber" | "rose">(
    item.source === "cpa_reminders" ? "green" : "amber",
  );

  async function updateStatus(nextStatus: CpaHandoffStatus) {
    if (item.source !== "cpa_reminders") {
      setTone("amber");
      setMessage("Only live CPA reminders can be updated from this page.");
      return;
    }

    setLoadingStatus(nextStatus);
    setTone("amber");
    setMessage(`Updating reminder to ${labelize(nextStatus)}...`);

    try {
      const response = await fetch("/api/admin/financials/cpa-handoff", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          reminderId: item.id,
          status: nextStatus,
          notes: note || item.notes,
        }),
      });

      const json = (await response.json()) as {
        ok: boolean;
        message?: string;
      };

      if (!response.ok || !json.ok) {
        setTone("rose");
        setMessage(json.message || "Unable to update CPA handoff reminder.");
        return;
      }

      setTone("green");
      setMessage(json.message || "CPA handoff reminder updated.");
      setNote("");
      await onUpdated();
    } catch (error) {
      setTone("rose");
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update CPA handoff reminder.",
      );
    } finally {
      setLoadingStatus(null);
    }
  }

  return (
    <div className="mt-5 rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
        Status Actions
      </p>

      <div
        className={`mt-3 rounded-[1rem] border p-3 ${
          tone === "green"
            ? "border-emerald-100 bg-emerald-50"
            : tone === "amber"
              ? "border-amber-100 bg-amber-50"
              : "border-rose-100 bg-rose-50"
        }`}
      >
        <p
          className={`text-xs font-black uppercase tracking-[0.14em] ${
            tone === "green"
              ? "text-emerald-700"
              : tone === "amber"
                ? "text-amber-700"
                : "text-rose-700"
          }`}
        >
          Workflow Update
        </p>
        <p className="mt-1 text-xs font-bold leading-5 text-slate-700">
          {message}
        </p>
      </div>

      {item.source === "cpa_reminders" ? (
        <label className="mt-4 block">
          <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
            Optional Note
          </span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Add a CPA, bookkeeping, tax, or management note..."
            className="mt-2 min-h-[82px] w-full rounded-[1rem] border border-slate-200 bg-white p-3 text-xs font-semibold leading-5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
          />
        </label>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {statusActions.map((action) => (
          <StatusActionButton
            key={action.value}
            item={item}
            action={action}
            loadingStatus={loadingStatus}
            onUpdate={(status) => {
              void updateStatus(status);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ItemCard({
  item,
  onUpdated,
}: {
  item: CpaHandoffItem;
  onUpdated: () => Promise<void>;
}) {
  return (
    <div className="flex min-h-[300px] flex-col justify-between rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-lg">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${statusClasses(
              item.status,
            )}`}
          >
            {item.statusLabel}
          </span>

          <span
            className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${priorityClasses(
              item.priority,
            )}`}
          >
            {item.priority}
          </span>

          <span
            className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${sourceClasses(
              item.source,
            )}`}
          >
            {item.source === "financial_export_history"
              ? "Export"
              : item.source === "cpa_reminders"
                ? "Reminder"
                : "Fallback"}
          </span>
        </div>

        <h3 className="mt-4 text-xl font-black leading-tight text-slate-950">
          {item.title}
        </h3>

        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          {item.description}
        </p>

        <div className="mt-5 grid gap-3 rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4 text-sm font-bold text-slate-600">
          <p className="flex justify-between gap-4">
            <span>Period</span>
            <span className="text-right text-slate-950">
              {item.periodLabel}
            </span>
          </p>

          <p className="flex justify-between gap-4">
            <span>Due Date</span>
            <span className="text-right text-slate-950">
              {item.dueDateLabel}
            </span>
          </p>

          <p className="flex justify-between gap-4">
            <span>Assigned To</span>
            <span className="text-right text-slate-950">
              {item.assignedTo}
            </span>
          </p>

          <p className="flex justify-between gap-4">
            <span>Reminder</span>
            <span className="text-right text-slate-950">
              {item.reminderEnabled ? "Enabled" : "Not enabled"}
            </span>
          </p>
        </div>

        {item.notes ? (
          <div className="mt-4 rounded-[1.25rem] border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
              Notes
            </p>
            <p className="mt-1 text-sm font-bold leading-6 text-slate-700">
              {item.notes}
            </p>
          </div>
        ) : null}

        <CpaStatusActions item={item} onUpdated={onUpdated} />
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <Link
          href={item.href}
          className="group inline-flex items-center gap-3 text-sm font-black text-emerald-800"
        >
          {item.source === "financial_export_history"
            ? "Open Export"
            : "Review Item"}
          <ArrowCircle />
        </Link>
      </div>
    </div>
  );
}

function SourceHealthPanel({ sources }: { sources: SourceHealth[] }) {
  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
          Source Health
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          CPA Handoff Data Sources
        </h2>
        <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
          This page safely checks CPA reminders and financial export history.
          Missing tables will not break the page.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sources.map((source, index) => (
          <div
            key={`${source.table}-${source.message}-${index}`}
            className={`rounded-[1.25rem] border p-4 ${
              source.ok
                ? "border-emerald-100 bg-emerald-50"
                : "border-slate-100 bg-slate-50"
            }`}
          >
            <p
              className={`text-xs font-black uppercase tracking-[0.16em] ${
                source.ok ? "text-emerald-700" : "text-slate-500"
              }`}
            >
              {source.ok ? "Connected" : "Not Connected"}
            </p>
            <h3 className="mt-2 text-lg font-black text-slate-950">
              {source.table}
            </h3>
            <p className="mt-1 text-sm font-bold text-slate-600">
              Rows: {source.rowCount}
            </p>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
              {source.message}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AdminCpaHandoffPage() {
  const [data, setData] = useState<CpaHandoffResponse>(fallbackResponse);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [message, setMessage] = useState("Loading CPA handoff data...");

  async function loadData() {
    setLoading(true);
    setMessage("Loading CPA handoff data...");

    try {
      const response = await fetch("/api/admin/financials/cpa-handoff", {
        cache: "no-store",
      });

      const json = (await response.json()) as CpaHandoffResponse;

      if (!response.ok || !json.ok) {
        setData(fallbackResponse);
        setMessage("Unable to load CPA handoff data. Showing safe fallback.");
        return;
      }

      setData(json);
      setMessage(json.message);
    } catch (error) {
      setData(fallbackResponse);
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load CPA handoff data.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return data.items;

    if (activeFilter === "financial_export_history") {
      return data.items.filter(
        (item) => item.source === "financial_export_history",
      );
    }

    if (
      [
        "not_started",
        "in_progress",
        "needs_review",
        "ready",
        "sent",
        "completed",
        "overdue",
      ].includes(activeFilter)
    ) {
      return data.items.filter((item) => item.status === activeFilter);
    }

    return data.items.filter((item) => item.frequency === activeFilter);
  }, [activeFilter, data.items]);

  return (
    <main className="min-h-screen bg-[#f7fbf8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/admin/financials"
                  className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800 transition hover:bg-emerald-100"
                >
                  ← Financial Overview
                </Link>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${
                    data.isLive
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {data.isLive ? "Live" : "Fallback"}
                </span>

                <span className="text-sm font-bold text-slate-500">
                  {loading
                    ? "Loading..."
                    : `Updated ${formatDateTime(data.generatedAt)}`}
                </span>
              </div>

              <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 lg:text-5xl">
                CPA Handoff Center
              </h1>

              <p className="mt-3 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
                Track monthly, quarterly, annual, and tax CPA handoffs,
                reminders, export readiness, review status, delivery status, and
                management alerts.
              </p>

              <div
                className={`mt-5 rounded-[1.25rem] border p-4 ${
                  data.fallbackUsed
                    ? "border-amber-100 bg-amber-50"
                    : "border-emerald-100 bg-emerald-50"
                }`}
              >
                <p
                  className={`text-xs font-black uppercase tracking-[0.18em] ${
                    data.fallbackUsed ? "text-amber-700" : "text-emerald-700"
                  }`}
                >
                  CPA Handoff Status
                </p>
                <p className="mt-1 text-sm font-bold leading-6 text-slate-700">
                  {message}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={loadData}
                disabled={loading}
                className="rounded-full border border-emerald-100 bg-white px-4 py-2.5 text-xs font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>

              <Link
                href="/admin/financials/exports"
                className="rounded-full bg-emerald-700 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-emerald-800"
              >
                Open Export Center
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            <SummaryCard label="Total" value={data.summary.total} tone="slate" />
            <SummaryCard
              label="Not Started"
              value={data.summary.notStarted}
              tone="slate"
            />
            <SummaryCard
              label="In Progress"
              value={data.summary.inProgress}
              tone="blue"
            />
            <SummaryCard
              label="Needs Review"
              value={data.summary.needsReview}
              tone="amber"
            />
            <SummaryCard label="Ready" value={data.summary.ready} tone="green" />
            <SummaryCard label="Sent" value={data.summary.sent} tone="green" />
            <SummaryCard
              label="Completed"
              value={data.summary.completed}
              tone="green"
            />
            <SummaryCard
              label="Overdue"
              value={data.summary.overdue}
              tone="rose"
            />
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
              Management Alerts
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              CPA Handoff Items Needing Attention
            </h2>
            <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
              Alerts are generated from fallback reminders, live CPA reminders,
              and financial export history.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {data.alerts.map((alert) => (
              <Link
                key={alert.id}
                href={alert.href}
                className={`group rounded-[1.5rem] border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${alertClasses(
                  alert.severity,
                )}`}
              >
                <p className="text-xs font-black uppercase tracking-[0.18em] opacity-80">
                  {alert.severity}
                </p>
                <h3 className="mt-3 text-lg font-black leading-tight">
                  {alert.title}
                </h3>
                <p className="mt-2 text-sm font-bold leading-6 opacity-80">
                  {alert.description}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-current/10 pt-4">
                  <span className="text-sm font-black">Review</span>
                  <ArrowCircle />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
                Handoff Workflow
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                CPA Reminders & Export Readiness
              </h2>
              <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
                Filter by period, status, or export source to review monthly
                close, quarterly CPA review, annual tax work, and saved export
                packages.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveFilter(filter.value)}
                  className={`rounded-full border px-4 py-2 text-xs font-black shadow-sm transition ${
                    activeFilter === filter.value
                      ? "border-emerald-700 bg-emerald-700 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {filteredItems.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item) => (
                <ItemCard
                  key={`${item.source}-${item.id}`}
                  item={item}
                  onUpdated={loadData}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
              <p className="text-sm font-bold text-slate-600">
                No CPA handoff items match this filter.
              </p>
            </div>
          )}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
              Close Checklist
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Monthly CPA Handoff Checklist
            </h2>

            <div className="mt-5 space-y-3">
              {[
                "Review Stripe payments, refunds, fees, disputes, and transfers.",
                "Reconcile Stripe payouts to business banking deposits.",
                "Confirm guru payouts, partner commissions, and payout exceptions.",
                "Review financial export packages and mark ready or sent.",
                "Confirm invoice, purchase order, and tax support exports are saved.",
                "Download or send CPA-ready package after management review.",
              ].map((item, index) => (
                <div
                  key={item}
                  className="flex gap-4 rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm font-bold leading-6 text-slate-700">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-[2rem] border border-emerald-100 bg-emerald-800 p-5 text-white shadow-sm sm:p-6 lg:p-8">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-100">
              Live Reminder Controls
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight">
              CPA reminders are now editable
            </h2>

            <p className="mt-3 text-sm font-semibold leading-7 text-emerald-50">
              Live records from <strong>public.cpa_reminders</strong> can now be
              moved through the full workflow: Not Started, In Progress, Needs
              Review, Ready, Sent, and Completed. Export history records remain
              linked back to the export detail viewer.
            </p>

            <div className="mt-6 grid gap-3">
              <Link
                href="/admin/financials/exports"
                className="rounded-full bg-white px-5 py-3 text-center text-sm font-black text-emerald-800 transition hover:bg-emerald-50"
              >
                Open Export Center →
              </Link>

              <Link
                href="/admin/financials"
                className="rounded-full border border-white/30 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/10"
              >
                Back to Financial Overview →
              </Link>
            </div>
          </aside>
        </section>

        <SourceHealthPanel sources={data.sourceHealth} />
      </div>
    </main>
  );
}