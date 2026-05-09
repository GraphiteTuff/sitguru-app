import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { login } from "@/app/auth/actions";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    next?: string;
    redirect?: string;
    type?: string;
  }>;
};

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

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined;

  const rawNext = params?.next || params?.redirect || "";
  const nextPath = getSafeNextPath(rawNext);
  const errorMessage = params?.error ? decodeURIComponent(params.error) : "";

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fffb_0%,#effaf3_52%,#ffffff_100%)] px-4 py-8 md:px-6 lg:px-8">
      <div className="mx-auto mb-8 flex w-full max-w-6xl items-center justify-end">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-5 py-2.5 text-sm font-black !text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      <div className="mx-auto flex min-h-[76vh] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] md:p-10">
            <div className="inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-black uppercase tracking-[0.18em] !text-emerald-800">
              SitGuru Pet Parent Portal
            </div>

            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.03] tracking-[-0.05em] !text-slate-950 sm:text-5xl lg:text-6xl">
              Welcome back, Pet Parent.
            </h1>

            <p className="mt-5 max-w-2xl text-base font-semibold leading-8 !text-slate-700 sm:text-lg">
              Log in to book trusted pet care, manage pet details, message
              Gurus, save favorites, and keep your pet care plans organized.
            </p>

            <div className="mt-8 rounded-[1.75rem] border border-emerald-100 bg-emerald-50 p-5 sm:p-6">
              <div className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.18em] !text-emerald-800">
                Care made easier
              </div>

              <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.04em] !text-slate-950 sm:text-4xl">
                Find trusted Gurus and keep your pets cared for with more
                confidence.
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 !text-slate-700 sm:text-base">
                SitGuru helps Pet Parents stay connected to local care, organize
                pet details, and manage bookings in one clean, pet-friendly
                workspace.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                  <div className="text-2xl">🐾</div>
                  <h3 className="mt-3 text-sm font-black !text-slate-950">
                    Book care
                  </h3>
                  <p className="mt-1 text-xs font-semibold leading-5 !text-slate-600">
                    Find trusted pet care for walks, visits, sitting, boarding,
                    and more.
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                  <div className="text-2xl">💬</div>
                  <h3 className="mt-3 text-sm font-black !text-slate-950">
                    Message Gurus
                  </h3>
                  <p className="mt-1 text-xs font-semibold leading-5 !text-slate-600">
                    Stay connected with care notes, updates, and questions.
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                  <div className="text-2xl">💚</div>
                  <h3 className="mt-3 text-sm font-black !text-slate-950">
                    Save favorites
                  </h3>
                  <p className="mt-1 text-xs font-semibold leading-5 !text-slate-600">
                    Keep favorite Gurus and pet care details ready for next
                    time.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xl">🐶</div>
                <h3 className="mt-3 text-sm font-black !text-slate-950">
                  Pet profiles
                </h3>
                <p className="mt-1 text-xs font-semibold leading-5 !text-slate-600">
                  Keep pet routines, needs, and care info organized.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xl">📅</div>
                <h3 className="mt-3 text-sm font-black !text-slate-950">
                  Manage bookings
                </h3>
                <p className="mt-1 text-xs font-semibold leading-5 !text-slate-600">
                  Review upcoming care, requests, and booking details.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xl">🛡️</div>
                <h3 className="mt-3 text-sm font-black !text-slate-950">
                  Trusted care
                </h3>
                <p className="mt-1 text-xs font-semibold leading-5 !text-slate-600">
                  Connect with Gurus built around pet care support.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-emerald-100 bg-white p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] md:p-10">
            <div>
              <p className="inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-black !text-emerald-800">
                Pet Parent Login
              </p>

              <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] !text-slate-950 md:text-4xl">
                Welcome back
              </h2>

              <p className="mt-2 text-base font-semibold leading-7 !text-slate-700">
                Sign in to your Pet Parent account to book care, manage pets,
                message Gurus, and view your dashboard.
              </p>
            </div>

            {nextPath !== "/customer/dashboard" ? (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 !text-emerald-800">
                After login, we’ll return you to where you left off.
              </div>
            ) : null}

            {errorMessage ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <form action={login} className="mt-8 space-y-5">
              <input type="hidden" name="next" value={nextPath} />

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-black !text-slate-900"
                >
                  Email
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="petparent@sitguru.com"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold !text-slate-950 placeholder:!text-slate-400 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-black !text-slate-900"
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
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold !text-slate-950 placeholder:!text-slate-400 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <Link
                  href="/forgot-password"
                  className="font-bold !text-slate-700 transition hover:!text-slate-950 hover:underline"
                >
                  Forgot password?
                </Link>

                <Link
                  href={`/phone-login?next=${encodeURIComponent(nextPath)}`}
                  className="font-black !text-emerald-700 transition hover:!text-emerald-800 hover:underline"
                >
                  Log in with phone code
                </Link>
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-black !text-white shadow-[0_12px_24px_rgba(16,185,129,0.22)] transition hover:-translate-y-0.5 hover:bg-emerald-700"
              >
                Log in to Pet Parent Portal
              </button>
            </form>

            <div className="mt-8 rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
              <p className="text-sm font-black !text-slate-950">
                Want to offer pet care?
              </p>

              <p className="mt-2 text-sm font-semibold leading-6 !text-slate-700">
                Gurus can log in here to manage services, availability,
                bookings, messages, payouts, and earning opportunities.
              </p>

              <Link
                href="/guru/login"
                className="mt-4 inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-center text-sm font-black !text-emerald-700 shadow-sm ring-1 ring-emerald-200 transition hover:-translate-y-0.5 hover:bg-emerald-100"
              >
                Guru Login
              </Link>
            </div>

            <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold leading-6 !text-slate-700">
                New to SitGuru? Create a free account to book trusted pet care,
                save favorite Gurus, or begin your path as a Guru.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Link
                  href={`/signup?accountType=customer&next=${encodeURIComponent(
                    nextPath,
                  )}`}
                  className="inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-center text-sm font-black !text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700"
                >
                  Join free as a Pet Parent
                </Link>

                <Link
                  href="/signup?accountType=guru"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-center text-sm font-black !text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50"
                >
                  Join free as a Guru
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}