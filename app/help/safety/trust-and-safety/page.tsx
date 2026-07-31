import type { Metadata } from "next";
import HelpArticleChrome from "@/components/help/HelpArticleChrome";
import { HelpFaqList } from "@/components/help/HelpFaqList";
import { safetyFaqs } from "@/lib/help/content";

export const metadata: Metadata = {
  title: "Trust, Safety & Reporting Concerns",
  description:
    "Compliance, emergency guidance, incident reports, and SitGuru safety records.",
};

export default function TrustAndSafetyPage() {
  return (
    <HelpArticleChrome
      eyebrow="Trust & Safety"
      title="Trust, safety & reporting concerns"
      summary="Clearer records, compliance steps, emergency phone guidance, and how to file an incident report."
      backHref="/help/safety"
      backLabel="Back to Trust & Safety"
    >
      <HelpFaqList items={safetyFaqs} />
    </HelpArticleChrome>
  );
}
