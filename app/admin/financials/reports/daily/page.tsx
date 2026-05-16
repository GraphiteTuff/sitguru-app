import Link from "next/link";

import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type DailyMetric = {
  label: string;
  value: string;
  helper: string;
  tone: "green" | "blue" | "amber" | "rose" | "slate";
};

type ActivityCard = {
  eyebrow: string;
  title: string;
  description: string;
  value: string;
  href: string;
  tone: "green" | "blue" | "amber" | "rose" | "purple" | "slate";
};

type ExceptionItem = {
  title: string;
  description: string;
  severity: "High" | "Medium" | "Low";
  status: "Open" | "Review" | "Watching";
  href: string;
};

type ExportCard = {
  title: string;
  description: string;
  href: string;
};

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type GrowthFinancialSummaryRow = {
  financial_category?: string | null;
  financial_statement_section?: string | null;
  row_count?: number | string | null;
  total_amount?: number | string | null;
  first_activity_date?: string | null;
  last_activity_date?: string | null;
  source?: string | null;
};

type GrowthCampaignRoiRow = {
  campaign_id?: string | null;
  campaign_name?: string | null;
  campaign_slug?: string | null;
  channel?: string | null;
  campaign_type?: string | null;
  source?: string | null;
  clicks?: number | string | null;
  leads?: number | string | null;
  signups?: number | string | null;
  bookings?: number | string | null;
  attributed_revenue?: number | string | null;
  total_cost?: number | string | null;
  net_growth_return?: number | string | null;
  roi_percent?: number | string | null;
  signup_conversion_percent?: number | string | null;
  booking_conversion_percent?: number | string | null;
  cost_per_signup?: number | string | null;
  cost_per_booking?: number | string | null;
  growth_signal?: string | null;
  admin_recommendation?: string | null;
  last_event_at?: string | null;
  last_cost_date?: string | null;
};

type ReferralRewardLiabilityRow = Record<string, unknown>;
type GrowthMarketingExpenseRow = Record<string, unknown>;

type DailyGrowthData = {
  isLive: boolean;
  generatedAt: string;
  message: string;
  dailySummaryRows: GrowthFinancialSummaryRow[];
  dailyRoiRows: GrowthCampaignRoiRow[];
  dailyRewardRows: ReferralRewardLiabilityRow[];
  dailyMarketingRows: GrowthMarketingExpenseRow[];
  sourceHealth: {
    label: string;
    table: string;
    rowCount: number;
    dailyRows: number;
    ok: boolean;
  }[];
  totals: {
    marketingExpense: number;
    pendingRewardLiability: number;
    issuedReferralRewards: number;
    totalAttributedRevenue: number;
    totalGrowthCost: number;
    netGrowthReturn: number;
    overallRoiPercent: number | null;
    campaignsTracked: number;
    clicks: number;
    leads: number;
    signups: number;
    bookings: number;
    rewardRows: number;
    marketingRows: number;
  };
};

const dailyMetrics: DailyMetric[] = [
  {
    label: "Gross Bookings",
    value: "$18,420",
    helper: "Today’s customer booking volume.",
    tone: "green",
  },
  {
    label: "Payments Collected",
    value: "$16,875",
    helper: "Customer payments captured today.",
    tone: "green",
  },
  {
    label: "Platform Revenue",
    value: "$2,531",
    helper: "Estimated SitGuru revenue today.",
    tone: "blue",
  },
  {
    label: "Guru Payouts Due",
    value: "$10,940",
    helper: "Payable guru balance from eligible stays.",
    tone: "amber",
  },
  {
    label: "Stripe Fees",
    value: "$489",
    helper: "Estimated processing fees.",
    tone: "slate",
  },
  {
    label: "Refunds / Chargebacks",
    value: "$320",
    helper: "Refunds, disputes, and chargebacks today.",
    tone: "rose",
  },
  {
    label: "Partner Commissions",
    value: "$615",
    helper: "Partner commissions accrued today.",
    tone: "blue",
  },
  {
    label: "Net Cash Movement",
    value: "$4,511",
    helper: "Estimated retained cash after payouts and fees.",
    tone: "green",
  },
];

