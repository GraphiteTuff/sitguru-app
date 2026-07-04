import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  Gift,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SafeRow = Record<string, unknown>;
type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type PayoutStatus = "ready" | "pending" | "processing" | "paid" | "review" | "failed" | "scheduled";
type PayoutSource = "Guru" | "Ambassador" | "Partner" | "Referral" | "PawPerks" | "Platform" | "Refund" | "Adjustment";

type PayoutQueueRow = {
  id: string;
  source: PayoutSource;
  recipientName: string;
  recipientEmail: string;
  amount: number;
  status: PayoutStatus;
  reference: string;
  batch: string;
  bookingId: string;
  paymentStatus: string;
  payoutStatus: string;
  notes: string;
  createdAt: string | null;
  href: string;
};

type PayoutSummary = {
  readyToPay: number;
  manualReview: number;
  exceptions: number;
  totalScheduled: number;
  totalPaid: number;
  pendingAmount: number;
  pendingCount: number;
  paidCount: number;
  failedCount: number;
  reviewCount: number;
  referralRewardAmount: number;
  referralRewardCount: number;
  guruPayoutAmount: number;
  ambassadorPartnerAmount: number;
};

function getFirst(row: SafeRow, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = row[key];

    if (value !== null && value !== undefined && String(value).trim()) {
      return String(value).trim();
    }
  }

  return fallback;
}

function getNumber(row: SafeRow, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = row[key];
    const parsed = Number(value);

    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  return fallback;
}

function normalizeStatus(value: unknown): PayoutStatus {
  const status = String(value || "").toLowerCase();

  if (status.includes("fail") || status.includes("exception") || status.includes("declin") || status.includes("error")) {
    return "failed";
  }

  if (status.includes("review") || status.includes("hold") || status.includes("manual") || status.includes("dispute")) {
    return "review";
  }

  if (status.includes("paid") || status.includes("complete") || status.includes("succeed") || status.includes("sent")) {
    return "paid";
  }

  if (status.includes("process")) return "processing";
  if (status.includes("schedule")) return "scheduled";
  if (status.includes("ready")) return "ready";

  return "pending";
}

