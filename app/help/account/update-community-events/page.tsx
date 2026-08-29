import type { Metadata } from "next";
import HelpArticleChrome from "@/components/help/HelpArticleChrome";
import { HelpFaqList, HelpStepBlocks } from "@/components/help/HelpFaqList";
import {
  eventPlannerFaqs,
  eventPlannerUpdateGuides,
} from "@/lib/help/content";

export const metadata: Metadata = {
  title: "Update Community Events as a Pet Event Planner",
  description:
    "Step-by-step guide for Pet Event Planners and Managers to create and update SitGuru Partner Events.",
};

export default function EventPlannerUpdateEventsPage() {
  return (
    <HelpArticleChrome
      eyebrow="Account & Profiles"
      title="How Pet Event Planners update their events"
      summary="Create drafts, edit live Partner Events, submit for review, and keep Pet Parents in the loop — step by step."
      backHref="/help/account"
      backLabel="Back to Account & Profiles"
      jumps={[
        { href: "#update-steps", label: "Update steps" },
        { href: "#faqs", label: "FAQs" },
        { href: "/community/host", label: "Host hub" },
        {
          href: "/partners/dashboard/community/events",
          label: "Partner Events",
        },
      ]}
    >
      <div id="update-steps">
        <HelpStepBlocks blocks={eventPlannerUpdateGuides} />
      </div>
      <div id="faqs" className="mt-8">
        <h2 className="mb-3 text-lg font-black tracking-[-0.03em] text-slate-950">
          Quick answers
        </h2>
        <HelpFaqList items={eventPlannerFaqs} />
      </div>
    </HelpArticleChrome>
  );
}
