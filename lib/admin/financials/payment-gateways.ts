export type PaymentGatewayId =
  | "stripe"
  | "paypal"
  | "apple_pay"
  | "google_pay"
  | "venmo"
  | "plaid";

export type PaymentGatewayRange =
  | "today"
  | "week"
  | "month"
  | "quarter"
  | "annual"
  | "ytd";

export type PaymentGatewayFilter = PaymentGatewayId | "all";

export type PaymentGatewayMeta = {
  id: PaymentGatewayId;
  label: string;
  shortLabel: string;
  logoSrc: string | null;
  role: "processor" | "wallet" | "banking";
  parentProcessor: "stripe" | "paypal" | "plaid" | null;
  description: string;
};

export const PAYMENT_GATEWAY_META: PaymentGatewayMeta[] = [
  {
    id: "stripe",
    label: "Stripe",
    shortLabel: "Stripe",
    logoSrc: "/images/payments/stripe.svg",
    role: "processor",
    parentProcessor: "stripe",
    description:
      "Cards, Link, Cash App Pay, bank pay, and Stripe-settled wallet traffic.",
  },
  {
    id: "paypal",
    label: "PayPal",
    shortLabel: "PayPal",
    logoSrc: "/images/payments/paypal.svg",
    role: "processor",
    parentProcessor: "paypal",
    description:
      "PayPal checkout, merchant onboarding, and PayPal-settled wallet traffic.",
  },
  {
    id: "apple_pay",
    label: "Apple Pay",
    shortLabel: "Apple Pay",
    logoSrc: "/images/payments/apple-pay.svg",
    role: "wallet",
    parentProcessor: "stripe",
    description:
      "Apple Pay wallet checkouts settled through Stripe or PayPal when eligible.",
  },
  {
    id: "google_pay",
    label: "Google Pay",
    shortLabel: "Google Pay",
    logoSrc: "/images/payments/google-pay.svg",
    role: "wallet",
    parentProcessor: "stripe",
    description:
      "Google Pay wallet checkouts settled through Stripe or PayPal when eligible.",
  },
  {
    id: "venmo",
    label: "Venmo",
    shortLabel: "Venmo",
    logoSrc: "/images/payments/venmo.svg",
    role: "wallet",
    parentProcessor: "paypal",
    description:
      "Venmo checkout and Ambassador reward payouts when PayPal eligibility allows.",
  },
  {
    id: "plaid",
    label: "Plaid / NFCU",
    shortLabel: "Plaid",
    logoSrc: null,
    role: "banking",
    parentProcessor: "plaid",
    description:
      "Business banking sync, balances, and payout deposit matching for reconciliation.",
  },
];

export function getPaymentGatewayMeta(id: PaymentGatewayId) {
  return PAYMENT_GATEWAY_META.find((gateway) => gateway.id === id);
}

export function parsePaymentGatewayFilter(
  value: string | null | undefined,
): PaymentGatewayFilter {
  const normalized = (value || "all").trim().toLowerCase();

  if (normalized === "all") return "all";

  if (
    PAYMENT_GATEWAY_META.some((gateway) => gateway.id === normalized)
  ) {
    return normalized as PaymentGatewayId;
  }

  return "all";
}

export function classifyPaymentGateway(input: {
  provider?: string | null;
  paymentMethodType?: string | null;
  paymentMethodLabel?: string | null;
  description?: string | null;
  source?: string | null;
}): PaymentGatewayId {
  const haystack = [
    input.provider,
    input.paymentMethodType,
    input.paymentMethodLabel,
    input.description,
    input.source,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    haystack.includes("plaid") ||
    haystack.includes("nfcu") ||
    haystack.includes("bank deposit") ||
    haystack.includes("banking")
  ) {
    return "plaid";
  }

  if (haystack.includes("apple")) return "apple_pay";
  if (haystack.includes("google")) return "google_pay";
  if (haystack.includes("venmo")) return "venmo";
  if (haystack.includes("paypal")) return "paypal";

  return "stripe";
}
