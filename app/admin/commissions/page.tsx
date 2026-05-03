import Link from "next/link";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Columns3,
  CreditCard,
  Download,
  Filter,
  HandCoins,
  LineChart,
  MoreHorizontal,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type DbRow = Record<string, unknown>;

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type SearchParamsShape = {
  q?: string;
  status?: string;
  source?: string;
  sort?: string;
  dir?: "asc" | "desc";
};

type SearchParamsInput = Promise<SearchParamsShape> | SearchParamsShape;

type CommissionStatus = "paid" | "unpaid" | "pending" | "held" | "failed";

type CommissionRow = {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  customerAvatarUrl: string;
  guruId: string;
  guruName: string;
  guruAvatarUrl: string;
  market: string;
  grossAmount: number;
  customerPaymentAmount: number;
  platformFee: number;
  partnerCommission: number;
  guruNet: number;
  refundAmount: number;
  paymentStatus: string;
  payoutStatus: string;
  ledgerStatus: CommissionStatus;
  service: string;
  createdAt: string;
  createdAtRaw: string;
  payoutDate: string;
  payoutDateRaw: string;
  href: string;
};

type TopGuruSummary = {
  guruId: string;
  guruName: string;
  guruAvatarUrl: string;
  gross: number;
  platformFee: number;
  partnerCommission: number;
  guruNet: number;
  bookings: number;
};

type MarketSummary = {
  label: string;
  amount: number;
  bookings: number;
};

type ActivityItem = {
  label: string;
  detail: string;
  amount: string;
  status: CommissionStatus | "captured" | "released" | "refunded";
  time: string;
  actorName: string;
  actorAvatarUrl: string;
  actorTone: "green" | "blue" | "purple" | "amber" | "red" | "slate";
};

