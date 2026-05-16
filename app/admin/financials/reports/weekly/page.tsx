import Link from "next/link";

import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Tone = "green" | "blue" | "amber" | "rose" | "purple" | "slate";

type WeeklyMetric = {
  label: string;
  value: string;
  change: string;
  helper: string;
  tone: Tone;
};

type WeeklyReportCard = {
  eyebrow: string;
  title: string;
  description: string;
  value: string;
  href: string;
  tone: Tone;
};

type WeeklyException = {
  title: string;
  description: string;
  severity: "High" | "Medium" | "Low";
  status: "Open" | "Review" | "Watching";
  owner: string;
  href: string;
};

type ExportCard = {
  title: string;
  description: string;
  href: string;
};

type SourceHealth = {
  table: string;
  ok: boolean;
  rowCount: number;
  message: string;
};

type AnyRow = Record<string, unknown>;

type GrowthCampaignRow = {
  campaignName: string;
  campaignSlug: string;
  channel: string;
  campaignType: string;
  clicks: number;
  leads: number;
  signups: number;
  bookings: number;
  attributedRevenue: number;
  totalCost: number;
  netGrowthReturn: number;
  roiPercent: number | null;
  costPerSignup: number | null;
  costPerBooking: number | null;
  growthSignal: string;
  adminRecommendation: string;
  lastEventAt: string | null;
  lastCostDate: string | null;
};

type GrowthFinancialSummaryRow = {
  category: string;
  section: string;
  amount: number;
  rowCount: number;
  source: string;
  firstActivityDate: string | null;
  lastActivityDate: string | null;
};

type ReferralRewardRow = {
  id: string;
  rewardType: string;
  status: string;
  amount: number;
  recipient: string;
  source: string;
  date: string | null;
};

type WeeklyGrowthData = {
  isLive: boolean;
  sourceHealth: SourceHealth[];
  summaryRows: GrowthFinancialSummaryRow[];
  campaignRows: GrowthCampaignRow[];
  rewardRows: ReferralRewardRow[];
  totals: {
    marketingExpense: number;
    pendingRewardLiability: number;
    issuedRewardExpense: number;
    attributedRevenue: number;
    growthCost: number;
    netGrowthReturn: number;
    overallRoiPercent: number | null;
    clicks: number;
    leads: number;
    signups: number;
    bookings: number;
    campaignsTracked: number;
    costPerSignup: number | null;
    costPerBooking: number | null;
  };
};

const exportCards: ExportCard[] = [
  {
    title: "Weekly PDF Report",
    description:
      "Readable weekly management report for owner review, leadership updates, CPA notes, growth results, reward liabilities, and internal records.",
    href: "/admin/financials/exports?type=weekly&format=pdf",
  },
  {
    title: "Weekly Excel Workbook",
    description:
      "Multi-tab workbook with weekly KPIs, bookings, payment activity, payouts, commissions, campaign ROI, reward liabilities, and notes.",
    href: "/admin/financials/exports?type=weekly&format=xlsx",
  },
  {
    title: "Weekly CSV Package",
    description:
      "CSV files for weekly transactions, Stripe activity, payouts, commissions, campaign costs, referral rewards, bank matching, and exceptions.",
    href: "/admin/financials/exports?type=weekly&format=csv",
  },
  {
    title: "Weekly ZIP Archive",
    description:
      "Full weekly archive containing PDF, Excel workbook, CSV files, schedules, growth/referral support records, and CPA notes.",
    href: "/admin/financials/exports?type=weekly&format=zip",
  },
];

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function firstString(row: AnyRow, keys: string[]) {
  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }

  return "";
}

function firstNumber(row: AnyRow, keys: string[]) {
  for (const key of keys) {
    const value = asNumber(row[key]);
    if (value !== 0) return value;
  }

  return 0;
}

function normalizeLabel(value: unknown, fallback = "Unclassified") {
  const raw = asString(value);
  if (!raw) return fallback;

  return raw
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function money(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits,
  }).format(value || 0);
}

function percent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Need data";
  return `${Math.round(value)}%`;
}

function formatDate(value?: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getWeekWindow() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - 7);
  start.setHours(0, 0, 0, 0);

  return { start, end };
}

function isWithinWeek(value?: string | null) {
  if (!value) return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return true;
  const { start, end } = getWeekWindow();
  return date >= start && date <= end;
}

