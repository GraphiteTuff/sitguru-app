import Link from "next/link";
import type { ReactNode } from "react";

type Tone = "emerald" | "sky" | "violet" | "amber" | "rose";

function toneStyles(tone: Tone) {
  switch (tone) {
    case "emerald":
      return {
        badge: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
        dot: "bg-emerald-400",
        button: "hover:border-emerald-300/40 hover:text-emerald-200",
      };
    case "sky":
      return {
        badge: "bg-sky-400/10 text-sky-300 border-sky-400/20",
        dot: "bg-sky-400",
        button: "hover:border-sky-300/40 hover:text-sky-200",
      };
    case "violet":
      return {
        badge: "bg-violet-400/10 text-violet-300 border-violet-400/20",
        dot: "bg-violet-400",
        button: "hover:border-violet-300/40 hover:text-violet-200",
      };
    case "amber":
      return {
        badge: "bg-amber-400/10 text-amber-300 border-amber-400/20",
        dot: "bg-amber-400",
        button: "hover:border-amber-300/40 hover:text-amber-200",
      };
    case "rose":
      return {
        badge: "bg-rose-400/10 text-rose-300 border-rose-400/20",
        dot: "bg-rose-400",
        button: "hover:border-rose-300/40 hover:text-rose-200",
      };
  }
}

