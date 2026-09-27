import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import {
  mobileCorsHeaders,
  optionsWithMobileCors,
  resolveRequestUser,
} from "@/lib/supabase/request-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getStripeServer } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type GuruStripeConnectRecord = {
  id: string;
  user_id: string | null;
  email: string | null;
  full_name: string | null;
  display_name: string | null;
  name: string | null;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean | null;
  charges_enabled: boolean | null;
  payouts_enabled: boolean | null;
};

function getAppUrl(request?: NextRequest) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_URL ||
    request?.nextUrl.origin ||
    "http://localhost:3000";

  return appUrl.startsWith("http")
    ? appUrl.replace(/\/$/, "")
    : `https://${appUrl.replace(/\/$/, "")}`;
}

function isMobileClient(request: NextRequest) {
  const header = (
    request.headers.get("x-sitguru-client") ||
    request.nextUrl.searchParams.get("client") ||
    ""
  ).toLowerCase();

  return header.includes("mobile") || header === "sitguru-mobile";
}

function jsonWithCors(
  request: NextRequest,
  body: Record<string, unknown>,
  status = 200,
) {
  return NextResponse.json(body, {
    status,
    headers: mobileCorsHeaders(request),
  });
}

async function createOrResumeStripeConnectOnboarding(request: NextRequest) {
  const appUrl = getAppUrl(request);
  const mobile = isMobileClient(request);
  const resolved = await resolveRequestUser(request);

  if (!resolved?.user) {
    return {
      error: "Unauthorized.",
      status: 401,
      url: null as string | null,
      stripeAccountId: null as string | null,
    };
  }

  const user = resolved.user;

  let stripe: Stripe;
  try {
    stripe = getStripeServer();
  } catch {
    return {
      error: "Stripe is not configured.",
      status: 503,
      url: null,
      stripeAccountId: null,
    };
  }

  const { data: guruData, error: guruError } = await supabaseAdmin
    .from("gurus")
    .select(
      [
        "id",
        "user_id",
        "email",
        "full_name",
        "display_name",
        "name",
        "stripe_account_id",
        "stripe_onboarding_complete",
        "charges_enabled",
        "payouts_enabled",
      ].join(","),
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (guruError) {
    console.error("Guru lookup error:", guruError);

    return {
      error: "Could not load Guru profile.",
      status: 500,
      url: null,
      stripeAccountId: null,
    };
  }

  const guru = guruData as GuruStripeConnectRecord | null;

  if (!guru) {
    return {
      error: "Guru profile not found.",
      status: 404,
      url: null,
      stripeAccountId: null,
    };
  }

  let stripeAccountId = guru.stripe_account_id;

  if (!stripeAccountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: guru.email || user.email || undefined,
      business_type: "individual",
      metadata: {
        guru_id: String(guru.id),
        user_id: String(user.id),
        source: "sitguru_guru_payout_setup",
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    stripeAccountId = account.id;

    const { error: updateError } = await supabaseAdmin
      .from("gurus")
      .update({
        stripe_account_id: stripeAccountId,
        stripe_onboarding_complete: false,
        charges_enabled: false,
        payouts_enabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error saving Stripe account ID:", updateError);

      return {
        error: "Could not save Stripe Connect account.",
        status: 500,
        url: null,
        stripeAccountId: null,
      };
    }
  }

  const refreshUrl = mobile
    ? `${appUrl}/api/mobile/stripe/return?result=refresh`
    : `${appUrl}/guru/dashboard?stripe=refresh`;
  const returnUrl = mobile
    ? `${appUrl}/api/mobile/stripe/return?result=return`
    : `${appUrl}/api/stripe/return`;

  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });

  return {
    error: null,
    status: 200,
    url: accountLink.url,
    stripeAccountId,
  };
}

export async function OPTIONS(request: NextRequest) {
  return optionsWithMobileCors(request);
}

export async function GET(request: NextRequest) {
  try {
    const result = await createOrResumeStripeConnectOnboarding(request);

    if (result.error || !result.url) {
      return NextResponse.redirect(`${getAppUrl(request)}/guru/dashboard?stripe=error`);
    }

    return NextResponse.redirect(result.url);
  } catch (error) {
    console.error("Stripe Connect GET route error:", error);

    return NextResponse.redirect(`${getAppUrl(request)}/guru/dashboard?stripe=error`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await createOrResumeStripeConnectOnboarding(request);

    if (result.error || !result.url) {
      return jsonWithCors(
        request,
        { error: result.error || "Failed to start Stripe Connect onboarding." },
        result.status,
      );
    }

    return jsonWithCors(request, {
      ok: true,
      url: result.url,
      stripe_account_id: result.stripeAccountId,
    });
  } catch (error) {
    console.error("Stripe Connect POST route error:", error);

    return jsonWithCors(
      request,
      { error: "Failed to start Stripe Connect onboarding." },
      500,
    );
  }
}
