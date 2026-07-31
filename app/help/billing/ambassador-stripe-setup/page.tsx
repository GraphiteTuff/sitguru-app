import type { Metadata } from "next";
import HelpArticleChrome from "@/components/help/HelpArticleChrome";
import { HelpNumberedSteps } from "@/components/help/HelpFaqList";
import { ambassadorStripeSteps } from "@/lib/help/content";

export const metadata: Metadata = {
  title: "Ambassador Stripe Setup Guide",
  description:
    "Connect Stripe for eligible ambassador, commission, and referral payouts.",
};

export default function AmbassadorStripeSetupPage() {
  return (
    <HelpArticleChrome
      eyebrow="Billing & Refunds"
      title="Ambassador Stripe setup"
      summary="Complete Stripe payout setup and keep Pet Parents and Gurus on SitGuru checkout and referral links."
      backHref="/help/billing"
      backLabel="Back to Billing & Refunds"
    >
      <section>
        <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
          Setup steps
        </h2>
        <HelpNumberedSteps steps={ambassadorStripeSteps} />
        <ul className="mt-5 space-y-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
          <li>• Ambassador payouts</li>
          <li>• Referral activity</li>
          <li>• Commission earnings</li>
        </ul>
      </section>
    </HelpArticleChrome>
  );
}