function normalizeSource(value: unknown, fallback: PayoutSource = "Guru"): PayoutSource {
  const source = String(value || "").toLowerCase();

  if (source.includes("pawperks") || source.includes("petperks")) return "PawPerks";
  if (source.includes("ambassador")) return "Ambassador";
  if (source.includes("partner") || source.includes("affiliate")) return "Partner";
  if (source.includes("referral") || source.includes("reward")) return "Referral";
  if (source.includes("refund")) return "Refund";
  if (source.includes("adjust")) return "Adjustment";
  if (source.includes("platform") || source.includes("stripe")) return "Platform";

  return fallback;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatDateTime(value: string | null) {
  if (!value) return "Not dated";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not dated";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

async function safeSelect(table: string, query = "*"): Promise<SafeRow[]> {
  try {
    const { data, error } = await supabaseAdmin.from(table).select(query).limit(500);

    if (error || !data) return [];

    return Array.isArray(data) ? (data as unknown as SafeRow[]) : [];
  } catch {
    return [];
  }
}

function mapBookingRows(rows: SafeRow[]): PayoutQueueRow[] {
  return rows
    .map((row, index) => {
      const amount = getNumber(row, [
        "guru_estimated_total_payout",
        "guru_estimated_base_payout",
        "guru_payout_amount",
        "guru_net_amount",
        "provider_amount",
        "payout_amount",
        "guru_amount",
      ]);

      if (amount <= 0) return null;

      const status = normalizeStatus(getFirst(row, ["payout_status", "guru_payout_status", "payment_status", "status"], "pending"));
      const id = getFirst(row, ["id", "booking_id", "uid"], `booking-${index}`);

      return {
        id,
        source: "Guru" as PayoutSource,
        recipientName: getFirst(row, ["guru_name", "sitter_name", "provider_name"], "Guru payout"),
        recipientEmail: getFirst(row, ["guru_email", "sitter_email", "provider_email"], "No email on file"),
        amount,
        status,
        reference: getFirst(row, ["stripe_transfer_id", "transfer_id", "stripe_payout_id", "payment_intent_id", "stripe_session_id", "stripe_checkout_session_id", "uid", "id"], "No reference"),
        batch: getFirst(row, ["payout_batch", "batch_name", "batch"], "Bookings / Guru payouts"),
        bookingId: id,
        paymentStatus: getFirst(row, ["payment_status", "stripe_status", "checkout_status"], "Not listed"),
        payoutStatus: getFirst(row, ["payout_status", "guru_payout_status"], status),
        notes: getFirst(row, ["payout_notes", "notes", "memo"], "Booking payout generated from completed or payable care."),
        createdAt: getFirst(row, ["completed_at", "scheduled_payout_at", "booking_date", "created_at", "updated_at"], "") || null,
        href: `/admin/bookings?booking=${encodeURIComponent(id)}`,
      };
    })
    .filter(Boolean) as PayoutQueueRow[];
}

function mapGenericRows(rows: SafeRow[], fallbackSource: PayoutSource, defaultBatch: string): PayoutQueueRow[] {
  return rows
    .map((row, index) => {
      const amount = getNumber(row, [
        "amount",
        "payout_amount",
        "commission_amount",
        "reward_amount",
        "credit_amount",
        "total_amount",
        "net_amount",
        "normalized_amount",
      ]);

      if (amount <= 0) return null;

      const source = normalizeSource(
        getFirst(row, ["source", "type", "category", "reward_type", "financial_category", "program_type"], fallbackSource),
        fallbackSource,
      );
      const status = normalizeStatus(getFirst(row, ["status", "payout_status", "reward_status", "normalized_status", "financial_treatment"], "pending"));
      const id = getFirst(row, ["id", "payout_id", "referral_reward_id", "referral_code_id"], `${defaultBatch}-${index}`);

      return {
        id,
        source,
        recipientName: getFirst(row, ["recipient_name", "guru_name", "ambassador_name", "partner_name", "customer_name", "referrer_name", "name", "full_name"], `${source} payout`),
        recipientEmail: getFirst(row, ["recipient_email", "guru_email", "ambassador_email", "partner_email", "customer_email", "referrer_email", "email"], "No email on file"),
        amount,
        status,
        reference: getFirst(row, ["transaction_reference", "stripe_transfer_id", "stripe_payout_id", "reference", "referral_code", "id"], "No reference"),
        batch: getFirst(row, ["batch_name", "batch", "payout_batch"], defaultBatch),
        bookingId: getFirst(row, ["booking_id", "bookingId"], ""),
        paymentStatus: getFirst(row, ["payment_status", "stripe_status"], "Not listed"),
        payoutStatus: getFirst(row, ["payout_status", "status", "reward_status", "normalized_status"], status),
        notes: getFirst(row, ["notes", "memo", "description", "financial_treatment"], `${source} payout row.`),
        createdAt: getFirst(row, ["payout_date", "scheduled_for", "paid_at", "credited_at", "created_at", "updated_at"], "") || null,
        href: source === "Referral" || source === "PawPerks" ? "/admin/referrals" : "/admin/payouts",
      };
    })
    .filter(Boolean) as PayoutQueueRow[];
}

function dedupeRows(rows: PayoutQueueRow[]) {
  const map = new Map<string, PayoutQueueRow>();

  for (const row of rows) {
    const key = `${row.source}-${row.id}-${row.amount}`;
    if (!map.has(key)) map.set(key, row);
  }

  return Array.from(map.values());
}

async function getPayoutRows() {
  const [
    bookingRows,
    guruPayoutRows,
    partnerPayoutRows,
    payoutRows,
    financialPayoutRows,
    adminPayoutRows,
    referralRewardRows,
    stripeTransferRows,
    stripePayoutRows,
  ] = await Promise.all([
    safeSelect("bookings"),
    safeSelect("guru_payouts"),
    safeSelect("partner_payouts"),
    safeSelect("payouts"),
    safeSelect("financial_payouts"),
    safeSelect("admin_payouts"),
    safeSelect("admin_referral_reward_liability"),
    safeSelect("stripe_transfers"),
    safeSelect("stripe_payouts"),
  ]);

  return dedupeRows([
    ...mapBookingRows(bookingRows),
    ...mapGenericRows(guruPayoutRows, "Guru", "Guru payouts"),
    ...mapGenericRows(partnerPayoutRows, "Partner", "Partner commissions"),
    ...mapGenericRows(payoutRows, "Platform", "Payout records"),
    ...mapGenericRows(financialPayoutRows, "Platform", "Financial payouts"),
    ...mapGenericRows(adminPayoutRows, "Platform", "Admin payouts"),
    ...mapGenericRows(referralRewardRows, "Referral", "Referral Rewards / PawPerks"),
    ...mapGenericRows(stripeTransferRows, "Platform", "Stripe transfers"),
    ...mapGenericRows(stripePayoutRows, "Platform", "Stripe payouts"),
  ]).sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
}

function buildSummary(rows: PayoutQueueRow[]): PayoutSummary {
  return rows.reduce<PayoutSummary>(
    (summary, row) => {
      summary.totalScheduled += row.amount;

      if (row.status === "paid") {
        summary.totalPaid += row.amount;
        summary.paidCount += 1;
      }

      if (row.status === "failed") {
        summary.exceptions += 1;
        summary.failedCount += 1;
      }

      if (row.status === "review") {
        summary.manualReview += 1;
        summary.reviewCount += 1;
      }

      if (["ready", "pending", "processing", "scheduled"].includes(row.status)) {
        summary.readyToPay += row.amount;
        summary.pendingAmount += row.amount;
        summary.pendingCount += 1;
      }

      if (row.source === "Referral" || row.source === "PawPerks") {
        summary.referralRewardAmount += row.amount;
        summary.referralRewardCount += 1;
      }

      if (row.source === "Guru") summary.guruPayoutAmount += row.amount;

      if (row.source === "Ambassador" || row.source === "Partner") {
        summary.ambassadorPartnerAmount += row.amount;
      }

      return summary;
    },
    {
      readyToPay: 0,
      manualReview: 0,
      exceptions: 0,
      totalScheduled: 0,
      totalPaid: 0,
      pendingAmount: 0,
      pendingCount: 0,
      paidCount: 0,
      failedCount: 0,
      reviewCount: 0,
      referralRewardAmount: 0,
      referralRewardCount: 0,
      guruPayoutAmount: 0,
      ambassadorPartnerAmount: 0,
    },
  );
}

function statusBadgeClass(status: PayoutStatus) {
  if (status === "paid") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "failed") return "border-rose-200 bg-rose-50 text-rose-800";
  if (status === "review") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "processing") return "border-blue-200 bg-blue-50 text-blue-800";
  if (status === "scheduled") return "border-slate-200 bg-slate-50 text-slate-800";
  if (status === "ready") return "border-emerald-200 bg-white text-emerald-800";
  return "border-blue-200 bg-blue-50 text-blue-800";
}

