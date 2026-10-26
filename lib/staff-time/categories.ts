export const STAFF_TIME_CATEGORIES = [
  { slug: "growth_strategy", label: "Growth Strategy" },
  { slug: "social_content", label: "Social & Content" },
  { slug: "community_events", label: "Community / Events" },
  { slug: "ambassador_program", label: "Ambassador Program" },
  { slug: "market_research", label: "Market Research / Surveys" },
  { slug: "analytics_reporting", label: "Analytics & Reporting" },
  { slug: "partnerships_outreach", label: "Partnerships / Outreach" },
  { slug: "intern_leadership", label: "Intern Leadership" },
  { slug: "meetings", label: "Meetings" },
  { slug: "administrative", label: "Administrative" },
  { slug: "other_approved", label: "Other Approved Work" },
] as const;

export type StaffTimeCategorySlug = (typeof STAFF_TIME_CATEGORIES)[number]["slug"];

export function staffCategoryLabel(slug: string | null | undefined): string {
  const match = STAFF_TIME_CATEGORIES.find((item) => item.slug === slug);
  return match?.label || "Other Approved Work";
}

export function isStaffTimeCategory(slug: string): slug is StaffTimeCategorySlug {
  return STAFF_TIME_CATEGORIES.some((item) => item.slug === slug);
}
