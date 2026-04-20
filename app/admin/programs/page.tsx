import Link from "next/link";

export default function AdminProgramsPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
            Admin / Programs
          </p>
          <h1 className="mt-3 text-4xl font-black">Programs</h1>
          <p className="mt-3 text-slate-300">
            Manage structured growth programs for hiring, partnerships, and
            community outreach.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Veterans Program", href: "/admin/programs/veterans" },
            { label: "Student Hire Program", href: "/admin/programs/student-hire" },
            { label: "Minority Hire Program", href: "/admin/programs/minority-hire" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-lg font-semibold">{item.label}</span>
                <span className="text-emerald-300">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}