import type { Metadata } from "next";
import HelpArticleChrome from "@/components/help/HelpArticleChrome";
import PremiumPaymentsGraphic from "@/components/help/PremiumPaymentsGraphic";
import { HelpFaqList, HelpStepBlocks } from "@/components/help/HelpFaqList";
import { billingFaqs, paymentFlows } from "@/lib/help/content";
import {
  PREMIUM_PAYMENTS_CUSTOMER_SENTENCE,
  PREMIUM_PAYMENTS_PUBLIC_SRC,
  PREMIUM_PAYMENTS_TRUST_SENTENCE,
} from "@/lib/help/premium-payments";

export const metadata: Metadata = {
  title: "Payments, Payouts, Tips & Credits",
  description: PREMIUM_PAYMENTS_CUSTOMER_SENTENCE,
};

export default function PaymentsAndPayoutsPage() {
  return (
    <HelpArticleChrome
      eyebrow="Billing & Refunds"
      title="Payments, payouts, tips & credits"
      summary={`${PREMIUM_PAYMENTS_CUSTOMER_SENTENCE} Receipts, tips, PawReports, and refund reviews stay connected to the SitGuru booking.`}
      backHref="/help/billing"
      backLabel="Back to Billing & Refunds"
      jumps={[
        { href: "#flows", label: "Role flows" },
        { href: "#faq", label: "FAQ" },
      ]}
    >
      <PremiumPaymentsGraphic src={PREMIUM_PAYMENTS_PUBLIC_SRC} />
      <p className="text-sm font-semibold leading-6 text-slate-600">
        {PREMIUM_PAYMENTS_TRUST_SENTENCE}
      </p>
      <section id="flows" className="scroll-mt-28">
        <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
          Role-by-role payment flows
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          Pay in SitGuru checkout with Stripe, PayPal, Apple Pay, Google Pay,
          Venmo, or Plaid. Gurus and Ambassadors receive eligible earnings on
          SitGuru. Off-platform personal payments are not allowed.
        </p>
        <div className="mt-4">
          <HelpStepBlocks blocks={paymentFlows} />
        </div>
      </section>

      <section id="faq" className="scroll-mt-28">
        <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
          Billing FAQ
        </h2>
        <div className="mt-4">
          <HelpFaqList items={billingFaqs} />
        </div>
      </section>
    </HelpArticleChrome>
  );
}
