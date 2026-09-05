import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  mapCampaign,
  mapCampus,
  mapCohort,
  mapContent,
  mapIntern,
  mapMetric,
  mapProject,
  mapRequirement,
  mapScorecard,
  mapTask,
  mapUniversity,
  mapWeeklyReview,
} from "@/lib/internship/mappers";
import type {
  AcademicRequirement,
  CohortDashboardStats,
  FrozenAcademicProfile,
  InternshipIntern,
  InternshipUniversity,
  InternshipWorkspaceData,
} from "@/lib/internship/types";

function rows(data: unknown) {
  return (Array.isArray(data) ? data : []) as Record<string, unknown>[];
}

export async function getActiveCohort() {
  const { data, error } = await supabaseAdmin
    .from("internship_cohorts")
    .select("*")
    .in("status", ["planning", "active"])
    .order("year", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[internship] cohort", error.message);
    return null;
  }
  return data ? mapCohort(data as Record<string, unknown>) : null;
}

export async function listUniversities(filter?: {
  q?: string;
  status?: string;
  partnersOnly?: boolean;
  region?: string;
}) {
  let query = supabaseAdmin
    .from("internship_universities")
    .select("*")
    .eq("archived", false)
    .order("name", { ascending: true });

  if (filter?.status) query = query.eq("status", filter.status);
  if (filter?.partnersOnly) query = query.eq("is_university_partner", true);
  if (filter?.region) query = query.eq("region", filter.region);

  const { data, error } = await query;
  if (error) {
    console.error("[internship] universities", error.message);
    return [] as InternshipUniversity[];
  }

  let list = rows(data).map(mapUniversity);
  const q = String(filter?.q || "")
    .trim()
    .toLowerCase();
  if (q) {
    list = list.filter((row) =>
      [row.name, row.displayName, row.city, row.state, row.region]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }
  return list;
}

export async function getUniversity(id: string) {
  const { data, error } = await supabaseAdmin
    .from("internship_universities")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return mapUniversity(data as Record<string, unknown>);
}

export async function listCampuses(universityId: string) {
  const { data } = await supabaseAdmin
    .from("internship_university_campuses")
    .select("*")
    .eq("university_id", universityId)
    .order("name");
  return rows(data).map(mapCampus);
}

export async function listRequirements(universityId: string, campusId?: string) {
  let query = supabaseAdmin
    .from("internship_academic_requirements")
    .select("*")
    .eq("university_id", universityId)
    .order("academic_program");
  if (campusId) query = query.or(`campus_id.eq.${campusId},campus_id.is.null`);
  const { data } = await query;
  return rows(data).map(mapRequirement);
}

export function matchRequirementForProgram(
  requirements: AcademicRequirement[],
  academicProgram: string,
) {
  const needle = academicProgram.trim().toLowerCase();
  if (!needle) return null;
  return (
    requirements.find(
      (row) =>
        row.status === "verified" &&
        row.academicProgram.toLowerCase() === needle,
    ) ||
    requirements.find(
      (row) =>
        row.status === "verified" &&
        row.academicProgram.toLowerCase().includes(needle),
    ) ||
    null
  );
}

export function freezeAcademicProfile(input: {
  university: InternshipUniversity;
  campusName?: string;
  intern: Pick<
    InternshipIntern,
    | "academicProgram"
    | "courseCode"
    | "credits"
    | "requiredHours"
    | "facultySupervisor"
    | "academicAdvisor"
    | "careerOffice"
    | "academicCoordinator"
    | "approvalStatus"
    | "approvalDate"
    | "semester"
    | "academicStartDate"
    | "academicEndDate"
  >;
  requirement: AcademicRequirement | null;
}): FrozenAcademicProfile {
  return {
    university: input.university.displayName || input.university.name,
    campus: input.campusName || "",
    academicProgram: input.intern.academicProgram,
    courseCode: input.requirement?.courseCode || input.intern.courseCode,
    credits: input.requirement?.creditHours ?? input.intern.credits,
    requiredHours:
      input.requirement?.minimumInternshipHours ?? input.intern.requiredHours,
    facultySupervisor: input.intern.facultySupervisor,
    academicAdvisor: input.intern.academicAdvisor,
    careerOffice: input.intern.careerOffice,
    academicCoordinator: input.intern.academicCoordinator,
    approvalStatus: input.intern.approvalStatus,
    approvalDate: input.intern.approvalDate,
    semester: input.intern.semester,
    academicStartDate: input.intern.academicStartDate,
    academicEndDate: input.intern.academicEndDate,
    requirementId: input.requirement?.id || null,
    copiedAt: new Date().toISOString(),
  };
}

export async function getCohortDashboard(cohortId: string) {
  const [
    universities,
    internRows,
    projectRows,
    cohortUniversityRows,
    fundingRows,
  ] = await Promise.all([
    supabaseAdmin
      .from("internship_universities")
      .select("*")
      .eq("archived", false)
      .order("name"),
    supabaseAdmin
      .from("internship_interns")
      .select("*")
      .eq("cohort_id", cohortId),
    supabaseAdmin
      .from("internship_projects")
      .select("*")
      .eq("cohort_id", cohortId)
      .eq("status", "active"),
    supabaseAdmin
      .from("internship_cohort_universities")
      .select("university_id, target_program, participation_status")
      .eq("cohort_id", cohortId),
    supabaseAdmin.from("internship_funding_opportunities").select("id, status"),
  ]);

  const internList = rows(internRows.data).map(mapIntern);
  const activeInterns = internList.filter((row) =>
    ["accepted", "active", "completed"].includes(row.status),
  );
  const internUniversityIds = new Set(activeInterns.map((row) => row.universityId));
  const targetUniversityIds = new Set(
    rows(cohortUniversityRows.data).map((row) => String(row.university_id || "")),
  );
  const universityIds =
    internUniversityIds.size > 0 ? internUniversityIds : targetUniversityIds;

  const stats: CohortDashboardStats = {
    universities: universityIds.size,
    interns: internList.filter((row) => row.status !== "withdrawn").length,
    requiredHours: internList.reduce(
      (sum, row) => sum + (row.requiredHours || 0),
      0,
    ),
    projects: rows(projectRows.data).length,
  };

  const universityList = rows(universities.data).map(mapUniversity);

  return {
    stats,
    universities: universityList,
    interns: internList,
    projects: rows(projectRows.data).map(mapProject),
    cohortUniversities: rows(cohortUniversityRows.data).map((row) => ({
      universityId: String(row.university_id || ""),
      targetProgram: String(row.target_program || ""),
      participationStatus: String(row.participation_status || "target"),
    })),
    programAnalytics: {
      universitiesRepresented: universityList.length,
      universityPartners: universityList.filter((row) => row.isUniversityPartner)
        .length,
      creditBearing: internList.filter((row) => row.pathType === "credit_bearing")
        .length,
      nonCredit: internList.filter((row) => row.pathType === "non_credit").length,
      totalCredits: internList.reduce((sum, row) => sum + (row.credits || 0), 0),
      fundingAwards: rows(fundingRows.data).filter((row) => row.status === "available")
        .length,
    },
  };
}

export async function listInterns(cohortId?: string) {
  let query = supabaseAdmin
    .from("internship_interns")
    .select("*")
    .order("full_name");
  if (cohortId) query = query.eq("cohort_id", cohortId);
  const { data, error } = await query;
  if (error) {
    console.error("[internship] interns", error.message);
    return [] as InternshipIntern[];
  }
  return rows(data).map(mapIntern);
}

export async function findInternById(id: string) {
  const { data } = await supabaseAdmin
    .from("internship_interns")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? mapIntern(data as Record<string, unknown>) : null;
}

export async function findInternByAccount(input: {
  userId?: string | null;
  email?: string | null;
}) {
  if (input.userId) {
    const { data } = await supabaseAdmin
      .from("internship_interns")
      .select("*")
      .eq("user_id", input.userId)
      .eq("portal_enabled", true)
      .in("status", ["accepted", "active"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) return mapIntern(data as Record<string, unknown>);
  }

  const email = String(input.email || "")
    .trim()
    .toLowerCase();
  if (!email) return null;

  const { data } = await supabaseAdmin
    .from("internship_interns")
    .select("*")
    .ilike("email", email)
    .eq("portal_enabled", true)
    .in("status", ["accepted", "active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? mapIntern(data as Record<string, unknown>) : null;
}

export async function getInternWorkspace(
  internId: string,
): Promise<InternshipWorkspaceData | null> {
  const intern = await findInternById(internId);
  if (!intern) return null;

  const [
    university,
    campus,
    cohort,
    projects,
    tasks,
    content,
    campaigns,
    metrics,
    scorecards,
    reviews,
    smartGoals,
    experiments,
    accessGrants,
    milestones,
    commentRows,
  ] = await Promise.all([
    getUniversity(intern.universityId),
    intern.campusId
      ? supabaseAdmin
          .from("internship_university_campuses")
          .select("*")
          .eq("id", intern.campusId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabaseAdmin
      .from("internship_cohorts")
      .select("*")
      .eq("id", intern.cohortId)
      .maybeSingle(),
    supabaseAdmin
      .from("internship_projects")
      .select("*")
      .eq("cohort_id", intern.cohortId)
      .order("name"),
    supabaseAdmin
      .from("internship_tasks")
      .select("*")
      .eq("intern_id", internId)
      .order("due_on", { ascending: true }),
    supabaseAdmin
      .from("internship_content")
      .select("*")
      .eq("intern_id", internId)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("internship_campaigns")
      .select("*")
      .or(`intern_id.eq.${internId},primary_owner_intern_id.eq.${internId}`)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("internship_metrics")
      .select("*")
      .eq("intern_id", internId)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("internship_scorecards")
      .select("*")
      .eq("intern_id", internId)
      .order("period_end", { ascending: false }),
    supabaseAdmin
      .from("internship_weekly_reviews")
      .select("*")
      .eq("intern_id", internId)
      .order("week_of", { ascending: false }),
    supabaseAdmin
      .from("internship_smart_goals")
      .select("*")
      .eq("intern_id", internId)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("internship_experiments")
      .select("*")
      .eq("intern_id", internId)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("internship_access_grants")
      .select("*")
      .eq("intern_id", internId),
    listCohortMilestones(intern.cohortId),
    supabaseAdmin
      .from("internship_work_comments")
      .select("*")
      .eq("intern_id", internId)
      .order("created_at", { ascending: true }),
  ]);

  return {
    intern,
    university,
    campus: campus.data
      ? mapCampus(campus.data as Record<string, unknown>)
      : null,
    cohort: cohort.data
      ? mapCohort(cohort.data as Record<string, unknown>)
      : null,
    projects: rows(projects.data).map(mapProject),
    tasks: rows(tasks.data).map(mapTask),
    content: rows(content.data).map(mapContent),
    campaigns: rows(campaigns.data).map(mapCampaign),
    metrics: rows(metrics.data).map(mapMetric),
    scorecards: rows(scorecards.data).map(mapScorecard),
    weeklyReviews: rows(reviews.data).map(mapWeeklyReview),
    smartGoals: rows(smartGoals.data).map((row) => ({
      id: String(row.id || ""),
      internId: String(row.intern_id || internId),
      specific: String(row.specific || ""),
      measurable: String(row.measurable || ""),
      achievable: String(row.achievable || ""),
      relevant: String(row.relevant || ""),
      timeBound: String(row.time_bound || ""),
      metricKey: String(row.metric_key || ""),
      baselineValue: String(row.baseline_value || ""),
      targetValue: String(row.target_value || ""),
      sourceSystem: String(row.source_system || ""),
      status: String(row.status || "draft"),
    })),
    experiments: rows(experiments.data).map((row) => ({
      id: String(row.id || ""),
      internId: String(row.intern_id || internId),
      hypothesis: String(row.hypothesis || ""),
      action: String(row.action || ""),
      audience: String(row.audience || ""),
      result: String(row.result || ""),
      lesson: String(row.lesson || ""),
      nextStep: String(row.next_step || ""),
    })),
    accessGrants: rows(accessGrants.data).map((row) => ({
      toolKey: String(row.tool_key || ""),
      granted: row.granted === true,
      notes: String(row.notes || ""),
    })),
    milestones,
    comments: rows(commentRows.data).map((row) => ({
      id: String(row.id || ""),
      internId: String(row.intern_id || internId),
      itemType: row.item_type === "content" ? "content" : "task",
      itemId: String(row.item_id || ""),
      authorRole: row.author_role === "supervisor" ? "supervisor" : "intern",
      body: String(row.body || ""),
      createdAt: String(row.created_at || ""),
    })),
  };
}

export async function linkInternUserId(internId: string, userId: string) {
  await supabaseAdmin
    .from("internship_interns")
    .update({ user_id: userId, updated_at: new Date().toISOString() })
    .eq("id", internId)
    .is("user_id", null);
}

export async function listCohortMilestones(cohortId: string) {
  const { data, error } = await supabaseAdmin
    .from("internship_milestones")
    .select("*, internship_universities(display_name, name)")
    .eq("cohort_id", cohortId)
    .order("due_on", { ascending: true });

  if (error) {
    console.error("[internship] milestones", error.message);
    return [];
  }

  return rows(data).map((row) => {
    const university = row.internship_universities as
      | { display_name?: string; name?: string }
      | null;
    return {
      id: String(row.id || ""),
      cohortId: String(row.cohort_id || ""),
      universityId: row.university_id ? String(row.university_id) : null,
      universityName: String(university?.display_name || university?.name || ""),
      key: String(row.milestone_key || ""),
      title: String(row.title || ""),
      dueOn: String(row.due_on || ""),
      phase: String(row.phase || ""),
      owner: String(row.owner || "sitguru"),
      action: String(row.action || ""),
      status: String(row.status || "scheduled"),
    };
  });
}

export async function listPathTypes() {
  const { data } = await supabaseAdmin
    .from("internship_path_types")
    .select("slug, name")
    .eq("is_active", true)
    .order("sort_order");
  return rows(data).map((row) => ({
    slug: String(row.slug || ""),
    name: String(row.name || ""),
  }));
}

export async function listDocumentTemplates() {
  const { data } = await supabaseAdmin
    .from("internship_document_templates")
    .select("slug, name, document_kind")
    .eq("is_active", true)
    .order("name");
  return rows(data).map((row) => ({
    slug: String(row.slug || ""),
    name: String(row.name || ""),
    kind: String(row.document_kind || ""),
  }));
}

export async function listFunding(universityId?: string) {
  let query = supabaseAdmin
    .from("internship_funding_opportunities")
    .select("*")
    .order("fund_name");
  if (universityId) query = query.eq("university_id", universityId);
  const { data } = await query;
  return rows(data);
}

export async function listContacts(universityId: string) {
  const { data } = await supabaseAdmin
    .from("internship_university_contacts")
    .select("*")
    .eq("university_id", universityId)
    .order("full_name");
  return rows(data);
}

export function packetDocumentsForRequirement(requirement: AcademicRequirement | null) {
  const docs: Array<{ slug: string; name: string; required: boolean }> = [
    {
      slug: "employer_internship_description",
      name: "Employer Internship Description",
      required: true,
    },
  ];
  if (!requirement) return docs;
  if (requirement.requiresOfferLetter) {
    docs.push({ slug: "offer_letter", name: "Offer Letter", required: true });
  }
  if (requirement.requiresLearningAgreement) {
    docs.push({
      slug: "learning_agreement",
      name: "Learning Agreement",
      required: true,
    });
  }
  if (requirement.requiresMidpointEvaluation) {
    docs.push({
      slug: "midpoint_evaluation",
      name: "Midpoint Evaluation",
      required: true,
    });
  }
  if (requirement.requiresFinalEvaluation) {
    docs.push({
      slug: "final_evaluation",
      name: "Final Evaluation",
      required: true,
    });
  }
  if (requirement.requiresTimesheet) {
    docs.push({ slug: "timesheet", name: "Timesheet", required: true });
  }
  if (requirement.requiresFinalReport) {
    docs.push({
      slug: "business_growth_report",
      name: "Business Growth Report",
      required: true,
    });
  }
  docs.push({
    slug: "completion_letter",
    name: "Internship Completion Letter",
    required: false,
  });
  return docs;
}