function sourceBadgeClass(source: PayoutSource) {
  if (source === "Guru") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (source === "Ambassador") return "border-purple-200 bg-purple-50 text-purple-800";
  if (source === "Partner") return "border-violet-200 bg-violet-50 text-violet-800";
  if (source === "Referral" || source === "PawPerks") return "border-blue-200 bg-blue-50 text-blue-800";
  if (source === "Refund") return "border-rose-200 bg-rose-50 text-rose-800";
  if (source === "Adjustment") return "border-indigo-200 bg-indigo-50 text-indigo-800";
  return "border-slate-200 bg-slate-50 text-slate-800";
}

function StatCard({
  label,
  value,
  helper,
  icon,
  tone = "emerald",
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
  tone?: "emerald" | "blue" | "amber" | "rose" | "purple" | "slate";
}) {
  const toneClass = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-800",
    blue: "border-blue-100 bg-blue-50 text-blue-800",
    amber: "border-amber-100 bg-amber-50 text-amber-800",
    rose: "border-rose-100 bg-rose-50 text-rose-800",
    purple: "border-purple-100 bg-purple-50 text-purple-800",
    slate: "border-slate-100 bg-slate-50 text-slate-800",
  }[tone];

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-600">{label}</p>
          <p className="mt-2 text-3xl font-black leading-none text-slate-950">{value}</p>
          <p className="mt-2 text-sm font-bold leading-5 text-slate-600">{helper}</p>
        </div>
        <div className={`rounded-2xl border p-3 ${toneClass}`}>{icon}</div>
      </div>
    </div>
  );
}

