export type SitGuruRole =
  | "pet_parent"
  | "guru"
  | "ambassador"
  | "admin";

export type PaymentProcessor = "stripe" | "paypal";

export type CustomerPaymentMethodId =
  | "cards"
  | "apple_pay"
  | "google_pay"
  | "paypal"
  | "venmo"
  | "pay_later"
  | "link"
  | "cash_app_pay"
  | "bank_pay";

export type EarningsMethodId =
  | "stripe_connect"
  | "paypal_merchant"
  | "paypal_rewards"
  | "venmo_rewards";

export type PaymentMethodStatus =
  | "active"
  | "conditional"
  | "coming_soon"
  | "disabled";

export type PaymentPlacement =
  | "homepage"
  | "search"
  | "guru_profile"
  | "booking_summary"
  | "checkout"
  | "pet_parent_guide"
  | "guru_earnings"
  | "guru_success_center"
  | "ambassador_rewards"
  | "help_center"
  | "booking_confirmation"
  | "payment_faq";

export type PaymentIconKey =
  | "card"
  | "apple"
  | "google"
  | "paypal"
  | "venmo"
  | "pay_later"
  | "link"
  | "cash_app"
  | "bank"
  | "stripe";

export type CustomerPaymentMethod = {
  id: CustomerPaymentMethodId;
  label: string;
  shortLabel: string;
  iconKey: PaymentIconKey;
  processors: PaymentProcessor[];
  roles: SitGuruRole[];
  placements: PaymentPlacement[];
  status: PaymentMethodStatus;
  advertised: boolean;
  checkoutSelectable: boolean;
  displayOrder: number;
  description: string;
  availabilityNote: string;
  requiresCompatibleDevice?: boolean;
  requiresProviderApproval?: boolean;
  requiresEligibleAccount?: boolean;
};

export type EarningsMethod = {
  id: EarningsMethodId;
  label: string;
  shortLabel: string;
  iconKey: PaymentIconKey;
  processor: PaymentProcessor;
  roles: SitGuruRole[];
  status: PaymentMethodStatus;
  displayOrder: number;
  description: string;
  setupSummary: string;
  customerMethods?: CustomerPaymentMethodId[];
};

export const PAYMENT_PROCESSOR_LABELS: Record<PaymentProcessor, string> = {
  stripe: "Stripe",
  paypal: "PayPal",
};

