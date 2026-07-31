import type { Metadata } from "next";
import HelpArticleChrome from "@/components/help/HelpArticleChrome";
import { HelpNumberedSteps } from "@/components/help/HelpFaqList";
import { parentPaymentSteps } from "@/lib/help/content";

export const metadata: Metadata = {
  title: "Pet Parent Payment Guide",
  description:
    "Pay securely through SitGuru checkout with cards, wallets, credits, and tips.",
};

export default function ParentPaymentGuidePage() {
  return (
    <HelpArticleChrome
      eyebrow="Billing & Refunds"
      title="Pet Parent payment guide"
      summary="Use SitGuru checkout only — then track receipts, live PawReports, push alerts, and the automated end-of-walk email from your dashboard."
      backHref="/help/billing"
      backLabel="Back to Billing & Refunds"
    >
      <section>
        <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
          Checkout steps
        </h2>
        <HelpNumberedSteps steps={parentPaymentSteps} />
        <p className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm font-semibold text-emerald-950">
          After payment, you do not wait for a manual text from your Guru. Gurus
          track walks live via the high-accuracy phone dashboard, sending
          instant push alerts for potty breaks and a beautiful responsive email
          report the moment a walk ends.
        </p>
      </section>
    </HelpArticleChrome>
  );
}
