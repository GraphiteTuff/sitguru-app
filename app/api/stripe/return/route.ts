import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

type GuruStripeReturnRecord = {
  user_id: string | null;
  stripe_account_id: string | null;
};

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2026-03-25.dahlia",
});

function getAppUrl(req: NextRequest) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_URL ||
    req.nextUrl.origin;

  return appUrl.startsWith("http")
    ? appUrl.replace(/\/$/, "")
    : `https://${appUrl.replace(/\/$/, "")}`;
}

function getStripeStatusSearchParams(params: {
  connected: boolean;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  currentlyDueCount: number;
  disabledReason: string | null;
}) {
  const searchParams = new URLSearchParams();

  if (params.connected) {
    searchParams.set("stripe", "connected");
  } else {
    searchParams.set("stripe", "needs_attention");
  }

  searchParams.set(
    "stripe_details_submitted",
    params.detailsSubmitted ? "true" : "false",
  );

  searchParams.set(
    "stripe_charges_enabled",
    params.chargesEnabled ? "true" : "false",
  );

  searchParams.set(
    "stripe_payouts_enabled",
    params.payoutsEnabled ? "true" : "false",
  );

  searchParams.set("stripe_requirements_due", String(params.currentlyDueCount));

  if (params.disabledReason) {
    searchParams.set("stripe_disabled_reason", params.disabledReason);
  }

  return searchParams.toString();
}

export async function GET(req: NextRequest) {
  try {
    const appUrl = getAppUrl(req);
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.redirect(
        new URL("/guru/login?error=Please log in again", appUrl),
      );
    }

    const { data: guruData, error: guruError } = await supabaseAdmin
      .from("gurus")
      .select("user_id, stripe_account_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (guruError) {
      console.error("Stripe return guru lookup error:", guruError);

      return NextResponse.redirect(
        new URL("/guru/dashboard?stripe=missing_profile", appUrl),
      );
    }

    const guru = guruData as GuruStripeReturnRecord | null;

    if (!guru) {
      return NextResponse.redirect(
        new URL("/guru/dashboard?stripe=missing_profile", appUrl),
      );
    }

    const stripeAccountId =
      typeof guru.stripe_account_id === "string"
        ? guru.stripe_account_id.trim()
        : "";

    if (!stripeAccountId) {
      return NextResponse.redirect(
        new URL("/guru/dashboard?stripe=missing_account", appUrl),
      );
    }

    const account = await stripe.accounts.retrieve(stripeAccountId);

    const detailsSubmitted = Boolean(account.details_submitted);
    const chargesEnabled = Boolean(account.charges_enabled);
    const payoutsEnabled = Boolean(account.payouts_enabled);
    const currentlyDue = account.requirements?.currently_due ?? [];
    const disabledReason = account.requirements?.disabled_reason ?? null;

    const onboardingComplete =
      detailsSubmitted === true &&
      chargesEnabled === true &&
      payoutsEnabled === true &&
      currentlyDue.length === 0 &&
      !disabledReason;

    const { error: updateError } = await supabaseAdmin
      .from("gurus")
      .update({
        stripe_onboarding_complete: onboardingComplete,
        charges_enabled: chargesEnabled,
        payouts_enabled: payoutsEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Stripe return guru update error:", updateError);

      return NextResponse.redirect(
        new URL("/guru/dashboard?stripe=save_failed", appUrl),
      );
    }

    const dashboardQuery = getStripeStatusSearchParams({
      connected: onboardingComplete,
      detailsSubmitted,
      chargesEnabled,
      payoutsEnabled,
      currentlyDueCount: currentlyDue.length,
      disabledReason,
    });

    return NextResponse.redirect(
      new URL(`/guru/dashboard?${dashboardQuery}`, appUrl),
    );
  } catch (error) {
    console.error("Stripe return route error:", error);

    const appUrl = getAppUrl(req);

    return NextResponse.redirect(
      new URL("/guru/dashboard?stripe=return_failed", appUrl),
    );
  }
}