import Link from "next/link";

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
      "Choose statements, operations, tax schedules, ledger detail, reconciliation backup, and audit support.",
    status: "Review",
  },
  {
    step: "03",
    title: "Preview totals",
    description:
      "Review revenue, expenses, payouts, commissions, fees, refunds, net cash flow, and open exceptions.",
    status: "Pending",
  },
  {
    step: "04",
    title: "Review exceptions",
    description:
      "Resolve missing categories, unmatched deposits, refund questions, payout holds, and commission approvals.",
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
      "Multi-tab workbook with selected statements, schedules, transactions, reconciliations, tax categories, and notes.",
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
      "Full archive containing PDF, Excel workbook, CSV files, reconciliations, audit schedules, and backup reports.",
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

export default function AdminFinancialsCustomReportPage() {
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
              </div>

              <p className="mt-3 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
                Build custom financial packages for year-to-date reporting,
                launch-to-date reporting, CPA requests, tax planning, audit
                support, investor updates, lender requests, or owner review.
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

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="Report Period"
            title="Choose Reporting Range"
            description="Select the reporting range that matches the CPA, tax, audit, management, or owner review need."
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
              description="Choose the statements, schedules, reconciliations, and support records to include in the custom package."
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
                date range, included reports, exceptions, and notes.
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
            description="Export selected reports as a PDF, Excel workbook, CSV package, or ZIP archive for CPA review, tax planning, audit support, investor reporting, or owner records."
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