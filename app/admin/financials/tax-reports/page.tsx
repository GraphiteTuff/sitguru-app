import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type TaxSummaryCard = {
  label: string;
  value: string;
  helper: string;
  tone: "green" | "blue" | "amber" | "rose" | "slate" | "purple";
};

type TaxReportCard = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  tone: "green" | "blue" | "amber" | "purple" | "rose" | "slate";
  included: string[];
};

type TaxChecklistItem = {
  step: string;
  title: string;
  description: string;
  status: "Ready" | "Review" | "Pending";
};

type TaxAuthorityCard = {
  title: string;
  level: "Federal" | "State" | "County" | "City / Local" | "Marketplace";
  description: string;
  cadence: string;
  action: string;
  href: string;
};

type AnyRow = Record<string, unknown>;

type GrowthFinancialSummaryRow = {
  financial_category?: string | null;
  financial_statement_section?: string | null;
  row_count?: number | null;
  total_amount?: number | null;
  first_activity_date?: string | null;
  last_activity_date?: string | null;
  source?: string | null;
};

type GrowthCampaignRoiRow = {
  campaign_name?: string | null;
  channel?: string | null;
  campaign_type?: string | null;
  clicks?: number | null;
  leads?: number | null;
  signups?: number | null;
  bookings?: number | null;
  attributed_revenue?: number | null;
  total_cost?: number | null;
  net_growth_return?: number | null;
  roi_percent?: number | null;
  cost_per_signup?: number | null;
  cost_per_booking?: number | null;
  growth_signal?: string | null;
  admin_recommendation?: string | null;
};

type ReferralRewardLiabilityRow = {
  reward_category?: string | null;
  reward_status?: string | null;
  financial_statement_section?: string | null;
  amount?: number | null;
  reward_amount?: number | null;
  total_amount?: number | null;
  recipient_name?: string | null;
  recipient_email?: string | null;
  source?: string | null;
  created_at?: string | null;
  issued_at?: string | null;
  paid_at?: string | null;
};

type TaxCenterData = {
  summaryRows: GrowthFinancialSummaryRow[];
  roiRows: GrowthCampaignRoiRow[];
  rewardRows: ReferralRewardLiabilityRow[];
};

const taxReports: TaxReportCard[] = [
  {
    eyebrow: "Income Tax",
    title: "Annual Tax Summary",
    description:
      "Year-end summary of SitGuru revenue, expenses, net income, deductions, credits, payments, and CPA review notes.",
    href: "/admin/financials/tax-reports/annual-summary",
    tone: "green",
    included: [
      "Gross bookings",
      "Platform revenue",
      "Refunds and chargebacks",
      "Stripe fees",
      "Net income",
      "Owner contributions",
      "Owner distributions",
    ],
  },
  {
    eyebrow: "Deductions",
    title: "Deductible Expense Detail",
    description:
      "Categorized expense support for software, insurance, marketing, professional fees, background checks, banking fees, Growth campaigns, and operations.",
    href: "/admin/financials/tax-reports/deductions",
    tone: "blue",
    included: [
      "Software subscriptions",
      "Insurance",
      "Marketing and advertising",
      "Growth campaign costs",
      "Background checks",
      "Banking and card fees",
      "Office and admin expenses",
    ],
  },
  {
    eyebrow: "1099 Support",
    title: "Contractor, Guru & Partner Payments",
    description:
      "Payment review package for Guru payouts, contractor payments, vendor payments, referral rewards, Ambassador rewards, and partner commission review.",
    href: "/admin/financials/tax-reports/1099",
    tone: "amber",
    included: [
      "Guru payout totals",
      "Partner commissions",
      "Ambassador rewards",
      "Contractor payments",
      "Vendor payment totals",
      "1099 threshold review",
      "Exception list",
    ],
  },
  {
    eyebrow: "Sales / Local Tax",
    title: "Marketplace Tax Review",
    description:
      "Review marketplace activity, booking fees, local tax exposure, customer charges, and any tax collection/remittance support needed.",
    href: "/admin/financials/tax-reports/marketplace-tax",
    tone: "purple",
    included: [
      "Customer charges",
      "Booking fee review",
      "Location-based activity",
      "Sales tax support",
      "Local tax support",
      "Marketplace fee review",
      "CPA notes",
    ],
  },
  {
    eyebrow: "Reconciliation",
    title: "Bank, Stripe & Card Tax Backup",
    description:
      "Backup package for bank statements, Stripe payouts, processing fees, refunds, disputes, chargebacks, and card transactions.",
    href: "/admin/financials/tax-reports/reconciliation",
    tone: "slate",
    included: [
      "Stripe payout summary",
      "Stripe fee detail",
      "Refunds and disputes",
      "Bank reconciliation",
      "Credit card reconciliation",
      "Deposit matching",
      "Unmatched transactions",
    ],
  },
  {
    eyebrow: "Audit Support",
    title: "Tax Audit Backup Index",
    description:
      "Organized index of tax support files, transaction exports, reconciliation schedules, vendor details, receipts, campaign backup, and CPA notes.",
    href: "/admin/financials/tax-reports/audit-backup",
    tone: "rose",
    included: [
      "General ledger export",
      "Transaction backup",
      "Receipt index",
      "Vendor files",
      "Payout support",
      "Campaign and referral support",
      "CPA questions log",
    ],
  },
];

