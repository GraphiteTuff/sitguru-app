import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PresetCard = {
  title: string;
  description: string;
  period: string;
  href: string;
  tone: "green" | "blue" | "amber" | "purple" | "slate";
};

type ReportOption = {
  title: string;
  description: string;
  category: "Statements" | "Operations" | "Tax" | "Audit";
  included: string[];
  href: string;
  tone: "green" | "blue" | "amber" | "purple" | "rose" | "slate";
};

type ExportCard = {
  title: string;
  description: string;
  href: string;
};

type ReviewStep = {
  step: string;
  title: string;
  description: string;
  status: "Ready" | "Review" | "Pending";
};

type AnyRow = Record<string, unknown>;

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type GrowthFinancialSummaryRow = {
  financial_category: string;
  financial_statement_section: string;
  row_count: number;
  total_amount: number;
  first_activity_date: string | null;
  last_activity_date: string | null;
  source: string;
};

type GrowthCampaignRoiRow = {
  campaign_id: string | null;
  campaign_name: string;
  campaign_slug: string | null;
  channel: string;
  campaign_type: string;
  source: string | null;
  clicks: number;
  leads: number;
  signups: number;
  bookings: number;
  attributed_revenue: number;
  total_cost: number;
  net_growth_return: number;
  roi_percent: number | null;
  signup_conversion_percent: number | null;
  booking_conversion_percent: number | null;
  cost_per_signup: number | null;
  cost_per_booking: number | null;
  growth_signal: string;
  admin_recommendation: string;
  last_event_at: string | null;
  last_cost_date: string | null;
};

type ReferralRewardRow = {
  id: string;
  reward_type: string;
  reward_status: string;
  financial_category: string;
  financial_treatment: string;
  normalized_amount: number;
  created_at: string | null;
  source: string;
};

type MarketingExpenseRow = {
  financial_category: string;
  financial_statement_section: string;
  amount: number;
  cost_date: string | null;
  campaign_name: string;
  channel: string;
  source: string;
};

type CustomReportGrowthData = {
  isLive: boolean;
  warnings: string[];
  financialSummaryRows: GrowthFinancialSummaryRow[];
  campaignRows: GrowthCampaignRoiRow[];
  rewardRows: ReferralRewardRow[];
  marketingExpenseRows: MarketingExpenseRow[];
  totals: {
    marketingExpense: number;
    pendingRewardLiability: number;
    issuedReferralRewards: number;
    attributedRevenue: number;
    totalGrowthCost: number;
    netGrowthReturn: number;
    campaignsTracked: number;
    clicks: number;
    leads: number;
    signups: number;
    bookings: number;
    overallRoiPercent: number | null;
  };
};

const presetCards: PresetCard[] = [
  {
    title: "Year-to-Date",
    period: "Jan 1–Today",
    description:
      "Current-year performance, tax planning, CPA review, investor/lender requests, and owner financial review.",
    href: "/admin/financials/reports/custom?preset=ytd",
    tone: "green",
  },
  {
    title: "Month-to-Date",
    period: "Current Month",
    description:
      "Month-to-date close review with statements, ledger activity, Stripe activity, payouts, and exceptions.",
    href: "/admin/financials/reports/custom?preset=mtd",
    tone: "blue",
  },
  {
    title: "Quarter-to-Date",
    period: "Current Quarter",
    description:
      "Quarter-to-date performance for tax estimates, CPA planning, partner reporting, and management review.",
    href: "/admin/financials/reports/custom?preset=qtd",
    tone: "amber",
  },
  {
    title: "Launch-to-Date",
    period: "Jun 1, 2026–Today",
    description:
      "Launch-year tracking from SitGuru’s planned June 1, 2026 launch date through the selected report date.",
    href: "/admin/financials/reports/custom?preset=launch-to-date",
    tone: "purple",
  },
  {
    title: "Trailing 12 Months",
    period: "Last 12 Months",
    description:
      "Rolling annual performance, growth trends, cash runway, expense patterns, and long-term financial health.",
    href: "/admin/financials/reports/custom?preset=ttm",
    tone: "slate",
  },
  {
    title: "Custom Date Range",
    period: "Choose Dates",
    description:
      "Build a custom report period for CPA requests, audit support, banking review, investor reporting, or internal analysis.",
    href: "/admin/financials/reports/custom?preset=custom",
    tone: "green",
  },
];

