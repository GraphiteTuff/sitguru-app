/**
 * SitGuru Social Media & Community Growth Internship Program.
 * Universities approve a student's academic participation; SitGuru owns the program.
 * Penn State Abington is an initial configuration, not the root architecture.
 */

export const INTERNSHIP_PROGRAM_NAME =
  "Social Media & Community Growth Internship Program";

export const INTERNSHIP_PROGRAM_SHORT_NAME = "Internship Program";

export const INTERNSHIP_PORTAL_PATH = "/intern";
export const INTERNSHIP_ADMIN_PATH = "/admin/internship";

export function internPortalPreviewPath(internId: string) {
  return `${INTERNSHIP_PORTAL_PATH}?view=${encodeURIComponent(internId)}`;
}

export const OTHER_UNIVERSITY_VALUE = "__other__";

export function internshipUniversitySlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export const UNIVERSITY_STATUSES = [
  "research_needed",
  "potential",
  "potential_partner",
  "contacted",
  "requirements_identified",
  "internship_eligible",
  "academic_credit_confirmed",
  "formal_partner",
  "active_partner",
  "inactive",
] as const;

export const UNIVERSITY_RECRUITING_STATUSES = [
  "not_started",
  "researching",
  "contacted",
  "awaiting_response",
  "posting_preparation",
  "posting_submitted",
  "posting_approved",
  "recruiting_active",
  "applications_received",
  "candidate_selected",
  "closed",
] as const;

export const UNIVERSITY_REQUIREMENTS_STATUSES = [
  "not_researched",
  "researching",
  "partially_verified",
  "verified",
  "needs_reverification",
] as const;

export const ACCESS_GRANT_STATUSES = [
  "not_granted",
  "requested",
  "active",
  "revoked",
] as const;

export const SMART_GOAL_STATUSES = [
  "draft",
  "submitted",
  "approved",
  "locked",
] as const;

export const PROJECT_RECORD_KINDS = ["track", "intern_project"] as const;

export const ACADEMIC_CREDIT_STATUSES = [
  "confirmed",
  "likely",
  "unknown",
  "not_available",
] as const;

export const INTERNSHIP_ELIGIBILITY_STATUSES = [
  "eligible",
  "requires_review",
  "unknown",
  "not_eligible",
] as const;

export const FUNDING_DIRECTORY_STATUSES = [
  "unknown",
  "research_needed",
  "not_yet_open",
  "open",
  "student_eligible",
  "student_applying",
  "submitted",
  "approved",
  "declined",
  "closed",
  "available",
  "possible",
  "none_found",
] as const;

export const INTERNSHIP_PATH_TYPE_SLUGS = [
  "credit_bearing",
  "non_credit",
  "required_major",
  "elective",
  "co_op",
  "experiential_learning",
  "independent_study",
  "capstone",
  "career_internship",
  "externship",
  "university_sponsored_project",
] as const;

export const ACADEMIC_LEVELS = [
  "freshman",
  "sophomore",
  "junior",
  "senior",
  "graduate",
  "doctoral",
  "other",
] as const;

export const INTERN_STATUSES = [
  "applicant",
  "accepted",
  "active",
  "completed",
  "withdrawn",
] as const;

export const TASK_STATUSES = [
  "todo",
  "in_progress",
  "submitted",
  "approved",
  "revision_requested",
  "not_accepted",
  "blocked",
] as const;

export const CONTRIBUTION_TYPES = [
  "primary",
  "shared",
  "supporting",
] as const;

export const METRIC_SOURCE_SYSTEMS = [
  "sitguru_admin",
  "ga4",
  "search_console",
  "meta",
  "tiktok",
  "x",
  "youtube",
  "mailchimp",
  "referral_tracking",
  "registration_records",
  "other_approved",
] as const;

export const WORKSPACE_SECTIONS = [
  "tasks",
  "content",
  "campaigns",
  "metrics",
  "review",
] as const;

export const SCORECARD_AREAS = [
  "quality",
  "communication",
  "reliability",
  "creativity",
  "analytics",
  "judgment",
  "initiative",
  "kpi_contribution",
] as const;

export const GROWTH_PROJECT_KINDS = [
  "pet_parent_growth",
  "guru_growth",
  "community_partnership_growth",
  "pet_event_growth",
  "referral_growth",
  "market_launch",
  "content_conversion",
  "seo_organic",
  "email_community",
  "campus_market_expansion",
  "local_business_partnership",
] as const;

export const CONTACT_ROLES = [
  "career_services",
  "internship_coordinator",
  "faculty_supervisor",
  "department_chair",
  "academic_advisor",
  "employer_relations",
  "experiential_learning",
] as const;

export const DOCUMENT_KINDS = [
  "employer_internship_description",
  "offer_letter",
  "acceptance_letter",
  "learning_agreement",
  "learning_objectives",
  "supervisor_agreement",
  "timesheet",
  "midpoint_evaluation",
  "final_evaluation",
  "completion_letter",
  "business_growth_report",
  "university_internship_packet",
] as const;

export const ATTRIBUTION_RULE =
  "No growth result is counted as attributable unless SitGuru can reasonably verify it through platform analytics, campaign tracking, referral codes, CRM records, or another approved source.";
