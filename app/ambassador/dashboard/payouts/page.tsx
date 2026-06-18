import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  HelpCircle,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const STRIPE_API_BASE = "https://api.stripe.com/v1";
const GUIDE_IMAGE_PATH =
  "/images/ambassadors/sitguru-ambassador-stripe-setup-guide.png";

type AnyRow = Record<string, unknown>;

type AmbassadorRecord = {
  id: string;
  user_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  contact_email?: string | null;
  login_email?: string | null;
  referral_code?: string | null;
  stripe_account_id?: string | null;
  stripe_connect_account_id?: string | null;
  stripe_account_status?: string | null;
  stripe_onboarding_complete?: boolean | null;
  stripe_payouts_enabled?: boolean | null;
  payouts_enabled?: boolean | null;
  charges_enabled?: boolean | null;
};

type StripeAccountSummary = {
  id: string;
  detailsSubmitted: boolean;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  disabledReason: string;
  currentlyDue: string[];
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;

  const normalized = asString(value).toLowerCase();
  return ["true", "yes", "ready", "enabled", "complete", "completed"].includes(
    normalized,
  );
}

function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    process.env.VERCEL_URL ||
    "https://www.sitguru.com";

  if (
    configuredUrl.startsWith("http://") ||
    configuredUrl.startsWith("https://")
  ) {
    return configuredUrl.replace(/\/+$/, "");
  }

  return `https://${configuredUrl.replace(/\/+$/, "")}`;
}

function getStripeAccountId(ambassador: AmbassadorRecord | null) {
  if (!ambassador) return "";

  return (
    asString(ambassador.stripe_account_id) ||
    asString(ambassador.stripe_connect_account_id)
  );
}

async function getAmbassadorForUser(userId: string, email?: string | null) {
  const cleanEmail = asString(email).toLowerCase();

  const { data, error } = await supabaseAdmin
    .from("ambassadors")
    .select("*")
    .or(
      `user_id.eq.${userId},login_email.eq.${cleanEmail},contact_email.eq.${cleanEmail},email.eq.${cleanEmail}`,
    )
    .eq("dashboard_enabled", true)
    .eq("login_enabled", true)
    .neq("status", "archived")
    .maybeSingle();

  if (error || !data) return null;

  return data as AmbassadorRecord;
}

