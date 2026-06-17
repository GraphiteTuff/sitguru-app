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

  searchParams.set("stripe", params.connected ? "connected" : "needs_attention");
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

async function updateGuruStripeReturnStatus({
  userId,
  stripeAccountId,
  connected,
  detailsSubmitted,
  chargesEnabled,
  payoutsEnabled,
  currentlyDue,
  eventuallyDue,
  pastDue,
  disabledReason,
}: {
  userId: string;
  stripeAccountId: string;
  connected: boolean;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  currentlyDue: string[];
  eventuallyDue: string[];
  pastDue: string[];
  disabledReason: string | null;
}) {
  const now = new Date().toISOString();

  const updateAttempts = [
    {
      stripe_account_id: stripeAccountId,
      stripe_connect_status: connected ? "complete" : "needs_attention",
      stripe_onboarding_complete: connected,
      stripe_details_submitted: detailsSubmitted,
      charges_enabled: chargesEnabled,
      payouts_enabled: payoutsEnabled,
      stripe_requirements_currently_due: currentlyDue,
      stripe_requirements_eventually_due: eventuallyDue,
      stripe_requirements_past_due: pastDue,
      stripe_disabled_reason: disabledReason,
      stripe_onboarding_completed_at: connected ? now : null,
      updated_at: now,
    },
    {
      stripe_account_id: stripeAccountId,
      stripe_connect_status: connected ? "complete" : "needs_attention",
      stripe_onboarding_complete: connected,
      charges_enabled: chargesEnabled,
      payouts_enabled: payoutsEnabled,
      stripe_onboarding_completed_at: connected ? now : null,
      updated_at: now,
    },
    {
      stripe_account_id: stripeAccountId,
      stripe_onboarding_complete: connected,
      charges_enabled: chargesEnabled,
      payouts_enabled: payoutsEnabled,
      updated_at: now,
    },
    {
      stripe_account_id: stripeAccountId,
      stripe_onboarding_complete: connected,
      updated_at: now,
    },
    {
      stripe_account_id: stripeAccountId,
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
    const eventuallyDue = account.requirements?.eventually_due ?? [];
    const pastDue = account.requirements?.past_due ?? [];
    const disabledReason = account.requirements?.disabled_reason ?? null;

    /*
     * Stripe can show a success/Link-complete screen before charges_enabled and
     * payouts_enabled are both true. For SitGuru onboarding Step 6, the Guru has
     * completed the payout connection step once Stripe has accepted/submitted the
     * connected-account details. If Stripe later requires more information, the
     * stored requirement fields and query params still show that clearly.
     */
    const connected = detailsSubmitted || chargesEnabled || payoutsEnabled;

    await updateGuruStripeReturnStatus({
      userId: user.id,
      stripeAccountId,
      connected,
      detailsSubmitted,
      chargesEnabled,
      payoutsEnabled,
      currentlyDue,
      eventuallyDue,
      pastDue,
      disabledReason,
    });

    const dashboardQuery = getStripeStatusSearchParams({
      connected,
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
