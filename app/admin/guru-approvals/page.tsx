import Link from "next/link";

const approvalStats = [
  {
    label: "Pending Reviews",
    value: "18",
    detail: "Applications waiting for approval",
  },
  {
    label: "Approved This Week",
    value: "42",
    detail: "New gurus cleared to go live",
  },
  {
    label: "Need Profile Updates",
    value: "7",
    detail: "Applicants missing key profile info",
  },
  {
    label: "Flagged for Review",
    value: "3",
    detail: "Requires trust or quality follow-up",
  },
];

const pipelineCards = [
  {
    title: "New Applications",
    count: "8",
    description:
      "Fresh guru signups that need initial review, identity checks, and profile validation.",
    href: "/admin/guru-approvals/new",
  },
  {
    title: "Credential Review",
    count: "5",
    description:
      "Applications awaiting experience, expertise, certification, or care background review.",
    href: "/admin/guru-approvals/credentials",
  },
  {
    title: "Profile Quality",
    count: "4",
    description:
      "Profiles that need better service descriptions, pricing clarity, or stronger public presentation.",
    href: "/admin/guru-approvals/profile-quality",
  },
  {
    title: "Ready to Approve",
    count: "6",
    description:
      "Guru profiles that look launch-ready and can move live after final approval.",
    href: "/admin/guru-approvals/ready",
  },
];

const pendingApplications = [
  {
    name: "Ava Morgan",
    specialty: "Dog Walking • Drop-In Visits",
    location: "Charlotte, NC",
    experience: "5 years",
    status: "Ready",
    joined: "Today",
  },
  {
    name: "Noah Bennett",
    specialty: "Overnight Care • Pet Sitting",
    location: "Tampa, FL",
    experience: "3 years",
    status: "Profile Update Needed",
    joined: "Today",
  },
  {
    name: "Sophia Reed",
    specialty: "Puppy Care • Training Support",
    location: "Austin, TX",
    experience: "6 years",
    status: "Credential Review",
    joined: "Yesterday",
  },
  {
    name: "Liam Parker",
    specialty: "Senior Pet Care • Medication Support",
    location: "Nashville, TN",
    experience: "4 years",
    status: "Flagged",
    joined: "Yesterday",
  },
  {
    name: "Emma Collins",
    specialty: "Cat Care • Drop-In Visits",
    location: "Atlanta, GA",
    experience: "2 years",
    status: "Ready",
    joined: "2 days ago",
  },
];

const reviewChecklist = [
  "Confirm profile quality and public-facing presentation",
  "Validate services, pricing, and availability setup",
  "Review specialties, expertise, and bio clarity",
  "Check trust signals, credentials, and account status",
  "Approve only profiles ready to convert customer trust",
];

function statusClasses(status: string) {
  switch (status) {
    case "Ready":
      return "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20";
    case "Credential Review":
      return "bg-blue-400/10 text-blue-300 ring-blue-400/20";
    case "Profile Update Needed":
      return "bg-amber-400/10 text-amber-300 ring-amber-400/20";
    case "Flagged":
      return "bg-rose-400/10 text-rose-300 ring-rose-400/20";
    default:
      return "bg-slate-400/10 text-slate-300 ring-slate-400/20";
  }
}

export default function AdminGuruApprovalsPage() {
  return (
    <main className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_24%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_24%),linear-gradient(180deg,#0f172a_0%,#020617_100%)] p-6 sm:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Guru Approvals
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Review and launch trusted SitGuru experts
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Approve high-quality guru profiles that are ready to build trust,
              convert customers, and strengthen the SitGuru care network.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/users"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              All users
            </Link>
            <Link
              href="/admin/moderation"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Moderation
            </Link>
            <Link
              href="/admin/analytics"
              className="rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Growth analytics
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {approvalStats.map((stat) => (
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
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-white">
                Approval pipeline
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Organize guru reviews by readiness and quality stage.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {pipelineCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-emerald-400/30 hover:bg-white/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <h4 className="text-lg font-bold text-white">{card.title}</h4>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-sm font-bold text-white ring-1 ring-white/10">
                    {card.count}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400 group-hover:text-slate-300">
                  {card.description}
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
            Review checklist
          </h3>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            Keep guru approvals aligned with quality, trust, and conversion.
          </p>

          <div className="mt-6 space-y-3">
            {reviewChecklist.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <p className="text-sm leading-6 text-slate-200">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
            <p className="text-sm font-semibold text-white">
              Why this matters
            </p>
            <p className="mt-2 text-sm leading-7 text-emerald-50/90">
              Guru quality is one of the strongest trust drivers in the SitGuru
              network. Better approvals lead to stronger profiles, better
              conversions, and better repeat bookings.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-white">
              Pending guru applications
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Prioritize approval decisions based on readiness and trust.
            </p>
          </div>

          <Link
            href="/admin/guru-approvals/all"
            className="text-sm font-semibold text-emerald-300 transition hover:text-emerald-200"
          >
            View full queue →
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Applicant
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Specialty
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Location
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Experience
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Status
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-slate-950/40">
                {pendingApplications.map((application) => (
                  <tr
                    key={`${application.name}-${application.joined}`}
                    className="hover:bg-white/5"
                  >
                    <td className="px-5 py-4 text-sm font-semibold text-white">
                      {application.name}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300">
                      {application.specialty}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-400">
                      {application.location}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-400">
                      {application.experience}
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClasses(
                          application.status
                        )}`}
                      >
                        {application.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-400">
                      {application.joined}
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