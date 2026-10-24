import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  buildInternManagerCard,
  buildManagerReviewQueue,
  type ManagerInternCard,
  type ManagerQuestion,
  type ManagerReviewItem,
} from "@/lib/internship/manager-dashboard";
import { canReadPrivateInternRecord, type InternshipActorKind } from "@/lib/internship/manager-access";
import { listInterns } from "@/lib/internship/queries";
import type {
  InternshipContentItem,
  InternshipIntern,
  InternshipQuestion,
  InternshipTask,
  InternshipTimeLog,
  InternshipWeeklyReview,
} from "@/lib/internship/types";

function rows(data: unknown) {
  return (Array.isArray(data) ? data : []) as Record<string, unknown>[];
}

async function safeRows(label: string, query: PromiseLike<{ data: unknown; error: { message: string } | null }>) {
  const { data, error } = await query;
  if (error) {
    console.error(`[internship manager] ${label}`, error.message);
    return [] as Record<string, unknown>[];
  }
  return rows(data);
}

export async function loadManagerDashboard(input: {
  actorUserId: string;
  actorKind: Extract<InternshipActorKind, "manager" | "supervisor">;
}) {
  const everyone = await listInterns();
  const interns = everyone.filter(
    (intern) =>
      !intern.isTest &&
      ["accepted", "active", "approved", "onboarding", "pending_university_approval", "candidate", "applicant", "completed"].includes(intern.status) &&
      canReadPrivateInternRecord({
        actor: input.actorKind,
        actorUserId: input.actorUserId,
        targetInternId: intern.id,
        managerUserId: intern.managerUserId,
      }),
  );
  const noticeRows = await safeRows(
    "notices",
    supabaseAdmin
      .from("internship_staff_notices")
      .select("id,intern_id,title,body,created_at")
      .eq("recipient_user_id", input.actorUserId)
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(12),
  );
  const notices = noticeRows.map((row) => ({
    id: String(row.id || ""),
    internId: String(row.intern_id || ""),
    title: String(row.title || "New team member"),
    body: String(row.body || ""),
    createdAt: String(row.created_at || ""),
  }));
  const ids = interns.map((intern) => intern.id);
  if (!ids.length) {
    return {
      cards: [] as ManagerInternCard[],
      reviews: [] as ManagerReviewItem[],
      questions: [] as ManagerQuestion[],
      interns,
      notices,
    };
  }

  const [taskRows, contentRows, reviewRows, logRows, questionRows, checkRows, exceptionRows, universities] =
    await Promise.all([
      safeRows("tasks", supabaseAdmin.from("internship_tasks").select("*").in("intern_id", ids)),
      safeRows("content", supabaseAdmin.from("internship_content").select("*").in("intern_id", ids)),
      safeRows("reviews", supabaseAdmin.from("internship_weekly_reviews").select("*").in("intern_id", ids)),
      safeRows("logs", supabaseAdmin.from("internship_time_logs").select("*").in("intern_id", ids)),
      safeRows("questions", supabaseAdmin.from("internship_questions").select("*").in("intern_id", ids)),
      safeRows("checks", supabaseAdmin.from("internship_start_checks").select("intern_id,item_key").in("intern_id", ids)),
      safeRows(
        "exceptions",
        supabaseAdmin.from("internship_schedule_exceptions").select("intern_id,week_number,planned_hours").in("intern_id", ids),
      ),
      safeRows("universities", supabaseAdmin.from("internship_universities").select("id,display_name,short_name")),
    ]);

  const school = new Map(
    universities.map((row) => [String(row.id), String(row.display_name || row.short_name || "")]),
  );
  const tasks = taskRows.map(mapTask);
  const content = contentRows.map(mapContent);
  const reviews = reviewRows.map(mapReview);
  const logs = logRows.map(mapLog);
  const questions = questionRows.map(mapQuestion);
  const checks = new Map<string, string[]>();
  for (const row of checkRows) {
    const internId = String(row.intern_id || "");
    const list = checks.get(internId) || [];
    if (row.item_key) list.push(String(row.item_key));
    checks.set(internId, list);
  }

  const cards = interns.map((intern) =>
    buildInternManagerCard({
      intern,
      schoolName: school.get(intern.universityId) || intern.academicProgram,
      tasks: tasks.filter((row) => row.internId === intern.id),
      content: content.filter((row) => row.internId === intern.id),
      reviews: reviews.filter((row) => row.internId === intern.id),
      logs: logs.filter((row) => row.internId === intern.id),
      questions: questions.filter((row) => row.internId === intern.id),
      startChecks: checks.get(intern.id) || [],
      exceptions: exceptionRows
        .filter((row) => String(row.intern_id) === intern.id)
        .map((row) => ({
          weekNumber: Number(row.week_number) || 0,
          plannedHours: Number(row.planned_hours) || 0,
        })),
    }),
  );

  const names = new Map(interns.map((intern) => [intern.id, intern.preferredName || intern.fullName]));
  return {
    cards,
    reviews: buildManagerReviewQueue({ interns, tasks, content, reviews, logs }),
    questions: questions.map((question) => ({
      ...question,
      internName: names.get(question.internId) || "Intern",
    })),
    interns,
    notices,
  };
}

