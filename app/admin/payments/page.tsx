import Link from "next/link";

const paymentStats = [
  {
    label: "Gross Volume",
    value: "$128,420",
    subtext: "+12.4% vs last 30 days",
    tone:
      "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-100 text-emerald-700",
  },
  {
    label: "Guru Payouts Pending",
    value: "$18,640",
    subtext: "42 transfers queued",
    tone:
      "border-violet-200 bg-gradient-to-br from-violet-50 via-white to-violet-100 text-violet-700",
  },
  {
    label: "Refund Volume",
    value: "$2,180",
    subtext: "9 active refund cases",
    tone:
      "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-100 text-amber-700",
  },
  {
    label: "Disputes Open",
    value: "6",
    subtext: "2 urgent responses due",
    tone:
      "border-red-200 bg-gradient-to-br from-red-50 via-white to-red-100 text-red-700",
  },
];

const recentTransactions = [
  {
    id: "TX-84219",
    user: "Jessica Moore",
    type: "Booking Payment",
    amount: "$325.00",
    method: "Visa •••• 2241",
    status: "Succeeded",
    time: "Today, 2:14 PM",
  },
  {
    id: "TX-84211",
    user: "Brian Chen",
    type: "Refund",
    amount: "$89.00",
    method: "Original payment method",
    status: "Processing",
    time: "Today, 12:42 PM",
  },
  {
    id: "TX-84203",
    user: "Maria Thompson",
    type: "Guru Payout",
    amount: "$410.00",
    method: "Bank Transfer",
    status: "Pending",
    time: "Today, 10:08 AM",
  },
  {
    id: "TX-84197",
    user: "Ashley Rivera",
    type: "Booking Payment",
    amount: "$145.00",
    method: "Mastercard •••• 1008",
    status: "Failed",
    time: "Today, 8:55 AM",
  },
  {
    id: "TX-84182",
    user: "Lauren Hill",
    type: "Guru Payout",
    amount: "$520.00",
    method: "Instant Payout",
    status: "Under Review",
    time: "Yesterday, 6:20 PM",
  },
];

const payoutsQueue = [
  {
    guru: "Maria Thompson",
    amount: "$1,280.00",
    jobs: "8 completed bookings",
    method: "Bank Transfer",
    status: "Ready",
  },
  {
    guru: "David Ellis",
    amount: "$940.00",
    jobs: "6 completed bookings",
    method: "Bank Transfer",
    status: "Pending Review",
  },
  {
    guru: "Lauren Hill",
    amount: "$520.00",
    jobs: "3 completed bookings",
    method: "Instant Payout",
    status: "On Hold",
  },
  {
    guru: "Tina Brooks",
    amount: "$1,740.00",
    jobs: "10 completed bookings",
    method: "Bank Transfer",
    status: "Ready",
  },
];

const disputes = [
  {
    id: "DP-301",
    booking: "BK-2048",
    customer: "Jessica Moore",
    amount: "$325.00",
    reason: "Service not received",
    deadline: "Apr 15",
    status: "Respond Now",
  },
  {
    id: "DP-298",
    booking: "BK-2032",
    customer: "Michael Scott",
    amount: "$145.00",
    reason: "Fraudulent transaction",
    deadline: "Apr 17",
    status: "Evidence Needed",
  },
  {
    id: "DP-294",
    booking: "BK-2017",
    customer: "Noah Patel",
    amount: "$79.00",
    reason: "Duplicate charge",
    deadline: "Apr 19",
    status: "In Review",
  },
];

function getStatusStyle(status: string) {
  if (
    status.includes("Failed") ||
    status.includes("On Hold") ||
    status.includes("Respond Now")
  ) {
    return "bg-red-100 text-red-700 ring-red-200";
  }

  if (
    status.includes("Pending") ||
    status.includes("Processing") ||
    status.includes("Evidence") ||
    status.includes("Under Review")
  ) {
    return "bg-amber-100 text-amber-700 ring-amber-200";
  }

  if (status.includes("Ready") || status.includes("Succeeded")) {
    return "bg-emerald-100 text-emerald-700 ring-emerald-200";
  }

  return "bg-sky-100 text-sky-700 ring-sky-200";
}

