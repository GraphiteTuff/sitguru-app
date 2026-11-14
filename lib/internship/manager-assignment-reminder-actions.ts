"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { canReadPrivateInternRecord, internshipActorKind, isPortalUserId } from "@/lib/internship/manager-access";
import { safeReminderDayValues } from "@/lib/internship/assignment-reminder-rules";
import { findInternById } from "@/lib/internship/queries";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { parseMicrosoftPlannerTaskUrl } from "@/lib/microsoft/planner-link";
import { listAssignmentIntegrations, upsertAssignmentIntegration } from "@/lib/microsoft/assignment-integrations";

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

/** Connect an existing task while an administrator sets up the Planner Graph permissions. */
export async function linkManagerPlannerTask(formData: FormData) {
  const id = String(formData.get("assignmentId") || "").trim();
  if (!isPortalUserId(id)) redirect("/manager/assignments");
  const actor = await getAdminIdentity();
  if (!actor) redirect("/manager/assignments");
  const kind = internshipActorKind({ role: actor.role, isSuperUser: actor.isSuperUser });
  if (kind !== "manager" && kind !== "supervisor") bounce(id, "error", "Manager access is required.");

  const { data: task } = await supabaseAdmin.from("internship_tasks")
    .select("id,intern_id,status").eq("id", id).maybeSingle();
  if (!task || task.status === "draft") bounce(id, "error", "Publish the assignment before linking a Planner task.");
  const intern = await findInternById(String(task.intern_id));
  if (!intern || !canReadPrivateInternRecord({
    actor: kind, actorUserId: actor.id, targetInternId: intern.id, managerUserId: intern.managerUserId,
  })) bounce(id, "error", "That assignment is not on your team.");

  const existing = (await listAssignmentIntegrations([id])).find((item) => item.provider === "planner");
  const clear = formData.get("intent") === "clear";
  if (existing?.status === "connected") {
    bounce(id, "error", "This assignment already has an API-verified Planner task. Open that task instead.");
  }
  if (clear) {
    if (existing?.status === "linked_manually") {
      const ok = await upsertAssignmentIntegration({
        assignmentId: id, provider: "planner", status: "not_configured", externalId: "", externalUrl: "",
        metadata: { clearedAt: new Date().toISOString(), clearedBy: actor.id },
      });
      if (!ok) bounce(id, "error", "Could not unlink the Planner task.");
    }
    revalidatePath(`/manager/assignments/${id}`);
    revalidatePath("/manager/assignments");
    bounce(id, "ok", "Manual Planner link removed. The task itself was not deleted.");
  }

  const checked = parseMicrosoftPlannerTaskUrl(formData.get("plannerTaskUrl"));
  if (!checked.ok) bounce(id, "error", checked.reason);
  const saved = await upsertAssignmentIntegration({
    assignmentId: id, provider: "planner", status: "linked_manually",
    externalId: checked.taskId, externalUrl: checked.url,
    metadata: { verified: false, linkedBy: actor.id, linkedAt: new Date().toISOString(), taskSource: "manager_manual" },
  });
  if (!saved) bounce(id, "error", "SitGuru could not save the Planner task link.");

  revalidatePath(`/manager/assignments/${id}`);
  revalidatePath("/manager/assignments");
  revalidatePath("/intern/assignments");
  bounce(id, "ok", "Planner task linked. Microsoft assignment and notification settings have not yet been verified.");
}
