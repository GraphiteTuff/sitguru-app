import { createClient } from "@/lib/supabase/server";

export type FinancialKpiTone = "green" | "blue" | "red";

export type FinancialKpi = {
  label: string;
  value: string;
  change: string;
  helper: string;
  tone: FinancialKpiTone;
};

type MoneyRecord = Record<string, unknown>;

const fallbackKpis: FinancialKpi[] = [
  {
    label: "Gross Bookings",
    value: "$1,287,540",
    change: "↑ 10.3%",
    helper: "preview data",
    tone: "green",
  },
  {
    label: "Platform Revenue",
    value: "$192,845",
    change: "↑ 11.1%",
    helper: "preview data",
    tone: "green",
  },
  {
    label: "Guru Payouts",
    value: "$732,619",
    change: "↑ 12.3%",
    helper: "preview data",
    tone: "green",
  },
  {
    label: "Partner Commissions",
    value: "$78,214",
    change: "↑ 8.7%",
    helper: "preview data",
    tone: "blue",
  },
  {
    label: "Stripe Fees",
    value: "$23,761",
    change: "↑ 5.1%",
    helper: "preview data",
    tone: "blue",
  },
  {
    label: "Refunds / Chargebacks",
    value: "$5,914",
    change: "↓ 6.2%",
    helper: "preview data",
    tone: "red",
  },
  {
    label: "Net Margin",
    value: "16.8%",
    change: "↑ 11.1%",
    helper: "preview data",
    tone: "green",
  },
  {
    label: "Cash Balance",
    value: "$1,183,459",
    change: "↑ 9.4%",
    helper: "preview data",
    tone: "green",
  },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0.0%";
  return `${value.toFixed(1)}%`;
}

function formatChange(current: number, previous: number) {
  if (!previous || previous === 0) {
    return current > 0 ? "↑ 100.0%" : "0.0%";
  }

  const change = ((current - previous) / Math.abs(previous)) * 100;
  const arrow = change >= 0 ? "↑" : "↓";

  return `${arrow} ${Math.abs(change).toFixed(1)}%`;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getAmount(record: MoneyRecord, possibleKeys: string[]) {
  for (const key of possibleKeys) {
    if (!(key in record)) continue;
    const raw = record[key];

    let value = 0;
    if (typeof raw === "number") {
      value = raw;
    } else if (typeof raw === "string") {
      const parsed = Number(raw.replace(/[$,]/g, ""));
      if (!Number.isFinite(parsed)) continue;
      value = parsed;
    } else {
      continue;
    }

    if (!value && raw !== 0 && raw !== "0") continue;

    const lower = key.toLowerCase();
    if (
      lower.includes("cents") ||
      lower.includes("_cent") ||
      lower === "application_fee_amount"
    ) {
      return value / 100;
    }

    return value;
  }

  return 0;
}

function sumRecords(records: MoneyRecord[], possibleKeys: string[]) {
  return records.reduce((total, record) => {
    return total + getAmount(record, possibleKeys);
  }, 0);
}

async function readTable(tableName: string, startIso: string, endIso: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .gte("created_at", startIso)
      .lt("created_at", endIso)
      .limit(5000);

    if (error || !data) return [];

    return data as MoneyRecord[];
  } catch {
    return [];
  }
}

async function readFirstTable(
  tableNames: string[],
  startIso: string,
  endIso: string,
) {
  for (const tableName of tableNames) {
    const rows = await readTable(tableName, startIso, endIso);
    // Empty array can mean missing table OR truly empty — try next only when
    // the table failed (readTable returns [] on error). Prefer first non-error
    // by probing with a head count when all are empty.
    if (rows.length > 0) return rows;
  }

  // All empty: probe which tables exist and return the first reachable empty set.
  for (const tableName of tableNames) {
    try {
      const supabase = await createClient();
      const { error } = await supabase
        .from(tableName)
        .select("*", { head: true, count: "exact" })
        .limit(1);
      if (!error) return [];
    } catch {
      // try next
    }
  }

  return [];
}

