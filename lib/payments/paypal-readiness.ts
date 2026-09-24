export type PaypalReadinessTone = "ready" | "pending" | "disconnected";

export type PaypalMerchantReadinessInput = {
  status?: string | null;
  paymentsReceivable?: boolean | null;
  environment?: string | null;
};

export type PaypalMerchantReadiness = {
  label: string;
  sentence: string;
  tone: PaypalReadinessTone;
  environmentLabel: "Test" | "Live" | "Unknown";
  /** Connected with payments receivable in this environment. */
  canReceiveInEnvironment: boolean;
  /** Live customer PayPal/Venmo. Sandbox is never live-ready. */
  canReceiveLivePayments: boolean;
};

function normalizeStatus(status: string | null | undefined) {
  return (status || "").trim().toLowerCase();
}

function normalizeEnvironment(environment: string | null | undefined) {
  const value = (environment || "").trim().toLowerCase();
  if (value === "sandbox" || value === "test") return "sandbox";
  if (value === "live" || value === "production") return "live";
  return "unknown";
}

export function describePaypalMerchantReadiness(
  input: PaypalMerchantReadinessInput,
): PaypalMerchantReadiness {
  const status = normalizeStatus(input.status);
  const environment = normalizeEnvironment(input.environment);
  const paymentsReceivable = input.paymentsReceivable === true;
  const environmentLabel =
    environment === "sandbox" ? "Test" : environment === "live" ? "Live" : "Unknown";
  const connectedAndReceivable = status === "connected" && paymentsReceivable;
  const canReceiveLivePayments = connectedAndReceivable && environment === "live";

  if (status === "disconnected") {
    return {
      label: "Disconnected",
      sentence: "Guru needs to reconnect PayPal.",
      tone: "disconnected",
      environmentLabel,
      canReceiveInEnvironment: false,
      canReceiveLivePayments: false,
    };
  }

  if (status === "referral_created") {
    return {
      label: "Setup Started",
      sentence: "Guru still needs to finish PayPal setup.",
      tone: "pending",
      environmentLabel,
      canReceiveInEnvironment: false,
      canReceiveLivePayments: false,
    };
  }

  if (connectedAndReceivable && environment === "sandbox") {
    return {
      label: "Ready",
      sentence:
        "PayPal and Venmo can be received in the test environment only. Live customer payments are not enabled.",
      tone: "ready",
      environmentLabel,
      canReceiveInEnvironment: true,
      canReceiveLivePayments: false,
    };
  }

  if (canReceiveLivePayments) {
    return {
      label: "Ready",
      sentence: "PayPal and Venmo payments can be received.",
      tone: "ready",
      environmentLabel,
      canReceiveInEnvironment: true,
      canReceiveLivePayments: true,
    };
  }

  if (status === "pending" || status === "connected" || status === "limited") {
    return {
      label: "Setup Pending",
      sentence: "Waiting for PayPal onboarding to be completed.",
      tone: "pending",
      environmentLabel,
      canReceiveInEnvironment: false,
      canReceiveLivePayments: false,
    };
  }

  return {
    label: "Setup Started",
    sentence: "Guru still needs to finish PayPal setup.",
    tone: "pending",
    environmentLabel,
    canReceiveInEnvironment: false,
    canReceiveLivePayments: false,
  };
}

export function countPaypalMerchantReadiness(
  accounts: PaypalMerchantReadinessInput[],
) {
  let liveReady = 0;
  let testReady = 0;

  for (const account of accounts) {
    const readiness = describePaypalMerchantReadiness(account);
    if (readiness.canReceiveLivePayments) liveReady += 1;
    else if (readiness.canReceiveInEnvironment) testReady += 1;
  }

  return {
    total: accounts.length,
    liveReady,
    testReady,
  };
}

export function paypalReadinessStatusMessage(accounts: PaypalMerchantReadinessInput[]) {
  const counts = countPaypalMerchantReadiness(accounts);
  if (counts.total === 0) return "No PayPal merchant accounts yet.";
  return `${counts.liveReady} live ready · ${counts.testReady} test only · ${counts.total} merchants`;
}

/**
 * Booking checkout still creates a Stripe session. PayPal and Venmo must stay
 * refused until a PayPal order exists, even when the marketplace flag is on.
 */
export function paypalCheckoutChargeAllowed() {
  return false;
}
