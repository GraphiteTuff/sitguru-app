"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { canReadPrivateInternRecord, internshipActorKind, isPortalUserId } from "@/lib/internship/manager-access";
import { safeReminderDayValues } from "@/lib/internship/assignment-reminder-rules";
import { findInternById } from "@/lib/internship/queries";
import { supabaseAdmin } from "@/lib/supabase/admin";

function bounce(id: string, name: "ok" | "error", message: string): never {
  redirect(`/manager/assignments/${encodeURIComponent(id)}?${name}=${encodeURIComponent(message)}`);
}

export async function saveManagerAssignmentReminders(formData: FormData) {
  const id = String(formData.get("assignmentId") || "").trim();
  if (!isPortalUserId(id)) redirect("/manager/assignments");
  const actor = await getAdminIdentity();
  if (!actor) redirect("/manager/assignments");
  const kind = internshipActorKind({ role: actor.role, isSuperUser: actor.isSuperUser });
  if (kind !== "manager" && kind !== "supervisor") bounce(id, "error", "Manager access is required.");

  const { data: task, error: readError } = await supabaseAdmin
    .from("internship_tasks")
    .select("id,intern_id,title,due_on,status,brief_payload")
    .eq("id", id)
    .maybeSingle();
  if (readError || !task?.id) bounce(id, "error", "Assignment not found.");
  const intern = await findInternById(String(task.intern_id));
  if (!intern || !canReadPrivateInternRecord({
    actor: kind,
    actorUserId: actor.id,
    targetInternId: intern.id,
    managerUserId: intern.managerUserId,
  })) bounce(id, "error", "That assignment is not on your team.");

  const enabled = formData.get("reminderEnabled") === "on";
  const daysBefore = safeReminderDayValues(formData.getAll("daysBefore"));
  const notifyIntern = formData.get("notifyIntern") === "on";
  const notifyManager = formData.get("notifyManager") === "on";
  if (enabled && !task.due_on) bounce(id, "error", "Set an assignment due date before enabling reminders.");
  if (enabled && !daysBefore.length) bounce(id, "error", "Select at least one reminder time.");
  if (enabled && !notifyIntern && !notifyManager) bounce(id, "error", "Choose at least one recipient.");

  const previous = task.brief_payload && typeof task.brief_payload === "object"
    ? task.brief_payload as Record<string, unknown>
    : {};
  const next = {
    ...previous,
    managerAutomation: {
      enabled,
      daysBefore,
      notifyIntern,
      notifyManager,
      updatedAt: new Date().toISOString(),
      updatedBy: actor.id,
    },
  };
  const { data: saved, error } = await supabaseAdmin.from("internship_tasks")
    .update({ brief_payload: next, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("intern_id", intern.id)
    .select("id")
    .maybeSingle();
  if (error || !saved?.id) bounce(id, "error", "Could not save reminder settings.");

  revalidatePath(`/manager/assignments/${id}`);
  revalidatePath("/manager/assignments");
  bounce(id, "ok", enabled
    ? "SitGuru in-app reminders scheduled. Planner notifications must be enabled separately in Microsoft 365."
    : "SitGuru assignment reminders turned off.");
}
