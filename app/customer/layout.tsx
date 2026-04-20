import type { ReactNode } from "react";
import Link from "next/link";

import { logout } from "@/app/auth/actions";

export default function CustomerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_45%,#ecfdf5_100%)] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/customer/dashboard"
              className="inline-flex items-center rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-black tracking-tight text-slate-950 transition hover:bg-emerald-400"
            >
              SitGuru Customer
            </Link>

            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">
                Customer Portal
              </p>
              <p className="text-xs text-slate-500">
                Bookings, messages, pets, and profile
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            <Link
              href="/customer/dashboard"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Dashboard
            </Link>

            <Link
              href="/bookings"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Bookings
            </Link>

            <Link
              href="/messages"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Messages
            </Link>

            <Link
              href="/find-care"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Find Care
            </Link>

            <Link
              href="/search"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Search
            </Link>
          </nav>

          <form action={logout}>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-slate-50"
            >
              Log out
            </button>
          </form>
        </div>

        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
            <Link
              href="/customer/dashboard"
              className="whitespace-nowrap rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Dashboard
            </Link>

            <Link
              href="/bookings"
              className="whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Bookings
            </Link>

            <Link
              href="/messages"
              className="whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Messages
            </Link>

            <Link
              href="/find-care"
              className="whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Find Care
            </Link>

            <Link
              href="/search"
              className="whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Search
            </Link>
          </div>
        </div>
      </header>

      <div>{children}</div>
    </div>
  );
}