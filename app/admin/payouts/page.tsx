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
import { getFinanceAdminIdentity } from "@/lib/admin/financials/access";
import PayoutReleaseButton from "@/app/admin/payouts/PayoutReleaseButton";
import CreateManualGuruPayoutForm, {
  type ManualPayoutRecipientOption,
  type ManualPayoutType,
} from "@/app/admin/payouts/CreateManualGuruPayoutForm";

export const dynamic = "force-dynamic";

type SafeRow = Record<string, unknown>;
type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type PayoutStatus = "ready" | "pending" | "processing" | "paid" | "review" | "failed" | "scheduled";
type PayoutSource = "Guru" | "Ambassador" | "Partner" | "Referral" | "PawPerks" | "Platform" | "Refund" | "Adjustment";

type PayoutQueueRow = {
  id: string;
  source: PayoutSource;
  ledgerSource: string;
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
  canRelease: boolean;
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

function normalizeLookupId(value: string) {
  return value.trim().toLowerCase();
}

type RecipientInfo = {
  name: string;
  email: string;
};

function buildRecipientDirectory(gurus: SafeRow[], profiles: SafeRow[]) {
  const directory = new Map<string, RecipientInfo>();

  const upsert = (rawId: string, name: string, email: string) => {
    if (!rawId) return;

    const id = normalizeLookupId(rawId);
    const existing = directory.get(id);
    const nextName = name || existing?.name || "";
    const nextEmail = email || existing?.email || "";

    if (!nextName && !nextEmail) return;
    directory.set(id, { name: nextName, email: nextEmail });
  };

  for (const profile of profiles) {
    upsert(
      getFirst(profile, ["id", "user_id"]),
      getFirst(profile, ["full_name", "display_name", "name"]),
      getFirst(profile, ["email"]),
    );
  }

  for (const guru of gurus) {
    const name = getFirst(guru, ["display_name", "full_name", "name"]);
    const email = getFirst(guru, ["email"]);
    upsert(getFirst(guru, ["id"]), name, email);
    upsert(getFirst(guru, ["user_id"]), name, email);
    upsert(getFirst(guru, ["profile_id"]), name, email);
  }

  return directory;
}

function lookupRecipient(
  directory: Map<string, RecipientInfo>,
  row: SafeRow,
  idKeys: string[],
) {
  for (const key of idKeys) {
    const id = getFirst(row, [key]);
    if (!id) continue;

    const match = directory.get(normalizeLookupId(id));
    if (match?.name || match?.email) return match;
  }

  return null;
}

function applyRecipientFields(
  row: SafeRow,
  directory: Map<string, RecipientInfo>,
  idKeys: string[],
): SafeRow {
  const match = lookupRecipient(directory, row, idKeys);
  if (!match) return row;

  const name = match.name || "Unknown recipient";
  const email = match.email || "";

  return {
    ...row,
    recipient_name: name,
    recipient_email: email,
    guru_name: name,
    guru_email: email,
    name,
    full_name: name,
    display_name: name,
    email: email || getFirst(row, ["email"]),
  };
}

function getNumber(row: SafeRow, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = row[key];
    const parsed = Number(value);

    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  return fallback;
}

function getAmountDollars(
  row: SafeRow,
  dollarKeys: string[],
  centKeys: string[] = [],
  amountInCents = false,
) {
  const fromCents = getNumber(row, centKeys);
  if (fromCents > 0) return fromCents / 100;

  const raw = getNumber(row, dollarKeys);
  if (raw <= 0) return 0;
  if (amountInCents) return raw / 100;
  return raw;
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
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value || 0));

  return value < 0 ? `(${formatted})` : formatted;
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

async function safeSelect(table: string, query = "*", limit = 1500): Promise<SafeRow[]> {
  try {
    const { data, error } = await supabaseAdmin.from(table).select(query).limit(limit);

    if (error || !data) return [];

    return Array.isArray(data) ? (data as unknown as SafeRow[]) : [];
  } catch {
    return [];
  }
}

