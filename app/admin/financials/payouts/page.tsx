import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  Filter,
  MoreHorizontal,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type PayoutSource = "Guru" | "Partner" | "Platform" | "Adjustment" | "Refund";
type PayoutStatus = "paid" | "pending" | "review" | "failed" | "scheduled";

type PayoutRow = {
  id: string;
  source: PayoutSource;
  name: string;
  email: string;
  city: string;
  state: string;
  zip: string;
  amount: number;
  status: PayoutStatus;
  payoutDate: string | null;
  reference: string;
  batch: string;
  notes: string;
  isDemo?: boolean;
};

type PayoutSummary = {
  totalScheduled: number;
  totalPaid: number;
  totalPending: number;
  totalReview: number;
  totalFailed: number;
  totalScheduledOnly: number;
  averagePayout: number;
  paidCount: number;
  pendingCount: number;
  reviewCount: number;
  failedCount: number;
  scheduledCount: number;
  totalCount: number;
};

type SourceSummary = {
  source: PayoutSource;
  total: number;
  count: number;
  percent: number;
};

type SearchParamsShape = {
  q?: string;
  status?: string;
  source?: string;
  batch?: string;
  location?: string;
  range?: string;
  sort?: string;
  page?: string;
  focus?: string;
};

type SearchParamsInput = Promise<SearchParamsShape> | SearchParamsShape;

const demoPayoutRows: PayoutRow[] = [
  {
    id: "demo-guru-001",
    source: "Guru",
    name: "Avery Johnson",
    email: "avery.johnson@example.com",
    city: "Philadelphia",
    state: "PA",
    zip: "19103",
    amount: 428.75,
    status: "paid",
    payoutDate: "2026-05-01T10:03:00",
    reference: "tr_87fa29b1e2f9e",
    batch: "May 2026 Batch A",
    notes: "Weekend pet sitting booking",
    isDemo: true,
  },
  {
    id: "demo-guru-002",
    source: "Guru",
    name: "Maya Thompson",
    email: "maya.thompson@example.com",
    city: "Camden",
    state: "NJ",
    zip: "08102",
    amount: 315.5,
    status: "pending",
    payoutDate: "2026-05-03T10:03:00",
    reference: "tr_9c2c6e9f43c2",
    batch: "May 2026 Batch A",
    notes: "Overnight care booking",
    isDemo: true,
  },
  {
    id: "demo-partner-001",
    source: "Partner",
    name: "Happy Paws Rescue",
    email: "payments@happypawsrescue.org",
    city: "Cherry Hill",
    state: "NJ",
    zip: "08002",
    amount: 225,
    status: "paid",
    payoutDate: "2026-04-29T14:15:00",
    reference: "pc_12ab3c4ef567",
    batch: "April 2026 Partner Batch",
    notes: "Referral commission",
    isDemo: true,
  },
  {
    id: "demo-guru-003",
    source: "Guru",
    name: "Jordan Lee",
    email: "jordan.lee@example.com",
    city: "Wilmington",
    state: "DE",
    zip: "19801",
    amount: 182.25,
    status: "review",
    payoutDate: "2026-05-04T10:03:00",
    reference: "tr_79h1jk2111a2",
    batch: "May 2026 Batch B",
    notes: "Manual review required",
    isDemo: true,
  },
  {
    id: "demo-platform-001",
    source: "Platform",
    name: "Stripe Platform Transfer",
    email: "finance@sitguru.com",
    city: "Remote",
    state: "US",
    zip: "00000",
    amount: 76.85,
    status: "failed",
    payoutDate: "2026-05-02T09:59:00",
    reference: "po_4a31ed_8c1",
    batch: "May 2026 Platform Batch",
    notes: "Transfer failed - insufficient balance",
    isDemo: true,
  },
  {
    id: "demo-adjustment-001",
    source: "Adjustment",
    name: "Booking Adjustment",
    email: "accounting@sitguru.com",
    city: "Philadelphia",
    state: "PA",
    zip: "19103",
    amount: 167.2,
    status: "scheduled",
    payoutDate: "2026-05-04T09:00:00",
    reference: "adj_2026_0504",
    batch: "May 2026 Adjustments",
    notes: "Scheduled correction for payout batch",
    isDemo: true,
  },
  {
    id: "demo-refund-001",
    source: "Refund",
    name: "Customer Refund Reserve",
    email: "refunds@sitguru.com",
    city: "Philadelphia",
    state: "PA",
    zip: "19103",
    amount: 124,
    status: "scheduled",
    payoutDate: "2026-05-05T09:00:00",
    reference: "rf_2026_0505",
    batch: "May 2026 Refund Reserve",
    notes: "Refund reserve allocation",
    isDemo: true,
  },
  {
    id: "demo-guru-004",
    source: "Guru",
    name: "Sofia Martin",
    email: "sofia.martin@example.com",
    city: "Newark",
    state: "NJ",
    zip: "07102",
    amount: 368.9,
    status: "paid",
    payoutDate: "2026-05-02T09:15:00",
    reference: "tr_77hd22bb89f1",
    batch: "May 2026 Batch A",
    notes: "Recurring pet sitting payout",
    isDemo: true,
  },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function normalizeAmount(value: unknown) {
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? 0 : numberValue;
}

function normalizeStatus(value: unknown): PayoutStatus {
  const status = String(value || "pending").toLowerCase();

  if (
    status.includes("paid") ||
    status.includes("complete") ||
    status.includes("completed") ||
    status.includes("sent") ||
    status.includes("succeeded")
  ) {
    return "paid";
  }

  if (
    status.includes("fail") ||
    status.includes("error") ||
    status.includes("exception") ||
    status.includes("declined")
  ) {
    return "failed";
  }

  if (
    status.includes("review") ||
    status.includes("hold") ||
    status.includes("manual")
  ) {
    return "review";
  }

  if (status.includes("schedule")) return "scheduled";

  return "pending";
}

function normalizeSource(value: unknown): PayoutSource {
  const source = String(value || "").toLowerCase();

  if (
    source.includes("partner") ||
    source.includes("affiliate") ||
    source.includes("ambassador")
  ) {
    return "Partner";
  }

  if (source.includes("platform")) return "Platform";
  if (source.includes("adjust")) return "Adjustment";
  if (source.includes("refund")) return "Refund";

  return "Guru";
}

function getStatusLabel(status: PayoutStatus) {
  if (status === "paid") return "Paid";
  if (status === "pending") return "Pending";
  if (status === "review") return "Review";
  if (status === "failed") return "Failed";
  return "Scheduled";
}

function getStatusBadgeStyles(status: PayoutStatus) {
  if (status === "paid") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "pending") return "border-blue-200 bg-blue-50 text-blue-800";
  if (status === "review") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "failed") return "border-red-200 bg-red-50 text-red-800";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function getSourceBadgeStyles(source: PayoutSource) {
  if (source === "Guru") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (source === "Partner") return "border-violet-200 bg-violet-50 text-violet-800";
  if (source === "Platform") return "border-slate-200 bg-slate-100 text-slate-700";
  if (source === "Adjustment") return "border-indigo-200 bg-indigo-50 text-indigo-800";
  return "border-rose-200 bg-rose-50 text-rose-800";
}

