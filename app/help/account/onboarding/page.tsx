import type { Metadata } from "next";
import HelpArticleChrome from "@/components/help/HelpArticleChrome";
import { HelpStepBlocks } from "@/components/help/HelpFaqList";
import { onboardingGuides } from "@/lib/help/content";

export const metadata: Metadata = {
  title: "Onboarding Guides",
  description:
    "Step-by-step SitGuru setup for Gurus, Ambassadors, and Pet Parents.",
};

export default function OnboardingPage() {
  return (
    <HelpArticleChrome
      eyebrow="Account & Profiles"
      title="Onboarding for every role"
      summary="What each setup step means, how Guru approval works, and what happens after you submit."
      backHref="/help/account"
      backLabel="Back to Account & Profiles"
    >
      <HelpStepBlocks blocks={onboardingGuides} />
    </HelpArticleChrome>
  );
}