function mapBookingRows(
  rows: SafeRow[],
  bookingPaymentsByBooking: Map<string, SafeRow>,
): PayoutQueueRow[] {
  return rows
    .map((row, index) => {
      const id = getFirst(row, ["id", "booking_id", "uid"], `booking-${index}`);
      const bookingPayment = bookingPaymentsByBooking.get(id);
      const amount =
        getAmountDollars(
          bookingPayment || {},
          ["guru_net_amount", "provider_amount", "amount"],
          [
            "guru_net_amount_cents",
            "provider_amount_cents",
            "amount_cents",
            "marketplace_support_cents",
          ],
        ) ||
        getAmountDollars(
          row,
          [
            "guru_estimated_total_payout",
            "guru_estimated_base_payout",
            "guru_payout_amount",
            "guru_net_amount",
            "provider_amount",
            "payout_amount",
            "guru_amount",
          ],
          [
            "guru_estimated_total_payout_cents",
            "guru_payout_amount_cents",
            "guru_net_amount_cents",
            "payout_amount_cents",
          ],
        );

      if (amount <= 0) return null;

      const status = normalizeStatus(
        getFirst(
          bookingPayment || {},
          ["payout_status", "status"],
          getFirst(row, ["payout_status", "guru_payout_status", "payment_status", "status"], "pending"),
        ),
      );

      return {
        id,
        source: "Guru" as PayoutSource,
        ledgerSource: bookingPayment ? "booking_payments" : "bookings",
        recipientName: getFirst(row, ["recipient_name", "guru_name", "display_name", "full_name", "name", "sitter_name", "provider_name"], "Guru payout"),
        recipientEmail: getFirst(row, ["recipient_email", "guru_email", "email", "sitter_email", "provider_email"], "No email on file"),
        amount,
        status,
        reference: getFirst(row, ["stripe_transfer_id", "transfer_id", "stripe_payout_id", "payment_intent_id", "stripe_session_id", "stripe_checkout_session_id", "uid", "id"], "No reference"),
        batch: getFirst(row, ["payout_batch", "batch_name", "batch"], "Bookings / Guru payouts"),
        bookingId: id,
        paymentStatus: getFirst(
          bookingPayment || {},
          ["status", "payment_status"],
          getFirst(row, ["payment_status", "stripe_status", "checkout_status"], "Not listed"),
        ),
        payoutStatus: getFirst(row, ["payout_status", "guru_payout_status"], status),
        notes: bookingPayment
          ? "Booking payout calibrated with booking_payments Stripe truth."
          : getFirst(row, ["payout_notes", "notes", "memo"], "Booking payout generated from completed or payable care."),
        createdAt: getFirst(row, ["completed_at", "scheduled_payout_at", "booking_date", "created_at", "updated_at"], "") || null,
        href: `/admin/bookings?booking=${encodeURIComponent(id)}`,
        canRelease: false,
      };
    })
    .filter(Boolean) as PayoutQueueRow[];
}