export const CUSTOMER_PAYMENT_METHODS: CustomerPaymentMethod[] = [
  {
    id: "cards",
    label: "Credit or debit card",
    shortLabel: "Cards",
    iconKey: "card",
    processors: ["stripe", "paypal"],
    roles: ["pet_parent"],
    placements: [
      "homepage",
      "search",
      "guru_profile",
      "booking_summary",
      "checkout",
      "pet_parent_guide",
      "guru_earnings",
      "guru_success_center",
      "help_center",
      "booking_confirmation",
      "payment_faq",
    ],
    status: "active",
    advertised: true,
    checkoutSelectable: true,
    displayOrder: 10,
    description:
      "Pay securely with an eligible major credit or debit card.",
    availabilityNote:
      "Card availability depends on the selected booking and connected payment provider.",
  },
  {
    id: "apple_pay",
    label: "Apple Pay",
    shortLabel: "Apple Pay",
    iconKey: "apple",
    processors: ["stripe", "paypal"],
    roles: ["pet_parent"],
    placements: [
      "homepage",
      "guru_profile",
      "booking_summary",
      "checkout",
      "pet_parent_guide",
      "guru_earnings",
      "guru_success_center",
      "help_center",
      "payment_faq",
    ],
    status: "conditional",
    advertised: true,
    checkoutSelectable: true,
    displayOrder: 20,
    description:
      "Use Apple Pay on a compatible Apple device when it is available for the booking.",
    availabilityNote:
      "Requires an eligible Apple device, browser, wallet, domain configuration, and supported payment provider.",
    requiresCompatibleDevice: true,
    requiresProviderApproval: true,
    requiresEligibleAccount: true,
  },
  {
    id: "google_pay",
    label: "Google Pay",
    shortLabel: "Google Pay",
    iconKey: "google",
    processors: ["stripe", "paypal"],
    roles: ["pet_parent"],
    placements: [
      "homepage",
      "guru_profile",
      "booking_summary",
      "checkout",
      "pet_parent_guide",
      "guru_earnings",
      "guru_success_center",
      "help_center",
      "payment_faq",
    ],
    status: "conditional",
    advertised: true,
    checkoutSelectable: true,
    displayOrder: 30,
    description:
      "Use Google Pay on a compatible device when it is available for the booking.",
    availabilityNote:
      "Requires a compatible device, browser, wallet, and supported payment-provider configuration.",
    requiresCompatibleDevice: true,
    requiresProviderApproval: true,
    requiresEligibleAccount: true,
  },
  {
    id: "paypal",
    label: "PayPal",
    shortLabel: "PayPal",
    iconKey: "paypal",
    processors: ["paypal"],
    roles: ["pet_parent"],
    placements: [
      "homepage",
      "search",
      "guru_profile",
      "booking_summary",
      "checkout",
      "pet_parent_guide",
      "guru_earnings",
      "guru_success_center",
      "help_center",
      "booking_confirmation",
      "payment_faq",
    ],
    status: "conditional",
    advertised: true,
    checkoutSelectable: true,
    displayOrder: 40,
    description:
      "Pay with an eligible PayPal account when the Guru is connected to PayPal.",
    availabilityNote:
      "Available only for eligible bookings supported by the connected Guru's PayPal setup.",
    requiresProviderApproval: true,
    requiresEligibleAccount: true,
  },
  {
    id: "venmo",
    label: "Venmo",
    shortLabel: "Venmo",
    iconKey: "venmo",
    processors: ["paypal"],
    roles: ["pet_parent"],
    placements: [
      "homepage",
      "guru_profile",
      "booking_summary",
      "checkout",
      "pet_parent_guide",
      "guru_earnings",
      "guru_success_center",
      "help_center",
      "payment_faq",
    ],
    status: "conditional",
    advertised: true,
    checkoutSelectable: true,
    displayOrder: 50,
    description:
      "Pay with Venmo when the buyer, device, booking, and PayPal configuration are eligible.",
    availabilityNote:
      "Venmo availability varies by buyer account, device, country, booking, and PayPal eligibility.",
    requiresCompatibleDevice: true,
    requiresProviderApproval: true,
    requiresEligibleAccount: true,
  },
  {
    id: "pay_later",
    label: "Pay Later",
    shortLabel: "Pay Later",
    iconKey: "pay_later",
    processors: ["paypal", "stripe"],
    roles: ["pet_parent"],
    placements: [
      "homepage",
      "guru_profile",
      "booking_summary",
      "checkout",
      "pet_parent_guide",
      "guru_success_center",
      "help_center",
      "payment_faq",
    ],
    status: "conditional",
    advertised: true,
    checkoutSelectable: true,
    displayOrder: 60,
    description:
      "Eligible buyers may be offered a Pay Later option during checkout.",
    availabilityNote:
      "Subject to buyer eligibility, provider approval, booking amount, location, and financing terms.",
    requiresProviderApproval: true,
    requiresEligibleAccount: true,
  },
  {
    id: "link",
    label: "Link",
    shortLabel: "Link",
    iconKey: "link",
    processors: ["stripe"],
    roles: ["pet_parent"],
    placements: [
      "homepage",
      "guru_profile",
      "booking_summary",
      "checkout",
      "pet_parent_guide",
      "guru_earnings",
      "guru_success_center",
      "help_center",
      "payment_faq",
    ],
    status: "conditional",
    advertised: true,
    checkoutSelectable: true,
    displayOrder: 70,
    description:
      "Use Link for a faster Stripe-supported checkout when eligible.",
    availabilityNote:
      "Link is shown only when the connected Stripe configuration and buyer are eligible.",
    requiresEligibleAccount: true,
  },
  {
    id: "cash_app_pay",
    label: "Cash App Pay",
    shortLabel: "Cash App Pay",
    iconKey: "cash_app",
    processors: ["stripe"],
    roles: ["pet_parent"],
    placements: [
      "homepage",
      "guru_profile",
      "booking_summary",
      "checkout",
      "pet_parent_guide",
      "guru_earnings",
      "guru_success_center",
      "help_center",
      "payment_faq",
    ],
    status: "conditional",
    advertised: true,
    checkoutSelectable: true,
    displayOrder: 80,
    description:
      "Use Cash App Pay when the booking and connected Stripe account are eligible.",
    availabilityNote:
      "Availability depends on the buyer, device, country, currency, booking, and Stripe configuration.",
    requiresCompatibleDevice: true,
    requiresEligibleAccount: true,
  },
  {
    id: "bank_pay",
    label: "Bank payment",
    shortLabel: "Bank Pay",
    iconKey: "bank",
    processors: ["stripe"],
    roles: ["pet_parent"],
    placements: [
      "homepage",
      "guru_profile",
      "booking_summary",
      "checkout",
      "pet_parent_guide",
      "guru_success_center",
      "help_center",
      "payment_faq",
    ],
    status: "conditional",
    advertised: true,
    checkoutSelectable: true,
    displayOrder: 90,
    description:
      "Pay from an eligible bank account when bank payment is offered for the booking.",
    availabilityNote:
      "Bank payment can take longer to confirm and may not be available for every booking.",
    requiresProviderApproval: true,
    requiresEligibleAccount: true,
  },
];

