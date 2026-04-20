import Link from "next/link";
import React from "react";

type Tone =
  | "emerald"
  | "sky"
  | "violet"
  | "amber"
  | "rose"
  | "slate";

function toneClasses(tone: Tone) {
  switch (tone) {
    case "emerald":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
    case "sky":
      return "border-sky-400/20 bg-sky-400/10 text-sky-200";
    case "violet":
      return "border-violet-400/20 bg-violet-400/10 text-violet-200";
    case "amber":
      return "border-amber-400/20 bg-amber-400/10 text-amber-200";
    case "rose":
      return "border-rose-400/20 bg-rose-400/10 text-rose-200";
    default:
      return "border-white/10 bg-white/5 text-slate-200";
  }
}

function StatCard({
  title,
  value,
  change,
  subtext,
  tone = "slate",
  href,
}: {
  title: string;
  value: string;
  change: string;
  subtext: string;
  tone?: Tone;
  href: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.18)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {title}
          </p>
          <p className="mt-3 text-3xl font-black tracking-tight text-white">
            {value}
          </p>
          <div
            className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClasses(
              tone
            )}`}
          >
            {change}
          </div>
          <p className="mt-3 text-sm text-slate-400">{subtext}</p>
        </div>

        <Link
          href={href}
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
        >
          View
        </Link>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  eyebrow,
  description,
  actions,
  children,
}: {
  title: string;
  eyebrow: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_50px_rgba(0,0,0,0.2)]">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
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
  return (
    <Link
      href={href}
      className={
        primary
          ? "rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          : "rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
      }
    >
      {label}
    </Link>
  );
}

function ProgressBar({
  label,
  value,
  width,
  tone = "bg-emerald-400",
}: {
  label: string;
  value: string;
  width: string;
  tone?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-300">{label}</p>
        <p className="text-sm font-semibold text-white">{value}</p>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${tone}`} style={{ width }} />
      </div>
    </div>
  );
}

function MiniTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
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
    subtext: "Combined early-access signups from website, social, and referrals.",
    tone: "emerald" as Tone,
    href: "/admin/launch-signups",
  },
  {
    title: "Future Gurus",
    value: "412",
    change: "Strong pipeline",
    subtext: "Prospects who selected Guru or Both on the pre-launch page.",
    tone: "sky" as Tone,
    href: "/admin/launch-signups?filter=guru",
  },
  {
    title: "Pet Parents",
    value: "706",
    change: "Largest segment",
    subtext: "Customer-side interest captured from live homepage and social.",
    tone: "violet" as Tone,
    href: "/admin/launch-signups?filter=customer",
  },
  {
    title: "Instagram Source",
    value: "364",
    change: "Top social source",
    subtext: "Tracked from sitguruofficial.com?source=instagram.",
    tone: "amber" as Tone,
    href: "/admin/launch-signups?source=instagram",
  },
];

const topGurus = [
  {
    name: "Sarah Martinez",
    rating: "4.98",
    income: "$12,840",
    bookings: "94",
    city: "Austin, TX",
  },
  {
    name: "David Lee",
    rating: "4.95",
    income: "$11,420",
    bookings: "88",
    city: "Phoenix, AZ",
  },
  {
    name: "Jamie Collins",
    rating: "4.93",
    income: "$10,980",
    bookings: "81",
    city: "Denver, CO",
  },
  {
    name: "Nina Foster",
    rating: "4.91",
    income: "$9,760",
    bookings: "76",
    city: "Miami, FL",
  },
];

const topCustomers = [
  {
    name: "Ava Thompson",
    spend: "$3,420",
    bookings: "18",
    pets: "3",
    city: "Dallas, TX",
  },
  {
    name: "Michael Reed",
    spend: "$2,980",
    bookings: "15",
    pets: "2",
    city: "Atlanta, GA",
  },
  {
    name: "Olivia Parker",
    spend: "$2,740",
    bookings: "14",
    pets: "4",
    city: "Seattle, WA",
  },
  {
    name: "James Howard",
    spend: "$2,510",
    bookings: "13",
    pets: "2",
    city: "Charlotte, NC",
  },
];

const liveFeed = [
  "Completed sale: Booking #BK-2048 released commission and guru payout.",
  "New guru approved: Student Hire Program applicant in Columbus, OH.",
  "Referral code VETCARE15 converted after completed medical consult booking.",
  "Admin broadcast sent to gurus in Florida about holiday demand surge.",
  "Veterans Program enrollment approved for a new grooming guru in San Diego.",
  "Vendor payout batch prepared for partner retail fulfillment orders.",
];

