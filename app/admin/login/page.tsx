import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Lock, Mail, MessageCircle, PawPrint, ShieldCheck, Users } from "lucide-react";

type AdminLoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    status?: string;
  }>;
};

function getMessageText(value?: string) {
  if (!value) return "";

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const params = await searchParams;
  const errorMessage = getMessageText(params?.error);
  const statusMessage = getMessageText(params?.status);

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8f4] text-slate-950">
      <div className="absolute left-0 top-0 h-[420px] w-[420px] rounded-full bg-emerald-100/70 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-[480px] w-[480px] rounded-full bg-sky-100/70 blur-3xl" />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center rounded-2xl transition hover:opacity-90"
          aria-label="Back to SitGuru homepage"
        >
          <Image
            src="/images/sitguru-logo-cropped.png"
            alt="SitGuru"
            width={320}
            height={132}
            priority
            className="h-auto w-[140px]"
          />
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Homepage
        </Link>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-112px)] max-w-7xl place-items-center px-5 py-10 sm:px-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[2.25rem] border border-emerald-100 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.13)] lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.24),_transparent_34%),linear-gradient(135deg,#064e3b_0%,#047857_55%,#065f46_100%)] p-8 text-white sm:p-10">
            <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />

            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black text-white shadow-sm backdrop-blur">
                <ShieldCheck className="h-4 w-4" />
                SitGuru Admin
              </span>

              <h1 className="mt-8 max-w-sm text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl">
                Welcome back.
              </h1>

              <p className="mt-5 max-w-md text-base font-bold leading-7 text-white/90">
                Sign in to manage SitGuru operations, bookings, messages, Gurus,
                customers, partners, referrals, and platform activity.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <PawPrint className="h-6 w-6 text-emerald-100" />
                  <p className="mt-3 text-sm font-black text-white">Gurus</p>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <MessageCircle className="h-6 w-6 text-emerald-100" />
                  <p className="mt-3 text-sm font-black text-white">Messages</p>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <Users className="h-6 w-6 text-emerald-100" />
                  <p className="mt-3 text-sm font-black text-white">Partners</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 sm:p-10 lg:p-12">
            <div className="mx-auto max-w-md">
              <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-900">
                Admin Login
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
                Sign in to Admin
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                Use your SitGuru Admin credentials to continue.
              </p>

              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-900">
                SERVER FORM LOGIN ACTIVE — this page does not need browser
                JavaScript to submit.
              </div>

              <form
                noValidate
                action="/api/admin/login"
                method="post"
                className="mt-8 space-y-5"
              >
                <div>
                  <label
                    htmlFor="admin-email"
                    className="mb-2 block text-sm font-black text-slate-800"
                  >
                    Email
                  </label>

                  <div className="flex items-center rounded-2xl border border-emerald-100 bg-[#eef6ff] px-4 py-3 shadow-sm focus-within:border-emerald-300 focus-within:ring-4 focus-within:ring-emerald-100">
                    <Mail className="h-5 w-5 shrink-0 text-slate-400" />

                    <input
                      id="admin-email"
                      name="email"
                      type="text"
                      defaultValue="admin@sitguru.com"
                      autoComplete="username"
                      className="ml-3 w-full bg-transparent text-base font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                      placeholder="admin@sitguru.com"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="admin-password"
                    className="mb-2 block text-sm font-black text-slate-800"
                  >
                    Password
                  </label>

                  <div className="flex items-center rounded-2xl border border-emerald-100 bg-[#eef6ff] px-4 py-3 shadow-sm focus-within:border-emerald-300 focus-within:ring-4 focus-within:ring-emerald-100">
                    <Lock className="h-5 w-5 shrink-0 text-slate-400" />

                    <input
                      id="admin-password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      className="ml-3 w-full bg-transparent text-base font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                      placeholder="Enter password"
                    />
                  </div>
                </div>

                {statusMessage ? (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                    {statusMessage}
                  </div>
                ) : null}

                {errorMessage ? (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {errorMessage}
                  </div>
                ) : null}

                <button
                  type="submit"
                  className="flex w-full items-center justify-center rounded-2xl bg-green-800 px-5 py-4 text-base font-black text-white shadow-[0_12px_30px_rgba(22,101,52,0.22)] transition hover:bg-green-900"
                >
                  Sign In
                </button>
              </form>

              <div className="mt-6 flex flex-col gap-3 text-sm font-bold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href="/"
                  className="text-green-800 transition hover:text-green-900"
                >
                  Back to Homepage
                </Link>

                <Link
                  href="/forgot-password"
                  className="text-slate-500 transition hover:text-green-800"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  MFA Enforcement
                </p>
                <p className="mt-1 text-sm font-semibold leading-6 text-emerald-900">
                  Admin accounts with a verified MFA factor are redirected to
                  the authenticator challenge before entering the dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}