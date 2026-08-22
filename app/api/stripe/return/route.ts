import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getBaseUrl(request: NextRequest) {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.SITE_URL ||
    "";

  const fallbackUrl = request.nextUrl.origin;
  return (configuredUrl || fallbackUrl).replace(/\/+$/, "");
}

function buildRedirectUrl(
  baseUrl: string,
  path: string,
  params?: Record<string, string>,
) {
  const url = new URL(path, baseUrl);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return url.toString();
}

async function saveGuruConnectStatus({
  userId,
  stripeAccountId,
  chargesEnabled,
  payoutsEnabled,
  detailsSubmitted,
}: {
  userId: string;
  stripeAccountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}) {
  const now = new Date().toISOString();
  const complete = chargesEnabled && payoutsEnabled;
  const connectStatus = complete
    ? "connected"
    : detailsSubmitted
      ? "pending"
      : "onboarding_started";

  const updateAttempts = [
    {
      stripe_account_id: stripeAccountId,
      stripe_connect_status: connectStatus,
      stripe_onboarding_complete: complete,
      charges_enabled: chargesEnabled,
      payouts_enabled: payoutsEnabled,
      stripe_onboarding_completed_at: complete ? now : null,
      updated_at: now,
    },
    {
      stripe_account_id: stripeAccountId,
      stripe_connect_status: connectStatus,
      stripe_onboarding_complete: complete,
      charges_enabled: chargesEnabled,
      payouts_enabled: payoutsEnabled,
      updated_at: now,
    },
    {
      stripe_account_id: stripeAccountId,
      stripe_onboarding_complete: complete,
      charges_enabled: chargesEnabled,
      payouts_enabled: payoutsEnabled,
      updated_at: now,
    },
    {
      stripe_account_id: stripeAccountId,
      stripe_onboarding_complete: complete,
    },
  ];

  for (const payload of updateAttempts) {
    const { error } = await supabaseAdmin
      .from("gurus")
      .update(payload)
      .eq("user_id", userId);

    if (!error) return;
  }
}

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request);
  const role = request.nextUrl.searchParams.get("role") || "guru";
  const dashboardPath =
    role === "ambassador" ? "/ambassador/dashboard" : "/guru/dashboard";
  const loginPath =
    role === "ambassador"
      ? "/login?role=ambassador"
      : "/login?role=guru";

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    return NextResponse.redirect(
      buildRedirectUrl(baseUrl, dashboardPath, {
        stripe: "error",
        stripe_error: "missing_stripe_secret",
      }),
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const next = `/api/stripe/return?role=${encodeURIComponent(role)}`;
    return NextResponse.redirect(
      buildRedirectUrl(baseUrl, loginPath, { next }),
    );
  }

  const { data: guru, error: guruError } = await supabaseAdmin
    .from("gurus")
    .select("id, stripe_account_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (guruError || !guru?.stripe_account_id) {
    return NextResponse.redirect(
      buildRedirectUrl(baseUrl, dashboardPath, {
        stripe: "error",
        stripe_error: "missing_account",
      }),
    );
  }

  try {
    const stripe = new Stripe(stripeSecretKey);
    const account = await stripe.accounts.retrieve(
      String(guru.stripe_account_id),
    );

    const chargesEnabled = account.charges_enabled === true;
    const payoutsEnabled = account.payouts_enabled === true;
    const detailsSubmitted = account.details_submitted === true;

    await saveGuruConnectStatus({
      userId: user.id,
      stripeAccountId: account.id,
      chargesEnabled,
      payoutsEnabled,
      detailsSubmitted,
    });

    return NextResponse.redirect(
      buildRedirectUrl(baseUrl, dashboardPath, {
        stripe:
          chargesEnabled && payoutsEnabled ? "connected" : "needs_attention",
      }),
    );
  } catch (error) {
    console.error("Stripe Connect return failed:", error);

    return NextResponse.redirect(
      buildRedirectUrl(baseUrl, dashboardPath, {
        stripe: "error",
        stripe_error: "return_failed",
      }),
    );
  }
}
