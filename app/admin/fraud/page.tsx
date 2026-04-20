import Link from "next/link";

const riskSummary = [
  {
    label: "High Risk Alerts",
    value: "12",
    change: "+3 today",
    tone:
      "border-red-200 bg-gradient-to-br from-red-50 via-white to-red-100 text-red-700",
  },
  {
    label: "Bookings Under Review",
    value: "28",
    change: "8 urgent",
    tone:
      "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-100 text-amber-700",
  },
  {
    label: "Payment Holds",
    value: "$4,820",
    change: "Needs verification",
    tone:
      "border-violet-200 bg-gradient-to-br from-violet-50 via-white to-violet-100 text-violet-700",
  },
  {
    label: "Resolved This Week",
    value: "41",
    change: "92% within SLA",
    tone:
      "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-100 text-emerald-700",
  },
];

const flaggedBookings = [
  {
    id: "BK-2048",
    customer: "Jessica Moore",
    guru: "Maria Thompson",
    service: "Overnight Sitting",
    risk: "High",
    issue: "Last-minute booking + IP mismatch",
    status: "Pending Review",
  },
  {
    id: "BK-2041",
    customer: "Brian Chen",
    guru: "David Ellis",
    service: "Dog Walking",
    risk: "Medium",
    issue: "Repeated declined cards",
    status: "Monitoring",
  },
  {
    id: "BK-2037",
    customer: "Ashley Rivera",
    guru: "Tina Brooks",
    service: "Drop-In Visit",
    risk: "High",
    issue: "Multiple accounts using same device",
    status: "Escalated",
  },
  {
    id: "BK-2029",
    customer: "Michael Scott",
    guru: "Lauren Hill",
    service: "Pet Taxi",
    risk: "Low",
    issue: "Address mismatch",
    status: "Needs Info",
  },
];

const payments = [
  {
    id: "PM-8841",
    amount: "$325.00",
    owner: "Customer Wallet",
    reason: "Chargeback opened",
    status: "Frozen",
  },
  {
    id: "PM-8836",
    amount: "$89.00",
    owner: "Guru Payout",
    reason: "Velocity check triggered",
    status: "Manual Review",
  },
  {
    id: "PM-8829",
    amount: "$540.00",
    owner: "Booking Payment",
    reason: "Billing country mismatch",
    status: "Hold",
  },
  {
    id: "PM-8821",
    amount: "$62.00",
    owner: "Customer Wallet",
    reason: "Card retried 5x",
    status: "Investigating",
  },
];

const accounts = [
  {
    name: "Sophia Bennett",
    type: "Guru",
    joined: "Apr 11, 2026",
    signal: "ID pending / payout profile incomplete",
    score: "78",
  },
  {
    name: "Noah Patel",
    type: "Pet Owner",
    joined: "Apr 10, 2026",
    signal: "3 failed payment methods",
    score: "71",
  },
  {
    name: "Ava Walker",
    type: "Guru",
    joined: "Apr 9, 2026",
    signal: "Duplicate phone / duplicate device",
    score: "91",
  },
  {
    name: "Liam Foster",
    type: "Pet Owner",
    joined: "Apr 8, 2026",
    signal: "Promo abuse pattern",
    score: "68",
  },
];

const disputes = [
  {
    caseId: "DS-301",
    bookingId: "BK-2048",
    amount: "$325.00",
    reason: "Service not received",
    deadline: "Apr 15",
    status: "Respond Now",
  },
  {
    caseId: "DS-298",
    bookingId: "BK-2032",
    amount: "$145.00",
    reason: "Fraudulent transaction",
    deadline: "Apr 17",
    status: "Evidence Needed",
  },
  {
    caseId: "DS-294",
    bookingId: "BK-2017",
    amount: "$79.00",
    reason: "Duplicate charge",
    deadline: "Apr 19",
    status: "In Review",
  },
];

function getRiskStyle(risk: string) {
  switch (risk) {
    case "High":
      return "bg-red-100 text-red-700 ring-red-200";
    case "Medium":
      return "bg-amber-100 text-amber-700 ring-amber-200";
    default:
      return "bg-emerald-100 text-emerald-700 ring-emerald-200";
  }
}

function getStatusStyle(status: string) {
  if (
    status.includes("Escalated") ||
    status.includes("Frozen") ||
    status.includes("Respond Now")
  ) {
    return "bg-red-100 text-red-700 ring-red-200";
  }

  if (
    status.includes("Pending") ||
    status.includes("Manual") ||
    status.includes("Hold") ||
    status.includes("Evidence") ||
    status.includes("Monitoring")
  ) {
    return "bg-amber-100 text-amber-700 ring-amber-200";
  }

  return "bg-sky-100 text-sky-700 ring-sky-200";
}