async function stripeRequest<T>({
  path,
  method = "GET",
  body,
}: {
  path: string;
  method?: "GET" | "POST";
  body?: URLSearchParams;
}) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    throw new Error("Stripe is not configured. Missing STRIPE_SECRET_KEY.");
  }

  const response = await fetch(`${STRIPE_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body,
    cache: "no-store",
  });

  const payload = (await response.json()) as T & {
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message || "Stripe request failed.");
  }

  return payload as T;
}

async function createStripeAccount({
  userEmail,
  ambassador,
}: {
  userEmail?: string | null;
  ambassador: AmbassadorRecord;
}) {
  const body = new URLSearchParams();
  body.set("type", "express");
  body.set("country", "US");
  body.set("business_type", "individual");
  body.set("capabilities[transfers][requested]", "true");
  body.set("metadata[ambassador_id]", ambassador.id);

  const email = asString(
    ambassador.email || ambassador.login_email || userEmail,
  );
  if (email) body.set("email", email);

  const account = await stripeRequest<{ id: string }>({
    path: "/accounts",
    method: "POST",
    body,
  });

  return account.id;
}

async function createStripeAccountLink(accountId: string) {
  const siteUrl = getSiteUrl();
  const body = new URLSearchParams();

  body.set("account", accountId);
  body.set(
    "refresh_url",
    `${siteUrl}/ambassador/dashboard/payouts?stripe=refresh`,
  );
  body.set(
    "return_url",
    `${siteUrl}/ambassador/dashboard/payouts?stripe=return`,
  );
  body.set("type", "account_onboarding");

  const accountLink = await stripeRequest<{ url: string }>({
    path: "/account_links",
    method: "POST",
    body,
  });

  return accountLink.url;
}

async function retrieveStripeAccount(accountId: string) {
  if (!accountId) return null;

  try {
    const account = await stripeRequest<{
      id: string;
      details_submitted?: boolean;
      payouts_enabled?: boolean;
      charges_enabled?: boolean;
      requirements?: {
        disabled_reason?: string | null;
        currently_due?: string[] | null;
      } | null;
    }>({
      path: `/accounts/${encodeURIComponent(accountId)}`,
    });

    return {
      id: account.id,
      detailsSubmitted: Boolean(account.details_submitted),
      payoutsEnabled: Boolean(account.payouts_enabled),
      chargesEnabled: Boolean(account.charges_enabled),
      disabledReason: asString(account.requirements?.disabled_reason),
      currentlyDue: Array.isArray(account.requirements?.currently_due)
        ? account.requirements?.currently_due || []
        : [],
    } satisfies StripeAccountSummary;
  } catch (error) {
    console.warn("Unable to retrieve Ambassador Stripe account:", error);
    return null;
  }
}

async function updateAmbassadorStripeFields({
  ambassadorId,
  accountId,
  account,
}: {
  ambassadorId: string;
  accountId: string;
  account?: StripeAccountSummary | null;
}) {
  const basePayload: AnyRow = {
    stripe_account_id: accountId,
    stripe_connect_account_id: accountId,
    stripe_account_status: account?.payoutsEnabled
      ? "payouts_enabled"
      : account?.detailsSubmitted
        ? "details_submitted"
        : "onboarding_started",
    stripe_onboarding_complete: Boolean(account?.detailsSubmitted),
    stripe_payouts_enabled: Boolean(account?.payoutsEnabled),
    payouts_enabled: Boolean(account?.payoutsEnabled),
    charges_enabled: Boolean(account?.chargesEnabled),
    updated_at: new Date().toISOString(),
  };

  const workingPayload: AnyRow = { ...basePayload };

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { error } = await supabaseAdmin
      .from("ambassadors")
      .update(workingPayload)
      .eq("id", ambassadorId);

    if (!error) return;

    const missingColumn = error.message.match(
      /Could not find the '([^']+)' column/i,
    )?.[1];

    if (
      missingColumn &&
      Object.prototype.hasOwnProperty.call(workingPayload, missingColumn)
    ) {
      delete workingPayload[missingColumn];
      continue;
    }

    console.warn("Unable to update Ambassador Stripe fields:", error.message);
    return;
  }
}

async function startStripeOnboardingAction() {
  "use server";

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?mode=phone");
  }

  const ambassador = await getAmbassadorForUser(user.id, user.email);

  if (!ambassador?.id) {
    redirect("/login/route?preferred=ambassador");
  }

  let accountId = getStripeAccountId(ambassador);

  if (!accountId) {
    accountId = await createStripeAccount({
      userEmail: user.email,
      ambassador,
    });
    await updateAmbassadorStripeFields({
      ambassadorId: ambassador.id,
      accountId,
    });
  }

  const onboardingUrl = await createStripeAccountLink(accountId);
  redirect(onboardingUrl);
}

function StatusPill({ ready }: { ready: boolean }) {
  return ready ? (
    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black !text-emerald-700">
      Ready for payouts
    </span>
  ) : (
    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black !text-amber-700">
      Setup needed
    </span>
  );
}

function SetupStep({
  number,
  title,
  detail,
  complete,
}: {
  number: string;
  title: string;
  detail: string;
  complete: boolean;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-emerald-100 bg-white px-4 py-3 shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-black !text-emerald-800">
        {complete ? <CheckCircle2 className="h-5 w-5" /> : number}
      </div>
      <div>
        <p className="text-sm font-black !text-slate-950">{title}</p>
        <p className="mt-1 text-xs font-bold leading-5 !text-slate-600">
          {detail}
        </p>
      </div>
    </div>
  );
}

export default async function AmbassadorPayoutsPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?mode=phone");
  }

  const ambassador = await getAmbassadorForUser(user.id, user.email);

  if (!ambassador?.id) {
    redirect("/login/route?preferred=ambassador");
  }

  const accountId = getStripeAccountId(ambassador);
  const stripeAccount = await retrieveStripeAccount(accountId);
  const readyForPayouts = Boolean(stripeAccount?.payoutsEnabled);

  if (accountId && stripeAccount) {
    await updateAmbassadorStripeFields({
      ambassadorId: ambassador.id,
      accountId,
      account: stripeAccount,
    });
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_42%,#ecfdf5_100%)] px-4 py-6 !text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Link
          href="/ambassador/dashboard/earnings"
          className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black !text-emerald-800 shadow-sm transition hover:bg-emerald-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Earnings
        </Link>

        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-8 bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.95),transparent_18%),linear-gradient(120deg,#b9f8df_0%,#d9f8ef_48%,#bde9ff_100%)] px-8 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center xl:px-10">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.26em] !text-emerald-800">
                Ambassador Payouts
              </p>
              <h1 className="mt-4 text-5xl font-black tracking-[-0.055em] !text-slate-950 md:text-6xl xl:text-7xl">
                Connect Stripe to receive rewards.
              </h1>
              <p className="mt-5 max-w-4xl text-base font-semibold leading-8 !text-slate-800 md:text-lg">
                Stripe setup lets SitGuru send approved Ambassador referral,
                commission, and reward payouts securely after SitGuru review.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <StatusPill ready={readyForPayouts} />
                {accountId ? (
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black !text-slate-700">
                    Stripe account connected
                  </span>
                ) : null}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/95 p-7 shadow-xl backdrop-blur">
              <div className="flex items-start gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-emerald-100 !text-emerald-700 ring-1 ring-emerald-200">
                  <Wallet className="h-8 w-8" />
                </div>

                <div>
                  <h2 className="text-2xl font-black tracking-tight !text-slate-950 md:text-3xl">
                    Stripe payout status
                  </h2>
                  <p className="mt-4 text-sm font-semibold leading-7 !text-slate-800">
                    {readyForPayouts
                      ? "Stripe reports that payouts are enabled for this Ambassador account."
                      : accountId
                        ? "Stripe account found. Complete or refresh onboarding so payouts can be enabled."
                        : "No Stripe payout account is connected yet. Start setup to connect Stripe."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-emerald-700" />
                <h2 className="text-2xl font-black !text-slate-950">
                  Setup Checklist
                </h2>
              </div>

              <div className="mt-5 grid gap-3">
                <SetupStep
                  number="1"
                  title="Choose Individual"
                  detail="Most Ambassadors should select Individual and continue through Stripe."
                  complete={Boolean(accountId)}
                />
                <SetupStep
                  number="2"
                  title="Enter personal details"
                  detail="Stripe may ask for legal name, email, date of birth, address, phone, and last 4 digits of SSN."
                  complete={Boolean(stripeAccount?.detailsSubmitted)}
                />
                <SetupStep
                  number="3"
                  title="Connect a bank account"
                  detail="Select the account you want SitGuru-approved Ambassador payouts sent to."
                  complete={Boolean(stripeAccount?.payoutsEnabled)}
                />
              </div>

              <form action={startStripeOnboardingAction} className="mt-6">
                <button
                  type="submit"
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black !text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800"
                >
                  {accountId ? "Continue Stripe Setup" : "Connect Stripe Now"}
                  <ExternalLink className="h-4 w-4" />
                </button>
              </form>

              <p className="mt-4 text-xs font-bold leading-5 !text-slate-600">
                Stripe onboarding links are created securely and redirect you to
                Stripe-hosted setup. If the link expires, return here and click
                the button again.
              </p>
            </div>

            <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <HelpCircle className="mt-1 h-6 w-6 shrink-0 text-emerald-700" />
                <div>
                  <h2 className="text-xl font-black !text-emerald-950">
                    Need help?
                  </h2>
                  <p className="mt-2 text-sm font-semibold leading-6 !text-emerald-900">
                    If Stripe asks for information you do not understand, email
                    SitGuru before submitting. We can help explain the setup
                    flow, but Stripe controls identity, tax, and bank
                    verification.
                  </p>
                  <Link
                    href="mailto:support@sitguru.com?subject=Ambassador%20Stripe%20Setup%20Help"
                    className="mt-4 inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-black !text-emerald-800 shadow-sm ring-1 ring-emerald-200 transition hover:bg-emerald-100"
                  >
                    Email SitGuru Support
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] !text-emerald-700">
                  Ambassador guide
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-tight !text-slate-950">
                  Stripe Setup Guide
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 !text-slate-700">
                  View or download the Ambassador Stripe setup guide before you
                  start onboarding.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={GUIDE_IMAGE_PATH}
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black !text-emerald-800 transition hover:bg-emerald-50"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Guide
                </Link>
                <a
                  href={GUIDE_IMAGE_PATH}
                  download
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black !text-white transition hover:bg-emerald-800"
                >
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
              <Image
                src={GUIDE_IMAGE_PATH}
                alt="SitGuru Ambassador Stripe Setup Guide"
                width={900}
                height={1400}
                className="h-auto w-full"
                priority
              />
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