function toneClasses(tone: Tone) {
  const tones: Record<Tone, string> = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    rose: "border-rose-200 bg-rose-50 text-rose-800",
    purple: "border-purple-200 bg-purple-50 text-purple-800",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return tones[tone];
}

function severityClasses(severity: WeeklyException["severity"]) {
  const classes = {
    High: "border-rose-200 bg-rose-50 text-rose-800",
    Medium: "border-amber-200 bg-amber-50 text-amber-800",
    Low: "border-blue-200 bg-blue-50 text-blue-800",
  };

  return classes[severity];
}

function statusClasses(status: WeeklyException["status"]) {
  const classes = {
    Open: "border-rose-200 bg-rose-50 text-rose-800",
    Review: "border-amber-200 bg-amber-50 text-amber-800",
    Watching: "border-blue-200 bg-blue-50 text-blue-800",
  };

  return classes[status];
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

function MiniTrend({ tone = "green" }: { tone?: Tone }) {
  const stroke =
    tone === "rose"
      ? "stroke-rose-500"
      : tone === "blue"
        ? "stroke-blue-500"
        : tone === "amber"
          ? "stroke-amber-500"
          : tone === "purple"
            ? "stroke-purple-500"
            : tone === "slate"
              ? "stroke-slate-500"
              : "stroke-emerald-500";

  const fill =
    tone === "rose"
      ? "fill-rose-50"
      : tone === "blue"
        ? "fill-blue-50"
        : tone === "amber"
          ? "fill-amber-50"
          : tone === "purple"
            ? "fill-purple-50"
            : tone === "slate"
              ? "fill-slate-50"
              : "fill-emerald-50";

  return (
    <svg viewBox="0 0 160 46" className="mt-4 h-12 w-full" aria-hidden="true">
      <path
        d="M2 34 C 18 24, 30 30, 44 18 S 70 22, 82 14 S 106 20, 120 11 S 146 14, 158 7"
        className={`fill-none ${stroke}`}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M2 34 C 18 24, 30 30, 44 18 S 70 22, 82 14 S 106 20, 120 11 S 146 14, 158 7 L158 46 L2 46 Z"
        className={fill}
      />
    </svg>
  );
}

function StatCard({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  tone: Tone;
}) {
  return (
    <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-sm">
      <span
        className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${toneClasses(
          tone,
        )}`}
      >
        {label}
      </span>

      <p className="mt-4 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{helper}</p>
      <MiniTrend tone={tone} />
    </div>
  );
}

async function safeRows(table: string, query = "*") {
  try {
    const { data, error } = await supabaseAdmin.from(table).select(query).limit(1000);

    if (error) {
      return {
        rows: [] as AnyRow[],
        health: {
          table,
          ok: false,
          rowCount: 0,
          message: error.message || "Unable to query source.",
        },
      };
    }

    return {
      rows: Array.isArray(data) ? (data as unknown as AnyRow[]) : [],
      health: {
        table,
        ok: true,
        rowCount: Array.isArray(data) ? (data as unknown[]).length : 0,
        message: "Connected and queryable.",
      },
    };
  } catch (error) {
    return {
      rows: [] as AnyRow[],
      health: {
        table,
        ok: false,
        rowCount: 0,
        message: error instanceof Error ? error.message : "Unable to query source.",
      },
    };
  }
}

function normalizeCampaignRow(row: AnyRow): GrowthCampaignRow {
  const campaignName = firstString(row, ["campaign_name", "campaignName", "name"]) || "Unassigned Campaign";
  const campaignSlug = firstString(row, ["campaign_slug", "campaignSlug", "slug"]);
  const channel = firstString(row, ["channel", "source", "utm_source"]) || "unknown";
  const campaignType = firstString(row, ["campaign_type", "campaignType", "type"]) || "marketing";
  const totalCost = firstNumber(row, ["total_cost", "cost", "amount"]);
  const attributedRevenue = firstNumber(row, ["attributed_revenue", "revenue", "booking_amount"]);
  const netGrowthReturn =
    firstNumber(row, ["net_growth_return"]) || attributedRevenue - totalCost;
  const roiValue = row.roi_percent === null || row.roi_percent === undefined ? null : asNumber(row.roi_percent);

  return {
    campaignName,
    campaignSlug,
    channel,
    campaignType,
    clicks: firstNumber(row, ["clicks"]),
    leads: firstNumber(row, ["leads"]),
    signups: firstNumber(row, ["signups"]),
    bookings: firstNumber(row, ["bookings"]),
    attributedRevenue,
    totalCost,
    netGrowthReturn,
    roiPercent: roiValue,
    costPerSignup:
      row.cost_per_signup === null || row.cost_per_signup === undefined
        ? null
        : asNumber(row.cost_per_signup),
    costPerBooking:
      row.cost_per_booking === null || row.cost_per_booking === undefined
        ? null
        : asNumber(row.cost_per_booking),
    growthSignal: firstString(row, ["growth_signal", "growthSignal"]) || "needs_more_data",
    adminRecommendation:
      firstString(row, ["admin_recommendation", "adminRecommendation"]) ||
      "Keep tracking until more campaign data is available.",
    lastEventAt: firstString(row, ["last_event_at", "lastEventAt"]) || null,
    lastCostDate: firstString(row, ["last_cost_date", "lastCostDate"]) || null,
  };
}

function normalizeSummaryRow(row: AnyRow): GrowthFinancialSummaryRow {
  return {
    category:
      firstString(row, ["financial_category", "category", "account"]) ||
      "Growth / Referral Activity",
    section:
      firstString(row, ["financial_statement_section", "section", "statement_section"]) ||
      "Growth & Referrals",
    amount: firstNumber(row, ["total_amount", "amount", "balance"]),
    rowCount: firstNumber(row, ["row_count", "count"]),
    source: firstString(row, ["source"]) || "growth_financial_summary",
    firstActivityDate:
      firstString(row, ["first_activity_date", "created_at", "date"]) || null,
    lastActivityDate:
      firstString(row, ["last_activity_date", "updated_at", "date"]) || null,
  };
}

function normalizeRewardRow(row: AnyRow, index: number): ReferralRewardRow {
  const status = firstString(row, ["reward_status", "status", "payout_status", "state"]) || "pending";

  return {
    id: firstString(row, ["id", "reward_id", "referral_reward_id"]) || `reward-${index}`,
    rewardType: normalizeLabel(
      firstString(row, ["reward_type", "program_type", "referral_type", "source_type", "category"]),
      "Referral Reward",
    ),
    status,
    amount: Math.abs(
      firstNumber(row, [
        "amount",
        "reward_amount",
        "total_amount",
        "pending_amount",
        "issued_amount",
        "liability_amount",
      ]),
    ),
    recipient:
      firstString(row, ["recipient_name", "name", "customer_name", "guru_name", "partner_name", "email"]) ||
      "Reward recipient",
    source: firstString(row, ["source", "program", "referral_source"]) || "referral_rewards",
    date:
      firstString(row, ["created_at", "issued_at", "paid_at", "updated_at", "earned_at"]) ||
      null,
  };
}

async function getWeeklyGrowthData(): Promise<WeeklyGrowthData> {
  const [summaryResult, roiResult, rewardResult, marketingResult] = await Promise.all([
    safeRows("admin_growth_financial_summary"),
    safeRows("admin_growth_campaign_roi"),
    safeRows("admin_referral_reward_liability"),
    safeRows("admin_growth_marketing_expenses"),
  ]);

  const sourceHealth = [
    summaryResult.health,
    roiResult.health,
    rewardResult.health,
    marketingResult.health,
  ];

  const summaryRows = summaryResult.rows
    .map(normalizeSummaryRow)
    .filter((row) => isWithinWeek(row.lastActivityDate || row.firstActivityDate));

  const campaignRows = roiResult.rows
    .map(normalizeCampaignRow)
    .filter((row) => isWithinWeek(row.lastEventAt || row.lastCostDate))
    .sort((a, b) => b.bookings - a.bookings || b.attributedRevenue - a.attributedRevenue);

  const rewardRows = rewardResult.rows
    .map(normalizeRewardRow)
    .filter((row) => isWithinWeek(row.date));

  const marketingRows = marketingResult.rows
    .map(normalizeSummaryRow)
    .filter((row) => isWithinWeek(row.lastActivityDate || row.firstActivityDate));

  const summaryMarketingExpense = summaryRows
    .filter((row) =>
      `${row.category} ${row.section} ${row.source}`.toLowerCase().includes("marketing"),
    )
    .reduce((sum, row) => sum + Math.abs(row.amount), 0);

  const marketingExpense =
    marketingRows.reduce((sum, row) => sum + Math.abs(row.amount), 0) ||
    summaryMarketingExpense;

  const pendingRewardLiability = rewardRows
    .filter((row) =>
      `${row.status}`.toLowerCase().includes("pending") ||
      `${row.status}`.toLowerCase().includes("earned") ||
      `${row.status}`.toLowerCase().includes("approved"),
    )
    .reduce((sum, row) => sum + row.amount, 0);

  const issuedRewardExpense = rewardRows
    .filter((row) => {
      const status = row.status.toLowerCase();
      return (
        status.includes("issued") ||
        status.includes("paid") ||
        status.includes("credited") ||
        status.includes("complete")
      );
    })
    .reduce((sum, row) => sum + row.amount, 0);

  const attributedRevenue = campaignRows.reduce(
    (sum, row) => sum + row.attributedRevenue,
    0,
  );
  const growthCost =
    campaignRows.reduce((sum, row) => sum + row.totalCost, 0) ||
    marketingExpense + issuedRewardExpense;
  const netGrowthReturn = attributedRevenue - growthCost;
  const clicks = campaignRows.reduce((sum, row) => sum + row.clicks, 0);
  const leads = campaignRows.reduce((sum, row) => sum + row.leads, 0);
  const signups = campaignRows.reduce((sum, row) => sum + row.signups, 0);
  const bookings = campaignRows.reduce((sum, row) => sum + row.bookings, 0);

  return {
    isLive: sourceHealth.some((source) => source.ok),
    sourceHealth,
    summaryRows,
    campaignRows,
    rewardRows,
    totals: {
      marketingExpense,
      pendingRewardLiability,
      issuedRewardExpense,
      attributedRevenue,
      growthCost,
      netGrowthReturn,
      overallRoiPercent:
        growthCost > 0 ? ((attributedRevenue - growthCost) / growthCost) * 100 : null,
      clicks,
      leads,
      signups,
      bookings,
      campaignsTracked: campaignRows.length,
      costPerSignup: signups > 0 ? growthCost / signups : null,
      costPerBooking: bookings > 0 ? growthCost / bookings : null,
    },
  };
}

function buildWeeklyMetrics(growth: WeeklyGrowthData): WeeklyMetric[] {
  return [
    {
      label: "Campaign Revenue",
      value: money(growth.totals.attributedRevenue),
      change: growth.totals.attributedRevenue > 0 ? "Live" : "Tracking",
      helper: "Revenue attributed to weekly campaign and referral activity.",
      tone: "green",
    },
    {
      label: "Growth Spend",
      value: money(growth.totals.growthCost),
      change: growth.totals.growthCost > 0 ? "Live" : "No spend yet",
      helper: "Marketing spend plus issued reward expense captured in growth views.",
      tone: "amber",
    },
    {
      label: "Growth ROI",
      value: percent(growth.totals.overallRoiPercent),
      change: growth.totals.overallRoiPercent === null ? "Need cost data" : "Live",
      helper: "Campaign revenue compared with weekly growth cost.",
      tone: growth.totals.overallRoiPercent !== null && growth.totals.overallRoiPercent < 0 ? "rose" : "green",
    },
    {
      label: "Reward Liability",
      value: money(growth.totals.pendingRewardLiability),
      change: growth.totals.pendingRewardLiability > 0 ? "Review" : "Clear",
      helper: "Pending PawPerks, Guru, Ambassador, and Partner referral reward exposure.",
      tone: growth.totals.pendingRewardLiability > 0 ? "amber" : "green",
    },
    {
      label: "Issued Rewards",
      value: money(growth.totals.issuedRewardExpense),
      change: growth.totals.issuedRewardExpense > 0 ? "Expensed" : "None",
      helper: "Weekly referral rewards already issued, credited, completed, or paid.",
      tone: "blue",
    },
    {
      label: "Campaign Bookings",
      value: growth.totals.bookings.toLocaleString(),
      change: growth.totals.bookings > 0 ? "Live" : "Tracking",
      helper: "Bookings attributed to campaign, referral, UTM, or QR activity.",
      tone: "purple",
    },
    {
      label: "Cost / Signup",
      value: growth.totals.costPerSignup === null ? "Need data" : money(growth.totals.costPerSignup, 2),
      change: growth.totals.signups > 0 ? `${growth.totals.signups} signups` : "No signups",
      helper: "Weekly growth cost divided by tracked signups.",
      tone: "slate",
    },
    {
      label: "Cost / Booking",
      value: growth.totals.costPerBooking === null ? "Need data" : money(growth.totals.costPerBooking, 2),
      change: growth.totals.bookings > 0 ? `${growth.totals.bookings} bookings` : "No bookings",
      helper: "Weekly growth cost divided by tracked campaign bookings.",
      tone: "slate",
    },
  ];
}

function buildPerformanceCards(growth: WeeklyGrowthData): WeeklyReportCard[] {
  return [
    {
      eyebrow: "Growth",
      title: "Weekly Growth ROI",
      description:
        "Review campaign return, attributed revenue, spend, cost per signup, cost per booking, and weekly growth signal.",
      value: percent(growth.totals.overallRoiPercent),
      href: "/admin/analytics",
      tone: "green",
    },
    {
      eyebrow: "Campaigns",
      title: "Campaign Funnel Review",
      description:
        "Review clicks, QR scans, leads, applications, signups, bookings, and underperforming weekly campaigns.",
      value: `${growth.totals.campaignsTracked}`,
      href: "/admin/referrals",
      tone: "blue",
    },
    {
      eyebrow: "PawPerks",
      title: "Referral Reward Liability",
      description:
        "Review pending PawPerks, Guru referral, Ambassador, and Partner reward obligations before payout approval.",
      value: money(growth.totals.pendingRewardLiability),
      href: "/admin/payouts",
      tone: "amber",
    },
    {
      eyebrow: "Expense",
      title: "Issued Reward Expense",
      description:
        "Review referral rewards already issued, paid, completed, or credited and confirm they are reflected in P&L and Cash Flow.",
      value: money(growth.totals.issuedRewardExpense),
      href: "/admin/financials/profit-loss",
      tone: "purple",
    },
    {
      eyebrow: "Marketing",
      title: "Weekly Marketing Spend",
      description:
        "Review paid ads, flyers, QR codes, yard signs, local campaigns, and tracked campaign costs for the week.",
      value: money(growth.totals.marketingExpense),
      href: "/admin/financials/general-ledger",
      tone: "slate",
    },
    {
      eyebrow: "Banking",
      title: "Reward & Cost Reconciliation",
      description:
        "Match campaign costs and issued referral rewards against Plaid/NFCU, Stripe, payout records, and ledger entries.",
      value: "Review",
      href: "/admin/financials/reconciliation",
      tone: "rose",
    },
  ];
}

function buildExceptions(growth: WeeklyGrowthData): WeeklyException[] {
  const exceptions: WeeklyException[] = [];

  if (growth.totals.pendingRewardLiability > 0) {
    exceptions.push({
      title: "Pending referral reward liability needs payout review",
      description:
        "PawPerks, Guru referral, Ambassador, or Partner reward obligations are pending and should be reviewed before weekly close.",
      severity: "Medium",
      status: "Review",
      owner: "Finance Admin",
      href: "/admin/payouts",
    });
  }

  if (growth.totals.growthCost > 0 && growth.totals.attributedRevenue === 0) {
    exceptions.push({
      title: "Growth spend has no attributed revenue yet",
      description:
        "Campaign or referral spend exists this week, but tracked bookings or revenue have not been attributed yet.",
      severity: "High",
      status: "Open",
      owner: "Growth Admin",
      href: "/admin/analytics",
    });
  }

  if (growth.campaignRows.some((row) => row.growthSignal.includes("review") || row.growthSignal.includes("needs"))) {
    exceptions.push({
      title: "One or more campaigns need conversion review",
      description:
        "At least one weekly campaign is marked as needing signup, booking, spend, or data review.",
      severity: "Medium",
      status: "Review",
      owner: "Growth Admin",
      href: "/admin/referrals",
    });
  }

  if (!exceptions.length) {
    exceptions.push({
      title: "No growth/referral exceptions found this week",
      description:
        "Campaign, referral, marketing, and reward views are queryable. Continue monitoring as more events and costs come in.",
      severity: "Low",
      status: "Watching",
      owner: "Finance Admin",
      href: "/admin/financials",
    });
  }

  return exceptions;
}

function CampaignRoiTable({ rows }: { rows: GrowthCampaignRow[] }) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white">
      <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
          Weekly campaign ROI rows
        </p>
      </div>

      <div className="overflow-x-auto">
        {rows.length ? (
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {[
                  "Campaign",
                  "Funnel",
                  "Revenue",
                  "Cost",
                  "ROI",
                  "Signal",
                  "Recommendation",
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
              {rows.slice(0, 10).map((row) => (
                <tr
                  key={`${row.campaignSlug || row.campaignName}-${row.channel}`}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-5 py-4 align-top">
                    <p className="font-black text-slate-950">{row.campaignName}</p>
                    <p className="text-xs font-bold text-slate-500">
                      {row.channel} · {row.campaignType}
                    </p>
                  </td>
                  <td className="px-5 py-4 align-top text-xs font-bold leading-5 text-slate-600">
                    <p>{row.clicks.toLocaleString()} clicks</p>
                    <p>{row.leads.toLocaleString()} leads</p>
                    <p>{row.signups.toLocaleString()} signups</p>
                    <p>{row.bookings.toLocaleString()} bookings</p>
                  </td>
                  <td className="px-5 py-4 align-top font-black text-slate-950">
                    {money(row.attributedRevenue)}
                  </td>
                  <td className="px-5 py-4 align-top font-black text-slate-950">
                    {money(row.totalCost)}
                  </td>
                  <td className="px-5 py-4 align-top font-black text-emerald-700">
                    {percent(row.roiPercent)}
                  </td>
                  <td className="px-5 py-4 align-top">
                    <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-amber-800">
                      {row.growthSignal.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="max-w-[320px] px-5 py-4 align-top text-xs font-semibold leading-5 text-slate-600">
                    {row.adminRecommendation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6">
            <p className="text-sm font-bold leading-6 text-slate-600">
              No weekly campaign ROI rows yet. Campaign events and costs from QR
              codes, paid ads, flyers, Ambassador links, referral links, and
              booking attribution will populate this table once tracked.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SourceHealthPanel({ sources }: { sources: SourceHealth[] }) {
  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <SectionHeader
        eyebrow="Source Health"
        title="Weekly growth/referral report sources"
        description="The weekly report safely checks the Growth & Referrals views and keeps the page available even if one source is still empty."
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {sources.map((source) => (
          <div
            key={source.table}
            className={`rounded-[1.25rem] border p-4 ${
              source.ok
                ? "border-emerald-100 bg-emerald-50"
                : "border-amber-100 bg-amber-50"
            }`}
          >
            <p
              className={`text-xs font-black uppercase tracking-[0.16em] ${
                source.ok ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {source.ok ? "Connected" : "Needs Review"}
            </p>
            <h3 className="mt-2 text-base font-black text-slate-950">
              {source.table}
            </h3>
            <p className="mt-1 text-sm font-bold text-slate-600">
              Rows: {source.rowCount.toLocaleString()}
            </p>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
              {source.message}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function RewardRowsPanel({ rows }: { rows: ReferralRewardRow[] }) {
  const shownRows = rows.slice(0, 8);

  return (
    <div className="rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Weekly reward queue
          </p>
          <h3 className="mt-2 text-xl font-black text-slate-950">
            PawPerks, Guru, Ambassador & Partner Rewards
          </h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
            Pending rewards stay as liabilities until issued, credited, or paid.
          </p>
        </div>
        <Link
          href="/admin/payouts"
          className="rounded-full bg-emerald-700 px-4 py-2 text-xs font-black text-white transition hover:bg-emerald-800"
        >
          Open payout queue
        </Link>
      </div>

      {shownRows.length ? (
        <div className="space-y-3">
          {shownRows.map((row) => (
            <div
              key={row.id}
              className="grid gap-3 rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div>
                <p className="text-sm font-black text-slate-950">{row.rewardType}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {row.recipient} · {row.source} · {formatDate(row.date)}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-base font-black text-slate-950">{money(row.amount)}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
                  {row.status.replace(/_/g, " ")}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-bold text-slate-600">
            No weekly referral reward rows found yet. Reward liabilities and issued
            rewards will appear here as referral activity is recorded.
          </p>
        </div>
      )}
    </div>
  );
}

export default async function AdminFinancialsWeeklyReportPage() {
  const growth = await getWeeklyGrowthData();
  const weeklyMetrics = buildWeeklyMetrics(growth);
  const performanceCards = buildPerformanceCards(growth);
  const exceptions = buildExceptions(growth);

  const weeklyCloseSteps = [
    "Review weekly booking growth, cancellations, completion rate, and failed booking payments.",
    "Confirm customer payment collection, Stripe processing fees, refunds, disputes, and transfer timing.",
    "Review guru payout eligibility, payout holds, exceptions, and payout batch readiness.",
    "Review partner commission accruals, approval status, and payout timing.",
    "Review weekly campaign ROI, cost per signup, cost per booking, and campaigns needing conversion improvement.",
    "Review PawPerks, Guru referral, Ambassador, and Partner reward liabilities before payout approval.",
    "Match campaign costs and issued referral rewards against General Ledger, Reconciliation, Plaid/NFCU, Stripe, and payout records.",
    "Export the weekly report package for management, CPA notes, and audit backup.",
  ];

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
                  Weekly Financial Report
                </h1>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${
                    growth.isLive
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {growth.isLive ? "Live Growth Views" : "Preview / Offline"}
                </span>
              </div>

              <p className="mt-3 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
                Weekly owner snapshot for SitGuru’s financial activity. Review
                booking performance, payments, payouts, partner commissions,
                marketing ROI, PawPerks/referral reward liability, campaign
                efficiency, cash movement, and weekly exceptions before they
                become month-end issues.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[560px]">
              <div className="rounded-[1.25rem] border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                  Report Period
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  Last 7 Days
                </p>
              </div>

              <div className="rounded-[1.25rem] border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                  Campaigns
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {growth.totals.campaignsTracked.toLocaleString()}
                </p>
              </div>

              <div className="rounded-[1.25rem] border border-amber-100 bg-amber-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                  Exceptions
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {exceptions.length}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          {weeklyMetrics.map((metric) => (
            <StatCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              helper={`${metric.change} · ${metric.helper}`}
              tone={metric.tone}
            />
          ))}
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="Weekly Growth & Referrals"
            title="Campaign ROI, Reward Liability & Referral Performance"
            description="This section connects the weekly report to Growth & Referrals, PawPerks rewards, Ambassador and Partner referral rewards, campaign spend, issued reward expense, and campaign attribution."
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-[1.25rem] border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                Clicks / QR Scans
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {growth.totals.clicks.toLocaleString()}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                Leads / Applications
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {growth.totals.leads.toLocaleString()}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-purple-100 bg-purple-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-purple-700">
                Signups
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {growth.totals.signups.toLocaleString()}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-emerald-100 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                Bookings
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {growth.totals.bookings.toLocaleString()}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-amber-100 bg-amber-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                Pending Rewards
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {money(growth.totals.pendingRewardLiability)}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-sky-100 bg-sky-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-700">
                Net Return
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {money(growth.totals.netGrowthReturn)}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <CampaignRoiTable rows={growth.campaignRows} />
            <RewardRowsPanel rows={growth.rewardRows} />
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="Weekly Activity"
            title="Operating Finance Snapshot"
            description="Review weekly growth, payouts, commissions, reward liability, campaign spend, Stripe activity, and banking items."
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {performanceCards.map((card) => (
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

        <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <SectionHeader
              eyebrow="Exceptions"
              title="Weekly Financial Exceptions"
              description="Items listed here should be reviewed before they carry into monthly, CPA handoff, tax reporting, or payout review."
            />

            <div className="space-y-3">
              {exceptions.map((item) => (
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
                    <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                      Owner: {item.owner}
                    </p>
                  </div>

                  <ArrowCircle />
                </Link>
              ))}
            </div>
          </div>

          <aside className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
              Weekly Close
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
              Weekly review checklist
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              This checklist keeps weekly campaign, reward, payout, and banking
              issues from becoming monthly CPA close problems.
            </p>

            <div className="mt-5 space-y-3">
              {weeklyCloseSteps.map((step, index) => (
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

        <SourceHealthPanel sources={growth.sourceHealth} />

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="Weekly Export"
            title="Download Weekly Report Package"
            description="Export this week’s report as a PDF, Excel workbook, CSV package, or ZIP archive for management review, CPA notes, growth/referral support, and audit backup."
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {exportCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group flex min-h-[210px] flex-col justify-between rounded-[1.5rem] border border-emerald-100 bg-[#fbfefd] p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:bg-white hover:shadow-lg"
              >
                <div>
                  <h3 className="text-xl font-black text-slate-950">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    {card.description}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm font-black text-emerald-800">
                    Export
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
