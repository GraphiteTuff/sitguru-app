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
import { supabaseAdmin } from "@/lib/supabase/admin";

type DbRow = Record<string, unknown> & {
  guru?: Record<string, unknown>;
  partner?: Record<string, unknown>;
};

type PayoutSource =
  | "Guru"
  | "Partner"
  | "Referral"
  | "Platform"
  | "Adjustment"
  | "Refund";
type PayoutStatus =
  | "ready"
  | "paid"
  | "pending"
  | "review"
  | "failed"
  | "scheduled"
  | "missing_payout_method"
  | "stripe_restricted"
  | "no_stripe_account";

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
  recipientHref?: string;
  relatedHref?: string;
  stripeHref?: string;
  sourceTable: string;
  rawStatus?: string;
};

type SearchParamsShape = {
  q?: string;
  status?: string;
  source?: string;
  batch?: string;
  location?: string;
};

type SearchParamsInput = Promise<SearchParamsShape> | SearchParamsShape;

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
    status.includes("ready") ||
    status.includes("approved") ||
    status.includes("qualified")
  ) {
    return "ready";
  }

  if (
    status.includes("missing") &&
    (status.includes("payout") || status.includes("method"))
  ) {
    return "missing_payout_method";
  }

  if (status.includes("restricted") || status.includes("disabled")) {
    return "stripe_restricted";
  }

  if (
    status.includes("no_stripe") ||
    status.includes("stripe account required")
  ) {
    return "no_stripe_account";
  }

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

  if (status.includes("ready")) return "ready";

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

  if (source.includes("referral") || source.includes("reward"))
    return "Referral";
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

async function safeAdminSelect<T>(table: string, query = "*") {
  try {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select(query)
      .limit(500);

    if (error || !data) return [] as T[];

    return data as T[];
  } catch {
    return [] as T[];
  }
}

function rewardAmount(row: DbRow) {
  return normalizeAmount(
    row.normalized_amount ||
      row.reward_amount ||
      row.credit_amount ||
      row.payout_amount ||
      row.commission_amount ||
      row.amount,
  );
}

function rewardStatus(row: DbRow): PayoutStatus {
  const treatment = String(row.financial_treatment || "").toLowerCase();
  const status = String(
    row.normalized_status ||
      row.reward_status ||
      row.payout_status ||
      row.status ||
      "",
  ).toLowerCase();

  if (
    treatment.includes("issued") ||
    status.includes("paid") ||
    status.includes("credited") ||
    status.includes("issued") ||
    status.includes("complete")
  ) {
    return "paid";
  }

  if (
    status.includes("approved") ||
    status.includes("qualified") ||
    status.includes("scheduled")
  ) {
    return "scheduled";
  }

  if (status.includes("ready")) return "ready";

  if (
    status.includes("review") ||
    status.includes("hold") ||
    status.includes("manual")
  ) {
    return "review";
  }

  if (
    status.includes("failed") ||
    status.includes("rejected") ||
    status.includes("invalid") ||
    status.includes("cancel")
  ) {
    return "failed";
  }

  return "pending";
}

function rewardRecipientName(row: DbRow) {
  return (
    row.recipient_name ||
    row.customer_name ||
    row.pet_parent_name ||
    row.referrer_name ||
    row.referred_name ||
    row.ambassador_name ||
    row.partner_name ||
    row.guru_name ||
    row.full_name ||
    row.name ||
    row.financial_category ||
    "Referral reward recipient"
  );
}

function rewardRecipientEmail(row: DbRow) {
  return (
    row.recipient_email ||
    row.customer_email ||
    row.pet_parent_email ||
    row.referrer_email ||
    row.referred_email ||
    row.ambassador_email ||
    row.partner_email ||
    row.guru_email ||
    row.email ||
    "No email on file"
  );
}

