import type { Metadata } from "next";
import HelpCategoryHub from "@/components/help/HelpCategoryHub";
import PremiumPaymentsGraphic from "@/components/help/PremiumPaymentsGraphic";
import {
  PREMIUM_PAYMENTS_CUSTOMER_SENTENCE,
  PREMIUM_PAYMENTS_PUBLIC_SRC,
} from "@/lib/help/premium-payments";

export const metadata: Metadata = {
  title: "Billing & Refunds",
  description: PREMIUM_PAYMENTS_CUSTOMER_SENTENCE,
};

export default function BillingHubPage() {
  return (
    <HelpCategoryHub
      category="Billing & Refunds"
      title="Billing & Refunds"
      description={`${PREMIUM_PAYMENTS_CUSTOMER_SENTENCE} Checkout, payouts, tips, credits, promo codes, and refund questions stay on SitGuru.`}
      lead={<PremiumPaymentsGraphic src={PREMIUM_PAYMENTS_PUBLIC_SRC} />}
    />
  );
}