const taxAuthorityCards: TaxAuthorityCard[] = [
  {
    title: "Federal Estimated Tax",
    level: "Federal",
    description:
      "Track federal estimated tax planning, income tax reserve support, quarterly payment reminders, and annual CPA handoff readiness.",
    cadence: "Quarterly and annual",
    action: "Review IRS payment options",
    href: "https://www.irs.gov/payments",
  },
  {
    title: "Federal Business Tax Center",
    level: "Federal",
    description:
      "Use this for federal business tax categories, filing considerations, employment tax, estimated taxes, and entity-specific CPA review.",
    cadence: "Quarterly and annual",
    action: "Open IRS business tax center",
    href: "https://www.irs.gov/businesses",
  },
  {
    title: "Pennsylvania Business Tax",
    level: "State",
    description:
      "Track Pennsylvania business tax payment support, state tax registration, state-level income or business obligations, and CPA review notes.",
    cadence: "Quarterly, annual, and as required",
    action: "Open PA business tax payments",
    href: "https://www.pa.gov/services/revenue/make-a-business-tax-payment",
  },
  {
    title: "New Jersey Tax Payments",
    level: "State",
    description:
      "Track New Jersey tax payment support for cross-market activity, state obligations, payment confirmations, and CPA review.",
    cadence: "Quarterly, annual, and as required",
    action: "Open NJ tax payment portal",
    href: "https://www.nj.gov/treasury/taxation/payments-notices.shtml",
  },
  {
    title: "County Review",
    level: "County",
    description:
      "Capture county-specific business, payroll, licensing, or local operating tax questions for CPA confirmation by service market.",
    cadence: "As required by location",
    action: "Add county review to CPA package",
    href: "/admin/financials/cpa-handoff?section=local-tax",
  },
  {
    title: "City / Local Review",
    level: "City / Local",
    description:
      "Track city, township, borough, local services, payroll locality, and operating license questions that may apply by location.",
    cadence: "As required by local rule",
    action: "Open local review checklist",
    href: "/admin/financials/tax-reports?section=local",
  },
  {
    title: "Marketplace Tax Exposure",
    level: "Marketplace",
    description:
      "Review whether SitGuru booking charges, marketplace fees, local services, or customer charges create sales, use, or local tax obligations.",
    cadence: "CPA review before launch and annually",
    action: "Open marketplace tax review",
    href: "/admin/financials/tax-reports/marketplace-tax",
  },
];

const quarterlyChecklist: TaxChecklistItem[] = [
  {
    step: "Q1",
    title: "January – March estimated tax review",
    description:
      "Review revenue, deductible expenses, cash reserves, prior-year CPA advice, and Q1 payment support.",
    status: "Pending",
  },
  {
    step: "Q2",
    title: "April – May / June estimated tax review",
    description:
      "Review launch ramp, marketing spend, startup costs, payout obligations, and quarterly reserve needs.",
    status: "Review",
  },
  {
    step: "Q3",
    title: "June – August / September estimated tax review",
    description:
      "Review soft-launch revenue, Guru payouts, referral rewards, marketing ROI, and tax reserve changes.",
    status: "Pending",
  },
  {
    step: "Q4",
    title: "September – December year-end tax planning",
    description:
      "Review full-year taxable income, deductions, contractor support, local tax exposure, and CPA package readiness.",
    status: "Pending",
  },
];