function mapGenericRows(
  rows: SafeRow[],
  fallbackSource: PayoutSource,
  defaultBatch: string,
  ledgerSource: string,
  options?: { amountInCents?: boolean; canRelease?: boolean },
): PayoutQueueRow[] {
  const amountInCents = options?.amountInCents === true;
  const canRelease = options?.canRelease === true;

  return rows
    .map((row, index) => {
      const amount = getAmountDollars(
        row,
        [
          "amount",
          "payout_amount",
          "commission_amount",
          "reward_amount",
          "credit_amount",
          "total_amount",
          "net_amount",
          "normalized_amount",
        ],
        [
          "amount_cents",
          "payout_amount_cents",
          "commission_amount_cents",
          "reward_amount_cents",
          "net_amount_cents",
          "guru_net_amount_cents",
        ],
        amountInCents,
      );

      if (amount <= 0) return null;

      const source = normalizeSource(
        getFirst(row, ["source", "type", "category", "reward_type", "financial_category", "program_type", "payout_type"], fallbackSource),
        fallbackSource,
      );
      const status = normalizeStatus(getFirst(row, ["status", "payout_status", "reward_status", "normalized_status", "financial_treatment"], "pending"));
      const id = getFirst(row, ["id", "payout_id", "referral_reward_id", "referral_code_id"], `${defaultBatch}-${index}`);
      const bookingId = getFirst(row, ["booking_id", "bookingId"], "");

      const href =
        source === "Referral" || source === "PawPerks"
          ? "/admin/referrals"
          : source === "Partner" || source === "Ambassador"
            ? "/admin/financials/commissions"
            : bookingId
              ? `/admin/bookings?booking=${encodeURIComponent(bookingId)}`
              : "/admin/financials/commissions";

      return {
        id,
        source,
        ledgerSource,
        recipientName: getFirst(row, ["recipient_name", "guru_name", "ambassador_name", "partner_name", "customer_name", "referrer_name", "display_name", "full_name", "name"], `${source} payout`),
        recipientEmail: getFirst(row, ["recipient_email", "guru_email", "ambassador_email", "partner_email", "customer_email", "referrer_email", "email"], "No email on file"),
        amount,
        status,
        reference: getFirst(row, ["transaction_reference", "stripe_transfer_id", "stripe_payout_id", "reference", "referral_code", "id"], "No reference"),
        batch: getFirst(row, ["batch_name", "batch", "payout_batch"], defaultBatch),
        bookingId,
        paymentStatus: getFirst(row, ["payment_status", "stripe_status"], "Not listed"),
        payoutStatus: getFirst(row, ["payout_status", "status", "reward_status", "normalized_status"], status),
        notes: getFirst(row, ["notes", "memo", "description", "financial_treatment"], `${source} payout row from ${ledgerSource}.`),
        createdAt: getFirst(row, ["payout_date", "scheduled_for", "paid_at", "credited_at", "created_at", "updated_at"], "") || null,
        href,
        canRelease:
          canRelease &&
          ["ready", "pending", "scheduled", "processing"].includes(status),
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

async function getManualPayoutRecipients(): Promise<ManualPayoutRecipientOption[]> {
  const [guruRows, ambassadorRows, partnerRows] = await Promise.all([
    safeSelect(
      "gurus",
      "id, user_id, profile_id, display_name, full_name, name, email, stripe_account_id, stripe_connect_account_id, connected_account_id",
      5000,
    ),
    safeSelect(
      "ambassadors",
      "id, user_id, display_name, full_name, email, status",
      5000,
    ),
    safeSelect(
      "partners",
      "id, owner_user_id, business_name, contact_name, email, status",
      5000,
    ),
  ]);

  const mapRecipient = (
    row: SafeRow,
    type: ManualPayoutType,
    nameKeys: string[],
    idKeys: string[],
    userIdKeys: string[],
    stripeKeys: string[] = [],
  ): ManualPayoutRecipientOption | null => {
    const id = getFirst(row, idKeys);
    if (!id) return null;

    return {
      id,
      type,
      name: getFirst(row, nameKeys, type === "partner" ? "Partner" : "Recipient"),
      email: getFirst(row, ["email"], ""),
      userId: getFirst(row, userIdKeys) || undefined,
      stripeAccountId: stripeKeys.length
        ? getFirst(row, stripeKeys) || undefined
        : undefined,
    };
  };

  const gurus = guruRows
    .map((row) =>
      mapRecipient(
        row,
        "guru",
        ["display_name", "full_name", "name"],
        ["id"],
        ["user_id"],
        ["stripe_account_id", "stripe_connect_account_id", "connected_account_id"],
      ),
    )
    .filter(Boolean) as ManualPayoutRecipientOption[];

  const ambassadors = ambassadorRows
    .map((row) =>
      mapRecipient(
        row,
        "ambassador",
        ["display_name", "full_name", "name"],
        ["id"],
        ["user_id"],
      ),
    )
    .filter(Boolean) as ManualPayoutRecipientOption[];

  const partners = partnerRows
    .map((row) =>
      mapRecipient(
        row,
        "partner",
        ["business_name", "contact_name", "name"],
        ["id"],
        ["owner_user_id"],
      ),
    )
    .filter(Boolean) as ManualPayoutRecipientOption[];

  // PawPerks + Referrals can pay any of the network roles above.
  const rewardPool = [...gurus, ...ambassadors, ...partners].flatMap(
    (recipient) => {
      const base = {
        id: recipient.id,
        name: recipient.name,
        email: recipient.email,
        userId: recipient.userId,
        stripeAccountId: recipient.stripeAccountId,
      };

      return [
        { ...base, type: "pawperks" as const },
        { ...base, type: "referral" as const },
      ];
    },
  );

  return [...gurus, ...ambassadors, ...partners, ...rewardPool].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

async function getPayoutRows() {
  const [
    bookingRows,
    bookingPaymentRows,
    guruPayoutRows,
    partnerPayoutRows,
    payoutRows,
    commissionRows,
    partnerCommissionRows,
    financialPayoutRows,
    adminPayoutRows,
    referralRewardRows,
    stripeTransferRows,
    stripePayoutRows,
    guruRows,
    profileRows,
  ] = await Promise.all([
    safeSelect("bookings"),
    safeSelect("booking_payments", "*", 5000),
    safeSelect("guru_payouts"),
    safeSelect("partner_payouts"),
    safeSelect("payouts"),
    safeSelect("commissions"),
    safeSelect("partner_commissions"),
    safeSelect("financial_payouts"),
    safeSelect("admin_payouts"),
    safeSelect("admin_referral_reward_liability"),
    safeSelect("stripe_transfers"),
    safeSelect("stripe_payouts"),
    safeSelect(
      "gurus",
      "id, user_id, profile_id, display_name, full_name, name, email",
      5000,
    ),
    safeSelect("profiles", "id, full_name, display_name, name, email", 5000),
  ]);

  const recipientDirectory = buildRecipientDirectory(guruRows, profileRows);

  const bookingPaymentsByBooking = new Map<string, SafeRow>();
  for (const row of bookingPaymentRows) {
    const bookingId = getFirst(row, ["booking_id", "bookingId"]);
    if (bookingId && !bookingPaymentsByBooking.has(bookingId)) {
      bookingPaymentsByBooking.set(bookingId, row);
    }
  }

  const recipientIdKeys = [
    "guru_id",
    "user_id",
    "recipient_id",
    "ambassador_id",
    "partner_id",
    "profile_id",
    "sitter_id",
    "provider_id",
  ];

  const withRecipients = (rows: SafeRow[]) =>
    rows.map((row) => applyRecipientFields(row, recipientDirectory, recipientIdKeys));

  return {
    rows: dedupeRows([
      ...mapBookingRows(withRecipients(bookingRows), bookingPaymentsByBooking),
      ...mapGenericRows(withRecipients(guruPayoutRows), "Guru", "Guru payouts", "guru_payouts", {
        canRelease: true,
      }),
      ...mapGenericRows(withRecipients(partnerPayoutRows), "Partner", "Partner commissions", "partner_payouts"),
      ...mapGenericRows(withRecipients(payoutRows), "Platform", "Payout records", "payouts"),
      ...mapGenericRows(withRecipients(commissionRows), "Partner", "Commission ledger", "commissions"),
      ...mapGenericRows(
        withRecipients(partnerCommissionRows),
        "Partner",
        "Partner commission ledger",
        "partner_commissions",
      ),
      ...mapGenericRows(withRecipients(financialPayoutRows), "Platform", "Financial payouts", "financial_payouts"),
      ...mapGenericRows(withRecipients(adminPayoutRows), "Platform", "Admin payouts", "admin_payouts"),
      ...mapGenericRows(
        withRecipients(referralRewardRows),
        "Referral",
        "Referral Rewards / PawPerks",
        "admin_referral_reward_liability",
      ),
      ...mapGenericRows(withRecipients(stripeTransferRows), "Platform", "Stripe transfers", "stripe_transfers", {
        amountInCents: true,
      }),
      ...mapGenericRows(withRecipients(stripePayoutRows), "Platform", "Stripe payouts", "stripe_payouts", {
        amountInCents: true,
      }),
    ]).sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    }),
    sourceCounts: {
      bookings: bookingRows.length,
      bookingPayments: bookingPaymentRows.length,
      guruPayouts: guruPayoutRows.length,
      partnerPayouts: partnerPayoutRows.length,
      payouts: payoutRows.length,
      commissions: commissionRows.length,
      partnerCommissions: partnerCommissionRows.length,
      referralRewards: referralRewardRows.length,
      stripePayouts: stripePayoutRows.length,
    },
  };
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

export default async function AdminPayoutsPage() {
  const actor = await getFinanceAdminIdentity();

  if (!actor) {
    return (
      <div className="min-h-screen bg-[#f7fbf8] px-6 py-10 text-slate-950">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-rose-100 bg-white p-8 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-rose-700">
            Access Restricted
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
            Financial access required.
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            Sign in with a finance-enabled admin account to manage SitGuru
            payouts.
          </p>
        </div>
      </div>
    );
  }

  const { rows, sourceCounts } = await getPayoutRows();
  const manualPayoutRecipients = await getManualPayoutRecipients();
  const summary = buildSummary(rows);
  const pendingRows = rows.filter((row) => ["ready", "pending", "processing", "scheduled"].includes(row.status));
  const reviewRows = rows.filter((row) => row.status === "review" || row.status === "failed");
  const referralRows = rows.filter((row) => row.source === "Referral" || row.source === "PawPerks");
  const releasableRows = pendingRows.filter((row) => row.canRelease);
  const recentRows = rows.slice(0, 12);
  const crystalOption =
    manualPayoutRecipients.find(
      (recipient) =>
        recipient.type === "guru" &&
        /crystal/i.test(`${recipient.name} ${recipient.email}`),
    ) || null;

  return (
    <main className="min-h-screen bg-[#f7fbf8] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <section className="grid gap-5 xl:grid-cols-[1.55fr_0.9fr]">
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm lg:p-8">
            <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-600">
              <Link href="/admin" className="text-emerald-800 hover:text-emerald-900">Admin</Link>
              <span>/</span>
              <Link href="/admin/financials" className="text-emerald-800 hover:text-emerald-900">Financials</Link>
              <span>/</span>
              <span className="text-slate-950">Payout Dashboard</span>
            </div>

            <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
                  Live Stripe + Ledger Payouts
                </span>
                <h1 className="mt-4 max-w-5xl text-5xl font-black tracking-[-0.05em] text-slate-950 lg:text-7xl">
                  Payout Dashboard
                </h1>
                <p className="mt-4 max-w-4xl text-base font-semibold leading-8 text-slate-700">
                  Manage Guru payouts, partner commissions, Ambassador rewards, PawPerks,
                  referral liabilities, Stripe transfers, and release-ready guru_payouts rows.
                  Amounts prefer cents fields and booking_payments Stripe truth when present.
                </p>
              </div>

              <div className="grid min-w-[260px] gap-3">
                <Link href="/admin/payments" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800">
                  Open Payments <CreditCard className="h-4 w-4" />
                </Link>
                <Link href="/admin/financials/commissions" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-800 transition hover:bg-emerald-50">
                  Commissions Analytics <TrendingUp className="h-4 w-4" />
                </Link>
                <Link href="/api/admin/financials/payouts/export?format=csv" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-black text-slate-800 transition hover:bg-white">
                  Export CSV <Download className="h-4 w-4" />
                </Link>
                <Link href="/api/admin/financials/payouts/export?format=json" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-black text-slate-800 transition hover:bg-white">
                  Export JSON <Download className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">Ready / Pending</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{formatCurrency(summary.readyToPay)}</p>
                <p className="mt-1 text-sm font-bold text-slate-700">{summary.pendingCount} payout row(s) · {releasableRows.length} release-ready</p>
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
                    Review pending rows, dry-run then release Guru payouts through Stripe Connect, and reconcile deposits in NFCU.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <Link href="/admin/financials/commissions" className="inline-flex items-center justify-between rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800">
                  Open commissions analytics <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/admin/referrals" className="inline-flex items-center justify-between rounded-2xl border border-purple-200 bg-purple-50 px-5 py-3 text-sm font-black text-purple-800 transition hover:bg-purple-100">
                  Review referral rewards <Gift className="h-4 w-4" />
                </Link>
                <Link href="/admin/financials/reconciliation" className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-50">
                  Reconcile deposits <RefreshCw className="h-4 w-4" />
                </Link>
                <Link href="/admin/financials/tax-reports/1099" className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-50">
                  1099 tax support <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/admin/financials/payment-gateway" className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-50">
                  Stripe balances <CreditCard className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-100 bg-amber-50 p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">Live-data note</p>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                Release actions only apply to `guru_payouts` rows. If a section shows zero, no matching live rows were found for that source.
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

        <CreateManualGuruPayoutForm
          recipients={manualPayoutRecipients}
          defaultRecipientId={crystalOption?.id || ""}
          defaultGuruId={crystalOption?.id || ""}
          defaultAmount={25}
          defaultPayoutType="guru"
          defaultReason="Thank you for joining SitGuru!"
        />

        <section className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm lg:p-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Live payout queue</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Pending transfers and payable rows</h2>
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
                        <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRows.slice(0, 20).map((row) => (
                        <tr key={`${row.ledgerSource}-${row.source}-${row.id}`} className="border-t border-slate-100">
                          <td className="px-5 py-4">
                            <p className="font-black text-slate-950">{row.recipientName}</p>
                            {row.recipientEmail && row.recipientEmail !== "No email on file" ? (
                              <p className="text-xs font-bold text-slate-500">{row.recipientEmail}</p>
                            ) : (
                              <p className="text-xs font-bold text-slate-400">No email on file</p>
                            )}
                            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">{row.ledgerSource}</p>
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
                            <div className="flex flex-col gap-2">
                              <Link href={row.href} className="inline-flex w-fit rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-black text-emerald-800 hover:bg-emerald-50">Open</Link>
                              {row.canRelease ? (
                                <PayoutReleaseButton
                                  payoutId={row.id}
                                  amountLabel={formatCurrency(row.amount)}
                                />
                              ) : null}
                            </div>
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
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Use this table to confirm whether the page is actually reading your SitGuru data.</p>
            </div>
            <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black text-slate-700">
              {rows.length} total live row(s)
            </span>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {recentRows.length > 0 ? (
              recentRows.map((row) => (
                <Link key={`${row.ledgerSource}-${row.source}-${row.id}-recent`} href={row.href} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${sourceBadgeClass(row.source)}`}>{row.source}</span>
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black capitalize ${statusBadgeClass(row.status)}`}>{row.status}</span>
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-slate-500">{row.ledgerSource}</span>
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

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm lg:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Referral / PawPerks</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Reward payout support</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                Pending and issued reward rows from admin_referral_reward_liability for CPA and growth review.
              </p>
            </div>
            <Link href="/admin/referrals" className="inline-flex w-fit items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-xs font-black text-purple-800 hover:bg-purple-100">
              Open Growth & Referrals <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {referralRows.slice(0, 9).map((row) => (
              <Link
                key={`${row.ledgerSource}-${row.id}-referral`}
                href={row.href}
                className="rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-950">{row.recipientName}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{row.source} · {row.status}</p>
                  </div>
                  <p className="font-black text-slate-950">{formatCurrency(row.amount)}</p>
                </div>
              </Link>
            ))}
            {referralRows.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50 p-5 text-center md:col-span-2 xl:col-span-3">
                <p className="text-sm font-bold text-slate-600">No referral reward payout rows found yet.</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm lg:p-8">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950">Supabase source coverage</h2>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                Live row counts powering this payout queue.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-5">
            {[
              ["Bookings", sourceCounts.bookings],
              ["Booking Payments", sourceCounts.bookingPayments],
              ["Guru Payouts", sourceCounts.guruPayouts],
              ["Partner Payouts", sourceCounts.partnerPayouts],
              ["Payouts", sourceCounts.payouts],
              ["Commissions", sourceCounts.commissions],
              ["Partner Commissions", sourceCounts.partnerCommissions],
              ["Referral Rewards", sourceCounts.referralRewards],
              ["Stripe Payouts", sourceCounts.stripePayouts],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl border border-emerald-100 bg-[#fbfefc] p-4">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{Number(value)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
