import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  Mail,
  PawPrint,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

type AmbassadorLoginPageProps = {
  searchParams?: SearchParams;
};

type AmbassadorLoginRecord = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  contact_email?: string | null;
  login_email?: string | null;
  login_username?: string | null;
  referral_code?: string | null;
  dashboard_enabled?: boolean | null;
  login_enabled?: boolean | null;
  dashboard_slug?: string | null;
  status?: string | null;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getSearchParam(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  key: string,
) {
  const value = searchParams?.[key];

  if (Array.isArray(value)) return value[0] || "";

  return value || "";
}

function normalizeAmbassadorCode(value: string) {
  return value.trim().toUpperCase();
}

function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    process.env.VERCEL_URL ||
    "https://www.sitguru.com";

  if (configuredUrl.startsWith("http://") || configuredUrl.startsWith("https://")) {
    return configuredUrl.replace(/\/+$/, "");
  }

  return `https://${configuredUrl.replace(/\/+$/, "")}`;
}

function getLoginErrorMessage(errorCode: string) {
  if (errorCode === "missing") {
    return "Enter your Ambassador Code and password to continue.";
  }

  if (errorCode === "not_found") {
    return "We could not find an active Ambassador dashboard for that code or email.";
  }

  if (errorCode === "not_enabled") {
    return "This Ambassador login is not enabled yet. Please contact SitGuru support.";
  }

  if (errorCode === "missing_email") {
    return "This Ambassador record does not have a login email yet. Please contact SitGuru support.";
  }

  if (errorCode === "invalid") {
    return "The Ambassador Code or password was incorrect. Please try again.";
  }

  if (errorCode === "restricted") {
    return "This login is restricted to the Ambassador portal only.";
  }

  if (errorCode === "reset_missing") {
    return "Enter your Ambassador Code so we can send your password setup link.";
  }

  if (errorCode === "reset_failed") {
    return "We could not send the password setup link. Please contact SitGuru support.";
  }

  return "";
}

function getSuccessMessage(successCode: string) {
  if (successCode === "reset_sent") {
    return "Password setup link sent. Please check the email connected to your Ambassador dashboard.";
  }

  return "";
}

async function findAmbassadorByIdentifier(identifier: string) {
  const rawIdentifier = identifier.trim();
  const normalizedCode = normalizeAmbassadorCode(rawIdentifier);
  const normalizedEmail = rawIdentifier.toLowerCase();

  const { data: codeMatch, error: codeError } = await supabaseAdmin
    .from("ambassadors")
    .select(
      "id, full_name, email, contact_email, login_email, login_username, referral_code, dashboard_enabled, login_enabled, dashboard_slug, status",
    )
    .or(
      `login_username.eq.${normalizedCode},referral_code.eq.${normalizedCode}`,
    )
    .maybeSingle();

  if (codeError) {
    console.warn("Ambassador code lookup failed:", codeError);
  }

  if (codeMatch) return codeMatch as AmbassadorLoginRecord;

  const { data: emailMatch, error: emailError } = await supabaseAdmin
    .from("ambassadors")
    .select(
      "id, full_name, email, contact_email, login_email, login_username, referral_code, dashboard_enabled, login_enabled, dashboard_slug, status",
    )
    .or(
      `login_email.eq.${normalizedEmail},contact_email.eq.${normalizedEmail},email.eq.${normalizedEmail}`,
    )
    .maybeSingle();

  if (emailError) {
    console.warn("Ambassador email lookup failed:", emailError);
  }

  return (emailMatch || null) as AmbassadorLoginRecord | null;
}

function getAmbassadorLoginEmail(ambassador: AmbassadorLoginRecord) {
  return (
    asString(ambassador.login_email) ||
    asString(ambassador.email) ||
    asString(ambassador.contact_email)
  );
}

function isAmbassadorAllowedToLogin(ambassador: AmbassadorLoginRecord) {
  const status = asString(ambassador.status).toLowerCase();

  return Boolean(
    ambassador.dashboard_enabled === true &&
      ambassador.login_enabled === true &&
      status !== "archived",
  );
}

