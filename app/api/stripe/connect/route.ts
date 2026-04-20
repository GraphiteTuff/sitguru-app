import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST() {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: guru, error: guruError } = await supabaseAdmin
      .from("gurus")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (guruError || !guru) {
      console.error("Guru lookup error:", guruError);
      return NextResponse.json(
        { error: "Guru profile not found" },
        { status: 404 }
      );
    }

    let stripeAccountId = guru.stripe_account_id as string | null;

    if (!stripeAccountId) {
      console.log("Creating Stripe Express account for user:", user.id);

      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: user.email ?? undefined,
        business_type: "individual",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      stripeAccountId = account.id;
      console.log("Stripe account created:", stripeAccountId);

      const { error: updateError } = await supabaseAdmin
        .from("gurus")
        .update({
          stripe_account_id: stripeAccountId,
          stripe_onboarding_complete: false,
          charges_enabled: false,
          payouts_enabled: false,
        })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error saving Stripe account ID:", updateError);
        return NextResponse.json(
          { error: "Could not save Stripe account" },
          { status: 500 }
        );
      }

      console.log("Stripe account ID saved to gurus table.");
    } else {
      console.log("Existing Stripe account found:", stripeAccountId);
    }

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${appUrl}/guru/dashboard?stripe=refresh`,
      return_url: `${appUrl}/api/stripe/return`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error("Stripe connect route error:", error);
    return NextResponse.json(
      { error: "Failed to connect Stripe" },
      { status: 500 }
    );
  }
}