export const GURU_EARNINGS_METHODS: EarningsMethod[] = [
  {
    id: "paypal_merchant",
    label: "PayPal",
    shortLabel: "PayPal",
    iconKey: "paypal",
    processor: "paypal",
    roles: ["guru"],
    status: "conditional",
    displayOrder: 10,
    description:
      "Connect an eligible PayPal account so Pet Parents can use supported PayPal payment options for eligible bookings.",
    setupSummary:
      "Sign in with the PayPal account you already use or create one securely. PayPal will show only the steps required for that account.",
    customerMethods: [
      "paypal",
      "venmo",
      "cards",
      "pay_later",
      "apple_pay",
      "google_pay",
    ],
  },
  {
    id: "stripe_connect",
    label: "Stripe",
    shortLabel: "Stripe",
    iconKey: "stripe",
    processor: "stripe",
    roles: ["guru"],
    status: "active",
    displayOrder: 20,
    description:
      "Connect Stripe securely to receive eligible booking earnings and support additional customer payment methods.",
    setupSummary:
      "Follow Stripe's secure instructions to verify your identity and connect an eligible payout account.",
    customerMethods: [
      "cards",
      "apple_pay",
      "google_pay",
      "link",
      "cash_app_pay",
      "bank_pay",
      "pay_later",
    ],
  },
];

export const AMBASSADOR_REWARD_METHODS: EarningsMethod[] = [
  {
    id: "paypal_rewards",
    label: "PayPal",
    shortLabel: "PayPal",
    iconKey: "paypal",
    processor: "paypal",
    roles: ["ambassador"],
    status: "conditional",
    displayOrder: 10,
    description:
      "Receive approved Ambassador commissions, referral payments, and rewards through an eligible PayPal account.",
    setupSummary:
      "Connect the PayPal account you already use or follow PayPal's secure account setup steps.",
  },
  {
    id: "venmo_rewards",
    label: "Venmo",
    shortLabel: "Venmo",
    iconKey: "venmo",
    processor: "paypal",
    roles: ["ambassador"],
    status: "conditional",
    displayOrder: 20,
    description:
      "Receive eligible Ambassador rewards through the U.S. mobile number connected to Venmo.",
    setupSummary:
      "Confirm the eligible U.S. mobile number associated with your Venmo account.",
  },
];

export const SITEWIDE_PAYMENT_HEADING = "Pay your way with SitGuru";

export const SITEWIDE_PAYMENT_SUBHEADING =
  "Multiple secure ways to pay. Simple ways to earn.";

export const SITEWIDE_PAYMENT_AVAILABILITY_NOTE =
  "Available options vary by booking, device, account, location, and payment provider and are shown securely at checkout.";

export const SITEWIDE_PAYMENT_STRIP_METHOD_IDS: CustomerPaymentMethodId[] = [
  "cards",
  "apple_pay",
  "google_pay",
  "paypal",
  "venmo",
  "pay_later",
  "link",
  "cash_app_pay",
  "bank_pay",
];

export const GURU_EARNINGS_HEADING = "Choose how to receive booking earnings";

export const GURU_EARNINGS_SUPPORTING_TEXT =
  "Connect one supported provider to begin. Connect both when available to give Pet Parents more ways to pay.";

export const AMBASSADOR_REWARDS_HEADING =
  "Choose how to receive SitGuru rewards";

export const AMBASSADOR_REWARDS_SUPPORTING_TEXT =
  "Receive approved commissions, referral payments, and Ambassador rewards through PayPal or Venmo.";

export const PET_PARENT_PAYMENT_GUIDE_STEPS = [
  {
    step: 1,
    title: "Choose a Guru",
    description:
      "Select the trusted local Guru and pet-care service that fits your needs.",
  },
  {
    step: 2,
    title: "Review your booking",
    description:
      "Check the service, dates, care details, pricing, and Marketplace Support information.",
  },
  {
    step: 3,
    title: "Choose how to pay",
    description:
      "SitGuru shows the secure payment options available for that booking.",
  },
  {
    step: 4,
    title: "Confirm payment",
    description:
      "Complete payment and receive a clear booking and payment confirmation.",
  },
] as const;

