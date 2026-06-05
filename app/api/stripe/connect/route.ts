import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

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

export async function POST() {
  try {
    const appUrl = getAppUrl();
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: guru, error: guruError } = await supabaseAdmin
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
      return NextResponse.json(
        { error: "Could not load Guru profile." },
        { status: 500 },
      );
    }

    if (!guru) {
      return NextResponse.json(
        { error: "Guru profile not found." },
        { status: 404 },
      );
    }

    let stripeAccountId = guru.stripe_account_id as string | null;

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
        return NextResponse.json(
          { error: "Could not save Stripe Connect account." },
          { status: 500 },
        );
      }
    }

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${appUrl}/guru/dashboard?stripe=refresh`,
      return_url: `${appUrl}/api/stripe/return`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      ok: true,
      url: accountLink.url,
      stripe_account_id: stripeAccountId,
    });
  } catch (error) {
    console.error("Stripe Connect route error:", error);

    return NextResponse.json(
      { error: "Failed to start Stripe Connect onboarding." },
      { status: 500 },
    );
  }
}