function mapTask(row: Record<string, unknown>): InternshipTask {
  return {
    id: String(row.id || ""),
    internId: String(row.intern_id || ""),
    projectId: null,
    title: String(row.title || "Assignment"),
    dueOn: row.due_on ? String(row.due_on) : null,
    status: (String(row.status || "todo") as InternshipTask["status"]),
    workUrl: String(row.work_url || ""),
    businessObjective: "",
    metricAffected: "",
    studentNotes: String(row.student_notes || ""),
    supervisorNotes: String(row.supervisor_notes || ""),
    supervisorApproved: row.supervisor_approved === true,
    approvedAt: null,
    submittedAt: row.submitted_at ? String(row.submitted_at) : null,
    employerLetter: "",
    kpiTier: "",
    outputVsTarget: null,
    finalSection: String(row.final_section || ""),
    weekNumber: row.week_number == null ? null : Number(row.week_number),
    reviewStage: String(row.review_stage || ""),
  };
}

function mapContent(row: Record<string, unknown>): InternshipContentItem {
  return {
    id: String(row.id || ""),
    internId: String(row.intern_id || ""),
    title: String(row.title || "Content"),
    platform: String(row.platform || ""),
    draftUrl: String(row.draft_url || ""),
    publishedUrl: String(row.published_url || ""),
    status: String(row.status || "draft"),
    dueOn: null,
    studentNotes: String(row.student_notes || ""),
    supervisorNotes: "",
    supervisorApproved: row.supervisor_approved === true,
    submittedAt: row.submitted_at ? String(row.submitted_at) : null,
    employerLetter: "",
    kpiTier: "",
    outputVsTarget: null,
    finalSection: String(row.final_section || ""),
    reviewStage: String(row.review_stage || ""),
  };
}

function mapReview(row: Record<string, unknown>): InternshipWeeklyReview {
  return {
    id: String(row.id || ""),
    internId: String(row.intern_id || ""),
    weekOf: String(row.week_of || ""),
    accomplished: String(row.accomplished || ""),
    dataShowed: "",
    didntWork: "",
    changingNextWeek: "",
    upcomingApproved: false,
    finalSection: String(row.final_section || ""),
    contributionAdded: String(row.contribution_added || ""),
    hoursLogged: row.hours_logged == null ? null : Number(row.hours_logged),
    reviewStatus: String(row.review_status || ""),
    submittedAt: row.submitted_at ? String(row.submitted_at) : null,
  };
}

function mapLog(row: Record<string, unknown>): InternshipTimeLog {
  return {
    id: String(row.id || ""),
    internId: String(row.intern_id || ""),
    workedOn: String(row.worked_on || "").slice(0, 10),
    hours: Number(row.hours) || 0,
    activity: String(row.activity || ""),
    workItemType: String(row.work_item_type || ""),
    workItemId: String(row.work_item_id || ""),
    weekNumber: row.week_number == null ? null : Number(row.week_number),
    notes: String(row.notes || ""),
    evidenceUrl: String(row.evidence_url || ""),
    status: String(row.status || "draft"),
    submittedAt: row.submitted_at ? String(row.submitted_at) : null,
    managerReviewedAt: row.manager_reviewed_at ? String(row.manager_reviewed_at) : null,
  };
}

function mapQuestion(row: Record<string, unknown>): InternshipQuestion {
  return {
    id: String(row.id || ""),
    internId: String(row.intern_id || ""),
    targetType: String(row.target_type || ""),
    targetId: String(row.target_id || ""),
    targetTitle: String(row.target_title || ""),
    question: String(row.question || ""),
    urgency: String(row.urgency || "normal"),
    status: String(row.status || "open"),
    answer: String(row.answer || ""),
    askedByRole: String(row.asked_by_role || "intern"),
    askedAt: String(row.asked_at || ""),
    answeredAt: row.answered_at ? String(row.answered_at) : null,
  };
}

export type { InternshipIntern };