export default async function AdminFinancialPayoutsPage() {
  const rows = await getPayoutRows();
  const summary = buildSummary(rows);
  const pendingRows = rows.filter((row) => ["ready", "pending", "processing", "scheduled"].includes(row.status));
  const reviewRows = rows.filter((row) => row.status === "review" || row.status === "failed");
  const referralRows = rows.filter((row) => row.source === "Referral" || row.source === "PawPerks");
  const recentRows = rows.slice(0, 10);

  return (
    <main className="min-h-screen bg-[#f7fbf8] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <section className="grid gap-5 xl:grid-cols-[1.55fr_0.9fr]">
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm lg:p-8">
            <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-600">
              <Link href="/admin" className="text-emerald-800 hover:text-emerald-900">Admin</Link>
              <span>/</span>
              <span className="text-slate-950">Financials / Live Payout Analytics</span>
            </div>

            <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
                  Live Supabase Payout Analytics
                </span>
                <h1 className="mt-4 max-w-5xl text-5xl font-black tracking-[-0.05em] text-slate-950 lg:text-7xl">
                  Live Payout Analytics
                </h1>
                <p className="mt-4 max-w-4xl text-base font-semibold leading-8 text-slate-700">
                  Analyze real Guru payouts, partner commissions, Ambassador rewards, PawPerks rewards, referral liabilities, payout batches, payment exceptions, refunds, and reconciliation work from live SitGuru Supabase rows. This replaces the old static analytics view.
                </p>
              </div>

              <div className="grid min-w-[260px] gap-3">
                <Link href="/admin/payments" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800">
                  Open Payments <CreditCard className="h-4 w-4" />
                </Link>
                <Link href="/admin/payouts" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-800 transition hover:bg-emerald-50">
                  Main Payout Center <TrendingUp className="h-4 w-4" />
                </Link>
                <Link href="/api/admin/financials/payouts/export" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-black text-slate-800 transition hover:bg-white">
                  Export CSV <Download className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">Ready / Pending</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{formatCurrency(summary.readyToPay)}</p>
                <p className="mt-1 text-sm font-bold text-slate-700">{summary.pendingCount} payout row(s)</p>
              </div>
              <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">Manual Review</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{summary.manualReview}</p>
                <p className="mt-1 text-sm font-bold text-slate-700">Hold, dispute, or manual review row(s)</p>
              </div>
              <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-800">Exceptions</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{summary.exceptions}</p>
                <p className="mt-1 text-sm font-bold text-slate-700">Failed or exception payout row(s)</p>
              </div>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-slate-950">Payout workflow</h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                    Use this as the live payout analytics page. It reads from real Supabase payout, booking, referral, Stripe, and financial payout tables when those tables exist.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <Link href="/admin/payouts" className="inline-flex items-center justify-between rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800">
                  Open main payout center <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/admin/referrals" className="inline-flex items-center justify-between rounded-2xl border border-purple-200 bg-purple-50 px-5 py-3 text-sm font-black text-purple-800 transition hover:bg-purple-100">
                  Review referral rewards <Gift className="h-4 w-4" />
                </Link>
                <Link href="/admin/financials/reconciliation" className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-50">
                  Reconcile deposits <RefreshCw className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-100 bg-amber-50 p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">Live-data note</p>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                If a section shows zero, it means no matching live rows were found in Supabase for that source. This page does not fill the dashboard with fake payout recipients.
              </p>
            </div>
          </aside>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard label="Total Scheduled" value={formatCurrency(summary.totalScheduled)} helper={`${rows.length} live payout row(s)`} icon={<DollarSign className="h-6 w-6" />} />
          <StatCard label="Total Paid" value={formatCurrency(summary.totalPaid)} helper={`${summary.paidCount} paid row(s)`} icon={<CheckCircle2 className="h-6 w-6" />} />
          <StatCard label="Pending" value={formatCurrency(summary.pendingAmount)} helper={`${summary.pendingCount} row(s) waiting`} icon={<Clock3 className="h-6 w-6" />} tone="blue" />
          <StatCard label="Needs Review" value={String(summary.reviewCount)} helper="Manual review queue" icon={<Eye className="h-6 w-6" />} tone="amber" />
          <StatCard label="Failed" value={String(summary.failedCount)} helper="Exception queue" icon={<AlertTriangle className="h-6 w-6" />} tone="rose" />
          <StatCard label="Referral Rewards" value={formatCurrency(summary.referralRewardAmount)} helper={`${summary.referralRewardCount} reward row(s)`} icon={<Gift className="h-6 w-6" />} tone="purple" />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm lg:p-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Live payout analytics queue</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Payable rows by source and status</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Guru, Ambassador, partner, PawPerks, referral, Stripe transfer, and financial payout rows are merged into one admin review queue.
                </p>
              </div>
              <Link href="/admin/payments" className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800 hover:bg-emerald-100">
                Payment details <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200">
              {pendingRows.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-slate-500">Recipient</th>
                        <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-slate-500">Source</th>
                        <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-slate-500">Amount</th>
                        <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-slate-500">Status</th>
                        <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-slate-500">Reference</th>
                        <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-slate-500">Updated</th>
                        <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-slate-500">Open</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRows.slice(0, 12).map((row) => (
                        <tr key={`${row.source}-${row.id}`} className="border-t border-slate-100">
                          <td className="px-5 py-4">
                            <p className="font-black text-slate-950">{row.recipientName}</p>
                            <p className="text-xs font-bold text-slate-500">{row.recipientEmail}</p>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${sourceBadgeClass(row.source)}`}>{row.source}</span>
                          </td>
                          <td className="px-5 py-4 font-black text-slate-950">{formatCurrency(row.amount)}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black capitalize ${statusBadgeClass(row.status)}`}>{row.status}</span>
                          </td>
                          <td className="max-w-[240px] truncate px-5 py-4 font-bold text-slate-600">{row.reference}</td>
                          <td className="px-5 py-4 font-bold text-slate-600">{formatDateTime(row.createdAt)}</td>
                          <td className="px-5 py-4">
                            <Link href={row.href} className="inline-flex rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-black text-emerald-800 hover:bg-emerald-50">Open</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-base font-black text-slate-950">No pending payout rows found.</p>
                  <p className="mt-2 text-sm font-semibold text-slate-600">New payable rows will appear here when Supabase has payable Guru, partner, Ambassador, PawPerks, referral, or payout records.</p>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-600">Source breakdown</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Real payout exposure</h2>
              <div className="mt-5 space-y-4">
                {(
                  [
                    { label: "Guru payouts", amount: summary.guruPayoutAmount, Icon: Users },
                    { label: "Ambassador / partner", amount: summary.ambassadorPartnerAmount, Icon: Wallet },
                    { label: "PawPerks / referrals", amount: summary.referralRewardAmount, Icon: Gift },
                  ] satisfies Array<{ label: string; amount: number; Icon: IconComponent }>
                ).map(({ label, amount, Icon }) => (
                  <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-white p-2 text-emerald-700"><Icon className="h-5 w-5" /></div>
                        <p className="font-black text-slate-950">{label}</p>
                      </div>
                      <p className="font-black text-slate-950">{formatCurrency(amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-rose-100 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-700">Review queue</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Payout issues needing admin</h2>
              <div className="mt-5 space-y-3">
                {reviewRows.slice(0, 5).map((row) => (
                  <Link key={`${row.source}-${row.id}-review`} href={row.href} className="block rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-950">{row.recipientName}</p>
                        <p className="mt-1 text-xs font-bold text-slate-500">{row.notes}</p>
                      </div>
                      <p className="font-black text-slate-950">{formatCurrency(row.amount)}</p>
                    </div>
                  </Link>
                ))}
                {reviewRows.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                    <p className="text-sm font-bold text-slate-600">No payout issues found.</p>
                  </div>
                ) : null}
              </div>
            </div>
          </aside>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm lg:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Recent payout activity</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Latest live rows</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Use this table to confirm the financial payout analytics route is reading live SitGuru data, not placeholder examples.</p>
            </div>
            <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black text-slate-700">
              {rows.length} total live row(s)
            </span>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {recentRows.length > 0 ? (
              recentRows.map((row) => (
                <Link key={`${row.source}-${row.id}-recent`} href={row.href} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${sourceBadgeClass(row.source)}`}>{row.source}</span>
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black capitalize ${statusBadgeClass(row.status)}`}>{row.status}</span>
                      </div>
                      <h3 className="mt-3 text-lg font-black text-slate-950">{row.recipientName}</h3>
                      <p className="mt-1 text-sm font-bold text-slate-600">{row.batch}</p>
                      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{row.reference}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-2xl font-black text-slate-950">{formatCurrency(row.amount)}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">{formatDateTime(row.createdAt)}</p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center lg:col-span-2">
                <p className="text-lg font-black text-slate-950">No payout rows found yet.</p>
                <p className="mt-2 text-sm font-semibold text-slate-600">When real payout rows exist in Supabase, they will appear here. No fake demo names are shown.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