const annualChecklist: TaxChecklistItem[] = [
  {
    step: "01",
    title: "Confirm launch-year period",
    description:
      "Confirm the first SitGuru tax package covers Jun 1–Dec 31, 2026, unless your CPA requests a different treatment.",
    status: "Review",
  },
  {
    step: "02",
    title: "Review revenue categories",
    description:
      "Validate gross bookings, platform revenue, service fees, refunds, chargebacks, and Stripe activity.",
    status: "Pending",
  },
  {
    step: "03",
    title: "Review payout categories",
    description:
      "Separate Guru payouts, partner commissions, Ambassador rewards, referral rewards, contractor payments, payroll, vendor expenses, and owner distributions.",
    status: "Pending",
  },
  {
    step: "04",
    title: "Review deductible expenses",
    description:
      "Categorize software, marketing, advertising, growth campaigns, insurance, background checks, banking fees, legal, professional, and admin expenses.",
    status: "Pending",
  },
  {
    step: "05",
    title: "Review referral rewards and PawPerks",
    description:
      "Confirm issued rewards as expense support and pending rewards as liability support before CPA review.",
    status: "Pending",
  },
  {
    step: "06",
    title: "Complete reconciliations",
    description:
      "Match Stripe payouts, bank deposits, credit card charges, refunds, disputes, vendor transactions, campaign costs, and reward payouts.",
    status: "Pending",
  },
  {
    step: "07",
    title: "Generate annual tax package",
    description:
      "Export annual statements, tax schedules, CSV files, Excel workbook, PDF packet, and full ZIP archive.",
    status: "Pending",
  },
  {
    step: "08",
    title: "Send to CPA",
    description:
      "Send the tax package, notes, open questions, and supporting files to your CPA or bookkeeper.",
    status: "Pending",
  },
];

const exportCards = [
  {
    title: "Annual Tax PDF Packet",
    description:
      "Clean PDF package for CPA review, owner records, lender requests, investor review, or audit backup.",
    href: "/admin/financials/exports?type=tax&format=pdf&period=annual",
  },
  {
    title: "Annual Tax Excel Workbook",
    description:
      "Multi-tab workbook with annual summary, tax categories, deductions, 1099 support, reconciliations, growth ROI, and notes.",
    href: "/admin/financials/exports?type=tax&format=xlsx&period=annual",
  },
  {
    title: "Annual Tax CSV Package",
    description:
      "CSV files for QuickBooks-style imports, CPA analysis, bookkeeping review, growth campaign backup, and general ledger support.",
    href: "/admin/financials/exports?type=tax&format=csv&period=annual",
  },
  {
    title: "Annual Tax ZIP Archive",
    description:
      "Full archive including PDF, Excel, CSVs, backup schedules, referral reward support, reconciliation files, and audit support.",
    href: "/admin/financials/exports?type=tax&format=zip&period=annual",
  },
];

function safeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "Needs cost data";
  }

  return `${Math.round(Number(value))}%`;
}

