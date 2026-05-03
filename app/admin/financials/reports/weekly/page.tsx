import Link from "next/link";

type WeeklyMetric = {
  label: string;
  value: string;
  change: string;
  helper: string;
  tone: "green" | "blue" | "amber" | "rose" | "slate" | "purple";
};

type WeeklyReportCard = {
  eyebrow: string;
  title: string;
  description: string;
  value: string;
  href: string;
  tone: "green" | "blue" | "amber" | "rose" | "purple" | "slate";
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

const weeklyMetrics: WeeklyMetric[] = [
  {
    label: "Gross Bookings",
    value: "$124,860",
    change: "↑ 12.4%",
    helper: "Week-over-week booking volume.",
    tone: "green",
  },
  {
    label: "Payments Collected",
    value: "$116,240",
    change: "↑ 10.8%",
    helper: "Customer payments captured this week.",
    tone: "green",
  },
  {
    label: "Platform Revenue",
    value: "$17,436",
    change: "↑ 9.6%",
    helper: "Estimated SitGuru revenue this week.",
    tone: "blue",
  },
  {
    label: "Guru Payouts Due",
    value: "$74,320",
    change: "↑ 8.1%",
    helper: "Eligible guru payouts to review.",
    tone: "amber",
  },
  {
    label: "Partner Commissions",
    value: "$4,820",
    change: "↑ 6.7%",
    helper: "Referral and partner commissions accrued.",
    tone: "purple",
  },
  {
    label: "Stripe Fees",
    value: "$3,215",
    change: "↑ 4.9%",
    helper: "Estimated processing and payment fees.",
    tone: "slate",
  },
  {
    label: "Refunds / Chargebacks",
    value: "$1,140",
    change: "↓ 3.2%",
    helper: "Refunds, disputes, and chargebacks.",
    tone: "rose",
  },
  {
    label: "Net Cash Movement",
    value: "$29,309",
    change: "↑ 15.9%",
    helper: "Estimated retained cash this week.",
    tone: "green",
  },
];

const performanceCards: WeeklyReportCard[] = [
  {
    eyebrow: "Bookings",
    title: "Weekly Booking Performance",
    description:
      "Review confirmed bookings, cancellations, completed stays, pending requests, and booking growth.",
    value: "842",
    href: "/admin/bookings",
    tone: "green",
  },
  {
    eyebrow: "Revenue",
    title: "Weekly Revenue Summary",
    description:
      "Review platform revenue, customer charges, refunds, chargebacks, and net retained revenue.",
    value: "$17.4K",
    href: "/admin/financials/profit-loss",
    tone: "blue",
  },
  {
    eyebrow: "Payouts",
    title: "Guru Payout Review",
    description:
      "Review payout-ready balances, payout holds, batch timing, payment exceptions, and payout history.",
    value: "$74.3K",
    href: "/admin/financials/payouts",
    tone: "amber",
  },
  {
    eyebrow: "Partners",
    title: "Partner Commission Review",
    description:
      "Review partner referral volume, commission accruals, approvals, pending payouts, and exceptions.",
    value: "$4.8K",
    href: "/admin/financials/commissions",
    tone: "purple",
  },
  {
    eyebrow: "Stripe",
    title: "Stripe Weekly Settlement",
    description:
      "Review gross payments, Stripe fees, refunds, disputes, transfers, payout timing, and settlement status.",
    value: "Ready",
    href: "/admin/financials/stripe",
    tone: "slate",
  },
  {
    eyebrow: "Banking",
    title: "Bank Deposit Matching",
    description:
      "Compare Stripe settlement batches and expected deposits to Navy Federal business banking activity.",
    value: "4 pending",
    href: "/admin/financials/reconciliation",
    tone: "rose",
  },
];

const exceptions: WeeklyException[] = [
  {
    title: "Four Stripe settlement deposits need bank matching",
    description:
      "Expected weekly Stripe payout batches should be matched against Navy Federal deposits once posted.",
    severity: "Medium",
    status: "Review",
    owner: "Finance Admin",
    href: "/admin/financials/reconciliation",
  },
  {
    title: "Partner commission batch requires approval",
    description:
      "A weekly partner commission batch is accrued but has not been approved for payout.",
    severity: "Low",
    status: "Watching",
    owner: "Admin",
    href: "/admin/financials/commissions",
  },
  {
    title: "Refund category review needed",
    description:
      "Confirm whether weekly refund activity is cancellation-related, service-credit related, or dispute-related.",
    severity: "Medium",
    status: "Open",
    owner: "Finance Admin",
    href: "/admin/financials/stripe",
  },
];

const weeklyCloseSteps = [
  "Review weekly booking growth, cancellations, completion rate, and failed booking payments.",
  "Confirm customer payment collection, Stripe processing fees, refunds, disputes, and transfer timing.",
  "Review guru payout eligibility, payout holds, exceptions, and payout batch readiness.",
  "Review partner commission accruals, approval status, and payout timing.",
  "Match expected Stripe settlement batches to bank deposit timing.",
  "Review vendor/admin expenses recorded during the week.",
  "Add CPA/bookkeeper notes for any unresolved transaction or category question.",
  "Export the weekly report package for management records.",
];

const exportCards: ExportCard[] = [
  {
    title: "Weekly PDF Report",
    description:
      "Readable weekly management report for owner review, leadership updates, CPA notes, and internal records.",
    href: "/admin/financials/exports?type=weekly&format=pdf",
  },
  {
    title: "Weekly Excel Workbook",
    description:
      "Multi-tab workbook with weekly KPIs, bookings, payment activity, payouts, commissions, exceptions, and notes.",
    href: "/admin/financials/exports?type=weekly&format=xlsx",
  },
  {
    title: "Weekly CSV Package",
    description:
      "CSV files for weekly transactions, Stripe activity, payouts, commissions, bank matching, and exceptions.",
    href: "/admin/financials/exports?type=weekly&format=csv",
  },
  {
    title: "Weekly ZIP Archive",
    description:
      "Full weekly archive containing PDF, Excel workbook, CSV files, schedules, and support records.",
    href: "/admin/financials/exports?type=weekly&format=zip",
  },
];

function toneClasses(tone: WeeklyMetric["tone"] | WeeklyReportCard["tone"]) {
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

function MiniTrend({ tone = "green" }: { tone?: WeeklyMetric["tone"] }) {
  const stroke =
    tone === "rose"
      ? "stroke-rose-500"
      : tone === "blue"
        ? "stroke-sky-500"
        : tone === "amber"
          ? "stroke-amber-500"
          : tone === "purple"
            ? "stroke-purple-500"
            : "stroke-emerald-500";

  const fill =
    tone === "rose"
      ? "fill-rose-50"
      : tone === "blue"
        ? "fill-sky-50"
        : tone === "amber"
          ? "fill-amber-50"
          : tone === "purple"
            ? "fill-purple-50"
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

function WeeklyTrendChart() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const revenueHeights = [48, 72, 64, 86, 92, 110, 98];
  const expenseHeights = [36, 44, 52, 58, 62, 70, 64];

  return (
    <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <SectionHeader
        eyebrow="Week-over-week"
        title="Weekly Revenue, Expense & Cash Movement"
        description="Visual summary of the current week’s financial movement so management can quickly see momentum and exceptions before month-end."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-black text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Revenue
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-black text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              Expenses
            </span>
          </div>

          <div className="mt-6 grid grid-cols-[56px_1fr] gap-4">
            <div className="flex h-[260px] flex-col justify-between pb-8 text-[11px] font-black text-slate-400">
              {["$40K", "$30K", "$20K", "$10K", "$0"].map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>

            <div className="relative h-[260px]">
              <div className="absolute inset-0 pb-8">
                <div className="flex h-full flex-col justify-between">
                  {[0, 1, 2, 3, 4].map((row) => (
                    <div
                      key={row}
                      className="border-t border-dashed border-slate-200"
                    />
                  ))}
                </div>
              </div>

              <div className="absolute inset-x-0 top-0 bottom-8">
                <div className="flex h-full items-end gap-4">
                  {days.map((day, index) => (
                    <div
                      key={day}
                      className="flex flex-1 items-end justify-center gap-1"
                    >
                      <span
                        className="w-full max-w-[18px] rounded-t-lg bg-emerald-500"
                        style={{ height: `${revenueHeights[index]}px` }}
                      />
                      <span
                        className="w-full max-w-[18px] rounded-t-lg bg-rose-400"
                        style={{ height: `${expenseHeights[index]}px` }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 grid grid-cols-7 text-center text-[11px] font-black text-slate-400">
                {days.map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {[
            ["Best Revenue Day", "Saturday", "$24,850"],
            ["Highest Expense Day", "Saturday", "$15,920"],
            ["Average Daily Revenue", "$16,606", "7-day average"],
            ["Net Weekly Cash", "$29,309", "after payouts and fees"],
          ].map(([label, value, helper]) => (
            <div
              key={label}
              className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5"
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                {label}
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
              <p className="mt-1 text-sm font-bold text-slate-600">{helper}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminFinancialsWeeklyReportPage() {
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
                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                  Weekly Review
                </span>
              </div>

              <p className="mt-3 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
                Weekly management review for SitGuru’s financial performance.
                Track booking momentum, payment collection, platform revenue,
                guru payout obligations, partner commissions, Stripe fees,
                refunds, cash movement, and financial exceptions before the
                monthly close.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[560px]">
              <div className="rounded-[1.25rem] border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                  Report Period
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  This Week
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
                  {exceptions.length}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          {weeklyMetrics.map((metric) => (
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

              <p
                className={`mt-1 text-xs font-black ${
                  metric.tone === "rose" ? "text-rose-600" : "text-emerald-700"
                }`}
              >
                {metric.change}
              </p>

              <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
                {metric.helper}
              </p>

              <MiniTrend tone={metric.tone} />
            </div>
          ))}
        </section>

        <WeeklyTrendChart />

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="Weekly Activity"
            title="Operating Finance Review"
            description="Review the weekly flow of bookings, payments, guru payouts, partner commissions, Stripe activity, and banking items."
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
              description="Items listed here should be resolved before the monthly close or CPA handoff."
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

                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-slate-600">
                        {item.owner}
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
              Weekly Close
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
              Weekly review checklist
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              This checklist helps management close the week cleanly before
              month-end reporting.
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

            <div className="mt-6 grid gap-3">
              <Link
                href="/admin/financials/reports/daily"
                className="inline-flex justify-center rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-800 transition hover:bg-emerald-50"
              >
                Open Daily Reports →
              </Link>

              <Link
                href="/admin/financials/cpa-handoff"
                className="inline-flex justify-center rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
              >
                Open CPA Tracker →
              </Link>
            </div>
          </aside>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="Weekly Export"
            title="Download Weekly Report Package"
            description="Export this week’s report as a PDF, Excel workbook, CSV package, or ZIP archive for management review, CPA notes, and audit backup."
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