function rewardProgramLabel(row: DbRow) {
  const category = String(
    row.financial_category || row.reward_type || row.source || row.type || "",
  )
    .replace(/[-_]+/g, " ")
    .trim();

  if (!category) return "Referral Rewards";

  return category
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function buildReferralRewardPayoutRows(rows: DbRow[]): PayoutRow[] {
  return rows
    .map((row, index) => {
      const amount = rewardAmount(row);

      if (amount <= 0) return null;

      const programLabel = rewardProgramLabel(row);
      const treatment = String(
        row.financial_treatment || "pending_reward_liability",
      );

      return {
        id: String(
          row.id ||
            row.referral_code_id ||
            row.reward_id ||
            `referral-reward-${index}`,
        ),
        source: "Referral" as PayoutSource,
        name: rewardRecipientName(row),
        email: rewardRecipientEmail(row),
        city:
          row.city ||
          row.recipient_city ||
          row.customer_city ||
          row.partner_city ||
          "Remote",
        state:
          row.state ||
          row.recipient_state ||
          row.customer_state ||
          row.partner_state ||
          "US",
        zip:
          row.zip ||
          row.zip_code ||
          row.recipient_zip ||
          row.customer_zip ||
          "",
        amount,
        status: rewardStatus(row),
        payoutDate:
          row.paid_at ||
          row.credited_at ||
          row.payout_date ||
          row.scheduled_for ||
          row.qualified_at ||
          row.created_at ||
          row.updated_at ||
          null,
        reference:
          row.reference ||
          row.reward_reference ||
          row.referral_code ||
          row.referral_code_id ||
          row.id ||
          "Referral reward",
        batch: `${programLabel} / Reward Queue`,
        notes: `Referral reward · ${programLabel} · ${treatment.replaceAll("_", " ")}`,
        recipientHref: row.ambassador_id
          ? `/admin/ambassadors/${row.ambassador_id}`
          : row.partner_id
            ? `/admin/partners/${row.partner_id}`
            : undefined,
        relatedHref: row.referral_id
          ? `/admin/referrals?referral=${row.referral_id}`
          : row.referral_code_id
            ? `/admin/referrals?code=${row.referral_code_id}`
            : "/admin/referrals",
        sourceTable: "admin_referral_reward_liability",
        rawStatus:
          row.normalized_status ||
          row.reward_status ||
          row.payout_status ||
          row.status ||
          row.financial_treatment,
      };
    })
    .filter(Boolean) as PayoutRow[];
}

function buildGuruPayoutRows(rows: DbRow[]): PayoutRow[] {
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
      row.payout_date ||
      row.scheduled_for ||
      row.created_at ||
      row.updated_at ||
      null,
    reference:
      row.transaction_reference ||
      row.stripe_transfer_id ||
      row.reference ||
      row.id ||
      "No reference",
    batch: row.batch_name || row.batch || row.payout_batch || "Unbatched",
    notes: row.notes || row.memo || "Guru sitting payout",
    recipientHref: row.guru_id
      ? `/admin/gurus/${row.guru_id}`
      : row.user_id
        ? `/admin/users/${row.user_id}`
        : undefined,
    relatedHref: row.booking_id
      ? `/admin/bookings/${row.booking_id}`
      : undefined,
    stripeHref: stripeDashboardHref(
      row.stripe_transfer_id || row.stripe_payout_id || row.stripe_account_id,
    ),
    sourceTable: "guru_payouts",
    rawStatus: row.status || row.payout_status,
  }));
}

function buildPartnerPayoutRows(rows: DbRow[]): PayoutRow[] {
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
    email:
      row.email ||
      row.partner_email ||
      row.partner?.email ||
      "No email on file",
    city: row.city || row.partner_city || row.partner?.city || "Unknown",
    state: row.state || row.partner_state || row.partner?.state || "",
    zip: row.zip || row.zip_code || row.partner?.zip || "",
    amount: normalizeAmount(
      row.amount ||
        row.commission_amount ||
        row.payout_amount ||
        row.total_amount,
    ),
    status: normalizeStatus(row.status || row.payout_status),
    payoutDate:
      row.payout_date ||
      row.scheduled_for ||
      row.created_at ||
      row.updated_at ||
      null,
    reference:
      row.transaction_reference ||
      row.stripe_transfer_id ||
      row.reference ||
      row.id ||
      "No reference",
    batch: row.batch_name || row.batch || row.payout_batch || "Unbatched",
    notes: row.notes || row.memo || "Partner commission payout",
    recipientHref: row.partner_id
      ? `/admin/partners/${row.partner_id}`
      : row.ambassador_id
        ? `/admin/ambassadors/${row.ambassador_id}`
        : undefined,
    relatedHref: row.referral_id
      ? `/admin/referrals?referral=${row.referral_id}`
      : undefined,
    stripeHref: stripeDashboardHref(
      row.stripe_transfer_id || row.stripe_payout_id || row.stripe_account_id,
    ),
    sourceTable: "partner_payouts",
    rawStatus: row.status || row.payout_status,
  }));
}