function toneClasses(tone: TaxSummaryCard["tone"] | TaxReportCard["tone"]) {
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

function statusClasses(status: TaxChecklistItem["status"]) {
  const statuses = {
    Ready: "border-emerald-200 bg-emerald-50 text-emerald-800",
    Review: "border-blue-200 bg-blue-50 text-blue-800",
    Pending: "border-slate-200 bg-slate-50 text-slate-600",
  };

  return statuses[status];
}

function authorityClasses(level: TaxAuthorityCard["level"]) {
  const levels = {
    Federal: "border-blue-200 bg-blue-50 text-blue-800",
    State: "border-emerald-200 bg-emerald-50 text-emerald-800",
    County: "border-amber-200 bg-amber-50 text-amber-800",
    "City / Local": "border-purple-200 bg-purple-50 text-purple-800",
    Marketplace: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return levels[level];
}

async function safeRows<T>(table: string, query = "*", limit = 100) {
  try {
    const { data, error } = await supabaseAdmin.from(table).select(query).limit(limit);

    if (error || !data) return [] as T[];

    return data as unknown as T[];
  } catch {
    return [] as T[];
  }
}

async function getTaxCenterData(): Promise<TaxCenterData> {
  const [summaryRows, roiRows, rewardRows] = await Promise.all([
    safeRows<GrowthFinancialSummaryRow>(
      "admin_growth_financial_summary",
      "financial_category,financial_statement_section,row_count,total_amount,first_activity_date,last_activity_date,source",
      100,
    ),
    safeRows<GrowthCampaignRoiRow>(
      "admin_growth_campaign_roi",
      "campaign_name,channel,campaign_type,clicks,leads,signups,bookings,attributed_revenue,total_cost,net_growth_return,roi_percent,cost_per_signup,cost_per_booking,growth_signal,admin_recommendation",
      100,
    ),
    safeRows<ReferralRewardLiabilityRow>(
      "admin_referral_reward_liability",
      "*",
      250,
    ),
  ]);

  return {
    summaryRows,
    roiRows,
    rewardRows,
  };
}

function sumRows<T extends AnyRow>(
  rows: T[],
  predicate: (row: T) => boolean,
  valueKeys: string[],
) {
  return rows
    .filter(predicate)
    .reduce((sum, row) => {
      const value = valueKeys
        .map((key) => safeNumber(row[key]))
        .find((candidate) => candidate !== 0);

      return sum + safeNumber(value);
    }, 0);
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

function ChecklistBlock({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: TaxChecklistItem[];
}) {
  return (
    <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <SectionHeader eyebrow="Tax Close" title={title} description={description} />

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={`${item.step}-${item.title}`}
            className="grid gap-4 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-sm font-black text-white">
              {item.step}
            </span>

            <div>
              <h3 className="text-base font-black text-slate-950">{item.title}</h3>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                {item.description}
              </p>
            </div>

            <span
              className={`w-fit rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${statusClasses(
                item.status,
              )}`}
            >
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function AdminFinancialsTaxReportsPage() {
  const taxData = await getTaxCenterData();

  const marketingExpense = sumRows(
    taxData.summaryRows as unknown as AnyRow[],
    (row) =>
      `${row.financial_category || ""} ${row.financial_statement_section || ""}`
        .toLowerCase()
        .includes("marketing"),
    ["total_amount"],
  );

  const pendingRewardLiability = taxData.rewardRows.reduce((sum, row) => {
    const status = `${row.reward_status || ""} ${row.financial_statement_section || ""}`.toLowerCase();
    const isPending =
      status.includes("pending") ||
      status.includes("liability") ||
      status.includes("payable");

    if (!isPending) return sum;

    return (
      sum +
      safeNumber(row.amount || row.reward_amount || row.total_amount)
    );
  }, 0);

  const issuedReferralRewards = taxData.rewardRows.reduce((sum, row) => {
    const status = `${row.reward_status || ""} ${row.financial_statement_section || ""}`.toLowerCase();
    const isIssued =
      status.includes("issued") ||
      status.includes("paid") ||
      status.includes("credited") ||
      status.includes("expense");

    if (!isIssued) return sum;

    return (
      sum +
      safeNumber(row.amount || row.reward_amount || row.total_amount)
    );
  }, 0);

  const totalCampaignCost = taxData.roiRows.reduce(
    (sum, row) => sum + safeNumber(row.total_cost),
    0,
  );
  const totalAttributedRevenue = taxData.roiRows.reduce(
    (sum, row) => sum + safeNumber(row.attributed_revenue),
    0,
  );
  const totalBookings = taxData.roiRows.reduce(
    (sum, row) => sum + safeNumber(row.bookings),
    0,
  );
  const overallRoi =
    totalCampaignCost > 0
      ? ((totalAttributedRevenue - totalCampaignCost) / totalCampaignCost) * 100
      : null;

  const taxSummaryCards: TaxSummaryCard[] = [
    {
      label: "Tax Year Package",
      value: "2026",
      helper: "Launch-year package can support Jun 1–Dec 31, 2026, subject to CPA confirmation.",
      tone: "green",
    },
    {
      label: "Marketing Deductions",
      value: formatCurrency(marketingExpense + totalCampaignCost),
      helper: "Campaign costs, ads, print, QR, and growth marketing expense support.",
      tone: "blue",
    },
    {
      label: "Reward Liability",
      value: formatCurrency(pendingRewardLiability),
      helper: "Pending PawPerks, Guru, Ambassador, and Partner reward exposure for CPA review.",
      tone: "amber",
    },
    {
      label: "Issued Rewards",
      value: formatCurrency(issuedReferralRewards),
      helper: "Issued or paid referral rewards that may support expense treatment.",
      tone: "purple",
    },
    {
      label: "Campaign ROI",
      value: formatPercent(overallRoi),
      helper: `${taxData.roiRows.length} campaign rows, ${totalBookings.toLocaleString()} tracked bookings.`,
      tone: overallRoi !== null && overallRoi >= 0 ? "green" : "rose",
    },
    {
      label: "CPA Export Status",
      value: "Ready to Build",
      helper: "Use Export Center for PDF, Excel, CSV, and ZIP tax packages.",
      tone: "slate",
    },
  ];

  const topCampaigns = [...taxData.roiRows].sort(
    (a, b) =>
      safeNumber(b.bookings) - safeNumber(a.bookings) ||
      safeNumber(b.attributed_revenue) - safeNumber(a.attributed_revenue),
  );

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
                  SitGuru Tax Center
                </h1>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-amber-700">
                  Quarterly · Annual · Federal · State · Local
                </span>
              </div>

              <p className="mt-3 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
                Prepare tax-ready records for SitGuru, including revenue,
                refunds, Stripe fees, Guru payouts, partner commissions,
                contractor payments, vendor expenses, deductions, marketing
                costs, Growth campaign ROI, PawPerks rewards, referral
                liabilities, reconciliations, and CPA backup. This page organizes
                the tax workflow and supporting records; final filing and tax
                treatment should be confirmed by your CPA or tax professional.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px]">
              <Link
                href="/admin/financials/cpa-handoff"
                className="rounded-[1.25rem] border border-emerald-100 bg-emerald-50 p-4 transition hover:bg-emerald-100"
              >
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                  CPA Handoff
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  Open Tracker →
                </p>
              </Link>

              <Link
                href="/admin/financials/exports?type=tax"
                className="rounded-[1.25rem] border border-blue-100 bg-blue-50 p-4 transition hover:bg-blue-100"
              >
                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                  Export Center
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  Prepare Files →
                </p>
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {taxSummaryCards.map((card) => (
            <div
              key={card.label}
              className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm"
            >
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${toneClasses(
                  card.tone,
                )}`}
              >
                {card.label}
              </span>

              <p className="mt-4 text-3xl font-black text-slate-950">
                {card.value}
              </p>

              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                {card.helper}
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="Tax Payment Workflow"
            title="How SitGuru should organize quarterly, annual, and local tax readiness"
            description="Use this as the admin tax command center. It does not replace CPA advice or file returns automatically, but it keeps each tax area organized, linked, and supported with the financial records already wired into SitGuru."
          />

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            {taxAuthorityCards.map((card) => (
              <Link
                key={`${card.level}-${card.title}`}
                href={card.href}
                target={card.href.startsWith("http") ? "_blank" : undefined}
                rel={card.href.startsWith("http") ? "noreferrer" : undefined}
                className="group flex min-h-[250px] flex-col justify-between rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
              >
                <div>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${authorityClasses(
                      card.level,
                    )}`}
                  >
                    {card.level}
                  </span>

                  <h3 className="mt-4 text-xl font-black text-slate-950">
                    {card.title}
                  </h3>

                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    {card.description}
                  </p>

                  <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    {card.cadence}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm font-black text-emerald-800">
                    {card.action}
                  </span>
                  <ArrowCircle />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="Tax Package"
            title="Annual Tax Report Builder"
            description="Use these reports to organize the tax package before CPA review. Each card represents a major schedule or support package that should be reviewed before year-end export."
          />

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {taxReports.map((report) => (
              <Link
                key={report.title}
                href={report.href}
                className="group flex min-h-[360px] flex-col justify-between rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
              >
                <div>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${toneClasses(
                      report.tone,
                    )}`}
                  >
                    {report.eyebrow}
                  </span>

                  <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-950">
                    {report.title}
                  </h3>

                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                    {report.description}
                  </p>

                  <div className="mt-5 grid gap-2">
                    {report.included.map((item) => (
                      <p
                        key={item}
                        className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600"
                      >
                        ✓ {item}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm font-black text-emerald-800">
                    Open tax report
                  </span>
                  <ArrowCircle />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <ChecklistBlock
            title="Quarterly Estimated Tax Checklist"
            description="Use this workflow to stay organized for quarterly estimated tax review, payment planning, CPA questions, and reserve planning."
            items={quarterlyChecklist}
          />

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-amber-100 bg-amber-50 p-5 shadow-sm sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-700">
                CPA Review Note
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Confirm final tax treatment before paying or filing
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                This Tax Center helps organize tax-ready reports and supporting
                records. Your CPA should confirm final treatment for deductions,
                1099 reporting, marketplace tax exposure, payroll, sales tax,
                estimated taxes, local taxes, and entity-specific filing
                requirements.
              </p>
            </div>

            <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
                Growth / PawPerks Tax Support
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Reward and campaign records
              </h2>

              <div className="mt-5 grid gap-2 text-sm font-bold text-slate-600">
                {[
                  `Marketing expense support: ${formatCurrency(marketingExpense + totalCampaignCost)}`,
                  `Pending reward liability: ${formatCurrency(pendingRewardLiability)}`,
                  `Issued referral rewards: ${formatCurrency(issuedReferralRewards)}`,
                  `Attributed campaign revenue: ${formatCurrency(totalAttributedRevenue)}`,
                  `Tracked campaign bookings: ${totalBookings.toLocaleString()}`,
                  `Campaign ROI: ${formatPercent(overallRoi)}`,
                ].map((item) => (
                  <p
                    key={item}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    ✓ {item}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
                Common tax categories
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Categories to review
              </h2>

              <div className="mt-5 grid gap-2 text-sm font-bold text-slate-600">
                {[
                  "Platform revenue",
                  "Stripe processing fees",
                  "Refunds and chargebacks",
                  "Guru payouts",
                  "Partner commissions",
                  "Ambassador rewards",
                  "PawPerks credits",
                  "Contractor payments",
                  "Software subscriptions",
                  "Insurance",
                  "Marketing and advertising",
                  "Background checks",
                  "Banking and card fees",
                  "Legal and professional fees",
                  "Payroll and benefits",
                  "Owner contributions/distributions",
                ].map((item) => (
                  <p
                    key={item}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    ✓ {item}
                  </p>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <ChecklistBlock
          title="Annual Tax Preparation Checklist"
          description="Use this checklist to prepare SitGuru’s annual tax package before sending files to your CPA or tax preparer."
          items={annualChecklist}
        />

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="Growth, Referrals & Tax Backup"
            title="Campaign ROI and reward liability support"
            description="These rows come from the same Growth & Referrals financial views already wired into P&L, Cash Flow, Balance Sheet, General Ledger, Reconciliation, CPA Handoff, Payouts, and Analytics."
          />

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white">
              <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Campaign ROI support
                </p>
              </div>

              <div className="max-h-[420px] overflow-auto">
                {topCampaigns.length ? (
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {["Campaign", "Bookings", "Revenue", "Cost", "ROI"].map(
                          (heading) => (
                            <th
                              key={heading}
                              className="px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400"
                            >
                              {heading}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {topCampaigns.slice(0, 10).map((row, index) => (
                        <tr
                          key={`${row.campaign_name}-${row.channel}-${index}`}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="px-5 py-4">
                            <p className="font-black text-slate-950">
                              {row.campaign_name || "Unassigned Campaign"}
                            </p>
                            <p className="text-xs font-bold text-slate-500">
                              {row.channel || "unknown"} ·{" "}
                              {row.growth_signal || "needs_more_data"}
                            </p>
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-700">
                            {safeNumber(row.bookings).toLocaleString()}
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-700">
                            {formatCurrency(safeNumber(row.attributed_revenue))}
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-700">
                            {formatCurrency(safeNumber(row.total_cost))}
                          </td>
                          <td className="px-5 py-4 font-black text-emerald-700">
                            {formatPercent(row.roi_percent)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-5">
                    <p className="text-sm font-bold leading-6 text-slate-600">
                      No campaign ROI rows yet. Add campaign events and costs for
                      QR codes, flyers, paid ads, partner links, Ambassador links,
                      and referral campaigns to populate this tax support table.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-100 bg-[#fbfefd] p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Financial category support
              </p>

              <div className="mt-4 grid gap-3">
                {taxData.summaryRows.length ? (
                  taxData.summaryRows.slice(0, 10).map((row, index) => (
                    <div
                      key={`${row.financial_category}-${row.source}-${index}`}
                      className="rounded-[1.25rem] border border-slate-100 bg-white p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-black text-slate-950">
                            {row.financial_category || "Growth / Referral Category"}
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-500">
                            {row.financial_statement_section || "Tax support"} ·{" "}
                            {row.source || "growth"}
                          </p>
                        </div>

                        <p className="text-xl font-black text-emerald-800">
                          {formatCurrency(safeNumber(row.total_amount))}
                        </p>
                      </div>

                      <p className="mt-2 text-xs font-bold text-slate-500">
                        {safeNumber(row.row_count).toLocaleString()} support row(s)
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl border border-slate-100 bg-white p-4 text-sm font-bold text-slate-600">
                    No financial category rollup rows yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="Export Tax Files"
            title="Download Annual Tax Package"
            description="Export the annual package in the format your CPA, bookkeeper, or accounting system needs. These exports should include statements, deductions, 1099 support, tax payment support, campaign records, reward liabilities, reconciliations, and audit backup."
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
