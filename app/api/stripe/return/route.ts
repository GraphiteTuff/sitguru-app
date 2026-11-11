import { NextRequest, NextResponse } from "next/server";

import { getStripeServer } from "@/lib/stripe/server";
import { syncStripeConnectAccountForUser } from "@/lib/payments/sync-stripe-connect-account";
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

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request);
  const role = request.nextUrl.searchParams.get("role") || "guru";
  const client = (request.nextUrl.searchParams.get("client") || "").toLowerCase();
  const dashboardPath =
    role === "ambassador" ? "/ambassador/dashboard" : "/guru/dashboard/earnings";
  const loginPath =
    role === "ambassador"
      ? "/login?role=ambassador"
      : "/login?role=guru";

  if (client.includes("mobile")) {
    return NextResponse.redirect(
      new URL("/api/mobile/stripe/return?result=return", baseUrl),
    );
  }

  try {
    getStripeServer();
  } catch {
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
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      buildRedirectUrl(baseUrl, loginPath, {
        next: dashboardPath,
        stripe: "return",
      }),
    );
  }

  const { data: guru } = await supabaseAdmin
    .from("gurus")
    .select("stripe_account_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const stripeAccountId = guru?.stripe_account_id
    ? String(guru.stripe_account_id)
    : "";

  if (!stripeAccountId) {
    return NextResponse.redirect(
      buildRedirectUrl(baseUrl, dashboardPath, {
        stripe: "error",
        stripe_error: "missing_account",
      }),
    );
  }

  try {
    const stripe = getStripeServer();
    const account = await stripe.accounts.retrieve(stripeAccountId);
    const readiness = await syncStripeConnectAccountForUser({
      userId: user.id,
      account,
    });

    return NextResponse.redirect(
      buildRedirectUrl(baseUrl, dashboardPath, {
        stripe: readiness.complete ? "connected" : "pending",
      }),
    );
  } catch (error) {
    console.error("Stripe return sync failed:", error);

    return NextResponse.redirect(
      buildRedirectUrl(baseUrl, dashboardPath, {
        stripe: "error",
        stripe_error: "sync_failed",
      }),
    );
  }
}
