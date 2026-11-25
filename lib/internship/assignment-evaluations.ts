import "server-only";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type ReleasedEvaluation = {
  id: string;
  task_id: string;
  scores: number[];
  maximums: number[];
  total: number;
  total_possible: number;
  feedback: string;
  evaluated_submission_at: string | null;
  released_at: string | null;
  created_at: string;
};

const columns = "id,task_id,scores,maximums,total,total_possible,feedback,evaluated_submission_at,released_at,created_at";

export async function getInternReleasedAssignmentEvaluations(internId: string, taskId?: string) {
  const supabase = await createClient();
  const query = supabase.from("internship_assignment_evaluations").select(columns)
    .eq("intern_id", internId).not("released_at", "is", null)
    .order("released_at", { ascending: false }).order("id", { ascending: false });
  if (taskId) query.eq("task_id", taskId);
  const { data, error } = await query;
  if (error) console.error("[internship] Released evaluations unavailable", error.code);
  return { entries: (data || []) as ReleasedEvaluation[], unavailable: Boolean(error) };
}

/** Staff reads require a validated assignment and its linked intern. */
export async function listInstructorAssignmentEvaluations(internId: string, taskId: string) {
  const { data, error } = await supabaseAdmin.from("internship_assignment_evaluations")
    .select(`${columns},private_notes,evaluator_id`).eq("intern_id", internId).eq("task_id", taskId)
    .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(20);
  if (error) console.error("[internship] Instructor evaluations unavailable", error.code);
  return {
    entries: (data || []) as (ReleasedEvaluation & { private_notes: string; evaluator_id: string })[],
    unavailable: Boolean(error),
  };
}
