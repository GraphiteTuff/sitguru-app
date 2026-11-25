import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type AssignmentSubmissionSnapshot = {
  id: string;
  submitted_at: string;
  notes: string;
  work_url: string;
  work_snapshot: unknown;
};

/** Call only after authorizing access to the assignment and its intern. */
export async function listAssignmentSubmissionHistory(internId: string, taskId: string) {
  const { data, error } = await supabaseAdmin.from("internship_assignment_submissions")
    .select("id,submitted_at,notes,work_url,work_snapshot")
    .eq("intern_id", internId)
    .eq("task_id", taskId)
    .order("submitted_at", { ascending: false })
    .limit(50);
  if (error) console.error("[internship] Submission history unavailable", error.code);
  return { entries: (data || []) as AssignmentSubmissionSnapshot[], unavailable: Boolean(error) };
}
