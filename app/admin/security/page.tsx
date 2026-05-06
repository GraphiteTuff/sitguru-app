"use client";

import Link from "next/link";

const securityCards = [
  {
    title: "Multi-Factor Authentication",
    description:
      "Set up authenticator app protection for admin accounts using one-time codes.",
    href: "/admin/security/mfa",
    badge: "Recommended",
  },
  {
    title: "Admin Dashboard",
    description: "Return to the main admin dashboard.",
    href: "/admin",
    badge: "Navigation",
  },
];

export default function AdminSecurityPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin"
              className="text-sm font-bold text-emerald-700 hover:text-emerald-800"
            >
              ← Back to Admin
            </Link>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Security
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Manage admin account protection, authentication settings, and
              security controls.
            </p>
          </div>
        </div>

        <section className="grid gap-5 md:grid-cols-2">
          {securityCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                    {card.badge}
                  </p>

                  <h2 className="mt-3 text-xl font-black text-slate-950">
                    {card.title}
                  </h2>

                  <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                    {card.description}
                  </p>
                </div>

                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-black text-slate-500 group-hover:border-emerald-300 group-hover:text-emerald-700">
                  →
                </span>
              </div>
            </Link>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm font-bold uppercase tracking-wide text-amber-700">
            Admin Security Note
          </p>

          <h2 className="mt-2 text-xl font-black text-amber-950">
            MFA setup protects the signed-in admin account.
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-amber-800">
            For full enforcement, combine this page with server-side checks on
            sensitive admin routes and require elevated authentication before
            destructive actions.
          </p>
        </section>
      </div>
    </main>
  );
}