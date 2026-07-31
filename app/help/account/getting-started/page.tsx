import type { Metadata } from "next";
import HelpArticleChrome from "@/components/help/HelpArticleChrome";
import { HelpFaqList } from "@/components/help/HelpFaqList";
import { gettingStartedFaqs } from "@/lib/help/content";

export const metadata: Metadata = {
  title: "Getting Started with SitGuru",
  description:
    "What SitGuru is, who it’s for, free signup, and which dashboards to use.",
};

export default function GettingStartedPage() {
  return (
    <HelpArticleChrome
      eyebrow="Account & Profiles"
      title="Getting started with SitGuru"
      summary="Quick answers for people learning what SitGuru is and how to begin."
      backHref="/help/account"
      backLabel="Back to Account & Profiles"
    >
      <HelpFaqList items={gettingStartedFaqs} />
    </HelpArticleChrome>
  );
}