function isCompletedBooking(record: MoneyRecord) {
  const status = String(
    record.status || record.booking_status || record.payment_status || "",
  ).toLowerCase();

  if (!status) return true;

  return [
    "completed",
    "confirmed",
    "paid",
    "succeeded",
    "finished",
    "approved",
  ].includes(status);
}

function isRefundOrChargeback(record: MoneyRecord) {
  const status = String(
    record.status ||
      record.payment_status ||
      record.dispute_status ||
      record.refund_status ||
      record.type ||
      "",
  ).toLowerCase();

  return (
    status.includes("refund") ||
    status.includes("chargeback") ||
    status.includes("dispute") ||
    Number(record.refund_amount_cents || 0) > 0 ||
    Number(record.dispute_amount_cents || 0) > 0
  );
}

async function getPeriodData(startIso: string, endIso: string) {
  const [
    bookings,
    payments,
    guruPayouts,
    partnerCommissions,
    stripeTransactions,
    vendorExpenses,
  ] = await Promise.all([
    readTable("bookings", startIso, endIso),
    readFirstTable(
      ["booking_payments", "payments", "stripe_transactions"],
      startIso,
      endIso,
    ),
    readFirstTable(["guru_payouts", "payouts"], startIso, endIso),
    readFirstTable(
      ["ambassador_rewards", "partner_commissions", "commission_ledger"],
      startIso,
      endIso,
    ),
    readFirstTable(
      ["booking_payments", "stripe_transactions", "payments"],
      startIso,
      endIso,
    ),
    readFirstTable(
      ["vendor_expenses", "admin_growth_marketing_expenses"],
      startIso,
      endIso,
    ),
  ]);

  const completedBookings = bookings.filter(isCompletedBooking);
  const refundTransactions = [
    ...payments.filter(isRefundOrChargeback),
    ...stripeTransactions.filter(isRefundOrChargeback),
  ];

  const grossBookings = sumRecords(completedBookings, [
    "total_amount",
    "customer_total_amount",
    "subtotal_amount",
    "gross_amount",
    "booking_total",
    "amount_cents",
    "amount",
    "price",
  ]);

  const paymentGross = sumRecords(payments, [
    "amount_cents",
    "total_cents",
    "amount",
    "total_amount",
    "gross_amount",
  ]);

  const effectiveGross =
    grossBookings > 0 ? grossBookings : paymentGross;

  const directPlatformRevenue = sumRecords(payments, [
    "marketplace_support_cents",
    "platform_fee_cents",
    "platform_revenue",
    "application_fee_amount",
    "sitguru_fee",
    "sitguru_fee_amount",
    "service_fee",
    "platform_fee",
  ]);

  const platformRevenue =
    directPlatformRevenue > 0
      ? directPlatformRevenue
      : Math.round(effectiveGross * 0.15);

  const guruPayoutTotal = sumRecords(guruPayouts, [
    "amount_cents",
    "amount",
    "payout_amount",
    "guru_payout_amount",
    "guru_earnings",
    "net_payout",
  ]);

  const partnerCommissionTotal = sumRecords(partnerCommissions, [
    "amount_cents",
    "reward_amount_cents",
    "amount",
    "commission_amount",
    "reward_amount",
    "partner_commission",
    "payout_amount",
  ]);

  const stripeFees = sumRecords(stripeTransactions, [
    "fee",
    "stripe_fee",
    "processing_fee",
    "fee_amount",
  ]);

  const refundsChargebacks = Math.abs(
    sumRecords(refundTransactions, [
      "refund_amount_cents",
      "dispute_amount_cents",
      "amount",
      "refund_amount",
      "chargeback_amount",
      "dispute_amount",
    ]),
  );

  const operatingExpenses = sumRecords(vendorExpenses, [
    "amount",
    "expense_amount",
    "total_amount",
    "total_cost",
    "cost",
  ]);

  const netIncome =
    platformRevenue -
    guruPayoutTotal -
    partnerCommissionTotal -
    stripeFees -
    refundsChargebacks -
    operatingExpenses;

  const netMargin = effectiveGross > 0 ? (netIncome / effectiveGross) * 100 : 0;

  const cashBalance = netIncome;

  return {
    grossBookings: effectiveGross,
    platformRevenue,
    guruPayoutTotal,
    partnerCommissionTotal,
    stripeFees,
    refundsChargebacks,
    operatingExpenses,
    netIncome,
    netMargin,
    cashBalance,
  };
}

