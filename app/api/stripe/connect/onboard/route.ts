import { NextRequest, NextResponse } from "next/server";

import {
  buildGuruExpressAccountParams,
  createGuruAccountLink,
  prefillGuruConnectedAccount,
  type GuruConnectProfile,
} from "@/lib/stripe/connect-guru-account";
import { getStripeServer } from "@/lib/stripe/server";
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

async function loadGuruConnectProfile(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("gurus")
    .select(
      "id, user_id, email, full_name, display_name, name, slug, stripe_account_id",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data?.id || !data.user_id) {
    return null;
  }

  return data as GuruConnectProfile;
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

  try {
    getStripeServer();
  } catch {
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
      buildRedirectUrl(baseUrl, "/login", {
        role: "guru",
        next: "/api/stripe/connect/onboard?role=guru",
      }),
    );
  }

  const guru = await loadGuruConnectProfile(user.id);

  if (!guru) {
    return NextResponse.redirect(
      buildRedirectUrl(baseUrl, "/guru/dashboard", {
        stripe_error: "guru_not_found",
      }),
    );
  }

  let stripeAccountId = guru.stripe_account_id
    ? String(guru.stripe_account_id)
    : "";

  if (!stripeAccountId) {
    const stripe = getStripeServer();
    const account = await stripe.accounts.create(
      buildGuruExpressAccountParams({
        guru,
        authEmail: user.email,
        metadataEmail:
          typeof user.user_metadata?.email === "string"
            ? user.user_metadata.email
            : null,
      }),
    );

    stripeAccountId = account.id;

    await updateGuruStripeAccount({
      userId: user.id,
      stripeAccountId,
    });
  } else {
    await prefillGuruConnectedAccount({
      stripeAccountId,
      guru,
      authEmail: user.email,
    });
  }

  const refreshUrl = buildRedirectUrl(baseUrl, "/api/stripe/connect/onboard", {
    role: "guru",
  });

  const returnUrl = buildRedirectUrl(baseUrl, "/api/stripe/return", {
    role: "guru",
  });

  const accountLink = await createGuruAccountLink({
    stripeAccountId,
    refreshUrl,
    returnUrl,
  });

  return NextResponse.redirect(accountLink.url);
}
