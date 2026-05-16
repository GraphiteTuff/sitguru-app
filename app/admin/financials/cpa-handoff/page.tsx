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

type GrowthFinancialSummaryRow = {
  financial_category: string;
  financial_statement_section: string;
  row_count: number;
  total_amount: number;
  first_activity_date: string | null;
  last_activity_date: string | null;
  source: string;
};

type GrowthCampaignRoiRow = {
  campaign_id: string | null;
  campaign_name: string;
  campaign_slug: string | null;
  channel: string;
  campaign_type: string;
  source: string | null;
  clicks: number;
  leads: number;
  signups: number;
  bookings: number;
  attributed_revenue: number;
  total_cost: number;
  net_growth_return: number;
  roi_percent: number | null;
  signup_conversion_percent: number | null;
  booking_conversion_percent: number | null;
  cost_per_signup: number | null;
  cost_per_booking: number | null;
  growth_signal: string;
  admin_recommendation: string;
  last_event_at: string | null;
  last_cost_date: string | null;
};

type GrowthReferralFinancialsResponse = {
  ok: boolean;
  isLive: boolean;
  generatedAt: string;
  message?: string;
  totals: {
    marketingExpense: number;
    pendingRewardLiability: number;
    issuedReferralRewards: number;
    totalAttributedRevenue: number;
    totalGrowthCost: number;
    netGrowthReturn: number;
    overallRoiPercent: number | null;
    campaignsTracked: number;
    clicks: number;
    leads: number;
    signups: number;
    bookings: number;
  };
  summaryRows: GrowthFinancialSummaryRow[];
  roiRows: GrowthCampaignRoiRow[];
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

const fallbackGrowthReferralFinancials: GrowthReferralFinancialsResponse = {
  ok: true,
  isLive: false,
  generatedAt: new Date().toISOString(),
  message: "Growth, referral, and marketing ROI financial data is loading.",
  totals: {
    marketingExpense: 0,
    pendingRewardLiability: 0,
    issuedReferralRewards: 0,
    totalAttributedRevenue: 0,
    totalGrowthCost: 0,
    netGrowthReturn: 0,
    overallRoiPercent: null,
    campaignsTracked: 0,
    clicks: 0,
    leads: 0,
    signups: 0,
    bookings: 0,
  },
  summaryRows: [],
  roiRows: [],
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

const growthCpaChecklist = [
  "Confirm campaign costs are included as marketing or advertising expenses.",
  "Review issued PawPerks, Guru referral, Ambassador, and Partner rewards as expenses.",
  "Confirm pending referral rewards remain listed as current liabilities until paid, credited, or issued.",
  "Review campaign ROI, cost per signup, cost per booking, and attributed revenue for management notes.",
  "Tie reward payout records to General Ledger, Reconciliation, Payouts, and Commissions support.",
];

function safeNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));
}

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
  value: number | string;
  tone?: "green" | "blue" | "amber" | "rose" | "slate" | "purple";
}) {
  const tones = {
    green: "border-emerald-100 bg-emerald-50 text-emerald-800",
    blue: "border-blue-100 bg-blue-50 text-blue-800",
    amber: "border-amber-100 bg-amber-50 text-amber-800",
    rose: "border-rose-100 bg-rose-50 text-rose-800",
    slate: "border-slate-100 bg-slate-50 text-slate-700",
    purple: "border-purple-100 bg-purple-50 text-purple-800",
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
            placeholder="Add a CPA, bookkeeping, tax, growth, referral, or management note..."
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
          This page safely checks CPA reminders, financial export history, and
          Growth & Referrals financial support. Missing tables will not break
          the page.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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

function GrowthReferralCpaPanel({
  financials,
}: {
  financials: GrowthReferralFinancialsResponse;
}) {
  const totals = financials.totals ?? fallbackGrowthReferralFinancials.totals;
  const summaryRows = Array.isArray(financials.summaryRows)
    ? financials.summaryRows
    : [];
  const roiRows = Array.isArray(financials.roiRows) ? financials.roiRows : [];
  const reviewRows = roiRows.filter((row) =>
    [
      "needs_booking_conversion",
      "needs_signup_conversion",
      "review_spend",
      "needs_more_data",
    ].includes(row.growth_signal),
  );

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
            Growth, Referrals & CPA Support
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Marketing Expense, Reward Liability & Campaign ROI Backup
          </h2>
          <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
            Adds PawPerks, Guru referrals, Ambassador rewards, Partner rewards,
            campaign costs, issued rewards, pending liabilities, campaign ROI,
            cost per signup, and cost per booking into the CPA handoff workflow.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${
              financials.isLive
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            {financials.isLive ? "Live Supabase Views" : "Preview / Offline"}
          </span>

          <Link
            href="/admin/referrals"
            className="rounded-full bg-emerald-700 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-emerald-800"
          >
            Open Growth & Referrals
          </Link>
        </div>
      </div>

      {financials.message ? (
        <div
          className={`mb-5 rounded-[1.25rem] border p-4 ${
            financials.isLive
              ? "border-emerald-100 bg-emerald-50"
              : "border-amber-100 bg-amber-50"
          }`}
        >
          <p
            className={`text-xs font-black uppercase tracking-[0.18em] ${
              financials.isLive ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            Growth Financial Feed
          </p>
          <p className="mt-1 text-sm font-bold leading-6 text-slate-700">
            {financials.message}
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <SummaryCard
          label="Marketing Expense"
          value={formatCurrency(safeNumber(totals.marketingExpense))}
          tone="green"
        />
        <SummaryCard
          label="Reward Liability"
          value={formatCurrency(safeNumber(totals.pendingRewardLiability))}
          tone="amber"
        />
        <SummaryCard
          label="Issued Rewards"
          value={formatCurrency(safeNumber(totals.issuedReferralRewards))}
          tone="blue"
        />
        <SummaryCard
          label="Attributed Revenue"
          value={formatCurrency(safeNumber(totals.totalAttributedRevenue))}
          tone="green"
        />
        <SummaryCard
          label="Growth ROI"
          value={
            totals.overallRoiPercent === null
              ? "Need cost"
              : `${Math.round(safeNumber(totals.overallRoiPercent))}%`
          }
          tone="purple"
        />
        <SummaryCard
          label="Campaigns"
          value={safeNumber(totals.campaignsTracked).toLocaleString()}
          tone="slate"
        />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-[1.5rem] border border-slate-100 bg-[#fbfefd] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            CPA Review Checklist
          </p>
          <div className="mt-4 space-y-3">
            {growthCpaChecklist.map((item, index) => (
              <div
                key={item}
                className="flex gap-4 rounded-[1.25rem] border border-slate-100 bg-white p-4"
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

        <div className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white">
          <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Campaign ROI backup for CPA notes
            </p>
          </div>

          <div className="max-h-[420px] overflow-auto">
            {roiRows.length > 0 ? (
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {[
                      "Campaign",
                      "Funnel",
                      "Revenue",
                      "Cost",
                      "ROI",
                      "CPA Note",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {roiRows.slice(0, 10).map((row) => (
                    <tr
                      key={`${row.campaign_slug || row.campaign_name}-${row.channel}`}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-5 py-4">
                        <p className="font-black text-slate-950">
                          {row.campaign_name}
                        </p>
                        <p className="text-xs font-bold text-slate-500">
                          {row.channel || "unknown"} · {row.growth_signal}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-700">
                        {safeNumber(row.clicks).toLocaleString()} clicks ·{" "}
                        {safeNumber(row.signups).toLocaleString()} signups ·{" "}
                        {safeNumber(row.bookings).toLocaleString()} bookings
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-700">
                        {formatCurrency(safeNumber(row.attributed_revenue))}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-700">
                        {formatCurrency(safeNumber(row.total_cost))}
                      </td>
                      <td className="px-5 py-4 font-black text-emerald-700">
                        {row.roi_percent === null
                          ? "Need cost"
                          : `${Math.round(safeNumber(row.roi_percent))}%`}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold leading-6 text-slate-600">
                        {row.admin_recommendation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-5">
                <p className="text-sm font-bold leading-6 text-slate-600">
                  No campaign ROI rows yet. Add campaign events and costs for
                  QR codes, flyers, paid ads, partner links, Ambassador links,
                  and referral campaigns to populate CPA backup.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[1.5rem] border border-slate-100 bg-[#fbfefd] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Financial category rollup
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {summaryRows.length > 0 ? (
              summaryRows.slice(0, 8).map((row) => (
                <div
                  key={`${row.financial_category}-${row.financial_statement_section}-${row.source}`}
                  className="rounded-[1.25rem] border border-slate-100 bg-white p-4"
                >
                  <p className="text-sm font-black text-slate-950">
                    {row.financial_category}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {row.financial_statement_section}
                  </p>
                  <p className="mt-3 text-xl font-black text-emerald-800">
                    {formatCurrency(safeNumber(row.total_amount))}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {safeNumber(row.row_count).toLocaleString()} row(s)
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[1.25rem] border border-slate-100 bg-white p-4 md:col-span-2">
                <p className="text-sm font-bold text-slate-600">
                  No growth/referral financial category rows yet.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-amber-100 bg-amber-50 p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
            Growth Review Queue
          </p>
          <h3 className="mt-2 text-2xl font-black text-slate-950">
            {reviewRows.length.toLocaleString()} campaign row(s) need review
          </h3>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
            These are campaigns with spend review, signup conversion, booking
            conversion, or incomplete attribution signals that should be noted
            before CPA package delivery.
          </p>

          <div className="mt-4 space-y-3">
            {reviewRows.slice(0, 4).map((row) => (
              <div
                key={`${row.campaign_slug || row.campaign_name}-${row.growth_signal}`}
                className="rounded-[1.25rem] border border-amber-200 bg-white p-4"
              >
                <p className="text-sm font-black text-slate-950">
                  {row.campaign_name}
                </p>
                <p className="mt-1 text-xs font-bold text-amber-800">
                  {row.growth_signal}
                </p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                  {row.admin_recommendation}
                </p>
              </div>
            ))}

            {!reviewRows.length ? (
              <div className="rounded-[1.25rem] border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-sm font-black text-emerald-900">
                  No growth campaign review rows found.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function AdminCpaHandoffPage() {
  const [data, setData] = useState<CpaHandoffResponse>(fallbackResponse);
  const [growthFinancials, setGrowthFinancials] =
    useState<GrowthReferralFinancialsResponse>(fallbackGrowthReferralFinancials);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [message, setMessage] = useState("Loading CPA handoff data...");

  async function loadGrowthReferralFinancials() {
    try {
      const response = await fetch("/api/admin/financials/growth-referrals", {
        cache: "no-store",
      });

      const json = (await response.json()) as GrowthReferralFinancialsResponse;

      if (!response.ok || !json.ok) {
        setGrowthFinancials({
          ...fallbackGrowthReferralFinancials,
          message:
            json.message ||
            "Unable to load Growth & Referrals financial summary.",
        });
        return;
      }

      setGrowthFinancials(json);
    } catch (error) {
      setGrowthFinancials({
        ...fallbackGrowthReferralFinancials,
        message:
          error instanceof Error
            ? error.message
            : "Unable to load Growth & Referrals financial summary.",
      });
    }
  }

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
    void loadGrowthReferralFinancials();
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

  const combinedSourceHealth = useMemo<SourceHealth[]>(() => {
    const growthRows =
      growthFinancials.summaryRows.length + growthFinancials.roiRows.length;

    return [
      ...data.sourceHealth,
      {
        table: "admin_growth_financial_summary",
        ok: growthFinancials.ok,
        rowCount: growthFinancials.summaryRows.length,
        message:
          "Growth/referral financial category rollup for CPA backup.",
      },
      {
        table: "admin_growth_campaign_roi",
        ok: growthFinancials.ok,
        rowCount: growthFinancials.roiRows.length,
        message: "Campaign ROI, funnel, cost, and attribution rows.",
      },
      {
        table: "admin_referral_reward_liability",
        ok: growthFinancials.ok,
        rowCount: growthRows,
        message:
          "Pending and issued reward support for PawPerks, Guru, Ambassador, and Partner referrals.",
      },
    ];
  }, [data.sourceHealth, growthFinancials]);

  const growthAlertCards: CpaHandoffAlert[] = useMemo(() => {
    const cards: CpaHandoffAlert[] = [];

    if (growthFinancials.totals.pendingRewardLiability > 0) {
      cards.push({
        id: "pending-growth-reward-liability",
        title: "Pending referral reward liability",
        description: `${formatCurrency(
          growthFinancials.totals.pendingRewardLiability,
        )} should stay on the Balance Sheet until paid, credited, or issued.`,
        severity: "warning",
        href: "/admin/financials/balance-sheet",
      });
    }

    if (growthFinancials.totals.issuedReferralRewards > 0) {
      cards.push({
        id: "issued-growth-reward-expense",
        title: "Issued referral rewards need expense support",
        description: `${formatCurrency(
          growthFinancials.totals.issuedReferralRewards,
        )} in issued rewards should tie to P&L, Cash Flow, General Ledger, Reconciliation, and Payouts.`,
        severity: "info",
        href: "/admin/financials/profit-loss",
      });
    }

    if (growthFinancials.totals.marketingExpense > 0) {
      cards.push({
        id: "growth-marketing-expense-cpa-review",
        title: "Growth marketing costs included",
        description: `${formatCurrency(
          growthFinancials.totals.marketingExpense,
        )} in campaign and marketing expenses should be reviewed for CPA categorization.`,
        severity: "success",
        href: "/admin/financials/general-ledger",
      });
    }

    return cards;
  }, [growthFinancials]);

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

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${
                    growthFinancials.isLive
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {growthFinancials.isLive ? "Growth Live" : "Growth Preview"}
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
                reminders, export readiness, review status, delivery status,
                management alerts, and Growth & Referrals financial support.
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

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  void loadData();
                  void loadGrowthReferralFinancials();
                }}
                className="rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50"
              >
                Refresh Data
              </button>
              <Link
                href="/admin/financials/exports"
                className="rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800"
              >
                Open Export Center
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
            <SummaryCard label="Total Items" value={data.summary.total} />
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

        <GrowthReferralCpaPanel financials={growthFinancials} />

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
                Management Alerts
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                CPA Handoff Items Needing Attention
              </h2>
              <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
                Alerts now include standard CPA reminders plus Growth &
                Referrals review points for marketing spend, reward expense,
                and pending referral liabilities.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[...data.alerts, ...growthAlertCards].map((alert) => (
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
                close, quarterly CPA review, annual tax work, saved export
                packages, and financial close support.
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
                "Confirm Guru payouts, partner commissions, referral rewards, and payout exceptions.",
                "Review Growth & Referrals: campaign costs, issued rewards, pending reward liability, and ROI notes.",
                "Categorize vendor expenses, software, insurance, marketing, background checks, and banking fees.",
                "Review A/R aging, A/P aging, Balance Sheet accounts, General Ledger detail, and Reconciliation.",
                "Export CPA-ready CSV, Excel, PDF, and ZIP packages with supporting records.",
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

          <aside className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
              CPA Package Links
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
              Fast access to support schedules
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Use these pages to verify numbers before marking the handoff ready
              or sent.
            </p>

            <div className="mt-5 grid gap-3">
              {[
                ["Profit & Loss", "/admin/financials/profit-loss"],
                ["Balance Sheet", "/admin/financials/balance-sheet"],
                ["Cash Flow", "/admin/financials/cash-flow"],
                ["General Ledger", "/admin/financials/general-ledger"],
                ["Reconciliation", "/admin/financials/reconciliation"],
                ["Payouts", "/admin/financials/payouts"],
                ["Commissions", "/admin/financials/commissions"],
                ["Growth & Referrals", "/admin/referrals"],
                ["Export Center", "/admin/financials/exports"],
              ].map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-center justify-between rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4 text-sm font-black text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                >
                  {label}
                  <ArrowCircle />
                </Link>
              ))}
            </div>
          </aside>
        </section>

        <SourceHealthPanel sources={combinedSourceHealth} />
      </div>
    </main>
  );
}
