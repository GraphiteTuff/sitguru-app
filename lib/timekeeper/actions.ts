"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { isGrowthOnlyRole } from "@/lib/admin/growth-paths";
import {
  canReadPrivateInternRecord,
  canReviewRoutineWork,
  internshipActorKind,
} from "@/lib/internship/manager-access";
import { findInternByAccount, findInternById } from "@/lib/internship/queries";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  approvedHours,
  createAdjustment,
  durationFromRange,
  lockedAfterApproval,
  nextWeeklyTransition,
  semesterOverage,
  canUserApproveOwnTime,
  validateManualHours,
} from "@/lib/timekeeper/domain";

function field(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function bounce(path: string, kind: "ok" | "error", message: string): never {
  const [base, query] = path.split("?");
  const params = new URLSearchParams(query || "");
  params.set(kind, message);
  redirect(`${base}?${params.toString()}`);
}

async function actor() {
  const admin = await getAdminIdentity();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = admin?.id || user?.id || "";
  const email = admin?.email || user?.email || "";
  const intern = userId ? await findInternByAccount({ userId, email }) : null;
  const kind = internshipActorKind({
    role: admin?.role,
    isSuperUser: admin?.isSuperUser,
    isIntern: Boolean(intern),
  });
  return {
    userId,
    email,
    kind,
    internId: intern?.id || null,
    growth: Boolean(admin && isGrowthOnlyRole(admin.role)),
    founder: kind === "supervisor",
  };
}

function refresh() {
  revalidatePath("/intern/time");
  revalidatePath("/admin/growth/time");
  revalidatePath("/admin/internship/time");
  revalidatePath("/intern/manage");
}

async function audit(input: {
  targetId: string;
  actorId: string;
  role: string;
  previous: string;
  next: string;
  note?: string;
}) {
  await supabaseAdmin.from("timekeeper_audit").insert({
    target_type: "entry",
    target_id: input.targetId,
    actor_id: input.actorId || null,
    actor_role: input.role,
    previous_status: input.previous,
    new_status: input.next,
    note: input.note || "",
  });
}

export async function startWorkTimer(formData: FormData) {
  const who = await actor();
  if (!who.userId) bounce(field(formData, "returnTo") || "/intern/time", "error", "Sign in to start the timer.");
  const { data: running } = await supabaseAdmin
    .from("timekeeper_entries")
    .select("id")
    .eq("owner_user_id", who.userId)
    .eq("timer_active", true)
    .maybeSingle();
  if (running?.id) bounce(field(formData, "returnTo") || "/intern/time", "error", "Stop the timer that is already running.");
  const today = new Date();
  const workedOn = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const { error } = await supabaseAdmin.from("timekeeper_entries").insert({
    owner_user_id: who.userId,
    intern_id: who.growth ? null : who.internId,
    subject_kind: who.growth || who.founder ? "contractor" : "intern",
    entry_mode: "timer",
    worked_on: workedOn,
    started_at: new Date().toISOString(),
    duration_hours: 0,
    category_slug: field(formData, "category"),
    description: field(formData, "description"),
    status: "running",
    timer_active: true,
  });
  if (error) bounce(field(formData, "returnTo") || "/intern/time", "error", "The timer could not start.");
  refresh();
  bounce(field(formData, "returnTo") || "/intern/time", "ok", "Work timer started.");
}

export async function stopWorkTimer(formData: FormData) {
  const who = await actor();
  const back = field(formData, "returnTo") || "/intern/time";
  const { data: row } = await supabaseAdmin
    .from("timekeeper_entries")
    .select("id,started_at,status")
    .eq("owner_user_id", who.userId)
    .eq("timer_active", true)
    .maybeSingle();
  if (!row?.id || !row.started_at) bounce(back, "error", "No timer is running.");
  const ended = new Date().toISOString();
  const duration = durationFromRange(String(row.started_at), ended);
  const hours = duration.ok ? { ok: true as const, hours: duration.hours } : validateManualHours(field(formData, "hours"));
  if (!hours.ok) bounce(back, "error", "This timer is over 14 hours. Enter the hours to keep, up to 14, and add another entry for the rest.");
  await supabaseAdmin.from("timekeeper_entries").update({
    ended_at: ended,
    duration_hours: hours.hours,
    timer_active: false,
    status: "draft",
    updated_at: ended,
  }).eq("id", row.id);
  await audit({ targetId: String(row.id), actorId: who.userId, role: who.kind, previous: "running", next: "draft" });
  refresh();
  bounce(back, "ok", "Timer stopped. The time is a draft.");
}

export async function saveManualTime(formData: FormData) {
  const who = await actor();
  const back = field(formData, "returnTo") || "/intern/time";
  if (!who.userId) bounce(back, "error", "Sign in to record time.");
  const hours = validateManualHours(field(formData, "hours"));
  if (!hours.ok) bounce(back, "error", hours.error);
  const workedOn = field(formData, "workedOn");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(workedOn)) bounce(back, "error", "Choose the day you did the work.");
  const description = field(formData, "description");
  if (description.length < 3) bounce(back, "error", "Describe the work in a few words.");
  const { error } = await supabaseAdmin.from("timekeeper_entries").insert({
    owner_user_id: who.userId,
    intern_id: who.growth ? null : who.internId,
    subject_kind: who.growth || who.founder ? "contractor" : "intern",
    entry_mode: "manual",
    worked_on: workedOn,
    duration_hours: hours.hours,
    category_slug: field(formData, "category"),
    description,
    project_ref: field(formData, "projectRef"),
    planner_ref: field(formData, "plannerRef"),
    notes: field(formData, "notes"),
    status: "draft",
    week_number: Number(field(formData, "weekNumber") || 0) || null,
  });
  if (error) bounce(back, "error", "That time could not be saved.");
  refresh();
  bounce(back, "ok", "Draft time saved.");
}

