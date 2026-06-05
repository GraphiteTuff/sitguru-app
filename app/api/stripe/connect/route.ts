import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

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

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
}

const stripe = new Stripe(stripeSecretKey);

function getAppUrl() {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";

  return appUrl.startsWith("http")
    ? appUrl.replace(/\/$/, "")
    : `https://${appUrl.replace(/\/$/, "")}`;
}

async function createOrResumeStripeConnectOnboarding() {
  const appUrl = getAppUrl();
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: "Unauthorized.",
      status: 401,
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
        source: "sitguru_guru_step_5_onboarding",
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

  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: `${appUrl}/guru/dashboard?stripe=refresh`,
    return_url: `${appUrl}/api/stripe/return`,
    type: "account_onboarding",
  });

  return {
    error: null,
    status: 200,
    url: accountLink.url,
    stripeAccountId,
  };
}

export async function GET() {
  try {
    const result = await createOrResumeStripeConnectOnboarding();

    if (result.error || !result.url) {
      return NextResponse.redirect(`${getAppUrl()}/guru/dashboard?stripe=error`);
    }

    return NextResponse.redirect(result.url);
  } catch (error) {
    console.error("Stripe Connect GET route error:", error);

    return NextResponse.redirect(`${getAppUrl()}/guru/dashboard?stripe=error`);
  }
}

export async function POST() {
  try {
    const result = await createOrResumeStripeConnectOnboarding();

    if (result.error || !result.url) {
      return NextResponse.json(
        { error: result.error || "Failed to start Stripe Connect onboarding." },
        { status: result.status },
      );
    }

    return NextResponse.json({
      ok: true,
      url: result.url,
      stripe_account_id: result.stripeAccountId,
    });
  } catch (error) {
    console.error("Stripe Connect POST route error:", error);

    return NextResponse.json(
      { error: "Failed to start Stripe Connect onboarding." },
      { status: 500 },
    );
  }
}