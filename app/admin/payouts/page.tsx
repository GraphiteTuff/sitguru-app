import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
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
};

type SearchParamsShape = {
  q?: string;
  status?: string;
  source?: string;
  batch?: string;
  location?: string;
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

  if (Number.isNaN(date.getTime())) {
    return "Not scheduled";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
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

  if (status.includes("schedule")) {
    return "scheduled";
  }

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
    if (!map.has(key)) {
      map.set(key, row);
    }
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

    const rowLocation = `${row.city}, ${row.state}`.toLowerCase();

    return (
      (!q || searchable.includes(q)) &&
      (status === "all" || row.status === status) &&
      (source === "all" || row.source.toLowerCase() === source) &&
      (batch === "all" || row.batch.toLowerCase() === batch) &&
      (location === "all" || rowLocation === location)
    );
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

function getStatusLabel(status: PayoutStatus) {
  if (status === "paid") return "Paid";
  if (status === "pending") return "Pending";
  if (status === "review") return "Needs Review";
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

function metricSum(rows: PayoutRow[], status: PayoutStatus) {
  return rows
    .filter((row) => row.status === status)
    .reduce((sum, row) => sum + row.amount, 0);
}

function countByStatus(rows: PayoutRow[], status: PayoutStatus) {
  return rows.filter((row) => row.status === status).length;
}

function percent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function DashboardCard({
  title,
  value,
  subtext,
  icon,
  tone,
}: {
  title: string;
  value: string;
  subtext: string;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-[#e6eee2] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-[#111b33]">
            {value}
          </p>
          <p className="mt-2 text-xs font-bold text-[#118a43]">{subtext}</p>
        </div>

        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${tone}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function WorkflowCard({
  title,
  description,
  href,
  icon,
  highlight,
}: {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group block rounded-[1.35rem] border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        highlight
          ? "border-emerald-200 bg-[#f7fbf5]"
          : "border-[#e6eee2] bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[#118a43]">
            {icon}
          </div>
          <div>
            <p className="text-base font-black text-[#111b33]">{title}</p>
            <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
              {description}
            </p>
          </div>
        </div>

        <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#118a43]" />
      </div>
    </Link>
  );
}

function StatusProgress({
  label,
  amount,
  count,
  total,
  colorClass,
}: {
  label: string;
  amount: number;
  count: number;
  total: number;
  colorClass: string;
}) {
  const width = percent(amount, total);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black text-[#111b33]">{label}</p>
          <p className="text-xs font-semibold text-slate-500">{count} records</p>
        </div>
        <p className="text-sm font-black text-[#111b33]">{formatCurrency(amount)}</p>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default async function AdminPayoutLandingPage({
  searchParams,
}: {
  searchParams?: SearchParamsInput;
}) {
  const params = ((await searchParams) || {}) as SearchParamsShape;
  const allRows = await getPayoutRows();
  const rows = filterRows(allRows, params);

  const batchOptions = uniqueValues(allRows, "batch");
  const locationOptions = uniqueValues(allRows, "location");

  const totalScheduled = rows.reduce((sum, row) => sum + row.amount, 0);
  const totalPaid = metricSum(rows, "paid");
  const totalPending = metricSum(rows, "pending");
  const totalReview = metricSum(rows, "review");
  const totalFailed = metricSum(rows, "failed");
  const averagePayout = rows.length ? totalScheduled / rows.length : 0;

  const visibleRows = rows.slice(0, 6);
  const reviewCount = countByStatus(rows, "review");
  const failedCount = countByStatus(rows, "failed");
  const pendingCount = countByStatus(rows, "pending");
  const paidCount = countByStatus(rows, "paid");

  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-6 px-4 pb-10 sm:px-6 xl:px-8 2xl:px-0">
      <section className="grid gap-5 xl:grid-cols-12">
        <div className="rounded-[1.75rem] border border-[#e6eee2] bg-white p-6 shadow-sm lg:p-7 xl:col-span-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
                <Link href="/admin" className="transition hover:text-[#118a43]">
                  Admin
                </Link>
                <span>›</span>
                <span className="text-[#111b33]">Payout Command Center</span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight text-[#111b33] sm:text-4xl">
                  Payout Command Center
                </h1>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-[#118a43]">
                  <span className="h-2 w-2 rounded-full bg-[#118a43]" />
                  Main payout landing
                </span>
              </div>

              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500 sm:text-base">
                Manage guru payouts, partner commissions, payout batches, failed transfers,
                manual reviews, references, and accounting-ready payout activity from one
                focused SitGuru HQ workspace.
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.25rem] border border-emerald-100 bg-[#f7fbf5] p-4">
              <p className="text-sm font-semibold text-slate-500">Ready to pay</p>
              <p className="mt-2 text-3xl font-black text-[#111b33]">
                {formatCurrency(totalPending + totalScheduled)}
              </p>
              <p className="mt-1 text-xs font-bold text-[#118a43]">
                Pending + scheduled queue
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-amber-100 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-800">Manual review</p>
              <p className="mt-2 text-3xl font-black text-amber-950">{reviewCount}</p>
              <p className="mt-1 text-xs font-bold text-amber-800">
                Payouts need attention
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-red-100 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-800">Exceptions</p>
              <p className="mt-2 text-3xl font-black text-red-950">{failedCount}</p>
              <p className="mt-1 text-xs font-bold text-red-800">
                Failed payout transfers
              </p>
            </div>
          </div>
        </div>

        <aside className="space-y-5 xl:col-span-4">
          <div className="rounded-[1.75rem] border border-[#e6eee2] bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[#118a43]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#111b33]">
                  Payout workflow
                </h2>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                  This is the payout landing page. Use analytics only when you need
                  deeper reporting and visual breakdowns.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <Link
                href="/admin/financials/payouts"
                className="inline-flex items-center justify-between rounded-2xl bg-[#118a43] px-4 py-3 text-sm font-black text-white transition hover:bg-[#0b6d33]"
              >
                Open additional payout analytics
                <BarChart3 className="h-4 w-4" />
              </Link>

              <Link
                href="/api/admin/financials/payouts/export"
                className="inline-flex items-center justify-between rounded-2xl border border-[#dbe8d5] bg-[#f7fbf5] px-4 py-3 text-sm font-black text-[#118a43] transition hover:bg-[#eef7ea]"
              >
                Export payout CSV
                <Download className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-[#e6eee2] bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[#118a43]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-black text-[#111b33]">Route focus</p>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Main payout buttons should point here:
                </p>
                <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 font-mono text-xs font-bold text-slate-600">
                  /admin/payout
                </p>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <DashboardCard
          title="Total Scheduled"
          value={formatCurrency(totalScheduled)}
          subtext="↗ 18.6% vs prior period"
          icon={<CalendarDays className="h-5 w-5" />}
          tone="bg-emerald-50 text-[#118a43]"
        />
        <DashboardCard
          title="Total Paid"
          value={formatCurrency(totalPaid)}
          subtext="↗ 21.3% vs prior period"
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="bg-emerald-50 text-[#118a43]"
        />
        <DashboardCard
          title="Pending"
          value={formatCurrency(totalPending)}
          subtext="↗ 8.4% vs prior period"
          icon={<Clock3 className="h-5 w-5" />}
          tone="bg-blue-50 text-blue-600"
        />
        <DashboardCard
          title="Needs Review"
          value={formatCurrency(totalReview)}
          subtext="↗ 12.7% vs prior period"
          icon={<Eye className="h-5 w-5" />}
          tone="bg-amber-50 text-amber-600"
        />
        <DashboardCard
          title="Failed"
          value={formatCurrency(totalFailed)}
          subtext="↘ 4.7% vs prior period"
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="bg-red-50 text-red-500"
        />
        <DashboardCard
          title="Avg Payout"
          value={formatCurrency(averagePayout)}
          subtext="↗ 14.2% vs prior period"
          icon={<TrendingUp className="h-5 w-5" />}
          tone="bg-emerald-50 text-[#118a43]"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-12">
        <div className="rounded-[1.75rem] border border-[#e6eee2] bg-white p-5 shadow-sm sm:p-6 xl:col-span-8">
          <form action="/admin/payout" className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-[#118a43]">
                  <Filter className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#111b33]">
                    Find payouts fast
                  </h2>
                  <p className="text-sm font-medium text-slate-500">
                    Filter payout records by status, source, batch, location, or recipient.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#118a43] px-4 py-3 text-sm font-black text-white transition hover:bg-[#0b6d33]"
                >
                  Apply Filters
                  <Filter className="h-4 w-4" />
                </button>

                <Link
                  href="/admin/payout"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#dbe8d5] bg-white px-4 py-3 text-sm font-black text-[#118a43] transition hover:bg-[#f7fbf5]"
                >
                  Reset
                  <RefreshCw className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-[1.4fr_repeat(4,minmax(0,1fr))]">
              <label className="relative block lg:col-span-2 2xl:col-span-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="q"
                  defaultValue={params?.q || ""}
                  placeholder="Search name, email, reference, city, ZIP..."
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
                <option value="failed">Failed</option>
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
            </div>
          </form>
        </div>

        <aside className="rounded-[1.75rem] border border-[#e6eee2] bg-white p-5 shadow-sm sm:p-6 xl:col-span-4">
          <h2 className="text-lg font-black text-[#111b33]">Payout health</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            A focused operational snapshot of what needs action.
          </p>

          <div className="mt-6 space-y-5">
            <StatusProgress
              label="Paid"
              amount={totalPaid}
              count={paidCount}
              total={totalScheduled}
              colorClass="bg-[#118a43]"
            />
            <StatusProgress
              label="Pending"
              amount={totalPending}
              count={pendingCount}
              total={totalScheduled}
              colorClass="bg-blue-500"
            />
            <StatusProgress
              label="Needs Review"
              amount={totalReview}
              count={reviewCount}
              total={totalScheduled}
              colorClass="bg-amber-500"
            />
            <StatusProgress
              label="Failed"
              amount={totalFailed}
              count={failedCount}
              total={totalScheduled}
              colorClass="bg-red-500"
            />
          </div>
        </aside>
      </section>

      <section className="grid gap-5 xl:grid-cols-12">
        <div className="overflow-hidden rounded-[1.5rem] border border-[#e6eee2] bg-white shadow-sm xl:col-span-8">
          <div className="flex flex-col gap-3 border-b border-[#edf2e7] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-[#111b33]">
                Recent payout records
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                The newest payout activity that needs command-center visibility.
              </p>
            </div>

            <Link
              href="/admin/financials/payouts"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#dbe8d5] bg-[#f7fbf5] px-4 py-3 text-sm font-black text-[#118a43] transition hover:bg-[#eef7ea]"
            >
              View Analytics
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full">
              <thead className="bg-[#fbfdfb]">
                <tr className="border-b border-[#edf2e7] text-left">
                  {["Recipient", "Source", "Amount", "Status", "Payout Date", "Reference"].map(
                    (label) => (
                      <th
                        key={label}
                        className="px-5 py-4 text-xs font-black uppercase tracking-[0.02em] text-slate-500"
                      >
                        {label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody>
                {visibleRows.map((row) => (
                  <tr
                    key={`${row.source}-${row.id}`}
                    className="border-b border-[#edf2e7] transition hover:bg-[#fbfdfb]"
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
                    </td>

                    <td className="px-5 py-4 align-top">
                      <p className="font-mono text-sm font-semibold text-slate-500">
                        {row.reference}
                      </p>
                    </td>
                  </tr>
                ))}

                {visibleRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center">
                      <p className="text-lg font-black text-[#111b33]">
                        No payout records found
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-500">
                        Adjust your filters or reset to view all payout activity.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-5 xl:col-span-4">
          <WorkflowCard
            title="Additional payout analytics"
            description="Open visual payout reports, source breakdowns, trends, and status analytics."
            href="/admin/financials/payouts"
            icon={<BarChart3 className="h-5 w-5" />}
            highlight
          />

          <WorkflowCard
            title="Payment settings"
            description="Manage payment methods, payout preferences, accounting controls, and tax settings."
            href="/admin/financials/settings"
            icon={<Wallet className="h-5 w-5" />}
          />

          <WorkflowCard
            title="Partner payout visibility"
            description="Review partner commissions, ambassador payments, and affiliate payout activity."
            href="/admin/partners"
            icon={<Users className="h-5 w-5" />}
          />

          <div className="rounded-[1.5rem] border border-[#e6eee2] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-[#111b33]">Quick alerts</h2>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-black text-amber-900">Manual review queue</p>
                <p className="mt-1 text-xs font-semibold text-amber-800">
                  {reviewCount} payouts need review.
                </p>
              </div>

              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-black text-red-900">Failed transfers</p>
                <p className="mt-1 text-xs font-semibold text-red-800">
                  {failedCount} payout exceptions found.
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-black text-emerald-900">Accounting ready</p>
                <p className="mt-1 text-xs font-semibold text-emerald-800">
                  References, notes, batches, and payout statuses are grouped for review.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}