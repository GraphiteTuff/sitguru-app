import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type RiskTone = "rose" | "amber" | "emerald" | "sky" | "violet" | "slate";

type FraudAlert = {
  id: string;
  title: string;
  detail: string;
  risk: "High" | "Medium" | "Low";
  status: string;
  source: string;
  href: string;
  amount: number;
  createdAt: string;
};

type RiskAccount = {
  id: string;
  name: string;
  type: string;
  signal: string;
  score: number;
  joined: string;
  href: string;
};

type PaymentHold = {
  id: string;
  owner: string;
  reason: string;
  status: string;
  amount: number;
  href: string;
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
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.abs(value));

  return value < 0 ? `(${formatted})` : formatted;
}

function moneyExact(value: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(value));

  return value < 0 ? `(${formatted})` : formatted;
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

function getHoursSince(value?: string | null) {
  if (!value) return 0;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 0;

  return Math.max(0, (Date.now() - parsed.getTime()) / 36e5);
}

function getCreatedAt(row: AnyRow) {
  return (
    asTrimmedString(row.created_at) ||
    asTrimmedString(row.createdAt) ||
    asTrimmedString(row.inserted_at) ||
    asTrimmedString(row.updated_at)
  );
}

function getRowId(row: AnyRow, fallback: string) {
  return (
    asTrimmedString(row.id) ||
    asTrimmedString(row.booking_id) ||
    asTrimmedString(row.case_number) ||
    asTrimmedString(row.dispute_number) ||
    fallback
  );
}

function getAmount(row: AnyRow) {
  return Math.max(
    toNumber(row.amount),
    toNumber(row.total_amount),
    toNumber(row.booking_total),
    toNumber(row.gross_amount),
    toNumber(row.refund_amount),
    toNumber(row.financial_impact),
    toNumber(row.financial_amount)
  );
}

function getCaseHref(kind: "booking" | "support" | "dispute" | "payment", id: string) {
  if (kind === "booking") return `/admin/bookings?booking=${encodeURIComponent(id)}`;
  if (kind === "support") return `/admin/support?case=${encodeURIComponent(id)}`;
  if (kind === "dispute") return `/admin/disputes?case=${encodeURIComponent(id)}`;
  return `/admin/payments?payment=${encodeURIComponent(id)}`;
}

function normalizeStatus(value: string) {
  return (
    value.replace(/_/g, " ").replace(/\b\w/g, (match) => match.toUpperCase()) ||
    "Review"
  );
}

