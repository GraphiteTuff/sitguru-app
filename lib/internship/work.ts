import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  EMPLOYER_LETTERS,
  KPI_TIERS,
  REVIEW_DECISIONS,
  type EmployerLetter,
  type KpiTier,
  type ReviewDecision,
} from "@/lib/internship/grading";

export type InternWorkItemType = "task" | "content";

function tableFor(itemType: InternWorkItemType) {
  return itemType === "content" ? "internship_content" : "internship_tasks";
}

export async function addInternWorkComment(input: {
  internId: string;
  itemType: InternWorkItemType;
  itemId: string;
  authorRole: "intern" | "supervisor";
  body: string;
}) {
  const body = input.body.trim();
  if (!body) return { error: null };
  const { error } = await supabaseAdmin.from("internship_work_comments").insert({
    intern_id: input.internId,
    item_type: input.itemType,
    item_id: input.itemId,
    author_role: input.authorRole,
    body,
  });
  return { error: error?.message || null };
}

export async function submitInternWorkRecord(input: {
  internId: string;
  itemType: InternWorkItemType;
  itemId: string;
  workUrl?: string;
  draftUrl?: string;
  publishedUrl?: string;
  studentNotes?: string;
  internComment?: string;
}) {
  const table = tableFor(input.itemType);
  const now = new Date().toISOString();
  const payload =
    input.itemType === "task"
      ? {
          status: "submitted",
          submitted_at: now,
          supervisor_approved: false,
          work_url: input.workUrl || "",
          student_notes: input.studentNotes || "",
          updated_at: now,
        }
      : {
          status: "submitted",
          submitted_at: now,
          supervisor_approved: false,
          draft_url: input.draftUrl || input.workUrl || "",
          published_url: input.publishedUrl || "",
          student_notes: input.studentNotes || "",
        };

  const { error } = await supabaseAdmin
    .from(table)
    .update(payload)
    .eq("id", input.itemId)
    .eq("intern_id", input.internId);

  if (error) return { error: error.message };

  if (input.internComment?.trim()) {
    await addInternWorkComment({
      internId: input.internId,
      itemType: input.itemType,
      itemId: input.itemId,
      authorRole: "intern",
      body: input.internComment,
    });
  }

  return { error: null };
}

export async function reviewInternWorkRecord(input: {
  internId: string;
  itemType: InternWorkItemType;
  itemId: string;
  decision: string;
  letter: string;
  kpiTier: string;
  comments: string;
  outputVsTarget?: number | null;
  reviewerId: string;
}) {
  if (!REVIEW_DECISIONS.includes(input.decision as ReviewDecision)) {
    return { error: "Choose Approve, Request revision, or Not accepted." };
  }
  if (!EMPLOYER_LETTERS.includes(input.letter as EmployerLetter)) {
    return { error: "Assign a KPI letter grade." };
  }
  if (
    input.decision !== "approved" &&
    !input.comments.trim()
  ) {
    return { error: "Comments are required when sending work back or not accepting it." };
  }

  const decision = input.decision as ReviewDecision;
  const now = new Date().toISOString();
  const status =
    decision === "approved"
      ? "approved"
      : decision === "not_accepted"
        ? "not_accepted"
        : "revision_requested";
  const table = tableFor(input.itemType);
  const payload = {
    status,
    supervisor_approved: decision === "approved",
    supervisor_notes: input.comments.trim(),
    employer_letter: input.letter,
    kpi_tier: KPI_TIERS.includes(input.kpiTier as KpiTier) ? input.kpiTier : "none",
    output_vs_target: input.outputVsTarget ?? null,
    approved_at: decision === "approved" ? now : null,
    approved_by: decision === "approved" ? input.reviewerId : null,
    ...(input.itemType === "task" ? { updated_at: now } : {}),
  };

  const { error } = await supabaseAdmin
    .from(table)
    .update(payload)
    .eq("id", input.itemId)
    .eq("intern_id", input.internId);

  if (error) return { error: error.message };

  const comment = input.comments.trim()
    ? `Letter ${input.letter} · ${decision.replaceAll("_", " ")}. ${input.comments.trim()}`
    : `Letter ${input.letter} · ${decision.replaceAll("_", " ")}.`;

  await addInternWorkComment({
    internId: input.internId,
    itemType: input.itemType,
    itemId: input.itemId,
    authorRole: "supervisor",
    body: comment,
  });

  return { error: null };
}
