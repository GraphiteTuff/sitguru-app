import Link from "next/link";

const stats = [
  {
    label: "Total Users",
    value: "12,480",
    sub: "All accounts",
    tone:
      "border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100",
  },
  {
    label: "New This Week",
    value: "342",
    sub: "Growth momentum",
    tone:
      "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-100",
  },
  {
    label: "Verified Gurus",
    value: "1,284",
    sub: "Active professionals",
    tone:
      "border-violet-200 bg-gradient-to-br from-violet-50 via-white to-violet-100",
  },
  {
    label: "Accounts Flagged",
    value: "38",
    sub: "Trust monitoring",
    tone:
      "border-red-200 bg-gradient-to-br from-red-50 via-white to-red-100",
  },
];

const users = [
  {
    name: "Emily Carter",
    role: "Pet Owner",
    status: "Active",
    risk: "Low",
    joined: "Today",
  },
  {
    name: "Jordan Blake",
    role: "Guru",
    status: "Pending Approval",
    risk: "Medium",
    joined: "Today",
  },
  {
    name: "Dr. Mia Torres",
    role: "Medical Pro",
    status: "Verified",
    risk: "Low",
    joined: "Yesterday",
  },
  {
    name: "Paws & Co Supply",
    role: "Vendor",
    status: "Under Review",
    risk: "Medium",
    joined: "Yesterday",
  },
  {
    name: "Ava Walker",
    role: "Guru",
    status: "Active",
    risk: "High",
    joined: "2 days ago",
  },
];

function statusStyle(status: string) {
  if (status.includes("Active") || status.includes("Verified"))
    return "bg-emerald-100 text-emerald-700 ring-emerald-200";

  if (status.includes("Pending") || status.includes("Review"))
    return "bg-amber-100 text-amber-700 ring-amber-200";

  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function riskStyle(risk: string) {
  if (risk === "High") return "bg-red-100 text-red-700 ring-red-200";
  if (risk === "Medium") return "bg-amber-100 text-amber-700 ring-amber-200";
  return "bg-emerald-100 text-emerald-700 ring-emerald-200";
}

export default function AdminUsersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
      
      {/* HEADER */}
      <section className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          
          <div>
            <p className="mb-3 inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              User Management
            </p>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">
              Users & Roles
            </h1>
            <p className="mt-3 text-sm text-slate-600 max-w-xl">
              Manage all SitGuru accounts including customers, gurus, vendors,
              and internal staff with full trust visibility.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link href="/admin" className="btn">Overview</Link>
            <Link href="/admin/fraud" className="btn">Fraud</Link>
            <Link href="/admin/payments" className="btn">Payments</Link>
            <button className="btn-primary">Export Users</button>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">

        {/* STATS */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className={`rounded-3xl border p-5 shadow-sm ${s.tone}`}>
              <p className="text-sm font-semibold">{s.label}</p>
              <h2 className="mt-2 text-3xl font-black">{s.value}</h2>
              <p className="text-xs text-slate-500 mt-1">{s.sub}</p>
            </div>
          ))}
        </section>

        {/* MAIN GRID */}
        <section className="grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">

          {/* USERS TABLE */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-xl font-bold">User Activity</h2>
                <p className="text-sm text-slate-500">
                  Recent accounts and trust signals
                </p>
              </div>
              <button className="btn">View All</button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="text-xs uppercase text-slate-500 border-b">
                    <th className="px-3 py-3">Name</th>
                    <th className="px-3 py-3">Role</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Risk</th>
                    <th className="px-3 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.name} className="border-b hover:bg-slate-50">
                      <td className="px-3 py-4 font-semibold">{u.name}</td>
                      <td className="px-3 py-4">{u.role}</td>
                      <td className="px-3 py-4">
                        <span className={`badge ${statusStyle(u.status)}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <span className={`badge ${riskStyle(u.risk)}`}>
                          {u.risk}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-slate-500">{u.joined}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ACTION PANEL */}
          <div className="space-y-6">

            <div className="card">
              <h3 className="title">Moderation Actions</h3>
              <p className="sub">
                Quickly manage user trust and platform integrity.
              </p>

              <div className="space-y-3 mt-4">
                <button className="btn-danger">Suspend Account</button>
                <button className="btn-warning">Require Verification</button>
                <button className="btn-dark">Escalate to Fraud Team</button>
              </div>
            </div>

            <div className="card-dark">
              <p className="label">User Health Score</p>
              <h3 className="score">89%</h3>
              <p className="sub-light">
                Strong growth with moderate fraud signals detected in new guru onboarding.
              </p>
            </div>

          </div>
        </section>

        {/* ROLE NAVIGATION */}
        <section className="grid gap-4 md:grid-cols-3">
          {[
            { title: "Pet Owners", href: "/admin/users/pet-owners" },
            { title: "Gurus", href: "/admin/gurus" },
            { title: "Vendors", href: "/admin/vendor-approvals" },
            { title: "Educators", href: "/admin/users/educators" },
            { title: "Medical Pros", href: "/admin/users/medical" },
            { title: "Admins", href: "/admin/users/admins" },
          ].map((r) => (
            <Link key={r.title} href={r.href} className="role-card">
              <h4>{r.title}</h4>
              <span>Manage →</span>
            </Link>
          ))}
        </section>

      </main>
    </div>
  );
}