function includesAny(value: string, terms: string[]) {
  const normalized = value.toLowerCase();
  return terms.some((term) => normalized.includes(term.toLowerCase()));
}

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Fraud page query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Fraud page query skipped for ${label}:`, error);
    return [];
  }
}

function getRiskFromSupportCase(row: AnyRow): "High" | "Medium" | "Low" {
  const priority = asTrimmedString(row.priority).toLowerCase();
  const caseType = asTrimmedString(row.case_type).toLowerCase();
  const subject = asTrimmedString(row.subject);
  const body = asTrimmedString(row.message_body || row.body || row.message);
  const text = `${caseType} ${subject} ${body}`.toLowerCase();

  if (
    priority === "urgent" ||
    includesAny(text, [
      "fraud",
      "chargeback",
      "stolen",
      "unsafe",
      "abuse",
      "threat",
      "scam",
      "duplicate charge",
    ])
  ) {
    return "High";
  }

  if (
    priority === "high" ||
    includesAny(text, [
      "refund",
      "payment",
      "cancel",
      "no show",
      "no-show",
      "complaint",
    ])
  ) {
    return "Medium";
  }

  return "Low";
}

function getRiskFromDispute(row: AnyRow): "High" | "Medium" | "Low" {
  const priority = asTrimmedString(row.priority).toLowerCase();
  const issueType = asTrimmedString(row.issue_type).toLowerCase();
  const summary = asTrimmedString(row.issue_summary).toLowerCase();

  if (
    priority === "urgent" ||
    issueType === "trust_safety" ||
    includesAny(summary, ["fraud", "unsafe", "abuse"])
  ) {
    return "High";
  }

  if (
    priority === "high" ||
    includesAny(issueType, ["refund", "payment", "booking"])
  ) {
    return "Medium";
  }

  return "Low";
}

function getRiskFromBooking(row: AnyRow): "High" | "Medium" | "Low" {
  const status = asTrimmedString(row.status).toLowerCase();
  const paymentStatus = asTrimmedString(row.payment_status).toLowerCase();
  const payoutStatus = asTrimmedString(row.payout_status).toLowerCase();
  const createdAt = getCreatedAt(row);
  const hoursSince = getHoursSince(createdAt);

  if (
    includesAny(`${status} ${paymentStatus} ${payoutStatus}`, [
      "failed",
      "chargeback",
      "dispute",
      "fraud",
      "hold",
      "blocked",
    ])
  ) {
    return "High";
  }

  if (
    hoursSince <= 24 ||
    includesAny(`${status} ${paymentStatus} ${payoutStatus}`, [
      "pending",
      "review",
      "cancel",
      "refund",
    ])
  ) {
    return "Medium";
  }

  return "Low";
}

function riskScoreFromSignal(risk: "High" | "Medium" | "Low", amount = 0) {
  const base = risk === "High" ? 86 : risk === "Medium" ? 68 : 42;
  const amountBoost = amount >= 500 ? 8 : amount >= 200 ? 5 : amount >= 100 ? 2 : 0;

  return Math.min(98, base + amountBoost);
}

function buildSupportAlerts(rows: AnyRow[]): FraudAlert[] {
  return rows
    .filter((row) => {
      const status = asTrimmedString(row.status).toLowerCase();
      return !["resolved", "closed", "archived"].includes(status);
    })
    .map((row, index) => {
      const caseNumber =
        asTrimmedString(row.case_number) ||
        asTrimmedString(row.support_number) ||
        getRowId(row, `SUP-${index + 1}`);
      const subject = asTrimmedString(row.subject) || "Support case needs review";
      const sender =
        asTrimmedString(row.sender_name) ||
        asTrimmedString(row.customer_name) ||
        "Sender";
      const status = normalizeStatus(asTrimmedString(row.status) || "new");
      const risk = getRiskFromSupportCase(row);
      const amount = getAmount(row);

      return {
        id: caseNumber,
        title: subject,
        detail: `${sender} • ${
          asTrimmedString(row.case_type).replace(/_/g, " ") || "support"
        }`,
        risk,
        status,
        source: "Support Intake",
        href: getCaseHref("support", caseNumber),
        amount,
        createdAt: getCreatedAt(row),
      };
    });
}

function buildDisputeAlerts(rows: AnyRow[]): FraudAlert[] {
  return rows
    .filter((row) => {
      const status = asTrimmedString(row.status).toLowerCase();
      return !["resolved", "closed", "archived"].includes(status);
    })
    .map((row, index) => {
      const disputeNumber =
        asTrimmedString(row.dispute_number) || getRowId(row, `DP-${index + 1}`);
      const issue = asTrimmedString(row.issue_type).replace(/_/g, " ") || "dispute";
      const summary = asTrimmedString(row.issue_summary) || "Open dispute case";
      const risk = getRiskFromDispute(row);
      const amount = Math.max(
        toNumber(row.refund_amount),
        toNumber(row.financial_impact),
        toNumber(row.financial_amount)
      );

      return {
        id: disputeNumber,
        title: normalizeStatus(issue),
        detail: summary,
        risk,
        status: normalizeStatus(asTrimmedString(row.status) || "open"),
        source: "Disputes",
        href: getCaseHref("dispute", disputeNumber),
        amount,
        createdAt: getCreatedAt(row),
      };
    });
}

function buildBookingAlerts(rows: AnyRow[]): FraudAlert[] {
  return rows
    .filter((row) => {
      const status = asTrimmedString(row.status).toLowerCase();
      const paymentStatus = asTrimmedString(row.payment_status).toLowerCase();
      const payoutStatus = asTrimmedString(row.payout_status).toLowerCase();
      const text = `${status} ${paymentStatus} ${payoutStatus}`;

      return (
        includesAny(text, [
          "pending",
          "review",
          "hold",
          "failed",
          "chargeback",
          "dispute",
          "cancel",
          "refund",
        ]) || getHoursSince(getCreatedAt(row)) <= 24
      );
    })
    .slice(0, 75)
    .map((row, index) => {
      const bookingId =
        asTrimmedString(row.id) ||
        asTrimmedString(row.booking_id) ||
        `booking-${index + 1}`;
      const customer =
        asTrimmedString(row.customer_name) ||
        asTrimmedString(row.pet_parent_name) ||
        "Pet parent";
      const guru = asTrimmedString(row.guru_name) || "Guru";
      const risk = getRiskFromBooking(row);
      const status =
        asTrimmedString(row.payout_status) ||
        asTrimmedString(row.payment_status) ||
        asTrimmedString(row.status) ||
        "Review";

      return {
        id: bookingId,
        title: `Booking ${bookingId}`,
        detail: `${customer} ↔ ${guru}`,
        risk,
        status: normalizeStatus(status),
        source: "Bookings",
        href: getCaseHref("booking", bookingId),
        amount: getAmount(row),
        createdAt: getCreatedAt(row),
      };
    });
}

function buildPaymentHolds(
  disputeRows: AnyRow[],
  supportRows: AnyRow[],
  ledgerRows: AnyRow[]
): PaymentHold[] {
  const disputeHolds = disputeRows
    .filter((row) => {
      const status = asTrimmedString(row.status).toLowerCase();
      return !["resolved", "closed", "archived"].includes(status);
    })
    .map((row, index) => {
      const disputeNumber =
        asTrimmedString(row.dispute_number) || getRowId(row, `DP-${index + 1}`);
      const amount = Math.max(
        toNumber(row.refund_amount),
        toNumber(row.financial_impact),
        toNumber(row.financial_amount)
      );

      return {
        id: disputeNumber,
        owner: asTrimmedString(row.customer_name) || "Customer dispute",
        reason:
          asTrimmedString(row.issue_summary) ||
          "Open dispute requires payout review",
        status: normalizeStatus(asTrimmedString(row.status) || "open"),
        amount,
        href: getCaseHref("dispute", disputeNumber),
      };
    });

  const supportHolds = supportRows
    .filter((row) => {
      const status = asTrimmedString(row.status).toLowerCase();
      const caseType = asTrimmedString(row.case_type).toLowerCase();

      return (
        !["resolved", "closed", "archived"].includes(status) &&
        includesAny(caseType, ["refund", "payment", "trust", "safety"])
      );
    })
    .map((row, index) => {
      const caseNumber =
        asTrimmedString(row.case_number) ||
        asTrimmedString(row.support_number) ||
        getRowId(row, `SUP-${index + 1}`);

      return {
        id: caseNumber,
        owner: asTrimmedString(row.sender_name) || "Support sender",
        reason:
          asTrimmedString(row.subject) ||
          "Support case may affect payment or payout",
        status: normalizeStatus(asTrimmedString(row.status) || "new"),
        amount: getAmount(row),
        href: getCaseHref("support", caseNumber),
      };
    });

  const ledgerHolds = ledgerRows
    .filter((row) => {
      const account = asTrimmedString(row.account_name).toLowerCase();
      return includesAny(account, ["refund", "credit", "dispute"]);
    })
    .slice(0, 10)
    .map((row, index) => {
      const sourceId =
        asTrimmedString(row.source_id) || getRowId(row, `ledger-${index + 1}`);
      const amount = Math.max(toNumber(row.debit), toNumber(row.credit));

      return {
        id: sourceId,
        owner: asTrimmedString(row.account_name) || "Ledger adjustment",
        reason: asTrimmedString(row.memo) || "Financial ledger refund/dispute entry",
        status: "Posted Ledger Entry",
        amount,
        href: "/admin/financials",
      };
    });

  return [...disputeHolds, ...supportHolds, ...ledgerHolds].slice(0, 12);
}

function buildRiskAccounts(
  bookings: AnyRow[],
  supportRows: AnyRow[],
  disputeRows: AnyRow[]
): RiskAccount[] {
  const fromSupport = supportRows.map((row, index) => {
    const caseNumber =
      asTrimmedString(row.case_number) ||
      asTrimmedString(row.support_number) ||
      `support-${index + 1}`;
    const risk = getRiskFromSupportCase(row);

    return {
      id: caseNumber,
      name:
        asTrimmedString(row.sender_name) ||
        asTrimmedString(row.customer_name) ||
        "Support sender",
      type: asTrimmedString(row.case_type).replace(/_/g, " ") || "Support",
      signal: asTrimmedString(row.subject) || "Open support signal",
      score: riskScoreFromSignal(risk, getAmount(row)),
      joined: getCreatedAt(row),
      href: getCaseHref("support", caseNumber),
    };
  });

  const fromDisputes = disputeRows.map((row, index) => {
    const disputeNumber = asTrimmedString(row.dispute_number) || `dispute-${index + 1}`;
    const risk = getRiskFromDispute(row);

    return {
      id: disputeNumber,
      name: asTrimmedString(row.customer_name) || "Dispute customer",
      type: asTrimmedString(row.issue_type).replace(/_/g, " ") || "Dispute",
      signal: asTrimmedString(row.issue_summary) || "Open dispute signal",
      score: riskScoreFromSignal(risk, getAmount(row)),
      joined: getCreatedAt(row),
      href: getCaseHref("dispute", disputeNumber),
    };
  });

  const fromBookings = bookings
    .filter((row) => getRiskFromBooking(row) !== "Low")
    .map((row, index) => {
      const bookingId =
        asTrimmedString(row.id) ||
        asTrimmedString(row.booking_id) ||
        `booking-${index + 1}`;
      const risk = getRiskFromBooking(row);

      return {
        id: bookingId,
        name:
          asTrimmedString(row.customer_name) ||
          asTrimmedString(row.pet_parent_name) ||
          "Booking customer",
        type: "Booking",
        signal:
          asTrimmedString(row.payment_status) ||
          asTrimmedString(row.payout_status) ||
          asTrimmedString(row.status) ||
          "Booking requires review",
        score: riskScoreFromSignal(risk, getAmount(row)),
        joined: getCreatedAt(row),
        href: getCaseHref("booking", bookingId),
      };
    });

  return [...fromDisputes, ...fromSupport, ...fromBookings]
    .filter((item) => item.name && item.name !== "—")
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

function getToneClasses(tone: RiskTone) {
  const classes: Record<RiskTone, string> = {
    rose: "border-rose-400/25 bg-rose-400/10 text-rose-100",
    amber: "border-amber-400/25 bg-amber-400/10 text-amber-100",
    emerald: "border-emerald-400/25 bg-emerald-400/10 text-emerald-100",
    sky: "border-sky-400/25 bg-sky-400/10 text-sky-100",
    violet: "border-violet-400/25 bg-violet-400/10 text-violet-100",
    slate: "border-white/10 bg-white/5 text-slate-200",
  };

  return classes[tone];
}

function getRiskBadgeClasses(risk: string) {
  const normalized = risk.toLowerCase();

  if (normalized.includes("high") || normalized.includes("urgent")) {
    return "border-rose-400/25 bg-rose-400/10 text-rose-100";
  }

  if (normalized.includes("medium") || normalized.includes("review")) {
    return "border-amber-400/25 bg-amber-400/10 text-amber-100";
  }

  return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
}

function getStatusBadgeClasses(status: string) {
  const normalized = status.toLowerCase();

  if (
    includesAny(normalized, [
      "frozen",
      "respond",
      "escalated",
      "failed",
      "blocked",
      "chargeback",
    ])
  ) {
    return "border-rose-400/25 bg-rose-400/10 text-rose-100";
  }

  if (
    includesAny(normalized, [
      "pending",
      "manual",
      "hold",
      "evidence",
      "monitor",
      "review",
      "waiting",
    ])
  ) {
    return "border-amber-400/25 bg-amber-400/10 text-amber-100";
  }

  if (includesAny(normalized, ["resolved", "posted", "verified"])) {
    return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  }

  return "border-sky-400/25 bg-sky-400/10 text-sky-100";
}

function StatCard({
  label,
  value,
  detail,
  tone = "slate",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: RiskTone;
}) {
  return (
    <div
      className={`rounded-3xl border p-5 shadow-[0_10px_40px_rgba(0,0,0,0.18)] ${getToneClasses(
        tone
      )}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-80">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-tight text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{detail}</p>
    </div>
  );
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
  return (
    <Link
      href={href}
      className={
        primary
          ? "inline-flex items-center justify-center rounded-2xl bg-rose-500 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-rose-500/20 transition hover:bg-rose-400"
          : "inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-black text-white transition hover:border-emerald-300/30 hover:bg-white/10"
      }
    >
      {label}
    </Link>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-6 text-center text-sm font-semibold text-slate-400">
      {message}
    </div>
  );
}

