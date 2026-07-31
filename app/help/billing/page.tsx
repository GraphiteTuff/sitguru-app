import type { Metadata } from "next";
import HelpCategoryHub from "@/components/help/HelpCategoryHub";

export const metadata: Metadata = {
  title: "Billing & Refunds",
  description:
    "SitGuru checkout, Stripe payouts, tips, credits, promo codes, and refund help.",
};

export default function BillingHubPage() {
  return (
    <HelpCategoryHub
      category="Billing & Refunds"
      title="Billing & Refunds"
      description="Checkout, Stripe payouts, tips, credits, promo codes, and refund questions."
    />
  );
}