function getPercent(value: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.max(0, Math.round((value / total) * 100)));
}

async function safeSelect<T>(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
  query = "*",
) {
  try {
    const { data, error } = await supabase.from(table).select(query).limit(250);
    if (error || !data) return [] as T[];
    return data as T[];
  } catch {
    return [] as T[];
  }
}

function buildGuruPayoutRows(rows: any[]): PayoutRow[] {
  return rows.map((row, index) => ({
    id: String(row.id || row.payout_id || `guru-${index}`),
    source: "Guru",
    name:
      row.guru_name ||
      row.full_name ||
      row.name ||
      row.guru?.full_name ||
      row.guru?.name ||
      "Guru payout",
    email: row.email || row.guru_email || row.guru?.email || "No email on file",
    city: row.city || row.guru_city || row.guru?.city || "Unknown",
    state: row.state || row.guru_state || row.guru?.state || "",
    zip: row.zip || row.zip_code || row.guru?.zip || "",
    amount: normalizeAmount(
      row.amount || row.payout_amount || row.net_amount || row.total_amount,
    ),
    status: normalizeStatus(row.status || row.payout_status),
    payoutDate:
      row.payout_date || row.scheduled_for || row.created_at || row.updated_at || null,
    reference:
      row.transaction_reference ||
      row.stripe_transfer_id ||
      row.reference ||
      row.id ||
      "No reference",
    batch: row.batch_name || row.batch || row.payout_batch || "Unbatched",
    notes: row.notes || row.memo || "Guru sitting payout",
  }));
}

function buildPartnerPayoutRows(rows: any[]): PayoutRow[] {
  return rows.map((row, index) => ({
    id: String(row.id || row.payout_id || `partner-${index}`),
    source: "Partner",
    name:
      row.partner_name ||
      row.company_name ||
      row.name ||
      row.partner?.company_name ||
      row.partner?.name ||
      "Partner payout",
    email: row.email || row.partner_email || row.partner?.email || "No email on file",
    city: row.city || row.partner_city || row.partner?.city || "Unknown",
    state: row.state || row.partner_state || row.partner?.state || "",
    zip: row.zip || row.zip_code || row.partner?.zip || "",
    amount: normalizeAmount(
      row.amount || row.commission_amount || row.payout_amount || row.total_amount,
    ),
    status: normalizeStatus(row.status || row.payout_status),
    payoutDate:
      row.payout_date || row.scheduled_for || row.created_at || row.updated_at || null,
    reference:
      row.transaction_reference ||
      row.stripe_transfer_id ||
      row.reference ||
      row.id ||
      "No reference",
    batch: row.batch_name || row.batch || row.payout_batch || "Unbatched",
    notes: row.notes || row.memo || "Partner commission payout",
  }));
}

function buildGenericPayoutRows(rows: any[]): PayoutRow[] {
  return rows.map((row, index) => ({
    id: String(row.id || row.payout_id || `generic-${index}`),
    source: normalizeSource(row.source || row.type || row.category || "Platform"),
    name:
      row.recipient_name ||
      row.name ||
      row.account_name ||
      row.full_name ||
      "Payout record",
    email: row.email || row.recipient_email || "No email on file",
    city: row.city || row.location_city || "Remote",
    state: row.state || row.location_state || "US",
    zip: row.zip || row.zip_code || "",
    amount: normalizeAmount(
      row.amount ||
        row.payout_amount ||
        row.total_amount ||
        row.commission_amount ||
        row.net_amount,
    ),
    status: normalizeStatus(row.status || row.payout_status),
    payoutDate:
      row.payout_date || row.scheduled_for || row.created_at || row.updated_at || null,
    reference:
      row.transaction_reference ||
      row.stripe_transfer_id ||
      row.reference ||
      row.id ||
      "No reference",
    batch: row.batch_name || row.batch || row.payout_batch || "Unbatched",
    notes: row.notes || row.memo || "Platform payout",
  }));
}

function dedupeRows(rows: PayoutRow[]) {
  const map = new Map<string, PayoutRow>();

  for (const row of rows) {
    const key = `${row.source}-${row.id}`;
    if (!map.has(key)) map.set(key, row);
  }

  return Array.from(map.values());
}