const adminMessageThreads = [
  {
    subject: "Weekend sitting details for Cooper",
    latestPreview:
      "Customer asked for pickup timing, feeding routine, and whether photo updates can be sent through the booking.",
    lastActivity: "8 minutes ago",
    participants: ["Customer: Emily Carter", "Guru: Sarah Martinez"],
    threadType: "Guru ↔ Customer",
    href: "/admin/messages?thread=weekend-sitting-cooper",
    tone: "emerald",
  },
  {
    subject: "Payout question from Guru",
    latestPreview:
      "Guru asked Admin to review a delayed payout connected to a completed overnight booking from Friday.",
    lastActivity: "21 minutes ago",
    participants: ["Guru: David Lee", "Admin"],
    threadType: "Guru ↔ Admin",
    href: "/admin/messages?thread=payout-question-david-lee",
    tone: "sky",
  },
  {
    subject: "Medication instructions confirmed",
    latestPreview:
      "Guru confirmed dosage timing with the customer and noted Admin can review the conversation if needed.",
    lastActivity: "42 minutes ago",
    participants: ["Customer: Olivia Parker", "Guru: Jamie Collins"],
    threadType: "Guru ↔ Customer",
    href: "/admin/messages?thread=medication-instructions-confirmed",
    tone: "violet",
  },
  {
    subject: "Escalation about cancellation refund",
    latestPreview:
      "Guru requested Admin help after a customer asked about refund timing and a canceled same-day booking.",
    lastActivity: "1 hour ago",
    participants: ["Guru: Nina Foster", "Admin"],
    threadType: "Guru ↔ Admin",
    href: "/admin/messages?thread=cancellation-refund-escalation",
    tone: "amber",
  },
];

const programCards = [
  {
    title: "Veterans Program",
    description:
      "Support veteran gurus, customers, and employment pathways with dedicated tracking and recruitment reporting.",
    href: "/admin/programs/veterans",
  },
  {
    title: "Student Hire Program",
    description:
      "Create pipelines for student gurus and interns through schools and universities.",
    href: "/admin/programs/student-hire",
  },
  {
    title: "Minority Hire Program",
    description:
      "Track participation, outreach, and community partnerships to support inclusive growth.",
    href: "/admin/programs/minority-hire",
  },
  {
    title: "Affiliate Partnerships",
    description:
      "Manage schools, vets, retailers, shelters, and organizations using SitGuru codes and partner campaigns.",
    href: "/admin/affiliates",
  },
];

const launchSourceRows = [
  {
    source: "Instagram",
    leads: "364",
    share: "28.3%",
    note: "Top-performing social source so far",
    tone: "emerald" as Tone,
  },
  {
    source: "Facebook",
    leads: "219",
    share: "17.1%",
    note: "Strong conversion from community groups and shares",
    tone: "sky" as Tone,
  },
  {
    source: "TikTok",
    leads: "146",
    share: "11.4%",
    note: "Early traction with awareness-focused content",
    tone: "violet" as Tone,
  },
  {
    source: "Direct",
    leads: "428",
    share: "33.3%",
    note: "Homepage, typed URL, and organic website visits",
    tone: "amber" as Tone,
  },
  {
    source: "Referral / Email",
    leads: "127",
    share: "9.9%",
    note: "Founder outreach, referral links, and email shares",
    tone: "rose" as Tone,
  },
];

const recentLaunchSignups = [
  {
    name: "Morgan Ellis",
    email: "morgan.ellis@example.com",
    role: "Guru",
    source: "instagram",
    location: "Philadelphia, PA",
    joined: "6 minutes ago",
  },
  {
    name: "Taylor Brooks",
    email: "taylor.brooks@example.com",
    role: "Customer",
    source: "direct",
    location: "Quakertown, PA",
    joined: "18 minutes ago",
  },
  {
    name: "Jordan Ramirez",
    email: "jordan.ramirez@example.com",
    role: "Both",
    source: "facebook",
    location: "Allentown, PA",
    joined: "34 minutes ago",
  },
  {
    name: "Casey Nguyen",
    email: "casey.nguyen@example.com",
    role: "Guru",
    source: "tiktok",
    location: "Bethlehem, PA",
    joined: "51 minutes ago",
  },
];

