import type { Metadata } from "next";
import HelpArticleChrome from "@/components/help/HelpArticleChrome";
import { HelpFaqList } from "@/components/help/HelpFaqList";
import { guruOpsFaqs } from "@/lib/help/content";

export const metadata: Metadata = {
  title: "Pricing, Availability & My Calendar",
  description:
    "Set Guru rates, peak-time and holiday surge pricing, and availability in My Calendar.",
};

export default function GuruPricingCalendarPage() {
  return (
    <HelpArticleChrome
      eyebrow="Guru Success & Training Hub"
      title="Pricing, availability & My Calendar"
      summary="Clear rates and availability make booking easier for Pet Parents — including peak-time and holiday surge when you offer them."
      backHref="/help/gurus"
      backLabel="Back to Guru Success Hub"
    >
      <HelpFaqList items={guruOpsFaqs} />
    </HelpArticleChrome>
  );
}
