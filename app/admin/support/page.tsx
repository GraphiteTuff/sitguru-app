import Link from "next/link";

const supportStats = [
  {
    label: "Open Tickets",
    value: "23",
    detail: "Currently awaiting response or resolution",
  },
  {
    label: "Urgent Issues",
    value: "5",
    detail: "High-priority cases needing fast action",
  },
  {
    label: "Resolved Today",
    value: "18",
    detail: "Tickets closed across customer and guru support",
  },
  {
    label: "Avg Response Time",
    value: "14m",
    detail: "Current first-response benchmark",
  },
];

const supportQueues = [
  {
    title: "Customer Support",
    count: "11",
    description:
      "Help requests from pet owners related to bookings, payments, messaging, and account access.",
    href: "/admin/support/customers",
  },
  {
    title: "Guru Support",
    count: "7",
    description:
      "Guru questions related to onboarding, profile setup, bookings, payouts, and platform tools.",
    href: "/admin/support/gurus",
  },
  {
    title: "Platform Issues",
    count: "3",
    description:
      "Reports involving bugs, broken flows, dashboard issues, or technical platform friction.",
    href: "/admin/support/platform",
  },
  {
    title: "Escalated Cases",
    count: "5",
    description:
      "Tickets linked to disputes, payments, moderation, or higher-priority trust review.",
    href: "/admin/disputes",
  },
];

const supportTickets = [
  {
    id: "TK-11842",
    user: "Emily Carter",
    role: "Pet Owner",
    subject: "Unable to message guru after booking request",
    priority: "High",
    status: "Open",
    opened: "Today • 2:14 PM",
  },
  {
    id: "TK-11837",
    user: "Noah Bennett",
    role: "Guru",
    subject: "Payout timing question for completed service",
    priority: "Normal",
    status: "Awaiting Reply",
    opened: "Today • 12:48 PM",
  },
  {
    id: "TK-11831",
    user: "Paws & Co Supply",
    role: "Vendor",
    subject: "Dashboard inventory count not updating",
    priority: "High",
    status: "Investigating",
    opened: "Today • 10:06 AM",
  },
  {
    id: "TK-11825",
    user: "Sophia Reed",
    role: "Guru",
    subject: "Profile photo upload failed during setup",
    priority: "Normal",
    status: "Open",
    opened: "Yesterday • 6:22 PM",
  },
  {
    id: "TK-11818",
    user: "Daniel Brooks",
    role: "Pet Owner",
    subject: "Refund follow-up on canceled booking",
    priority: "Urgent",
    status: "Escalated",
    opened: "Yesterday • 2:41 PM",
  },
];

const supportChecklist = [
  "Triage tickets by urgency, role, and platform impact",
  "Connect disputes, payments, and booking context when needed",
  "Route technical issues to the right system owner quickly",
  "Keep response times fast and outcomes clearly documented",
  "Protect trust with consistent, visible support operations",
];

function priorityClasses(priority: string) {
  switch (priority) {
    case "Urgent":
      return "bg-rose-400/10 text-rose-300 ring-rose-400/20";
    case "High":
      return "bg-amber-400/10 text-amber-300 ring-amber-400/20";
    default:
      return "bg-slate-400/10 text-slate-300 ring-slate-400/20";
  }
}

function statusClasses(status: string) {
  switch (status) {
    case "Escalated":
      return "bg-rose-400/10 text-rose-300 ring-rose-400/20";
    case "Investigating":
      return "bg-blue-400/10 text-blue-300 ring-blue-400/20";
    case "Awaiting Reply":
      return "bg-violet-400/10 text-violet-300 ring-violet-400/20";
    case "Open":
      return "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20";
    default:
      return "bg-slate-400/10 text-slate-300 ring-slate-400/20";
  }
}

export default function AdminSupportPage() {
  return (
    <main className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_24%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_24%),linear-gradient(180deg,#0f172a_0%,#020617_100%)] p-6 sm:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Support Tickets
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Keep SitGuru support fast, clear, and trusted
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Manage customer, guru, vendor, and platform support from one HQ
              help center built to protect response speed and trust.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/disputes"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Disputes
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
          {supportStats.map((stat) => (
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

      <section className="grid gap-8 xl:grid-cols-[1.25fr_0.85fr]">
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-white">
              Support queues
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Organize incoming support by role, issue type, and escalation path.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {supportQueues.map((queue) => (
              <Link
                key={queue.title}
                href={queue.href}
                className="group rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-emerald-400/30 hover:bg-white/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <h4 className="text-lg font-bold text-white">{queue.title}</h4>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-sm font-bold text-white ring-1 ring-white/10">
                    {queue.count}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400 group-hover:text-slate-300">
                  {queue.description}
                </p>
                <div className="mt-5 text-sm font-semibold text-emerald-300">
                  Open queue →
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
          <h3 className="text-2xl font-bold tracking-tight text-white">
            Support checklist
          </h3>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            Keep response quality high while moving issues through the right path.
          </p>

          <div className="mt-6 space-y-3">
            {supportChecklist.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <p className="text-sm leading-6 text-slate-200">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
            <p className="text-sm font-semibold text-white">Operations focus</p>
            <p className="mt-2 text-sm leading-7 text-emerald-50/90">
              Support is one of the clearest trust signals on a platform like
              SitGuru. Strong support operations reinforce customer confidence
              and help gurus stay productive.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-white">
              Recent support tickets
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Snapshot of active support conversations across the platform.
            </p>
          </div>

          <Link
            href="/admin/support/all"
            className="text-sm font-semibold text-emerald-300 transition hover:text-emerald-200"
          >
            View full ticket list →
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Ticket ID
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    User
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Role
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Subject
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Priority
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Status
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Opened
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-slate-950/40">
                {supportTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-white/5">
                    <td className="px-5 py-4 text-sm font-semibold text-white">
                      {ticket.id}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300">
                      {ticket.user}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-400">
                      {ticket.role}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300">
                      {ticket.subject}
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${priorityClasses(
                          ticket.priority
                        )}`}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClasses(
                          ticket.status
                        )}`}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-400">
                      {ticket.opened}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}