export default function AdminPaymentsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
      <section className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Financial Operations
            </p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
              Payments Dashboard
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
              Monitor booking payments, refunds, payout queues, disputes, and
              overall platform revenue from one premium SitGuru HQ control
              center.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Link
              href="/admin"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              Overview
            </Link>
            <Link
              href="/admin/fraud"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              Fraud
            </Link>
            <Link
              href="/admin/bookings"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              Bookings
            </Link>
            <button className="rounded-2xl border border-emerald-200 bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md">
              Export Payments
            </button>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {paymentStats.map((item) => (
            <div
              key={item.label}
              className={`rounded-3xl border p-5 shadow-sm ${item.tone}`}
            >
              <p className="text-sm font-semibold">{item.label}</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <h2 className="text-3xl font-black tracking-tight">
                  {item.value}
                </h2>
              </div>
              <p className="mt-3 text-xs font-semibold opacity-90">
                {item.subtext}
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Recent Transactions
                </h2>
                <p className="text-sm text-slate-500">
                  Live money movement across the SitGuru platform.
                </p>
              </div>
              <button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                View Ledger
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.16em] text-slate-500">
                    <th className="px-3 py-3">Transaction</th>
                    <th className="px-3 py-3">User</th>
                    <th className="px-3 py-3">Method</th>
                    <th className="px-3 py-3">Amount</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-slate-100 text-sm text-slate-700 hover:bg-slate-50/80"
                    >
                      <td className="px-3 py-4">
                        <div className="font-semibold text-slate-900">
                          {tx.id}
                        </div>
                        <div className="text-xs text-slate-500">{tx.type}</div>
                      </td>
                      <td className="px-3 py-4">{tx.user}</td>
                      <td className="px-3 py-4">{tx.method}</td>
                      <td className="px-3 py-4 font-semibold text-slate-900">
                        {tx.amount}
                      </td>
                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${getStatusStyle(
                            tx.status
                          )}`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-xs text-slate-500">
                        {tx.time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                Quick Actions
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Admin controls for payment operations.
              </p>

              <div className="mt-5 grid gap-3">
                <button className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Release Approved Payouts
                </button>
                <button className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-600">
                  Review Held Transactions
                </button>
                <button className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700">
                  Open Disputes Queue
                </button>
                <button className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  Download Settlement Report
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                Revenue Health
              </p>
              <h3 className="mt-3 text-4xl font-black tracking-tight">
                $24,610
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                Net platform revenue over the current reporting period.
              </p>

              <div className="mt-5 space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                    <span>Successful Collections</span>
                    <span>91%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div className="h-2 w-[91%] rounded-full bg-white" />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                    <span>Payout Completion</span>
                    <span>84%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div className="h-2 w-[84%] rounded-full bg-white" />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                    <span>Dispute Control</span>
                    <span>78%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div className="h-2 w-[78%] rounded-full bg-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Guru Payout Queue
                </h2>
                <p className="text-sm text-slate-500">
                  Pending transfers to SitGuru professionals.
                </p>
              </div>
              <button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                Review All
              </button>
            </div>

            <div className="space-y-4">
              {payoutsQueue.map((payout) => (
                <div
                  key={payout.guru}
                  className="rounded-2xl border border-slate-200 p-4 transition hover:border-slate-300 hover:shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {payout.guru}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {payout.jobs} • {payout.method}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-black text-slate-900">
                          {payout.amount}
                        </p>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${getStatusStyle(
                            payout.status
                          )}`}
                        >
                          {payout.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Refunds & Disputes
                </h2>
                <p className="text-sm text-slate-500">
                  Revenue protection and payment issue handling.
                </p>
              </div>
              <button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                Open Cases
              </button>
            </div>

            <div className="space-y-4">
              {disputes.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900">{item.id}</h3>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${getStatusStyle(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {item.customer} • Booking {item.booking}
                      </p>
                      <p className="mt-2 text-sm text-slate-700">
                        {item.reason}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-lg font-black text-slate-900">
                        {item.amount}
                      </p>
                      <p className="text-xs text-slate-500">
                        Deadline {item.deadline}
                      </p>
                    </div>
                  </div>

                  <button className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                    Review Case
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}