import type { Metadata } from "next";
import HelpArticleChrome from "@/components/help/HelpArticleChrome";
import { HelpFaqList } from "@/components/help/HelpFaqList";
import { programFaqs } from "@/lib/help/content";
import { VETERANS_MILITARY_FAMILIES_PROGRAM } from "@/lib/programs/veterans-military-families";

export const metadata: Metadata = {
  title: "Ambassadors & Program Pathways",
  description:
    `Ambassador referrals, Student Hire, Community Hire, and ${VETERANS_MILITARY_FAMILIES_PROGRAM.shortName}.`,
};

export default function ProgramsAndAmbassadorsPage() {
  return (
    <HelpArticleChrome
      eyebrow="Trust & Safety"
      title="Ambassadors, Student Hire & community pathways"
      summary="How Ambassadors grow SitGuru locally and what each hire pathway means."
      backHref="/help/safety"
      backLabel="Back to Trust & Safety"
    >
      <HelpFaqList items={programFaqs} />
      <p className="mt-6 text-sm font-semibold text-slate-600">
        Explore program pages at{" "}
        <a href="/programs" className="font-black text-emerald-800 underline">
          /programs
        </a>
        .
      </p>
    </HelpArticleChrome>
  );
}
