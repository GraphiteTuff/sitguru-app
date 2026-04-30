import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { login } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

type CustomerLoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    next?: string;
    redirect?: string;
  }>;
};

export const dynamic = "force-dynamic";

function getSafeNextPath(nextValue?: string) {
  const fallback = "/customer/dashboard";

  if (!nextValue) return fallback;

  try {
    const decoded = decodeURIComponent(nextValue).trim();

    if (!decoded.startsWith("/")) return fallback;
    if (decoded.startsWith("//")) return fallback;
    if (decoded.includes("://")) return fallback;

    return decoded;
  } catch {
    return fallback;
  }
}

export default async function CustomerLoginPage({
  searchParams,
}: CustomerLoginPageProps) {
  const supabase = await createClient();

  const params = searchParams ? await searchParams : undefined;

  const rawNext = params?.next || params?.redirect || "";
  const nextPath = getSafeNextPath(rawNext);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(nextPath);
  }

  const errorMessage = params?.error ? decodeURIComponent(params.error) : "";

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-emerald-50 px-4 py-8 md:px-6 lg:px-8">
      <div className="mx-auto mb-8 flex w-full max-w-6xl items-center justify-end">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-800 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      <div className="mx-auto flex min-h-[76vh] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl md:grid-cols-2">
          <div className="flex flex-col justify-between border-b border-slate-200 bg-gradient-to-br from-emerald-400 via-emerald-300 to-sky-200 p-8 md:border-b-0 md:border-r">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-900">
                SitGuru Customer
              </p>

              <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                Customer Login
              </h1>

              <p className="mt-4 max-w-md text-sm leading-6 text-slate-700">
                Log in to manage bookings, pet details, messages, and your
                dashboard in one easy place.
              </p>
            </div>

            <div className="mt-8 grid gap-4">
              <div className="rounded-2xl bg-white/70 p-4 backdrop-blur-sm">
                <p className="text-sm font-semibold text-slate-900">
                  🐾 Manage bookings
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  View upcoming services and care details.
                </p>
              </div>

              <div className="rounded-2xl bg-white/70 p-4 backdrop-blur-sm">
                <p className="text-sm font-semibold text-slate-900">
                  💬 Message your Guru
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  Stay connected with updates and notes.
                </p>
              </div>

              <div className="rounded-2xl bg-white/70 p-4 backdrop-blur-sm">
                <p className="text-sm font-semibold text-slate-900">
                  🐶 Keep pet info ready
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  Faster booking with saved pet profiles.
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-10">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 md:text-4xl">
                Welcome back
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                Sign in to your customer account.
              </p>
            </div>

            {nextPath !== "/customer/dashboard" ? (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold leading-6 text-emerald-800">
                After login, we’ll return you to where you left off.
              </div>
            ) : null}

            {errorMessage ? (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <form action={login} className="mt-8 space-y-5">
              <input type="hidden" name="next" value={nextPath} />

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700"
                >
                  Email
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="customer@sitguru.com"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
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
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <Link
                  href="/forgot-password"
                  className="text-emerald-700 hover:text-emerald-600"
                >
                  Forgot password?
                </Link>

                <Link
                  href={`/phone-login?next=${encodeURIComponent(nextPath)}`}
                  className="text-emerald-700 hover:text-emerald-600"
                >
                  Log in with phone code
                </Link>
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Log in to Customer Portal
              </button>
            </form>

            <div className="mt-8 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-sky-50 p-5">
              <p className="text-sm font-semibold text-slate-900">
                Want to earn with SitGuru?
              </p>

              <h3 className="mt-1 text-lg font-bold text-slate-900">
                Become a Guru Today 🚀
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                Set your own rates, manage your schedule, and grow your pet care
                business.
              </p>

              <Link
                href="/become-a-guru"
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
              >
                Start Your Guru Profile
              </Link>
            </div>

            <div className="mt-4 text-sm text-slate-600">
              Need guru access?{" "}
              <Link
                href="/guru/login"
                className="font-medium text-emerald-700 hover:text-emerald-600"
              >
                Go to guru login
              </Link>
            </div>

            <div className="mt-2 text-sm text-slate-600">
              Need an account?{" "}
              <Link
                href={`/signup?next=${encodeURIComponent(nextPath)}`}
                className="font-medium text-emerald-700 hover:text-emerald-600"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}