const reportOptions: ReportOption[] = [
  {
    title: "Core Financial Statements",
    category: "Statements",
    description:
      "Generate the standard statement package for the selected date range.",
    href: "/admin/financials/reports/custom?include=statements",
    tone: "green",
    included: [
      "Profit & Loss",
      "Balance Sheet",
      "Cash Flow Statement",
      "Shareholders’ Equity",
      "Statement notes",
    ],
  },
  {
    title: "Growth, Referrals & Marketing ROI",
    category: "Operations",
    description:
      "Add campaign spend, PawPerks liability, issued referral rewards, growth ROI, and conversion funnel details to the custom package.",
    href: "/admin/financials/reports/custom?include=growth-referrals",
    tone: "green",
    included: [
      "Campaign ROI summary",
      "Marketing expense detail",
      "Pending referral reward liability",
      "Issued reward expense",
      "Clicks, leads, signups, and bookings",
    ],
  },
  {
    title: "General Ledger & Trial Balance",
    category: "Audit",
    description:
      "Detailed accounting backup for audit review, CPA support, and transaction verification.",
    href: "/admin/financials/reports/custom?include=ledger",
    tone: "slate",
    included: [
      "General Ledger Detail",
      "Trial Balance",
      "Journal adjustments",
      "Transaction references",
      "Audit notes",
    ],
  },
  {
    title: "Marketplace Operations",
    category: "Operations",
    description:
      "Operational finance detail across bookings, customers, gurus, partners, payouts, and commissions.",
    href: "/admin/financials/reports/custom?include=marketplace",
    tone: "blue",
    included: [
      "Gross bookings",
      "Customer payments",
      "Guru payouts",
      "Partner commissions",
      "Refunds and chargebacks",
    ],
  },
  {
    title: "Stripe, Bank & Card Reconciliation",
    category: "Audit",
    description:
      "Reconciliation support for Stripe, bank deposits, card charges, refunds, disputes, and payout batches.",
    href: "/admin/financials/reports/custom?include=reconciliation",
    tone: "purple",
    included: [
      "Stripe payment activity",
      "Stripe fees",
      "Bank deposit matching",
      "Refund/dispute support",
      "Unmatched transactions",
    ],
  },
  {
    title: "Tax Category Summary",
    category: "Tax",
    description:
      "Tax-ready categorization for deductions, 1099 support, payments, fees, refunds, and expense review.",
    href: "/admin/financials/reports/custom?include=tax",
    tone: "amber",
    included: [
      "Deductible expense detail",
      "1099-eligible payments",
      "Contractor/vendor payments",
      "Tax category totals",
      "CPA notes",
    ],
  },
  {
    title: "A/R, A/P, Payroll & Contractors",
    category: "Statements",
    description:
      "Working schedules for receivables, payables, payroll, contractor payments, and open obligations.",
    href: "/admin/financials/reports/custom?include=schedules",
    tone: "rose",
    included: [
      "A/R aging",
      "A/P aging",
      "Payroll records",
      "Contractor payments",
      "Open obligations",
    ],
  },
];

