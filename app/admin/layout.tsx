import "@/app/platform-dark.css";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

const adminNav = [
  { label: "Overview", href: "/admin" },
  { label: "Users", href: "/admin/users" },
  { label: "Guru Approvals", href: "/admin/guru-approvals" },
  { label: "Vendor Approvals", href: "/admin/vendor-approvals" },
  { label: "Bookings", href: "/admin/bookings" },
  { label: "Payments", href: "/admin/payments" },
  { label: "Disputes", href: "/admin/disputes" },
  { label: "Support", href: "/admin/support" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "Fraud Detection", href: "/admin/fraud" },
  { label: "Moderation", href: "/admin/moderation" },
];

function AdminLogo({
  href = "/admin",
  size = "large",
}: {
  href?: string;
  size?: "small" | "large";
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center"
      aria-label="Go to SitGuru admin home"
    >
      <Image
        src="/images/sitguru-logo-dark-transparent.png"
        alt="SitGuru"
        width={320}
        height={132}
        priority={size === "large"}
        className={
          size === "large"
            ? "h-auto w-[185px] sm:w-[220px]"
            : "h-auto w-[145px] sm:w-[170px]"
        }
      />
    </Link>
  );
}

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="platform-dark-surface min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-[290px_1fr]">
        <aside className="border-b border-white/10 bg-slate-950/95 lg:border-b-0 lg:border-r lg:border-white/10">
          <div className="sticky top-0 flex h-full flex-col">
            <div className="border-b border-white/10 px-6 py-6">
              <AdminLogo href="/admin" size="large" />

              <div className="mt-5">
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
                  SitGuru HQ
                </div>
                <div className="mt-2 text-2xl font-black tracking-tight text-white">
                  Admin Control
                </div>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Trusted Pet Care. Simplified.
              </p>
            </div>

            <div className="px-4 py-5">
              <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                  Platform view
                </p>
                <p className="mt-2 text-sm leading-6 text-emerald-50/90">
                  Oversee users, approvals, bookings, payments, disputes, and
                  growth from one clean operations hub.
                </p>
              </div>
            </div>

            <nav className="flex-1 px-4 pb-6">
              <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                HQ Modules
              </div>

              <div className="space-y-1.5">
                {adminNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
                  >
                    <span>{item.label}</span>
                    <span className="text-slate-600 transition group-hover:text-slate-300">
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </nav>

            <div className="border-t border-white/10 p-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">
                  Growth Engine
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  SitGuru is built as a pet care network and business platform,
                  not just a sitter marketplace.
                </p>
                <Link
                  href="/"
                  className="mt-4 inline-flex rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                >
                  Back to site
                </Link>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
            <div className="flex flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div className="flex items-center gap-4">
                <div className="lg:hidden">
                  <AdminLogo href="/admin" size="small" />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                    SitGuru Admin
                  </p>
                  <h1 className="mt-1 text-2xl font-black tracking-tight text-white">
                    Platform Operations
                  </h1>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/admin/guru-approvals"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Review Gurus
                </Link>
                <Link
                  href="/admin/bookings"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Open Bookings
                </Link>
                <Link
                  href="/admin/analytics"
                  className="rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                >
                  View Analytics
                </Link>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>

          <footer className="border-t border-white/10 bg-slate-950/90 px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-3">
                <AdminLogo href="/admin" size="small" />
                <p className="text-sm text-slate-400">
                  Trusted Pet Care. Simplified.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                <Link href="/admin" className="transition hover:text-white">
                  Admin Home
                </Link>
                <Link
                  href="/admin/bookings"
                  className="transition hover:text-white"
                >
                  Bookings
                </Link>
                <Link
                  href="/admin/support"
                  className="transition hover:text-white"
                >
                  Support
                </Link>
                <Link href="/" className="transition hover:text-white">
                  Main Site
                </Link>
                <span className="text-slate-500">
                  © {new Date().getFullYear()} SitGuru
                </span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}