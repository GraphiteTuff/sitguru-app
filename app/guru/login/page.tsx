import Link from "next/link";
import { login } from "@/app/auth/actions";

export default function GuruLoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-8 md:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-2xl backdrop-blur md:grid-cols-2">
          <div className="flex flex-col justify-between border-b border-white/10 bg-gradient-to-br from-sky-600 via-sky-500 to-cyan-400 p-8 md:border-b-0 md:border-r">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/80">
                SitGuru Pro
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-white">
                Guru Login
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/90">
                Access your guru dashboard, manage bookings, respond to messages,
                update availability, and grow your business on SitGuru.
              </p>
            </div>

            <div className="mt-8 grid gap-4">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm font-medium text-white">Manage bookings</p>
                <p className="mt-1 text-sm text-white/80">
                  Stay on top of pending, active, and completed services.
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm font-medium text-white">Message customers</p>
                <p className="mt-1 text-sm text-white/80">
                  Keep customer communication organized and professional.
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm font-medium text-white">Track earnings</p>
                <p className="mt-1 text-sm text-white/80">
                  Review activity, performance, and payout-related information.
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-10">
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Sign in to your guru account.
              </p>
            </div>

            <form action={login} className="mt-8 space-y-5">
              <input type="hidden" name="next" value="/guru/dashboard" />

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-200"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="guru@sitguru.com"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-sky-400"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-200"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-sky-400"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <Link
                  href="/forgot-password"
                  className="text-slate-300 transition hover:text-white"
                >
                  Forgot password?
                </Link>

                <Link
                  href="/signup?accountType=guru"
                  className="text-sky-300 transition hover:text-sky-200"
                >
                  Become a Guru
                </Link>
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
              >
                Sign In to Guru Portal
              </button>
            </form>

            <div className="mt-8 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <p className="text-sm text-slate-300">
                Need customer access instead?
              </p>
              <Link
                href="/login"
                className="mt-2 inline-flex text-sm font-medium text-sky-300 transition hover:text-sky-200"
              >
                Go to customer login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}