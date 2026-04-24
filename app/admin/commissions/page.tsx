import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type BookingRow = Record<string, unknown>;
type PayoutRow = Record<string, unknown>;
type GuruRow = Record<string, unknown>;
type ProfileRow = Record<string, unknown>;

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type CommissionRow = {
  id: string;
  bookingId: string;
  guruId: string;
  guruName: string;
  customerName: string;
  grossAmount: number;
  taxAmount: number;
  platformFee: number;
  guruNet: number;
  paymentStatus: string;
  payoutStatus: string;
  service: string;
  createdAt: string;
  href: string;
};

type TopGuruSummary = {
  guruName: string;
  gross: number;
  platformFee: number;
  guruNet: number;
  bookings: number;
};

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function moneyShort(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
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

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string
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

function getBookingId(booking: BookingRow) {
  return (
    asTrimmedString(booking.id) ||
    asTrimmedString(booking.booking_id) ||
    "booking"
  );
}

function getGuruIdFromBooking(booking: BookingRow) {
  return (
    asTrimmedString(booking.guru_id) ||
    asTrimmedString(booking.sitter_id) ||
    asTrimmedString(booking.provider_id) ||
    "unknown"
  );
}

function getCustomerNameFromBooking(booking: BookingRow) {
  return (
    asTrimmedString(booking.customer_name) ||
    asTrimmedString(booking.pet_parent_name) ||
    asTrimmedString(booking.owner_name) ||
    asTrimmedString(booking.customer_email) ||
    asTrimmedString(booking.pet_owner_id) ||
    "Customer"
  );
}

function getGuruNameFromBooking(booking: BookingRow) {
  return (
    asTrimmedString(booking.guru_name) ||
    asTrimmedString(booking.sitter_name) ||
    asTrimmedString(booking.provider_name) ||
    asTrimmedString(booking.guru_id) ||
    "Guru"
  );
}

function getBookingGrossAmount(booking: BookingRow) {
  const subtotal = toNumber(booking.subtotal_amount);

  if (subtotal > 0) return subtotal;

  return (
    toNumber(booking.total_amount) ||
    toNumber(booking.amount) ||
    toNumber(booking.price) ||
    toNumber(booking.hourly_rate)
  );
}

function getBookingTaxAmount(booking: BookingRow) {
  return toNumber(booking.sales_tax_amount);
}

function getBookingPlatformFee(booking: BookingRow) {
  const storedFee = toNumber(booking.sitguru_fee_amount);

  if (storedFee > 0) return storedFee;

  return getBookingGrossAmount(booking) * 0.08;
}

function getBookingGuruNet(booking: BookingRow) {
  const storedNet = toNumber(booking.guru_net_amount);

  if (storedNet > 0) return storedNet;

  return Math.max(0, getBookingGrossAmount(booking) - getBookingPlatformFee(booking));
}

function getBookingPaymentStatus(booking: BookingRow) {
  return (
    asTrimmedString(booking.payment_status) ||
    asTrimmedString(booking.status) ||
    "pending"
  );
}

function getBookingPayoutStatus(booking: BookingRow) {
  return (
    asTrimmedString(booking.payout_status) ||
    asTrimmedString(booking.guru_payout_status) ||
    "pending"
  );
}

function getBookingService(booking: BookingRow) {
  return (
    asTrimmedString(booking.service) ||
    asTrimmedString(booking.service_name) ||
    asTrimmedString(booking.service_type) ||
    asTrimmedString(booking.booking_type) ||
    "Pet Care"
  );
}

function isPayoutPaid(status: string) {
  const normalized = status.toLowerCase();

  return (
    normalized === "paid" ||
    normalized === "released" ||
    normalized === "complete" ||
    normalized === "completed"
  );
}

function isPayoutHeld(status: string) {
  const normalized = status.toLowerCase();

  return (
    normalized.includes("hold") ||
    normalized.includes("review") ||
    normalized.includes("flag") ||
    normalized.includes("failed")
  );
}

function getGuruId(guru: GuruRow) {
  return (
    asTrimmedString(guru.id) ||
    asTrimmedString(guru.user_id) ||
    asTrimmedString(guru.profile_id) ||
    asTrimmedString(guru.email).toLowerCase()
  );
}

function getProfileId(profile: ProfileRow) {
  return (
    asTrimmedString(profile.id) ||
    asTrimmedString(profile.user_id) ||
    asTrimmedString(profile.profile_id) ||
    asTrimmedString(profile.email).toLowerCase()
  );
}

function getGuruName(guru?: GuruRow, profile?: ProfileRow) {
  if (!guru && !profile) return "";

  return (
    asTrimmedString(guru?.display_name) ||
    asTrimmedString(guru?.full_name) ||
    asTrimmedString(guru?.name) ||
    asTrimmedString(profile?.display_name) ||
    asTrimmedString(profile?.full_name) ||
    asTrimmedString(profile?.name) ||
    asTrimmedString(guru?.email).split("@")[0] ||
    asTrimmedString(profile?.email).split("@")[0] ||
    ""
  );
}

function getPayoutBookingId(payout: PayoutRow) {
  return (
    asTrimmedString(payout.booking_id) ||
    asTrimmedString(payout.bookingId) ||
    ""
  );
}

function getPayoutGuruId(payout: PayoutRow) {
  return (
    asTrimmedString(payout.guru_id) ||
    asTrimmedString(payout.sitter_id) ||
    asTrimmedString(payout.provider_id) ||
    ""
  );
}

function getPayoutAmount(payout: PayoutRow) {
  return (
    toNumber(payout.amount) ||
    toNumber(payout.payout_amount) ||
    toNumber(payout.guru_net_amount) ||
    toNumber(payout.net_amount)
  );
}

function getPayoutStatus(payout: PayoutRow) {
  return (
    asTrimmedString(payout.status) ||
    asTrimmedString(payout.payout_status) ||
    "pending"
  );
}

function statusClasses(status: string) {
  const normalized = status.toLowerCase();

  if (isPayoutPaid(normalized) || normalized.includes("paid")) {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
  }

  if (isPayoutHeld(normalized)) {
    return "border-rose-400/20 bg-rose-400/10 text-rose-200";
  }

  if (normalized.includes("ready")) {
    return "border-sky-400/20 bg-sky-400/10 text-sky-200";
  }

  return "border-amber-400/20 bg-amber-400/10 text-amber-200";
}

function paymentStatusClasses(status: string) {
  const normalized = status.toLowerCase();

  if (
    normalized.includes("paid") ||
    normalized.includes("complete") ||
    normalized.includes("succeeded")
  ) {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
  }

  if (
    normalized.includes("failed") ||
    normalized.includes("cancel") ||
    normalized.includes("expired")
  ) {
    return "border-rose-400/20 bg-rose-400/10 text-rose-200";
  }

  return "border-amber-400/20 bg-amber-400/10 text-amber-200";
}

function ActionLink({
  href,
  label,
  primary = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) {
  if (primary) {
    return (
      <Link
        href={href}
        className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:border-emerald-300/30 hover:bg-white/10"
    >
      {label}
    </Link>
  );
}

function VisualBar({
  label,
  value,
  max,
  amount,
  tone = "emerald",
}: {
  label: string;
  value: number;
  max: number;
  amount: string;
  tone?: "emerald" | "sky" | "violet" | "amber" | "rose";
}) {
  const toneClass = {
    emerald: "bg-emerald-400",
    sky: "bg-sky-400",
    violet: "bg-violet-400",
    amber: "bg-amber-400",
    rose: "bg-rose-400",
  }[tone];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          {label}
        </p>
        <p className="text-sm font-black text-white">{amount}</p>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${toneClass}`}
          style={{ width: `${barWidth(value, max)}%` }}
        />
      </div>
    </div>
  );
}

async function getCommissionData() {
  const [bookings, payouts, gurus, profiles] = await Promise.all([
    safeRows<BookingRow>(
      supabaseAdmin
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "bookings"
    ),
    safeRows<PayoutRow>(
      supabaseAdmin
        .from("guru_payouts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "guru_payouts"
    ),
    safeRows<GuruRow>(
      supabaseAdmin.from("gurus").select("*").limit(1000),
      "gurus"
    ),
    safeRows<ProfileRow>(
      supabaseAdmin.from("profiles").select("*").limit(1000),
      "profiles"
    ),
  ]);

  const guruMap = new Map<string, GuruRow>();
  const profileMap = new Map<string, ProfileRow>();

  for (const guru of gurus) {
    const id = getGuruId(guru);

    if (id) {
      guruMap.set(id, guru);
    }
  }

  for (const profile of profiles) {
    const id = getProfileId(profile);

    if (id) {
      profileMap.set(id, profile);
    }
  }

  const payoutByBookingId = new Map<string, PayoutRow>();

  for (const payout of payouts) {
    const bookingId = getPayoutBookingId(payout);

    if (bookingId) {
      payoutByBookingId.set(bookingId, payout);
    }
  }

  const commissionRows: CommissionRow[] = bookings.map((booking) => {
    const bookingId = getBookingId(booking);
    const guruId = getGuruIdFromBooking(booking);
    const payout = payoutByBookingId.get(bookingId);
    const guru = guruMap.get(guruId);
    const profile = profileMap.get(guruId);

    const grossAmount = getBookingGrossAmount(booking);
    const taxAmount = getBookingTaxAmount(booking);
    const platformFee = getBookingPlatformFee(booking);
    const guruNetFromBooking = getBookingGuruNet(booking);
    const guruNetFromPayout = payout ? getPayoutAmount(payout) : 0;
    const payoutStatus = payout ? getPayoutStatus(payout) : getBookingPayoutStatus(booking);

    return {
      id: `${bookingId}-${guruId}`,
      bookingId,
      guruId,
      guruName: getGuruName(guru, profile) || getGuruNameFromBooking(booking),
      customerName: getCustomerNameFromBooking(booking),
      grossAmount,
      taxAmount,
      platformFee,
      guruNet: guruNetFromPayout || guruNetFromBooking,
      paymentStatus: getBookingPaymentStatus(booking),
      payoutStatus,
      service: getBookingService(booking),
      createdAt: formatDateShort(asTrimmedString(booking.created_at)),
      href: `/admin/bookings?booking=${bookingId}`,
    };
  });

  const paidCommissionRows = commissionRows.filter((row) =>
    row.paymentStatus.toLowerCase().includes("paid")
  );

  const pendingPayoutRows = commissionRows.filter(
    (row) =>
      row.paymentStatus.toLowerCase().includes("paid") &&
      !isPayoutPaid(row.payoutStatus) &&
      !isPayoutHeld(row.payoutStatus)
  );

  const heldPayoutRows = commissionRows.filter((row) =>
    isPayoutHeld(row.payoutStatus)
  );

  const paidOutRows = commissionRows.filter((row) =>
    isPayoutPaid(row.payoutStatus)
  );

  const grossVolume = commissionRows.reduce(
    (sum, row) => sum + row.grossAmount,
    0
  );

  const platformFees = commissionRows.reduce(
    (sum, row) => sum + row.platformFee,
    0
  );

  const pendingPayouts = pendingPayoutRows.reduce(
    (sum, row) => sum + row.guruNet,
    0
  );

  const paidOut = paidOutRows.reduce((sum, row) => sum + row.guruNet, 0);

  const heldPayouts = heldPayoutRows.reduce((sum, row) => sum + row.guruNet, 0);

  const takeRate = grossVolume > 0 ? (platformFees / grossVolume) * 100 : 0;

  const topGuruMap = new Map<string, TopGuruSummary>();

  for (const row of commissionRows) {
    const existing = topGuruMap.get(row.guruId) || {
      guruName: row.guruName,
      gross: 0,
      platformFee: 0,
      guruNet: 0,
      bookings: 0,
    };

    existing.gross += row.grossAmount;
    existing.platformFee += row.platformFee;
    existing.guruNet += row.guruNet;
    existing.bookings += 1;

    topGuruMap.set(row.guruId, existing);
  }

  const topGurus = Array.from(topGuruMap.values())
    .sort((a, b) => b.guruNet - a.guruNet)
    .slice(0, 8);

  const maxGuruNet = Math.max(...topGurus.map((guru) => guru.guruNet), 1);
  const maxGuruFee = Math.max(...topGurus.map((guru) => guru.platformFee), 1);
  const maxGuruGross = Math.max(...topGurus.map((guru) => guru.gross), 1);
  const totalGuruNet = topGurus.reduce((sum, guru) => sum + guru.guruNet, 0);
  const totalTopGuruFees = topGurus.reduce((sum, guru) => sum + guru.platformFee, 0);
  const averageGuruNet = topGurus.length > 0 ? totalGuruNet / topGurus.length : 0;
  const topGuru = topGurus[0] || null;
  const highestFeeGuru = topGurus
    .slice()
    .sort((a, b) => b.platformFee - a.platformFee)[0] || null;

  return {
    stats: [
      {
        label: "Pending Guru Payouts",
        value: moneyShort(pendingPayouts),
        detail: `${pendingPayoutRows.length.toLocaleString()} paid booking rows awaiting payout release`,
        href: "/admin/commissions?status=pending",
      },
      {
        label: "Platform Commission Earned",
        value: moneyShort(platformFees),
        detail: `${percent(takeRate)} estimated SitGuru take rate`,
        href: "/admin/financials/profit-loss",
      },
      {
        label: "Paid Out to Gurus",
        value: moneyShort(paidOut),
        detail: `${paidOutRows.length.toLocaleString()} rows marked paid or released`,
        href: "/admin/commissions?status=paid",
      },
      {
        label: "Held / Review Payouts",
        value: moneyShort(heldPayouts),
        detail: `${heldPayoutRows.length.toLocaleString()} rows needing review`,
        href: "/admin/commissions?status=held",
      },
    ],
    rows: commissionRows.slice(0, 50),
    pendingRows: pendingPayoutRows.slice(0, 12),
    heldRows: heldPayoutRows.slice(0, 12),
    topGurus,
    guruVisuals: {
      maxGuruNet,
      maxGuruFee,
      maxGuruGross,
      totalGuruNet,
      totalTopGuruFees,
      averageGuruNet,
      topGuru,
      highestFeeGuru,
    },
    totals: {
      bookings: commissionRows.length,
      paidBookings: paidCommissionRows.length,
      grossVolume,
      platformFees,
      pendingPayouts,
      paidOut,
      heldPayouts,
      takeRate,
      payoutCompletionRate: calcPercent(paidOutRows.length, paidCommissionRows.length),
    },
  };
}

export default async function AdminCommissionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const commissions = await getCommissionData();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.10),_transparent_30%),radial-gradient(circle_at_right,_rgba(14,165,233,0.10),_transparent_28%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-emerald-500/15 via-slate-950 to-sky-500/10 p-6 shadow-[0_12px_60px_rgba(0,0,0,0.28)] lg:p-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
                Admin / Commissions
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Guru payouts, SitGuru fees, and commission control.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                This page tracks the completed-sale flow: customer payment,
                SitGuru platform fee, Guru net payout, payout readiness, held
                payouts, and released payout activity from live SitGuru records.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <ActionLink href="/admin/payments" label="Payments" />
              <ActionLink href="/admin/bookings" label="Bookings" />
              <ActionLink href="/admin/financials" label="Financials" />
              <ActionLink href="/admin/exports" label="Export Payouts" primary />
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {commissions.stats.map((stat) => (
              <Link
                key={stat.label}
                href={stat.href}
                className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition hover:border-emerald-300/30 hover:bg-white/10"
              >
                <p className="text-sm font-semibold text-slate-400">
                  {stat.label}
                </p>
                <p className="mt-3 text-3xl font-black tracking-tight text-white">
                  {stat.value}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {stat.detail}
                </p>
                <p className="mt-4 text-sm font-semibold text-emerald-300">
                  Open SitGuru records →
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                  Payout Queue
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                  Pending Guru payout release
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Paid bookings that have not yet been marked paid or released to
                  the Guru.
                </p>
              </div>

              <ActionLink href="/admin/payments" label="Payment Ops" />
            </div>

            <div className="mt-6 space-y-4">
              {commissions.pendingRows.length ? (
                commissions.pendingRows.map((row) => (
                  <Link
                    key={row.id}
                    href={row.href}
                    className="block rounded-3xl border border-white/10 bg-slate-950/40 p-5 transition hover:border-emerald-300/30 hover:bg-white/10"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-lg font-black text-white">
                          {row.guruName}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          Booking {row.bookingId} • {row.service}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Customer: {row.customerName}
                        </p>
                      </div>

                      <div className="grid gap-3 text-sm sm:grid-cols-3 lg:min-w-[360px]">
                        <div>
                          <p className="text-slate-500">Gross</p>
                          <p className="font-bold text-white">
                            {money(row.grossAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">SitGuru Fee</p>
                          <p className="font-bold text-emerald-300">
                            {money(row.platformFee)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Guru Net</p>
                          <p className="font-bold text-white">
                            {money(row.guruNet)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${paymentStatusClasses(
                          row.paymentStatus
                        )}`}
                      >
                        Payment: {row.paymentStatus}
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClasses(
                          row.payoutStatus
                        )}`}
                      >
                        Payout: {row.payoutStatus}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
                  <p className="text-lg font-bold text-white">
                    No pending Guru payouts found.
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    Paid bookings awaiting Guru payout release will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Commission Health
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-white">
                {percent(commissions.totals.takeRate)}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Estimated platform take rate based on SitGuru fee amount divided
                by gross booking volume.
              </p>

              <div className="mt-6 space-y-4">
                <VisualBar
                  label="Payout Completion"
                  value={commissions.totals.payoutCompletionRate}
                  max={100}
                  amount={percent(commissions.totals.payoutCompletionRate)}
                  tone="emerald"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Gross Volume
                    </p>
                    <p className="mt-2 text-xl font-black text-white">
                      {moneyShort(commissions.totals.grossVolume)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Bookings
                    </p>
                    <p className="mt-2 text-xl font-black text-white">
                      {commissions.totals.bookings.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-rose-400/20 bg-rose-400/10 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-200">
                Held / Review Payouts
              </p>
              <h3 className="mt-3 text-4xl font-black tracking-tight text-white">
                {moneyShort(commissions.totals.heldPayouts)}
              </h3>
              <p className="mt-2 text-sm leading-6 text-rose-50/90">
                Payouts with hold, review, flagged, or failed status should be
                reviewed before release.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Earnings Visuals
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                Guru earnings, SitGuru fees, and gross volume
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Visual bars compare Guru net earnings, SitGuru fee contribution,
                and gross booking value by Guru using the same commission rows.
              </p>
            </div>

            <ActionLink href="/admin/exports" label="Export Earnings" />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                Top Guru
              </p>
              <p className="mt-3 text-xl font-black text-white">
                {commissions.guruVisuals.topGuru?.guruName || "—"}
              </p>
              <p className="mt-2 text-sm text-emerald-50/90">
                {moneyShort(commissions.guruVisuals.topGuru?.guruNet || 0)} Guru net
              </p>
            </div>

            <div className="rounded-3xl border border-sky-400/20 bg-sky-400/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
                Highest SitGuru Fee
              </p>
              <p className="mt-3 text-xl font-black text-white">
                {commissions.guruVisuals.highestFeeGuru?.guruName || "—"}
              </p>
              <p className="mt-2 text-sm text-sky-50/90">
                {moneyShort(commissions.guruVisuals.highestFeeGuru?.platformFee || 0)} fee
              </p>
            </div>

            <div className="rounded-3xl border border-violet-400/20 bg-violet-400/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">
                Avg Guru Net
              </p>
              <p className="mt-3 text-3xl font-black text-white">
                {moneyShort(commissions.guruVisuals.averageGuruNet)}
              </p>
              <p className="mt-2 text-sm text-violet-50/90">
                Across top earning Gurus
              </p>
            </div>

            <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
                Top Guru Fees
              </p>
              <p className="mt-3 text-3xl font-black text-white">
                {moneyShort(commissions.guruVisuals.totalTopGuruFees)}
              </p>
              <p className="mt-2 text-sm text-amber-50/90">
                SitGuru fees from ranked Gurus
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_0.9fr]">
            <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-white">
                    Guru Net Earnings Bar Chart
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Ranked by Guru net payout value.
                  </p>
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-200">
                  Net
                </span>
              </div>

              <div className="mt-6 space-y-5">
                {commissions.topGurus.length ? (
                  commissions.topGurus.map((guru, index) => (
                    <div key={`${guru.guruName}-net-chart`}>
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-white">
                            {index + 1}. {guru.guruName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {guru.bookings.toLocaleString()} booking{guru.bookings === 1 ? "" : "s"}
                          </p>
                        </div>
                        <p className="text-sm font-black text-white">
                          {moneyShort(guru.guruNet)}
                        </p>
                      </div>
                      <div className="h-4 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-emerald-400"
                          style={{
                            width: `${barWidth(
                              guru.guruNet,
                              commissions.guruVisuals.maxGuruNet
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-center text-sm text-slate-400">
                    No Guru earning rows found yet.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-white">
                    SitGuru Fee Contribution
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Platform fee by Guru.
                  </p>
                </div>
                <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-bold text-sky-200">
                  Fee
                </span>
              </div>

              <div className="mt-6 space-y-5">
                {commissions.topGurus.length ? (
                  commissions.topGurus.map((guru) => (
                    <VisualBar
                      key={`${guru.guruName}-fee-chart`}
                      label={guru.guruName}
                      value={guru.platformFee}
                      max={commissions.guruVisuals.maxGuruFee}
                      amount={moneyShort(guru.platformFee)}
                      tone="sky"
                    />
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-center text-sm text-slate-400">
                    No SitGuru fee rows found yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Top Guru Earnings
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
              Earnings by Guru
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Aggregated Guru net payout value from booking rows, with gross,
              SitGuru fee, and Guru net visual split bars.
            </p>

            <div className="mt-6 space-y-4">
              {commissions.topGurus.length ? (
                commissions.topGurus.map((guru) => (
                  <div
                    key={guru.guruName}
                    className="rounded-3xl border border-white/10 bg-slate-950/40 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-white">{guru.guruName}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {guru.bookings.toLocaleString()} booking
                          {guru.bookings === 1 ? "" : "s"}
                        </p>
                      </div>
                      <p className="text-lg font-black text-white">
                        {money(guru.guruNet)}
                      </p>
                    </div>

                    <div className="mt-5 space-y-4">
                      <VisualBar
                        label="Gross"
                        value={guru.gross}
                        max={commissions.guruVisuals.maxGuruGross}
                        amount={moneyShort(guru.gross)}
                        tone="violet"
                      />
                      <VisualBar
                        label="SitGuru Fee"
                        value={guru.platformFee}
                        max={commissions.guruVisuals.maxGuruFee}
                        amount={moneyShort(guru.platformFee)}
                        tone="sky"
                      />
                      <VisualBar
                        label="Guru Net"
                        value={guru.guruNet}
                        max={commissions.guruVisuals.maxGuruNet}
                        amount={moneyShort(guru.guruNet)}
                        tone="emerald"
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center text-sm text-slate-400">
                  No Guru earning rows found yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                  Commission Ledger
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                  Booking commission rows
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Gross booking value, SitGuru fee, Guru net, and payout state.
                </p>
              </div>

              <ActionLink href="/admin/exports" label="Export" />
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-white/5 text-slate-400">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                        Booking
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                        Guru
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                        Gross
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                        Fee
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                        Guru Net
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/10 bg-slate-950/40">
                    {commissions.rows.length ? (
                      commissions.rows.map((row) => (
                        <tr key={row.id} className="transition hover:bg-white/5">
                          <td className="px-4 py-4">
                            <Link
                              href={row.href}
                              className="font-semibold text-white transition hover:text-emerald-300"
                            >
                              {row.bookingId}
                            </Link>
                            <p className="mt-1 text-xs text-slate-500">
                              {row.createdAt}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-slate-300">
                            {row.guruName}
                          </td>
                          <td className="px-4 py-4 font-semibold text-white">
                            {money(row.grossAmount)}
                          </td>
                          <td className="px-4 py-4 font-semibold text-emerald-300">
                            {money(row.platformFee)}
                          </td>
                          <td className="px-4 py-4 font-semibold text-white">
                            {money(row.guruNet)}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-2">
                              <span
                                className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold ${paymentStatusClasses(
                                  row.paymentStatus
                                )}`}
                              >
                                {row.paymentStatus}
                              </span>
                              <span
                                className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold ${statusClasses(
                                  row.payoutStatus
                                )}`}
                              >
                                {row.payoutStatus}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-slate-400"
                        >
                          No commission rows found yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