async function getFraudData() {
  const [bookings, supportCases, disputes, ledgerEntries] = await Promise.all([
    safeRows<AnyRow>(
      supabaseAdmin
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
      "bookings"
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("support_intake_cases")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
      "support_intake_cases"
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("dispute_cases")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
      "dispute_cases"
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("financial_ledger_entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
      "financial_ledger_entries"
    ),
  ]);

  const supportAlerts = buildSupportAlerts(supportCases);
  const disputeAlerts = buildDisputeAlerts(disputes);
  const bookingAlerts = buildBookingAlerts(bookings);

  const allAlerts = [...disputeAlerts, ...supportAlerts, ...bookingAlerts]
    .sort((a, b) => {
      const riskWeight = { High: 3, Medium: 2, Low: 1 } as Record<string, number>;
      const riskDiff = riskWeight[b.risk] - riskWeight[a.risk];

      if (riskDiff !== 0) return riskDiff;

      return (
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
      );
    })
    .slice(0, 25);

  const paymentHolds = buildPaymentHolds(disputes, supportCases, ledgerEntries);
  const riskAccounts = buildRiskAccounts(bookings, supportCases, disputes);

  const highRiskAlerts = allAlerts.filter((item) => item.risk === "High");
  const mediumRiskAlerts = allAlerts.filter((item) => item.risk === "Medium");
  const openDisputes = disputes.filter(
    (row) => !["resolved", "closed"].includes(asTrimmedString(row.status).toLowerCase())
  );
  const openSupport = supportCases.filter(
    (row) => !["resolved", "closed"].includes(asTrimmedString(row.status).toLowerCase())
  );
  const reviewBookings = bookingAlerts.length;
  const paymentHoldAmount = paymentHolds.reduce((sum, item) => sum + item.amount, 0);
  const refundLedgerAmount = ledgerEntries
    .filter((row) => includesAny(asTrimmedString(row.account_name), ["refund", "credit"]))
    .reduce((sum, row) => sum + Math.max(toNumber(row.debit), toNumber(row.credit)), 0);

  const trustScore = Math.max(
    0,
    Math.min(
      100,
      92 -
        highRiskAlerts.length * 4 -
        mediumRiskAlerts.length * 1.5 -
        Math.min(openDisputes.length, 10)
    )
  );

  return {
    bookings,
    supportCases,
    disputes,
    ledgerEntries,
    allAlerts,
    highRiskAlerts,
    mediumRiskAlerts,
    openDisputes,
    openSupport,
    reviewBookings,
    paymentHolds,
    riskAccounts,
    paymentHoldAmount,
    refundLedgerAmount,
    trustScore,
  };
}

export default async function AdminFraudPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const data = await getFraudData();
  const maxScore = Math.max(...data.riskAccounts.map((item) => item.score), 100);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(244,63,94,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.13),_transparent_32%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-rose-500/15 via-slate-950 to-sky-500/10 p-6 shadow-[0_12px_60px_rgba(0,0,0,0.28)] lg:p-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-300">
                Trust & Safety Command
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Fraud monitoring and payout protection.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Review suspicious bookings, support cases, payment holds, dispute
                signals, refund activity, and Guru payout risks from one SitGuru
                operations center.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <ActionLink href="/admin/support" label="Support" />
              <ActionLink href="/admin/disputes" label="Disputes" />
              <ActionLink href="/admin/payments" label="Payments" />
              <ActionLink href="/admin/bookings" label="Bookings" primary />
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="High Risk Alerts"
              value={data.highRiskAlerts.length.toLocaleString()}
              detail="Open items with urgent trust, safety, fraud, chargeback, or payment signals."
              tone="rose"
            />
            <StatCard
              label="Bookings Under Review"
              value={data.reviewBookings.toLocaleString()}
              detail="Bookings with pending, review, hold, failed, refund, or dispute indicators."
              tone="amber"
            />
            <StatCard
              label="Payment / Refund Exposure"
              value={money(data.paymentHoldAmount + data.refundLedgerAmount)}
              detail="Open payment holds plus posted refund or credit ledger activity."
              tone="violet"
            />
            <StatCard
              label="Trust Score"
              value={`${Math.round(data.trustScore)}%`}
              detail="Internal platform health score based on open risk volume and severity."
              tone="emerald"
            />
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-300">
                  Unified Risk Queue
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                  Live issues requiring review.
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Pulls from support intake, disputes, bookings, and financial
                  ledger signals.
                </p>
              </div>

              <Link
                href="/admin/support"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-white transition hover:bg-white/10"
              >
                Open support queue
              </Link>
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-white/5 text-slate-400">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                        Source
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                        Case
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                        Signal
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                        Risk
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                        Status
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/10 bg-slate-950/40">
                    {data.allAlerts.length ? (
                      data.allAlerts.map((item) => (
                        <tr
                          key={`${item.source}-${item.id}-${item.title}`}
                          className="align-top transition hover:bg-white/5"
                        >
                          <td className="px-4 py-4 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                            {item.source}
                          </td>
                          <td className="px-4 py-4">
                            <Link
                              href={item.href}
                              className="font-black text-white hover:text-emerald-200"
                            >
                              {item.id}
                            </Link>
                            <p className="mt-1 text-xs text-slate-500">
                              {formatDateShort(item.createdAt)}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-bold text-white">{item.title}</p>
                            <p className="mt-1 max-w-sm text-sm leading-6 text-slate-400">
                              {item.detail}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${getRiskBadgeClasses(
                                item.risk
                              )}`}
                            >
                              {item.risk}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${getStatusBadgeClasses(
                                item.status
                              )}`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 font-black text-white">
                            {moneyExact(item.amount)}
                          </td>
                          <td className="px-4 py-4">
                            <Link
                              href={item.href}
                              className="inline-flex rounded-2xl bg-rose-500 px-4 py-2 text-xs font-black text-white transition hover:bg-rose-400"
                            >
                              Review
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-10">
                          <EmptyState message="No open fraud, dispute, support, or booking risk signals found." />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
                Fast Actions
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                Protect funds before release.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                SitGuru’s 48-hour payout review window gives management time to
                resolve support, refund, safety, and payment issues before Guru
                payouts are released.
              </p>

              <div className="mt-5 grid gap-3">
                <Link
                  href="/admin/disputes"
                  className="rounded-2xl bg-rose-500 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-rose-400"
                >
                  Review open disputes
                </Link>
                <Link
                  href="/admin/support"
                  className="rounded-2xl bg-amber-500 px-4 py-3 text-center text-sm font-black text-slate-950 transition hover:bg-amber-400"
                >
                  Investigate support cases
                </Link>
                <Link
                  href="/admin/payments"
                  className="rounded-2xl bg-white/5 px-4 py-3 text-center text-sm font-black text-white ring-1 ring-white/10 transition hover:bg-white/10"
                >
                  Check payments and payouts
                </Link>
                <Link
                  href="/admin/financials/cash-flow"
                  className="rounded-2xl bg-white/5 px-4 py-3 text-center text-sm font-black text-white ring-1 ring-white/10 transition hover:bg-white/10"
                >
                  View cash impact
                </Link>
              </div>
            </section>

            <section className="rounded-[32px] border border-sky-400/20 bg-sky-400/10 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
                Trust Score Pulse
              </p>
              <p className="mt-3 text-4xl font-black text-white">
                {Math.round(data.trustScore)}%
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Platform trust health based on high-risk alerts, open disputes, and
                payout-sensitive cases.
              </p>

              <div className="mt-5 space-y-3">
                {[
                  { label: "Booking integrity", value: Math.max(18, data.trustScore - 6) },
                  { label: "Payment confidence", value: Math.max(12, data.trustScore - 12) },
                  { label: "Account authenticity", value: Math.max(10, data.trustScore - 9) },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs font-bold text-slate-300">
                      <span>{item.label}</span>
                      <span>{Math.round(item.value)}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-950/70">
                      <div
                        className="h-full rounded-full bg-sky-300"
                        style={{
                          width: `${Math.min(100, Math.max(5, item.value))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-2">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-300">
              Payment Holds
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
              Payout and refund exposure.
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Open disputes, support cases, and posted refund or credit activity
              that may affect cash and payout release.
            </p>

            <div className="mt-6 space-y-3">
              {data.paymentHolds.length ? (
                data.paymentHolds.map((item) => (
                  <Link
                    key={`${item.id}-${item.reason}`}
                    href={item.href}
                    className="block rounded-3xl border border-white/10 bg-slate-950/50 p-4 transition hover:border-rose-300/30 hover:bg-white/10"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-black text-white">{item.owner}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-400">
                          {item.reason}
                        </p>
                        <span
                          className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-black ${getStatusBadgeClasses(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="text-lg font-black text-white">
                        {moneyExact(item.amount)}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <EmptyState message="No payment holds or refund ledger exposure found." />
              )}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-300">
              Account Signals
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
              Risk-ranked accounts and cases.
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Sorted by risk score using support, dispute, and booking signals.
            </p>

            <div className="mt-6 space-y-3">
              {data.riskAccounts.length ? (
                data.riskAccounts.map((item) => (
                  <Link
                    key={`${item.id}-${item.name}`}
                    href={item.href}
                    className="block rounded-3xl border border-white/10 bg-slate-950/50 p-4 transition hover:border-violet-300/30 hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate font-black text-white">{item.name}</p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                          {item.type}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                          {item.signal}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Joined / opened {formatDateShort(item.joined)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="rounded-2xl bg-slate-950 px-4 py-3 text-center ring-1 ring-white/10">
                          <p className="text-2xl font-black text-white">
                            {item.score}
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                            Risk
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-950/70">
                      <div
                        className="h-full rounded-full bg-violet-300"
                        style={{
                          width: `${Math.max(
                            6,
                            Math.min(100, (item.score / maxScore) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  </Link>
                ))
              ) : (
                <EmptyState message="No account risk signals found." />
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm lg:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Payout Protection Rules
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                Built around SitGuru’s 48-hour review window.
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Pet parents pay securely at booking. Guru payouts are released 48
                hours after completed care unless a support case, refund request,
                chargeback, dispute, or safety review is open.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "Review before release",
                  body: "New support or dispute activity should automatically pause payout decisions until management clears the case.",
                },
                {
                  title: "Protect cash",
                  body: "Refunds and credits should post to financials before a payout is released so SitGuru does not overpay.",
                },
                {
                  title: "Keep both sides fair",
                  body: "Use notes and branded email updates so Gurus and customers know when a case is being reviewed.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5"
                >
                  <h3 className="text-lg font-black text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}