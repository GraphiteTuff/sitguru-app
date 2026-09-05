import type {
  AcademicRequirement,
  InternshipCampaign,
  InternshipCampus,
  InternshipCohort,
  InternshipContentItem,
  InternshipIntern,
  InternshipMetric,
  InternshipProject,
  InternshipScorecard,
  InternshipTask,
  InternshipUniversity,
  InternshipWeeklyReview,
} from "@/lib/internship/types";
import type {
  AcademicCreditStatus,
  FundingDirectoryStatus,
  InternshipEligibilityStatus,
  InternStatus,
  MetricSourceSystem,
  TaskStatus,
  UniversityStatus,
} from "@/lib/internship/types";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function num(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function bool(value: unknown) {
  return value === true;
}

export function mapUniversity(row: Record<string, unknown>): InternshipUniversity {
  return {
    id: text(row.id),
    slug: text(row.slug),
    name: text(row.name),
    displayName: text(row.display_name) || text(row.name),
    shortName: text(row.short_name),
    parentUniversityId: text(row.parent_university_id) || null,
    city: text(row.city),
    state: text(row.state),
    region: text(row.region),
    country: text(row.country) || "US",
    websiteUrl: text(row.website_url),
    status: (text(row.status) || "research_needed") as UniversityStatus,
    isUniversityPartner: bool(row.is_university_partner),
    partnerNotes: text(row.partner_notes),
    partnerSince: text(row.partner_since) || null,
    remoteEligible: row.remote_eligible !== false,
    academicCreditStatus: (text(row.academic_credit_status) ||
      "unknown") as AcademicCreditStatus,
    internshipEligibilityStatus: (text(row.internship_eligibility_status) ||
      "unknown") as InternshipEligibilityStatus,
    fundingStatus: (text(row.funding_status) || "unknown") as FundingDirectoryStatus,
    sourceUrl: text(row.source_url),
    verifiedAt: text(row.verified_at) || null,
    notes: text(row.notes),
    archived: bool(row.archived),
  };
}

export function mapCampus(row: Record<string, unknown>): InternshipCampus {
  return {
    id: text(row.id),
    universityId: text(row.university_id),
    slug: text(row.slug),
    name: text(row.name),
    displayName: text(row.display_name) || text(row.name),
    city: text(row.city),
    state: text(row.state),
    isPrimary: bool(row.is_primary),
  };
}

export function mapRequirement(row: Record<string, unknown>): AcademicRequirement {
  return {
    id: text(row.id),
    universityId: text(row.university_id),
    campusId: text(row.campus_id) || null,
    department: text(row.department),
    academicProgram: text(row.academic_program),
    courseCode: text(row.course_code),
    courseName: text(row.course_name),
    creditHours: num(row.credit_hours),
    minimumInternshipHours: num(row.minimum_internship_hours),
    maximumInternshipHours: num(row.maximum_internship_hours),
    requiredWeeklyHours: num(row.required_weekly_hours),
    requiresFacultySupervisor: bool(row.requires_faculty_supervisor),
    requiresLearningAgreement: bool(row.requires_learning_agreement),
    requiresOfferLetter: bool(row.requires_offer_letter),
    requiresMidpointEvaluation: bool(row.requires_midpoint_evaluation),
    requiresFinalEvaluation: bool(row.requires_final_evaluation),
    requiresTimesheet: bool(row.requires_timesheet),
    requiresFinalReport: bool(row.requires_final_report),
    requiresStudentReflection: bool(row.requires_student_reflection),
    requiresSiteVisit: bool(row.requires_site_visit),
    otherRequirements: text(row.other_requirements),
    sourceUrl: text(row.source_url),
    verifiedAt: text(row.verified_at) || null,
    verifiedBy: text(row.verified_by) || null,
    status: text(row.status) || "draft",
  };
}

export function mapCohort(row: Record<string, unknown>): InternshipCohort {
  return {
    id: text(row.id),
    name: text(row.name),
    season: text(row.season),
    year: Number(row.year) || 0,
    academicYear: text(row.academic_year),
    startsOn: text(row.starts_on) || null,
    endsOn: text(row.ends_on) || null,
    status: text(row.status),
  };
}

export function mapProject(row: Record<string, unknown>): InternshipProject {
  return {
    id: text(row.id),
    cohortId: text(row.cohort_id),
    slug: text(row.slug),
    name: text(row.name),
    projectKind: text(row.project_kind),
    baselineNotes: text(row.baseline_notes),
    targetNotes: text(row.target_notes),
    status: text(row.status),
  };
}

export function mapIntern(row: Record<string, unknown>): InternshipIntern {
  const snapshot =
    row.academic_snapshot && typeof row.academic_snapshot === "object"
      ? (row.academic_snapshot as Record<string, unknown>)
      : {};
  return {
    id: text(row.id),
    userId: text(row.user_id) || null,
    fullName: text(row.full_name),
    email: text(row.email).toLowerCase(),
    phone: text(row.phone),
    cohortId: text(row.cohort_id),
    universityId: text(row.university_id),
    campusId: text(row.campus_id) || null,
    pathType: text(row.path_type) || "credit_bearing",
    academicProgram: text(row.academic_program),
    courseCode: text(row.course_code),
    credits: num(row.credits),
    requiredHours: num(row.required_hours),
    facultySupervisor: text(row.faculty_supervisor),
    academicAdvisor: text(row.academic_advisor),
    careerOffice: text(row.career_office),
    academicCoordinator: text(row.academic_coordinator),
    approvalStatus: text(row.approval_status) || "pending",
    approvalDate: text(row.approval_date) || null,
    semester: text(row.semester),
    academicStartDate: text(row.academic_start_date) || null,
    academicEndDate: text(row.academic_end_date) || null,
    status: (text(row.status) || "applicant") as InternStatus,
    portalEnabled: row.portal_enabled !== false,
    academicSnapshot: snapshot,
    notes: text(row.notes),
  };
}

export function mapTask(row: Record<string, unknown>): InternshipTask {
  return {
    id: text(row.id),
    internId: text(row.intern_id),
    projectId: text(row.project_id) || null,
    title: text(row.title),
    dueOn: text(row.due_on) || null,
    status: (text(row.status) || "todo") as TaskStatus,
    workUrl: text(row.work_url),
    businessObjective: text(row.business_objective),
    metricAffected: text(row.metric_affected),
    studentNotes: text(row.student_notes),
    supervisorNotes: text(row.supervisor_notes),
    supervisorApproved: bool(row.supervisor_approved),
    approvedAt: text(row.approved_at) || null,
    submittedAt: text(row.submitted_at) || null,
    employerLetter: text(row.employer_letter),
    kpiTier: text(row.kpi_tier),
    outputVsTarget: num(row.output_vs_target),
  };
}

export function mapContent(row: Record<string, unknown>): InternshipContentItem {
  return {
    id: text(row.id),
    internId: text(row.intern_id),
    title: text(row.title),
    platform: text(row.platform),
    draftUrl: text(row.draft_url),
    publishedUrl: text(row.published_url),
    status: text(row.status) || "draft",
    dueOn: text(row.due_on) || null,
    studentNotes: text(row.student_notes),
    supervisorNotes: text(row.supervisor_notes),
    supervisorApproved: bool(row.supervisor_approved),
    submittedAt: text(row.submitted_at) || null,
    employerLetter: text(row.employer_letter),
    kpiTier: text(row.kpi_tier),
    outputVsTarget: num(row.output_vs_target),
  };
}

export function mapCampaign(row: Record<string, unknown>): InternshipCampaign {
  return {
    id: text(row.id),
    internId: text(row.intern_id) || null,
    projectId: text(row.project_id) || null,
    name: text(row.name),
    utmSource: text(row.utm_source),
    utmCampaign: text(row.utm_campaign),
    referralCode: text(row.referral_code),
    trackingUrl: text(row.tracking_url),
    objective: text(row.objective),
    status: text(row.status) || "draft",
    primaryOwnerInternId: text(row.primary_owner_intern_id) || null,
  };
}

export function mapMetric(row: Record<string, unknown>): InternshipMetric {
  return {
    id: text(row.id),
    internId: text(row.intern_id) || null,
    campaignId: text(row.campaign_id) || null,
    projectId: text(row.project_id) || null,
    metricKey: text(row.metric_key),
    label: text(row.label),
    valueNumeric: num(row.value_numeric),
    periodStart: text(row.period_start) || null,
    periodEnd: text(row.period_end) || null,
    sourceSystem: (text(row.source_system) || "other_approved") as MetricSourceSystem,
    sourceNote: text(row.source_note),
    isVerified: bool(row.is_verified),
    selfReported: bool(row.self_reported),
  };
}

export function mapScorecard(row: Record<string, unknown>): InternshipScorecard {
  return {
    id: text(row.id),
    internId: text(row.intern_id),
    periodStart: text(row.period_start),
    periodEnd: text(row.period_end),
    quality: Number(row.quality) || 0,
    communication: Number(row.communication) || 0,
    reliability: Number(row.reliability) || 0,
    creativity: Number(row.creativity) || 0,
    analytics: Number(row.analytics) || 0,
    judgment: Number(row.judgment) || 0,
    initiative: Number(row.initiative) || 0,
    kpiContribution: Number(row.kpi_contribution) || 0,
    strongestContribution: text(row.strongest_contribution),
    improvementRequired: text(row.improvement_required),
    scoredAt: text(row.scored_at) || null,
  };
}

export function mapWeeklyReview(row: Record<string, unknown>): InternshipWeeklyReview {
  return {
    id: text(row.id),
    internId: text(row.intern_id),
    weekOf: text(row.week_of),
    accomplished: text(row.accomplished),
    dataShowed: text(row.data_showed),
    didntWork: text(row.didnt_work),
    changingNextWeek: text(row.changing_next_week),
    upcomingApproved: bool(row.upcoming_approved),
  };
}
