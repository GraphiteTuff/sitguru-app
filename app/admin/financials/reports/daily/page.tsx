import Link from "next/link";

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
  "Match expected cash movement to bank deposit timing when deposits post.",
  "Add notes for CPA/bookkeeper if any transaction needs explanation.",
];

const exportCards: ExportCard[] = [
  {
    title: "Daily PDF Snapshot",
    description:
      "Readable daily report for owner review, CPA notes, management handoff, and internal records.",
    href: "/admin/financials/exports?type=daily&format=pdf",
  },
  {
    title: "Daily Excel Workbook",
    description:
      "Workbook with daily metrics, booking activity, payment activity, exceptions, and notes.",
    href: "/admin/financials/exports?type=daily&format=xlsx",
  },
  {
    title: "Daily CSV Package",
    description:
      "CSV files for daily transactions, Stripe activity, payouts, commissions, and exceptions.",
    href: "/admin/financials/exports?type=daily&format=csv",
  },
  {
    title: "Daily ZIP Archive",
    description:
      "Full daily backup package containing PDF, Excel, CSV files, and supporting schedules.",
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

export default function AdminFinancialsDailyReportPage() {
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
              </div>

              <p className="mt-3 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
                Daily owner snapshot for SitGuru’s financial activity. Review
                booking volume, payment collection, Stripe fees, refunds,
                guru payouts, partner commissions, cash movement, and exceptions
                before they become month-end issues.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[560px]">
              <div className="rounded-[1.25rem] border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                  Report Date
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  Today
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
          {dailyMetrics.map((metric) => (
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
            description="Review the daily flow of bookings, payments, guru payouts, partner commissions, Stripe activity, and banking items."
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activityCards.map((card) => (
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
              title="Daily Financial Exceptions"
              description="Items listed here should be reviewed before they carry into weekly, monthly, or CPA handoff reporting."
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
            description="Export today’s report as a PDF, Excel workbook, CSV package, or ZIP archive for management review, CPA notes, and audit backup."
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