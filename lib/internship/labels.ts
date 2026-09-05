import {
  ACADEMIC_CREDIT_STATUSES,
  FUNDING_DIRECTORY_STATUSES,
  INTERNSHIP_ELIGIBILITY_STATUSES,
  INTERNSHIP_PROGRAM_NAME,
  INTERNSHIP_PROGRAM_SHORT_NAME,
  UNIVERSITY_STATUSES,
} from "@/lib/internship/constants";

export function internshipProgramName() {
  return INTERNSHIP_PROGRAM_NAME;
}

export function internshipProgramShortName() {
  return INTERNSHIP_PROGRAM_SHORT_NAME;
}

/**
 * University = where the student attends.
 * University Partner = SitGuru has an actual relationship or agreement.
 * Never label a school a partner just because a student interned from there.
 */
export function institutionRelationshipLabel(isUniversityPartner: boolean) {
  return isUniversityPartner ? "University Partner" : "Student Institution";
}

export function institutionRelationshipHint(isUniversityPartner: boolean) {
  return isUniversityPartner
    ? "SitGuru has an established relationship, employer program, internship agreement, faculty relationship, or recruiting pipeline with this school."
    : "This is the student's institution. It is not a SitGuru University Partner until a real relationship is recorded.";
}

export function universityStatusLabel(status: string) {
  const labels: Record<(typeof UNIVERSITY_STATUSES)[number], string> = {
    research_needed: "Research Needed",
    potential_partner: "Potential Partner",
    contacted: "Contacted",
    requirements_identified: "Requirements Identified",
    internship_eligible: "Internship Eligible",
    academic_credit_confirmed: "Academic Credit Confirmed",
    active_partner: "Active Partner",
    inactive: "Inactive",
  };
  return labels[status as (typeof UNIVERSITY_STATUSES)[number]] || status;
}

export function academicCreditLabel(status: string) {
  const labels: Record<(typeof ACADEMIC_CREDIT_STATUSES)[number], string> = {
    confirmed: "Confirmed",
    likely: "Likely",
    unknown: "Unknown",
    not_available: "Not Available",
  };
  return labels[status as (typeof ACADEMIC_CREDIT_STATUSES)[number]] || status;
}

export function eligibilityLabel(status: string) {
  const labels: Record<(typeof INTERNSHIP_ELIGIBILITY_STATUSES)[number], string> =
    {
      eligible: "Eligible",
      requires_review: "Requires Review",
      unknown: "Unknown",
      not_eligible: "Not Eligible",
    };
  return (
    labels[status as (typeof INTERNSHIP_ELIGIBILITY_STATUSES)[number]] || status
  );
}

export function fundingStatusLabel(status: string) {
  const labels: Record<(typeof FUNDING_DIRECTORY_STATUSES)[number], string> = {
    available: "Available",
    possible: "Possible",
    none_found: "None Found",
    unknown: "Unknown",
  };
  return labels[status as (typeof FUNDING_DIRECTORY_STATUSES)[number]] || status;
}

export function internStatusLabel(status: string) {
  const map: Record<string, string> = {
    applicant: "Applicant",
    accepted: "Accepted",
    active: "Active",
    completed: "Completed",
    withdrawn: "Withdrawn",
  };
  return map[status] || status;
}

export function taskStatusLabel(status: string) {
  const map: Record<string, string> = {
    todo: "To do",
    in_progress: "In progress",
    submitted: "Submitted",
    approved: "Approved",
    revision_requested: "Revision requested",
    not_accepted: "Not accepted",
    blocked: "Blocked",
  };
  return map[status] || status;
}

export function contributionLabel(value: string) {
  const map: Record<string, string> = {
    primary: "Primary contribution",
    shared: "Shared contribution",
    supporting: "Supporting contribution",
  };
  return map[value] || value;
}

export function metricSourceLabel(value: string) {
  const map: Record<string, string> = {
    sitguru_admin: "SitGuru Admin",
    ga4: "Google Analytics (GA4)",
    search_console: "Search Console",
    meta: "Meta Business Suite",
    tiktok: "TikTok analytics",
    x: "X analytics",
    youtube: "YouTube Studio",
    mailchimp: "Mailchimp",
    referral_tracking: "Referral tracking",
    registration_records: "SitGuru registration records",
    other_approved: "Other approved source",
  };
  return map[value] || value;
}

export function formatInstitutionLine(input: {
  universityName: string;
  campusName?: string | null;
  displayName?: string | null;
}) {
  const display = String(input.displayName || "").trim();
  if (display) return display;
  const campus = String(input.campusName || "").trim();
  const university = String(input.universityName || "").trim();
  if (campus && campus.toLowerCase() !== university.toLowerCase()) {
    return `${university} — ${campus}`;
  }
  return university || "Student institution";
}

export function formatCohortHeadline(input: {
  season?: string | null;
  year?: number | null;
  name?: string | null;
}) {
  const name = String(input.name || "").trim();
  if (name) return name;
  const season = String(input.season || "").trim();
  const year = input.year ? String(input.year) : "";
  const seasonLabel = season
    ? season.charAt(0).toUpperCase() + season.slice(1)
    : "";
  return [seasonLabel, year].filter(Boolean).join(" ") || "Current cohort";
}

export function formatProgramStatLine(input: {
  universities: number;
  interns: number;
  requiredHours: number;
  projects: number;
}) {
  const hours = Number.isFinite(input.requiredHours) ? input.requiredHours : 0;
  return [
    `${input.universities} ${input.universities === 1 ? "University" : "Universities"}`,
    `${input.interns} ${input.interns === 1 ? "Intern" : "Interns"}`,
    `${hours.toLocaleString("en-US")} Required Hours`,
    `${input.projects} Active Growth ${input.projects === 1 ? "Project" : "Projects"}`,
  ].join(" • ");
}