async function getPayoutRows() {
  const supabase = await createClient();

  const guruRows = buildGuruPayoutRows(await safeSelect<any>(supabase, "guru_payouts"));
  const partnerRows = buildPartnerPayoutRows(
    await safeSelect<any>(supabase, "partner_payouts"),
  );
  const payoutsRows = buildGenericPayoutRows(await safeSelect<any>(supabase, "payouts"));
  const financialPayoutRows = buildGenericPayoutRows(
    await safeSelect<any>(supabase, "financial_payouts"),
  );
  const adminPayoutRows = buildGenericPayoutRows(
    await safeSelect<any>(supabase, "admin_payouts"),
  );

  const merged = dedupeRows([
    ...guruRows,
    ...partnerRows,
    ...payoutsRows,
    ...financialPayoutRows,
    ...adminPayoutRows,
  ]);

  return merged.length ? merged : demoPayoutRows;
}

function buildSummary(rows: PayoutRow[]): PayoutSummary {
  const base = rows.reduce(
    (summary, row) => {
      summary.totalScheduled += row.amount;
      summary.totalCount += 1;

      if (row.status === "paid") {
        summary.totalPaid += row.amount;
        summary.paidCount += 1;
      }

      if (row.status === "pending") {
        summary.totalPending += row.amount;
        summary.pendingCount += 1;
      }

      if (row.status === "review") {
        summary.totalReview += row.amount;
        summary.reviewCount += 1;
      }

      if (row.status === "failed") {
        summary.totalFailed += row.amount;
        summary.failedCount += 1;
      }

      if (row.status === "scheduled") {
        summary.totalScheduledOnly += row.amount;
        summary.scheduledCount += 1;
      }

      return summary;
    },
    {
      totalScheduled: 0,
      totalPaid: 0,
      totalPending: 0,
      totalReview: 0,
      totalFailed: 0,
      totalScheduledOnly: 0,
      averagePayout: 0,
      paidCount: 0,
      pendingCount: 0,
      reviewCount: 0,
      failedCount: 0,
      scheduledCount: 0,
      totalCount: 0,
    },
  );

  return {
    ...base,
    averagePayout: base.totalCount ? base.totalScheduled / base.totalCount : 0,
  };
}

function buildSourceSummaries(rows: PayoutRow[]): SourceSummary[] {
  const sourceOrder: PayoutSource[] = [
    "Guru",
    "Partner",
    "Platform",
    "Adjustment",
    "Refund",
  ];
  const grandTotal = rows.reduce((sum, row) => sum + row.amount, 0);

  return sourceOrder.map((source) => {
    const matchingRows = rows.filter((row) => row.source === source);
    const total = matchingRows.reduce((sum, row) => sum + row.amount, 0);

    return {
      source,
      total,
      count: matchingRows.length,
      percent: getPercent(total, grandTotal),
    };
  });
}

