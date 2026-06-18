"use client";

import Link from "next/link";
import { Suspense, useCallback, useMemo, useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useSearchParams } from "next/navigation";

import { login } from "@/app/auth/actions";
import PhoneCodeLogin from "@/components/auth/PhoneCodeLogin";
import TurnstileWidget from "@/components/TurnstileWidget";

type LoginMethod = "phone" | "email";
type LoginAudience = "one" | "pet_parent" | "guru" | "ambassador";

function decodeMessage(value: string | null) {
  if (!value) return "";

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getRequestedAudience(value?: string | null): LoginAudience {
  const normalized = String(value || "").trim().toLowerCase();

  if (
    normalized === "guru" ||
    normalized === "future_guru" ||
    normalized === "provider"
  ) {
    return "guru";
  }

  if (
    normalized === "ambassador" ||
    normalized === "ambassadors" ||
    normalized === "rep" ||
    normalized === "representative"
  ) {
    return "ambassador";
  }

  if (
    normalized === "customer" ||
    normalized === "pet_parent" ||
    normalized === "pet-parent" ||
    normalized === "parent"
  ) {
    return "pet_parent";
  }

  return "one";
}

function getRequestedMode(value?: string | null): LoginMethod {
  const normalized = String(value || "").trim().toLowerCase();

  if (
    normalized === "email" ||
    normalized === "password" ||
    normalized === "mail"
  ) {
    return "email";
  }

  return "phone";
}

function getDefaultDashboardForAudience(audience: LoginAudience) {
  if (audience === "guru") return "/login/route?preferred=guru";
  if (audience === "ambassador") return "/login/route?preferred=ambassador";
  if (audience === "pet_parent") return "/login/route?preferred=pet_parent";
  return "/login/route";
}

function getSafeNextPath(nextValue: string | null, audience: LoginAudience) {
  const fallback = getDefaultDashboardForAudience(audience);

  if (!nextValue) return fallback;

  try {
    const decoded = decodeURIComponent(nextValue).trim();

    if (!decoded.startsWith("/")) return fallback;
    if (decoded.startsWith("//")) return fallback;
    if (decoded.includes("://")) return fallback;
    if (decoded.startsWith("/admin")) return fallback;

    return decoded;
  } catch {
    return fallback;
  }
}

function getAudienceLabel(audience: LoginAudience) {
  if (audience === "guru") return "Guru";
  if (audience === "ambassador") return "Ambassador";
  if (audience === "pet_parent") return "Pet Parent";
  return "SitGuru One";
}

function getPhoneAccessLabel(audience: LoginAudience) {
  if (audience === "guru") return "Guru account";
  if (audience === "ambassador") return "Ambassador account";
  if (audience === "pet_parent") return "Pet Parent account";
  return "Existing SitGuru account";
}

function getEmailTurnstileAction(audience: LoginAudience) {
  if (audience === "guru") return "guru_email_login";
  if (audience === "ambassador") return "ambassador_email_login";
  if (audience === "pet_parent") return "pet_parent_email_login";
  return "sitguru_one_email_login";
}

function LoginPageContent() {
  const searchParams = useSearchParams();

  const requestedAudience = useMemo(
    () => getRequestedAudience(searchParams.get("role")),
    [searchParams],
  );

  const requestedMode = useMemo(
    () => getRequestedMode(searchParams.get("mode")),
    [searchParams],
  );

  const nextPath = useMemo(() => {
    return getSafeNextPath(
      searchParams.get("next") || searchParams.get("redirect"),
      requestedAudience,
    );
  }, [requestedAudience, searchParams]);

  const [loginMethod, setLoginMethod] = useState<LoginMethod>(requestedMode);
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  const errorMessage = decodeMessage(searchParams.get("error"));
  const audienceLabel = getAudienceLabel(requestedAudience);
  const phoneAccessLabel = getPhoneAccessLabel(requestedAudience);

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken("");
    setTurnstileResetKey((value) => value + 1);
  }, []);

  const handleTurnstileError = useCallback(() => {
    setTurnstileToken("");
  }, []);

  function switchLoginMethod(method: LoginMethod) {
    setLoginMethod(method);
    setTurnstileToken("");
    setTurnstileResetKey((value) => value + 1);
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fffb_0%,#effaf3_56%,#ffffff_100%)] px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto mb-5 flex w-full max-w-5xl items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-2 text-xs font-black text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50 sm:text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>

        <Link
          href="/admin/login"
          className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 shadow-sm transition hover:bg-slate-50 sm:inline-flex"
        >
          Admin Login
        </Link>
      </div>

      <div className="mx-auto grid w-full max-w-5xl gap-5 lg:min-h-[78vh] lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
        <section className="hidden rounded-[2rem] border border-emerald-100 bg-white/90 p-7 shadow-[0_20px_55px_rgba(15,23,42,0.07)] lg:block">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
            <Sparkles className="h-4 w-4" />
            SitGuru One Access
          </div>

          <h1 className="mt-5 text-4xl font-black leading-[1.03] tracking-[-0.055em] text-slate-950 xl:text-5xl">
            One login for every dashboard.
          </h1>

          <p className="mt-4 text-base font-semibold leading-7 text-slate-700">
            Log in once and move between Pet Parent, Guru, and Ambassador tools
            without hunting for separate pages.
          </p>

          <div className="mt-6 grid gap-3">
            {[
              ["Pet Parent", "Book care and manage pets."],
              ["Guru", "Manage services, bookings, and messages."],
              ["Ambassador", "Track referrals, training, and outreach."],
            ].map(([title, description]) => (
              <div
                key={title}
                className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3"
              >
                <p className="text-sm font-black text-slate-950">{title}</p>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-[0_22px_60px_rgba(15,23,42,0.08)] sm:p-7 lg:p-8">
          <div className="text-center sm:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-xs font-black text-emerald-800">
              <UsersRound className="h-4 w-4" />
              {audienceLabel} Access
            </div>

            <h2 className="mt-4 text-4xl font-black leading-[0.98] tracking-[-0.055em] text-slate-950 sm:text-5xl">
              Log in or join.
            </h2>

            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600 sm:text-base">
              Use one SitGuru account for Pet Parent, Guru, and Ambassador dashboards.
            </p>
          </div>

          {errorMessage ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {errorMessage}
            </div>
          ) : null}

          {nextPath !== getDefaultDashboardForAudience(requestedAudience) ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-800">
              After login, we’ll return you to where you left off.
            </div>
          ) : null}

          <div className="mt-6 grid gap-2 rounded-[1.35rem] border border-emerald-100 bg-emerald-50 p-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => switchLoginMethod("phone")}
              className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
                loginMethod === "phone"
                  ? "bg-white text-emerald-800 shadow-sm ring-1 ring-emerald-100"
                  : "text-slate-600 hover:bg-white/70 hover:text-slate-950"
              }`}
            >
              <Phone className="h-4 w-4" />
              Phone
            </button>

            <button
              type="button"
              onClick={() => switchLoginMethod("email")}
              className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
                loginMethod === "email"
                  ? "bg-white text-emerald-800 shadow-sm ring-1 ring-emerald-100"
                  : "text-slate-600 hover:bg-white/70 hover:text-slate-950"
              }`}
            >
              <Mail className="h-4 w-4" />
              Email
            </button>
          </div>

          {loginMethod === "phone" ? (
            requestedAudience === "ambassador" ? (
              <div className="mt-5 rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5">
                <p className="text-lg font-black text-slate-950">
                  Ambassador login
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  Ambassador phone login is moving into the unified login flow.
                  Use the Ambassador portal for now.
                </p>
                <Link
                  href="/ambassador/login"
                  className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800"
                >
                  Open Ambassador Login
                </Link>
              </div>
            ) : (
              <div className="mt-5">
                <PhoneCodeLogin
                  role={requestedAudience === "guru" ? "guru" : "customer"}
                  nextPath={nextPath}
                  heading="Continue with phone"
                  description="We’ll text you a secure 6-digit code."
                  submitLabel="Send code"
                  verifyLabel="Verify & continue"
                  accessLabel={phoneAccessLabel}
                  compact
                />
              </div>
            )
          ) : (
            <form action={login} className="mt-5 space-y-4">
              <input type="hidden" name="next" value={nextPath} />
              <input
                type="hidden"
                name="turnstileToken"
                value={turnstileToken}
              />

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-black text-slate-900"
                >
                  Email
                </label>

                <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100">
                  <Mail className="h-5 w-5 shrink-0 text-emerald-700" />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@sitguru.com"
                    className="ml-3 w-full bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-black text-slate-900"
                >
                  Password
                </label>

                <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100">
                  <Lock className="h-5 w-5 shrink-0 text-emerald-700" />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="ml-3 w-full bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="ml-3 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-emerald-700 transition hover:bg-emerald-50 hover:text-green-900"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <TurnstileWidget
                action={getEmailTurnstileAction(requestedAudience)}
                resetKey={turnstileResetKey}
                onVerify={handleTurnstileVerify}
                onExpire={handleTurnstileExpire}
                onError={handleTurnstileError}
              />

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <Link
                  href="/forgot-password"
                  className="font-bold text-slate-700 transition hover:text-slate-950 hover:underline"
                >
                  Forgot password?
                </Link>

                <button
                  type="button"
                  onClick={() => switchLoginMethod("phone")}
                  className="font-black text-emerald-700 transition hover:text-emerald-800 hover:underline"
                >
                  Use phone instead
                </button>
              </div>

              <button
                type="submit"
                disabled={!turnstileToken}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
              >
                {turnstileToken ? "Log in with email" : "Complete secure check"}
              </button>
            </form>
          )}

          <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4">
            <p className="text-sm font-black text-slate-950">
              Multiple roles? No problem.
            </p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
              After login, SitGuru will take you to the right dashboard. Account
              switching comes next.
            </p>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <Link
              href="/signup?role=pet_parent&next=/customer/dashboard"
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-xs font-black text-emerald-800 transition hover:bg-emerald-100"
            >
              Become a Pet Parent
            </Link>

            <Link
              href="/become-a-guru"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-xs font-black text-slate-800 transition hover:border-emerald-200 hover:bg-emerald-50"
            >
              Become a Guru
            </Link>

            <Link
              href="/ambassadors"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-xs font-black text-slate-800 transition hover:border-emerald-200 hover:bg-emerald-50"
            >
              Become an Ambassador
            </Link>
          </div>

          <Link
            href="/admin/login"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl text-xs font-black text-slate-500 transition hover:text-slate-800 sm:hidden"
          >
            <ShieldCheck className="h-4 w-4" />
            Admin Login
          </Link>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
