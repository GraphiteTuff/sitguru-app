import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function getBaseUrl(request: NextRequest) {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.SITE_URL ||
    "";

  const fallbackUrl = request.nextUrl.origin;
  return (configuredUrl || fallbackUrl).replace(/\/+$/, "");
}

function buildRedirectUrl(baseUrl: string, path: string, params?: Record<string, string>) {
  const url = new URL(path, baseUrl);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return url.toString();
}

async function updateGuruStripeAccount({
  userId,
  stripeAccountId,
}: {
  userId: string;
  stripeAccountId: string;
}) {
  const now = new Date().toISOString();

  const updateAttempts = [
    {
      stripe_account_id: stripeAccountId,
      stripe_connect_status: "onboarding_started",
      stripe_onboarding_started_at: now,
      updated_at: now,
    },
    {
      stripe_account_id: stripeAccountId,
      stripe_connect_status: "onboarding_started",
      updated_at: now,
    },
    {
      stripe_account_id: stripeAccountId,
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

async function findGuruStripeAccount(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("gurus")
    .select("id, stripe_account_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return {
      guruId: null as string | null,
      stripeAccountId: null as string | null,
    };
  }

  return {
    guruId: data.id ? String(data.id) : null,
    stripeAccountId: data.stripe_account_id
      ? String(data.stripe_account_id)
      : null,
  };
}

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request);
  const role = request.nextUrl.searchParams.get("role") || "guru";

  if (role !== "guru") {
    return NextResponse.redirect(
      buildRedirectUrl(baseUrl, "/guru/dashboard/earnings", {
        stripe_error: "invalid_role",
      }),
    );
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    return NextResponse.redirect(
      buildRedirectUrl(baseUrl, "/guru/dashboard/earnings", {
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
    return NextResponse.redirect(
      buildRedirectUrl(baseUrl, "/guru/login", {
        redirect: "/api/stripe/connect/onboard?role=guru",
      }),
    );
  }

  const stripe = new Stripe(stripeSecretKey);
  const { stripeAccountId: existingStripeAccountId } =
    await findGuruStripeAccount(user.id);

  let stripeAccountId = existingStripeAccountId;

  if (!stripeAccountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: user.email || undefined,
      business_type: "individual",
      capabilities: {
        card_payments: {
          requested: true,
        },
        transfers: {
          requested: true,
        },
      },
      metadata: {
        role: "guru",
        user_id: user.id,
        email: user.email || "",
      },
    });

    stripeAccountId = account.id;
    await updateGuruStripeAccount({
      userId: user.id,
      stripeAccountId,
    });
  }

  const refreshUrl = buildRedirectUrl(
    baseUrl,
    "/api/stripe/connect/onboard",
    { role: "guru" },
  );

  const returnUrl = buildRedirectUrl(baseUrl, "/guru/dashboard/earnings", {
    stripe: "returned",
  });

  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });

  return NextResponse.redirect(accountLink.url);
}