export async function submitInternWeek(formData: FormData) {
  const who = await actor();
  if (!who.internId || who.kind !== "intern") bounce("/intern/time", "error", "Only the intern can submit this week.");
  if (canUserApproveOwnTime()) bounce("/intern/time", "error", "You cannot approve your own hours.");
  const weekNumber = Number(field(formData, "weekNumber") || 0);
  const { data: entries } = await supabaseAdmin
    .from("timekeeper_entries")
    .select("id,duration_hours,status")
    .eq("intern_id", who.internId)
    .eq("week_number", weekNumber);
  const drafts = (entries || []).filter((row) => ["draft", "returned"].includes(String(row.status)));
  if (!drafts.length) bounce("/intern/time", "error", "There is no draft time to submit for this week.");
  const now = new Date().toISOString();
  await supabaseAdmin.from("timekeeper_entries").update({ status: "submitted", submitted_at: now, updated_at: now }).eq("intern_id", who.internId).eq("week_number", weekNumber).in("status", ["draft", "returned"]);
  await supabaseAdmin.from("timekeeper_weeks").upsert({
    intern_id: who.internId,
    week_number: weekNumber,
    status: "submitted",
    reflection: field(formData, "reflection"),
    submitted_at: now,
    updated_at: now,
  }, { onConflict: "intern_id,week_number" });
  refresh();
  bounce("/intern/time", "ok", "Week submitted to your manager.");
}

export async function reviewInternWeek(formData: FormData) {
  const who = await actor();
  const back = "/intern/manage";
  if (!canReviewRoutineWork(who.kind === "supervisor" ? "supervisor" : who.kind === "manager" ? "manager" : "none")) {
    bounce(back, "error", "Manager review is required.");
  }
  const intern = await findInternById(field(formData, "internId"));
  if (!intern || !canReadPrivateInternRecord({
    actor: who.kind,
    actorUserId: who.userId,
    targetInternId: intern.id,
    managerUserId: intern.managerUserId,
  })) bounce(back, "error", "That intern is not on your team.");
  const action = field(formData, "action") === "return" ? "return" : "recommend";
  const { data: week } = await supabaseAdmin.from("timekeeper_weeks").select("id,status").eq("intern_id", intern.id).eq("week_number", Number(field(formData, "weekNumber"))).maybeSingle();
  const next = nextWeeklyTransition({
    status: String(week?.status || "submitted"),
    action,
    actor: who.kind === "supervisor" ? "supervisor" : "manager",
  });
  if (!next.ok) bounce(back, "error", next.error);
  const now = new Date().toISOString();
  await supabaseAdmin.from("timekeeper_weeks").update({
    status: next.status,
    manager_note: field(formData, "note"),
    recommended_at: action === "recommend" ? now : null,
    updated_at: now,
  }).eq("id", week?.id || "");
  await supabaseAdmin.from("timekeeper_entries").update({ status: next.status, updated_at: now }).eq("intern_id", intern.id).eq("week_number", Number(field(formData, "weekNumber"))).eq("status", "submitted");
  refresh();
  bounce(back, "ok", action === "return" ? "Week sent back for correction." : "Recommended for founder approval.");
}

