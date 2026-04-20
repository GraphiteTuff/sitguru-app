"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ShieldCheck, LockKeyhole, LayoutDashboard } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password;

      if (!cleanEmail || !cleanPassword) {
        setErrorMessage("Enter your admin email and password.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (error) {
        setErrorMessage(error.message || "Unable to sign in.");
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (error) {
      console.error("Admin login error:", error);
      setErrorMessage("Something went wrong while signing in.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black px-4 py-8 md:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-2xl backdrop-blur md:grid-cols-2">
          <div className="flex flex-col justify-between border-b border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-8 md:border-b-0 md:border-r">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">
                SitGuru HQ
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-white">
                Admin Login
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
                Secure access to platform operations, users, bookings, payouts,
                disputes, analytics, and reporting.
              </p>
            </div>

            <div className="mt-8 grid gap-4">
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-300" />
                  <p className="text-sm font-medium text-white">Platform oversight</p>
                </div>
                <p className="mt-2 text-sm text-slate-300">
                  Monitor gurus, customers, bookings, fraud signals, and trust operations.
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="h-5 w-5 text-sky-300" />
                  <p className="text-sm font-medium text-white">Financial controls</p>
                </div>
                <p className="mt-2 text-sm text-slate-300">
                  Review payouts, disputes, refunds, marketplace performance, and exports.
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <LockKeyhole className="h-5 w-5 text-violet-300" />
                  <p className="text-sm font-medium text-white">Restricted access</p>
                </div>
                <p className="mt-2 text-sm text-slate-300">
                  Intended for authorized SitGuru administrative staff only.
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-10">
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Secure admin access
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Sign in to the admin control center.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sitguru.com"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-400"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-400"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <Link
                  href="/forgot-password"
                  className="text-slate-300 transition hover:text-white"
                >
                  Forgot password?
                </Link>
              </div>

              {errorMessage ? (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
                  {errorMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Log in to Admin"
                )}
              </button>
            </form>

            <div className="mt-8 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <p className="text-sm text-slate-300">
                Need customer access instead?
              </p>
              <Link
                href="/login"
                className="mt-2 inline-flex text-sm font-medium text-emerald-300 transition hover:text-emerald-200"
              >
                Go to customer login
              </Link>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Admin route
              </p>
              <p className="mt-2 text-sm text-slate-200">
                After successful sign-in, this page redirects directly to
                <span className="ml-1 font-semibold text-white">/admin</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}