export async function getFinancialOverviewKpis(): Promise<{
  kpis: FinancialKpi[];
  isLive: boolean;
  updatedAt: string;
}> {
  try {
    const today = startOfDay(new Date());
    const currentStart = addDays(today, -7);
    const previousStart = addDays(currentStart, -7);

    const currentStartIso = currentStart.toISOString();
    const currentEndIso = today.toISOString();
    const previousStartIso = previousStart.toISOString();
    const previousEndIso = currentStart.toISOString();

    const [current, previous] = await Promise.all([
      getPeriodData(currentStartIso, currentEndIso),
      getPeriodData(previousStartIso, previousEndIso),
    ]);

    const hasLiveData =
      current.grossBookings > 0 ||
      current.platformRevenue > 0 ||
      current.guruPayoutTotal > 0 ||
      current.partnerCommissionTotal > 0 ||
      current.stripeFees > 0 ||
      current.refundsChargebacks > 0 ||
      current.operatingExpenses > 0;

    if (!hasLiveData) {
      return {
        kpis: fallbackKpis,
        isLive: false,
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      isLive: true,
      updatedAt: new Date().toISOString(),
      kpis: [
        {
          label: "Gross Bookings",
          value: formatCurrency(current.grossBookings),
          change: formatChange(current.grossBookings, previous.grossBookings),
          helper: "last 7 days",
          tone: "green",
        },
        {
          label: "Platform Revenue",
          value: formatCurrency(current.platformRevenue),
          change: formatChange(
            current.platformRevenue,
            previous.platformRevenue,
          ),
          helper: "last 7 days",
          tone: "green",
        },
        {
          label: "Guru Payouts",
          value: formatCurrency(current.guruPayoutTotal),
          change: formatChange(
            current.guruPayoutTotal,
            previous.guruPayoutTotal,
          ),
          helper: "last 7 days",
          tone: "green",
        },
        {
          label: "Partner Commissions",
          value: formatCurrency(current.partnerCommissionTotal),
          change: formatChange(
            current.partnerCommissionTotal,
            previous.partnerCommissionTotal,
          ),
          helper: "last 7 days",
          tone: "blue",
        },
        {
          label: "Stripe Fees",
          value: formatCurrency(current.stripeFees),
          change: formatChange(current.stripeFees, previous.stripeFees),
          helper: "last 7 days",
          tone: "blue",
        },
        {
          label: "Refunds / Chargebacks",
          value: formatCurrency(current.refundsChargebacks),
          change: formatChange(
            current.refundsChargebacks,
            previous.refundsChargebacks,
          ),
          helper: "last 7 days",
          tone: "red",
        },
        {
          label: "Net Margin",
          value: formatPercent(current.netMargin),
          change: formatChange(current.netMargin, previous.netMargin),
          helper: "last 7 days",
          tone: current.netMargin >= 0 ? "green" : "red",
        },
        {
          label: "Cash Balance",
          value: formatCurrency(current.cashBalance),
          change: formatChange(current.cashBalance, previous.cashBalance),
          helper: "last 7 days",
          tone: current.cashBalance >= 0 ? "green" : "red",
        },
      ],
    };
  } catch {
    return {
      kpis: fallbackKpis,
      isLive: false,
      updatedAt: new Date().toISOString(),
    };
  }
}