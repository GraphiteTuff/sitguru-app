/**
 * Authoritative Stripe Connect → SitGuru readiness sync.
 * Used by return URLs and account.updated webhooks.
 * Never stores sensitive KYC values — only IDs and readiness flags.
 */

import type Stripe from "stripe";

import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  deriveStripeConnectReadiness,
  type StripeConnectReadiness,
} from "@/lib/payments/stripe-connect-readiness";

export {
  deriveStripeConnectReadiness,
  type StripeConnectReadiness,
} from "@/lib/payments/stripe-connect-readiness";

async function updateGuruRow(
  userId: string,
  readiness: StripeConnectReadiness,
) {
  const now = new Date().toISOString();
  const attempts = [
    {
      stripe_account_id: readiness.stripeAccountId,
      stripe_connect_status: readiness.connectStatus,
      stripe_onboarding_complete: readiness.complete,
      charges_enabled: readiness.chargesEnabled,
      payouts_enabled: readiness.payoutsEnabled,
      stripe_onboarding_completed_at: readiness.complete ? now : null,
      updated_at: now,
    },
    {
      stripe_account_id: readiness.stripeAccountId,
      stripe_connect_status: readiness.connectStatus,
      stripe_onboarding_complete: readiness.complete,
      charges_enabled: readiness.chargesEnabled,
      payouts_enabled: readiness.payoutsEnabled,
      updated_at: now,
    },
    {
      stripe_account_id: readiness.stripeAccountId,
      stripe_onboarding_complete: readiness.complete,
      charges_enabled: readiness.chargesEnabled,
      payouts_enabled: readiness.payoutsEnabled,
      updated_at: now,
    },
    {
      stripe_account_id: readiness.stripeAccountId,
      stripe_onboarding_complete: readiness.complete,
    },
  ];

  for (const payload of attempts) {
    const { error } = await supabaseAdmin
      .from("gurus")
      .update(payload)
      .eq("user_id", userId);

    if (!error) return;
  }
}

async function updatePayoutAccountRow(
  userId: string,
  readiness: StripeConnectReadiness,
) {
  const now = new Date().toISOString();
  const onboardingStatus = readiness.complete
    ? "ready"
    : readiness.connectStatus === "restricted"
      ? "restricted"
      : readiness.pendingReview || readiness.detailsSubmitted
        ? "pending_verification"
        : "in_progress";
  const accountStatus = readiness.complete ? "ready" : onboardingStatus;
  // Keep legacy `status` aligned so sitguru_refresh_user_payout_readiness
  // does not overwrite a fresh Stripe sync with a stale pending value.
  const legacyStatus = readiness.complete
    ? "ready"
    : readiness.connectStatus === "restricted"
      ? "restricted"
      : readiness.pendingReview || readiness.detailsSubmitted
        ? "pending"
        : "in_progress";

  const payload = {
    provider: "stripe",
    provider_account_id: readiness.stripeAccountId,
    account_purpose: "guru_marketplace_seller",
    workspace_role: "guru",
    status: legacyStatus,
    onboarding_status: onboardingStatus,
    account_status: accountStatus,
    details_submitted: readiness.detailsSubmitted,
    charges_enabled: readiness.chargesEnabled,
    payouts_enabled: readiness.payoutsEnabled,
    requirements_currently_due: readiness.requirementsCurrentlyDue,
    onboarding_completed_at: readiness.complete ? now : null,
    connected_at: readiness.complete ? now : null,
    updated_at: now,
    last_synced_at: now,
    last_checked_at: now,
  };

  const { data: existingRows, error: lookupError } = await supabaseAdmin
    .from("user_payout_accounts")
    .select("id")
    .eq("user_id", userId)
    .eq("provider", "stripe")
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(5);

  if (lookupError) {
    console.error("Stripe payout account lookup failed:", lookupError);
  }

  const existingIds = (existingRows || [])
    .map((row) => String(row.id || ""))
    .filter(Boolean);

  if (existingIds.length > 0) {
    const { error: updateError } = await supabaseAdmin
      .from("user_payout_accounts")
      .update(payload)
      .in("id", existingIds);

    if (updateError) {
      console.error("Stripe payout account update failed:", updateError);
    }
    return;
  }

  const { error: insertError } = await supabaseAdmin
    .from("user_payout_accounts")
    .insert({
      user_id: userId,
      ...payload,
      created_at: now,
    });

  if (insertError) {
    console.error("Stripe payout account insert failed:", insertError);
  }
}

async function refreshPreferenceFlags(userId: string, ready: boolean) {
  const now = new Date().toISOString();

  await supabaseAdmin
    .from("user_payout_preferences")
    .update({
      financial_onboarding_status: ready ? "ready" : "in_progress",
      can_accept_paid_bookings: ready,
      setup_completed: ready,
      updated_at: now,
    })
    .eq("user_id", userId)
    .eq("workspace_role", "guru");
}

export async function syncStripeConnectAccountForUser({
  userId,
  account,
}: {
  userId: string;
  account: Stripe.Account;
}) {
  const readiness = deriveStripeConnectReadiness(account);

  await updateGuruRow(userId, readiness);
  await updatePayoutAccountRow(userId, readiness);
  await refreshPreferenceFlags(userId, readiness.complete);

  return readiness;
}

export async function findUserIdForStripeAccount(stripeAccountId: string) {
  const { data: guru } = await supabaseAdmin
    .from("gurus")
    .select("user_id")
    .eq("stripe_account_id", stripeAccountId)
    .maybeSingle();

  if (guru?.user_id) return String(guru.user_id);

  const { data: payoutAccount } = await supabaseAdmin
    .from("user_payout_accounts")
    .select("user_id")
    .eq("provider", "stripe")
    .eq("provider_account_id", stripeAccountId)
    .maybeSingle();

  if (payoutAccount?.user_id) return String(payoutAccount.user_id);

  return null;
}

export async function guruCanAcceptPaidBookings(userId: string) {
  const { data: preference } = await supabaseAdmin
    .from("user_payout_preferences")
    .select("can_accept_paid_bookings, financial_onboarding_status")
    .eq("user_id", userId)
    .eq("workspace_role", "guru")
    .maybeSingle();

  if (preference?.can_accept_paid_bookings === true) {
    return { ready: true as const, source: "preference" as const };
  }

  const { data: guru } = await supabaseAdmin
    .from("gurus")
    .select(
      "stripe_account_id, stripe_onboarding_complete, charges_enabled, payouts_enabled",
    )
    .eq("user_id", userId)
    .maybeSingle();

  const stripeReady = Boolean(
    guru?.stripe_account_id &&
      (guru?.stripe_onboarding_complete === true ||
        guru?.payouts_enabled === true),
  );

  if (stripeReady) {
    return { ready: true as const, source: "guru_stripe" as const };
  }

  const { data: paypal } = await supabaseAdmin
    .from("user_payout_accounts")
    .select("onboarding_status, payouts_enabled, account_status")
    .eq("user_id", userId)
    .eq("provider", "paypal")
    .maybeSingle();

  const paypalReady =
    paypal?.payouts_enabled === true ||
    String(paypal?.onboarding_status || "").toLowerCase() === "ready" ||
    String(paypal?.account_status || "").toLowerCase() === "ready";

  if (paypalReady) {
    return { ready: true as const, source: "paypal" as const };
  }

  return { ready: false as const, source: "none" as const };
}