export default function AdminFraudPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
      <section className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-700">
              Trust & Safety Command
            </p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
              Fraud Monitoring
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
              Monitor suspicious behavior across bookings, accounts, payments,
              chargebacks, and platform trust signals so SitGuru stays safe,
              premium, and dependable.
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
              href="/admin/users"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              Users
            </Link>
            <Link
              href="/admin/bookings"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              Bookings
            </Link>
            <button className="rounded-2xl border border-red-200 bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-md">
              Export Report
            </button>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {riskSummary.map((item) => (
            <div
              key={item.label}
              className={`rounded-3xl border p-5 shadow-sm ${item.tone}`}
            >
              <p className="text-sm font-semibold">{item.label}</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <h2 className="text-3xl font-black tracking-tight">
                  {item.value}
                </h2>
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold ring-1 ring-black/5">
                  {item.change}
                </span>
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Flagged Bookings
                </h2>
                <p className="text-sm text-slate-500">
                  Highest-priority activity needing admin review.
                </p>
              </div>
              <button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                View All Cases
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.16em] text-slate-500">
                    <th className="px-3 py-3">Booking</th>
                    <th className="px-3 py-3">Customer</th>
                    <th className="px-3 py-3">Guru</th>
                    <th className="px-3 py-3">Issue</th>
                    <th className="px-3 py-3">Risk</th>
                    <th className="px-3 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {flaggedBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="border-b border-slate-100 text-sm text-slate-700 hover:bg-slate-50/80"
                    >
                      <td className="px-3 py-4">
                        <div className="font-semibold text-slate-900">
                          {booking.id}
                        </div>
                        <div className="text-xs text-slate-500">
                          {booking.service}
                        </div>
                      </td>
                      <td className="px-3 py-4">{booking.customer}</td>
                      <td className="px-3 py-4">{booking.guru}</td>
                      <td className="px-3 py-4">{booking.issue}</td>
                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${getRiskStyle(
                            booking.risk
                          )}`}
                        >
                          {booking.risk}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${getStatusStyle(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
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
                Response Actions
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Fast controls for urgent trust operations.
              </p>

              <div className="mt-5 grid gap-3">
                <button className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700">
                  Freeze Suspicious Payouts
                </button>
                <button className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-600">
                  Require Identity Review
                </button>
                <button className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Escalate to Compliance
                </button>
                <button className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  Download Audit Log
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                Trust Score Pulse
              </p>
              <h3 className="mt-3 text-4xl font-black tracking-tight">84%</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Platform trust health is strong, but booking fraud signals and
                chargeback pressure increased in the last 24 hours.
              </p>

              <div className="mt-5 space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                    <span>Booking Integrity</span>
                    <span>88%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div className="h-2 w-[88%] rounded-full bg-white" />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                    <span>Payment Confidence</span>
                    <span>73%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div className="h-2 w-[73%] rounded-full bg-white" />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                    <span>Account Authenticity</span>
                    <span>91%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div className="h-2 w-[91%] rounded-full bg-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-900">
                Suspicious Payments
              </h2>
              <p className="text-sm text-slate-500">
                Holds, freezes, payout checks, and retry behavior.
              </p>
            </div>

            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900">
                          {payment.id}
                        </h3>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${getStatusStyle(
                            payment.status
                          )}`}
                        >
                          {payment.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {payment.owner} • {payment.reason}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-lg font-black text-slate-900">
                        {payment.amount}
                      </p>
                      <p className="text-xs text-slate-500">At-risk volume</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-900">
                Account Review Queue
              </h2>
              <p className="text-sm text-slate-500">
                Profiles with elevated trust score concerns.
              </p>
            </div>

            <div className="space-y-4">
              {accounts.map((account) => (
                <div
                  key={account.name}
                  className="rounded-2xl border border-slate-200 p-4 transition hover:border-slate-300 hover:shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {account.name}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {account.type} • Joined {account.joined}
                      </p>
                      <p className="mt-2 text-sm text-slate-700">
                        {account.signal}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-slate-900 px-4 py-3 text-center text-white">
                        <div className="text-2xl font-black">
                          {account.score}
                        </div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-slate-300">
                          Risk
                        </div>
                      </div>
                      <button className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Disputes & Chargebacks
              </h2>
              <p className="text-sm text-slate-500">
                Protect revenue and respond before deadlines.
              </p>
            </div>
            <button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Open Disputes Center
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {disputes.map((item) => (
              <div
                key={item.caseId}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {item.caseId}
                    </p>
                    <h3 className="mt-2 text-lg font-bold text-slate-900">
                      {item.amount}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Booking {item.bookingId}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${getStatusStyle(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-700">
                  <p>
                    <span className="font-semibold text-slate-900">Reason:</span>{" "}
                    {item.reason}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">
                      Deadline:
                    </span>{" "}
                    {item.deadline}
                  </p>
                </div>

                <button className="mt-5 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Respond to Case
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}