import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2026-03-25.dahlia",
});

export async function GET(req: NextRequest) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.redirect(
        new URL("/guru/login?error=Please log in again", appUrl)
      );
    }

    const { data: guru, error: guruError } = await supabaseAdmin
      .from("gurus")
      .select("user_id, stripe_account_id")
      .eq("user_id", user.id)
      .single();

    if (guruError || !guru) {
      console.error("Stripe return guru lookup error:", guruError);
      return NextResponse.redirect(
        new URL("/guru/dashboard?stripe=missing_profile", appUrl)
      );
    }

    const stripeAccountId =
      typeof guru.stripe_account_id === "string"
        ? guru.stripe_account_id.trim()
        : "";

    if (!stripeAccountId) {
      return NextResponse.redirect(
        new URL("/guru/dashboard?stripe=missing_account", appUrl)
      );
    }

    const account = await stripe.accounts.retrieve(stripeAccountId);

    const onboardingComplete =
      Boolean(account.details_submitted) ||
      (Boolean(account.charges_enabled) && Boolean(account.payouts_enabled));

    const { error: updateError } = await supabaseAdmin
      .from("gurus")
      .update({
        stripe_onboarding_complete: onboardingComplete,
        charges_enabled: Boolean(account.charges_enabled),
        payouts_enabled: Boolean(account.payouts_enabled),
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Stripe return guru update error:", updateError);
      return NextResponse.redirect(
        new URL("/guru/dashboard?stripe=save_failed", appUrl)
      );
    }

    if (onboardingComplete) {
      return NextResponse.redirect(
        new URL("/guru/dashboard?stripe=connected", appUrl)
      );
    }

    return NextResponse.redirect(
      new URL("/guru/dashboard?stripe=needs_attention", appUrl)
    );
  } catch (error) {
    console.error("Stripe return route error:", error);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

    return NextResponse.redirect(
      new URL("/guru/dashboard?stripe=return_failed", appUrl)
    );
  }
}