async function ambassadorLoginAction(formData: FormData) {
  "use server";

  const ambassadorCode = asString(formData.get("ambassador_code"));
  const password = asString(formData.get("password"));

  if (!ambassadorCode || !password) {
    redirect("/ambassador/login?error=missing");
  }

  const ambassador = await findAmbassadorByIdentifier(ambassadorCode);

  if (!ambassador) {
    redirect("/ambassador/login?error=not_found");
  }

  if (!ambassador.dashboard_enabled || asString(ambassador.status).toLowerCase() === "archived") {
    redirect("/ambassador/login?error=not_found");
  }

  if (!ambassador.login_enabled) {
    redirect("/ambassador/login?error=not_enabled");
  }

  const loginEmail = getAmbassadorLoginEmail(ambassador);

  if (!loginEmail) {
    redirect("/ambassador/login?error=missing_email");
  }

  const supabase = await createClient();

  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

  if (signInError || !signInData.user) {
    console.warn("Ambassador sign-in failed:", signInError);
    redirect("/ambassador/login?error=invalid");
  }

  const userId = signInData.user.id;
  const now = new Date().toISOString();

  await supabaseAdmin
    .from("ambassadors")
    .update({
      user_id: userId,
      last_login_at: now,
      updated_at: now,
    })
    .eq("id", ambassador.id);

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, email, role")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    await supabaseAdmin.from("profiles").insert({
      id: userId,
      email: loginEmail,
      full_name: asString(ambassador.full_name) || null,
      role: "ambassador",
      created_at: now,
    });
  } else if (asString(profile.role).toLowerCase() !== "ambassador") {
    await supabaseAdmin
      .from("profiles")
      .update({
        role: "ambassador",
      })
      .eq("id", userId);
  }

  redirect("/ambassador/dashboard");
}

async function ambassadorPasswordResetAction(formData: FormData) {
  "use server";

  const ambassadorCode = asString(formData.get("reset_ambassador_code"));

  if (!ambassadorCode) {
    redirect("/ambassador/login?error=reset_missing#password-help");
  }

  const ambassador = await findAmbassadorByIdentifier(ambassadorCode);

  if (!ambassador || !isAmbassadorAllowedToLogin(ambassador)) {
    redirect("/ambassador/login?error=not_found#password-help");
  }

  const loginEmail = getAmbassadorLoginEmail(ambassador);

  if (!loginEmail) {
    redirect("/ambassador/login?error=missing_email#password-help");
  }

  const supabase = await createClient();
  const redirectTo = `${getSiteUrl()}/reset-password?type=ambassador`;

  const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, {
    redirectTo,
  });

  if (error) {
    console.warn("Ambassador password reset failed:", error);
    redirect("/ambassador/login?error=reset_failed#password-help");
  }

  await supabaseAdmin
    .from("ambassadors")
    .update({
      invited_at: new Date().toISOString(),
      must_reset_password: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ambassador.id);

  redirect("/ambassador/login?success=reset_sent#password-help");
}

