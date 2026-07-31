import type { Metadata } from "next";
import HelpArticleChrome from "@/components/help/HelpArticleChrome";
import { HelpFaqList } from "@/components/help/HelpFaqList";
import { findingGuruFaqs } from "@/lib/help/content";

export const metadata: Metadata = {
  title: "Finding the Right Guru",
  description:
    "Search SitGuru for local care, review profiles, and prepare your pet profile.",
};

export default function FindingAGuruPage() {
  return (
    <HelpArticleChrome
      eyebrow="Pet Parent Support"
      title="Finding the right Guru"
      summary="Search by service and location, read real reviews, and share a clear pet bio before care begins."
      backHref="/help/parents"
      backLabel="Back to Pet Parent Support"
    >
      <HelpFaqList items={findingGuruFaqs} />
    </HelpArticleChrome>
  );
}
