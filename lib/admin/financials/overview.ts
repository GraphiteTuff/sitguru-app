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
    const raw = record[key];

    if (typeof raw === "number") {
      return raw;
    }

    if (typeof raw === "string") {
      const parsed = Number(raw.replace(/[$,]/g, ""));
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return 0;
}

function sumRecords(records: MoneyRecord[], possibleKeys: string[]) {
  return records.reduce((total, record) => {
    return total + getAmount(record, possibleKeys);
  }, 0);
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
    record.status || record.payment_status || record.type || "",
  ).toLowerCase();

  return (
    status.includes("refund") ||
    status.includes("chargeback") ||
    status.includes("dispute")
  );
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
    readTable("payments", startIso, endIso),
    readTable("guru_payouts", startIso, endIso),
    readTable("partner_commissions", startIso, endIso),
    readTable("stripe_transactions", startIso, endIso),
    readTable("vendor_expenses", startIso, endIso),
  ]);

  const completedBookings = bookings.filter(isCompletedBooking);
  const refundTransactions = [
    ...payments.filter(isRefundOrChargeback),
    ...stripeTransactions.filter(isRefundOrChargeback),
  ];

  const grossBookings = sumRecords(completedBookings, [
    "total_amount",
    "gross_amount",
    "booking_total",
    "amount",
    "price",
  ]);

  const directPlatformRevenue = sumRecords(payments, [
    "platform_revenue",
    "application_fee_amount",
    "sitguru_fee",
    "service_fee",
    "platform_fee",
  ]);

  const platformRevenue =
    directPlatformRevenue > 0
      ? directPlatformRevenue
      : Math.round(grossBookings * 0.15);

  const guruPayoutTotal = sumRecords(guruPayouts, [
    "amount",
    "payout_amount",
    "guru_earnings",
    "net_payout",
  ]);

  const partnerCommissionTotal = sumRecords(partnerCommissions, [
    "amount",
    "commission_amount",
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
  ]);

  const netIncome =
    platformRevenue -
    guruPayoutTotal -
    partnerCommissionTotal -
    stripeFees -
    refundsChargebacks -
    operatingExpenses;

  const netMargin = grossBookings > 0 ? (netIncome / grossBookings) * 100 : 0;

  const cashBalance = netIncome;

  return {
    grossBookings,
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