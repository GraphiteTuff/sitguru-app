import Link from "next/link";

const disputeStats = [
  {
    label: "Open Disputes",
    value: "14",
    detail: "Cases currently under HQ review",
  },
  {
    label: "Refund Requests",
    value: "9",
    detail: "Pending or in-progress refund decisions",
  },
  {
    label: "Resolved This Week",
    value: "22",
    detail: "Closed cases with final outcomes",
  },
  {
    label: "Urgent Escalations",
    value: "3",
    detail: "High-priority trust or service issues",
  },
];

const disputeQueues = [
  {
    title: "Service Complaints",
    count: "6",
    description:
      "Customer concerns related to care quality, missed expectations, or service delivery.",
    href: "/admin/disputes/service-complaints",
  },
  {
    title: "Refund Reviews",
    count: "9",
    description:
      "Cases tied to payment reversals, partial refunds, or booking-related financial review.",
    href: "/admin/payments/refunds",
  },
  {
    title: "No-Show / Cancellation Issues",
    count: "4",
    description:
      "Late cancellations, missed services, or no-show activity needing final review.",
    href: "/admin/bookings/issues",
  },
  {
    title: "Trust & Safety Escalations",
    count: "3",
    description:
      "Higher-risk incidents involving platform trust, abuse reports, or unusual case handling.",
    href: "/admin/fraud",
  },
];

const activeDisputes = [
  {
    id: "DP-3104",
    booking: "BK-20465",
    customer: "Daniel Brooks",
    guru: "Liam Parker",
    issue: "Customer reported incomplete pet sitting visit",
    status: "Urgent",
    opened: "Today",
  },
  {
    id: "DP-3099",
    booking: "BK-20458",
    customer: "Olivia Torres",
    guru: "Sophia Reed",
    issue: "Refund request after canceled training session",
    status: "Refund Review",
    opened: "Today",
  },
  {
    id: "DP-3092",
    booking: "BK-20440",
    customer: "Mia Sanders",
    guru: "Noah Bennett",
    issue: "Late arrival complaint for overnight care",
    status: "Investigating",
    opened: "Yesterday",
  },
  {
    id: "DP-3088",
    booking: "BK-20417",
    customer: "Ethan Long",
    guru: "Emma Collins",
    issue: "Disagreement over service completion details",
    status: "Pending Response",
    opened: "Yesterday",
  },
  {
    id: "DP-3079",
    booking: "BK-20396",
    customer: "Harper Green",
    guru: "Ava Morgan",
    issue: "Customer requested goodwill refund after walk ended early",
    status: "Reviewing",
    opened: "2 days ago",
  },
];

const resolutionChecklist = [
  "Verify booking, payment, and message history before action",
  "Review both customer and guru account context",
  "Assess refund eligibility and service outcome evidence",
  "Escalate trust or abuse concerns immediately",
  "Close cases with a clear outcome and support follow-up",
];

function statusClasses(status: string) {
  switch (status) {
    case "Urgent":
      return "bg-rose-400/10 text-rose-300 ring-rose-400/20";
    case "Refund Review":
      return "bg-amber-400/10 text-amber-300 ring-amber-400/20";
    case "Investigating":
      return "bg-blue-400/10 text-blue-300 ring-blue-400/20";
    case "Pending Response":
      return "bg-violet-400/10 text-violet-300 ring-violet-400/20";
    case "Reviewing":
      return "bg-slate-400/10 text-slate-300 ring-slate-400/20";
    default:
      return "bg-slate-400/10 text-slate-300 ring-slate-400/20";
  }
}

export default function AdminDisputesPage() {
  return (
    <main className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.14),transparent_24%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_24%),linear-gradient(180deg,#0f172a_0%,#020617_100%)] p-6 sm:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-rose-400/25 bg-rose-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-rose-300">
              Disputes
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Resolve platform issues with trust and speed
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Review booking issues, refund requests, service complaints, and
              trust-related escalations from one HQ dispute center.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/bookings"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Bookings
            </Link>
            <Link
              href="/admin/payments"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Payments
            </Link>
            <Link
              href="/admin/support"
              className="rounded-2xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-400"
            >
              Support queue
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {disputeStats.map((stat) => (
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
              Dispute queues
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Organize cases by type, urgency, and outcome path.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {disputeQueues.map((queue) => (
              <Link
                key={queue.title}
                href={queue.href}
                className="group rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-rose-400/30 hover:bg-white/10"
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
                <div className="mt-5 text-sm font-semibold text-rose-300">
                  Open queue →
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
          <h3 className="text-2xl font-bold tracking-tight text-white">
            Resolution checklist
          </h3>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            Keep dispute handling fair, consistent, and easy to track.
          </p>

          <div className="mt-6 space-y-3">
            {resolutionChecklist.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <p className="text-sm leading-6 text-slate-200">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-3xl border border-rose-400/20 bg-rose-400/10 p-5">
            <p className="text-sm font-semibold text-white">Trust focus</p>
            <p className="mt-2 text-sm leading-7 text-rose-50/90">
              Disputes sit at the intersection of bookings, payments, customer
              experience, and platform safety. Strong resolution workflows help
              protect trust on both sides of the network.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-white">
              Active dispute cases
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Snapshot of current booking and payment-related issues.
            </p>
          </div>

          <Link
            href="/admin/disputes/all"
            className="text-sm font-semibold text-rose-300 transition hover:text-rose-200"
          >
            View full case list →
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Dispute ID
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Booking
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Customer
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Guru
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Issue
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
                {activeDisputes.map((dispute) => (
                  <tr key={dispute.id} className="hover:bg-white/5">
                    <td className="px-5 py-4 text-sm font-semibold text-white">
                      {dispute.id}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300">
                      {dispute.booking}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300">
                      {dispute.customer}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300">
                      {dispute.guru}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-400">
                      {dispute.issue}
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClasses(
                          dispute.status
                        )}`}
                      >
                        {dispute.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-400">
                      {dispute.opened}
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