export const GURU_PAYPAL_ONBOARDING_STEPS = [
  {
    step: 1,
    title: "Select Connect PayPal",
    description:
      "Open Earnings and choose PayPal as a way to receive eligible booking earnings.",
  },
  {
    step: 2,
    title: "Sign in or create an account",
    description:
      "Use the PayPal account you already have or create one securely.",
  },
  {
    step: 3,
    title: "Review and approve",
    description:
      "Follow PayPal's instructions and approve the SitGuru connection.",
  },
  {
    step: 4,
    title: "Return to SitGuru",
    description:
      "SitGuru checks the connection and shows whether you are ready or another PayPal step is required.",
  },
] as const;

export const GURU_STRIPE_ONBOARDING_STEPS = [
  {
    step: 1,
    title: "Select Connect Stripe",
    description:
      "Open Earnings and choose Stripe as a way to receive eligible booking earnings.",
  },
  {
    step: 2,
    title: "Verify your information",
    description:
      "Follow Stripe's secure instructions and provide only the information Stripe requests.",
  },
  {
    step: 3,
    title: "Connect your payout account",
    description:
      "Connect or enter an eligible account for receiving payouts.",
  },
  {
    step: 4,
    title: "Return to SitGuru",
    description:
      "SitGuru checks the connection and shows your actual payout-readiness status.",
  },
] as const;

export const AMBASSADOR_REWARD_ONBOARDING_STEPS = [
  {
    step: 1,
    title: "Open Earnings & Rewards",
    description:
      "View approved referrals, activities, commissions, and pending rewards.",
  },
  {
    step: 2,
    title: "Choose PayPal or Venmo",
    description:
      "Select the supported option you want to use for eligible SitGuru rewards.",
  },
  {
    step: 3,
    title: "Connect your account",
    description:
      "Sign in with PayPal or confirm the eligible U.S. mobile number connected to Venmo.",
  },
  {
    step: 4,
    title: "Complete required information",
    description:
      "Provide any required payout or tax information securely when SitGuru requests it.",
  },
  {
    step: 5,
    title: "Track your reward",
    description:
      "See clear statuses from approval through processing and confirmed payment.",
  },
] as const;

export function getCustomerPaymentMethod(
  id: CustomerPaymentMethodId,
): CustomerPaymentMethod | undefined {
  return CUSTOMER_PAYMENT_METHODS.find((method) => method.id === id);
}

export function getAdvertisedCustomerPaymentMethods() {
  return CUSTOMER_PAYMENT_METHODS.filter(
    (method) => method.advertised && method.status !== "disabled",
  ).sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getCustomerPaymentMethodsForPlacement(
  placement: PaymentPlacement,
) {
  return CUSTOMER_PAYMENT_METHODS.filter(
    (method) =>
      method.advertised &&
      method.status !== "disabled" &&
      method.placements.includes(placement),
  ).sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getCheckoutSelectablePaymentMethods() {
  return CUSTOMER_PAYMENT_METHODS.filter(
    (method) =>
      method.checkoutSelectable &&
      method.status !== "disabled" &&
      method.roles.includes("pet_parent"),
  ).sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getPaymentMethodsForProcessor(
  processor: PaymentProcessor,
) {
  return CUSTOMER_PAYMENT_METHODS.filter(
    (method) =>
      method.processors.includes(processor) &&
      method.status !== "disabled",
  ).sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getGuruEarningsMethods() {
  return [...GURU_EARNINGS_METHODS].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );
}

export function getAmbassadorRewardMethods() {
  return [...AMBASSADOR_REWARD_METHODS].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );
}

export function getSitewidePaymentStripMethods() {
  return SITEWIDE_PAYMENT_STRIP_METHOD_IDS.map(getCustomerPaymentMethod).filter(
    (method): method is CustomerPaymentMethod => Boolean(method),
  );
}

export function getSitewidePaymentStripText(separator = " · ") {
  return getSitewidePaymentStripMethods()
    .map((method) => method.shortLabel)
    .join(separator);
}

export function isPaymentMethodAvailableForRole(
  methodId: CustomerPaymentMethodId,
  role: SitGuruRole,
) {
  const method = getCustomerPaymentMethod(methodId);

  return Boolean(
    method &&
      method.status !== "disabled" &&
      method.roles.includes(role),
  );
}

export function getPaymentProcessorLabel(processor: PaymentProcessor) {
  return PAYMENT_PROCESSOR_LABELS[processor];
}