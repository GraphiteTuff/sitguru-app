import Link from "next/link";

const growthStats = [
  {
    label: "Monthly Signups",
    value: "1,284",
    detail: "+18.4% vs last month",
  },
  {
    label: "Booking Conversion",
    value: "24.8%",
    detail: "Search to completed booking funnel",
  },
  {
    label: "Repeat Booking Rate",
    value: "41%",
    detail: "Customers booking again with SitGuru",
  },
  {
    label: "Referral Growth",
    value: "17.2%",
    detail: "New users driven by sharing and invites",
  },
];

const analyticsModules = [
  {
    title: "User Growth",
    count: "12.4K",
    description:
      "Monitor customer, guru, vendor, educator, medical, and admin account growth over time.",
    href: "/admin/users",
  },
  {
    title: "Guru Performance",
    count: "1,284",
    description:
      "Track active gurus, profile strength, booking activity, and marketplace readiness.",
    href: "/admin/guru-approvals",
  },
  {
    title: "Booking Funnel",
    count: "326",
    description:
      "See how discovery, profile visits, requests, and completed bookings flow through the platform.",
    href: "/admin/bookings",
  },
  {
    title: "Revenue Signals",
    count: "$48.9K",
    description:
      "Review payment volume, platform fees, payouts, refunds, and transaction health.",
    href: "/admin/payments",
  },
];

const funnelSteps = [
  {
    step: "Homepage Visits",
    value: "18,420",
    note: "Users entering the SitGuru platform",
  },
  {
    step: "Search Engagement",
    value: "9,740",
    note: "Users actively browsing gurus and services",
  },
  {
    step: "Guru Profile Views",
    value: "6,380",
    note: "Potential customers reviewing expert profiles",
  },
  {
    step: "Booking Starts",
    value: "1,920",
    note: "Users beginning the booking process",
  },
  {
    step: "Completed Bookings",
    value: "812",
    note: "Bookings successfully converted and completed",
  },
];

const networkSignals = [
  {
    title: "Top acquisition driver",
    detail: "Guru sharing links continue to outperform direct paid traffic.",
  },
  {
    title: "Strong retention pattern",
    detail: "Customers who message a guru before booking rebook more often.",
  },
  {
    title: "Approval quality matters",
    detail: "Higher-quality guru profiles show better conversion and repeat performance.",
  },
  {
    title: "Referral momentum",
    detail: "Friend invites and guru-led growth are strengthening network expansion.",
  },
];

const rolePerformance = [
  {
    role: "Pet Owners",
    users: "8,940",
    growth: "+11.2%",
    signal: "Strong repeat engagement",
  },
  {
    role: "Gurus",
    users: "1,284",
    growth: "+9.6%",
    signal: "Higher booking quality",
  },
  {
    role: "Vendors",
    users: "146",
    growth: "+6.4%",
    signal: "Early marketplace traction",
  },
  {
    role: "Educators",
    users: "72",
    growth: "+4.8%",
    signal: "Steady specialist interest",
  },
  {
    role: "Medical Pros",
    users: "54",
    growth: "+5.1%",
    signal: "High-trust opportunity",
  },
];

function growthClasses(value: string) {
  if (value.startsWith("+")) {
    return "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20";
  }

  return "bg-slate-400/10 text-slate-300 ring-slate-400/20";
}

export default function AdminAnalyticsPage() {
  return (
    <main className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_24%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_24%),linear-gradient(180deg,#0f172a_0%,#020617_100%)] p-6 sm:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Platform Analytics
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Measure SitGuru growth, conversion, and network strength
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Track the performance signals that matter most across users,
              gurus, bookings, payments, referrals, and repeat engagement.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/users"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Users
            </Link>
            <Link
              href="/admin/bookings"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Bookings
            </Link>
            <Link
              href="/admin/payments"
              className="rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Payments
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {growthStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl border border-white/10 bg-white/5 p-5"
            >
              <p className="text-sm font-medium text-slate-400">{stat.label}</p>
              <p className="mt-3 text-3xl font-black tracking-tight text-white">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-slate-400">{stat.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.2fr_0.9fr]">
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-white">
              Analytics modules
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Review the key growth systems powering the SitGuru platform.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {analyticsModules.map((module) => (
              <Link
                key={module.title}
                href={module.href}
                className="group rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-emerald-400/30 hover:bg-white/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <h4 className="text-lg font-bold text-white">
                    {module.title}
                  </h4>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-sm font-bold text-white ring-1 ring-white/10">
                    {module.count}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400 group-hover:text-slate-300">
                  {module.description}
                </p>
                <div className="mt-5 text-sm font-semibold text-emerald-300">
                  Open view →
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
          <h3 className="text-2xl font-bold tracking-tight text-white">
            Network signals
          </h3>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            Track the patterns that shape trust, growth, and repeat use.
          </p>

          <div className="mt-6 space-y-4">
            {networkSignals.map((signal) => (
              <div
                key={signal.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <p className="text-sm font-semibold text-white">
                  {signal.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {signal.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-white">
                Funnel performance
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Follow the path from discovery to completed booking.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {funnelSteps.map((step, index) => (
              <div
                key={step.step}
                className="rounded-3xl border border-white/10 bg-white/5 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Step {index + 1}
                    </p>
                    <h4 className="mt-2 text-lg font-bold text-white">
                      {step.step}
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {step.note}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-sm font-bold text-white ring-1 ring-white/10">
                    {step.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-white">
                Role performance
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Compare activity and growth across key user types.
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Role
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Users
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Growth
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Signal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-slate-950/40">
                  {rolePerformance.map((role) => (
                    <tr key={role.role} className="hover:bg-white/5">
                      <td className="px-5 py-4 text-sm font-semibold text-white">
                        {role.role}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-300">
                        {role.users}
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${growthClasses(
                            role.growth
                          )}`}
                        >
                          {role.growth}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-400">
                        {role.signal}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
            <p className="text-sm font-semibold text-white">Growth engine</p>
            <p className="mt-2 text-sm leading-7 text-emerald-50/90">
              Your sitemap defines SitGuru as a pet care network and business
              platform. This page is shaped to show the system-wide signals that
              drive that network effect.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}