function filterRows(rows: PayoutRow[], params: SearchParamsShape) {
  const q = String(params?.q || "").toLowerCase().trim();
  const status = String(params?.status || "all").toLowerCase();
  const source = String(params?.source || "all").toLowerCase();
  const batch = String(params?.batch || "all").toLowerCase();
  const location = String(params?.location || "all").toLowerCase();

  return rows.filter((row) => {
    const searchable = [
      row.name,
      row.email,
      row.source,
      row.status,
      row.city,
      row.state,
      row.zip,
      row.reference,
      row.batch,
      row.notes,
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = q ? searchable.includes(q) : true;
    const matchesStatus = status === "all" ? true : row.status === status;
    const matchesSource = source === "all" ? true : row.source.toLowerCase() === source;
    const matchesBatch = batch === "all" ? true : row.batch.toLowerCase() === batch;
    const rowLocation = `${row.city}, ${row.state}`.toLowerCase();
    const matchesLocation = location === "all" ? true : rowLocation === location;

    return matchesSearch && matchesStatus && matchesSource && matchesBatch && matchesLocation;
  });
}

function sortRows(rows: PayoutRow[], sort: string | undefined) {
  const sorted = [...rows];

  if (sort === "amount_high") return sorted.sort((a, b) => b.amount - a.amount);
  if (sort === "amount_low") return sorted.sort((a, b) => a.amount - b.amount);

  if (sort === "oldest") {
    return sorted.sort((a, b) => {
      const aDate = a.payoutDate ? new Date(a.payoutDate).getTime() : 0;
      const bDate = b.payoutDate ? new Date(b.payoutDate).getTime() : 0;
      return aDate - bDate;
    });
  }

  return sorted.sort((a, b) => {
    const aDate = a.payoutDate ? new Date(a.payoutDate).getTime() : 0;
    const bDate = b.payoutDate ? new Date(b.payoutDate).getTime() : 0;
    return bDate - aDate;
  });
}

function uniqueValues(rows: PayoutRow[], key: "batch" | "location") {
  if (key === "location") {
    return Array.from(
      new Set(rows.map((row) => `${row.city}, ${row.state}`).filter(Boolean)),
    );
  }

  return Array.from(new Set(rows.map((row) => row.batch).filter(Boolean)));
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "SG";
}

function getRecipientTone(source: PayoutSource) {
  if (source === "Guru") return "bg-emerald-50 text-emerald-700";
  if (source === "Partner") return "bg-violet-50 text-violet-700";
  if (source === "Platform") return "bg-slate-100 text-slate-700";
  if (source === "Adjustment") return "bg-indigo-50 text-indigo-700";
  return "bg-rose-50 text-rose-700";
}

function KpiCard({
  label,
  value,
  trend,
  icon,
  iconWrapClassName,
}: {
  label: string;
  value: string;
  trend: string;
  icon: ReactNode;
  iconWrapClassName: string;
}) {
  const trendUp = !trend.trim().startsWith("↘") && !trend.trim().startsWith("↓");

  return (
    <div className="rounded-[1.35rem] border border-[#e6eee2] bg-white px-5 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-1 text-[2rem] font-black leading-none tracking-tight text-[#111b33]">
            {value}
          </p>
          <p
            className={`mt-3 flex items-center gap-1.5 text-xs font-bold ${
              trendUp ? "text-[#118a43]" : "text-[#e04848]"
            }`}
          >
            <span>{trendUp ? "↗" : "↘"}</span>
            {trend.replace(/^↗\s*|^↘\s*|^↑\s*|^↓\s*/, "")}
          </p>
        </div>

        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${iconWrapClassName}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function SourceBar({ item }: { item: SourceSummary }) {
  const barColor =
    item.source === "Guru"
      ? "bg-[#118a43]"
      : item.source === "Partner"
        ? "bg-violet-500"
        : item.source === "Platform"
          ? "bg-slate-400"
          : item.source === "Adjustment"
            ? "bg-indigo-500"
            : "bg-rose-400";

  const iconTone =
    item.source === "Guru"
      ? "bg-emerald-50 text-emerald-700"
      : item.source === "Partner"
        ? "bg-violet-50 text-violet-700"
        : item.source === "Platform"
          ? "bg-slate-100 text-slate-700"
          : item.source === "Adjustment"
            ? "bg-indigo-50 text-indigo-700"
            : "bg-rose-50 text-rose-700";

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconTone}`}
          >
            {item.source === "Guru" && <Users className="h-4 w-4" />}
            {item.source === "Partner" && <Wallet className="h-4 w-4" />}
            {item.source === "Platform" && <CalendarDays className="h-4 w-4" />}
            {item.source === "Adjustment" && <RefreshCw className="h-4 w-4" />}
            {item.source === "Refund" && <AlertTriangle className="h-4 w-4" />}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-black text-[#111b33]">
              {item.source === "Guru"
                ? "Guru Payouts"
                : item.source === "Partner"
                  ? "Partner Commissions"
                  : item.source === "Platform"
                    ? "Platform Payouts"
                    : item.source === "Adjustment"
                      ? "Adjustments"
                      : "Refunds"}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm font-black text-[#111b33]">{formatCurrency(item.total)}</p>
          <p className="text-xs font-semibold text-slate-500">{item.percent}%</p>
        </div>
      </div>

      <div className="h-2.5 rounded-full bg-slate-100">
        <div
          className={`h-2.5 rounded-full ${barColor}`}
          style={{ width: `${item.percent}%` }}
        />
      </div>
    </div>
  );
}

function TableActionButton({
  children,
  href,
}: {
  children: ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-xl border border-[#e6eee2] bg-white px-3 py-2 text-xs font-black text-[#111b33] transition hover:border-[#cfe0c7] hover:bg-[#f7fbf5]"
    >
      {children}
    </Link>
  );
}

function PreservedFilterInputs({
  params,
  omit = [],
}: {
  params: SearchParamsShape;
  omit?: string[];
}) {
  const entries: Array<[string, string]> = [
    ["q", params.q || ""],
    ["status", params.status || "all"],
    ["source", params.source || "all"],
    ["batch", params.batch || "all"],
    ["location", params.location || "all"],
    ["range", params.range || "last_7_days"],
    ["sort", params.sort || "newest"],
    ["focus", params.focus || ""],
  ];

  return (
    <>
      {entries
        .filter(([name]) => !omit.includes(name))
        .map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
    </>
  );
}

export default async function PayoutsAnalyticsPage({
  searchParams,
}: {
  searchParams?: SearchParamsInput;
}) {
  const params = ((await searchParams) || {}) as SearchParamsShape;
  const rows = await getPayoutRows();

  const filteredRows = filterRows(rows, params);
  const visibleRows = sortRows(filteredRows, params?.sort);
  const summary = buildSummary(visibleRows);
  const sourceSummaries = buildSourceSummaries(visibleRows);

  const batchOptions = uniqueValues(rows, "batch");
  const locationOptions = uniqueValues(rows, "location");

  const totalForStatus = summary.totalScheduled || 1;
  const paidPercent = getPercent(summary.totalPaid, totalForStatus);
  const pendingPercent = getPercent(summary.totalPending, totalForStatus);
  const reviewPercent = getPercent(summary.totalReview, totalForStatus);
  const failedPercent = getPercent(summary.totalFailed, totalForStatus);
  const scheduledPercent = getPercent(summary.totalScheduledOnly, totalForStatus);

  const paidDegrees = Math.round((paidPercent / 100) * 360);
  const pendingDegrees = paidDegrees + Math.round((pendingPercent / 100) * 360);
  const reviewDegrees = pendingDegrees + Math.round((reviewPercent / 100) * 360);
  const failedDegrees = reviewDegrees + Math.round((failedPercent / 100) * 360);

  const donutStyle: CSSProperties = {
    background: `conic-gradient(
      #118a43 0deg ${paidDegrees}deg,
      #3b82f6 ${paidDegrees}deg ${pendingDegrees}deg,
      #f59e0b ${pendingDegrees}deg ${reviewDegrees}deg,
      #ef4444 ${reviewDegrees}deg ${failedDegrees}deg,
      #cbd5e1 ${failedDegrees}deg 360deg
    )`,
  };

  const chartSeriesCurrent = [420, 265, 310, 284, 346, 298, 389, 455];
  const chartSeriesPrevious = [350, 245, 160, 240, 185, 225, 260, 315];
  const chartLabels = [
    "Apr 25",
    "Apr 26",
    "Apr 27",
    "Apr 28",
    "Apr 29",
    "Apr 30",
    "May 1",
    "May 2",
  ];

  const pointsCurrent = chartSeriesCurrent
    .map((value, index) => {
      const x = 40 + index * 88;
      const y = 190 - (value / 520) * 140;
      return `${x},${y}`;
    })
    .join(" ");

  const pointsPrevious = chartSeriesPrevious
    .map((value, index) => {
      const x = 40 + index * 88;
      const y = 190 - (value / 520) * 140;
      return `${x},${y}`;
    })
    .join(" ");

  const currentPage = Math.max(1, Number(params?.page || "1") || 1);
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedRows = visibleRows.slice(startIndex, startIndex + pageSize);

  const successRate = summary.totalCount
    ? ((summary.paidCount / summary.totalCount) * 100).toFixed(1)
    : "0.0";

  const onTimeRate = summary.totalCount
    ? (((summary.paidCount + summary.scheduledCount) / summary.totalCount) * 100).toFixed(1)
    : "0.0";

  const totalPartnersPaid = visibleRows.filter((row) => row.source === "Partner").length;

  const buildHref = (overrides: Partial<SearchParamsShape> = {}) => {
    const next: SearchParamsShape = {
      q: params.q || "",
      status: params.status || "all",
      source: params.source || "all",
      batch: params.batch || "all",
      location: params.location || "all",
      range: params.range || "last_7_days",
      sort: params.sort || "newest",
      page: params.page || "1",
      focus: params.focus || "",
      ...overrides,
    };

    const search = new URLSearchParams();

    Object.entries(next).forEach(([key, value]) => {
      if (value && String(value).length > 0) {
        search.set(key, String(value));
      }
    });

    return `/admin/financials/payouts?${search.toString()}`;
  };

  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-6 px-4 pb-10 sm:px-6 xl:px-8 2xl:px-0">
      <section className="rounded-[1.75rem] border border-[#e6eee2] bg-white px-5 py-6 shadow-sm sm:px-6 lg:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
              <Link href="/admin" className="transition hover:text-[#118a43]">
                Admin
              </Link>
              <span>›</span>
              <Link href="/admin/financials" className="transition hover:text-[#118a43]">
                Financials
              </Link>
              <span>›</span>
              <span className="text-[#111b33]">Additional Payout Analytics</span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-[#111b33] sm:text-4xl">
                Additional Payout Data Analytics
              </h1>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-[#118a43]">
                <span className="h-2 w-2 rounded-full bg-[#118a43]" />
                Analytics view
              </span>
            </div>

            <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500 sm:text-base">
              Drill into payout performance, trends, partner activity, batches, exceptions,
              sources, and accounting-ready payout reporting.
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Link
              href="/admin/payout"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#118a43] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0b6d33]"
            >
              Main Payout Landing
              <BarChart3 className="h-4 w-4" />
            </Link>

            <div className="rounded-2xl border border-[#e6eee2] bg-[#fbfdfb] px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-black text-[#111b33]">
                <CalendarDays className="h-4 w-4 text-[#118a43]" />
                Apr 25 – May 2, 2026
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                vs Apr 18 – Apr 24, 2026
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-[#e6eee2] bg-white p-5 shadow-sm sm:p-6">
        <form action="/admin/financials/payouts" className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-[#118a43]">
                <Filter className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#118a43] sm:text-xl">
                  Organize Payout Data
                </h2>
                <p className="text-sm font-medium text-slate-500">
                  Search by recipient, source, batch, location, or payout status.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#118a43] px-4 py-3 text-sm font-black text-white transition hover:bg-[#0b6d33]"
              >
                <Filter className="h-4 w-4" />
                Apply
              </button>

              <Link
                href="/admin/financials/payouts"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#dbe8d5] bg-white px-4 py-3 text-sm font-black text-[#118a43] transition hover:bg-[#f7fbf5]"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </Link>

              <Link
                href="/api/admin/financials/payouts/export"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#dbe8d5] bg-[#f7fbf5] px-4 py-3 text-sm font-black text-[#118a43] transition hover:bg-[#eef7ea]"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Link>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-[1.4fr_repeat(5,minmax(0,1fr))]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={params?.q || ""}
                placeholder="Search by name, email, source, city, ZIP..."
                className="h-12 w-full rounded-2xl border border-[#e6eee2] bg-white pl-11 pr-4 text-sm font-semibold text-[#111b33] outline-none transition placeholder:text-slate-400 focus:border-[#b9d1b1] focus:ring-4 focus:ring-emerald-50"
              />
            </label>

            <select
              name="status"
              defaultValue={params?.status || "all"}
              className="h-12 w-full rounded-2xl border border-[#e6eee2] bg-white px-4 text-sm font-semibold text-[#111b33] outline-none transition focus:border-[#b9d1b1] focus:ring-4 focus:ring-emerald-50"
            >
              <option value="all">Status: All</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="review">Needs Review</option>
              <option value="failed">Failed / Exceptions</option>
              <option value="scheduled">Scheduled</option>
            </select>

            <select
              name="source"
              defaultValue={params?.source || "all"}
              className="h-12 w-full rounded-2xl border border-[#e6eee2] bg-white px-4 text-sm font-semibold text-[#111b33] outline-none transition focus:border-[#b9d1b1] focus:ring-4 focus:ring-emerald-50"
            >
              <option value="all">Source: All</option>
              <option value="guru">Guru</option>
              <option value="partner">Partner</option>
              <option value="platform">Platform</option>
              <option value="adjustment">Adjustment</option>
              <option value="refund">Refund</option>
            </select>

            <select
              name="batch"
              defaultValue={params?.batch || "all"}
              className="h-12 w-full rounded-2xl border border-[#e6eee2] bg-white px-4 text-sm font-semibold text-[#111b33] outline-none transition focus:border-[#b9d1b1] focus:ring-4 focus:ring-emerald-50"
            >
              <option value="all">Batch: All</option>
              {batchOptions.map((batch) => (
                <option key={batch} value={batch.toLowerCase()}>
                  {batch}
                </option>
              ))}
            </select>

            <select
              name="location"
              defaultValue={params?.location || "all"}
              className="h-12 w-full rounded-2xl border border-[#e6eee2] bg-white px-4 text-sm font-semibold text-[#111b33] outline-none transition focus:border-[#b9d1b1] focus:ring-4 focus:ring-emerald-50"
            >
              <option value="all">Location: All</option>
              {locationOptions.map((location) => (
                <option key={location} value={location.toLowerCase()}>
                  {location}
                </option>
              ))}
            </select>

            <select
              name="range"
              defaultValue={params?.range || "last_7_days"}
              className="h-12 w-full rounded-2xl border border-[#e6eee2] bg-white px-4 text-sm font-semibold text-[#111b33] outline-none transition focus:border-[#b9d1b1] focus:ring-4 focus:ring-emerald-50"
            >
              <option value="last_7_days">Apr 25 – May 2, 2026</option>
              <option value="last_30_days">Last 30 days</option>
              <option value="this_month">This month</option>
              <option value="custom">Custom range</option>
            </select>
          </div>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard
          label="Total Scheduled"
          value={formatCurrency(summary.totalScheduled)}
          trend="↗ 18.6% vs Apr 18 – Apr 24"
          icon={<CalendarDays className="h-6 w-6" />}
          iconWrapClassName="bg-emerald-50 text-[#118a43]"
        />
        <KpiCard
          label="Total Paid"
          value={formatCurrency(summary.totalPaid)}
          trend="↗ 21.3% vs Apr 18 – Apr 24"
          icon={<CheckCircle2 className="h-6 w-6" />}
          iconWrapClassName="bg-emerald-50 text-[#118a43]"
        />
        <KpiCard
          label="Pending"
          value={formatCurrency(summary.totalPending)}
          trend="↗ 8.4% vs Apr 18 – Apr 24"
          icon={<Clock3 className="h-6 w-6" />}
          iconWrapClassName="bg-blue-50 text-blue-600"
        />
        <KpiCard
          label="Needs Review"
          value={formatCurrency(summary.totalReview)}
          trend="↗ 12.7% vs Apr 18 – Apr 24"
          icon={<Eye className="h-6 w-6" />}
          iconWrapClassName="bg-amber-50 text-amber-600"
        />
        <KpiCard
          label="Failed / Exceptions"
          value={formatCurrency(summary.totalFailed)}
          trend="↘ 4.7% vs Apr 18 – Apr 24"
          icon={<AlertTriangle className="h-6 w-6" />}
          iconWrapClassName="bg-red-50 text-red-500"
        />
        <KpiCard
          label="Avg Payout"
          value={formatCurrency(summary.averagePayout)}
          trend="↗ 14.2% vs Apr 18 – Apr 24"
          icon={<TrendingUp className="h-6 w-6" />}
          iconWrapClassName="bg-emerald-50 text-[#118a43]"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-12">
        <div className="rounded-[1.5rem] border border-[#e6eee2] bg-white p-5 shadow-sm xl:col-span-4">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-black text-[#111b33]">Payouts by Status</h2>
            <Link
              href={buildHref({ page: "1" })}
              className="text-xs font-black text-[#118a43] transition hover:text-[#0b6d33]"
            >
              View details
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-[220px_1fr] xl:grid-cols-1">
            <div
              className="mx-auto grid h-56 w-56 place-items-center rounded-full p-8"
              style={donutStyle}
            >
              <div className="grid h-full w-full place-items-center rounded-full bg-white text-center shadow-sm">
                <div>
                  <p className="text-xs font-bold text-slate-500">Total</p>
                  <p className="text-xl font-black text-[#111b33]">
                    {formatCurrency(summary.totalScheduled)}
                  </p>
                  <p className="text-xs font-bold text-slate-500">100%</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              {[
                ["Paid", summary.totalPaid, paidPercent, "bg-[#118a43]"],
                ["Pending", summary.totalPending, pendingPercent, "bg-blue-500"],
                ["Needs Review", summary.totalReview, reviewPercent, "bg-amber-500"],
                ["Failed / Exceptions", summary.totalFailed, failedPercent, "bg-red-500"],
                ["Scheduled", summary.totalScheduledOnly, scheduledPercent, "bg-slate-400"],
              ].map(([label, value, percent, color]) => (
                <div key={String(label)} className="flex items-start gap-3">
                  <span className={`mt-1 h-2.5 w-2.5 rounded-full ${color}`} />
                  <div>
                    <p className="font-black text-[#111b33]">{label}</p>
                    <p className="font-semibold text-slate-500">
                      {formatCurrency(Number(value))} ({percent}%)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-[#e6eee2] bg-white p-5 shadow-sm xl:col-span-4">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-black text-[#111b33]">
              Payout Volume Over Time
            </h2>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-6 rounded-full bg-[#118a43]" />
                Apr 25 – May 2, 2026
              </span>
              <span className="hidden items-center gap-2 sm:flex">
                <span className="h-1.5 w-6 rounded-full bg-slate-300" />
                Apr 18 – Apr 24, 2026
              </span>
            </div>
          </div>

          <div className="relative h-[260px] overflow-hidden rounded-2xl bg-gradient-to-b from-white to-[#f8fbf6] p-4">
            <svg viewBox="0 0 720 230" className="h-full w-full">
              <line x1="40" y1="30" x2="40" y2="190" stroke="#e5e7eb" />
              <line x1="40" y1="190" x2="700" y2="190" stroke="#e5e7eb" />
              <line x1="40" y1="150" x2="700" y2="150" stroke="#edf2e7" />
              <line x1="40" y1="110" x2="700" y2="110" stroke="#edf2e7" />
              <line x1="40" y1="70" x2="700" y2="70" stroke="#edf2e7" />

              <polyline
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="4"
                strokeDasharray="8 8"
                points={pointsPrevious}
              />

              <polyline
                fill="none"
                stroke="#118a43"
                strokeWidth="5"
                points={pointsCurrent}
              />

              {chartSeriesCurrent.map((value, index) => {
                const x = 40 + index * 88;
                const y = 190 - (value / 520) * 140;

                return (
                  <circle
                    key={`${x}-${y}`}
                    cx={x}
                    cy={y}
                    r="6"
                    fill="#118a43"
                    stroke="white"
                    strokeWidth="4"
                  />
                );
              })}

              <rect x="282" y="48" width="118" height="58" rx="14" fill="white" stroke="#e5e7eb" />
              <text x="300" y="70" fill="#111b33" fontSize="13" fontWeight="700">
                Apr 28, 2026
              </text>
              <text x="304" y="93" fill="#118a43" fontSize="18" fontWeight="900">
                $312.60
              </text>

              {chartLabels.map((label, index) => (
                <text
                  key={label}
                  x={30 + index * 88}
                  y="220"
                  fill="#64748b"
                  fontSize="12"
                  fontWeight="700"
                >
                  {label}
                </text>
              ))}
            </svg>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-[#e6eee2] bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-black text-[#111b33]">Payouts by Source</h2>
            <Link
              href={buildHref({ page: "1" })}
              className="text-xs font-black text-[#118a43] transition hover:text-[#0b6d33]"
            >
              View all
            </Link>
          </div>

          <div className="space-y-5">
            {sourceSummaries.map((item) => (
              <SourceBar key={item.source} item={item} />
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-[#e6eee2] bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="text-lg font-black text-[#111b33]">Quick Actions & Alerts</h2>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-black text-amber-900">High Review Queue</p>
              <p className="mt-1 text-xs font-semibold text-amber-800">
                {summary.reviewCount} payouts need your attention
              </p>
            </div>

            <div className="rounded-2xl border border-[#e6eee2] bg-[#f7fbf5] p-4">
              <p className="text-sm font-black text-[#111b33]">Batch Processing</p>
              <p className="mt-1 text-xs font-semibold text-slate-600">
                Batch #P-2026-104 is in progress
              </p>
            </div>

            <div className="rounded-2xl border border-[#e6eee2] bg-[#f7fbf5] p-4">
              <p className="text-sm font-black text-[#111b33]">Upcoming Payouts</p>
              <p className="mt-1 text-xs font-semibold text-slate-600">
                {summary.pendingCount + summary.scheduledCount} payouts scheduled soon
              </p>
            </div>

            <Link
              href="/admin/payout"
              className="flex items-center justify-center rounded-2xl bg-[#118a43] px-4 py-3 text-sm font-black text-white transition hover:bg-[#0b6d33]"
            >
              Back to Main Payout Landing →
            </Link>
          </div>
        </div>
      </section>

      <section
        id="payout-records"
        className="overflow-hidden rounded-[1.5rem] border border-[#e6eee2] bg-white shadow-sm"
      >
        <div className="flex flex-col gap-4 border-b border-[#edf2e7] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-black text-[#111b33]">Payout Records</h2>
              <span className="text-sm font-black text-[#118a43]">
                {visibleRows.length} records
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Accounting-ready payout records with filters, references, notes, and actions.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <form action="/admin/financials/payouts" className="flex flex-col gap-2 sm:flex-row">
              <PreservedFilterInputs params={params} omit={["q", "page", "focus"]} />
              <input
                type="text"
                name="q"
                defaultValue={params?.q || ""}
                placeholder="Search payouts..."
                className="h-11 rounded-2xl border border-[#e6eee2] bg-white px-4 text-sm font-semibold text-[#111b33] outline-none transition placeholder:text-slate-400 focus:border-[#b9d1b1] focus:ring-4 focus:ring-emerald-50"
              />
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#dbe8d5] bg-[#f7fbf5] px-4 text-sm font-black text-[#118a43] transition hover:bg-[#eef7ea]"
              >
                <Search className="h-4 w-4" />
                Search
              </button>
            </form>

            <form action="/admin/financials/payouts" className="flex items-center gap-2">
              <PreservedFilterInputs params={params} omit={["sort", "page", "focus"]} />
              <select
                name="sort"
                defaultValue={params?.sort || "newest"}
                className="h-11 rounded-2xl border border-[#e6eee2] bg-white px-4 text-sm font-semibold text-[#111b33] outline-none transition focus:border-[#b9d1b1] focus:ring-4 focus:ring-emerald-50"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount_high">Amount: High to Low</option>
                <option value="amount_low">Amount: Low to High</option>
              </select>
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#dbe8d5] bg-white px-4 text-sm font-black text-[#111b33] transition hover:bg-[#f7fbf5]"
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
            </form>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1180px] w-full">
            <thead className="bg-[#fbfdfb]">
              <tr className="border-b border-[#edf2e7] text-left">
                {[
                  "Recipient",
                  "Source",
                  "Amount",
                  "Status",
                  "Payout Date",
                  "Reference",
                  "Notes",
                  "Actions",
                ].map((label) => (
                  <th
                    key={label}
                    className="px-5 py-4 text-xs font-black uppercase tracking-[0.02em] text-slate-500"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {paginatedRows.map((row) => {
                const isFocused = params.focus === row.id;

                return (
                  <tr
                    key={`${row.source}-${row.id}`}
                    className={`border-b border-[#edf2e7] transition hover:bg-[#fbfdfb] ${
                      isFocused ? "bg-emerald-50/40" : ""
                    }`}
                  >
                    <td className="px-5 py-4 align-top">
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black ${getRecipientTone(
                            row.source,
                          )}`}
                        >
                          {getInitials(row.name)}
                        </div>
                        <div>
                          <p className="font-black text-[#111b33]">{row.name}</p>
                          <p className="text-sm font-medium text-slate-500">{row.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 align-top">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${getSourceBadgeStyles(
                          row.source,
                        )}`}
                      >
                        {row.source}
                      </span>
                    </td>

                    <td className="px-5 py-4 align-top">
                      <p className="font-black text-[#111b33]">{formatCurrency(row.amount)}</p>
                    </td>

                    <td className="px-5 py-4 align-top">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${getStatusBadgeStyles(
                          row.status,
                        )}`}
                      >
                        {getStatusLabel(row.status)}
                      </span>
                    </td>

                    <td className="px-5 py-4 align-top">
                      <p className="font-black text-[#111b33]">{formatDate(row.payoutDate)}</p>
                      <p className="text-sm font-medium text-slate-500">
                        {formatTime(row.payoutDate)}
                      </p>
                    </td>

                    <td className="px-5 py-4 align-top">
                      <p className="font-mono text-sm font-semibold text-slate-500">
                        {row.reference}
                      </p>
                    </td>

                    <td className="px-5 py-4 align-top">
                      <p className="max-w-[220px] text-sm font-medium text-slate-500">
                        {row.notes}
                      </p>
                    </td>

                    <td className="px-5 py-4 align-top">
                      <div className="flex items-center gap-2">
                        <TableActionButton
                          href={`${buildHref({
                            focus: row.id,
                            page: String(safePage),
                          })}#payout-records`}
                        >
                          View
                        </TableActionButton>
                        <TableActionButton
                          href={`${buildHref({
                            focus: row.id,
                            page: String(safePage),
                          })}#payout-records`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </TableActionButton>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center">
                    <p className="text-lg font-black text-[#111b33]">
                      No payout records found
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-500">
                      Adjust your filters or reset to view all payout records.
                    </p>
                    <div className="mt-5">
                      <Link
                        href="/admin/financials/payouts"
                        className="inline-flex items-center justify-center rounded-2xl bg-[#118a43] px-4 py-3 text-sm font-black text-white transition hover:bg-[#0b6d33]"
                      >
                        Reset Filters
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-[#edf2e7] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-500">
            Showing{" "}
            <span className="font-black text-[#111b33]">
              {paginatedRows.length ? startIndex + 1 : 0}
            </span>{" "}
            to{" "}
            <span className="font-black text-[#111b33]">
              {Math.min(startIndex + pageSize, visibleRows.length)}
            </span>{" "}
            of <span className="font-black text-[#111b33]">{visibleRows.length}</span>{" "}
            records
          </p>

          <div className="flex items-center gap-2">
            <Link
              href={`${buildHref({ page: String(Math.max(1, safePage - 1)) })}#payout-records`}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border ${
                safePage <= 1
                  ? "pointer-events-none border-slate-200 bg-slate-100 text-slate-300"
                  : "border-[#dbe8d5] bg-white text-[#111b33] hover:bg-[#f7fbf5]"
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>

            {Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => {
              const page = index + 1;
              const active = page === safePage;

              return (
                <Link
                  key={page}
                  href={`${buildHref({ page: String(page) })}#payout-records`}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-black ${
                    active
                      ? "border-emerald-200 bg-emerald-50 text-[#118a43]"
                      : "border-[#dbe8d5] bg-white text-[#111b33] hover:bg-[#f7fbf5]"
                  }`}
                >
                  {page}
                </Link>
              );
            })}

            {totalPages > 5 && (
              <span className="px-1 text-sm font-black text-slate-400">…</span>
            )}

            <Link
              href={`${buildHref({
                page: String(Math.min(totalPages, safePage + 1)),
              })}#payout-records`}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border ${
                safePage >= totalPages
                  ? "pointer-events-none border-slate-200 bg-slate-100 text-slate-300"
                  : "border-[#dbe8d5] bg-white text-[#111b33] hover:bg-[#f7fbf5]"
              }`}
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.7fr_0.7fr_0.7fr_1.25fr]">
        <div className="rounded-[1.35rem] border border-[#e6eee2] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-[#118a43]">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-black text-[#118a43]">
                Payout Performance Insight
              </p>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Your payout success rate is {successRate}%, up from last period.
                Great job keeping the payout flow healthy.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.35rem] border border-[#e6eee2] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Success Rate</p>
          <p className="mt-2 text-3xl font-black text-[#111b33]">{successRate}%</p>
          <p className="mt-1 text-xs font-bold text-[#118a43]">↗ 3.2%</p>
        </div>

        <div className="rounded-[1.35rem] border border-[#e6eee2] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">On-Time Rate</p>
          <p className="mt-2 text-3xl font-black text-[#111b33]">{onTimeRate}%</p>
          <p className="mt-1 text-xs font-bold text-[#118a43]">↗ 4.8%</p>
        </div>

        <div className="rounded-[1.35rem] border border-[#e6eee2] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Total Partners Paid</p>
          <p className="mt-2 text-3xl font-black text-[#111b33]">{totalPartnersPaid}</p>
          <p className="mt-1 text-xs font-bold text-[#118a43]">↗ 12</p>
        </div>

        <div className="rounded-[1.35rem] border border-[#e6eee2] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-[#118a43]">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-base font-black text-[#111b33]">
                Optimize your payout flow
              </p>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Reduce failures by keeping payment methods up to date and proactively
                reviewing holds.
              </p>
            </div>
            <Link
              href="/admin/financials/settings"
              className="rounded-xl border border-[#dbe8d5] bg-[#f7fbf5] px-3 py-2 text-xs font-black text-[#118a43] transition hover:bg-[#eef7ea]"
            >
              View Recommendations
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}