const quickLinks = [
  { label: "Financials", href: "/admin/financials" },
  { label: "Users", href: "/admin/users" },
  { label: "Fraud", href: "/admin/fraud" },
  { label: "Bookings", href: "/admin/bookings" },
  { label: "Referrals", href: "/admin/referrals" },
  { label: "Commissions", href: "/admin/commissions" },
  { label: "Exports", href: "/admin/exports" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "Messages", href: "/admin/messages" },
  { label: "Launch Signups", href: "/admin/launch-signups" },
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
                Gurus, customers, affiliates, veterans, referrals, launch list
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
                <ActionLink
                  href="/admin/financials/profit-loss"
                  label="Profit & Loss"
                />
                <ActionLink
                  href="/admin/financials/balance-sheet"
                  label="Balance Sheet"
                />
                <ActionLink
                  href="/admin/financials/cash-flow"
                  label="Cash Flow"
                />
                <ActionLink
                  href="/admin/financials/pro-forma"
                  label="Pro Forma"
                />
              </>
            }
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                <p className="text-sm font-semibold text-white">
                  Core performance summary
                </p>

                <div className="mt-5 space-y-4">
                  <ProgressBar
                    label="Revenue target attainment"
                    value="92%"
                    width="92%"
                    tone="bg-emerald-400"
                  />
                  <ProgressBar
                    label="Expense utilization"
                    value="67%"
                    width="67%"
                    tone="bg-amber-400"
                  />
                  <ProgressBar
                    label="Collections completed"
                    value="88%"
                    width="88%"
                    tone="bg-sky-400"
                  />
                  <ProgressBar
                    label="Refund exposure"
                    value="12%"
                    width="12%"
                    tone="bg-rose-400"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                <p className="text-sm font-semibold text-white">
                  Statement shortcuts
                </p>

                <div className="mt-5 grid gap-4">
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
                      Revenue, costs, margin, and net platform income.
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
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                <p className="text-sm font-semibold text-white">
                  Source mix snapshot
                </p>

                <div className="mt-5 space-y-4">
                  <ProgressBar
                    label="Direct traffic"
                    value="33.3%"
                    width="33.3%"
                    tone="bg-amber-400"
                  />
                  <ProgressBar
                    label="Instagram"
                    value="28.3%"
                    width="28.3%"
                    tone="bg-emerald-400"
                  />
                  <ProgressBar
                    label="Facebook"
                    value="17.1%"
                    width="17.1%"
                    tone="bg-sky-400"
                  />
                  <ProgressBar
                    label="TikTok"
                    value="11.4%"
                    width="11.4%"
                    tone="bg-violet-400"
                  />
                  <ProgressBar
                    label="Referral / Email"
                    value="9.9%"
                    width="9.9%"
                    tone="bg-rose-400"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                <p className="text-sm font-semibold text-white">
                  Audience split
                </p>

                <div className="mt-5 space-y-4">
                  <ProgressBar
                    label="Pet Parents"
                    value="55%"
                    width="55%"
                    tone="bg-violet-400"
                  />
                  <ProgressBar
                    label="Future Gurus"
                    value="32%"
                    width="32%"
                    tone="bg-sky-400"
                  />
                  <ProgressBar
                    label="Both"
                    value="13%"
                    width="13%"
                    tone="bg-emerald-400"
                  />
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Conversion note
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      Instagram is the strongest social conversion source.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Live link tracked
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white break-all">
                      sitguruofficial.com?source=instagram
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-8 xl:grid-cols-2">
          <SectionCard
            eyebrow="Charts"
            title="Revenue vs costs"
            description="Bar-style visualization placeholder designed to stay Vercel-safe without introducing a heavy chart dependency before live data wiring."
            actions={
              <>
                <ActionLink href="/admin/financials" label="View Report" />
                <ActionLink href="/admin/financials/exports" label="Export" />
              </>
            }
          >
            <div className="grid gap-4">
              {[
                { month: "Jan", rev: "72%", cost: "54%" },
                { month: "Feb", rev: "78%", cost: "58%" },
                { month: "Mar", rev: "81%", cost: "61%" },
                { month: "Apr", rev: "88%", cost: "67%" },
                { month: "May", rev: "92%", cost: "69%" },
                { month: "Jun", rev: "84%", cost: "63%" },
              ].map((item) => (
                <div
                  key={item.month}
                  className="grid grid-cols-[52px_1fr] items-center gap-4"
                >
                  <p className="text-sm font-semibold text-slate-300">
                    {item.month}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="h-3 flex-1 rounded-full bg-white/10">
                        <div
                          className="h-3 rounded-full bg-emerald-400"
                          style={{ width: item.rev }}
                        />
                      </div>
                      <span className="w-12 text-right text-xs text-slate-400">
                        Rev
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-3 flex-1 rounded-full bg-white/10">
                        <div
                          className="h-3 rounded-full bg-rose-400"
                          style={{ width: item.cost }}
                        />
                      </div>
                      <span className="w-12 text-right text-xs text-slate-400">
                        Cost
                      </span>
                    </div>
                  </div>
                </div>
              ))}
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
            <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
              <div className="mx-auto flex h-[220px] w-[220px] items-center justify-center rounded-full border-[26px] border-sky-400 border-t-emerald-400 border-r-violet-400 border-b-amber-400">
                <div className="text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Total Pets
                  </p>
                  <p className="mt-2 text-3xl font-black text-white">8,420</p>
                </div>
              </div>

              <div className="space-y-6">
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
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Sex Ratio
                    </p>
                    <p className="mt-2 text-lg font-bold text-white">
                      Male 51% / Female 49%
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Top Breed
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

        <div className="grid gap-8 xl:grid-cols-2">
          <SectionCard
            eyebrow="Guru Performance"
            title="Top performing gurus"
            description="Track best performers by rating, income, bookings, and growth to support incentives, recognition, and territory expansion."
            actions={
              <>
                <ActionLink
                  href="/admin/guru-performance"
                  label="View Leaderboard"
                />
                <ActionLink href="/admin/guru-performance" label="Export" />
              </>
            }
          >
            <MiniTable
              headers={["Guru", "Rating", "Income", "Bookings", "City"]}
              rows={topGurus.map((guru) => [
                <span key="name" className="font-semibold text-white">
                  {guru.name}
                </span>,
                guru.rating,
                guru.income,
                guru.bookings,
                guru.city,
              ])}
            />

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Avg Rating
                </p>
                <p className="mt-2 text-2xl font-black text-white">4.87</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Avg Guru Income
                </p>
                <p className="mt-2 text-2xl font-black text-white">$4,280</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Repeat Booking Rate
                </p>
                <p className="mt-2 text-2xl font-black text-white">63%</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Customer Intelligence"
            title="High-value customer activity"
            description="Understand customer behavior, lifetime value, repeat bookings, and top markets to drive growth, retention, and incentives."
            actions={
              <>
                <ActionLink
                  href="/admin/customer-intelligence"
                  label="View Details"
                />
                <ActionLink
                  href="/admin/customer-intelligence"
                  label="Export"
                />
              </>
            }
          >
            <MiniTable
              headers={["Customer", "Spend", "Bookings", "Pets", "City"]}
              rows={topCustomers.map((customer) => [
                <span key="name" className="font-semibold text-white">
                  {customer.name}
                </span>,
                customer.spend,
                customer.bookings,
                customer.pets,
                customer.city,
              ])}
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
                  Repeat Customers
                </p>
                <p className="mt-2 text-2xl font-black text-white">41%</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Avg Spend / Booking
                </p>
                <p className="mt-2 text-2xl font-black text-white">$118</p>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-8 xl:grid-cols-2">
          <SectionCard
            eyebrow="Pet Analytics"
            title="Pet type, sex, and breed distribution"
            description="Monitor service demand patterns and market segments across pet demographics."
            actions={
              <>
                <ActionLink href="/admin/pet-analytics" label="Drill Down" />
                <ActionLink href="/admin/pet-analytics" label="Export" />
              </>
            }
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                <p className="text-sm font-semibold text-white">
                  Pet type demand
                </p>

                <div className="mt-5 space-y-4">
                  <ProgressBar
                    label="Dogs"
                    value="58%"
                    width="58%"
                    tone="bg-emerald-400"
                  />
                  <ProgressBar
                    label="Cats"
                    value="26%"
                    width="26%"
                    tone="bg-sky-400"
                  />
                  <ProgressBar
                    label="Small Pets"
                    value="9%"
                    width="9%"
                    tone="bg-violet-400"
                  />
                  <ProgressBar
                    label="Other"
                    value="7%"
                    width="7%"
                    tone="bg-amber-400"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                <p className="text-sm font-semibold text-white">
                  Breed and sex insights
                </p>

                <div className="mt-5 grid gap-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Male Pets
                    </p>
                    <p className="mt-2 text-2xl font-black text-white">51%</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Female Pets
                    </p>
                    <p className="mt-2 text-2xl font-black text-white">49%</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Most Common Breed
                    </p>
                    <p className="mt-2 text-lg font-bold text-white">
                      Labrador Retriever
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Launch Signups"
            title="Early-access sources and recent submissions"
            description="Review top channels feeding the launch waitlist and spot which audience segments are converting first."
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
                <ActionLink
                  href="/admin/launch-signups?source=tiktok"
                  label="TikTok"
                />
              </>
            }
          >
            <MiniTable
              headers={["Source", "Leads", "Share", "Note"]}
              rows={launchSourceRows.map((row) => [
                <span
                  key={row.source}
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClasses(
                    row.tone
                  )}`}
                >
                  {row.source}
                </span>,
                row.leads,
                row.share,
                row.note,
              ])}
            />

            <div className="mt-5">
              <MiniTable
                headers={["Name", "Email", "Role", "Source", "Location", "Joined"]}
                rows={recentLaunchSignups.map((signup) => [
                  <span key={signup.email} className="font-semibold text-white">
                    {signup.name}
                  </span>,
                  signup.email,
                  signup.role,
                  signup.source,
                  signup.location,
                  signup.joined,
                ])}
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

        <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
          <SectionCard
            eyebrow="Message Oversight"
            title="Guru, customer, and admin conversation review"
            description="Give Admin a fast oversight view of recent Guru ↔ Customer and Guru ↔ Admin threads with subjects, latest previews, participant visibility, and direct open-thread access."
            actions={
              <>
                <ActionLink
                  href="/admin/messages"
                  label="Open Messages"
                  primary
                />
                <ActionLink
                  href="/admin/messages?filter=guru-admin"
                  label="Guru ↔ Admin"
                />
                <ActionLink
                  href="/admin/messages?filter=guru-customer"
                  label="Guru ↔ Customer"
                />
              </>
            }
          >
            <div className="space-y-4">
              {adminMessageThreads.map((thread) => (
                <div
                  key={`${thread.subject}-${thread.lastActivity}`}
                  className="rounded-3xl border border-white/10 bg-slate-950/60 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClasses(
                            thread.tone as Tone
                          )}`}
                        >
                          {thread.threadType}
                        </span>
                        <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                          Last activity · {thread.lastActivity}
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-bold text-white">
                        {thread.subject}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {thread.latestPreview}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {thread.participants.map((participant) => (
                          <span
                            key={participant}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300"
                          >
                            {participant}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-start">
                      <Link
                        href={thread.href}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                      >
                        Open Thread
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Active reviewed threads
                </p>
                <p className="mt-2 text-2xl font-black text-white">24</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Guru ↔ Customer
                </p>
                <p className="mt-2 text-2xl font-black text-white">16</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Guru ↔ Admin
                </p>
                <p className="mt-2 text-2xl font-black text-white">8</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Escalations open
                </p>
                <p className="mt-2 text-2xl font-black text-white">3</p>
              </div>
            </div>
          </SectionCard>

          <div className="space-y-8">
            <SectionCard
              eyebrow="Realtime Operations"
              title="Live admin activity feed"
              description="Keep a pulse on approvals, payout triggers, referral conversions, and operational actions across the marketplace."
              actions={<ActionLink href="/admin/activity" label="Open Feed" />}
            >
              <div className="space-y-3">
                {liveFeed.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4"
                  >
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <p className="text-sm leading-6 text-slate-300">{item}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="Quick Access"
              title="Admin navigation and drill-downs"
              description="Open core admin areas fast and keep the dashboard useful even before every route is fully wired."
              actions={<ActionLink href="/admin/users" label="Open Users" />}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span>{link.label}</span>
                      <span className="text-emerald-300">→</span>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4">
                <p className="text-sm font-semibold text-sky-200">
                  Vercel-safe admin shell
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  This page uses static mock data and lightweight Tailwind UI so
                  it should build cleanly while you wire real Supabase, Stripe,
                  exports, launch capture, and reporting actions into each
                  route.
                </p>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}