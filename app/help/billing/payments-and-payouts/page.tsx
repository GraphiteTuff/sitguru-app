import type { Metadata } from "next";
import HelpArticleChrome from "@/components/help/HelpArticleChrome";
import { HelpFaqList, HelpStepBlocks } from "@/components/help/HelpFaqList";
import { billingFaqs, paymentFlows } from "@/lib/help/content";

export const metadata: Metadata = {
  title: "Payments, Payouts, Tips & Credits",
  description:
    "SitGuru-only checkout, Stripe payouts, tips, promo codes, and refund help.",
};

export default function PaymentsAndPayoutsPage() {
  return (
    <HelpArticleChrome
      eyebrow="Billing & Refunds"
      title="Payments, payouts, tips & credits"
      summary="Everything stays on SitGuru checkout and Stripe — receipts, tips, PawReports, and refund reviews stay connected to the booking."
      backHref="/help/billing"
      backLabel="Back to Billing & Refunds"
      jumps={[
        { href: "#flows", label: "Role flows" },
        { href: "#faq", label: "FAQ" },
      ]}
    >
      <section id="flows" className="scroll-mt-28">
        <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
          Role-by-role payment flows
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          Pet Parents pay in checkout. Gurus and Ambassadors receive eligible
          earnings through Stripe. Off-platform payments are not allowed for
          SitGuru bookings.
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
