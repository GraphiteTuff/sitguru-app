/**
 * Map Stripe Connect account state into SitGuru-friendly statuses.
 *
 * Do not treat "connected account ID exists" as payment-ready.
 * Use Stripe capability / requirement fields.
 */

export type StripeConnectStatusKey =
  | "not_started"
  | "started"
  | "action_required"
  | "under_review"
  | "ready";

export type StripeConnectStatusResult = {
  key: StripeConnectStatusKey;
  /** Admin / user-facing label */
  label: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  hasBlockingRequirements: boolean;
};

export type StripeAccountLike = {
  id?: string | null;
  charges_enabled?: boolean | null;
  payouts_enabled?: boolean | null;
  details_submitted?: boolean | null;
  requirements?: {
    currently_due?: string[] | null;
    past_due?: string[] | null;
    pending_verification?: string[] | null;
    disabled_reason?: string | null;
  } | null;
  capabilities?: Record<string, string | null | undefined> | null;
};

export type GuruStripeFields = {
  stripe_account_id?: string | null;
  stripe_connect_status?: string | null;
  stripe_onboarding_complete?: boolean | null;
  charges_enabled?: boolean | null;
  payouts_enabled?: boolean | null;
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function hasBlockingRequirements(account: StripeAccountLike | null | undefined) {
  if (!account?.requirements) return false;

  const currentlyDue = asStringArray(account.requirements.currently_due);
  const pastDue = asStringArray(account.requirements.past_due);
  return currentlyDue.length > 0 || pastDue.length > 0;
}

function hasPendingVerification(account: StripeAccountLike | null | undefined) {
  if (!account?.requirements) return false;
  return asStringArray(account.requirements.pending_verification).length > 0;
}

export function stripeConnectStatusLabel(
  key: StripeConnectStatusKey,
): string {
  switch (key) {
    case "not_started":
      return "Not Started";
    case "started":
      return "Started";
    case "action_required":
      return "Action required";
    case "under_review":
      return "Under review";
    case "ready":
      return "Ready";
    default:
      return "Not Started";
  }
}

/**
 * Prefer live Stripe account fields when available; otherwise derive from
 * stored Guru columns (never treat a bare account ID as Ready).
 */
export function resolveStripeConnectStatus(input: {
  guru?: GuruStripeFields | null;
  stripeAccount?: StripeAccountLike | null;
}): StripeConnectStatusResult {
  const guru = input.guru || null;
  const account = input.stripeAccount || null;
  const accountId =
    (account?.id && String(account.id).trim()) ||
    (guru?.stripe_account_id && String(guru.stripe_account_id).trim()) ||
    "";

  if (!accountId) {
    return {
      key: "not_started",
      label: stripeConnectStatusLabel("not_started"),
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
      hasBlockingRequirements: false,
    };
  }

  const chargesEnabled =
    account?.charges_enabled === true || guru?.charges_enabled === true;
  const payoutsEnabled =
    account?.payouts_enabled === true || guru?.payouts_enabled === true;
  const detailsSubmitted =
    account?.details_submitted === true ||
    guru?.stripe_onboarding_complete === true ||
    chargesEnabled ||
    payoutsEnabled;

  const blocking = hasBlockingRequirements(account);
  const pending = hasPendingVerification(account);

  if (chargesEnabled && payoutsEnabled && !blocking) {
    return {
      key: "ready",
      label: stripeConnectStatusLabel("ready"),
      chargesEnabled,
      payoutsEnabled,
      detailsSubmitted: true,
      hasBlockingRequirements: false,
    };
  }

  if (blocking) {
    return {
      key: "action_required",
      label: stripeConnectStatusLabel("action_required"),
      chargesEnabled,
      payoutsEnabled,
      detailsSubmitted,
      hasBlockingRequirements: true,
    };
  }

  if (pending || (detailsSubmitted && (!chargesEnabled || !payoutsEnabled))) {
    return {
      key: "under_review",
      label: stripeConnectStatusLabel("under_review"),
      chargesEnabled,
      payoutsEnabled,
      detailsSubmitted,
      hasBlockingRequirements: false,
    };
  }

  // Account exists but onboarding not finished — never "Not Started".
  const stored = String(guru?.stripe_connect_status || "")
    .trim()
    .toLowerCase();
  if (
    stored === "connected" ||
    stored === "ready" ||
    stored === "complete" ||
    stored === "completed" ||
    stored === "enabled" ||
    stored === "verified"
  ) {
    // Stored says ready but live flags disagree — treat as under review /
    // action required rather than Not Started.
    return {
      key: chargesEnabled && payoutsEnabled ? "ready" : "under_review",
      label: stripeConnectStatusLabel(
        chargesEnabled && payoutsEnabled ? "ready" : "under_review",
      ),
      chargesEnabled,
      payoutsEnabled,
      detailsSubmitted,
      hasBlockingRequirements: false,
    };
  }

  return {
    key: "started",
    label: stripeConnectStatusLabel("started"),
    chargesEnabled,
    payoutsEnabled,
    detailsSubmitted,
    hasBlockingRequirements: false,
  };
}

/** Persistable stripe_connect_status string used by existing Guru writers. */
export function toStoredStripeConnectStatus(
  key: StripeConnectStatusKey,
): string {
  switch (key) {
    case "not_started":
      return "not_started";
    case "started":
      return "onboarding_started";
    case "action_required":
      return "action_required";
    case "under_review":
      return "pending";
    case "ready":
      return "connected";
    default:
      return "not_started";
  }
}

/**
 * Build status from a retrieved Stripe Account object for sync writers.
 */
export function connectStatusFromStripeAccount(
  account: StripeAccountLike,
): StripeConnectStatusResult {
  return resolveStripeConnectStatus({ stripeAccount: account });
}
