import type { Metadata } from "next";
import HelpArticleChrome from "@/components/help/HelpArticleChrome";
import { HelpFaqList } from "@/components/help/HelpFaqList";
import { reviewFaqs } from "@/lib/help/content";

export const metadata: Metadata = {
  title: "Reviews, Ratings & Trust Signals",
  description:
    "Honest booking-based reviews, New Guru badges, and marketplace trust signals.",
};

export default function ReviewsAndRatingsPage() {
  return (
    <HelpArticleChrome
      eyebrow="Trust & Safety"
      title="Reviews, ratings & trust signals"
      summary="Leave honest feedback after completed care — SitGuru never invents fake ratings."
      backHref="/help/safety"
      backLabel="Back to Trust & Safety"
    >
      <HelpFaqList items={reviewFaqs} />
    </HelpArticleChrome>
  );
}