const activityCards: ActivityCard[] = [
  {
    eyebrow: "Bookings",
    title: "Daily Booking Activity",
    description:
      "Review bookings created, confirmed, cancelled, completed, and pending for today.",
    value: "124",
    href: "/admin/bookings",
    tone: "green",
  },
  {
    eyebrow: "Customers",
    title: "Customer Payment Activity",
    description:
      "Review customer charges, failed payments, refunds, disputes, and payment exceptions.",
    value: "$16.9K",
    href: "/admin/financials/stripe",
    tone: "blue",
  },
  {
    eyebrow: "Gurus",
    title: "Guru Payout Watch",
    description:
      "Review payable balances, payout eligibility, payout holds, and exception items.",
    value: "$10.9K",
    href: "/admin/financials/payouts",
    tone: "amber",
  },
  {
    eyebrow: "Partners",
    title: "Partner Commission Watch",
    description:
      "Review partner referral earnings, commission accruals, approval status, and exceptions.",
    value: "$615",
    href: "/admin/financials/commissions",
    tone: "purple",
  },
  {
    eyebrow: "Stripe",
    title: "Stripe Settlement Check",
    description:
      "Review daily payments, fees, refunds, transfers, payout timing, and dispute activity.",
    value: "Ready",
    href: "/admin/financials/stripe",
    tone: "slate",
  },
  {
    eyebrow: "Banking",
    title: "Cash Deposit Review",
    description:
      "Compare Stripe settlements and cash receipts to expected bank deposit timing.",
    value: "2 pending",
    href: "/admin/financials/reconciliation",
    tone: "rose",
  },
];

const exceptions: ExceptionItem[] = [
  {
    title: "Two Stripe transfers pending bank match",
    description:
      "Expected settlement deposits should be reviewed against Navy Federal business banking once posted.",
    severity: "Medium",
    status: "Review",
    href: "/admin/financials/reconciliation",
  },
  {
    title: "One refund requires category confirmation",
    description:
      "Confirm whether the refund relates to customer cancellation, service credit, dispute, or admin adjustment.",
    severity: "Medium",
    status: "Open",
    href: "/admin/financials/stripe",
  },
  {
    title: "Partner commission batch needs approval",
    description:
      "Review accrued partner commissions before moving them into the payable batch.",
    severity: "Low",
    status: "Watching",
    href: "/admin/financials/commissions",
  },
];

const dailyCloseSteps = [
  "Review today’s bookings, cancellations, refunds, and payment exceptions.",
  "Confirm Stripe payment activity, processing fees, disputes, and transfer timing.",
  "Review guru payout eligibility and hold any payout with an unresolved booking issue.",
  "Review partner commission accruals and flag any referral exceptions.",
  "Review PawPerks, Guru referral, Ambassador, and Partner reward liability created today.",
  "Review campaign costs, QR code activity, referral signups, attributed bookings, and growth ROI signals.",
  "Match expected cash movement to bank deposit timing when deposits post.",
  "Add notes for CPA/bookkeeper if any transaction needs explanation.",
];

const exportCards: ExportCard[] = [
  {
    title: "Daily PDF Snapshot",
    description:
      "Readable daily report for owner review, CPA notes, management handoff, growth/referral activity, and internal records.",
    href: "/admin/financials/exports?type=daily&format=pdf",
  },
  {
    title: "Daily Excel Workbook",
    description:
      "Workbook with daily metrics, booking activity, payment activity, growth ROI, reward liability, exceptions, and notes.",
    href: "/admin/financials/exports?type=daily&format=xlsx",
  },
  {
    title: "Daily CSV Package",
    description:
      "CSV files for daily transactions, Stripe activity, payouts, commissions, campaign costs, referral rewards, and exceptions.",
    href: "/admin/financials/exports?type=daily&format=csv",
  },
  {
    title: "Daily ZIP Archive",
    description:
      "Full daily backup package containing PDF, Excel, CSV files, campaign ROI support, referral liability support, and schedules.",
    href: "/admin/financials/exports?type=daily&format=zip",
  },
];

