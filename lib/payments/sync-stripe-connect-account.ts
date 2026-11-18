/**
 * Authoritative Stripe Connect → SitGuru readiness sync.
 * Used by return URLs and account.updated webhooks.
 * Never stores sensitive KYC values — only IDs and readiness flags.
 */

import type Stripe from "stripe";

import { supabaseAdmin } from "@/lib/supabase/admin";

export type StripeConnectReadiness = {
  stripeAccountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  complete: boolean;
  connectStatus: "connected" | "pending" | "onboarding_started" | "restricted";
  requirementsCurrentlyDue: string[];
};

export function deriveStripeConnectReadiness(
  account: Stripe.Account,
): StripeConnectReadiness {
  const chargesEnabled = account.charges_enabled === true;
  const payoutsEnabled = account.payouts_enabled === true;
  const detailsSubmitted = account.details_submitted === true;
  const currentlyDue = Array.isArray(account.requirements?.currently_due)
    ? account.requirements.currently_due.filter(
        (item): item is string => typeof item === "string",
      )
    : [];
  const disabledReason = account.requirements?.disabled_reason || null;
  const complete = chargesEnabled && payoutsEnabled;
  const restricted = Boolean(disabledReason) || currentlyDue.length > 0;

  const connectStatus: StripeConnectReadiness["connectStatus"] = complete
    ? "connected"
    : restricted && detailsSubmitted
      ? "restricted"
      : detailsSubmitted
        ? "pending"
        : "onboarding_started";

  return {
    stripeAccountId: account.id,
    chargesEnabled,
    payoutsEnabled,
    detailsSubmitted,
    complete,
    connectStatus,
    requirementsCurrentlyDue: currentlyDue,
  };
}

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
      : readiness.detailsSubmitted
        ? "pending_verification"
        : "in_progress";

  const payload = {
    provider: "stripe",
    provider_account_id: readiness.stripeAccountId,
    onboarding_status: onboardingStatus,
    account_status: readiness.complete ? "ready" : onboardingStatus,
    details_submitted: readiness.detailsSubmitted,
    charges_enabled: readiness.chargesEnabled,
    payouts_enabled: readiness.payoutsEnabled,
    requirements_currently_due: readiness.requirementsCurrentlyDue,
    updated_at: now,
    last_synced_at: now,
  };

  const { data: existing } = await supabaseAdmin
    .from("user_payout_accounts")
    .select("id")
    .eq("user_id", userId)
    .eq("provider", "stripe")
    .maybeSingle();

  if (existing?.id) {
    await supabaseAdmin
      .from("user_payout_accounts")
      .update(payload)
      .eq("id", existing.id);
    return;
  }

  await supabaseAdmin.from("user_payout_accounts").insert({
    user_id: userId,
    workspace_role: "guru",
    ...payload,
    created_at: now,
  });
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
      guru?.stripe_onboarding_complete === true &&
      guru?.charges_enabled === true &&
      guru?.payouts_enabled === true,
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