export default async function AmbassadorLoginPage({
  searchParams,
}: AmbassadorLoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const errorCode = getSearchParam(resolvedSearchParams, "error");
  const successCode = getSearchParam(resolvedSearchParams, "success");
  const errorMessage = getLoginErrorMessage(errorCode);
  const successMessage = getSuccessMessage(successCode);

  return (
    <main className="min-h-[100svh] bg-[#f8fbf6] px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-6xl items-center justify-center sm:min-h-[calc(100svh-4rem)]">
        <div className="grid w-full gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1fr)] lg:items-center lg:gap-6">
          <section className="order-2 rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:rounded-[32px] sm:p-8 lg:order-1">
            <Link
              href="/"
              className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-full border border-green-100 bg-green-50 px-4 py-2 text-xs font-black text-green-900 transition hover:bg-green-100 sm:mb-8 sm:text-sm"
            >
              ← Back to SitGuru
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-3xl bg-green-800 text-white sm:h-14 sm:w-14">
                <PawPrint size={26} />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-green-700 sm:text-xs">
                  SitGuru Student Ambassador
                </p>
                <h1 className="text-2xl font-black tracking-tight text-green-950 sm:text-5xl">
                  Ambassador Login
                </h1>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-slate-600 sm:mt-5 sm:text-base sm:leading-7">
              Sign in with your Ambassador Code and private password to view
              your referral dashboard, signup links, training progress, and
              rewards activity.
            </p>

            <div className="mt-5 grid gap-3 sm:mt-8">
              <InfoRow
                icon={<BadgeCheck size={18} />}
                title="Your username is your Ambassador Code"
                detail="Example: SKYLER-SG2026, JIZZELLE-SG2026, or AIZEN-SG2026."
              />
              <InfoRow
                icon={<ShieldCheck size={18} />}
                title="Ambassador-only access"
                detail="This login is separate from Pet Parent, Guru, and Admin access."
              />
              <InfoRow
                icon={<LockKeyhole size={18} />}
                title="Private dashboard"
                detail="Only your approved Ambassador dashboard should load after login."
              />
            </div>
          </section>

          <section className="order-1 rounded-[28px] border border-[#dfe9e2] bg-white p-5 shadow-lg shadow-green-950/5 sm:rounded-[32px] sm:p-8 lg:order-2">
            <div className="mb-5 text-center sm:mb-6 sm:text-left">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-800 sm:mx-0">
                <UserRoundCheck size={24} />
              </div>
              <h2 className="text-2xl font-black text-slate-950">
                Sign in to your dashboard
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                Enter your Ambassador Code and the password you created during
                setup.
              </p>
            </div>

            {errorMessage ? (
              <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-800">
                {errorMessage}
              </div>
            ) : null}

            {successMessage ? (
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-bold leading-6 text-green-900">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                <span>{successMessage}</span>
              </div>
            ) : null}

            <form action={ambassadorLoginAction} className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Ambassador Code or Email
                </span>
                <div className="flex min-h-14 items-center gap-3 rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 transition focus-within:border-green-500 focus-within:ring-4 focus-within:ring-green-100">
                  <KeyRound size={18} className="shrink-0 text-slate-400" />
                  <input
                    name="ambassador_code"
                    placeholder="KAMERINCOX"
                    autoCapitalize="characters"
                    autoComplete="username"
                    className="w-full bg-transparent text-base font-black uppercase tracking-wide text-slate-900 outline-none placeholder:text-slate-400 sm:text-sm"
                  />
                </div>
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Password
                </span>
                <div className="flex min-h-14 items-center gap-3 rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 transition focus-within:border-green-500 focus-within:ring-4 focus-within:ring-green-100">
                  <LockKeyhole size={18} className="shrink-0 text-slate-400" />
                  <input
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full bg-transparent text-base font-bold text-slate-900 outline-none placeholder:text-slate-400 sm:text-sm"
                  />
                </div>
              </label>

              <button
                type="submit"
                className="mt-2 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900 active:scale-[0.99]"
              >
                Open Ambassador Dashboard
                <ArrowRight size={18} />
              </button>
            </form>

            <section
              id="password-help"
              className="mt-6 rounded-[24px] border border-green-100 bg-green-50 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-green-800 shadow-sm">
                  <Mail size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-black text-green-950">
                    Need to set up or reset your password?
                  </h3>
                  <p className="mt-1 text-xs font-bold leading-5 text-green-900/80">
                    Enter your Ambassador Code below and SitGuru will send a
                    secure password setup link to the email connected to your
                    Ambassador dashboard.
                  </p>
                </div>
              </div>

              <form action={ambassadorPasswordResetAction} className="mt-4 grid gap-3">
                <label className="grid gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-green-800">
                    Ambassador Code
                  </span>
                  <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-green-200 bg-white px-4 py-3 transition focus-within:border-green-500 focus-within:ring-4 focus-within:ring-green-100">
                    <KeyRound size={17} className="shrink-0 text-green-700" />
                    <input
                      name="reset_ambassador_code"
                      placeholder="KAMERINCOX"
                      autoCapitalize="characters"
                      autoComplete="username"
                      className="w-full bg-transparent text-sm font-black uppercase tracking-wide text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-100 active:scale-[0.99]"
                >
                  Send Password Setup Link
                  <ArrowRight size={17} />
                </button>
              </form>
            </section>

            <div className="mt-4 grid gap-2 text-center text-[11px] font-bold leading-5 text-slate-400 sm:text-left">
              <p>
                Ambassador portal access is separate from Pet Parent, Guru, and
                Admin access.
              </p>
              <p>Your session ends when your browser is fully closed.</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function InfoRow({
  icon,
  title,
  detail,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-green-100 bg-[#fbfcf9] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-800">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-green-950">{title}</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
            {detail}
          </p>
        </div>
      </div>
    </div>
  );
}