function ActionLink({
  href,
  label,
  primary = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) {
  if (primary) {
    return (
      <Link
        href={href}
        className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
    >
      {label}
    </Link>
  );
}

function StatCard({
  title,
  value,
  change,
  subtext,
  tone,
  href,
}: {
  title: string;
  value: string;
  change: string;
  subtext: string;
  tone: Tone;
  href: string;
}) {
  const styles = toneStyles(tone);

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {title}
          </p>
          <p className="mt-2 text-3xl font-black tracking-tight text-white">
            {value}
          </p>
          <div
            className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${styles.badge}`}
          >
            <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
            {change}
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">{subtext}</p>
        </div>

        <Link
          href={href}
          className={`inline-flex rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white transition ${styles.button}`}
        >
          View
        </Link>
      </div>
    </div>
  );
}

function SectionCard({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)] lg:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
            {eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
            {description}
          </p>
        </div>

        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}

function SimpleProgress({
  label,
  value,
  widthClass,
  toneClass,
}: {
  label: string;
  value: string;
  widthClass: string;
  toneClass: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm text-slate-300">{label}</span>
        <span className="text-sm font-semibold text-white">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-white/10">
        <div className={`h-full rounded-full ${widthClass} ${toneClass}`} />
      </div>
    </div>
  );
}

function MiniBarRow({
  label,
  revenueWidth,
  costWidth,
}: {
  label: string;
  revenueWidth: string;
  costWidth: string;
}) {
  return (
    <div className="grid grid-cols-[28px_1fr_auto] items-center gap-3">
      <span className="text-sm text-slate-400">{label}</span>
      <div className="space-y-2">
        <div className="h-2 rounded-full bg-white/10">
          <div className={`h-full rounded-full bg-emerald-400 ${revenueWidth}`} />
        </div>
        <div className="h-2 rounded-full bg-white/10">
          <div className={`h-full rounded-full bg-rose-400 ${costWidth}`} />
        </div>
      </div>
      <div className="space-y-1 text-xs text-slate-500">
        <div>Rev</div>
        <div>Cost</div>
      </div>
    </div>
  );
}

function TableCard({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={index}
                className="border-t border-white/10 text-slate-300 transition hover:bg-white/5"
              >
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DonutLegend({
  items,
}: {
  items: { label: string; value: string; dot: string }[];
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <span className={`h-3 w-3 rounded-full ${item.dot}`} />
            <span className="text-sm text-slate-300">{item.label}</span>
          </div>
          <span className="text-sm font-semibold text-white">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

const financeCards = [
  {
    title: "Gross Revenue",
    value: "$184,320",
    change: "+12.4% MoM",
    subtext: "Marketplace bookings, services, and partner-driven sales.",
    tone: "emerald" as Tone,
    href: "/admin/financials",
  },
  {
    title: "Net Platform Revenue",
    value: "$63,980",
    change: "+8.1% MoM",
    subtext: "After payouts, referral liabilities, discounts, and refunds.",
    tone: "sky" as Tone,
    href: "/admin/financials/profit-loss",
  },
  {
    title: "Cash Position",
    value: "$91,440",
    change: "Healthy runway",
    subtext: "Operational cash view for short-term obligations and growth.",
    tone: "violet" as Tone,
    href: "/admin/financials/cash-flow",
  },
  {
    title: "Pending Payouts",
    value: "$22,650",
    change: "Needs review",
    subtext: "Guru, vendor, affiliate, and referral payouts awaiting release.",
    tone: "amber" as Tone,
    href: "/admin/commissions",
  },
  {
    title: "Referral Liabilities",
    value: "$6,420",
    change: "Track carefully",
    subtext: "Rewards and commissions due after completed qualifying sales.",
    tone: "rose" as Tone,
    href: "/admin/referrals",
  },
  {
    title: "Breakeven Margin",
    value: "117%",
    change: "Above target",
    subtext: "Current performance relative to modeled breakeven point.",
    tone: "emerald" as Tone,
    href: "/admin/financials/pro-forma",
  },
];

const launchSignupCards = [
  {
    title: "Launch Signups",
    value: "1,284",
    change: "+18.6% this week",
    subtext: "Combined early-access signup form volume, TikTok, and referrals.",
    tone: "emerald" as Tone,
    href: "/admin/launch-signups",
  },
  {
    title: "Future Gurus",
    value: "412",
    change: "Strong pipeline",
    subtext: "Prospects who selected Guru as role on the pre-launch page.",
    tone: "sky" as Tone,
    href: "/admin/guru-approvals",
  },
  {
    title: "Pet Parents",
    value: "706",
    change: "Largest segment",
    subtext: "Customer-side interest captured from homepage and social.",
    tone: "violet" as Tone,
    href: "/admin/users",
  },
  {
    title: "Instagram Source",
    value: "364",
    change: "Top social source",
    subtext: "Tracked from organic/education/awareness Instagram campaigns.",
    tone: "amber" as Tone,
    href: "/admin/launch-signups?source=instagram",
  },
];

const programCards = [
  {
    title: "Veterans Program",
    description:
      "Support veteran gurus, customers, and support providers with dedicated tracking and recruitment reporting.",
    href: "/admin/programs/veterans",
  },
  {
    title: "Student Hire Program",
    description:
      "Create pipelines for student gurus and hiring-ready talent from universities.",
    href: "/admin/programs/student-hire",
  },
  {
    title: "Minority Hire Program",
    description:
      "Track participation, outreach, and community partnership support across growth.",
    href: "/admin/programs/minority-hire",
  },
  {
    title: "Affiliate Partnerships",
    description:
      "Manage schools, vets, retailers, shelters, and organizations using SitGuru codes and partner campaigns.",
    href: "/admin/affiliates",
  },
];

export default function AdminOverviewPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.10),_transparent_30%),radial-gradient(circle_at_right,_rgba(14,165,233,0.10),_transparent_28%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-emerald-500/15 via-slate-950 to-sky-500/10 p-6 shadow-[0_12px_60px_rgba(0,0,0,0.28)] lg:p-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
                SitGuru HQ Command Center
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Financials, growth, people, referrals, and operations in one
                view.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Built for modern marketplace oversight with Vercel-safe
                structure, drill-down reporting, export-ready workflows, and
                future support for statements, payouts, accounting integrations,
                realtime activity, guru performance, customer intelligence, and
                partnership growth.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <ActionLink
                href="/admin/financials"
                label="Open Financials"
                primary
              />
              <ActionLink href="/admin/exports" label="Export Center" />
              <ActionLink href="/admin/activity" label="Live Activity" />
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Reporting Ready
              </p>
              <p className="mt-2 text-lg font-bold text-white">
                Balance Sheet, P&amp;L, Cash Flow, Pro Forma
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Growth Engine
              </p>
              <p className="mt-2 text-lg font-bold text-white">
                Gurus, customers, affiliates, veterans, referrals, launch list.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Exports
              </p>
              <p className="mt-2 text-lg font-bold text-white">
                CSV, XLSX, PDF, print views, accounting-ready outputs
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Realtime Ops
              </p>
              <p className="mt-2 text-lg font-bold text-white">
                Notifications, broadcasts, payouts, completed sale triggers
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {financeCards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {launchSignupCards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.25fr_0.9fr]">
          <SectionCard
            eyebrow="Finance"
            title="Financial command and reporting"
            description="Track core marketplace financial performance and open deeper statement views for accounting, audit support, and export workflows."
            actions={
              <>
                <ActionLink href="/admin/financials/profit-loss" label="Profit & Loss" />
                <ActionLink href="/admin/financials/balance-sheet" label="Balance Sheet" />
                <ActionLink href="/admin/financials/cash-flow" label="Cash Flow" />
                <ActionLink href="/admin/financials/pro-forma" label="Pro Forma" />
              </>
            }
          >
            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
                <p className="text-sm font-semibold text-white">
                  Core performance summary
                </p>

                <div className="mt-5 space-y-4">
                  <SimpleProgress
                    label="Revenue target attainment"
                    value="82%"
                    widthClass="w-[82%]"
                    toneClass="bg-emerald-400"
                  />
                  <SimpleProgress
                    label="Expense utilization"
                    value="67%"
                    widthClass="w-[67%]"
                    toneClass="bg-sky-400"
                  />
                  <SimpleProgress
                    label="Collections completed"
                    value="88%"
                    widthClass="w-[88%]"
                    toneClass="bg-violet-400"
                  />
                  <SimpleProgress
                    label="Refund exposure"
                    value="12%"
                    widthClass="w-[12%]"
                    toneClass="bg-rose-400"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
                <p className="text-sm font-semibold text-white">
                  Statement shortcuts
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Link
                    href="/admin/financials/balance-sheet"
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    <p className="text-sm font-semibold text-white">
                      Balance Sheet
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Assets, liabilities, equity, and retained earnings.
                    </p>
                  </Link>

                  <Link
                    href="/admin/financials/profit-loss"
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    <p className="text-sm font-semibold text-white">
                      Profit &amp; Loss
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Revenue, cost, margin, and net platform income.
                    </p>
                  </Link>

                  <Link
                    href="/admin/financials/cash-flow"
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    <p className="text-sm font-semibold text-white">
                      Cash Flow
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Operating, investing, and financing movement.
                    </p>
                  </Link>

                  <Link
                    href="/admin/financials/pro-forma"
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    <p className="text-sm font-semibold text-white">
                      Pro Forma
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Modeled forecasts, runway, and scenario planning.
                    </p>
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Total Bookings
                </p>
                <p className="mt-2 text-2xl font-black text-white">3,248</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Platform Take Rate
                </p>
                <p className="mt-2 text-2xl font-black text-white">22.4%</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Pending Adjustments
                </p>
                <p className="mt-2 text-2xl font-black text-white">$26.8k</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Launch Funnel"
            title="Pre-launch traffic, signups, and source quality"
            description="Track early-access interest from the live homepage and social bios while the platform continues to build."
            actions={
              <>
                <ActionLink
                  href="/admin/launch-signups"
                  label="Open Launch Signups"
                  primary
                />
                <ActionLink
                  href="/admin/launch-signups?source=instagram"
                  label="Instagram Source"
                />
                <ActionLink
                  href="/admin/launch-signups?filter=both"
                  label="Both Segment"
                />
              </>
            }
          >
            <div className="grid gap-5 lg:grid-cols-[1fr_0.95fr]">
              <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
                <p className="text-sm font-semibold text-white">
                  Source mix snapshot
                </p>

                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-300">Direct traffic</span>
                    <span className="font-semibold text-white">32.2%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div className="h-full w-[32.2%] rounded-full bg-emerald-400" />
                  </div>

                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-300">Instagram</span>
                    <span className="font-semibold text-white">23.1%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div className="h-full w-[23.1%] rounded-full bg-sky-400" />
                  </div>

                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-300">Facebook</span>
                    <span className="font-semibold text-white">17.7%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div className="h-full w-[17.7%] rounded-full bg-violet-400" />
                  </div>

                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-300">TikTok</span>
                    <span className="font-semibold text-white">11.1%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div className="h-full w-[11.1%] rounded-full bg-amber-400" />
                  </div>

                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-300">Referral / Email</span>
                    <span className="font-semibold text-white">9.9%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div className="h-full w-[9.9%] rounded-full bg-rose-400" />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
                <p className="text-sm font-semibold text-white">Audience split</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Pet Parents
                    </p>
                    <p className="mt-2 text-2xl font-black text-white">55%</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Future Gurus
                    </p>
                    <p className="mt-2 text-2xl font-black text-white">22%</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Both
                    </p>
                    <p className="mt-2 text-2xl font-black text-white">13%</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Conversion lift note
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      Live Instagram traffic and direct traffic show strongest
                      early conversion intent.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
          <SectionCard
            eyebrow="Charts"
            title="Revenue vs costs"
            description="Back-style visualization placeholder designed to stay Vercel-safe without introducing a heavy chart dependency before live data wiring."
            actions={
              <>
                <ActionLink href="/admin/financials" label="View Report" />
                <ActionLink href="/admin/exports" label="Export" />
              </>
            }
          >
            <div className="space-y-4">
              <MiniBarRow label="Jan" revenueWidth="w-[72%]" costWidth="w-[58%]" />
              <MiniBarRow label="Feb" revenueWidth="w-[66%]" costWidth="w-[49%]" />
              <MiniBarRow label="Mar" revenueWidth="w-[78%]" costWidth="w-[61%]" />
              <MiniBarRow label="Apr" revenueWidth="w-[84%]" costWidth="w-[65%]" />
              <MiniBarRow label="May" revenueWidth="w-[75%]" costWidth="w-[60%]" />
              <MiniBarRow label="Jun" revenueWidth="w-[80%]" costWidth="w-[54%]" />
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Charts"
            title="Pet mix and marketplace ratios"
            description="Use this to visualize service demand, pet concentration, and customer segmentation before drilling into exports."
            actions={
              <>
                <ActionLink href="/admin/analytics" label="View Analytics" />
                <ActionLink href="/admin/exports" label="Export Data" />
              </>
            }
          >
            <div className="grid gap-6 md:grid-cols-[220px_1fr]">
              <div className="mx-auto flex h-[220px] w-[220px] items-center justify-center rounded-full bg-[conic-gradient(#8b5cf6_0_54%,#facc15_54%_80%,#34d399_80%_100%)] p-5">
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-slate-950 text-center">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                    Total pets
                  </p>
                  <p className="mt-2 text-4xl font-black text-white">8,420</p>
                </div>
              </div>

              <div className="space-y-5">
                <DonutLegend
                  items={[
                    { label: "Dogs", value: "58%", dot: "bg-emerald-400" },
                    { label: "Cats", value: "26%", dot: "bg-sky-400" },
                    { label: "Small Pets", value: "9%", dot: "bg-violet-400" },
                    { label: "Other", value: "7%", dot: "bg-amber-400" },
                  ]}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Sex ratio
                    </p>
                    <p className="mt-2 text-lg font-bold text-white">
                      Male 51% / Female 49%
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Top breed
                    </p>
                    <p className="mt-2 text-lg font-bold text-white">
                      Labrador Retriever
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
          <SectionCard
            eyebrow="Guru Performance"
            title="Top performing gurus"
            description="Track best performing by rating, income, bookings, and growth to support recruiting, recognition, and territory expansion."
            actions={
              <>
                <ActionLink href="/admin/gurus" label="View Leaderboard" />
                <ActionLink href="/admin/exports" label="Export" />
              </>
            }
          >
            <TableCard
              headers={["Guru", "Rating", "Income", "Bookings", "City"]}
              rows={[
                ["Sarah Martinez", "4.9", "$12,840", "64", "Austin, TX"],
                ["David Lee", "4.8", "$11,420", "60", "Phoenix, AZ"],
                ["Jamie Collins", "4.8", "$10,680", "61", "Denver, CO"],
                ["Nina Foster", "4.9", "$9,710", "76", "Miami, FL"],
              ]}
            />

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Avg rating
                </p>
                <p className="mt-2 text-2xl font-black text-white">4.87</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Avg guru income
                </p>
                <p className="mt-2 text-2xl font-black text-white">$4,280</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Repeat booking rate
                </p>
                <p className="mt-2 text-2xl font-black text-white">63%</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Customer Intelligence"
            title="High-value customer activity"
            description="Understand customer behavior, lifetime value, repeat booking, and top markets to drive growth, retention, and incentives."
            actions={
              <>
                <ActionLink href="/admin/users" label="View Details" />
                <ActionLink href="/admin/exports" label="Export" />
              </>
            }
          >
            <TableCard
              headers={["Customer", "Spend", "Bookings", "Pets", "City"]}
              rows={[
                ["Ava Thompson", "$1,420", "10", "3", "Dallas, TX"],
                ["Michael Reed", "$1,080", "15", "2", "Atlanta, GA"],
                ["Olivia Parker", "$2,740", "14", "4", "Seattle, WA"],
                ["James Howard", "$2,510", "9", "2", "Charlotte, NC"],
              ]}
            />

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Customer LTV
                </p>
                <p className="mt-2 text-2xl font-black text-white">$684</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Repeat customers
                </p>
                <p className="mt-2 text-2xl font-black text-white">41%</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Avg spend / booking
                </p>
                <p className="mt-2 text-2xl font-black text-white">$118</p>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
          <SectionCard
            eyebrow="Pet Analytics"
            title="Pet type, sex, and breed distribution"
            description="Monitor active animal patterns and breed insights across pet demographics."
            actions={
              <>
                <ActionLink href="/admin/analytics" label="Drill Down" />
                <ActionLink href="/admin/exports" label="Export" />
              </>
            }
          >
            <div className="space-y-5">
              <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
                <p className="text-sm font-semibold text-white">
                  Pet type demand
                </p>
                <div className="mt-5 space-y-4">
                  <SimpleProgress
                    label="Dogs"
                    value="58%"
                    widthClass="w-[58%]"
                    toneClass="bg-emerald-400"
                  />
                  <SimpleProgress
                    label="Cats"
                    value="26%"
                    widthClass="w-[26%]"
                    toneClass="bg-sky-400"
                  />
                  <SimpleProgress
                    label="Small Pets"
                    value="9%"
                    widthClass="w-[9%]"
                    toneClass="bg-violet-400"
                  />
                  <SimpleProgress
                    label="Other"
                    value="7%"
                    widthClass="w-[7%]"
                    toneClass="bg-amber-400"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Male pets
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">51%</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Female pets
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">49%</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Most common breed
                  </p>
                  <p className="mt-2 text-lg font-bold text-white">
                    Labrador Retriever
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Launch Signups"
            title="Early-access sources and recent submission signals"
            description="Review top channel feeding the launch waitlist and spot which audience segments are converting first."
            actions={
              <>
                <ActionLink
                  href="/admin/launch-signups"
                  label="Open Launch Signups"
                  primary
                />
                <ActionLink
                  href="/admin/launch-signups?source=instagram"
                  label="Instagram"
                />
                <ActionLink href="/admin/launch-signups?source=tiktok" label="TikTok" />
              </>
            }
          >
            <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
              <TableCard
                headers={["Source", "Leads", "Share", "Note"]}
                rows={[
                  ["Instagram", "364", "28.3%", "Top-performing social source so far"],
                  ["Facebook", "229", "17.8%", "Steady conversion from community groups and shares"],
                  ["TikTok", "186", "14.5%", "Early traction with awareness-focused content"],
                  ["Direct", "428", "33.2%", "Homepage, typed URL, and organic website visits"],
                  ["Referral / Email", "127", "9.9%", "Founder outreach, referral link, and email shares"],
                ]}
              />
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/50 p-5">
              <TableCard
                headers={["Name", "Email", "Role", "Source", "Location"]}
                rows={[
                  ["Morgan Ellis", "morganellis@example.com", "Guru", "Instagram", "Philadelphia, PA"],
                  ["Taylor Brooks", "taylorbrooks@example.com", "Customer", "Direct", "Quakertown, PA"],
                  ["Jordan Ramirez", "jordanramirez@example.com", "Both", "Facebook", "Allentown, PA"],
                  ["Casey Nguyen", "caseynguyen@example.com", "Guru", "TikTok", "Bethlehem, PA"],
                ]}
              />
            </div>
          </SectionCard>
        </div>

        <SectionCard
          eyebrow="Programs & Partnerships"
          title="Hiring programs, affiliates, and community growth"
          description="Build structured growth channels for referrals, recruiting, universities, medical professionals, veterans programs, and local or national partnerships."
          actions={
            <>
              <ActionLink href="/admin/programs" label="View Programs" />
              <ActionLink href="/admin/affiliates" label="Manage Affiliates" />
            </>
          }
        >
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {programCards.map((program) => (
              <Link
                key={program.title}
                href={program.href}
                className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 transition hover:bg-white/10"
              >
                <p className="text-lg font-bold text-white">{program.title}</p>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {program.description}
                </p>
                <p className="mt-5 text-sm font-semibold text-emerald-300">
                  Open →
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Active referral codes
              </p>
              <p className="mt-2 text-2xl font-black text-white">146</p>
              <p className="mt-2 text-sm text-slate-400">
                Codes issued across gurus, customers, vets, schools, and
                partners.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Affiliate partners
              </p>
              <p className="mt-2 text-2xl font-black text-white">38</p>
              <p className="mt-2 text-sm text-slate-400">
                Retailers, clinics, rescues, trainers, and universities in the
                network.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Program enrollments
              </p>
              <p className="mt-2 text-2xl font-black text-white">212</p>
              <p className="mt-2 text-sm text-slate-400">
                Combined veteran, student hire, and community growth pipeline.
              </p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}