function toneClasses(tone: DailyMetric["tone"] | ActivityCard["tone"]) {
  const tones = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    rose: "border-rose-200 bg-rose-50 text-rose-800",
    purple: "border-purple-200 bg-purple-50 text-purple-800",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return tones[tone];
}

function severityClasses(severity: ExceptionItem["severity"]) {
  const classes = {
    High: "border-rose-200 bg-rose-50 text-rose-800",
    Medium: "border-amber-200 bg-amber-50 text-amber-800",
    Low: "border-blue-200 bg-blue-50 text-blue-800",
  };

  return classes[severity];
}

function statusClasses(status: ExceptionItem["status"]) {
  const classes = {
    Open: "border-rose-200 bg-rose-50 text-rose-800",
    Review: "border-amber-200 bg-amber-50 text-amber-800",
    Watching: "border-blue-200 bg-blue-50 text-blue-800",
  };

  return classes[status];
}

function safeNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,%\s,]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function safeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));
}

function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Need cost";
  return `${Math.round(value)}%`;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function toDateKey(value?: string | null) {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toISOString().slice(0, 10);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function isToday(value?: string | null) {
  return toDateKey(value) === todayKey();
}

function rowDateMatchesToday(...values: Array<string | null | undefined>) {
  return values.some((value) => isToday(value));
}

function lowerParts(...values: unknown[]) {
  return values.map((value) => safeText(value).toLowerCase()).join(" ");
}

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Daily report query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Daily report query skipped for ${label}:`, error);
    return [];
  }
}

function getRowDate(row: Record<string, unknown>) {
  return (
    safeText(row.last_activity_date) ||
    safeText(row.last_event_at) ||
    safeText(row.last_cost_date) ||
    safeText(row.reward_date) ||
    safeText(row.issued_at) ||
    safeText(row.paid_at) ||
    safeText(row.created_at) ||
    safeText(row.updated_at) ||
    ""
  );
}

function isDailySummaryRow(row: GrowthFinancialSummaryRow) {
  return rowDateMatchesToday(row.last_activity_date, row.first_activity_date);
}

function isDailyRoiRow(row: GrowthCampaignRoiRow) {
  return rowDateMatchesToday(row.last_event_at, row.last_cost_date);
}

function isDailyGenericRow(row: Record<string, unknown>) {
  return isToday(getRowDate(row));
}

function sumSummaryRows(
  rows: GrowthFinancialSummaryRow[],
  matcher: (row: GrowthFinancialSummaryRow) => boolean,
) {
  return rows
    .filter(matcher)
    .reduce((sum, row) => sum + safeNumber(row.total_amount), 0);
}

function sumGenericRows(rows: Record<string, unknown>[]) {
  return rows.reduce((sum, row) => {
    const amount =
      safeNumber(row.total_amount) ||
      safeNumber(row.amount) ||
      safeNumber(row.reward_amount) ||
      safeNumber(row.payout_amount) ||
      safeNumber(row.cost_amount);

    return sum + amount;
  }, 0);
}

function getRewardStatus(row: Record<string, unknown>) {
  return lowerParts(
    row.reward_status,
    row.status,
    row.payout_status,
    row.liability_status,
    row.financial_statement_section,
    row.financial_category,
  );
}

function buildDynamicMetrics(growth: DailyGrowthData): DailyMetric[] {
  return [
    ...dailyMetrics,
    {
      label: "Growth Marketing",
      value: formatCurrency(growth.totals.marketingExpense),
      helper: "Campaign costs visible in today’s growth financial views.",
      tone: "blue",
    },
    {
      label: "Reward Liability",
      value: formatCurrency(growth.totals.pendingRewardLiability),
      helper: "Pending PawPerks, Guru, Ambassador, and Partner reward exposure.",
      tone: "amber",
    },
    {
      label: "Growth ROI",
      value: formatPercent(growth.totals.overallRoiPercent),
      helper: "Attributed revenue vs. tracked daily growth cost.",
      tone:
        growth.totals.overallRoiPercent !== null &&
        growth.totals.overallRoiPercent < 0
          ? "rose"
          : "green",
    },
  ];
}

function buildDynamicActivityCards(growth: DailyGrowthData): ActivityCard[] {
  return [
    ...activityCards,
    {
      eyebrow: "Growth",
      title: "Campaign ROI Watch",
      description:
        "Review daily QR scans, paid ads, referral links, campaign costs, attributed revenue, signups, and bookings.",
      value: `${growth.totals.campaignsTracked}`,
      href: "/admin/analytics",
      tone: "green",
    },
    {
      eyebrow: "Rewards",
      title: "Referral Reward Queue",
      description:
        "Review today’s PawPerks, Guru referral, Ambassador, and Partner reward liabilities and issued reward expense.",
      value: formatCurrency(growth.totals.pendingRewardLiability),
      href: "/admin/referrals",
      tone: "amber",
    },
  ];
}

function buildDynamicExceptions(growth: DailyGrowthData): ExceptionItem[] {
  const dynamicExceptions: ExceptionItem[] = [];

  if (growth.totals.totalGrowthCost > 0 && growth.totals.bookings === 0) {
    dynamicExceptions.push({
      title: "Growth spend has no same-day attributed bookings yet",
      description:
        "Review landing pages, QR destinations, campaign tagging, and follow-up workflows before increasing spend.",
      severity: "Medium",
      status: "Review",
      href: "/admin/analytics",
    });
  }

  if (growth.totals.pendingRewardLiability > 0) {
    dynamicExceptions.push({
      title: "Referral reward liability created today",
      description:
        "Review pending PawPerks, Guru referral, Ambassador, and Partner reward obligations before payout approval.",
      severity: "Medium",
      status: "Open",
      href: "/admin/referrals",
    });
  }

  if (growth.totals.marketingExpense > 0 && growth.totals.clicks === 0) {
    dynamicExceptions.push({
      title: "Marketing cost found without matching campaign activity",
      description:
        "Confirm the campaign cost has a matching QR, UTM, referral link, or campaign event record.",
      severity: "Low",
      status: "Watching",
      href: "/admin/financials/reconciliation",
    });
  }

  return [...exceptions, ...dynamicExceptions];
}

async function getDailyGrowthData(): Promise<DailyGrowthData> {
  const [summaryRows, roiRows, rewardRows, marketingRows] = await Promise.all([
    safeRows<GrowthFinancialSummaryRow>(
      supabaseAdmin
        .from("admin_growth_financial_summary")
        .select("*")
        .limit(1000),
      "admin_growth_financial_summary",
    ),
    safeRows<GrowthCampaignRoiRow>(
      supabaseAdmin.from("admin_growth_campaign_roi").select("*").limit(1000),
      "admin_growth_campaign_roi",
    ),
    safeRows<ReferralRewardLiabilityRow>(
      supabaseAdmin
        .from("admin_referral_reward_liability")
        .select("*")
        .limit(1000),
      "admin_referral_reward_liability",
    ),
    safeRows<GrowthMarketingExpenseRow>(
      supabaseAdmin
        .from("admin_growth_marketing_expenses")
        .select("*")
        .limit(1000),
      "admin_growth_marketing_expenses",
    ),
  ]);

  const dailySummaryRows = summaryRows.filter(isDailySummaryRow);
  const dailyRoiRows = roiRows.filter(isDailyRoiRow);
  const dailyRewardRows = rewardRows.filter(isDailyGenericRow);
  const dailyMarketingRows = marketingRows.filter(isDailyGenericRow);

  const marketingExpenseFromSummary = sumSummaryRows(dailySummaryRows, (row) => {
    const text = lowerParts(
      row.financial_category,
      row.financial_statement_section,
      row.source,
    );

    return (
      text.includes("marketing") ||
      text.includes("advertising") ||
      text.includes("campaign")
    );
  });

  const marketingExpense =
    marketingExpenseFromSummary || sumGenericRows(dailyMarketingRows);

  const pendingRewardLiabilityFromSummary = sumSummaryRows(
    dailySummaryRows,
    (row) => {
      const text = lowerParts(
        row.financial_category,
        row.financial_statement_section,
        row.source,
      );

      return (
        text.includes("reward") &&
        (text.includes("liability") ||
          text.includes("payable") ||
          text.includes("pending"))
      );
    },
  );

  const pendingRewardLiability =
    pendingRewardLiabilityFromSummary ||
    sumGenericRows(
      dailyRewardRows.filter((row) => {
        const status = getRewardStatus(row);
        return (
          status.includes("pending") ||
          status.includes("liability") ||
          status.includes("payable") ||
          status.includes("review")
        );
      }),
    );

  const issuedReferralRewardsFromSummary = sumSummaryRows(
    dailySummaryRows,
    (row) => {
      const text = lowerParts(
        row.financial_category,
        row.financial_statement_section,
        row.source,
      );

      return (
        text.includes("reward") &&
        !text.includes("liability") &&
        !text.includes("pending") &&
        !text.includes("payable")
      );
    },
  );

  const issuedReferralRewards =
    issuedReferralRewardsFromSummary ||
    sumGenericRows(
      dailyRewardRows.filter((row) => {
        const status = getRewardStatus(row);
        return (
          status.includes("issued") ||
          status.includes("paid") ||
          status.includes("credited") ||
          status.includes("complete")
        );
      }),
    );

  const totalAttributedRevenue = dailyRoiRows.reduce(
    (sum, row) => sum + safeNumber(row.attributed_revenue),
    0,
  );
  const totalGrowthCost = dailyRoiRows.reduce(
    (sum, row) => sum + safeNumber(row.total_cost),
    0,
  );
  const netGrowthReturn = totalAttributedRevenue - totalGrowthCost;
  const overallRoiPercent =
    totalGrowthCost > 0 ? (netGrowthReturn / totalGrowthCost) * 100 : null;

  const clicks = dailyRoiRows.reduce((sum, row) => sum + safeNumber(row.clicks), 0);
  const leads = dailyRoiRows.reduce((sum, row) => sum + safeNumber(row.leads), 0);
  const signups = dailyRoiRows.reduce(
    (sum, row) => sum + safeNumber(row.signups),
    0,
  );
  const bookings = dailyRoiRows.reduce(
    (sum, row) => sum + safeNumber(row.bookings),
    0,
  );

  const sourceHealth = [
    {
      label: "Growth Financial Summary",
      table: "admin_growth_financial_summary",
      rowCount: summaryRows.length,
      dailyRows: dailySummaryRows.length,
      ok: true,
    },
    {
      label: "Campaign ROI",
      table: "admin_growth_campaign_roi",
      rowCount: roiRows.length,
      dailyRows: dailyRoiRows.length,
      ok: true,
    },
    {
      label: "Referral Reward Liability",
      table: "admin_referral_reward_liability",
      rowCount: rewardRows.length,
      dailyRows: dailyRewardRows.length,
      ok: true,
    },
    {
      label: "Marketing Expenses",
      table: "admin_growth_marketing_expenses",
      rowCount: marketingRows.length,
      dailyRows: dailyMarketingRows.length,
      ok: true,
    },
  ];

  const anyRows =
    summaryRows.length + roiRows.length + rewardRows.length + marketingRows.length;

  return {
    isLive: anyRows > 0,
    generatedAt: new Date().toISOString(),
    message:
      anyRows > 0
        ? "Live Growth & Referrals financial views are connected to the daily report."
        : "Growth & Referrals views are connected, but no daily rows are available yet.",
    dailySummaryRows,
    dailyRoiRows: dailyRoiRows.sort(
      (a, b) =>
        safeNumber(b.bookings) - safeNumber(a.bookings) ||
        safeNumber(b.attributed_revenue) - safeNumber(a.attributed_revenue),
    ),
    dailyRewardRows,
    dailyMarketingRows,
    sourceHealth,
    totals: {
      marketingExpense,
      pendingRewardLiability,
      issuedReferralRewards,
      totalAttributedRevenue,
      totalGrowthCost,
      netGrowthReturn,
      overallRoiPercent,
      campaignsTracked: dailyRoiRows.length,
      clicks,
      leads,
      signups,
      bookings,
      rewardRows: dailyRewardRows.length,
      marketingRows: dailyMarketingRows.length,
    },
  };
}

function ArrowCircle() {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 bg-white text-emerald-700 shadow-sm transition group-hover:border-emerald-200 group-hover:bg-emerald-700 group-hover:text-white">
      →
    </span>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
        {title}
      </h2>
      <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
        {description}
      </p>
    </div>
  );
}

function MiniTrend() {
  return (
    <svg viewBox="0 0 160 46" className="mt-4 h-12 w-full" aria-hidden="true">
      <path
        d="M2 34 C 18 24, 30 30, 44 18 S 70 22, 82 14 S 106 20, 120 11 S 146 14, 158 7"
        className="fill-none stroke-emerald-500"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M2 34 C 18 24, 30 30, 44 18 S 70 22, 82 14 S 106 20, 120 11 S 146 14, 158 7 L158 46 L2 46 Z"
        className="fill-emerald-50"
      />
    </svg>
  );
}

function GrowthMetricCard({
  label,
  value,
  helper,
  tone = "green",
}: {
  label: string;
  value: string;
  helper: string;
  tone?: DailyMetric["tone"];
}) {
  return (
    <div className="rounded-[1.25rem] border border-slate-100 bg-[#fbfefd] p-4">
      <span
        className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${toneClasses(
          tone,
        )}`}
      >
        {label}
      </span>
      <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
        {helper}
      </p>
    </div>
  );
}