const reviewSteps: ReviewStep[] = [
  {
    step: "01",
    title: "Choose report period",
    description:
      "Select YTD, month-to-date, quarter-to-date, launch-to-date, trailing 12 months, or a custom date range.",
    status: "Ready",
  },
  {
    step: "02",
    title: "Select report sections",
    description:
      "Choose statements, operations, tax schedules, ledger detail, reconciliation backup, growth ROI, referral rewards, and audit support.",
    status: "Review",
  },
  {
    step: "03",
    title: "Preview totals",
    description:
      "Review revenue, expenses, payouts, commissions, fees, refunds, growth costs, reward liabilities, net cash flow, and open exceptions.",
    status: "Pending",
  },
  {
    step: "04",
    title: "Review exceptions",
    description:
      "Resolve missing categories, unmatched deposits, campaign spend without revenue, reward payout holds, and commission approvals.",
    status: "Pending",
  },
  {
    step: "05",
    title: "Export package",
    description:
      "Download PDF, Excel workbook, CSV package, or full ZIP archive for CPA, tax, audit, or owner review.",
    status: "Pending",
  },
];

const exportCards: ExportCard[] = [
  {
    title: "Custom PDF Packet",
    description:
      "Readable report packet for CPA review, owner records, lender requests, investor reporting, or internal management.",
    href: "/admin/financials/exports?type=custom&format=pdf",
  },
  {
    title: "Custom Excel Workbook",
    description:
      "Multi-tab workbook with selected statements, schedules, transactions, reconciliations, tax categories, growth ROI, reward liability, and notes.",
    href: "/admin/financials/exports?type=custom&format=xlsx",
  },
  {
    title: "Custom CSV Package",
    description:
      "CSV files for selected date range, QuickBooks-style import, CPA analysis, bookkeeping review, and audit backup.",
    href: "/admin/financials/exports?type=custom&format=csv",
  },
  {
    title: "Custom ZIP Archive",
    description:
      "Full archive containing PDF, Excel workbook, CSV files, reconciliations, audit schedules, growth/referral backup, and report packages.",
    href: "/admin/financials/exports?type=custom&format=zip",
  },
];

function toneClasses(tone: PresetCard["tone"] | ReportOption["tone"]) {
  const tones = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    purple: "border-purple-200 bg-purple-50 text-purple-800",
    rose: "border-rose-200 bg-rose-50 text-rose-800",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return tones[tone];
}

function categoryClasses(category: ReportOption["category"]) {
  const categories = {
    Statements: "border-emerald-200 bg-emerald-50 text-emerald-800",
    Operations: "border-blue-200 bg-blue-50 text-blue-800",
    Tax: "border-amber-200 bg-amber-50 text-amber-800",
    Audit: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return categories[category];
}

function statusClasses(status: ReviewStep["status"]) {
  const statuses = {
    Ready: "border-emerald-200 bg-emerald-50 text-emerald-800",
    Review: "border-blue-200 bg-blue-50 text-blue-800",
    Pending: "border-slate-200 bg-slate-50 text-slate-600",
  };

  return statuses[status];
}

function safeString(value: unknown, fallback = "") {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function safeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function safeDate(value: unknown) {
  const stringValue = safeString(value);
  if (!stringValue) return null;

  const parsed = new Date(stringValue);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toISOString();
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));
}

function percent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Need data";
  return `${Math.round(value)}%`;
}