function stripeDashboardHref(value: unknown) {
  const id = String(value || "").trim();
  if (!id) return undefined;

  if (id.startsWith("acct_"))
    return `https://dashboard.stripe.com/connect/accounts/${id}`;
  if (id.startsWith("tr_"))
    return `https://dashboard.stripe.com/transfers/${id}`;
  if (id.startsWith("po_")) return `https://dashboard.stripe.com/payouts/${id}`;
  if (id.startsWith("ch_"))
    return `https://dashboard.stripe.com/payments/${id}`;
  if (id.startsWith("pi_"))
    return `https://dashboard.stripe.com/payments/${id}`;

  return undefined;
}

function buildGenericPayoutRows(
  rows: DbRow[],
  sourceTable = "payouts",
): PayoutRow[] {
  return rows.map((row, index) => ({
    id: String(row.id || row.payout_id || `generic-${index}`),
    source: normalizeSource(
      row.source || row.type || row.category || "Platform",
    ),
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
      row.payout_date ||
      row.scheduled_for ||
      row.created_at ||
      row.updated_at ||
      null,
    reference:
      row.transaction_reference ||
      row.stripe_transfer_id ||
      row.reference ||
      row.id ||
      "No reference",
    batch: row.batch_name || row.batch || row.payout_batch || "Unbatched",
    notes: row.notes || row.memo || "Platform payout",
    recipientHref: row.guru_id
      ? `/admin/gurus/${row.guru_id}`
      : row.partner_id
        ? `/admin/partners/${row.partner_id}`
        : row.ambassador_id
          ? `/admin/ambassadors/${row.ambassador_id}`
          : undefined,
    relatedHref: row.booking_id
      ? `/admin/bookings/${row.booking_id}`
      : row.referral_id
        ? `/admin/referrals?referral=${row.referral_id}`
        : undefined,
    stripeHref: stripeDashboardHref(
      row.stripe_transfer_id ||
        row.stripe_payout_id ||
        row.stripe_account_id ||
        row.stripe_transaction_id,
    ),
    sourceTable,
    rawStatus: row.status || row.payout_status,
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

  const guruRows = buildGuruPayoutRows(
    await safeSelect<DbRow>(supabase, "guru_payouts"),
  );
  const partnerRows = buildPartnerPayoutRows(
    await safeSelect<DbRow>(supabase, "partner_payouts"),
  );
  const payoutsRows = buildGenericPayoutRows(
    await safeSelect<DbRow>(supabase, "payouts"),
    "payouts",
  );
  const financialPayoutRows = buildGenericPayoutRows(
    await safeSelect<DbRow>(supabase, "financial_payouts"),
    "financial_payouts",
  );
  const adminPayoutRows = buildGenericPayoutRows(
    await safeSelect<DbRow>(supabase, "admin_payouts"),
    "admin_payouts",
  );
  const referralRewardRows = buildReferralRewardPayoutRows(
    await safeAdminSelect<DbRow>("admin_referral_reward_liability"),
  );

  const merged = dedupeRows([
    ...guruRows,
    ...partnerRows,
    ...payoutsRows,
    ...financialPayoutRows,
    ...adminPayoutRows,
    ...referralRewardRows,
  ]);

  return merged;
}

function filterRows(rows: PayoutRow[], params: SearchParamsShape) {
  const q = String(params?.q || "")
    .toLowerCase()
    .trim();
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
      row.sourceTable,
      row.rawStatus,
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
  if (status === "ready") return "Ready";
  if (status === "paid") return "Paid";
  if (status === "pending") return "Pending";
  if (status === "review") return "Needs Review";
  if (status === "failed") return "Failed";
  if (status === "missing_payout_method") return "Missing Payout Method";
  if (status === "stripe_restricted") return "Stripe Restricted";
  if (status === "no_stripe_account") return "No Stripe Account";
  return "Scheduled";
}

function getStatusBadgeStyles(status: PayoutStatus) {
  if (status === "ready")
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "paid")
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "pending") return "border-blue-200 bg-blue-50 text-blue-800";
  if (status === "review") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "failed") return "border-red-200 bg-red-50 text-red-800";
  if (
    status === "missing_payout_method" ||
    status === "stripe_restricted" ||
    status === "no_stripe_account"
  )
    return "border-orange-200 bg-orange-50 text-orange-800";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function getSourceBadgeStyles(source: PayoutSource) {
  if (source === "Guru")
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (source === "Partner")
    return "border-violet-200 bg-violet-50 text-violet-800";
  if (source === "Referral")
    return "border-violet-200 bg-violet-50 text-violet-800";
  if (source === "Platform")
    return "border-slate-200 bg-slate-100 text-slate-700";
  if (source === "Adjustment")
    return "border-indigo-200 bg-indigo-50 text-indigo-800";
  return "border-rose-200 bg-rose-50 text-rose-800";
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "SG";
}

function getRecipientTone(source: PayoutSource) {
  if (source === "Guru") return "bg-emerald-50 text-emerald-700";
  if (source === "Partner") return "bg-violet-50 text-violet-700";
  if (source === "Referral") return "bg-violet-50 text-violet-700";
  if (source === "Platform") return "bg-slate-100 text-slate-700";
  if (source === "Adjustment") return "bg-indigo-50 text-indigo-700";
  return "bg-rose-50 text-rose-700";
}

function hasRowsText(rows: PayoutRow[], value: string) {
  return rows.length ? value : "No records yet";
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

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${tone}`}
        >
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
          <p className="text-xs font-semibold text-slate-500">
            {count} records
          </p>
        </div>
        <p className="text-sm font-black text-[#111b33]">
          {formatCurrency(amount)}
        </p>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${colorClass}`}
          style={{ width: `${width}%` }}
        />
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
  const totalReady = metricSum(rows, "ready");
  const totalScheduledOnly = metricSum(rows, "scheduled");
  const totalPaid = metricSum(rows, "paid");
  const totalPending = metricSum(rows, "pending");
  const totalReview = metricSum(rows, "review");
  const totalFailed = metricSum(rows, "failed");
  const averagePayout = rows.length ? totalScheduled / rows.length : 0;

  const visibleRows = [...rows]
    .sort((a, b) => {
      const bDate = b.payoutDate ? new Date(b.payoutDate).getTime() : 0;
      const aDate = a.payoutDate ? new Date(a.payoutDate).getTime() : 0;
      return bDate - aDate;
    })
    .slice(0, 6);
  const reviewCount = countByStatus(rows, "review");
  const failedCount = countByStatus(rows, "failed");
  const pendingCount = countByStatus(rows, "pending");
  const readyCount = countByStatus(rows, "ready");
  const paidCount = countByStatus(rows, "paid");
  const scheduledCount = countByStatus(rows, "scheduled");
  const rewardRows = rows.filter((row) =>
    `${row.notes} ${row.batch} ${row.reference}`
      .toLowerCase()
      .includes("referral reward"),
  );
  const pendingRewardRows = rewardRows.filter(
    (row) =>
      row.status === "pending" ||
      row.status === "review" ||
      row.status === "scheduled",
  );
  const issuedRewardRows = rewardRows.filter((row) => row.status === "paid");
  const pendingRewardTotal = pendingRewardRows.reduce(
    (sum, row) => sum + row.amount,
    0,
  );
  const issuedRewardTotal = issuedRewardRows.reduce(
    (sum, row) => sum + row.amount,
    0,
  );

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
                Manage Guru payouts, partner commissions, PawPerks rewards, Guru
                referral rewards, Ambassador rewards, partner reward
                liabilities, payout batches, failed transfers, manual reviews,
                references, and accounting-ready payout activity from one
                focused SitGuru HQ workspace.
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.25rem] border border-emerald-100 bg-[#f7fbf5] p-4">
              <p className="text-sm font-semibold text-slate-500">
                Ready to pay
              </p>
              <p className="mt-2 text-3xl font-black text-[#111b33]">
                {formatCurrency(totalReady + totalPending + totalScheduledOnly)}
              </p>
              <p className="mt-1 text-xs font-bold text-[#118a43]">
                Ready + pending + scheduled queue
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-amber-100 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-800">
                Manual review
              </p>
              <p className="mt-2 text-3xl font-black text-amber-950">
                {reviewCount}
              </p>
              <p className="mt-1 text-xs font-bold text-amber-800">
                Payouts need attention
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-red-100 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-800">Exceptions</p>
              <p className="mt-2 text-3xl font-black text-red-950">
                {failedCount}
              </p>
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
                  This is the payout landing page. Use analytics only when you
                  need deeper reporting and visual breakdowns.
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
                <p className="text-base font-black text-[#111b33]">
                  Route focus
                </p>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Main payout buttons should point here:
                </p>
                <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 font-mono text-xs font-bold text-slate-600">
                  /admin/payouts
                </p>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <DashboardCard
          title="Total Scheduled"
          value={hasRowsText(rows, formatCurrency(totalScheduledOnly))}
          subtext={`${scheduledCount} scheduled records`}
          icon={<CalendarDays className="h-5 w-5" />}
          tone="bg-emerald-50 text-[#118a43]"
        />
        <DashboardCard
          title="Total Paid"
          value={hasRowsText(rows, formatCurrency(totalPaid))}
          subtext={`${paidCount} paid records`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="bg-emerald-50 text-[#118a43]"
        />
        <DashboardCard
          title="Pending"
          value={hasRowsText(rows, formatCurrency(totalPending))}
          subtext={`${pendingCount} pending records`}
          icon={<Clock3 className="h-5 w-5" />}
          tone="bg-blue-50 text-blue-600"
        />
        <DashboardCard
          title="Needs Review"
          value={hasRowsText(rows, formatCurrency(totalReview))}
          subtext={`${reviewCount} records need review`}
          icon={<Eye className="h-5 w-5" />}
          tone="bg-amber-50 text-amber-600"
        />
        <DashboardCard
          title="Failed"
          value={hasRowsText(rows, formatCurrency(totalFailed))}
          subtext={`${failedCount} failed records`}
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="bg-red-50 text-red-500"
        />
        <DashboardCard
          title="Avg Payout"
          value={hasRowsText(rows, formatCurrency(averagePayout))}
          subtext={`${rows.length} filtered payout records`}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="bg-emerald-50 text-[#118a43]"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <DashboardCard
          title="Referral Reward Queue"
          value={
            rewardRows.length
              ? formatCurrency(pendingRewardTotal)
              : "No records yet"
          }
          subtext={`${pendingRewardRows.length} pending / review / scheduled rewards`}
          icon={<Sparkles className="h-5 w-5" />}
          tone="bg-violet-50 text-violet-600"
        />
        <DashboardCard
          title="Issued Rewards"
          value={
            rewardRows.length
              ? formatCurrency(issuedRewardTotal)
              : "No records yet"
          }
          subtext={`${issuedRewardRows.length} paid / credited rewards`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="bg-emerald-50 text-[#118a43]"
        />
        <DashboardCard
          title="Reward Records"
          value={rewardRows.length.toLocaleString()}
          subtext="PawPerks, Guru, Ambassador, and Partner reward rows"
          icon={<Users className="h-5 w-5" />}
          tone="bg-blue-50 text-blue-600"
        />
      </section>

      <section className="rounded-[1.75rem] border border-violet-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">
              Growth & Referral Payouts
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#111b33]">
              PawPerks and program rewards are now in the payout queue.
            </h2>
            <p className="mt-2 max-w-4xl text-sm font-medium leading-6 text-slate-500">
              This page now reads referral reward liabilities from Supabase and
              places pending rewards into the payout review workflow while
              keeping issued rewards visible for accounting and reconciliation
              review.
            </p>
          </div>

          <Link
            href="/admin/referrals"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-black text-violet-700 transition hover:bg-violet-100"
          >
            Open Growth & Referrals
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {pendingRewardRows.slice(0, 4).map((row) => (
            <div
              key={`reward-${row.id}`}
              className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-[#111b33]">{row.name}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {row.batch}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${getStatusBadgeStyles(
                    row.status,
                  )}`}
                >
                  {getStatusLabel(row.status)}
                </span>
              </div>
              <p className="mt-3 text-xl font-black text-[#111b33]">
                {formatCurrency(row.amount)}
              </p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                {row.notes}
              </p>
            </div>
          ))}

          {!pendingRewardRows.length ? (
            <div className="rounded-2xl border border-dashed border-violet-100 bg-violet-50/40 p-5 text-center md:col-span-2 xl:col-span-4">
              <p className="text-sm font-bold text-slate-500">
                No pending referral rewards found yet.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-12">
        <div className="rounded-[1.75rem] border border-[#e6eee2] bg-white p-5 shadow-sm sm:p-6 xl:col-span-8">
          <form action="/admin/payouts" className="space-y-4">
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
                    Filter payout records by status, source, batch, location, or
                    recipient.
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
                  href="/admin/payouts"
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
                <option value="ready">Ready</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="review">Needs Review</option>
                <option value="failed">Failed</option>
                <option value="scheduled">Scheduled</option>
                <option value="missing_payout_method">
                  Missing Payout Method
                </option>
                <option value="stripe_restricted">Stripe Restricted</option>
                <option value="no_stripe_account">No Stripe Account</option>
              </select>

              <select
                name="source"
                defaultValue={params?.source || "all"}
                className="h-12 w-full rounded-2xl border border-[#e6eee2] bg-white px-4 text-sm font-semibold text-[#111b33] outline-none transition focus:border-[#b9d1b1] focus:ring-4 focus:ring-emerald-50"
              >
                <option value="all">Source: All</option>
                <option value="guru">Guru</option>
                <option value="partner">Partner</option>
                <option value="referral">Referral</option>
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
              label="Ready"
              amount={totalReady}
              count={readyCount}
              total={totalScheduled}
              colorClass="bg-emerald-400"
            />
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
                  {[
                    "Recipient",
                    "Source",
                    "Amount",
                    "Status",
                    "Payout Date",
                    "Reference",
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
                          {row.recipientHref ? (
                            <Link
                              href={row.recipientHref}
                              className="font-black text-[#111b33] underline decoration-emerald-200 underline-offset-4 transition hover:text-[#118a43]"
                            >
                              {row.name}
                            </Link>
                          ) : (
                            <p className="font-black text-[#111b33]">
                              {row.name}
                            </p>
                          )}
                          <p className="text-sm font-medium text-slate-500">
                            {row.email}
                          </p>
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
                      <p className="font-black text-[#111b33]">
                        {formatCurrency(row.amount)}
                      </p>
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
                      <p className="font-black text-[#111b33]">
                        {formatDate(row.payoutDate)}
                      </p>
                    </td>

                    <td className="px-5 py-4 align-top">
                      <p className="font-mono text-sm font-semibold text-slate-500">
                        {row.reference}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {row.relatedHref ? (
                          <Link
                            href={row.relatedHref}
                            className="text-xs font-black text-[#118a43] underline decoration-emerald-200 underline-offset-4"
                          >
                            Related record
                          </Link>
                        ) : null}
                        {row.stripeHref ? (
                          <a
                            href={row.stripeHref}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-black text-[#118a43] underline decoration-emerald-200 underline-offset-4"
                          >
                            Stripe
                          </a>
                        ) : null}
                      </div>
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
                        Adjust your filters or reset to view all payout
                        activity.
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
                <p className="text-sm font-black text-amber-900">
                  Manual review queue
                </p>
                <p className="mt-1 text-xs font-semibold text-amber-800">
                  {reviewCount} payouts need review.
                </p>
              </div>

              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-black text-red-900">
                  Failed transfers
                </p>
                <p className="mt-1 text-xs font-semibold text-red-800">
                  {failedCount} payout exceptions found.
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-black text-emerald-900">
                  Accounting ready
                </p>
                <p className="mt-1 text-xs font-semibold text-emerald-800">
                  References, notes, batches, and payout statuses are grouped
                  for review.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