type TrendPoint = {
  label: string;
  gross: number;
  fees: number;
  net: number;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function firstString(row: DbRow | undefined, keys: string[]) {
  if (!row) return "";

  for (const key of keys) {
    const value = asString(row[key]);

    if (value) return value;
  }

  return "";
}

function firstNumber(row: DbRow | undefined, keys: string[]) {
  if (!row) return 0;

  for (const key of keys) {
    const value = asNumber(row[key]);

    if (value > 0) return value;
  }

  return 0;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
}

function moneyShort(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

function calcPercent(value: number, total: number) {
  if (!total || total <= 0) return 0;
  return Math.max(0, Math.min(100, (value / total) * 100));
}

function barWidth(value: number, max: number, min = 4) {
  if (!max || max <= 0 || value <= 0) return 0;
  return Math.max(min, Math.min(100, (value / max) * 100));
}

function formatDateShort(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelativeTime(value?: string | null) {
  if (!value) return "Recently";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Admin commissions query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Admin commissions query skipped for ${label}:`, error);
    return [];
  }
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "SG";
}

function normalizeAvatarUrl(value: string) {
  if (!value) return "";

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:image") ||
    value.startsWith("/")
  ) {
    return value;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) return value;

  const cleanValue = value.replace(/^\/+/, "");

  if (cleanValue.startsWith("avatars/")) {
    return `${supabaseUrl}/storage/v1/object/public/${cleanValue}`;
  }

  if (cleanValue.startsWith("profile-photos/")) {
    return `${supabaseUrl}/storage/v1/object/public/${cleanValue}`;
  }

  if (cleanValue.startsWith("profiles/")) {
    return `${supabaseUrl}/storage/v1/object/public/${cleanValue}`;
  }

  if (cleanValue.startsWith("public/")) {
    return `${supabaseUrl}/storage/v1/object/${cleanValue}`;
  }

  return `${supabaseUrl}/storage/v1/object/public/avatars/${cleanValue}`;
}

function getAvatarUrl(...rows: Array<DbRow | undefined>) {
  const avatarKeys = [
    "avatar_url",
    "avatarUrl",
    "profile_image_url",
    "profileImageUrl",
    "profile_photo_url",
    "profilePhotoUrl",
    "photo_url",
    "photoUrl",
    "image_url",
    "imageUrl",
    "headshot_url",
    "headshotUrl",
    "picture",
    "picture_url",
    "pictureUrl",
    "logo_url",
    "logoUrl",
    "profile_picture",
    "profilePicture",
    "profile_picture_url",
    "profilePictureUrl",
    "customer_avatar_url",
    "guru_avatar_url",
  ];

  for (const row of rows) {
    const avatar = firstString(row, avatarKeys);

    if (avatar) return normalizeAvatarUrl(avatar);
  }

  return "";
}

function getAvatarToneClass(tone: "green" | "blue" | "purple" | "amber" | "red" | "slate") {
  if (tone === "blue") return "bg-blue-50 text-blue-700 ring-blue-100";
  if (tone === "purple") return "bg-violet-50 text-violet-700 ring-violet-100";
  if (tone === "amber") return "bg-amber-50 text-amber-700 ring-amber-100";
  if (tone === "red") return "bg-red-50 text-red-700 ring-red-100";
  if (tone === "slate") return "bg-slate-100 text-slate-700 ring-slate-200";

  return "bg-emerald-50 text-[#118a43] ring-emerald-100";
}

function AvatarBadge({
  name,
  subtitle,
  avatarUrl,
  tone = "green",
  size = "md",
}: {
  name: string;
  subtitle?: string;
  avatarUrl?: string;
  tone?: "green" | "blue" | "purple" | "amber" | "red" | "slate";
  size?: "sm" | "md" | "lg";
}) {
  const avatarSize =
    size === "lg" ? "h-12 w-12 text-base" : size === "sm" ? "h-9 w-9 text-xs" : "h-10 w-10 text-sm";

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl font-black ring-1 ${avatarSize} ${getAvatarToneClass(
          tone,
        )}`}
        aria-label={name}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={name}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          getInitials(name)
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate font-black text-[#163127]">{name}</p>
        {subtitle ? (
          <p className="truncate text-xs font-semibold text-slate-500">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

function getBookingId(booking: DbRow) {
  return firstString(booking, ["id", "booking_id", "bookingId"]) || "booking";
}

function getCustomerId(booking: DbRow) {
  return firstString(booking, [
    "customer_id",
    "customerId",
    "pet_parent_id",
    "pet_owner_id",
    "user_id",
    "owner_id",
  ]);
}

function getGuruId(booking: DbRow) {
  return firstString(booking, [
    "guru_id",
    "guruId",
    "sitter_id",
    "provider_id",
    "caregiver_id",
  ]);
}

function getCustomerName(booking: DbRow, customer?: DbRow, profile?: DbRow) {
  return (
    firstString(booking, [
      "customer_name",
      "pet_parent_name",
      "owner_name",
      "customer_email",
    ]) ||
    firstString(customer, ["full_name", "display_name", "name", "email"]) ||
    firstString(profile, ["full_name", "display_name", "name", "email"]) ||
    "Customer"
  );
}

function getGuruName(booking: DbRow, guru?: DbRow, profile?: DbRow) {
  return (
    firstString(booking, ["guru_name", "sitter_name", "provider_name"]) ||
    firstString(guru, ["display_name", "full_name", "name", "email"]) ||
    firstString(profile, ["display_name", "full_name", "name", "email"]) ||
    getGuruId(booking) ||
    "Guru"
  );
}

function getMarket(booking: DbRow, customer?: DbRow, profile?: DbRow) {
  const city =
    firstString(booking, ["city", "customer_city", "market", "location_city"]) ||
    firstString(customer, ["city", "market", "location_city"]) ||
    firstString(profile, ["city", "market", "location_city"]);

  const state =
    firstString(booking, ["state", "customer_state", "location_state"]) ||
    firstString(customer, ["state", "location_state"]) ||
    firstString(profile, ["state", "location_state"]);

  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;

  return "Unknown";
}

function getGrossAmount(booking: DbRow) {
  return firstNumber(booking, [
    "gross_amount",
    "subtotal_amount",
    "total_amount",
    "amount",
    "price",
    "booking_amount",
    "total",
  ]);
}

function getPaymentAmount(payment?: DbRow, transaction?: DbRow, booking?: DbRow) {
  return (
    firstNumber(payment, [
      "amount",
      "payment_amount",
      "captured_amount",
      "gross_amount",
      "total_amount",
    ]) ||
    firstNumber(transaction, [
      "amount",
      "payment_amount",
      "captured_amount",
      "gross_amount",
      "total_amount",
    ]) ||
    getGrossAmount(booking || {})
  );
}

function getPlatformFee(booking: DbRow, payment?: DbRow, transaction?: DbRow) {
  const stored =
    firstNumber(booking, [
      "sitguru_fee_amount",
      "platform_fee",
      "platform_fee_amount",
      "service_fee",
      "sitguru_fee",
    ]) ||
    firstNumber(payment, [
      "platform_fee",
      "platform_fee_amount",
      "sitguru_fee_amount",
      "application_fee_amount",
    ]) ||
    firstNumber(transaction, [
      "platform_fee",
      "platform_fee_amount",
      "sitguru_fee_amount",
      "application_fee_amount",
    ]);

  if (stored > 0) return stored;

  const gross = getGrossAmount(booking);
  return gross > 0 ? gross * 0.08 : 0;
}

function getPartnerCommission(booking: DbRow, partnerPayout?: DbRow) {
  const stored =
    firstNumber(booking, [
      "partner_commission_amount",
      "affiliate_commission_amount",
      "ambassador_commission_amount",
      "referral_commission_amount",
      "commission_amount",
    ]) ||
    firstNumber(partnerPayout, [
      "amount",
      "payout_amount",
      "commission_amount",
      "partner_commission_amount",
    ]);

  if (stored > 0) return stored;

  const hasPartnerSource =
    firstString(booking, [
      "partner_id",
      "referral_code_id",
      "affiliate_id",
      "ambassador_id",
      "partner_code",
      "referral_code",
    ]) !== "";

  return hasPartnerSource ? getGrossAmount(booking) * 0.04 : 0;
}

function getRefundAmount(refund?: DbRow, dispute?: DbRow) {
  return (
    firstNumber(refund, ["amount", "refund_amount", "total_amount"]) ||
    firstNumber(dispute, ["amount", "dispute_amount", "chargeback_amount"]) ||
    0
  );
}

function getGuruNet(
  booking: DbRow,
  guruPayout?: DbRow,
  payment?: DbRow,
  transaction?: DbRow,
  partnerPayout?: DbRow,
  refund?: DbRow,
  dispute?: DbRow,
) {
  const stored =
    firstNumber(guruPayout, ["amount", "payout_amount", "guru_net_amount", "net_amount"]) ||
    firstNumber(booking, ["guru_net_amount", "guru_payout_amount", "net_amount"]);

  if (stored > 0) return stored;

  const gross = getGrossAmount(booking);
  const platformFee = getPlatformFee(booking, payment, transaction);
  const partnerCommission = getPartnerCommission(booking, partnerPayout);
  const refundAmount = getRefundAmount(refund, dispute);

  return Math.max(0, gross - platformFee - partnerCommission - refundAmount);
}

function getPaymentStatus(booking: DbRow, payment?: DbRow, transaction?: DbRow) {
  return (
    firstString(payment, ["status", "payment_status"]) ||
    firstString(transaction, ["status", "payment_status"]) ||
    firstString(booking, ["payment_status", "stripe_payment_status", "status"]) ||
    "pending"
  );
}

function getPayoutStatus(booking: DbRow, guruPayout?: DbRow, partnerPayout?: DbRow) {
  return (
    firstString(guruPayout, ["status", "payout_status"]) ||
    firstString(partnerPayout, ["status", "payout_status"]) ||
    firstString(booking, ["payout_status", "guru_payout_status"]) ||
    "pending"
  );
}

function getCreatedAt(row: DbRow) {
  return (
    firstString(row, ["created_at", "createdAt", "booking_date", "start_date", "updated_at"]) ||
    new Date().toISOString()
  );
}

function getPayoutDate(booking: DbRow, guruPayout?: DbRow, partnerPayout?: DbRow) {
  return (
    firstString(guruPayout, ["payout_date", "paid_at", "scheduled_for", "created_at"]) ||
    firstString(partnerPayout, ["payout_date", "paid_at", "scheduled_for", "created_at"]) ||
    firstString(booking, ["payout_date", "scheduled_payout_date"]) ||
    ""
  );
}

function getService(booking: DbRow) {
  return (
    firstString(booking, [
      "service",
      "service_name",
      "service_type",
      "booking_type",
      "care_type",
    ]) || "Pet Care"
  );
}

function isPaymentCaptured(status: string) {
  const normalized = status.toLowerCase();

  return (
    normalized.includes("paid") ||
    normalized.includes("captured") ||
    normalized.includes("complete") ||
    normalized.includes("succeeded")
  );
}

function isPayoutPaid(status: string) {
  const normalized = status.toLowerCase();

  return (
    normalized === "paid" ||
    normalized === "released" ||
    normalized === "complete" ||
    normalized === "completed" ||
    normalized.includes("paid") ||
    normalized.includes("released")
  );
}

function isPayoutHeld(status: string) {
  const normalized = status.toLowerCase();

  return (
    normalized.includes("hold") ||
    normalized.includes("held") ||
    normalized.includes("review") ||
    normalized.includes("flag")
  );
}

function normalizeLedgerStatus(paymentStatus: string, payoutStatus: string): CommissionStatus {
  const payment = paymentStatus.toLowerCase();
  const payout = payoutStatus.toLowerCase();

  if (
    payment.includes("failed") ||
    payment.includes("cancel") ||
    payout.includes("failed") ||
    payout.includes("error") ||
    payout.includes("declined")
  ) {
    return "failed";
  }

  if (isPayoutHeld(payoutStatus)) return "held";
  if (isPayoutPaid(payoutStatus)) return "paid";
  if (isPaymentCaptured(paymentStatus)) return "pending";

  return "unpaid";
}

function getTableBookingId(row: DbRow) {
  return firstString(row, ["booking_id", "bookingId"]);
}

function getLookupIds(row: DbRow) {
  return Array.from(
    new Set(
      [
        firstString(row, ["id"]),
        firstString(row, ["user_id"]),
        firstString(row, ["profile_id"]),
        firstString(row, ["customer_id"]),
        firstString(row, ["guru_id"]),
        firstString(row, ["auth_user_id"]),
        firstString(row, ["email"]).toLowerCase(),
      ].filter(Boolean),
    ),
  );
}

function buildByIdMap(rows: DbRow[]) {
  const map = new Map<string, DbRow>();

  for (const row of rows) {
    for (const id of getLookupIds(row)) {
      if (id && !map.has(id)) map.set(id, row);
    }
  }

  return map;
}

function buildByBookingMap(rows: DbRow[]) {
  const map = new Map<string, DbRow>();

  for (const row of rows) {
    const bookingId = getTableBookingId(row);

    if (bookingId && !map.has(bookingId)) {
      map.set(bookingId, row);
    }
  }

  return map;
}

function getStatusBadgeClasses(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "paid" || normalized === "released" || normalized.includes("paid")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (normalized.includes("captured")) {
    return "border-sky-200 bg-sky-50 text-sky-800";
  }

  if (
    normalized.includes("held") ||
    normalized.includes("hold") ||
    normalized.includes("review")
  ) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (normalized.includes("failed") || normalized.includes("chargeback")) {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (normalized.includes("pending") || normalized.includes("unpaid")) {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

function getStatusLabel(status: CommissionStatus | "captured" | "released" | "refunded") {
  if (status === "paid") return "Paid";
  if (status === "released") return "Released";
  if (status === "captured") return "Captured";
  if (status === "refunded") return "Refunded";
  if (status === "pending") return "Pending";
  if (status === "held") return "Held";
  if (status === "failed") return "Failed";
  return "Unpaid";
}

function buildQuery(params: SearchParamsShape, changes: Partial<SearchParamsShape>) {
  const next = {
    q: params.q || "",
    status: params.status || "all",
    source: params.source || "all",
    sort: params.sort || "createdAt",
    dir: params.dir || "desc",
    ...changes,
  };

  const query = new URLSearchParams();

  Object.entries(next).forEach(([key, value]) => {
    if (value && String(value).length > 0) {
      query.set(key, String(value));
    }
  });

  return `/admin/commissions?${query.toString()}`;
}

function filterRows(rows: CommissionRow[], params: SearchParamsShape) {
  const q = String(params.q || "").toLowerCase().trim();
  const status = String(params.status || "all").toLowerCase();
  const source = String(params.source || "all").toLowerCase();

  return rows.filter((row) => {
    const searchable = [
      row.bookingId,
      row.customerName,
      row.guruName,
      row.market,
      row.service,
      row.paymentStatus,
      row.payoutStatus,
      row.ledgerStatus,
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = q ? searchable.includes(q) : true;
    const matchesStatus = status === "all" ? true : row.ledgerStatus === status;

    const matchesSource =
      source === "all"
        ? true
        : source === "platform"
          ? row.platformFee > 0
          : source === "partner"
            ? row.partnerCommission > 0
            : source === "guru"
              ? row.guruNet > 0
              : source === "refund"
                ? row.refundAmount > 0
                : true;

    return matchesSearch && matchesStatus && matchesSource;
  });
}

function sortRows(rows: CommissionRow[], sort = "createdAt", dir: "asc" | "desc" = "desc") {
  return [...rows].sort((a, b) => {
    let aValue: string | number = 0;
    let bValue: string | number = 0;

    if (sort === "booking") {
      aValue = a.bookingId.toLowerCase();
      bValue = b.bookingId.toLowerCase();
    } else if (sort === "customer") {
      aValue = a.customerName.toLowerCase();
      bValue = b.customerName.toLowerCase();
    } else if (sort === "guru") {
      aValue = a.guruName.toLowerCase();
      bValue = b.guruName.toLowerCase();
    } else if (sort === "market") {
      aValue = a.market.toLowerCase();
      bValue = b.market.toLowerCase();
    } else if (sort === "gross") {
      aValue = a.grossAmount;
      bValue = b.grossAmount;
    } else if (sort === "fee") {
      aValue = a.platformFee;
      bValue = b.platformFee;
    } else if (sort === "partner") {
      aValue = a.partnerCommission;
      bValue = b.partnerCommission;
    } else if (sort === "net") {
      aValue = a.guruNet;
      bValue = b.guruNet;
    } else if (sort === "status") {
      aValue = a.ledgerStatus;
      bValue = b.ledgerStatus;
    } else {
      aValue = a.createdAtRaw ? new Date(a.createdAtRaw).getTime() : 0;
      bValue = b.createdAtRaw ? new Date(b.createdAtRaw).getTime() : 0;
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return dir === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return dir === "asc"
      ? Number(aValue) - Number(bValue)
      : Number(bValue) - Number(aValue);
  });
}

function buildAnnualTrendPoints(rows: CommissionRow[]) {
  const points: TrendPoint[] = [];

  for (let month = 0; month < 12; month += 1) {
    const label = new Date(2026, month, 1).toLocaleDateString("en-US", {
      month: "short",
    });

    const matchingRows = rows.filter((row) => {
      if (!row.createdAtRaw) return false;

      const rowDate = new Date(row.createdAtRaw);
      if (Number.isNaN(rowDate.getTime())) return false;

      return rowDate.getFullYear() === 2026 && rowDate.getMonth() === month;
    });

    points.push({
      label,
      gross: matchingRows.reduce((sum, row) => sum + row.grossAmount, 0),
      fees: matchingRows.reduce((sum, row) => sum + row.platformFee, 0),
      net: matchingRows.reduce((sum, row) => sum + row.guruNet, 0),
    });
  }

  return points;
}

async function getCommissionData() {
  const [
    bookings,
    guruPayouts,
    partnerPayouts,
    payments,
    transactions,
    refunds,
    disputes,
    gurus,
    customers,
    profiles,
  ] = await Promise.all([
    safeRows<DbRow>(supabaseAdmin.from("bookings").select("*").limit(1000), "bookings"),
    safeRows<DbRow>(
      supabaseAdmin.from("guru_payouts").select("*").limit(1000),
      "guru_payouts",
    ),
    safeRows<DbRow>(
      supabaseAdmin.from("partner_payouts").select("*").limit(1000),
      "partner_payouts",
    ),
    safeRows<DbRow>(supabaseAdmin.from("payments").select("*").limit(1000), "payments"),
    safeRows<DbRow>(
      supabaseAdmin.from("transactions").select("*").limit(1000),
      "transactions",
    ),
    safeRows<DbRow>(supabaseAdmin.from("refunds").select("*").limit(1000), "refunds"),
    safeRows<DbRow>(supabaseAdmin.from("disputes").select("*").limit(1000), "disputes"),
    safeRows<DbRow>(supabaseAdmin.from("gurus").select("*").limit(1000), "gurus"),
    safeRows<DbRow>(supabaseAdmin.from("customers").select("*").limit(1000), "customers"),
    safeRows<DbRow>(supabaseAdmin.from("profiles").select("*").limit(1000), "profiles"),
  ]);

  const guruMap = buildByIdMap(gurus);
  const customerMap = buildByIdMap(customers);
  const profileMap = buildByIdMap(profiles);
  const guruPayoutMap = buildByBookingMap(guruPayouts);
  const partnerPayoutMap = buildByBookingMap(partnerPayouts);
  const paymentMap = buildByBookingMap(payments);
  const transactionMap = buildByBookingMap(transactions);
  const refundMap = buildByBookingMap(refunds);
  const disputeMap = buildByBookingMap(disputes);

  const commissionRows: CommissionRow[] = bookings.map((booking, index) => {
    const bookingId = getBookingId(booking);
    const customerId = getCustomerId(booking);
    const guruId = getGuruId(booking);

    const customer = customerMap.get(customerId);
    const customerProfile = profileMap.get(customerId);
    const guru = guruMap.get(guruId);
    const guruProfile = profileMap.get(guruId);

    const payment = paymentMap.get(bookingId);
    const transaction = transactionMap.get(bookingId);
    const guruPayout = guruPayoutMap.get(bookingId);
    const partnerPayout = partnerPayoutMap.get(bookingId);
    const refund = refundMap.get(bookingId);
    const dispute = disputeMap.get(bookingId);

    const grossAmount = getGrossAmount(booking);
    const customerPaymentAmount = getPaymentAmount(payment, transaction, booking);
    const platformFee = getPlatformFee(booking, payment, transaction);
    const partnerCommission = getPartnerCommission(booking, partnerPayout);
    const refundAmount = getRefundAmount(refund, dispute);
    const guruNet = getGuruNet(
      booking,
      guruPayout,
      payment,
      transaction,
      partnerPayout,
      refund,
      dispute,
    );

    const paymentStatus = getPaymentStatus(booking, payment, transaction);
    const payoutStatus = getPayoutStatus(booking, guruPayout, partnerPayout);
    const createdAtRaw = getCreatedAt(booking);
    const payoutDateRaw = getPayoutDate(booking, guruPayout, partnerPayout);

    return {
      id: `${bookingId}-${guruId || index}`,
      bookingId,
      customerId,
      customerName: getCustomerName(booking, customer, customerProfile),
      customerAvatarUrl: getAvatarUrl(booking, customer, customerProfile),
      guruId,
      guruName: getGuruName(booking, guru, guruProfile),
      guruAvatarUrl: getAvatarUrl(booking, guru, guruProfile),
      market: getMarket(booking, customer, customerProfile),
      grossAmount,
      customerPaymentAmount,
      platformFee,
      partnerCommission,
      guruNet,
      refundAmount,
      paymentStatus,
      payoutStatus,
      ledgerStatus: normalizeLedgerStatus(paymentStatus, payoutStatus),
      service: getService(booking),
      createdAt: formatDateShort(createdAtRaw),
      createdAtRaw,
      payoutDate: formatDateShort(payoutDateRaw),
      payoutDateRaw,
      href: `/admin/bookings?booking=${bookingId}`,
    };
  });

  const capturedRows = commissionRows.filter((row) => isPaymentCaptured(row.paymentStatus));
  const paidOutRows = commissionRows.filter((row) => isPayoutPaid(row.payoutStatus));
  const heldRows = commissionRows.filter((row) => row.ledgerStatus === "held");
  const failedRows = commissionRows.filter((row) => row.ledgerStatus === "failed");
  const pendingRows = commissionRows.filter((row) => row.ledgerStatus === "pending");
  const refundRows = commissionRows.filter((row) => row.refundAmount > 0);

  const grossSales = commissionRows.reduce((sum, row) => sum + row.grossAmount, 0);
  const capturedPayments = capturedRows.reduce(
    (sum, row) => sum + row.customerPaymentAmount,
    0,
  );
  const platformFees = commissionRows.reduce((sum, row) => sum + row.platformFee, 0);
  const partnerCommissions = commissionRows.reduce(
    (sum, row) => sum + row.partnerCommission,
    0,
  );
  const guruNetPayouts = commissionRows.reduce((sum, row) => sum + row.guruNet, 0);
  const refundAmount = commissionRows.reduce((sum, row) => sum + row.refundAmount, 0);
  const netReleased = paidOutRows.reduce((sum, row) => sum + row.guruNet, 0);
  const heldAmount = heldRows.reduce((sum, row) => sum + row.guruNet, 0);
  const failedAmount = failedRows.reduce((sum, row) => sum + row.guruNet, 0);
  const pendingAmount = pendingRows.reduce((sum, row) => sum + row.guruNet, 0);

  const topGuruMap = new Map<string, TopGuruSummary>();

  for (const row of commissionRows) {
    const key = row.guruId || row.guruName;

    const existing = topGuruMap.get(key) || {
      guruId: key,
      guruName: row.guruName,
      guruAvatarUrl: row.guruAvatarUrl,
      gross: 0,
      platformFee: 0,
      partnerCommission: 0,
      guruNet: 0,
      bookings: 0,
    };

    existing.gross += row.grossAmount;
    existing.platformFee += row.platformFee;
    existing.partnerCommission += row.partnerCommission;
    existing.guruNet += row.guruNet;
    existing.bookings += 1;

    if (!existing.guruAvatarUrl && row.guruAvatarUrl) {
      existing.guruAvatarUrl = row.guruAvatarUrl;
    }

    topGuruMap.set(key, existing);
  }

  const topGurus = Array.from(topGuruMap.values())
    .sort((a, b) => b.guruNet - a.guruNet)
    .slice(0, 5);

  const marketMap = new Map<string, MarketSummary>();

  for (const row of commissionRows) {
    const existing = marketMap.get(row.market) || {
      label: row.market,
      amount: 0,
      bookings: 0,
    };

    existing.amount += row.guruNet;
    existing.bookings += 1;

    marketMap.set(row.market, existing);
  }

  const topMarkets = Array.from(marketMap.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const activity: ActivityItem[] = [
    ...capturedRows.slice(0, 3).map((row) => ({
      label: `Payment captured from ${row.customerName}`,
      detail: `Booking ${row.bookingId}`,
      amount: money(row.customerPaymentAmount),
      status: "captured" as const,
      time: formatRelativeTime(row.createdAtRaw),
      actorName: row.customerName,
      actorAvatarUrl: row.customerAvatarUrl,
      actorTone: "blue" as const,
    })),
    ...paidOutRows.slice(0, 3).map((row) => ({
      label: `Payout released to ${row.guruName}`,
      detail: row.payoutDateRaw ? `Released ${row.payoutDate}` : "Guru net payout",
      amount: money(row.guruNet),
      status: "released" as const,
      time: formatRelativeTime(row.payoutDateRaw || row.createdAtRaw),
      actorName: row.guruName,
      actorAvatarUrl: row.guruAvatarUrl,
      actorTone: "green" as const,
    })),
    ...heldRows.slice(0, 2).map((row) => ({
      label: `Payout held for ${row.guruName}`,
      detail: "Needs manual review",
      amount: money(row.guruNet),
      status: "held" as const,
      time: formatRelativeTime(row.createdAtRaw),
      actorName: row.guruName,
      actorAvatarUrl: row.guruAvatarUrl,
      actorTone: "amber" as const,
    })),
    ...failedRows.slice(0, 2).map((row) => ({
      label: `Payout failed for ${row.guruName}`,
      detail: "Check payout destination or payment status",
      amount: money(row.guruNet),
      status: "failed" as const,
      time: formatRelativeTime(row.createdAtRaw),
      actorName: row.guruName,
      actorAvatarUrl: row.guruAvatarUrl,
      actorTone: "red" as const,
    })),
    ...refundRows.slice(0, 2).map((row) => ({
      label: `Refund recorded for ${row.customerName}`,
      detail: `Booking ${row.bookingId}`,
      amount: money(row.refundAmount),
      status: "refunded" as const,
      time: formatRelativeTime(row.createdAtRaw),
      actorName: row.customerName,
      actorAvatarUrl: row.customerAvatarUrl,
      actorTone: "purple" as const,
    })),
  ].slice(0, 8);

  return {
    rows: commissionRows,
    topGurus,
    topMarkets,
    maxGuruNet: Math.max(...topGurus.map((guru) => guru.guruNet), 1),
    maxMarket: Math.max(...topMarkets.map((market) => market.amount), 1),
    trendPoints: buildAnnualTrendPoints(commissionRows),
    activity,
    sourceCounts: {
      bookings: bookings.length,
      guruPayouts: guruPayouts.length,
      partnerPayouts: partnerPayouts.length,
      payments: payments.length,
      transactions: transactions.length,
      refunds: refunds.length,
      disputes: disputes.length,
    },
    totals: {
      bookings: commissionRows.length,
      capturedRows: capturedRows.length,
      releasedRows: paidOutRows.length,
      grossSales,
      capturedPayments,
      platformFees,
      partnerCommissions,
      guruNetPayouts,
      refundAmount,
      netReleased,
      heldAmount,
      failedAmount,
      pendingAmount,
      takeRate: grossSales ? (platformFees / grossSales) * 100 : 0,
      partnerRate: grossSales ? (partnerCommissions / grossSales) * 100 : 0,
      releaseRate: capturedRows.length
        ? (paidOutRows.length / capturedRows.length) * 100
        : 0,
    },
  };
}

function KpiCard({
  label,
  value,
  detail,
  icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-emerald-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-[#163127]">
            {value}
          </p>
          <p className="mt-2 text-xs font-bold text-[#118a43]">{detail}</p>
        </div>

        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tone}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function FlowCard({
  step,
  label,
  value,
  detail,
  icon,
  tone,
}: {
  step: string;
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <div className="min-w-[170px] flex-1 rounded-[1.4rem] border border-emerald-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tone}`}>
          {icon}
        </div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
            {step}
          </p>
          <p className="text-xs font-black text-[#163127]">{label}</p>
        </div>
      </div>

      <p className="mt-4 text-2xl font-black text-[#163127]">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p>
    </div>
  );
}

function SortHeader({
  label,
  sortKey,
  params,
}: {
  label: string;
  sortKey: string;
  params: SearchParamsShape;
}) {
  const active = (params.sort || "createdAt") === sortKey;
  const currentDirection = params.dir || "desc";
  const nextDirection = active && currentDirection === "desc" ? "asc" : "desc";

  return (
    <Link
      href={buildQuery(params, { sort: sortKey, dir: nextDirection })}
      className={`inline-flex items-center gap-1.5 transition hover:text-[#118a43] ${
        active ? "text-[#056b35]" : "text-slate-500"
      }`}
    >
      {label}
      {active ? (
        currentDirection === "desc" ? (
          <ArrowDown className="h-3.5 w-3.5" />
        ) : (
          <TrendingUp className="h-3.5 w-3.5 opacity-70" />
        )
      ) : (
        <TrendingUp className="h-3.5 w-3.5 opacity-40" />
      )}
    </Link>
  );
}

function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-[#163127]">Recent Live Activity</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Real payment, payout, commission, refund, and exception events.
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-[#118a43]">
          Live
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.length ? (
          items.map((item, index) => (
            <div
              key={`${item.label}-${index}`}
              className="rounded-2xl border border-emerald-50 bg-[#fbfefc] p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <AvatarBadge
                  name={item.actorName}
                  subtitle={item.detail}
                  avatarUrl={item.actorAvatarUrl}
                  tone={item.actorTone}
                  size="sm"
                />

                <div className="text-right">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-black ${getStatusBadgeClasses(
                      item.status,
                    )}`}
                  >
                    {getStatusLabel(item.status)}
                  </span>
                  <p className="mt-2 text-xs font-semibold text-slate-400">{item.time}</p>
                </div>
              </div>

              <p className="mt-3 text-sm font-black text-[#163127]">{item.label}</p>
              <p className="mt-2 text-sm font-black text-[#163127]">{item.amount}</p>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-emerald-100 p-6 text-center md:col-span-2 xl:col-span-4">
            <p className="text-sm font-bold text-slate-500">
              No payment or payout activity found from Supabase yet.
            </p>
          </div>
        )}
      </div>

      <Link
        href="/admin/activity-log"
        className="mt-4 inline-flex text-sm font-black text-[#118a43] hover:text-[#0c7338]"
      >
        View all activity →
      </Link>
    </div>
  );
}

function AnnualTrendChart({ points }: { points: TrendPoint[] }) {
  const chartWidth = 980;
  const chartHeight = 360;
  const leftPadding = 74;
  const rightPadding = 30;
  const topPadding = 34;
  const bottomPadding = 70;
  const plotWidth = chartWidth - leftPadding - rightPadding;
  const plotHeight = chartHeight - topPadding - bottomPadding;
  const maxValue = Math.max(
    ...points.flatMap((point) => [point.gross, point.fees, point.net]),
    1,
  );

  const valueToY = (value: number) =>
    topPadding + plotHeight - (value / maxValue) * plotHeight;

  const indexToX = (index: number) =>
    leftPadding + index * (plotWidth / Math.max(points.length - 1, 1));

  const polyPoints = (key: keyof TrendPoint) =>
    points
      .map((point, index) => {
        const value = typeof point[key] === "number" ? Number(point[key]) : 0;
        return `${indexToX(index)},${valueToY(value)}`;
      })
      .join(" ");

  const yTicks = [0, maxValue * 0.25, maxValue * 0.5, maxValue * 0.75, maxValue];

  return (
    <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black text-[#163127]">
              Sales, Fees & Net Payouts
            </h2>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-[#118a43]">
              Jan 1, 2026 – Dec 31, 2026
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Monthly gross sales, SitGuru platform fees, and Guru net payouts from Supabase.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 rounded-2xl border border-emerald-100 bg-[#fbfefc] px-3 py-2 text-xs font-bold text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#118a43]" />
            Gross sales
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            Net payouts
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
            Fees
          </span>
        </div>
      </div>

      <div className="h-[360px] overflow-hidden rounded-2xl border border-emerald-50 bg-gradient-to-b from-white to-[#f8fbf6] p-4">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-full w-full">
          <text
            x="20"
            y="178"
            fill="#64748b"
            fontSize="12"
            fontWeight="900"
            transform="rotate(-90 20 178)"
          >
            Amount in USD
          </text>

          <text
            x="520"
            y="342"
            fill="#64748b"
            fontSize="12"
            fontWeight="900"
            textAnchor="middle"
          >
            2026 calendar month
          </text>

          {yTicks.map((tick) => {
            const y = valueToY(tick);

            return (
              <g key={tick}>
                <line
                  x1={leftPadding}
                  y1={y}
                  x2={chartWidth - rightPadding}
                  y2={y}
                  stroke="#edf2e7"
                  strokeWidth="1"
                />
                <text
                  x={leftPadding - 12}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="11"
                  fontWeight="800"
                  textAnchor="end"
                >
                  {moneyShort(tick)}
                </text>
              </g>
            );
          })}

          <line
            x1={leftPadding}
            y1={topPadding}
            x2={leftPadding}
            y2={topPadding + plotHeight}
            stroke="#dbe7d5"
            strokeWidth="1.5"
          />
          <line
            x1={leftPadding}
            y1={topPadding + plotHeight}
            x2={chartWidth - rightPadding}
            y2={topPadding + plotHeight}
            stroke="#dbe7d5"
            strokeWidth="1.5"
          />

          <polyline
            fill="none"
            stroke="#118a43"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polyPoints("gross")}
          />
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polyPoints("net")}
          />
          <polyline
            fill="none"
            stroke="#fb923c"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polyPoints("fees")}
          />

          {points.map((point, index) => (
            <g key={`${point.label}-${index}`}>
              <circle
                cx={indexToX(index)}
                cy={valueToY(point.gross)}
                r="4.5"
                fill="#118a43"
                stroke="white"
                strokeWidth="2.5"
              />
              <circle
                cx={indexToX(index)}
                cy={valueToY(point.net)}
                r="4"
                fill="#3b82f6"
                stroke="white"
                strokeWidth="2"
              />
              <circle
                cx={indexToX(index)}
                cy={valueToY(point.fees)}
                r="3.5"
                fill="#fb923c"
                stroke="white"
                strokeWidth="2"
              />
            </g>
          ))}

          {points.map((point, index) => (
            <text
              key={point.label}
              x={indexToX(index)}
              y={topPadding + plotHeight + 26}
              fill="#64748b"
              fontSize="11"
              fontWeight="800"
              textAnchor="middle"
            >
              {point.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

function RevenueFlowBreakdown({
  grossSales,
  capturedPayments,
  platformFees,
  partnerCommissions,
  guruNet,
  refunds,
  pendingAmount,
  heldAmount,
  failedAmount,
  netReleased,
}: {
  grossSales: number;
  capturedPayments: number;
  platformFees: number;
  partnerCommissions: number;
  guruNet: number;
  refunds: number;
  pendingAmount: number;
  heldAmount: number;
  failedAmount: number;
  netReleased: number;
}) {
  const rows = [
    {
      label: "Gross sales booked",
      description: "Total booking value before fees, refunds, holds, and payouts.",
      value: grossSales,
      tone: "bg-[#118a43]",
    },
    {
      label: "Customer payments captured",
      description: "Payments captured or completed from customers.",
      value: capturedPayments,
      tone: "bg-blue-500",
    },
    {
      label: "SitGuru platform fees",
      description: "Estimated or stored SitGuru service/application fee amount.",
      value: platformFees,
      tone: "bg-orange-400",
      negative: true,
    },
    {
      label: "Partner / referral commissions",
      description: "Partner, ambassador, affiliate, or referral commission amounts.",
      value: partnerCommissions,
      tone: "bg-violet-500",
      negative: true,
    },
    {
      label: "Refunds / disputes",
      description: "Refund and dispute dollars reducing the releaseable payout pool.",
      value: refunds,
      tone: "bg-rose-500",
      negative: true,
    },
    {
      label: "Guru net payout obligation",
      description: "Estimated or stored amount owed to Gurus after deductions.",
      value: guruNet,
      tone: "bg-emerald-400",
    },
    {
      label: "Pending release",
      description: "Captured payment records that still need payout completion.",
      value: pendingAmount,
      tone: "bg-sky-400",
    },
    {
      label: "Held / review",
      description: "Payouts blocked for manual review, holds, or operational checks.",
      value: heldAmount,
      tone: "bg-amber-400",
    },
    {
      label: "Failed payout exposure",
      description: "Payouts marked failed, declined, errored, or canceled.",
      value: failedAmount,
      tone: "bg-red-500",
    },
    {
      label: "Net released",
      description: "Guru net dollars already marked paid, released, or completed.",
      value: netReleased,
      tone: "bg-emerald-700",
    },
  ];

  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-black text-[#163127]">Revenue Flow Breakdown</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Detailed view of how customer sales move through fees, commissions, payouts, holds, and release.
          </p>
        </div>

        <Link
          href="/admin/financials/payouts"
          className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-[#f5fcf8] px-4 py-3 text-sm font-black text-[#118a43] transition hover:bg-[#ebf8f0]"
        >
          Open payout analytics
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="rounded-2xl border border-emerald-50 bg-[#fbfefc] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.08em] text-slate-500">
                  {row.label}
                </p>
                <p className="mt-2 text-xl font-black text-[#163127]">
                  {row.negative ? "-" : ""}
                  {moneyShort(row.value)}
                </p>
              </div>
            </div>

            <div className="mt-4 h-2.5 rounded-full bg-slate-100">
              <div
                className={`h-2.5 rounded-full ${row.tone}`}
                style={{ width: `${barWidth(row.value, max)}%` }}
              />
            </div>

            <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">
              {row.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutCard({
  platformFees,
  partnerCommissions,
  guruNet,
  heldAmount,
}: {
  platformFees: number;
  partnerCommissions: number;
  guruNet: number;
  heldAmount: number;
}) {
  const total = Math.max(platformFees + partnerCommissions + guruNet + heldAmount, 1);
  const guruPct = calcPercent(guruNet, total);
  const platformPct = calcPercent(platformFees, total);
  const partnerPct = calcPercent(partnerCommissions, total);
  const heldPct = calcPercent(heldAmount, total);

  return (
    <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-[#163127]">Commission Payout Categories</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Real distribution of payout dollars.
          </p>
        </div>
        <Link
          href="/admin/financials/payouts"
          className="text-xs font-black text-[#118a43] hover:text-[#0c7338]"
        >
          View breakdown
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-[190px_1fr] md:items-center">
        <div
          className="mx-auto grid h-44 w-44 place-items-center rounded-full"
          style={{
            background: `conic-gradient(
              #118a43 0 ${guruPct}%,
              #fb923c ${guruPct}% ${guruPct + platformPct}%,
              #8b5cf6 ${guruPct + platformPct}% ${guruPct + platformPct + partnerPct}%,
              #f43f5e ${guruPct + platformPct + partnerPct}% 100%
            )`,
          }}
        >
          <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center shadow-sm">
            <div>
              <p className="text-lg font-black text-[#163127]">{moneyShort(total)}</p>
              <p className="text-xs font-bold text-slate-500">Total</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {[
            ["Guru Net Payouts", guruNet, guruPct, "bg-[#118a43]"],
            ["Platform Fees", platformFees, platformPct, "bg-orange-400"],
            ["Partner Commissions", partnerCommissions, partnerPct, "bg-violet-500"],
            ["Held / Review", heldAmount, heldPct, "bg-rose-500"],
          ].map(([label, value, pct, color]) => (
            <div key={String(label)} className="flex items-center gap-3">
              <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-[#163127]">{label}</p>
                  <p className="text-sm font-black text-[#163127]">
                    {moneyShort(Number(value))}
                  </p>
                </div>
                <p className="text-xs font-semibold text-slate-500">
                  {Number(pct).toFixed(1)}% of payout mix
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TopListCard({
  title,
  description,
  children,
  href,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  href: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[#163127]">{title}</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">{description}</p>
        </div>
        <Link href={href} className="text-xs font-black text-[#118a43] hover:text-[#0c7338]">
          View all
        </Link>
      </div>

      {children}
    </div>
  );
}

function LedgerTable({
  rows,
  params,
}: {
  rows: CommissionRow[];
  params: SearchParamsShape;
}) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-emerald-100 bg-gradient-to-r from-[#f9fdfb] to-white p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-black text-[#163127]">Commission & Payout Ledger</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Booking-level sales flow with real gross, fees, commissions, Guru net, and payout state.
          </p>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-[#118a43]">
            {rows.length} visible rows · sorted by {(params.sort || "createdAt").toUpperCase()} ·{" "}
            {(params.dir || "desc").toUpperCase()}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/api/admin/commissions/export"
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-[#f5fcf8] px-4 py-3 text-sm font-black text-[#118a43] transition hover:bg-[#ebf8f0]"
          >
            <Download className="h-4 w-4" />
            Export
          </Link>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-[#163127]"
          >
            <Columns3 className="h-4 w-4 text-[#118a43]" />
            Columns
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1320px] w-full">
          <thead className="bg-[#fbfefc]">
            <tr className="border-b border-emerald-100 text-left">
              <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.08em]">
                <SortHeader label="Booking" sortKey="booking" params={params} />
              </th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.08em]">
                <SortHeader label="Customer" sortKey="customer" params={params} />
              </th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.08em]">
                <SortHeader label="Guru" sortKey="guru" params={params} />
              </th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.08em]">
                <SortHeader label="Market" sortKey="market" params={params} />
              </th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.08em]">
                <SortHeader label="Gross" sortKey="gross" params={params} />
              </th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.08em]">
                <SortHeader label="Platform Fee" sortKey="fee" params={params} />
              </th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.08em]">
                <SortHeader label="Partner Commission" sortKey="partner" params={params} />
              </th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.08em]">
                <SortHeader label="Guru Net" sortKey="net" params={params} />
              </th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.08em]">
                <SortHeader label="Status" sortKey="status" params={params} />
              </th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.08em]">
                <SortHeader label="Date" sortKey="createdAt" params={params} />
              </th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.08em] text-slate-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.slice(0, 10).map((row) => (
              <tr
                key={row.id}
                className="border-b border-emerald-50 transition hover:bg-[#fafefb]"
              >
                <td className="px-5 py-4 align-top">
                  <Link href={row.href} className="font-mono text-sm font-bold text-[#163127] hover:text-[#118a43]">
                    {row.bookingId.slice(0, 14)}
                  </Link>
                  <p className="mt-1 text-xs font-semibold text-slate-400">{row.service}</p>
                </td>
                <td className="px-5 py-4 align-top">
                  <AvatarBadge
                    name={row.customerName}
                    subtitle="Customer payment"
                    avatarUrl={row.customerAvatarUrl}
                    tone="blue"
                  />
                </td>
                <td className="px-5 py-4 align-top">
                  <AvatarBadge
                    name={row.guruName}
                    subtitle="Guru payout"
                    avatarUrl={row.guruAvatarUrl}
                    tone="green"
                  />
                </td>
                <td className="px-5 py-4 align-top">
                  <p className="font-bold text-[#163127]">{row.market}</p>
                </td>
                <td className="px-5 py-4 align-top font-black text-[#163127]">
                  {money(row.grossAmount)}
                </td>
                <td className="px-5 py-4 align-top font-black text-[#118a43]">
                  {money(row.platformFee)}
                </td>
                <td className="px-5 py-4 align-top font-black text-violet-700">
                  {money(row.partnerCommission)}
                </td>
                <td className="px-5 py-4 align-top font-black text-[#163127]">
                  {money(row.guruNet)}
                </td>
                <td className="px-5 py-4 align-top">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${getStatusBadgeClasses(
                      row.ledgerStatus,
                    )}`}
                  >
                    {getStatusLabel(row.ledgerStatus)}
                  </span>
                </td>
                <td className="px-5 py-4 align-top font-bold text-slate-600">
                  {row.createdAt}
                </td>
                <td className="px-5 py-4 align-top">
                  <Link
                    href={row.href}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-100 bg-white text-slate-500 transition hover:bg-emerald-50 hover:text-[#118a43]"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={11} className="px-5 py-14 text-center">
                  <p className="text-lg font-black text-[#163127]">
                    No real commission rows found
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Add bookings, payments, and payout records in Supabase to populate this page.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-500">
          Showing {rows.length ? 1 : 0} to {Math.min(10, rows.length)} of {rows.length} results
        </p>

        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((page) => (
            <button
              key={page}
              type="button"
              className={`h-9 w-9 rounded-xl border text-sm font-black ${
                page === 1
                  ? "border-emerald-200 bg-emerald-50 text-[#118a43]"
                  : "border-emerald-100 bg-white text-slate-500"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            className="rounded-xl border border-emerald-100 bg-white px-4 py-2 text-sm font-black text-[#163127]"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default async function AdminCommissionsPage({
  searchParams,
}: {
  searchParams?: SearchParamsInput;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const params = ((await searchParams) || {}) as SearchParamsShape;
  const commissions = await getCommissionData();
  const filteredRows = filterRows(commissions.rows, params);
  const rows = sortRows(filteredRows, params.sort || "createdAt", params.dir || "desc");

  const capturedRate = calcPercent(
    commissions.totals.capturedRows,
    commissions.totals.bookings,
  );

  const releaseRate = commissions.totals.releaseRate;

  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-6 px-4 pb-10 pt-1 text-slate-900 sm:px-6 xl:px-8">
      <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
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
              <span className="text-[#163127]">Commissions</span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-[#163127] sm:text-4xl">
                Revenue to Payout Analytics
              </h1>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-[#118a43]">
                <span className="h-2 w-2 rounded-full bg-[#118a43]" />
                Real Supabase data
              </span>
            </div>

            <p className="mt-2 max-w-4xl text-sm font-medium leading-6 text-slate-500 sm:text-base">
              End-to-end view of customer payments, platform fees, partner commissions,
              Guru net payouts, refunds, holds, and net released funds from live SitGuru data.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/admin/financials"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-[#163127] transition hover:bg-emerald-50"
            >
              Back to Financials
              <ArrowRight className="h-4 w-4 text-[#118a43]" />
            </Link>
            <Link
              href="/api/admin/commissions/export"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-[#f5fcf8] px-4 py-3 text-sm font-black text-[#118a43] transition hover:bg-[#ebf8f0]"
            >
              Export
              <Download className="h-4 w-4" />
            </Link>
            <Link
              href="/admin/payout"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#118a43] px-4 py-3 text-sm font-black text-white transition hover:bg-[#0c7338]"
            >
              Release Payouts
              <WalletCards className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-[#163127]">End-to-end Sales Flow</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Complete real flow from booking to customer payment, fees, commissions, and net release.
            </p>
          </div>
          <Link
            href="/admin/financials/payouts"
            className="text-sm font-black text-[#118a43] hover:text-[#0c7338]"
          >
            View flow analytics →
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1">
          <FlowCard
            step="01"
            label="Gross Sales"
            value={moneyShort(commissions.totals.grossSales)}
            detail={`${commissions.totals.bookings.toLocaleString()} bookings`}
            icon={<CalendarDays className="h-5 w-5" />}
            tone="bg-emerald-50 text-[#118a43]"
          />
          <div className="hidden items-center text-[#118a43] lg:flex">→</div>
          <FlowCard
            step="02"
            label="Customer Payments"
            value={moneyShort(commissions.totals.capturedPayments)}
            detail={`${percent(capturedRate)} captured`}
            icon={<CreditCard className="h-5 w-5" />}
            tone="bg-sky-50 text-sky-600"
          />
          <div className="hidden items-center text-[#118a43] lg:flex">→</div>
          <FlowCard
            step="03"
            label="Platform Fees"
            value={moneyShort(commissions.totals.platformFees)}
            detail={`${percent(commissions.totals.takeRate)} take rate`}
            icon={<HandCoins className="h-5 w-5" />}
            tone="bg-orange-50 text-orange-600"
          />
          <div className="hidden items-center text-[#118a43] lg:flex">→</div>
          <FlowCard
            step="04"
            label="Partner Commissions"
            value={moneyShort(commissions.totals.partnerCommissions)}
            detail={`${percent(commissions.totals.partnerRate)} of gross`}
            icon={<Users className="h-5 w-5" />}
            tone="bg-violet-50 text-violet-600"
          />
          <div className="hidden items-center text-[#118a43] lg:flex">→</div>
          <FlowCard
            step="05"
            label="Guru Net Payouts"
            value={moneyShort(commissions.totals.guruNetPayouts)}
            detail="To Gurus"
            icon={<WalletCards className="h-5 w-5" />}
            tone="bg-emerald-50 text-[#118a43]"
          />
          <div className="hidden items-center text-[#118a43] lg:flex">→</div>
          <FlowCard
            step="06"
            label="Net Released"
            value={moneyShort(commissions.totals.netReleased)}
            detail={`${percent(releaseRate)} release rate`}
            icon={<CheckCircle2 className="h-5 w-5" />}
            tone="bg-emerald-50 text-[#118a43]"
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard
          label="Gross Sales Volume"
          value={moneyShort(commissions.totals.grossSales)}
          detail="Real booking value"
          icon={<TrendingUp className="h-5 w-5" />}
          tone="bg-emerald-50 text-[#118a43]"
        />
        <KpiCard
          label="Platform Fees"
          value={moneyShort(commissions.totals.platformFees)}
          detail={`${percent(commissions.totals.takeRate)} of gross`}
          icon={<HandCoins className="h-5 w-5" />}
          tone="bg-orange-50 text-orange-600"
        />
        <KpiCard
          label="Guru Net Payouts"
          value={moneyShort(commissions.totals.guruNetPayouts)}
          detail="Total owed to Gurus"
          icon={<WalletCards className="h-5 w-5" />}
          tone="bg-emerald-50 text-[#118a43]"
        />
        <KpiCard
          label="Partner Commissions"
          value={moneyShort(commissions.totals.partnerCommissions)}
          detail="Referral and partner payouts"
          icon={<Users className="h-5 w-5" />}
          tone="bg-violet-50 text-violet-600"
        />
        <KpiCard
          label="Held Payouts"
          value={moneyShort(commissions.totals.heldAmount)}
          detail="Needs review"
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="bg-amber-50 text-amber-600"
        />
        <KpiCard
          label="Net Released"
          value={moneyShort(commissions.totals.netReleased)}
          detail={`${percent(releaseRate)} payout completion`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="bg-emerald-50 text-[#118a43]"
        />
      </section>

      <AnnualTrendChart points={commissions.trendPoints} />

      <RevenueFlowBreakdown
        grossSales={commissions.totals.grossSales}
        capturedPayments={commissions.totals.capturedPayments}
        platformFees={commissions.totals.platformFees}
        partnerCommissions={commissions.totals.partnerCommissions}
        guruNet={commissions.totals.guruNetPayouts}
        refunds={commissions.totals.refundAmount}
        pendingAmount={commissions.totals.pendingAmount}
        heldAmount={commissions.totals.heldAmount}
        failedAmount={commissions.totals.failedAmount}
        netReleased={commissions.totals.netReleased}
      />

      <section className="grid gap-6 xl:grid-cols-3">
        <DonutCard
          platformFees={commissions.totals.platformFees}
          partnerCommissions={commissions.totals.partnerCommissions}
          guruNet={commissions.totals.guruNetPayouts}
          heldAmount={commissions.totals.heldAmount}
        />

        <TopListCard
          title="Top 5 Markets by Payout"
          description="Real market-level payout distribution from booking/customer location fields."
          href="/admin/analytics"
        >
          <div className="space-y-4">
            {commissions.topMarkets.map((market, index) => (
              <div key={market.label}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-emerald-50 text-sm font-black text-[#118a43]">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-black text-[#163127]">{market.label}</p>
                      <p className="text-xs font-semibold text-slate-500">
                        {market.bookings} bookings
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-black text-[#163127]">{moneyShort(market.amount)}</p>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100">
                  <div
                    className="h-2.5 rounded-full bg-[#118a43]"
                    style={{ width: `${barWidth(market.amount, commissions.maxMarket)}%` }}
                  />
                </div>
              </div>
            ))}

            {commissions.topMarkets.length === 0 && (
              <div className="rounded-2xl border border-dashed border-emerald-100 p-6 text-center">
                <p className="text-sm font-bold text-slate-500">
                  No market payout data found yet.
                </p>
              </div>
            )}
          </div>
        </TopListCard>

        <TopListCard
          title="Top 5 Gurus by Net Earnings"
          description="Highest real Guru net payout value."
          href="/admin/gurus"
        >
          <div className="space-y-4">
            {commissions.topGurus.map((guru, index) => (
              <div key={guru.guruId}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-sm font-black text-[#118a43]">
                      {index + 1}
                    </span>
                    <AvatarBadge
                      name={guru.guruName}
                      subtitle={`${guru.bookings} bookings`}
                      avatarUrl={guru.guruAvatarUrl}
                      tone="green"
                      size="sm"
                    />
                  </div>
                  <p className="text-sm font-black text-[#163127]">{moneyShort(guru.guruNet)}</p>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100">
                  <div
                    className="h-2.5 rounded-full bg-[#118a43]"
                    style={{ width: `${barWidth(guru.guruNet, commissions.maxGuruNet)}%` }}
                  />
                </div>
              </div>
            ))}

            {commissions.topGurus.length === 0 && (
              <div className="rounded-2xl border border-dashed border-emerald-100 p-6 text-center">
                <p className="text-sm font-bold text-slate-500">
                  No Guru earnings found yet.
                </p>
              </div>
            )}
          </div>
        </TopListCard>
      </section>

      <ActivityFeed items={commissions.activity} />

      <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm">
        <form action="/admin/commissions" className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-[#118a43]">
                <Filter className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-[#163127]">
                  Organize Commission Data
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Search, filter, and sort real booking-level commission and payout rows.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#118a43] px-4 py-3 text-sm font-black text-white transition hover:bg-[#0c7338]"
              >
                Apply Filters
                <Filter className="h-4 w-4" />
              </button>

              <Link
                href="/admin/commissions"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-[#f5fcf8] px-4 py-3 text-sm font-black text-[#118a43] transition hover:bg-[#ebf8f0]"
              >
                Reset
                <RefreshCw className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <input type="hidden" name="sort" value={params.sort || "createdAt"} />
          <input type="hidden" name="dir" value={params.dir || "desc"} />

          <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={params.q || ""}
                placeholder="Search booking, customer, guru, market, status..."
                className="h-12 w-full rounded-2xl border border-emerald-100 bg-[#fcfffd] pl-11 pr-4 text-sm font-semibold text-[#163127] outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
              />
            </label>

            <select
              name="status"
              defaultValue={params.status || "all"}
              className="h-12 w-full rounded-2xl border border-emerald-100 bg-[#fcfffd] px-4 text-sm font-semibold text-[#163127] outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="unpaid">Unpaid</option>
              <option value="held">Held</option>
              <option value="failed">Failed</option>
            </select>

            <select
              name="source"
              defaultValue={params.source || "all"}
              className="h-12 w-full rounded-2xl border border-emerald-100 bg-[#fcfffd] px-4 text-sm font-semibold text-[#163127] outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
            >
              <option value="all">All Types</option>
              <option value="guru">Guru Net</option>
              <option value="platform">Platform Fees</option>
              <option value="partner">Partner Commissions</option>
              <option value="refund">Refunds / Disputes</option>
            </select>
          </div>
        </form>
      </section>

      <LedgerTable rows={rows} params={params} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/admin/payout"
          className="rounded-[1.4rem] border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <WalletCards className="h-5 w-5 text-[#118a43]" />
          <p className="mt-3 text-base font-black text-[#163127]">Payout Command Center</p>
          <p className="mt-1 text-sm text-slate-500">
            Review release queues, payout records, and operational payout activity.
          </p>
        </Link>

        <Link
          href="/admin/financials/payouts"
          className="rounded-[1.4rem] border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <BarChart3 className="h-5 w-5 text-[#118a43]" />
          <p className="mt-3 text-base font-black text-[#163127]">Payout Analytics</p>
          <p className="mt-1 text-sm text-slate-500">
            Open deeper payout visualizations, source mix, and batch analytics.
          </p>
        </Link>

        <Link
          href="/admin/payments"
          className="rounded-[1.4rem] border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <CreditCard className="h-5 w-5 text-[#118a43]" />
          <p className="mt-3 text-base font-black text-[#163127]">Payment Operations</p>
          <p className="mt-1 text-sm text-slate-500">
            Track customer payment capture, failures, disputes, and refunds.
          </p>
        </Link>

        <Link
          href="/admin/financials"
          className="rounded-[1.4rem] border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <LineChart className="h-5 w-5 text-[#118a43]" />
          <p className="mt-3 text-base font-black text-[#163127]">Financial Overview</p>
          <p className="mt-1 text-sm text-slate-500">
            Return to the full SitGuru financial overview and reporting dashboard.
          </p>
        </Link>
      </section>

      <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-[#118a43]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#163127]">Supabase Source Coverage</h2>
              <p className="mt-1 text-sm text-slate-500">
                Real row counts from connected SitGuru tables powering this page.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-[#118a43]">
            No fake fallback values
          </span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          {[
            ["Bookings", commissions.sourceCounts.bookings],
            ["Payments", commissions.sourceCounts.payments],
            ["Transactions", commissions.sourceCounts.transactions],
            ["Guru Payouts", commissions.sourceCounts.guruPayouts],
            ["Partner Payouts", commissions.sourceCounts.partnerPayouts],
            ["Refunds", commissions.sourceCounts.refunds],
            ["Disputes", commissions.sourceCounts.disputes],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-2xl border border-emerald-100 bg-[#fbfefc] p-4"
            >
              <p className="text-xs font-black uppercase tracking-[0.08em] text-slate-500">
                {label}
              </p>
              <p className="mt-2 text-2xl font-black text-[#163127]">{Number(value)}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">rows found</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}