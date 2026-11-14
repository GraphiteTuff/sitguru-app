/**
 * Single crosswalk between the university-neutral curriculum and the
 * *existing* SitGuru Final Growth Project model. No duplicate report fields.
 *
 * These are canonical IDs from final-project.ts used by tasks, weekly
 * reviews, experiments, verified metrics, playbook, and portfolio.
 */
import {
  CAPSTONE_WEEK_PLAN,
  FINAL_CONTRIBUTION_SECTIONS,
  FINAL_WORKSPACE_CHAPTERS,
  type FinalContributionSectionId,
} from "@/lib/internship/final-project";
import { SYLLABUS_CORE_DELIVERABLES, SYLLABUS_PHASES } from "@/lib/internship/university-syllabus";

export const SYLLABUS_FINAL_CROSSWALK = [
  { deliverableId: "research", primary: "market_analysis", secondary: ["audience_strategy"] },
  { deliverableId: "baseline", primary: "growth_strategy", secondary: ["analytics_attribution"] },
  { deliverableId: "content", primary: "content_system", secondary: ["campaign_system"] },
  { deliverableId: "campaigns", primary: "campaign_system", secondary: ["pet_parent_growth", "guru_growth"] },
  { deliverableId: "community", primary: "partner_growth", secondary: ["guru_growth"] },
  { deliverableId: "experiments", primary: "conversion_optimization", secondary: ["analytics_attribution", "pet_parent_growth"] },
  { deliverableId: "weekly", primary: "business_growth_report", secondary: ["analytics_attribution"] },
  { deliverableId: "playbook", primary: "sop_handoff", secondary: ["campaign_system"] },
  { deliverableId: "report", primary: "business_growth_report", secondary: ["analytics_attribution"] },
  { deliverableId: "presentation", primary: "portfolio_case_study", secondary: ["business_growth_report"] },
] as const satisfies ReadonlyArray<{
  deliverableId: (typeof SYLLABUS_CORE_DELIVERABLES)[number]["id"];
  primary: FinalContributionSectionId;
  secondary: ReadonlyArray<FinalContributionSectionId>;
}>;

export const ASSIGNMENT_CATEGORY_FINAL_SECTION = {
  Content: "content_system",
  "Social Media": "content_system",
  "Community Outreach": "partner_growth",
  Events: "partner_growth",
  Research: "market_analysis",
  Analytics: "analytics_attribution",
  Planning: "growth_strategy",
  Growth: "pet_parent_growth",
  "Ambassador Program": "partner_growth",
  "Campus Growth": "guru_growth",
  Other: "business_growth_report",
} as const satisfies Record<string, FinalContributionSectionId>;

export function defaultFinalSectionForCategory(category: string): FinalContributionSectionId {
  return ASSIGNMENT_CATEGORY_FINAL_SECTION[category as keyof typeof ASSIGNMENT_CATEGORY_FINAL_SECTION]
    || "business_growth_report";
}

export function isValidFinalSection(value: string | null | undefined): value is FinalContributionSectionId {
  return FINAL_CONTRIBUTION_SECTIONS.some((section) => section.id === value);
}

export function syllabusDeliveryCrosswalk() {
  return SYLLABUS_CORE_DELIVERABLES.map((deliverable) => {
    const link = SYLLABUS_FINAL_CROSSWALK.find((entry) => entry.deliverableId === deliverable.id);
    if (!link) throw new Error(`Syllabus deliverable not mapped: ${deliverable.id}`);
    const finalSection = FINAL_CONTRIBUTION_SECTIONS.find((entry) => entry.id === link.primary);
    if (!finalSection) throw new Error(`Unknown final section: ${link.primary}`);
    const chapter = FINAL_WORKSPACE_CHAPTERS.find((entry) => entry.id === finalSection.chapter);
    if (!chapter) throw new Error(`Unknown report chapter: ${finalSection.chapter}`);
    return {
      ...deliverable,
      sectionId: finalSection.id,
      sectionName: finalSection.label,
      chapterId: chapter.id,
      chapterName: chapter.label,
      output: finalSection.output,
      secondaryNames: link.secondary.map((id) => FINAL_CONTRIBUTION_SECTIONS.find((entry) => entry.id === id)?.label || id),
    };
  });
}

export function syllabusWeekCrosswalk() {
  return SYLLABUS_PHASES.map((phase, i) => {
    const weeks = i === 0 ? [1, 2] : i === 1 ? [3, 4, 5] : i === 2
      ? [6, 7, 8, 9, 10, 11] : i === 3 ? [12, 13, 14] : [15];
    return {
      ...phase,
      weeks: CAPSTONE_WEEK_PLAN.filter((item) => weeks.includes(item.week)),
    };
  });
}
