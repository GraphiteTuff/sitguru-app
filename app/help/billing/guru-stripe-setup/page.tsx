import type { Metadata } from "next";
import HelpArticleChrome from "@/components/help/HelpArticleChrome";
import { HelpNumberedSteps } from "@/components/help/HelpFaqList";
import { guruStripeSteps } from "@/lib/help/content";

export const metadata: Metadata = {
  title: "Guru Stripe Setup Guide",
  description:
    "Connect Stripe for booking payouts, tips, commission, and referral earnings.",
};

export default function GuruStripeSetupPage() {
  return (
    <HelpArticleChrome
      eyebrow="Billing & Refunds"
      title="Guru Stripe setup"
      summary="Complete Stripe so eligible SitGuru booking payouts, tips, commission, and referral earnings route correctly."
      backHref="/help/billing"
      backLabel="Back to Billing & Refunds"
    >
      <section>
        <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
          Setup steps
        </h2>
        <HelpNumberedSteps steps={guruStripeSteps} />
        <ul className="mt-5 space-y-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
          <li>• Booking payouts</li>
          <li>• Tips routed through SitGuru</li>
          <li>• Commission and referral earnings</li>
        </ul>
      </section>
    </HelpArticleChrome>
  );
}
