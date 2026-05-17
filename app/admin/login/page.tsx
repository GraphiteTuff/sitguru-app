import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Lock,
  Mail,
  MessageCircle,
  PawPrint,
  ShieldCheck,
  Users,
} from "lucide-react";

type AdminLoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    status?: string;
    next?: string;
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
    <main className="min-h-screen overflow-hidden bg-[#f3f8f5] px-3 py-4 text-slate-950 sm:px-5 sm:py-8 lg:px-8 lg:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center justify-center sm:min-h-[calc(100vh-4rem)]">
        <div className="grid w-full overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.12)] sm:rounded-[2rem] lg:grid-cols-[0.9fr_1.1fr]">
          <section className="bg-gradient-to-br from-green-950 via-emerald-800 to-emerald-600 p-5 text-white sm:p-8 lg:p-10">
            <div className="flex items-center justify-between gap-4">
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
                  className="h-auto w-[130px] rounded-xl bg-white/95 px-3 py-2 shadow-sm"
                />
              </Link>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black text-white shadow-sm backdrop-blur">
                <ShieldCheck className="h-4 w-4" />
                Admin
              </span>
            </div>

            <div className="mt-8 rounded-[1.5rem] bg-white/95 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur sm:mt-10 sm:rounded-[2rem] sm:p-7">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700 sm:text-xs">
                SitGuru Admin Access
              </p>

              <h1 className="mt-4 text-4xl font-black leading-[0.98] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Welcome back.
              </h1>

              <p className="mt-4 text-base font-bold leading-7 text-slate-700">
                Sign in to manage SitGuru operations, bookings, messages, Gurus,
                Pet Parents, partners, referrals, and platform activity.
              </p>
            </div>

            <div className="mt-5 grid gap-3 sm:mt-8 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <PawPrint className="h-6 w-6 text-emerald-100" />
                <p className="mt-3 text-sm font-black text-white">Gurus</p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <MessageCircle className="h-6 w-6 text-emerald-100" />
                <p className="mt-3 text-sm font-black text-white">Messages</p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <Users className="h-6 w-6 text-emerald-100" />
                <p className="mt-3 text-sm font-black text-white">Partners</p>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-white/15 bg-white/10 p-4 sm:mt-8 sm:p-5">
              <p className="text-sm font-black text-white">
                Super User access only.
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/85">
                Admin access is limited to approved SitGuru Super User accounts.
                For live-site safety, sign in only when you need to manage Admin.
              </p>
            </div>
          </section>

          <section className="p-5 sm:p-8 lg:p-12">
            <div className="mx-auto max-w-md">
              <div className="mb-6 flex items-center justify-between gap-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700 sm:text-xs sm:tracking-[0.28em]">
                  Admin Login
                </p>

                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-black text-green-900 transition hover:border-emerald-200 hover:bg-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Home
                </Link>
              </div>

              <h2 className="text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
                Sign in to Admin
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                Use your approved SitGuru Super User email and password to
                continue.
              </p>

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

                  <div className="flex items-center rounded-2xl border border-emerald-100 bg-[#eef6ff] px-4 py-3 shadow-sm transition focus-within:border-emerald-300 focus-within:ring-4 focus-within:ring-emerald-100">
                    <Mail className="h-5 w-5 shrink-0 text-slate-400" />

                    <input
                      id="admin-email"
                      name="email"
                      type="email"
                      autoComplete="username"
                      className="ml-3 w-full bg-transparent text-base font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                      placeholder="you@sitguru.com"
                      required
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

                  <div className="flex items-center rounded-2xl border border-emerald-100 bg-[#eef6ff] px-4 py-3 shadow-sm transition focus-within:border-emerald-300 focus-within:ring-4 focus-within:ring-emerald-100">
                    <Lock className="h-5 w-5 shrink-0 text-slate-400" />

                    <input
                      id="admin-password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      className="ml-3 w-full bg-transparent text-base font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                      placeholder="Enter password"
                      required
                    />
                  </div>
                </div>

                {statusMessage ? (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-800">
                    {statusMessage}
                  </div>
                ) : null}

                {errorMessage ? (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700">
                    {errorMessage}
                  </div>
                ) : null}

                <button
                  type="submit"
                  className="flex w-full items-center justify-center rounded-2xl bg-green-800 px-5 py-4 text-base font-black text-white shadow-[0_12px_30px_rgba(22,101,52,0.18)] transition hover:bg-green-900"
                >
                  Sign In
                </button>
              </form>

              <div className="mt-6 grid gap-3 text-sm font-bold sm:grid-cols-2">
                <Link
                  href="/"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-green-800 transition hover:border-emerald-200 hover:bg-emerald-50"
                >
                  Back to Homepage
                </Link>

                <Link
                  href="/forgot-password"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-green-800"
                >
                  Forgot Password?
                </Link>
              </div>

              <div className="mt-6 rounded-3xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-center">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  Simple. Secure. SitGuru-friendly.
                </p>

                <p className="mt-2 text-sm font-semibold leading-6 text-green-900">
                  Admin access is reserved for approved SitGuru Super Users.
                </p>

                <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                  For live-site safety, Admin should require a fresh sign-in
                  after leaving Admin or closing the browser.
                </p>
              </div>

              <p className="mt-5 text-center text-xs font-bold leading-5 text-slate-400">
                Need help? Contact{" "}
                <a
                  href="mailto:support@sitguru.com"
                  className="font-black text-green-800 hover:underline"
                >
                  support@sitguru.com
                </a>
                .
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}