function GrowthReferralDailyPanel({ growth }: { growth: DailyGrowthData }) {
  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeader
          eyebrow="Growth & Referrals"
          title="Daily Campaign ROI, PawPerks & Reward Liability"
          description="This report is wired into the Growth & Referrals financial views. Use it to see daily campaign costs, attributed revenue, referral reward exposure, issued reward expense, and conversion activity before the weekly or monthly report is prepared."
        />

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${
              growth.isLive
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            {growth.isLive ? "Live Supabase Views" : "No Daily Rows Yet"}
          </span>

          <Link
            href="/admin/referrals"
            className="rounded-full bg-emerald-700 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-emerald-800"
          >
            Open Growth &amp; Referrals
          </Link>
        </div>
      </div>

      <div
        className={`mb-5 rounded-[1.25rem] border p-4 ${
          growth.isLive
            ? "border-emerald-100 bg-emerald-50"
            : "border-amber-100 bg-amber-50"
        }`}
      >
        <p
          className={`text-xs font-black uppercase tracking-[0.18em] ${
            growth.isLive ? "text-emerald-700" : "text-amber-700"
          }`}
        >
          Daily Growth Feed Status
        </p>
        <p className="mt-1 text-sm font-bold leading-6 text-slate-700">
          {growth.message}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <GrowthMetricCard
          label="Marketing Expense"
          value={formatCurrency(growth.totals.marketingExpense)}
          helper="Campaign cost rows visible for today."
          tone="blue"
        />
        <GrowthMetricCard
          label="Reward Liability"
          value={formatCurrency(growth.totals.pendingRewardLiability)}
          helper="Pending PawPerks, Guru, Ambassador, and Partner rewards."
          tone="amber"
        />
        <GrowthMetricCard
          label="Issued Rewards"
          value={formatCurrency(growth.totals.issuedReferralRewards)}
          helper="Rewards issued, paid, credited, or expensed today."
          tone="green"
        />
        <GrowthMetricCard
          label="Attributed Revenue"
          value={formatCurrency(growth.totals.totalAttributedRevenue)}
          helper="Revenue tied to campaign activity today."
          tone="green"
        />
        <GrowthMetricCard
          label="Growth ROI"
          value={formatPercent(growth.totals.overallRoiPercent)}
          helper="Revenue return against tracked cost."
          tone={
            growth.totals.overallRoiPercent !== null &&
            growth.totals.overallRoiPercent < 0
              ? "rose"
              : "green"
          }
        />
        <GrowthMetricCard
          label="Campaign Rows"
          value={growth.totals.campaignsTracked.toLocaleString()}
          helper="Daily ROI rows in campaign view."
          tone="slate"
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[1.5rem] border border-slate-100 bg-[#fbfefd] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Daily conversion funnel
          </p>
          <h3 className="mt-2 text-xl font-black text-slate-950">
            Clicks → Leads → Signups → Bookings
          </h3>

          <div className="mt-5 grid gap-3 text-sm font-bold text-slate-600">
            <p className="flex justify-between gap-4">
              <span>Clicks / QR scans</span>
              <span className="text-slate-950">
                {growth.totals.clicks.toLocaleString()}
              </span>
            </p>
            <p className="flex justify-between gap-4">
              <span>Leads / applications</span>
              <span className="text-slate-950">
                {growth.totals.leads.toLocaleString()}
              </span>
            </p>
            <p className="flex justify-between gap-4">
              <span>Signups</span>
              <span className="text-slate-950">
                {growth.totals.signups.toLocaleString()}
              </span>
            </p>
            <p className="flex justify-between gap-4">
              <span>Bookings</span>
              <span className="text-slate-950">
                {growth.totals.bookings.toLocaleString()}
              </span>
            </p>
            <p className="flex justify-between gap-4 border-t border-slate-200 pt-3">
              <span>Net growth return</span>
              <span className="text-slate-950">
                {formatCurrency(growth.totals.netGrowthReturn)}
              </span>
            </p>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {growth.sourceHealth.map((source) => (
              <div
                key={source.table}
                className="rounded-[1.25rem] border border-slate-100 bg-white p-4"
              >
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  {source.label}
                </p>
                <p className="mt-2 text-xl font-black text-slate-950">
                  {source.dailyRows.toLocaleString()}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  today · {source.rowCount.toLocaleString()} total
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white">
          <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Daily campaign ROI rows
            </p>
          </div>

          <div className="max-h-[420px] overflow-auto">
            {growth.dailyRoiRows.length > 0 ? (
              <table className="w-full min-w-[840px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                      Campaign
                    </th>
                    <th className="px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                      Funnel
                    </th>
                    <th className="px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                      Revenue
                    </th>
                    <th className="px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                      Cost
                    </th>
                    <th className="px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                      Signal
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {growth.dailyRoiRows.slice(0, 10).map((row) => (
                    <tr
                      key={`${row.campaign_slug || row.campaign_name}-${row.channel}`}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-5 py-4">
                        <p className="font-black text-slate-950">
                          {row.campaign_name || "Unassigned Campaign"}
                        </p>
                        <p className="text-xs font-bold text-slate-500">
                          {row.channel || "unknown"} · {row.campaign_type || "growth"}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-xs font-bold leading-5 text-slate-600">
                        {safeNumber(row.clicks).toLocaleString()} clicks ·{" "}
                        {safeNumber(row.signups).toLocaleString()} signups ·{" "}
                        {safeNumber(row.bookings).toLocaleString()} bookings
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-700">
                        {formatCurrency(safeNumber(row.attributed_revenue))}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-700">
                        {formatCurrency(safeNumber(row.total_cost))}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-800">
                          {row.growth_signal || "needs_more_data"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-5">
                <p className="text-sm font-bold leading-6 text-slate-600">
                  No daily campaign ROI rows yet. When today’s QR scans, UTM
                  clicks, referral events, campaign costs, signups, or bookings
                  are recorded, they will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function AdminFinancialsDailyReportPage() {
  const growth = await getDailyGrowthData();
  const dynamicMetrics = buildDynamicMetrics(growth);
  const dynamicActivityCards = buildDynamicActivityCards(growth);
  const dynamicExceptions = buildDynamicExceptions(growth);

  return (
    <main className="min-h-screen bg-[#f7fbf8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <Link
                href="/admin/financials"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800 transition hover:bg-emerald-100"
              >
                ← Back to Financial Overview
              </Link>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-black tracking-tight text-slate-950">
                  Daily Financial Report
                </h1>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  Daily Snapshot
                </span>
                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-blue-800">
                  Growth &amp; Referrals Wired
                </span>
              </div>

              <p className="mt-3 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
                Daily owner snapshot for SitGuru’s financial activity. Review
                booking volume, payment collection, Stripe fees, refunds, guru
                payouts, partner commissions, cash movement, growth marketing
                spend, PawPerks and referral reward liability, campaign ROI, and
                exceptions before they become month-end issues.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[560px]">
              <div className="rounded-[1.25rem] border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                  Report Date
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {formatDate(new Date())}
                </p>
              </div>

              <div className="rounded-[1.25rem] border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                  Review Status
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  Open
                </p>
              </div>

              <div className="rounded-[1.25rem] border border-amber-100 bg-amber-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                  Exceptions
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {dynamicExceptions.length}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-11">
          {dynamicMetrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-sm"
            >
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${toneClasses(
                  metric.tone,
                )}`}
              >
                {metric.label}
              </span>

              <p className="mt-4 text-2xl font-black text-slate-950">
                {metric.value}
              </p>

              <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
                {metric.helper}
              </p>

              <MiniTrend />
            </div>
          ))}
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="Daily Activity"
            title="Operating Finance Snapshot"
            description="Review the daily flow of bookings, payments, guru payouts, partner commissions, Stripe activity, banking items, campaign ROI, and referral reward exposure."
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {dynamicActivityCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group flex min-h-[230px] flex-col justify-between rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${toneClasses(
                        card.tone,
                      )}`}
                    >
                      {card.eyebrow}
                    </span>

                    <p className="text-2xl font-black text-slate-950">
                      {card.value}
                    </p>
                  </div>

                  <h3 className="mt-4 text-xl font-black tracking-tight text-slate-950">
                    {card.title}
                  </h3>

                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    {card.description}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm font-black text-emerald-800">
                    Open details
                  </span>
                  <ArrowCircle />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <GrowthReferralDailyPanel growth={growth} />

        <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <SectionHeader
              eyebrow="Exceptions"
              title="Daily Financial Exceptions"
              description="Items listed here should be reviewed before they carry into weekly, monthly, or CPA handoff reporting."
            />

            <div className="space-y-3">
              {dynamicExceptions.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group grid gap-4 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-1 hover:border-emerald-200 hover:bg-white hover:shadow-lg sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${severityClasses(
                          item.severity,
                        )}`}
                      >
                        {item.severity}
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${statusClasses(
                          item.status,
                        )}`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-black text-slate-950">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      {item.description}
                    </p>
                  </div>

                  <ArrowCircle />
                </Link>
              ))}
            </div>
          </div>

          <aside className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
              Daily Close
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
              Daily review checklist
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              This checklist keeps daily issues from becoming monthly CPA close
              problems.
            </p>

            <div className="mt-5 space-y-3">
              {dailyCloseSteps.map((step, index) => (
                <div
                  key={step}
                  className="flex gap-4 rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm font-bold leading-6 text-slate-700">
                    {step}
                  </p>
                </div>
              ))}
            </div>

            <Link
              href="/admin/financials/cpa-handoff"
              className="mt-6 inline-flex rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
            >
              Open CPA Tracker →
            </Link>
          </aside>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="Daily Export"
            title="Download Daily Report Package"
            description="Export today’s report as a PDF, Excel workbook, CSV package, or ZIP archive for management review, CPA notes, growth/referral support, and audit backup."
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {exportCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group flex min-h-[220px] flex-col justify-between rounded-[1.5rem] border border-emerald-100 bg-[#fbfefd] p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:bg-white hover:shadow-lg"
              >
                <div>
                  <h3 className="text-xl font-black text-slate-950">
                    {card.title}
                  </h3>

                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                    {card.description}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm font-black text-emerald-800">
                    Prepare export
                  </span>
                  <ArrowCircle />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
