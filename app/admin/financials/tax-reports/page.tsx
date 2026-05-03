import Link from "next/link";

type TaxSummaryCard = {
  label: string;
  value: string;
  helper: string;
  tone: "green" | "blue" | "amber" | "rose" | "slate";
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

const taxSummaryCards: TaxSummaryCard[] = [
  {
    label: "Tax Year Package",
    value: "2026",
    helper: "Launch-year package covers Jun 1–Dec 31, 2026.",
    tone: "green",
  },
  {
    label: "Tax Categories",
    value: "18",
    helper: "Revenue, fees, payouts, payroll, contractors, vendors, software, insurance, and admin costs.",
    tone: "blue",
  },
  {
    label: "1099 Review",
    value: "Pending",
    helper: "Guru, contractor, vendor, and partner payment review before filing support.",
    tone: "amber",
  },
  {
    label: "CPA Export Status",
    value: "Not Sent",
    helper: "Prepare PDF, Excel, CSV, and ZIP packages after review.",
    tone: "rose",
  },
];

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
      "Categorized expense support for software, insurance, marketing, professional fees, background checks, banking fees, and operations.",
    href: "/admin/financials/tax-reports/deductions",
    tone: "blue",
    included: [
      "Software subscriptions",
      "Insurance",
      "Marketing",
      "Legal and professional fees",
      "Background checks",
      "Banking and card fees",
      "Office and admin expenses",
    ],
  },
  {
    eyebrow: "1099 Support",
    title: "Contractor, Guru & Partner Payments",
    description:
      "Payment review package for guru payouts, contractor payments, vendor payments, and partner commission review.",
    href: "/admin/financials/tax-reports/1099",
    tone: "amber",
    included: [
      "Guru payout totals",
      "Partner commissions",
      "Contractor payments",
      "Vendor payment totals",
      "Missing tax details",
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
      "Organized index of tax support files, transaction exports, reconciliation schedules, vendor details, receipts, and CPA notes.",
    href: "/admin/financials/tax-reports/audit-backup",
    tone: "rose",
    included: [
      "General ledger export",
      "Transaction backup",
      "Receipt index",
      "Vendor files",
      "Payout support",
      "Commission support",
      "CPA questions log",
    ],
  },
];

const taxChecklist: TaxChecklistItem[] = [
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
      "Separate guru payouts, partner commissions, contractor payments, payroll, vendor expenses, and owner distributions.",
    status: "Pending",
  },
  {
    step: "04",
    title: "Review deductible expenses",
    description:
      "Categorize software, marketing, insurance, background checks, banking fees, legal, professional, and admin expenses.",
    status: "Pending",
  },
  {
    step: "05",
    title: "Review 1099 support",
    description:
      "Identify guru, contractor, partner, and vendor payments that may need tax forms or CPA review.",
    status: "Pending",
  },
  {
    step: "06",
    title: "Complete reconciliations",
    description:
      "Match Stripe payouts, bank deposits, credit card charges, refunds, disputes, and vendor transactions.",
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
      "Multi-tab workbook with annual summary, tax categories, deductions, 1099 support, reconciliations, and notes.",
    href: "/admin/financials/exports?type=tax&format=xlsx&period=annual",
  },
  {
    title: "Annual Tax CSV Package",
    description:
      "CSV files for QuickBooks-style imports, CPA analysis, bookkeeping review, and general ledger support.",
    href: "/admin/financials/exports?type=tax&format=csv&period=annual",
  },
  {
    title: "Annual Tax ZIP Archive",
    description:
      "Full archive including PDF, Excel, CSVs, backup schedules, reconciliation files, and audit support.",
    href: "/admin/financials/exports?type=tax&format=zip&period=annual",
  },
];

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

export default function AdminFinancialsTaxReportsPage() {
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
                  Annual Tax Reports
                </h1>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-amber-700">
                  Tax Prep
                </span>
              </div>

              <p className="mt-3 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
                Prepare annual tax-ready records for SitGuru, including revenue,
                refunds, Stripe fees, guru payouts, partner commissions,
                contractor payments, vendor expenses, deductions, reconciliations,
                and CPA backup.
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

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

        <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <SectionHeader
              eyebrow="Tax Close"
              title="Annual Tax Preparation Checklist"
              description="Use this checklist to prepare SitGuru’s annual tax package before sending files to your CPA or tax preparer."
            />

            <div className="space-y-3">
              {taxChecklist.map((item) => (
                <div
                  key={item.step}
                  className="grid gap-4 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-sm font-black text-white">
                    {item.step}
                  </span>

                  <div>
                    <h3 className="text-base font-black text-slate-950">
                      {item.title}
                    </h3>
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

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-amber-100 bg-amber-50 p-5 shadow-sm sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-700">
                CPA Review Note
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Confirm final tax treatment
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                This page helps organize tax-ready reports and supporting
                records. Your CPA should confirm final treatment for deductions,
                1099 reporting, marketplace tax exposure, payroll, sales tax,
                estimated taxes, and entity-specific filing requirements.
              </p>
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

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="Export Tax Files"
            title="Download Annual Tax Package"
            description="Export the annual package in the format your CPA, bookkeeper, or accounting system needs. Later we will wire these buttons to generated PDFs, Excel files, CSV folders, and ZIP archives."
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