export async function founderApproveWeeks(formData: FormData) {
  const who = await actor();
  if (!who.founder) bounce("/admin/internship/time", "error", "Only the founder can approve official hours.");
  const ids = field(formData, "weekIds").split(",").map((id) => id.trim()).filter(Boolean);
  const exception = field(formData, "exception");
  let approved = 0;
  let skipped = 0;
  for (const id of ids) {
    const { data: week } = await supabaseAdmin.from("timekeeper_weeks").select("id,intern_id,week_number,status").eq("id", id).maybeSingle();
    if (!week || week.status !== "manager_recommended") {
      skipped += 1;
      continue;
    }
    const intern = await findInternById(String(week.intern_id));
    const { data: prior } = await supabaseAdmin.from("timekeeper_entries").select("duration_hours,status").eq("intern_id", week.intern_id);
    const official = approvedHours((prior || []).map((row) => ({ hours: Number(row.duration_hours || 0), status: String(row.status) })));
    const { data: weekEntries } = await supabaseAdmin.from("timekeeper_entries").select("duration_hours").eq("intern_id", week.intern_id).eq("week_number", week.week_number).eq("status", "manager_recommended");
    const additional = (weekEntries || []).reduce((sum, row) => sum + Number(row.duration_hours || 0), 0);
    const required = Number(intern?.requiredHours || 0);
    const over = required > 0 && semesterOverage({ approvedHours: official, additionalHours: additional, requiredHours: required }).exceeds;
    if (over && exception.length < 8) {
      skipped += 1;
      continue;
    }
    const now = new Date().toISOString();
    await supabaseAdmin.from("timekeeper_weeks").update({ status: "founder_approved", founder_note: exception, approved_at: now, updated_at: now }).eq("id", id);
    await supabaseAdmin.from("timekeeper_entries").update({ status: "founder_approved", updated_at: now }).eq("intern_id", week.intern_id).eq("week_number", week.week_number).eq("status", "manager_recommended");
    await audit({ targetId: id, actorId: who.userId, role: "supervisor", previous: "manager_recommended", next: "founder_approved", note: exception });
    approved += 1;
  }
  refresh();
  bounce("/admin/internship/time", "ok", `${approved} week${approved === 1 ? "" : "s"} approved.${skipped ? ` ${skipped} still need a decision.` : ""}`);
}

export async function requestTimeAdjustment(formData: FormData) {
  const who = await actor();
  const back = field(formData, "returnTo") || "/admin/internship/time";
  if (!who.founder) bounce(back, "error", "Only the founder can record an adjustment.");
  const { data: entry } = await supabaseAdmin.from("timekeeper_entries").select("id,duration_hours,status").eq("id", field(formData, "entryId")).maybeSingle();
  if (!entry || !lockedAfterApproval(String(entry.status))) bounce(back, "error", "Only approved time needs a formal adjustment.");
  const proposed = validateManualHours(field(formData, "hours"));
  if (!proposed.ok) bounce(back, "error", proposed.error);
  const adjustment = createAdjustment({
    originalHours: Number(entry.duration_hours || 0),
    proposedHours: proposed.hours,
    reason: field(formData, "reason"),
  });
  await supabaseAdmin.from("timekeeper_adjustments").insert({
    entry_id: entry.id,
    original_hours: adjustment.originalHours,
    proposed_hours: adjustment.proposedHours,
    reason: adjustment.reason,
    requester_id: who.userId,
    approver_id: who.userId,
    status: "approved",
    approved_at: new Date().toISOString(),
  });
  await supabaseAdmin.from("timekeeper_entries").update({ duration_hours: proposed.hours, updated_at: new Date().toISOString() }).eq("id", entry.id);
  await audit({ targetId: String(entry.id), actorId: who.userId, role: "supervisor", previous: String(entry.duration_hours), next: String(proposed.hours), note: adjustment.reason });
  refresh();
  bounce(back, "ok", "Adjustment saved. The original hours stay in the audit history.");
}