function formatDate(value: string | null) {
  if (!value) return "No date";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "No date";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string,
): Promise<{ rows: T[]; warning: string | null }> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Custom report query skipped for ${label}:`, result.error);
      return {
        rows: [],
        warning: `${label} is not available yet.`,
      };
    }

    return {
      rows: Array.isArray(result.data) ? (result.data as unknown as T[]) : [],
      warning: null,
    };
  } catch (error) {
    console.warn(`Custom report query skipped for ${label}:`, error);
    return {
      rows: [],
      warning: `${label} could not be loaded.`,
    };
  }
}

function normalizeSummaryRow(row: AnyRow): GrowthFinancialSummaryRow {
  return {
    financial_category: safeString(row.financial_category, "Uncategorized"),
    financial_statement_section: safeString(
      row.financial_statement_section,
      "Unmapped",
    ),
    row_count: safeNumber(row.row_count),
    total_amount: safeNumber(row.total_amount),
    first_activity_date: safeDate(row.first_activity_date),
    last_activity_date: safeDate(row.last_activity_date),
    source: safeString(row.source, "unknown"),
  };
}

function normalizeCampaignRow(row: AnyRow): GrowthCampaignRoiRow {
  return {
    campaign_id: safeString(row.campaign_id) || null,
    campaign_name: safeString(row.campaign_name, "Unassigned Campaign"),
    campaign_slug: safeString(row.campaign_slug) || null,
    channel: safeString(row.channel, "unknown"),
    campaign_type: safeString(row.campaign_type, "marketing"),
    source: safeString(row.source) || null,
    clicks: safeNumber(row.clicks),
    leads: safeNumber(row.leads),
    signups: safeNumber(row.signups),
    bookings: safeNumber(row.bookings),
    attributed_revenue: safeNumber(row.attributed_revenue),
    total_cost: safeNumber(row.total_cost),
    net_growth_return: safeNumber(row.net_growth_return),
    roi_percent:
      row.roi_percent === null || row.roi_percent === undefined
        ? null
        : safeNumber(row.roi_percent),
    signup_conversion_percent:
      row.signup_conversion_percent === null || row.signup_conversion_percent === undefined
        ? null
        : safeNumber(row.signup_conversion_percent),
    booking_conversion_percent:
      row.booking_conversion_percent === null || row.booking_conversion_percent === undefined
        ? null
        : safeNumber(row.booking_conversion_percent),
    cost_per_signup:
      row.cost_per_signup === null || row.cost_per_signup === undefined
        ? null
        : safeNumber(row.cost_per_signup),
    cost_per_booking:
      row.cost_per_booking === null || row.cost_per_booking === undefined
        ? null
        : safeNumber(row.cost_per_booking),
    growth_signal: safeString(row.growth_signal, "needs_more_data"),
    admin_recommendation: safeString(
      row.admin_recommendation,
      "Keep tracking. More data is needed before making a strong decision.",
    ),
    last_event_at: safeDate(row.last_event_at),
    last_cost_date: safeDate(row.last_cost_date),
  };
}

function normalizeRewardRow(row: AnyRow): ReferralRewardRow {
  return {
    id: safeString(row.id, `reward-${safeString(row.reward_type, "referral")}-${safeString(row.created_at, "unknown")}-${safeNumber(row.normalized_amount ?? row.amount)}`),
    reward_type: safeString(row.reward_type, "referral_reward"),
    reward_status: safeString(row.reward_status, safeString(row.status, "pending")),
    financial_category: safeString(row.financial_category, "Referral Rewards"),
    financial_treatment: safeString(row.financial_treatment, "liability"),
    normalized_amount: safeNumber(
      row.normalized_amount ?? row.amount ?? row.reward_amount ?? row.payout_amount,
    ),
    created_at: safeDate(row.created_at),
    source: safeString(row.source, "referral_rewards"),
  };
}

function normalizeMarketingRow(row: AnyRow): MarketingExpenseRow {
  return {
    financial_category: safeString(row.financial_category, "Growth Marketing"),
    financial_statement_section: safeString(
      row.financial_statement_section,
      "Operating Expenses",
    ),
    amount: safeNumber(row.amount ?? row.total_amount),
    cost_date: safeDate(row.cost_date ?? row.created_at),
    campaign_name: safeString(row.campaign_name, "Unassigned Campaign"),
    channel: safeString(row.channel, safeString(row.source, "unknown")),
    source: safeString(row.source, "growth_campaign_costs"),
  };
}

async function getCustomReportGrowthData(): Promise<CustomReportGrowthData> {
  const [summaryResult, campaignResult, rewardResult, marketingResult] =
    await Promise.all([
      safeRows<AnyRow>(
        supabaseAdmin
          .from("admin_growth_financial_summary")
          .select("*")
          .limit(500),
        "admin_growth_financial_summary",
      ),
      safeRows<AnyRow>(
        supabaseAdmin
          .from("admin_growth_campaign_roi")
          .select("*")
          .order("bookings", { ascending: false })
          .limit(500),
        "admin_growth_campaign_roi",
      ),
      safeRows<AnyRow>(
        supabaseAdmin
          .from("admin_referral_reward_liability")
          .select("*")
          .limit(500),
        "admin_referral_reward_liability",
      ),
      safeRows<AnyRow>(
        supabaseAdmin
          .from("admin_growth_marketing_expenses")
          .select("*")
          .limit(500),
        "admin_growth_marketing_expenses",
      ),
    ]);

  const financialSummaryRows = summaryResult.rows.map(normalizeSummaryRow);
  const campaignRows = campaignResult.rows.map(normalizeCampaignRow);
  const rewardRows = rewardResult.rows.map(normalizeRewardRow);
  const marketingExpenseRows = marketingResult.rows.map(normalizeMarketingRow);

  const marketingExpense = financialSummaryRows
    .filter((row) => row.source === "growth_campaign_costs")
    .reduce((sum, row) => sum + row.total_amount, 0);

  const pendingRewardLiability = rewardRows
    .filter((row) =>
      `${row.reward_status} ${row.financial_treatment}`
        .toLowerCase()
        .includes("pending") ||
      row.financial_treatment.toLowerCase().includes("liability"),
    )
    .reduce((sum, row) => sum + row.normalized_amount, 0);

  const issuedReferralRewards = rewardRows
    .filter((row) =>
      `${row.reward_status} ${row.financial_treatment}`
        .toLowerCase()
        .match(/paid|issued|credited|completed|expense/),
    )
    .reduce((sum, row) => sum + row.normalized_amount, 0);

  const attributedRevenue = campaignRows.reduce(
    (sum, row) => sum + row.attributed_revenue,
    0,
  );
  const totalGrowthCost = campaignRows.reduce((sum, row) => sum + row.total_cost, 0);
  const clicks = campaignRows.reduce((sum, row) => sum + row.clicks, 0);
  const leads = campaignRows.reduce((sum, row) => sum + row.leads, 0);
  const signups = campaignRows.reduce((sum, row) => sum + row.signups, 0);
  const bookings = campaignRows.reduce((sum, row) => sum + row.bookings, 0);
  const netGrowthReturn = attributedRevenue - totalGrowthCost;

  return {
    isLive:
      summaryResult.warning === null ||
      campaignResult.warning === null ||
      rewardResult.warning === null ||
      marketingResult.warning === null,
    warnings: [
      summaryResult.warning,
      campaignResult.warning,
      rewardResult.warning,
      marketingResult.warning,
    ].filter(Boolean) as string[],
    financialSummaryRows,
    campaignRows,
    rewardRows,
    marketingExpenseRows,
    totals: {
      marketingExpense,
      pendingRewardLiability,
      issuedReferralRewards,
      attributedRevenue,
      totalGrowthCost,
      netGrowthReturn,
      campaignsTracked: campaignRows.length,
      clicks,
      leads,
      signups,
      bookings,
      overallRoiPercent:
        totalGrowthCost > 0 ? (netGrowthReturn / totalGrowthCost) * 100 : null,
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

function MiniStat({
  label,
  value,
  detail,
  tone = "green",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "green" | "blue" | "amber" | "purple" | "slate";
}) {
  const tones = {
    green: "border-emerald-100 bg-emerald-50 text-emerald-700",
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    purple: "border-purple-100 bg-purple-50 text-purple-700",
    slate: "border-slate-100 bg-slate-50 text-slate-700",
  };

  return (
    <div className={`rounded-[1.25rem] border p-4 ${tones[tone]}`}>
      <p className="text-xs font-black uppercase tracking-[0.16em] opacity-85">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-bold leading-5 text-slate-600">{detail}</p>
    </div>
  );
}

function GrowthReferralCustomReportPanel({
  growthData,
}: {
  growthData: CustomReportGrowthData;
}) {
  const topCampaigns = growthData.campaignRows.slice(0, 6);
  const rewardRows = growthData.rewardRows.slice(0, 6);
  const marketingRows = growthData.marketingExpenseRows.slice(0, 6);

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
            Growth / Referral Custom Report
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Include PawPerks, Referral Rewards & Marketing ROI
          </h2>
          <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
            Custom reports now read the live growth/referral financial views so
            CPA, tax, audit, owner, and investor packages can include campaign
            spend, issued rewards, pending reward liability, attributed revenue,
            funnel movement, and campaign return.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${
              growthData.isLive
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            {growthData.isLive ? "Live Supabase Views" : "Preview / Offline"}
          </span>
          <Link
            href="/admin/referrals"
            className="rounded-full bg-emerald-700 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-emerald-800"
          >
            Open Growth & Referrals
          </Link>
        </div>
      </div>

      {growthData.warnings.length ? (
        <div className="mb-5 rounded-[1.25rem] border border-amber-100 bg-amber-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
            Source Check
          </p>
          <p className="mt-1 text-sm font-bold leading-6 text-slate-700">
            {growthData.warnings.join(" ")}
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MiniStat
          label="Marketing Expense"
          value={money(growthData.totals.marketingExpense)}
          detail="Campaign spend available for custom reports."
          tone="green"
        />
        <MiniStat
          label="Reward Liability"
          value={money(growthData.totals.pendingRewardLiability)}
          detail="Pending PawPerks/referral rewards."
          tone="amber"
        />
        <MiniStat
          label="Issued Rewards"
          value={money(growthData.totals.issuedReferralRewards)}
          detail="Rewards already issued, paid, or credited."
          tone="blue"
        />
        <MiniStat
          label="Attributed Revenue"
          value={money(growthData.totals.attributedRevenue)}
          detail="Revenue tied to campaign events."
          tone="green"
        />
        <MiniStat
          label="Growth ROI"
          value={percent(growthData.totals.overallRoiPercent)}
          detail="Revenue return versus tracked growth costs."
          tone="purple"
        />
        <MiniStat
          label="Campaigns"
          value={growthData.totals.campaignsTracked.toLocaleString()}
          detail="ROI rows available."
          tone="slate"
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[1.5rem] border border-slate-100 bg-[#fbfefd] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Custom Package Funnel
          </p>
          <h3 className="mt-2 text-xl font-black text-slate-950">
            Clicks → Leads → Signups → Bookings
          </h3>

          <div className="mt-5 grid gap-3 text-sm font-bold text-slate-600">
            <p className="flex justify-between gap-4">
              <span>Clicks / QR scans</span>
              <span className="text-slate-950">
                {growthData.totals.clicks.toLocaleString()}
              </span>
            </p>
            <p className="flex justify-between gap-4">
              <span>Leads / applications</span>
              <span className="text-slate-950">
                {growthData.totals.leads.toLocaleString()}
              </span>
            </p>
            <p className="flex justify-between gap-4">
              <span>Signups</span>
              <span className="text-slate-950">
                {growthData.totals.signups.toLocaleString()}
              </span>
            </p>
            <p className="flex justify-between gap-4">
              <span>Bookings</span>
              <span className="text-slate-950">
                {growthData.totals.bookings.toLocaleString()}
              </span>
            </p>
            <p className="flex justify-between gap-4 border-t border-slate-200 pt-3">
              <span>Net growth return</span>
              <span className="text-slate-950">
                {money(growthData.totals.netGrowthReturn)}
              </span>
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white">
          <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Campaign ROI rows for custom exports
            </p>
          </div>

          <div className="max-h-[360px] overflow-auto">
            {topCampaigns.length ? (
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {[
                      "Campaign",
                      "Bookings",
                      "Revenue",
                      "Cost",
                      "ROI",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topCampaigns.map((row) => (
                    <tr
                      key={`${row.campaign_slug || row.campaign_name}-${row.channel}`}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-5 py-4">
                        <p className="font-black text-slate-950">
                          {row.campaign_name}
                        </p>
                        <p className="text-xs font-bold text-slate-500">
                          {row.channel} · {row.growth_signal}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-700">
                        {row.bookings.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-700">
                        {money(row.attributed_revenue)}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-700">
                        {money(row.total_cost)}
                      </td>
                      <td className="px-5 py-4 font-black text-emerald-700">
                        {percent(row.roi_percent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-5">
                <p className="text-sm font-bold leading-6 text-slate-600">
                  No campaign ROI rows yet. Custom packages will populate when
                  campaign events and campaign costs are added.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[1.5rem] border border-slate-100 bg-[#fbfefd] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Reward rows included
          </p>
          <div className="mt-4 grid gap-3">
            {rewardRows.length ? (
              rewardRows.map((row) => (
                <div
                  key={row.id}
                  className="rounded-[1.25rem] border border-slate-100 bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-950">
                        {row.financial_category}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {row.reward_type} · {row.reward_status} · {row.financial_treatment}
                      </p>
                    </div>
                    <p className="text-sm font-black text-emerald-800">
                      {money(row.normalized_amount)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-[1.25rem] border border-dashed border-slate-200 bg-white p-4 text-sm font-bold text-slate-600">
                No referral reward rows found yet.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-100 bg-[#fbfefd] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Marketing cost rows included
          </p>
          <div className="mt-4 grid gap-3">
            {marketingRows.length ? (
              marketingRows.map((row, index) => (
                <div
                  key={`${row.campaign_name}-${row.channel}-${index}`}
                  className="rounded-[1.25rem] border border-slate-100 bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-950">
                        {row.campaign_name}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {row.financial_category} · {row.channel} · {formatDate(row.cost_date)}
                      </p>
                    </div>
                    <p className="text-sm font-black text-emerald-800">
                      {money(row.amount)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-[1.25rem] border border-dashed border-slate-200 bg-white p-4 text-sm font-bold text-slate-600">
                No growth marketing expense rows found yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function AdminFinancialsCustomReportPage() {
  const growthData = await getCustomReportGrowthData();

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
                  Custom / YTD Financial Report
                </h1>
                <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-purple-700">
                  Custom Builder
                </span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  Growth Ready
                </span>
              </div>

              <p className="mt-3 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
                Build custom financial packages for year-to-date reporting,
                launch-to-date reporting, CPA requests, tax planning, audit
                support, investor updates, lender requests, owner review, and
                Growth & Referrals performance.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[560px]">
              <Link
                href="/admin/financials/reports/daily"
                className="rounded-[1.25rem] border border-emerald-100 bg-emerald-50 p-4 transition hover:bg-emerald-100"
              >
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                  Daily
                </p>
                <p className="mt-2 text-xl font-black text-slate-950">
                  Open →
                </p>
              </Link>

              <Link
                href="/admin/financials/reports/weekly"
                className="rounded-[1.25rem] border border-blue-100 bg-blue-50 p-4 transition hover:bg-blue-100"
              >
                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                  Weekly
                </p>
                <p className="mt-2 text-xl font-black text-slate-950">
                  Open →
                </p>
              </Link>

              <Link
                href="/admin/financials/cpa-handoff"
                className="rounded-[1.25rem] border border-amber-100 bg-amber-50 p-4 transition hover:bg-amber-100"
              >
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                  CPA Tracker
                </p>
                <p className="mt-2 text-xl font-black text-slate-950">
                  Open →
                </p>
              </Link>
            </div>
          </div>
        </section>

        <GrowthReferralCustomReportPanel growthData={growthData} />

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="Report Period"
            title="Choose Reporting Range"
            description="Select the reporting range that matches the CPA, tax, audit, management, owner review, or growth analysis need."
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {presetCards.map((preset) => (
              <Link
                key={preset.title}
                href={preset.href}
                className="group flex min-h-[210px] flex-col justify-between rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
              >
                <div>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${toneClasses(
                      preset.tone,
                    )}`}
                  >
                    {preset.period}
                  </span>

                  <h3 className="mt-4 text-xl font-black tracking-tight text-slate-950">
                    {preset.title}
                  </h3>

                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    {preset.description}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm font-black text-emerald-800">
                    Select range
                  </span>
                  <ArrowCircle />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <SectionHeader
              eyebrow="Report Sections"
              title="Select Reports to Include"
              description="Choose the statements, schedules, reconciliations, growth ROI, referral liabilities, and support records to include in the custom package."
            />

            <div className="grid gap-4 lg:grid-cols-2">
              {reportOptions.map((option) => (
                <Link
                  key={option.title}
                  href={option.href}
                  className="group flex min-h-[330px] flex-col justify-between rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${categoryClasses(
                          option.category,
                        )}`}
                      >
                        {option.category}
                      </span>

                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${toneClasses(
                          option.tone,
                        )}`}
                      >
                        Include
                      </span>
                    </div>

                    <h3 className="mt-4 text-xl font-black tracking-tight text-slate-950">
                      {option.title}
                    </h3>

                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      {option.description}
                    </p>

                    <div className="mt-5 grid gap-2">
                      {option.included.map((item) => (
                        <p
                          key={item}
                          className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600"
                        >
                          ✓ {item}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-sm font-black text-emerald-800">
                      Add to package
                    </span>
                    <ArrowCircle />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
                Custom Package
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                Builder Workflow
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                Use this workflow to build, preview, and export a custom package.
              </p>

              <div className="mt-5 space-y-3">
                {reviewSteps.map((item) => (
                  <div
                    key={item.step}
                    className="rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-xs font-black text-white">
                        {item.step}
                      </span>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-black text-slate-950">
                            {item.title}
                          </h3>

                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${statusClasses(
                              item.status,
                            )}`}
                          >
                            {item.status}
                          </span>
                        </div>

                        <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-blue-100 bg-blue-50 p-5 shadow-sm sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-700">
                Owner Tip
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Use custom reports for questions
              </h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                Custom reports are helpful when your CPA, bookkeeper, lender,
                investor, or manager asks for a specific date range or a focused
                set of financial schedules.
              </p>

              <div className="mt-5 grid gap-2 text-sm font-bold text-slate-700">
                {[
                  "CPA questions",
                  "Tax planning",
                  "Banking review",
                  "Investor updates",
                  "Audit backup",
                  "Owner decision-making",
                  "Growth ROI questions",
                  "Referral reward liability review",
                ].map((item) => (
                  <p
                    key={item}
                    className="rounded-xl border border-blue-100 bg-white px-3 py-2"
                  >
                    ✓ {item}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-emerald-100 bg-emerald-800 p-5 text-white shadow-sm sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-100">
                Next Action
              </p>
              <h2 className="mt-2 text-2xl font-black">Preview before export</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-emerald-50">
                Before sending any custom package to your CPA, review the selected
                date range, included reports, growth ROI, reward liabilities,
                exceptions, and notes.
              </p>
              <Link
                href="/admin/financials/exports?type=custom"
                className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-emerald-800 transition hover:bg-emerald-50"
              >
                Open Export Center →
              </Link>
            </div>
          </aside>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="Custom Export"
            title="Download Custom Report Package"
            description="Export selected reports as a PDF, Excel workbook, CSV package, or ZIP archive for CPA review, tax planning, audit support, investor reporting, owner records, growth ROI, and referral reward backup."
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
